/**
 * CAA（Certification Authority Authorization，RFC 8659 / RFC 8658）资源记录
 * 生成、解析与校验纯函数，零依赖。
 *
 * 区域文件行形如：
 *   example.com.  CAA 0 issue "letsencrypt.org"
 *   example.com.  CAA 128 issuewild "ca.example.net; accounturi=https://acme.example/a"
 * 标签（tag）取值 issue / issuewild / iodef；issue/issuewild 的 value 内可带
 * 分号分隔的参数（accounturi / validationmethods 等，RFC 8658）；iodef 的 value
 * 为 mailto: 或 http(s) URL（RFC 6844/8659）。
 */

/** CAA 标签类型 */
export type CaaTag = 'issue' | 'issuewild' | 'iodef';

/** 一条 CAA 记录的结构化表示 */
export interface CaaRecord {
  /** flags 字段，当前仅定义 bit 0（critical，128），合法值 0 / 128 */
  flags: number;
  tag: CaaTag;
  /** 标签值：issue/issuewild 为 CA 域名（可空串表示禁用）或带参数串；iodef 为 URI */
  value: string;
}

/** 生成器单条输入（表单行） */
export interface CaaFormEntry {
  /** 是否置 critical（flag 128） */
  critical: boolean;
  tag: CaaTag;
  /** CA 域名（issue/issuewild）；留空且 disable=true 时输出空 value 表示禁用该类签发 */
  caDomain: string;
  /** RFC 8658 accounturi 参数（仅 issue/issuewild），留空不输出 */
  accountUri: string;
  /** RFC 8658 validationmethods 参数（仅 issue/issuewild），留空不输出 */
  validationMethods: string;
  /** iodef 上报地址（仅 iodef），mailto: 或 http(s) URL */
  iodefUrl: string;
  /** issue/issuewild 勾选后输出 value 为空串的禁用记录（0 issue ";"） */
  disable: boolean;
}

/** 生成器整体输入 */
export interface CaaGenerateInput {
  /** 记录所属域名，如 example.com */
  domain: string;
  /** TTL（秒），区域文件展示用；null 不输出 TTL 字段 */
  ttl: number | null;
  entries: CaaFormEntry[];
}

export interface CaaGenerateResult {
  /** 可直接粘贴到区域文件的多行文本（无错误时给出） */
  zoneText: string;
  /** 逐条记录的规范字符串列表 */
  records: string[];
  errors: string[];
  warnings: string[];
}

/** 解析后的单条记录（含原始定位信息） */
export interface ParsedCaaRecord extends CaaRecord {
  /** 原始行号（1-based） */
  line: number;
  /** 解析出的 issue/issuewild 参数（iodef 为空映射） */
  parameters: Map<string, string>;
}

export interface CaaValidationResult {
  records: ParsedCaaRecord[];
  errors: string[];
  warnings: string[];
}

const DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const TAGS: readonly CaaTag[] = ['issue', 'issuewild', 'iodef'];
/** RFC 8659 §4.2 定义的正式参数名 */
const KNOWN_PARAMETERS = new Set(['accounturi', 'validationmethods']);
/** RFC 8659 允许的校验方法名（RFC 8555 挑战名 + tls-alpn-01） */
const KNOWN_VALIDATION_METHODS = new Set(['dns-01', 'http-01', 'tls-alpn-01']);

/** 按 RFC 1035 把长字符串切为 255 字符分段，每段用双引号包裹 */
export function splitQuotedChunks(value: string): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += 255) {
    chunks.push(`"${value.slice(index, index + 255)}"`);
  }
  return chunks.length > 0 ? chunks : ['""'];
}

/**
 * 把 issue/issuewild 的 CA 域名与参数拼装为标签值。
 * 形如 `ca.example.net; accounturi=https://x; validationmethods=dns-01`
 */
