/**
 * OAuth 2.0 PKCE（RFC 7636）参数生成纯逻辑集合。
 * 仅依赖 Web Crypto（CSPRNG 与 SHA-256 摘要），不触碰 DOM / React，
 * 也不发起任何网络请求。
 */

/** RFC 7636 §4.1 规定的 unreserved 字符集合：A-Z a-z 0-9 - . _ ~ */
const UNRESERVED_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** code_verifier 最小长度（RFC 7636 §4.1） */
export const PKCE_VERIFIER_MIN_LENGTH = 43;

/** code_verifier 最大长度（RFC 7636 §4.1） */
export const PKCE_VERIFIER_MAX_LENGTH = 128;

/** 默认 code_verifier 长度，取 RFC 允许的最小值以兼顾安全与可用性 */
export const PKCE_DEFAULT_VERIFIER_LENGTH = 43;

/** PKCE code_challenge 方法 */
export const PKCE_METHODS = ['S256', 'plain'] as const;

/** code_challenge 方法类型，取自 PKCE_METHODS 的元素 */
export type PkceMethod = (typeof PKCE_METHODS)[number];

/**
 * 生成指定长度的 code_verifier。
 *
 * 使用 crypto.getRandomValues 作为 CSPRNG，并通过拒绝采样（rejection
 * sampling）消除 256 对 68 取模带来的分布偏差：仅接受小于 252 的随机
 * 字节，每个字符等概率取自 68 个 unreserved 字符。
 *
 * @param length - 期望长度，取值区间 [43, 128]，默认 43
 * @returns 由 unreserved 字符组成的随机 code_verifier
 * @throws 当长度不在 [43, 128] 区间或运行环境不支持 Web Crypto 时抛出错误
 */
export function generateVerifier(
  length: number = PKCE_DEFAULT_VERIFIER_LENGTH,
): string {
  if (
    !Number.isInteger(length) ||
    length < PKCE_VERIFIER_MIN_LENGTH ||
    length > PKCE_VERIFIER_MAX_LENGTH
  ) {
    throw new Error(
      `code_verifier 长度必须是 ${PKCE_VERIFIER_MIN_LENGTH}-${PKCE_VERIFIER_MAX_LENGTH} 之间的整数`,
    );
  }

  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('当前环境不支持 Web Crypto');
  }

  const chars: string[] = [];
  const bytes = new Uint8Array(length);
  // 256 以内字符表长度（68）的最大倍数为 68 * 3 = 204，拒绝 [204, 256)
  // 的字节后每个字符等概率出现，消除取模偏差
  const limit = UNRESERVED_ALPHABET.length * 3;
  let filled = 0;

  while (filled < length) {
    crypto.getRandomValues(bytes);
    for (let index = 0; index < bytes.length && filled < length; index += 1) {
      const byte = bytes[index] ?? 0;
      if (byte < limit) {
        chars.push(UNRESERVED_ALPHABET[byte % UNRESERVED_ALPHABET.length] ?? '');
        filled += 1;
      }
    }
  }

  return chars.join('');
}

/** code_verifier 校验结果 */
export interface VerifierValidation {
  /** 是否符合 RFC 7636 规则 */
  valid: boolean;
  /** 校验失败时的可读原因，合法时为 null */
  error: string | null;
}

/**
 * 校验 code_verifier 是否符合 RFC 7636 §4.1：
 * 长度 43-128 位，且仅包含 unreserved 字符。
 *
 * @param verifier - 待校验的 code_verifier
 * @returns 校验结果
 */
export function validateVerifier(verifier: string): VerifierValidation {
  if (verifier.length < PKCE_VERIFIER_MIN_LENGTH) {
    return {
      valid: false,
      error: `code_verifier 长度至少 ${PKCE_VERIFIER_MIN_LENGTH} 位，当前 ${verifier.length} 位`,
    };
  }
  if (verifier.length > PKCE_VERIFIER_MAX_LENGTH) {
    return {
      valid: false,
      error: `code_verifier 长度至多 ${PKCE_VERIFIER_MAX_LENGTH} 位，当前 ${verifier.length} 位`,
    };
  }
  if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) {
    return {
      valid: false,
      error: 'code_verifier 只能包含 unreserved 字符（A-Z、a-z、0-9 与 - . _ ~）',
    };
  }
  return { valid: true, error: null };
}

/**
 * 依据 code_verifier 推导 code_challenge。
 *
 * - S256（推荐）：BASE64URL(SHA-256(ASCII(verifier)))，不带 `=` 填充；
 * - plain：code_challenge 直接等于 code_verifier。
 *
 * @param verifier - 已校验合法的 code_verifier
 * @param method - challenge 方法，默认 S256
 * @returns 对应的 code_challenge
 * @throws 当 verifier 非法、方法不支持或环境不支持 Web Crypto 时抛出错误
 */
export async function deriveChallenge(
  verifier: string,
  method: PkceMethod = 'S256',
): Promise<string> {
  const validation = validateVerifier(verifier);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'code_verifier 非法');
  }

  if (method === 'plain') {
    return verifier;
  }

  if (method !== 'S256') {
    throw new Error(`不支持的 code_challenge 方法：${String(method)}`);
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto');
  }

  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  let binary = '';
  const bytes = new Uint8Array(digest);
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }
  // btoa 输出标准 base64，映射为 base64url 并去除填充
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
