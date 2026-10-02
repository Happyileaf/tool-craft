import { JwtAlgorithmEnum } from '../constants';

/**
 * JWT 解析结果
 */
export interface JwtParseResult {
  header: any;
  payload: any;
  signature: string;
  isValidFormat: boolean;
  error?: string;
  signatureValid?: boolean;
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(input: string): string {
  // 添加 padding 使其符合标准 Base64
  let padding = '';
  switch (input.length % 4) {
    case 2:
      padding = '==';
      break;
    case 3:
      padding = '=';
      break;
  }
  const base64 = (input + padding).replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(input: string): string {
  return btoa(encodeURIComponent(input))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 解析 JWT Token
 * @param token - JWT 字符串
 * @returns 解析结果，包含 header、payload、signature 以及格式是否正确
 */
export function parseJwt(token: string): JwtParseResult {
  const parts = token.trim().split('.');

  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValidFormat: false,
      error: 'JWT 格式不正确，应该包含三个部分用 . 分隔',
    };
  }

  try {
    const headerJson = base64UrlDecode(parts[0]);
    const payloadJson = base64UrlDecode(parts[1]);

    return {
      header: JSON.parse(headerJson),
      payload: JSON.parse(payloadJson),
      signature: parts[2],
      isValidFormat: true,
    };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValidFormat: false,
      error: '解析失败：Base64 解码或 JSON 解析错误',
    };
  }
}

/**
 * 生成 JWT Token
 * @param header - header JSON 对象
 * @param payload - payload JSON 对象
 * @param secret - 签名密钥
 * @param algorithm - 签名算法，目前只支持 HS256
 * @returns 生成的 JWT 字符串
 */
export async function generateJwt(
  header: any,
  payload: any,
  secret: string,
  algorithm: JwtAlgorithmEnum,
): Promise<string> {
  const headerStr = JSON.stringify(header);
  const payloadStr = JSON.stringify(payload);

  const encodedHeader = base64UrlEncode(headerStr);
  const encodedPayload = base64UrlEncode(payloadStr);

  const data = `${encodedHeader}.${encodedPayload}`;

  // 目前只支持 HS256
  if (algorithm === JwtAlgorithmEnum.HS256) {
    const signature = await signHmacSha256(data, secret);
    return `${data}.${signature}`;
  }

  throw new Error(`不支持的算法: ${algorithm}`);
}

/**
 * 使用 HMAC-SHA256 签名数据
 * @param data - 要签名的数据
 * @param secret - 密钥
 * @returns base64url 编码的签名
 */
async function signHmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const algorithm = { name: 'HMAC', hash: { name: 'SHA-256' } };

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    algorithm,
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data),
  );

  // 将 ArrayBuffer 转换为 base64url
  const binary = String.fromCharCode(...new Uint8Array(signatureBuffer));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 验证 JWT 签名
 * @param token - JWT 完整 Token
 * @param secret - 验证密钥
 * @returns 是否验证通过
 */
export async function verifySignature(
  token: string,
  secret: string,
): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const data = `${parts[0]}.${parts[1]}`;
  const expectedSignature = await signHmacSha256(data, secret);

  // 恒定时间比较，防止时序攻击
  if (expectedSignature.length !== parts[2].length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ parts[2].charCodeAt(i);
  }

  return result === 0;
}

/**
 * 格式化 JSON 用于显示
 * @param json - JSON 对象
 * @returns 格式化后的字符串
 */
export function formatJson(json: any): string {
  return JSON.stringify(json, null, 2);
}
