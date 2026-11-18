/**
 * MTA-STS（RFC 8461）与 TLS-RPT（RFC 8460）记录生成与解析纯函数。
 *
 * MTA-STS 由两部分组成：
 *   1. DNS TXT 记录 `_mta-sts.<域>`：`v=STSv1; id=<id>`，宣告策略版本；
 *   2. HTTPS 策略文件 `https://mta-sts.<域>/.well-known/mta-sts.txt`，
 *      限定 MX 主机名后缀与最低 TLS 版本，max_age 单位为秒。
 * TLS-RPT 通过 DNS TXT 记录 `_smtp._tls.<域>` 声明聚合报告接收方式：
 *   `v=TLSRPTv1; rua=mailto:<邮箱>` 或 `...; rua=https://<端点>`。
 *
 * 全部为字符串拼装与字段校验的零依赖纯函数，不触碰 DOM / React。
 */

/** MTA-STS 策略模式 */
export type MtaStsMode = 'enforce' | 'testing' | 'none';

/** MTA-STS 策略文件入参 */
export interface MtaStsPolicyInput {
  /** 策略模式，RFC 8461 §5 仅允许 enforce / testing / none */
  mode: MtaStsMode;
  /** 策略生效时长（秒），RFC 要求为非负整数，enforce/testing 下必须 > 0 */
  maxAge: number;
  /** 允许的 MX 主机名后缀白名单，至少一条（none 模式可为空） */
  allowedMx: string[];
}

/** TLS-RPT 报告接收端点 */
export type TlsRptEndpoint =
  | { kind: 'mailto'; address: string }
  | { kind: 'https'; url: string };

/** TLS-RPT 记录入参 */
export interface TlsRptInput {
  /** rua 端点集合，RFC 允许 0–2 个 */
  endpoints: TlsRptEndpoint[];
}

/** DNS 记录的通用表达 */
export interface DnsRecord {
  /** 记录所属主机名 */
  host: string;
  /** 记录类型，本工具只产出 TXT */
  type: 'TXT';
  /** 记录值 */
  value: string;
}

/** MTA-STS 全套生成结果 */
export interface MtaStsBundle {
  /** 策略 ID（UTC 时间戳数字串，符合 RFC 的可见字符要求） */
  policyId: string;
  /** `_mta-sts` TXT 记录 */
  dnsRecord: DnsRecord;
  /** 策略文件主机名 */
  policyHost: string;
  /** 策略文件发布 URL */
  policyUrl: string;
  /** mta-sts.txt 文件正文 */
  policyText: string;
}

/** TLS-RPT 生成结果 */
export interface TlsRptBundle {
  /** `_smtp._tls` TXT 记录 */
  dnsRecord: DnsRecord;
  /** 记录原始值（便于复制） */
  recordValue: string;
}

/** 域名合法性（粗略但覆盖常见错误，RFC 1035 风格标签） */
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/** 邮箱合法性（RFC 5321 简化版） */
const EMAIL_PATTERN = /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/** 规范化域名：去空白、转小写、去尾部点 */
export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, '');
}

/** 校验域名并在非法时抛错 */
export function assertDomain(raw: string, label = '域名'): string {
  const domain = normalizeDomain(raw);
  if (domain === '') {
    throw new Error(`${label}不能为空`);
  }
  if (domain.length > 253 || !DOMAIN_PATTERN.test(domain)) {
    throw new Error(`${label}「${raw}」不是合法的域名`);
  }
  return domain;
}

/** 校验 MX 主机名后缀；允许通配前缀 `*.example.com` */
export function normalizeMxPattern(raw: string): string {
  const pattern = raw.trim().toLowerCase().replace(/\.$/, '');
  if (pattern === '') {
    throw new Error('MX 主机名不能为空');
  }
  const body = pattern.startsWith('*.') ? pattern.slice(2) : pattern;
  if (!DOMAIN_PATTERN.test(body)) {
    throw new Error(`MX 主机名「${raw}」不是合法的域名或通配后缀`);
  }
  return pattern;
}

/** 生成 MTA-STS 策略 ID：UTC 年月日时分秒数字串，满足 id 的可见字符约束 */
export function buildPolicyId(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
}

/**
 * 生成 MTA-STS 全套产物：DNS TXT 记录 + mta-sts.txt 策略文件。
 *
 * @param domain 邮件域名（如 example.com）
 * @param input  策略模式、max_age 与 MX 白名单
 * @param now    可选时间源，便于测试
 */
export function generateMtaSts(domain: string, input: MtaStsPolicyInput, now: Date = new Date()): MtaStsBundle {
  const normalizedDomain = assertDomain(domain);
  const mode = input.mode;
  if (!['enforce', 'testing', 'none'].includes(mode)) {
    throw new Error(`未知的 MTA-STS 模式「${mode}」`);
  }
  if (!Number.isInteger(input.maxAge) || input.maxAge < 0) {
    throw new Error('max_age 必须为非负整数（秒）');
  }
  if (mode !== 'none' && input.maxAge === 0) {
    throw new Error(`${mode} 模式下 max_age 必须大于 0`);
  }
  const mxPatterns = [...new Set(input.allowedMx.map((item) => normalizeMxPattern(item)))];
  if (mode !== 'none' && mxPatterns.length === 0) {
    throw new Error(`${mode} 模式至少需要一条 MX 主机名后缀`);
  }

  const policyLines = ['version: STSv1', `mode: ${mode}`, `max_age: ${input.maxAge}`];
  for (const pattern of mxPatterns) {
    policyLines.push(`mx: ${pattern}`);
  }
  const policyText = `${policyLines.join('\n')}\n`;

  const policyId = buildPolicyId(now);
  const dnsValue = `v=STSv1; id=${policyId}`;
  const policyHost = `mta-sts.${normalizedDomain}`;

  return {
    policyId,
    dnsRecord: {
      host: `_mta-sts.${normalizedDomain}`,
      type: 'TXT',
      value: dnsValue,
    },
    policyHost,
    policyUrl: `https://${policyHost}/.well-known/mta-sts.txt`,
    policyText,
  };
}

