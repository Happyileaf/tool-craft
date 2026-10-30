/**
 * JWK Thumbprint（RFC 7638）规范化与指纹计算。
 * 规范化（成员裁剪 + 词典序 + 紧凑 JSON）为纯函数；摘要经 Web Crypto 完成。
 */

/** RFC 7638 §3.2 规定的各密钥类型必需成员（顺序即词典序） */
export const REQUIRED_MEMBERS: Record<string, string[]> = {
  RSA: ['e', 'kty', 'n'],
  EC: ['crv', 'kty', 'x', 'y'],
  OKP: ['crv', 'kty', 'x'],
  oct: ['k', 'kty'],
};

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

export interface ThumbprintResult {
  /** 规范化后的紧凑 JSON（无空白、成员名词典序） */
  canonicalJson: string | null;
  /** base64url（无 padding）指纹 */
  thumbprint: string | null;
  error: string | null;
}

/**
 * 按 RFC 7638 规范化 JWK：仅保留 kty 要求的必需成员，
 * 成员名按词典序排序，输出无空白紧凑 JSON。
 */
export function canonicalizeJwk(input: unknown): { json: string } | { error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { error: 'JWK 必须是 JSON 对象' };
  }
  const obj = input as Record<string, unknown>;
  const kty = obj.kty;
  if (typeof kty !== 'string') {
    return { error: 'JWK 缺少字符串类型的 kty 成员' };
  }
  const required = REQUIRED_MEMBERS[kty];
  if (!required) {
    return { error: `不支持的密钥类型 kty=${kty}（仅支持 RSA / EC / OKP / oct）` };
  }
  for (const member of required) {
    const value = obj[member];
    if (typeof value !== 'string') {
      return { error: `JWK 缺少必需成员或成员非字符串：${member}` };
    }
  }
  const canonical: Record<string, string> = {};
  for (const member of required) {
    canonical[member] = obj[member] as string;
  }
  return { json: JSON.stringify(canonical) };
}

/** ArrayBuffer → base64url（无 padding） */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 计算 JWK Thumbprint。
 * @param input JWK 文本（JSON 字符串）或已解析对象
 * @param algorithm SHA-256（默认，RFC 7638）/ SHA-384 / SHA-512（RFC 9278）
 */
export async function computeThumbprint(
  input: string | Record<string, unknown>,
  algorithm: HashAlgorithm = 'SHA-256',
): Promise<ThumbprintResult> {
  let parsed: unknown;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return {
        canonicalJson: null,
        thumbprint: null,
        error: 'JSON 解析失败：请输入合法的 JWK JSON 文本',
      };
    }
  } else {
    parsed = input;
  }

  const canonical = canonicalizeJwk(parsed);
  if ('error' in canonical) {
    return { canonicalJson: null, thumbprint: null, error: canonical.error };
  }

  const data = new TextEncoder().encode(canonical.json);
  const digest = await crypto.subtle.digest({ name: algorithm }, data);
  return {
    canonicalJson: canonical.json,
    thumbprint: bufferToBase64Url(digest),
    error: null,
  };
}
