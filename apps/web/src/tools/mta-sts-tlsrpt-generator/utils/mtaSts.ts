import { MAX_AGE_LIMIT, STS_VERSION, TLSRPT_VERSION, type StsMode } from '../constants';

/** 生成器输入 */
export interface StsInput {
  domain: string;
  mode: StsMode;
  /** 每行一个 MX 主机名，允许 *. 前缀通配符 */
  mxHostsText: string;
  maxAge: number | null;
  /** MTA-STS TXT 记录的 id 字段 */
  policyId: string;
  /** 每行一个 TLS-RPT rua 端点（mailto: 或 https:） */
  ruaText: string;
}

/** 生成产物 */
export interface StsOutput {
  errors: string[];
  policyFile: string;
  policyUrl: string;
  stsTxtRecord: string;
  tlsrptTxtRecord: string;
}

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** 校验单个主机名；通配符仅允许出现在首标签且写作 *. */
export function validateMxHost(host: string): string | null {
  const value = host.trim().toLowerCase().replace(/\.$/, '');
  if (value === '') {
    return 'MX 主机名不能为空';
  }
  if (value.startsWith('*.')) {
    const rest = value.slice(2);
    const labels = rest.split('.');
    // RFC 8461 §5：通配符必须至少匹配一个子域标签，*.example.com 合法，*.com 不合法
    if (labels.length < 2 || labels.some((label) => !LABEL_RE.test(label))) {
      return `通配符 MX 主机名不合法：${host}（*. 后至少需两级标签）`;
    }
    return null;
  }
  if (!DOMAIN_RE.test(value)) {
    return `MX 主机名格式不合法：${host}`;
  }
  return null;
}

/** 校验 TLS-RPT rua 端点：RFC 8460 仅允许 mailto: 与 https: */
export function validateRuaEndpoint(uri: string): string | null {
  const value = uri.trim();
  if (value === '') {
    return '报告端点不能为空';
  }
  if (value.startsWith('mailto:')) {
    const addr = value.slice('mailto:'.length);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      return `mailto 端点不是合法邮箱：${uri}`;
    }
    return null;
  }
  if (value.startsWith('https://')) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname === '') {
        return `https 端点不合法：${uri}`;
      }
    } catch {
      return `https 端点不合法：${uri}`;
    }
    return null;
  }
  return `报告端点仅支持 mailto: 或 https: 前缀：${uri}`;
}

