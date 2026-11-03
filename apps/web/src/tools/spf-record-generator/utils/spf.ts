/**
 * SPF 记录纯函数逻辑：生成、解析、校验与 DNS 查询计数
 * 依据 RFC 7208（https://www.rfc-editor.org/rfc/rfc7208）
 */
import {
  DNS_LOOKUP_MECHANISMS,
  SPF_MAX_DNS_LOOKUPS,
  SPF_MAX_RECORD_LENGTH,
  SPF_VERSION,
} from '../constants';

export interface SpfMechanismInput {
  /** 机制名：a / mx / ptr / ip4 / ip6 / include / exists / all；修饰符 redirect 单独处理 */
  mechanism: string;
  /** 限定符 + - ~ ?（redirect 不使用限定符） */
  qualifier: string;
  /** 域名字段（include/exists/redirect）或 CIDR（ip4/ip6），all 留空 */
  value: string;
}

export interface SpfValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface SpfAnalysis {
  /** 规范化后的记录（单一空格、去首尾空白） */
  normalized: string;
  /** 解析出的机制（含限定符） */
  terms: Array<{ raw: string; mechanism: string; qualifier: string; value: string }>;
  /** 是否含 redirect= 修饰符 */
  hasRedirect: boolean;
  /** 触发 DNS 查询的机制条数（§4.6.4 的 10 次上限口径） */
  dnsLookupCount: number;
  issues: SpfValidationIssue[];
}

const MECHANISM_NAMES = new Set(['all', 'a', 'mx', 'ptr', 'ip4', 'ip6', 'include', 'exists']);
const QUALIFIER_CHARS = new Set(['+', '-', '~', '?']);

/** IPv4 / CIDR 简单格式校验（不做网络可达性判断，仅词法） */
export function isValidIPv4(value: string): boolean {
  const [addr, prefix] = value.split('/');
  if (!addr) return false;
  const parts = addr.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  const octetsOk =
    nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
    /^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(addr);
  if (!octetsOk) return false;
  if (prefix !== undefined) {
    const p = Number(prefix);
    if (!Number.isInteger(p) || p < 0 || p > 32 || String(p) !== prefix) return false;
  }
  return true;
}

/** IPv6 / CIDR 宽松词法校验：支持 :: 压缩，hex 段 0-4 位 */
export function isValidIPv6(value: string): boolean {
  const [addr, prefix] = value.split('/');
  if (!addr) return false;
  if (prefix !== undefined) {
    const p = Number(prefix);
    if (!Number.isInteger(p) || p < 0 || p > 128 || String(p) !== prefix) return false;
  }
  if (!addr.includes(':')) return false;
  if ((addr.match(/::/g) || []).length > 1) return false;

  const [head, tail] = addr.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined ? tail.split(':') : [];
  const groups = addr.includes('::') ? [...headParts, ...tailParts] : headParts;
  if (addr.includes('::') && groups.length > 7) return false;
  if (!addr.includes('::') && groups.length !== 8) return false;
  return groups.every((g) => g === '' || /^[0-9a-fA-F]{1,4}$/.test(g));
}

/** 域名词法校验（不做真实解析） */
export function isValidDomain(value: string): boolean {
  if (value.length === 0 || value.length > 253) return false;
  const labels = value.split('.');
  // 允许尾点（FQDN）；去掉空尾标签后逐段校验
  const labelsToCheck = labels[labels.length - 1] === '' ? labels.slice(0, -1) : labels;
  if (labelsToCheck.length < 2) return false;
  return labelsToCheck.every((label) =>
    // SPF include 目标常见 _spf.xxx 等下划线标签（如 _spf.google.com）
    /^(?=.{1,63}$)_?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?_?$/.test(label),
  );
}

/** 由机制列表拼出 SPF 记录；redirect 作为独立修饰符追加在末尾（且不应与 all 共存） */
export function buildSpfRecord(mechanisms: SpfMechanismInput[]): string {
  const terms: string[] = [SPF_VERSION];
  let redirect = '';
  for (const m of mechanisms) {
    const mechanism = m.mechanism.trim();
    const value = m.value.trim();
    if (mechanism === 'redirect') {
      redirect = `redirect=${value}`;
      continue;
    }
    const qualifier = m.qualifier === '+' ? '' : m.qualifier; // + 是默认限定符，省略更简洁
    if (mechanism === 'all') {
      terms.push(`${qualifier}all`);
    } else if (mechanism === 'a' || mechanism === 'mx' || mechanism === 'ptr') {
      // a/mx/ptr 允许带 :domain，未填域名时作用于当前域
      terms.push(`${qualifier}${mechanism}${value ? `:${value}` : ''}`);
    } else {
      terms.push(`${qualifier}${mechanism}:${value}`);
    }
  }
  if (redirect) terms.push(redirect);
  return terms.join(' ');
}

/** 解析单条 term，如 "-include:example.com"、"ip4:192.0.2.0/24"、"~all"、"redirect=x.com" */
function parseTerm(raw: string): { mechanism: string; qualifier: string; value: string } | null {
  if (raw.startsWith('redirect=')) {
    return { mechanism: 'redirect', qualifier: '', value: raw.slice('redirect='.length) };
  }
  let rest = raw;
  let qualifier = '+';
  const firstChar = rest.charAt(0);
  if (QUALIFIER_CHARS.has(firstChar)) {
    qualifier = firstChar;
    rest = rest.slice(1);
  }
  const colon = rest.indexOf(':');
  if (colon === -1) {
    // all，或不带值的 a / mx / ptr（作用于当前域）
    if (MECHANISM_NAMES.has(rest)) {
      return { mechanism: rest, qualifier, value: '' };
    }
    // a/mx/ptr 可能带 dual-CIDR 如 a/24，这里接受 / 之后的内容
    const slash = rest.indexOf('/');
    if (slash !== -1 && MECHANISM_NAMES.has(rest.slice(0, slash))) {
      return { mechanism: rest.slice(0, slash), qualifier, value: `/${rest.slice(slash + 1)}` };
    }
    return null;
  }
  const mechanism = rest.slice(0, colon);
  const value = rest.slice(colon + 1);
  if (!MECHANISM_NAMES.has(mechanism)) return null;
  return { mechanism, qualifier, value };
}

