/**
 * ACME dns-01 挑战计算纯函数（RFC 8555 §8.1 / §8.4）
 *
 * 规则：
 *   keyAuthorization = token || '.' || accountThumbprint
 *   dns-01 TXT value = base64url(SHA-256(UTF-8(keyAuthorization)))
 *   record name      = '_acme-challenge.' || 规范化域名
 *
 * SHA-256 使用 Web Crypto（crypto.subtle.digest），Base64URL 用平台内置能力，
 * 不引入新依赖、不触碰 DOM / React，错误以抛出异常的方式由调用方捕获。
 */

/** 无填充 Base64URL 字母表（RFC 4648 §5） */
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

/** 记录名固定前缀标签 */
export const ACME_CHALLENGE_LABEL = '_acme-challenge';

/**
 * 把字节数组编码为无填充 Base64URL 字符串。
 *
 * @param bytes 待编码字节
 * @returns 不含 `=` 填充的 Base64URL 字符串
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * 校验字符串是否为合法的无填充 Base64URL 片段。
 *
 * @param value 待校验字符串
 * @param fieldName 字段名（用于错误信息）
 * @throws 为空、含 `+` `/` `=` 等字母表外字符时抛错
 */
export function assertBase64Url(value: string, fieldName: string): void {
  if (value === '') {
    throw new Error(`${fieldName}不能为空`);
  }
  if (!BASE64URL_PATTERN.test(value)) {
    throw new Error(
      `${fieldName}含非法字符：只允许 Base64URL 字母表（A–Z、a–z、0–9、-、_），不能出现 +、/ 或 = 填充`,
    );
  }
}

/**
 * 规范化用户输入的域名：
 * - 去除首尾空白与末尾点（FQDN 根点）
 * - 剥离通配符证书的 `*.` 前缀
 * - 拒绝协议前缀、端口、路径与非法字符
 *
 * @param rawDomain 原始域名输入
 * @returns normalized 规范化域名；wildcard 是否检测到通配符前缀
 * @throws 域名非法时抛错
 */
export function normalizeDomain(rawDomain: string): { normalized: string; wildcard: boolean } {
  const trimmed = rawDomain.trim();
  if (trimmed === '') {
    throw new Error('域名不能为空');
  }
  if (/^[a-z]+:\/\//i.test(trimmed)) {
    throw new Error('域名不应包含协议前缀（如 http:// 或 https://），请只填写主机名');
  }
  if (/[/?#]/.test(trimmed)) {
    throw new Error('域名不应包含路径、查询或片段');
  }
  if (/:[0-9]+$/.test(trimmed) || trimmed.includes(':')) {
    throw new Error('域名不应包含端口号');
  }

  let domain = trimmed.replace(/\.$/, '');
  let wildcard = false;
  if (domain.startsWith('*.')) {
    wildcard = true;
    domain = domain.slice(2);
  }

  // 主机名标签：字母数字与连字符，标签不得以连字符开头/结尾，点分隔
  const labels = domain.split('.');
  const labelPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
  if (labels.length < 2 || labels.some((label) => !labelPattern.test(label))) {
    throw new Error('域名格式非法，应为 example.com 或多级子域形式');
  }

  return { normalized: domain.toLowerCase(), wildcard };
}

/**
 * 生成 dns-01 TXT 记录名。
 *
 * @param rawDomain 用户输入域名（裸域、子域、通配符或带末尾点均可）
 * @returns recordName 记录名；wildcard 是否为通配符证书；normalizedDomain 规范化域名
 */
export function buildRecordName(rawDomain: string): {
  recordName: string;
  wildcard: boolean;
  normalizedDomain: string;
} {
  const { normalized, wildcard } = normalizeDomain(rawDomain);
  return {
    recordName: `${ACME_CHALLENGE_LABEL}.${normalized}`,
    wildcard,
    normalizedDomain: normalized,
  };
}

/**
 * 拼装 key authorization（RFC 8555 §8.1）。
 *
 * @param token ACME 挑战 token
 * @param accountThumbprint 账户 JWK 指纹（Base64URL）
 * @returns `token.thumbprint` 字符串
 * @throws 任一字段为空或字符集非法时抛错
 */
export function buildKeyAuthorization(token: string, accountThumbprint: string): string {
  const cleanToken = token.trim();
  const cleanThumbprint = accountThumbprint.trim();
  assertBase64Url(cleanToken, 'Challenge token');
  assertBase64Url(cleanThumbprint, '账户 JWK 指纹');
  return `${cleanToken}.${cleanThumbprint}`;
}

/**
 * 计算 dns-01 TXT 记录值：base64url(SHA-256(UTF-8(keyAuthorization)))。
 *
 * @param keyAuthorization 完整 key authorization 字符串
 * @returns 43 字符的无填充 Base64URL TXT 值
 */
export async function computeDns01TxtValue(keyAuthorization: string): Promise<string> {
  const data = new TextEncoder().encode(keyAuthorization);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64Url(new Uint8Array(digest));
}

/** 生成模式的完整结果 */
export interface Dns01GenerationResult {
  recordName: string;
  txtValue: string;
  keyAuthorization: string;
  normalizedDomain: string;
  wildcard: boolean;
}

/**
 * 一次性完成 dns-01 挑战全部计算。
 *
 * @param domain 域名（裸域 / 子域 / 通配符 / FQDN 均可）
 * @param token ACME 挑战 token
 * @param accountThumbprint 账户 JWK 指纹
 * @returns 记录名、TXT 值与 key authorization
 */
export async function generateDns01Challenge(
  domain: string,
  token: string,
  accountThumbprint: string,
): Promise<Dns01GenerationResult> {
  const { recordName, wildcard, normalizedDomain } = buildRecordName(domain);
  const keyAuthorization = buildKeyAuthorization(token, accountThumbprint);
  const txtValue = await computeDns01TxtValue(keyAuthorization);
  return { recordName, txtValue, keyAuthorization, normalizedDomain, wildcard };
}

/** 校验模式结果 */
export interface Dns01VerificationResult {
  token: string;
  accountThumbprint: string;
  keyAuthorization: string;
  recomputedTxtValue: string;
}

/**
 * 校验已有 key authorization 的结构与字符集，并重算应有的 TXT 值。
 *
 * @param keyAuthorizationInput 待校验的 key authorization 字符串
 * @returns 拆分后的 token / thumbprint 与重算 TXT 值
 * @throws 缺少点分段、段数不对或字符集非法时抛错
 */
export async function verifyKeyAuthorization(
  keyAuthorizationInput: string,
): Promise<Dns01VerificationResult> {
  const cleaned = keyAuthorizationInput.trim();
  if (cleaned === '') {
    throw new Error('Key authorization 不能为空');
  }
  const parts = cleaned.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Key authorization 必须为「token.thumbprint」两段且以单个点分隔');
  }
  const [token, accountThumbprint] = parts as [string, string];
  assertBase64Url(token, 'Challenge token');
  assertBase64Url(accountThumbprint, '账户 JWK 指纹');
  const recomputedTxtValue = await computeDns01TxtValue(cleaned);
  return { token, accountThumbprint, keyAuthorization: cleaned, recomputedTxtValue };
}
