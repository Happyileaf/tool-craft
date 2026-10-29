/**
 * PBKDF2（RFC 8018 / PKCS#5 v2.1）口令密钥派生纯函数，
 * 基于 Web Crypto 的 PBKDF2 原语，不触碰 DOM / React
 */

/** PBKDF2 支持的底层哈希算法 */
export type Pbkdf2Hash = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

/** salt 输入载体 */
export type SaltEncoding = 'text' | 'hex';

/** 派生结果 */
export interface Pbkdf2Result {
  /** 派生密钥 DK（十六进制） */
  dkHex: string;
  /** 派生密钥 DK（Base64） */
  dkBase64: string;
}

/** 计算失败结果 */
export interface Pbkdf2Error {
  /** 中文错误信息 */
  error: string;
}

/** dkLen 实用上限（字节），防止误填导致浏览器长时间卡死 */
export const MAX_DKLEN = 65536;

/**
 * 将字节数组转为小写十六进制字符串
 *
 * @param bytes - 字节序列
 * @returns 十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array<ArrayBuffer>): string {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将字节数组转为标准 Base64
 *
 * @param bytes - 字节序列
 * @returns Base64 字符串
 */
export function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * 严格解析十六进制字符串为字节，允许空白与 0x 前缀；
 * 奇数位或含非十六进制字符时返回明确错误
 *
 * @param input - 十六进制文本
 * @returns 字节数组或错误信息
 */
export function hexToBytes(
  input: string,
): { bytes: Uint8Array<ArrayBuffer>; error: null } | { bytes: null; error: string } {
  const cleaned = input.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { bytes: new Uint8Array(0), error: null };
  }
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
    return { bytes: null, error: '十六进制输入非法：需为偶数位的 0-9 / A-F 字符' };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return { bytes, error: null };
}

/**
 * 按指定载体把 salt 解析为字节（文本按 UTF-8 编码）
 *
 * @param input - 原始输入文本
 * @param encoding - 编码方式
 * @returns 字节数组或错误信息
 */
export function decodeSalt(
  input: string,
  encoding: SaltEncoding,
):
  | { bytes: Uint8Array<ArrayBuffer>; error: null }
  | { bytes: null; error: string } {
  if (encoding === 'text') {
    return { bytes: new TextEncoder().encode(input), error: null };
  }
  return hexToBytes(input);
}

/**
 * 执行 PBKDF2 派生：DK = PBKDF2-HMAC-Hash(P, S, c, dkLen)，
 * 密码按 UTF-8 编码为口令密钥材料，经 Web Crypto importKey + deriveBits 输出
 *
 * @param password - 口令 P（文本，UTF-8）
 * @param saltInput - salt 原始文本
 * @param saltEncoding - salt 载体（文本 / Hex）
 * @param iterations - 迭代次数 c（正整数）
 * @param hash - 底层哈希
 * @param dkLen - 派生密钥长度（字节，1..MAX_DKLEN）
 * @returns DK（hex + Base64）或错误信息
 */
export async function derivePbkdf2(
  password: string,
  saltInput: string,
  saltEncoding: SaltEncoding,
  iterations: number,
  hash: Pbkdf2Hash,
  dkLen: number,
): Promise<Pbkdf2Result | Pbkdf2Error> {
  const salt = decodeSalt(saltInput, saltEncoding);
  if (!salt.bytes) {
    return { error: `salt 解析失败：${salt.error}` };
  }
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return { error: '迭代次数需为正整数' };
  }
  if (!Number.isInteger(dkLen) || dkLen <= 0) {
    return { error: '派生密钥长度需为正整数（字节）' };
  }
  if (dkLen > MAX_DKLEN) {
    return { error: `派生密钥长度超出上限：最多 ${MAX_DKLEN} 字节` };
  }

  try {
    const passwordBytes = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    );
    const dkBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt.bytes,
        iterations,
        hash,
      },
      baseKey,
      dkLen * 8,
    );
    const dkBytes = new Uint8Array(dkBuffer);
    return {
      dkHex: bytesToHex(dkBytes),
      dkBase64: bytesToBase64(dkBytes),
    };
  } catch {
    return { error: 'Web Crypto 派生失败，请检查参数（如迭代次数是否过大）' };
  }
}
