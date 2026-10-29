/**
 * HKDF（RFC 5869）密钥派生纯函数，基于 Web Crypto 的 HKDF 原语，
 * 支持文本 / Hex / Base64 三种输入载体，不触碰 DOM / React
 */

/** HKDF 支持的底层哈希算法 */
export type HkdfHash = 'SHA-256' | 'SHA-384' | 'SHA-512';

/** 输入编码载体 */
export type InputEncoding = 'text' | 'hex' | 'base64';

/** 派生结果 */
export interface HkdfResult {
  /** Extract 阶段输出的伪随机密钥 PRK（十六进制） */
  prk: string;
  /** Expand 阶段输出的输出密钥材料 OKM（十六进制） */
  okm: string;
  /** OKM 的 Base64 编码 */
  okmBase64: string;
}

/** 计算失败结果 */
export interface HkdfError {
  /** 中文错误信息 */
  error: string;
}

/** 哈希算法 → 摘要字节长度 */
export const HASH_LENGTH_MAP: Record<HkdfHash, number> = {
  'SHA-256': 32,
  'SHA-384': 48,
  'SHA-512': 64,
};

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
 * 解析 Base64（含 Base64URL）字符串为字节，非法字符或长度返回错误
 *
 * @param input - Base64 文本
 * @returns 字节数组或错误信息
 */
export function base64ToBytes(
  input: string,
): { bytes: Uint8Array<ArrayBuffer>; error: null } | { bytes: null; error: string } {
  const cleaned = input.trim().replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { bytes: new Uint8Array(0), error: null };
  }
  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    return { bytes: null, error: 'Base64 输入非法：字符或填充不正确' };
  }
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, error: null };
  } catch {
    return { bytes: null, error: 'Base64 输入非法：解码失败' };
  }
}

/**
 * 按指定载体把输入解析为字节
 *
 * @param input - 原始输入文本
 * @param encoding - 编码方式
 * @returns 字节数组或错误信息
 */
export function decodeInput(
  input: string,
  encoding: InputEncoding,
):
  | { bytes: Uint8Array<ArrayBuffer>; error: null }
  | { bytes: null; error: string } {
  if (encoding === 'text') {
    return { bytes: new TextEncoder().encode(input), error: null };
  }
  if (encoding === 'hex') {
    return hexToBytes(input);
  }
  return base64ToBytes(input);
}

/**
 * 执行 HKDF-Extract：PRK = HMAC-Hash(salt, IKM)，
 * salt 缺省时使用 HashLen 个全零字节（RFC 5869 §2.2）
 *
 * @param ikm - 输入密钥材料
 * @param salt - 可选 salt
 * @param hash - 底层哈希
 * @returns PRK 字节
 */
export async function hkdfExtract(
  ikm: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  hash: HkdfHash,
): Promise<Uint8Array<ArrayBuffer>> {
  const effectiveSalt =
    salt.length > 0 ? salt : new Uint8Array(HASH_LENGTH_MAP[hash]);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    effectiveSalt,
    { name: 'HMAC', hash },
    false,
    ['sign'],
  );
  const prk = await crypto.subtle.sign('HMAC', hmacKey, ikm);
  return new Uint8Array(prk);
}

/**
 * 完整 HKDF（Extract-then-Expand，RFC 5869），
 * 通过 Web Crypto HKDF 原语取 OKM，并单独计算 PRK 展示中间结果
 *
 * @param ikmInput - IKM 原始文本
 * @param ikmEncoding - IKM 编码
 * @param saltInput - salt 原始文本
 * @param saltEncoding - salt 编码
 * @param infoInput - info 原始文本（始终按所选编码解释）
 * @param infoEncoding - info 编码
 * @param hash - 底层哈希
 * @param outputLength - OKM 字节长度（上限 255 × HashLen）
 * @returns PRK / OKM（hex + Base64）或错误信息
 */
export async function deriveHkdf(
  ikmInput: string,
  ikmEncoding: InputEncoding,
  saltInput: string,
  saltEncoding: InputEncoding,
  infoInput: string,
  infoEncoding: InputEncoding,
  hash: HkdfHash,
  outputLength: number,
): Promise<HkdfResult | HkdfError> {
  const ikm = decodeInput(ikmInput, ikmEncoding);
  if (!ikm.bytes) {
    return { error: `IKM 解析失败：${ikm.error}` };
  }
  const salt = decodeInput(saltInput, saltEncoding);
  if (!salt.bytes) {
    return { error: `salt 解析失败：${salt.error}` };
  }
  const info = decodeInput(infoInput, infoEncoding);
  if (!info.bytes) {
    return { error: `info 解析失败：${info.error}` };
  }

  if (!Number.isInteger(outputLength) || outputLength <= 0) {
    return { error: '输出长度需为正整数（字节）' };
  }
  const maxLength = 255 * HASH_LENGTH_MAP[hash];
  if (outputLength > maxLength) {
    return {
      error: `输出长度超出 RFC 5869 上限：${hash} 最多 ${maxLength} 字节`,
    };
  }

  try {
    const prkBytes = await hkdfExtract(ikm.bytes, salt.bytes, hash);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      ikm.bytes,
      'HKDF',
      false,
      ['deriveBits'],
    );
    const okmBuffer = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash,
        salt: salt.bytes,
        info: info.bytes,
      },
      baseKey,
      outputLength * 8,
    );
    const okmBytes = new Uint8Array(okmBuffer);
    return {
      prk: bytesToHex(prkBytes),
      okm: bytesToHex(okmBytes),
      okmBase64: bytesToBase64(okmBytes),
    };
  } catch {
    return { error: 'Web Crypto 派生失败，请检查输入参数' };
  }
}