function buildIssueValue(entry: CaaFormEntry, errors: string[]): string {
  if (entry.tag === 'iodef') {
    return '';
  }
  if (entry.disable) {
    // 空 value：0 issue ";" 语义为禁用该类签发
    return ';';
  }
  const ca = entry.caDomain.trim().toLowerCase();
  if (!ca) {
    errors.push(`${entry.tag} 记录缺少 CA 域名（或勾选禁用以生成空 value 记录）`);
    return '';
  }
  if (!DOMAIN_REGEX.test(ca)) {
    errors.push(`${entry.tag} 的 CA 域名「${ca}」不是合法域名`);
  }
  const params: string[] = [];
  if (entry.accountUri.trim()) {
    const uri = entry.accountUri.trim();
    if (!/^https?:\/\/\S+$/i.test(uri)) {
      errors.push(`${entry.tag} 的 accounturi「${uri}」必须是 http(s) URL`);
    }
    params.push(`accounturi=${uri}`);
  }
  if (entry.validationMethods.trim()) {
    const methods = entry.validationMethods
      .split(';')
      .map((each) => each.trim())
      .filter(Boolean);
    const bad = methods.filter((method) => !KNOWN_VALIDATION_METHODS.has(method));
    if (bad.length > 0) {
      errors.push(`${entry.tag} 的 validationmethods 含未知方法「${bad.join(' ')}」`);
    }
    if (methods.length > 0) {
      params.push(`validationmethods=${[...new Set(methods)].join(';')}`);
    }
  }
  return params.length > 0 ? `${ca}; ${params.join('; ')}` : ca;
}

function buildIodefValue(entry: CaaFormEntry, errors: string[]): string {
  const url = entry.iodefUrl.trim();
  if (!url) {
    errors.push('iodef 记录缺少上报地址（mailto: 邮箱或 http(s) URL）');
    return '';
  }
  const isMailto = /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(url);
  const isHttp = /^https?:\/\/\S+$/i.test(url);
  if (!isMailto && !isHttp) {
    errors.push(`iodef 地址「${url}」必须是 mailto:name@domain 或 http(s) URL`);
  }
  return url;
}

/**
 * 由结构化表单生成 CAA 区域文件文本。
 *
 * @param input - 域名、TTL 与记录条目
 * @returns 区域文件文本、规范记录行与错误 / 警告
 */
export function generateCaaRecords(input: CaaGenerateInput): CaaGenerateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const domain = input.domain.trim().toLowerCase();

  if (!domain) {
    errors.push('域名（domain）不能为空');
  } else if (!DOMAIN_REGEX.test(domain)) {
    errors.push(`域名「${domain}」不是合法域名`);
  }
  if (input.ttl !== null && (!Number.isInteger(input.ttl) || input.ttl <= 0 || input.ttl > 2147483647)) {
    errors.push(`TTL 必须是 1–2147483647 的正整数秒，当前为 ${input.ttl}`);
  }
  if (input.entries.length === 0) {
    errors.push('至少需要一条 CAA 记录');
  }

  const records: string[] = [];
  const tagKinds = new Set<CaaTag>();
  for (const entry of input.entries) {
    if (!TAGS.includes(entry.tag)) {
      errors.push(`未知标签「${entry.tag}」，允许 issue / issuewild / iodef`);
      continue;
    }
    tagKinds.add(entry.tag);
    const flags = entry.critical ? 128 : 0;
    const value = entry.tag === 'iodef' ? buildIodefValue(entry, errors) : buildIssueValue(entry, errors);
    if (errors.length > 0 && (entry.tag === 'iodef' ? value === '' : value === '' && !entry.disable)) {
      continue;
    }
    records.push(`${flags} ${entry.tag} "${value}"`);
  }

  if (tagKinds.has('issuewild') && !tagKinds.has('issue')) {
    warnings.push('仅配置 issuewild 而无 issue：非通配符证书签发不受任何 CAA 限制，建议同时配置 issue');
  }
  if (!tagKinds.has('issue') && !tagKinds.has('issuewild')) {
    warnings.push('未配置任何 issue / issuewild 授权，CAA 仅含 iodef 时不会限制 CA 签发');
  }
  const criticalCount = input.entries.filter((entry) => entry.critical).length;
  if (criticalCount > 0) {
    warnings.push(
      `含 ${criticalCount} 条 critical（flag 128）记录：不识别该标签的 CA 必须拒绝签发，发布前确认解析链路支持`,
    );
  }

  const owner = domain ? `${domain}.` : '';
  const ttlPart = input.ttl !== null ? ` ${input.ttl}` : '';
  const zoneText =
    errors.length === 0
      ? records.map((record) => `${owner}${ttlPart} CAA ${record}`).join('\n')
      : '';
  return { zoneText, records: errors.length === 0 ? records : [], errors, warnings };
}

/**
 * 解析一条 CAA 记录的右侧内容（flags tag "value"），容忍外层引号与多余空白。
 *
 * @throws 结构不合法时抛出带定位的错误
 */
