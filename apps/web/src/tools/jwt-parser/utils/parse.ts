/**
 * JWT 解析结果类型定义
 */
export interface JwtParseResult {
  header: Record<string, any> | null;
  payload: Record<string, any> | null;
  signature: string | null;
  isValidFormat: boolean;
  error: string | null;
  parts: string[];
}

/**
 * Base64Url 解码，适配 JWT 格式
 */
function base64UrlDecode(input: string): string {
  try {
    // 添加 padding 以满足 base64 格式要求
    let output = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = output.length % 4;
    if (pad) {
      output += '='.repeat(4 - pad);
    }
    return decodeURIComponent(
      atob(output)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    throw new Error('Invalid base64url encoding');
  }
}

/**
 * 解析 JWT token，返回头部、载荷、签名和验证信息
 * 只做格式解析和完整性检查，不验证签名有效性
 */
export function parseJwt(token: string): JwtParseResult {
  if (!token.trim()) {
    return {
      header: null,
      payload: null,
      signature: null,
      isValidFormat: false,
      error: 'Empty token',
      parts: [],
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: null,
      isValidFormat: false,
      error: `Invalid token format: expected 3 parts separated by ".", got ${parts.length}`,
      parts,
    };
  }

  try {
    const headerJson = base64UrlDecode(parts[0]!);
    const payloadJson = base64UrlDecode(parts[1]!);

    return {
      header: JSON.parse(headerJson),
      payload: JSON.parse(payloadJson),
      signature: parts[2]!,
      isValidFormat: true,
      error: null,
      parts,
    };
  } catch (e: any) {
    return {
      header: null,
      payload: null,
      signature: null,
      isValidFormat: false,
      error: `Parsing failed: ${e.message}`,
      parts,
    };
  }
}

/**
 * 格式化 Unix 时间戳为本地日期时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * 检查 JWT 是否已过期
 */
export function isExpired(exp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return exp < now;
}