/** 解析并校验一条 SPF 记录 */
export function analyzeSpfRecord(input: string): SpfAnalysis {
  const issues: SpfValidationIssue[] = [];
  const normalized = input.trim().replace(/\s+/g, ' ');
  const tokens = normalized === '' ? [] : normalized.split(' ');

  const terms: SpfAnalysis['terms'] = [];
  let hasRedirect = false;
  let dnsLookupCount = 0;

  if (tokens.length === 0) {
    issues.push({ level: 'error', message: '记录为空。' });
    return { normalized, terms, hasRedirect, dnsLookupCount, issues };
  }
  const firstToken = tokens[0] ?? '';
  if (firstToken.toLowerCase() !== SPF_VERSION) {
    issues.push({ level: 'error', message: `记录必须以 "${SPF_VERSION}" 开头，当前开头为 "${firstToken}"。` });
  }

  let allIndex = -1;
  let redirectIndex = -1;

  tokens.slice(1).forEach((raw, i) => {
    const parsed = parseTerm(raw);
    if (!parsed) {
      issues.push({ level: 'error', message: `无法识别的机制："${raw}"。` });
      return;
    }
    terms.push({ raw, ...parsed });

    if (DNS_LOOKUP_MECHANISMS.has(parsed.mechanism)) {
      dnsLookupCount += 1;
    }
    if (parsed.mechanism === 'redirect') {
      hasRedirect = true;
      redirectIndex = i;
      if (!isValidDomain(parsed.value)) {
        issues.push({ level: 'error', message: `redirect= 目标域名不合法："${parsed.value}"。` });
      }
    }
    if (parsed.mechanism === 'all' && allIndex === -1) allIndex = i;

    // 参数词法校验
    if (parsed.mechanism === 'ip4' && !isValidIPv4(parsed.value)) {
      issues.push({ level: 'error', message: `ip4 地址或 CIDR 不合法："${parsed.value}"（应为 a.b.c.d 或 a.b.c.d/prefix）。` });
    }
    if (parsed.mechanism === 'ip6' && !isValidIPv6(parsed.value)) {
      issues.push({ level: 'error', message: `ip6 地址或前缀不合法："${parsed.value}"。` });
    }
    if ((parsed.mechanism === 'include' || parsed.mechanism === 'exists') && !isValidDomain(parsed.value)) {
      issues.push({ level: 'error', message: `${parsed.mechanism} 域名不合法："${parsed.value}"。` });
    }
  });

  // all 必须是最后一个机制（其后的机制永远不会被评估）
  if (allIndex !== -1 && allIndex < terms.length - 1) {
    issues.push({ level: 'warning', message: '"all" 之后仍有机制；按 RFC 7208 §5.1，匹配到 all 后立即得出结论，后续机制不会生效。' });
  }
  // all 的常见策略提示
  const allTerm = terms.find((t) => t.mechanism === 'all');
  if (allTerm && allTerm.qualifier === '+') {
    issues.push({ level: 'warning', message: '使用 "+all" 等于允许任意 IP 以该域发信，任何人都可仿冒，生产环境应使用 "-all" 或 "~all"。' });
  }
  // redirect 与 all 共存时 redirect 不生效
  if (hasRedirect && allIndex !== -1) {
    issues.push({ level: 'warning', message: '记录同时包含 "all" 与 "redirect="；存在 all 时 redirect 修饰符会被忽略（§6.1）。' });
  }
  if (hasRedirect && redirectIndex !== terms.length - 1) {
    issues.push({ level: 'warning', message: 'redirect= 通常应位于记录末尾。' });
  }
  // 10 次 DNS 查询上限
  if (dnsLookupCount > SPF_MAX_DNS_LOOKUPS) {
    issues.push({
      level: 'error',
      message: `DNS 查询机制共 ${dnsLookupCount} 条，超过 RFC 7208 §4.6.4 规定的 ${SPF_MAX_DNS_LOOKUPS} 次上限；超出后收件方会直接判定 PermError。请用更少 include 的服务商或改用扁平化（flatten）IP 段。`,
    });
  } else if (dnsLookupCount === SPF_MAX_DNS_LOOKUPS) {
    issues.push({
      level: 'warning',
      message: `DNS 查询已达 ${SPF_MAX_DNS_LOOKUPS} 次上限，后续再加 include/a/mx 等机制将超限。`,
    });
  }
  // 长度提示（保守按单字符串 255 字符，ASCII）
  if (normalized.length > SPF_MAX_RECORD_LENGTH) {
    issues.push({
      level: 'warning',
      message: `记录长度 ${normalized.length} 字符，超过单条 TXT 字符串 255 字节上限（§3.4/§4.5.4），需拆分为多个引号字符串发布。`,
    });
  }
  if (!hasRedirect && allIndex === -1) {
    issues.push({ level: 'warning', message: '记录缺少收尾的 "all"（或 redirect=）；未命中任何机制时结果为 Neutral，策略不明确。' });
  }

  return { normalized, terms, hasRedirect, dnsLookupCount, issues };
}