/** 校验 TLS-RPT 端点并规范化 */
function normalizeEndpoint(endpoint: TlsRptEndpoint): TlsRptEndpoint {
  if (endpoint.kind === 'mailto') {
    const address = endpoint.address.trim();
    if (!EMAIL_PATTERN.test(address)) {
      throw new Error(`报告邮箱「${endpoint.address}」不是合法的邮箱地址`);
    }
    return { kind: 'mailto', address };
  }
  const url = endpoint.url.trim();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`报告端点「${url}」不是合法 URL`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('TLS-RPT 的 HTTPS 端点必须使用 https:// 协议');
  }
  return { kind: 'https', url: parsed.toString() };
}

/**
 * 生成 TLS-RPT TXT 记录（RFC 8460 §3）。
 *
 * @param domain 邮件域名
 * @param input  rua 端点集合（0–2 个；为空表示不接收报告，仅产出 v= 声明）
 */
export function generateTlsRpt(domain: string, input: TlsRptInput): TlsRptBundle {
  const normalizedDomain = assertDomain(domain);
  if (input.endpoints.length > 2) {
    throw new Error('TLS-RPT 最多声明 2 个 rua 端点');
  }
  const normalized = input.endpoints.map(normalizeEndpoint);
  const rua = normalized
    .map((endpoint) => (endpoint.kind === 'mailto' ? `mailto:${endpoint.address}` : endpoint.url))
    .join(',');
  const value = rua === '' ? 'v=TLSRPTv1;' : `v=TLSRPTv1; rua=${rua}`;

  return {
    dnsRecord: {
      host: `_smtp._tls.${normalizedDomain}`,
      type: 'TXT',
      value,
    },
    recordValue: value,
  };
}

/** MTA-STS TXT 记录解析结果 */
export interface ParsedMtaStsRecord {
  version: string;
  id: string;
}

/** 解析 `_mta-sts` TXT 记录，校验 version 与必填 id */
export function parseMtaStsRecord(raw: string): ParsedMtaStsRecord {
  const fields = parseSemicolonFields(raw);
  const version = fields.get('v');
  if (version !== 'STSv1') {
    throw new Error(`MTA-STS 记录版本必须为 v=STSv1，实际为「${version ?? '缺失'}」`);
  }
  const id = fields.get('id');
  if (!id) {
    throw new Error('MTA-STS 记录缺少 id 字段');
  }
  return { version, id };
}

/** TLS-RPT TXT 记录解析结果 */
export interface ParsedTlsRptRecord {
  version: string;
  rua: string[];
}

/** 解析 `_smtp._tls` TXT 记录 */
export function parseTlsRptRecord(raw: string): ParsedTlsRptRecord {
  const fields = parseSemicolonFields(raw);
  const version = fields.get('v');
  if (version !== 'TLSRPTv1') {
    throw new Error(`TLS-RPT 记录版本必须为 v=TLSRPTv1，实际为「${version ?? '缺失'}」`);
  }
  const ruaRaw = fields.get('rua');
  return { version, rua: ruaRaw ? ruaRaw.split(',').map((item) => item.trim()).filter(Boolean) : [] };
}

/** 解析 `k=v; k=v` 风格的 DNS TXT 字段为小写键 Map */
function parseSemicolonFields(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of raw.split(';')) {
    const segment = part.trim();
    if (segment === '') {
      continue;
    }
    const equalIndex = segment.indexOf('=');
    if (equalIndex <= 0) {
      throw new Error(`无法解析的字段段「${segment}」，期望 key=value 形式`);
    }
    const key = segment.slice(0, equalIndex).trim().toLowerCase();
    const value = segment.slice(equalIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

/** 解析 mta-sts.txt 策略文件正文，回传结构化字段用于校验展示 */
export interface ParsedMtaStsPolicy {
  version: string;
  mode: MtaStsMode;
  maxAge: number;
  mx: string[];
}

/** 解析策略文件正文并做字段级校验 */
export function parseMtaStsPolicy(raw: string): ParsedMtaStsPolicy {
  const map = new Map<string, string[]>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex <= 0) {
      throw new Error(`无法解析的策略行「${trimmed}」，期望 key: value 形式`);
    }
    const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
    const value = trimmed.slice(colonIndex + 1).trim();
    const bucket = map.get(key) ?? [];
    bucket.push(value);
    map.set(key, bucket);
  }

  const version = map.get('version')?.[0];
  if (version !== 'STSv1') {
    throw new Error(`策略文件 version 必须为 STSv1，实际为「${version ?? '缺失'}」`);
  }
  const mode = map.get('mode')?.[0] as MtaStsMode | undefined;
  if (!mode || !['enforce', 'testing', 'none'].includes(mode)) {
    throw new Error(`策略文件 mode 必须为 enforce / testing / none，实际为「${mode ?? '缺失'}」`);
  }
  const maxAgeRaw = map.get('max_age')?.[0];
  const maxAge = maxAgeRaw === undefined ? Number.NaN : Number(maxAgeRaw);
  if (!Number.isInteger(maxAge) || maxAge < 0) {
    throw new Error(`策略文件 max_age 必须为非负整数，实际为「${maxAgeRaw ?? '缺失'}」`);
  }
  return { version, mode, maxAge, mx: map.get('mx') ?? [] };
}
