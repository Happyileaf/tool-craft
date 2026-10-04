/**
 * 分割 JWT token 为三部分
 */
export function splitJwt(token: string): string[] {
  // 移除Bearer前缀
  token = token.trim().replace(/^Bearer\s+/i, '');
  return token.split('.');
}

/**
 * Base64Url 解码
 */
export function base64UrlDecode(input: string): string {
  // 添加缺失的填充
  const pad = input.length % 4;
  if (pad !== 0) {
    input += '='.repeat(4 - pad);
  }
  // 替换URL安全字符
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  return atob(input);
}

/**
 * Base64Url 编码
 */
export function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 解析 JWT token，返回 header 和 payload
 */
export function parseJwt(token: string): {
  header: any | null;
  payload: any | null;
  error: string | null;
} {
  try {
    const parts = splitJwt(token);
    if (parts.length !== 3) {
      return { header: null, payload: null, error: '无效的JWT格式，JWT应该包含三个部分，用点分隔' };
    }

    const [headerB64, payloadB64, signature] = parts;
    const headerJson = base64UrlDecode(headerB64);
    const payloadJson = base64UrlDecode(payloadB64);

    return {
      header: JSON.parse(headerJson),
      payload: JSON.parse(payloadJson),
      error: null,
    };
  } catch (e) {
    return {
      header: null,
      payload: null,
      error: `解析失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * 生成 JWT token
 */
export function generateJwt(header: any, payload: any, secret: string): string {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  // 这里只做生成，签名由浏览器验证
  return `${headerB64}.${payloadB64}.`;
}

/**
 * 使用HMAC-SHA256验证签名
 */
export async function verifySignature(
  headerB64: string,
  payloadB64: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const algorithm = { name: 'HMAC', hash: { name: 'SHA-256' } };
    const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['verify']);
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, signatureBuffer, data);
  } catch (e) {
    return false;
  }
}