function parseRecordBody(body: string, line: number): ParsedCaaRecord {
  const text = body.trim();
  const flagMatch = /^(\d+)\s+([a-z]+)\s+"([^"]*)"\s*$/i.exec(text);
  if (!flagMatch) {
    throw new Error(`第 ${line} 行不符合 'flags tag "value"' 结构：${text || '(空行)'}`);
  }
  const flags = Number(flagMatch[1]);
  const tag = flagMatch[2]!.toLowerCase() as CaaTag;
  const value = flagMatch[3]!;
  if (!TAGS.includes(tag)) {
    throw new Error(`第 ${line} 行标签「${flagMatch[2]}」非法，允许 issue / issuewild / iodef`);
  }
  if (flags !== 0 && flags !== 128) {
    throw new Error(`第 ${line} 行 flags=${flags} 非法，RFC 8659 仅定义 0 与 128（critical）`);
  }
  const parameters = new Map<string, string>();
  if (tag === 'issue' || tag === 'issuewild') {
    const segments = value.split(';').map((each) => each.trim());
    const caDomain = segments[0]!;
    if (caDomain && !DOMAIN_REGEX.test(caDomain)) {
      throw new Error(`第 ${line} 行 ${tag} 的 CA 域名「${caDomain}」不是合法域名`);
    }
    for (const segment of segments.slice(1)) {
      if (!segment) {
        continue;
      }
      const eq = segment.indexOf('=');
      if (eq <= 0) {
        throw new Error(`第 ${line} 行参数「${segment}」不是 key=value 形式`);
      }
      parameters.set(segment.slice(0, eq).trim().toLowerCase(), segment.slice(eq + 1).trim());
    }
  }
  return { flags, tag, value, line, parameters };
}

/**
 * 校验粘贴的 CAA 区域记录（支持多行，可带域名/TTL 前缀，也可只粘 flags tag "value"）。
 *
 * @param raw - 区域文件片段
 * @returns 结构化记录、错误与警告
 */
export function validateCaaRecords(raw: string): CaaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const records: ParsedCaaRecord[] = [];
  const lines = raw.split(/\r?\n/);

  lines.forEach((original, index) => {
    const line = index + 1;
    const trimmed = original.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      return;
    }
    // 剥掉域名与可选 TTL、IN、类前缀，定位到 CAA 之后的内容
    const caaMatch = /\bCAA\b\s+(.+)$/i.exec(trimmed);
    const body = caaMatch ? caaMatch[1]! : trimmed;
    let parsed: ParsedCaaRecord;
    try {
      parsed = parseRecordBody(body, line);
    } catch (caught) {
      errors.push(caught instanceof Error ? caught.message : `第 ${line} 行解析失败`);
      return;
    }
    if (parsed.tag === 'iodef') {
      const isMailto = /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(parsed.value);
      const isHttp = /^https?:\/\/\S+$/i.test(parsed.value);
      if (!isMailto && !isHttp) {
        errors.push(`第 ${line} 行 iodef 值「${parsed.value}」必须是 mailto: 或 http(s) URI`);
      }
    } else {
      for (const [key, val] of parsed.parameters) {
        if (!KNOWN_PARAMETERS.has(key)) {
          warnings.push(`第 ${line} 行含未知参数 ${key}=，RFC 8658 正式参数为 accounturi / validationmethods`);
        }
        if (key === 'accounturi' && !/^https?:\/\/\S+$/i.test(val)) {
          errors.push(`第 ${line} 行 accounturi「${val}」必须是 http(s) URL`);
        }
        if (key === 'validationmethods') {
          const bad = val
            .split(';')
            .map((each) => each.trim())
            .filter((method) => method && !KNOWN_VALIDATION_METHODS.has(method));
          if (bad.length > 0) {
            errors.push(`第 ${line} 行 validationmethods 含未知方法「${bad.join(' ')}」`);
          }
        }
      }
    }
    records.push(parsed);
  });

  if (records.length === 0 && errors.length === 0) {
    errors.push('未解析到任何 CAA 记录');
  }
  const tags = new Set(records.map((record) => record.tag));
  if (tags.has('issuewild') && !tags.has('issue')) {
    warnings.push('仅含 issuewild 无 issue：通配符之外的证书签发不受限');
  }
  return { records, errors, warnings };
}

/** 一组合理的默认表单输入，便于 UI 初始化 */
export function createDefaultInput(): CaaGenerateInput {
  return {
    domain: 'example.com',
    ttl: 3600,
    entries: [
      {
        critical: false,
        tag: 'issue',
        caDomain: 'letsencrypt.org',
        accountUri: '',
        validationMethods: '',
        iodefUrl: '',
        disable: false,
      },
      {
        critical: false,
        tag: 'iodef',
        caDomain: '',
        accountUri: '',
        validationMethods: '',
        iodefUrl: 'mailto:security@example.com',
        disable: false,
      },
    ],
  };
}
