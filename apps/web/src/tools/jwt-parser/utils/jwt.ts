
export interface JWTParts {
  header: string;
  payload: string;
  signature: string;
  headerJson: any;
  payloadJson: any;
}

export interface ParseResult {
  success: boolean;
  error?: string;
  parts?: JWTParts;
}

export interface GenerateOptions {
  header: any;
  payload: any;
  secret: string;
  algorithm: 'HS256';
}

/**
 * Base64URL 解码
 */
function base64UrlDecode(input: string): string {
  // Base64URL 替换字符
  let output = input.replace(/-/g, '+').replace(/_/g, '/');
  // 添加填充
  const padding = 4 - (output.length % 4);
  if (padding > 0 && padding < 4) {
    output += '='.repeat(padding);
  }
  // 解码
  return atob(output);
}

/**
 * Base64URL 编码
 */
function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 解析 JWT
 */
export function parseJwt(token: string): ParseResult {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    return {
      success: false,
      error: 'JWT 格式错误，必须包含 3 部分，用 . 分隔'
    };
  }

  try {
    const [headerB64, payloadB64, signature] = parts;
    const headerJson = JSON.parse(base64UrlDecode(headerB64));
    const payloadJson = JSON.parse(base64UrlDecode(payloadB64));
    
    return {
      success: true,
      parts: {
        header: headerB64,
        payload: payloadB64,
        signature,
        headerJson,
        payloadJson,
      }
    };
  } catch (e) {
    return {
      success: false,
      error: '解析失败，JSON 格式错误'
    };
  }
}

/**
 * 使用 HMAC-SHA256 验证 JWT 签名
 */
export async function verifySignature(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [headerB64, payloadB64, signature] = parts;
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const keyData = new TextEncoder().encode(secret);
  
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['verify']
    );
    
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    );
    
    // 将 expectedSignature 转换为 Base64URL
    const expectedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return expectedSignatureBase64 === signature;
  } catch {
    return false;
  }
}

/**
 * 使用 HMAC-SHA256 生成 JWT 签名并组装完整 token
 */
export async function generateJwt(options: GenerateOptions): Promise<string> {
  const { header, payload, secret, algorithm } = options;
  
  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(payload);
  
  const headerB64 = base64UrlEncode(headerJson);
  const payloadB64 = base64UrlEncode(payloadJson);
  
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const keyData = new TextEncoder().encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: algorithm === 'HS256' ? 'SHA-256' : 'SHA-256' } },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    data
  );
  
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${headerB64}.${payloadB64}.${signatureBase64}`;
}
