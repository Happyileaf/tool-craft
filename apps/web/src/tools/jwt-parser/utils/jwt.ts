import { Algorithm } from '../constants';

export interface JWT {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  isValidFormat: boolean;
}

export const JwtErrorKey = {
  INVALID_HEADER_JSON: 'invalidHeaderJson',
  INVALID_PAYLOAD_JSON: 'invalidPayloadJson',
  SECRET_REQUIRED: 'secretRequired',
  VERIFY_SECRET_REQUIRED: 'errorSecretRequired',
  UNSUPPORTED_ALGORITHM: 'errorUnsupportedAlgorithm',
  CRYPTO_FAILED: 'errorCrypto',
} as const;

export type JwtErrorKey = (typeof JwtErrorKey)[keyof typeof JwtErrorKey];

export interface JwtOperationError {
  key: JwtErrorKey;
  params?: Record<string, string | number>;
}

export interface VerifyResult {
  valid: boolean;
  error?: JwtOperationError;
}

export type GenerateResult =
  | { success: true; token: string }
  | { success: false; error: JwtOperationError };

/**
 * Base64Url 解码
 * Base64Url 是 Base64 的变体，用于 URL 安全传输
 */
function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (base64.length % 4);
  if (pad > 0 && pad < 4) {
    base64 += '='.repeat(pad);
  }
  return decodeURIComponent(
    escape(atob(base64))
  );
}

/**
 * Base64Url 编码
 */
function base64UrlEncode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 解析 JWT token，分离 header、payload、signature
 */
export function parseJWT(token: string): JWT {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return {
      header: {},
      payload: {},
      signature: '',
      isValidFormat: false,
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
    };
  } catch {
    return {
      header: {},
      payload: {},
      signature: '',
      isValidFormat: false,
    };
  }
}

/**
 * 使用 Web Crypto API 验证 HMAC 签名，失败原因以错误 key 返回
 */
export async function verifySignature(
  headerB64: string,
  payloadB64: string,
  signature: string,
  secret: string,
  algorithm: Algorithm
): Promise<VerifyResult> {
  if (!secret) {
    return {
      valid: false,
      error: { key: JwtErrorKey.VERIFY_SECRET_REQUIRED },
    };
  }

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const keyBytes = new TextEncoder().encode(secret);

  let hashAlgorithm: string;
  switch (algorithm) {
    case Algorithm.HS256:
      hashAlgorithm = 'SHA-256';
      break;
    default:
      return {
        valid: false,
        error: {
          key: JwtErrorKey.UNSUPPORTED_ALGORITHM,
          params: { algorithm },
        },
      };
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: hashAlgorithm } },
      false,
      ['sign']
    );

    const hmacBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    );

    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(hmacBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (expectedB64.length !== signature.length) {
      return { valid: false };
    }
    let result = 0;
    for (let i = 0; i < expectedB64.length; i++) {
      result |= expectedB64.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return { valid: result === 0 };
  } catch {
    return {
      valid: false,
      error: { key: JwtErrorKey.CRYPTO_FAILED },
    };
  }
}

/**
 * 生成 JWT token，返回成功结果或结构化错误，不抛出异常
 */
export async function generateJWT(
  header: Record<string, any>,
  payload: Record<string, any>,
  secret: string,
  algorithm: Algorithm
): Promise<GenerateResult> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const keyBytes = new TextEncoder().encode(secret);

  let hashAlgorithm: string;
  switch (algorithm) {
    case Algorithm.HS256:
      hashAlgorithm = 'SHA-256';
      break;
    default:
      return {
        success: false,
        error: {
          key: JwtErrorKey.UNSUPPORTED_ALGORITHM,
          params: { algorithm },
        },
      };
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: hashAlgorithm } },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return {
      success: true,
      token: `${headerB64}.${payloadB64}.${signatureB64}`,
    };
  } catch {
    return {
      success: false,
      error: { key: JwtErrorKey.CRYPTO_FAILED },
    };
  }
}

/**
 * 尝试解析为 JSON 对象，如果失败返回 null
 */
export function tryParseJSON(jsonStr: string): Record<string, any> | null {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