function splitLines(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/**
 * 生成 MTA-STS 策略文件、策略 URL 与两条 DNS TXT 记录。
 * 错误以字符串数组返回；存在错误时产物仍尽力拼装，便于定位问题。
 */
export function generateStsArtifacts(input: StsInput): StsOutput {
  const errors: string[] = [];
  const domain = input.domain.trim().toLowerCase().replace(/\.$/, '');

  if (!DOMAIN_RE.test(domain)) {
    errors.push(`邮件域格式不合法：${input.domain}`);
  }

  const mxHosts = splitLines(input.mxHostsText);
  if (input.mode !== 'none' && mxHosts.length === 0) {
    errors.push('enforce / testing 模式至少需要一个 mx 主机名');
  }
  for (const host of mxHosts) {
    const hostError = validateMxHost(host);
    if (hostError) {
      errors.push(hostError);
    }
  }

  if (input.maxAge === null || !Number.isFinite(input.maxAge) || input.maxAge < 0) {
    errors.push('max_age 必须为非负整数秒');
  } else if (input.maxAge > MAX_AGE_LIMIT) {
    errors.push(`max_age 超过 RFC 8461 上限 ${MAX_AGE_LIMIT} 秒（约 1 年）`);
  }

  if (input.policyId.trim() === '') {
    errors.push('MTA-STS TXT 记录的 id 不能为空');
  } else if (!/^[A-Za-z0-9]{1,32}$/.test(input.policyId.trim())) {
    errors.push('id 仅允许 1–32 位字母或数字');
  }

  const ruaEndpoints = splitLines(input.ruaText);
  if (ruaEndpoints.length === 0) {
    errors.push('TLS-RPT 至少需要一个 rua 报告端点');
  }
  for (const endpoint of ruaEndpoints) {
    const endpointError = validateRuaEndpoint(endpoint);
    if (endpointError) {
      errors.push(endpointError);
    }
  }

  // RFC 8461 §3.2：字段顺序 version → mode → mx（逐行）→ max_age，CRLF 换行
  const policyLines = [`version: ${STS_VERSION}`, `mode: ${input.mode}`];
  if (input.mode !== 'none') {
    for (const host of mxHosts) {
      policyLines.push(`mx: ${host.trim().toLowerCase().replace(/\.$/, '')}`);
    }
  }
  if (input.maxAge !== null && Number.isFinite(input.maxAge) && input.maxAge >= 0) {
    policyLines.push(`max_age: ${Math.trunc(input.maxAge)}`);
  }
  const policyFile = policyLines.join('\r\n');

  const policyUrl = `https://mta-sts.${domain}/.well-known/mta-sts.txt`;
  const stsTxtRecord = `v=${STS_VERSION}; id=${input.policyId.trim()}`;
  const tlsrptTxtRecord = `v=${TLSRPT_VERSION}; rua=${ruaEndpoints
    .map((endpoint) => endpoint.trim())
    .join(',')}`;

  return {
    errors,
    policyFile,
    policyUrl,
    stsTxtRecord: domain ? `_mta-sts.${domain}  TXT  "${stsTxtRecord}"` : stsTxtRecord,
    tlsrptTxtRecord: domain ? `_smtp._tls.${domain}  TXT  "${tlsrptTxtRecord}"` : tlsrptTxtRecord,
  };
}

/** 反向校验：解析粘贴的策略文件，返回字段级错误（按行号） */
export function validatePolicyFile(raw: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { errors: ['策略文件为空'], warnings };
  }

  const fields = new Map<string, string[]>();
  lines.forEach((line, index) => {
    const match = /^([a-z_]+):\s?(.*)$/.exec(line.trim());
    if (!match) {
      errors.push(`第 ${index + 1} 行无法解析：${line}`);
      return;
    }
    const fieldName = match[1]!;
    const fieldValue = match[2] ?? '';
    const list = fields.get(fieldName) ?? [];
    list.push(fieldValue);
    fields.set(fieldName, list);
  });

  if (fields.get('version')?.[0] !== STS_VERSION) {
    errors.push(`version 必须为 ${STS_VERSION}`);
  }
  const mode = fields.get('mode')?.[0];
  if (!mode || !['enforce', 'testing', 'none'].includes(mode)) {
    errors.push('mode 缺失或非法（仅允许 enforce / testing / none）');
  }
  const mxList = fields.get('mx') ?? [];
  if (mode !== 'none' && mxList.length === 0) {
    errors.push('enforce / testing 模式必须包含至少一条 mx 字段');
  }
  mxList.forEach((host, index) => {
    const hostError = validateMxHost(host);
    if (hostError) {
      errors.push(`第 ${index + 1} 条 mx：${hostError}`);
    }
  });
  const maxAgeRaw = fields.get('max_age')?.[0];
  if (maxAgeRaw === undefined) {
    errors.push('缺少 max_age 字段');
  } else if (!/^\d+$/.test(maxAgeRaw)) {
    errors.push(`max_age 必须为非负整数：${maxAgeRaw}`);
  } else if (Number(maxAgeRaw) > MAX_AGE_LIMIT) {
    errors.push(`max_age 超过上限 ${MAX_AGE_LIMIT} 秒`);
  }

  const expectedOrder = ['version', 'mode', ...mxList.map(() => 'mx'), 'max_age'];
  const actualOrder = lines.map((line) => (line.split(':')[0] ?? '').trim());
  if (actualOrder.some((key, index) => key !== expectedOrder[index])) {
    warnings.push('字段顺序与 RFC 8461 推荐顺序（version → mode → mx → max_age）不一致');
  }

  return { errors, warnings };
}

/** 反向校验：解析粘贴的 TXT 记录值（可含域名前缀与引号） */
export function validateTxtRecord(
  raw: string,
  kind: 'sts' | 'tlsrpt',
): { errors: string[]; parsed: Record<string, string> } {
  const errors: string[] = [];
  const value = raw.replace(/^\S+\s+TXT\s+/i, '').replace(/^["']|["']$/g, '').trim();
  const parts = value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const parsed: Record<string, string> = {};
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq <= 0) {
      errors.push(`无法解析的字段段：${part}`);
      continue;
    }
    parsed[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }

  if (kind === 'sts') {
    if (parsed.v !== STS_VERSION) {
      errors.push(`v 必须为 ${STS_VERSION}`);
    }
    if (!parsed.id) {
      errors.push('缺少 id 字段');
    } else if (!/^[A-Za-z0-9]{1,32}$/.test(parsed.id)) {
      errors.push('id 仅允许 1–32 位字母或数字');
    }
  } else {
    if (parsed.v !== TLSRPT_VERSION) {
      errors.push(`v 必须为 ${TLSRPT_VERSION}`);
    }
    if (!parsed.rua) {
      errors.push('缺少 rua 字段');
    } else {
      for (const endpoint of parsed.rua.split(',').map((item) => item.trim())) {
        const endpointError = validateRuaEndpoint(endpoint);
        if (endpointError) {
          errors.push(endpointError);
        }
      }
    }
  }
  return { errors, parsed };
}
