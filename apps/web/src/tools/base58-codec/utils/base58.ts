/**
 * Base58 / Base58Check 编解码纯逻辑集合。
 * Base58 去除了 0、O、I、l 以及 +、/ 等易混字符，常用于比特币地址、
 * IPFS CID 等场景；Base58Check 在 Base58 之外附加 1 字节版本前缀与
 * 4 字节 double-SHA256 校验和。仅依赖 Web Crypto，不触碰 DOM / React。
 */

/** Bitcoin（与 IPFS、大多数区块链）使用的 Base58 字母表 */
export const BITCOIN_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Flickr 使用的 Base58 字母表（大小写位置与 Bitcoin 互换） */
export const FLICKR_ALPHABET =
  '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/** Ripple / XRP Ledger 使用的 Base58 字母表（见 xrpl.org Base58 Encodings） */
export const RIPPLE_ALPHABET =
  'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

/** 支持的字母表标识 */
export const BASE58_ALPHABETS = ['bitcoin', 'flickr', 'ripple'] as const;

/** 字母表标识类型，取自 BASE58_ALPHABETS 的元素 */
export type Base58AlphabetKind = (typeof BASE58_ALPHABETS)[number];

/** 字母表标识到实际字符表的映射 */
const ALPHABET_MAP: Record<Base58AlphabetKind, string> = {
  bitcoin: BITCOIN_ALPHABET,
  flickr: FLICKR_ALPHABET,
  ripple: RIPPLE_ALPHABET,
};

/** Base58Check 校验和长度（double-SHA256 摘要前 4 字节） */
const CHECKSUM_LENGTH = 4;

const ZERO = BigInt(0);
const RADIX = BigInt(58);
const BYTE_RADIX = BigInt(256);

/** 编码选项 */
export interface Base58EncodeOptions {
  /** 字母表，默认 bitcoin */
  alphabet?: Base58AlphabetKind;
}

/** 解码结果 */
export interface Base58DecodeResult {
  /** 解码成功时的字节数组，失败为 null */
  bytes: Uint8Array | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** Base58Check 解码结果 */
export interface Base58CheckDecodeResult {
  /** 版本字节（0-255） */
  version: number | null;
  /** 载荷字节（去掉版本与校验和） */
  payload: Uint8Array | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 按字母表把字节数组编码为 Base58 字符串
 *
 * 以 BigInt 逐字节累积数值后反复对 58 取模；前导零字节映射为字母表
 * 首字符（Bitcoin 字母表即 `1`），与比特币 / IPFS 实现一致。
 *
 * @param bytes - 待编码字节
 * @param options - 编码选项
 * @returns Base58 字符串
 */
export function encodeBase58(
  bytes: Uint8Array,
  options: Base58EncodeOptions = {},
): string {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'bitcoin'];

  if (bytes.length === 0) {
    return '';
  }

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros += 1;
  }

  let number = ZERO;
  for (const byte of bytes) {
    number = number * BYTE_RADIX + BigInt(byte);
  }

  let output = '';
  while (number > ZERO) {
    const remainder = Number(number % RADIX);
    number /= RADIX;
    output = (alphabet[remainder] ?? '') + output;
  }

  return alphabet[0]!.repeat(leadingZeros) + output;
}

/**
 * 把 Base58 字符串解码为字节数组
 *
 * @param input - Base58 字符串，允许首尾空白
 * @param options - 编码选项（字母表）
 * @returns 解码字节或带位置信息的错误
 */
export function decodeBase58(
  input: string,
  options: Base58EncodeOptions = {},
): Base58DecodeResult {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'bitcoin'];
  const trimmed = input.trim();
  if (trimmed === '') {
    return { bytes: new Uint8Array(), error: null };
  }

  let leadingOnes = 0;
  while (
    leadingOnes < trimmed.length &&
    trimmed[leadingOnes] === alphabet[0]
  ) {
    leadingOnes += 1;
  }

  let number = ZERO;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index] ?? '';
    const value = alphabet.indexOf(char);
    if (value === -1) {
      return {
        bytes: null,
        error: `非法 Base58 字符 “${char}”（位置 ${index + 1}）`,
      };
    }
    number = number * RADIX + BigInt(value);
  }

  const tail: number[] = [];
  while (number > ZERO) {
    tail.push(Number(number % BYTE_RADIX));
    number /= BYTE_RADIX;
  }

  const bytes = new Uint8Array(leadingOnes + tail.length);
  tail.forEach((byte, offset) => {
    bytes[leadingOnes + tail.length - 1 - offset] = byte;
  });

  return { bytes, error: null };
}

/**
 * 将 UTF-8 文本编码为 Base58
 *
 * @param text - 待编码文本
 * @param options - 编码选项
 * @returns Base58 字符串
 */
export function encodeTextToBase58(
  text: string,
  options?: Base58EncodeOptions,
): string {
  return encodeBase58(new TextEncoder().encode(text), options);
}

/**
 * 将 Base58 解码为 UTF-8 文本
 *
 * @param input - Base58 字符串
 * @param options - 编码选项
 * @returns 文本或错误信息
 */
export function decodeBase58ToText(
  input: string,
  options?: Base58EncodeOptions,
): { text: string | null; error: string | null } {
  const decoded = decodeBase58(input, options);
  if (decoded.error || !decoded.bytes) {
    return { text: null, error: decoded.error };
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(decoded.bytes), error: null };
  } catch {
    return { text: null, error: '解码字节不是合法的 UTF-8 文本，可尝试按十六进制查看' };
  }
}

/**
 * 计算 Base58Check 的 4 字节校验和：SHA256(SHA256(data)) 的前 4 字节
 *
 * @param data - 参与校验的数据（版本 + 载荷）
 * @returns 4 字节校验和
 */
async function checksum(data: Uint8Array): Promise<Uint8Array> {
  const firstSource = new Uint8Array(data);
  const first = new Uint8Array(
    await crypto.subtle.digest('SHA-256', firstSource),
  );
  const second = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new Uint8Array(first)),
  );
  return second.slice(0, CHECKSUM_LENGTH);
}

/**
 * 按 Base58Check 编码：version(1B) + payload + checksum(4B)，再做 Base58
 *
 * @param payload - 载荷字节
 * @param version - 版本字节（0-255），比特币 P2PKH 地址为 0x00
 * @param options - 编码选项（字母表）
 * @returns Base58Check 字符串
 */
export async function encodeBase58Check(
  payload: Uint8Array,
  version: number,
  options: Base58EncodeOptions = {},
): Promise<string> {
  if (!Number.isInteger(version) || version < 0 || version > 255) {
    throw new Error('版本字节必须是 0-255 之间的整数');
  }

  const data = new Uint8Array(payload.length + 1);
  data[0] = version;
  data.set(payload, 1);

  const sum = await checksum(data);
  const full = new Uint8Array(data.length + CHECKSUM_LENGTH);
  full.set(data, 0);
  full.set(sum, data.length);

  return encodeBase58(full, options);
}

/**
 * 解码 Base58Check 字符串并校验校验和
 *
 * @param input - Base58Check 字符串
 * @param options - 编码选项（字母表）
 * @returns 版本字节、载荷或错误信息
 */
export async function decodeBase58Check(
  input: string,
  options: Base58EncodeOptions = {},
): Promise<Base58CheckDecodeResult> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return { version: null, payload: null, error: '当前环境不支持 Web Crypto' };
  }

  const decoded = decodeBase58(input, options);
  if (decoded.error || !decoded.bytes) {
    return { version: null, payload: null, error: decoded.error };
  }

  const bytes = decoded.bytes;
  if (bytes.length < 1 + CHECKSUM_LENGTH) {
    return {
      version: null,
      payload: null,
      error: `Base58Check 数据过短：至少需要 ${1 + CHECKSUM_LENGTH} 字节，实际 ${bytes.length} 字节`,
    };
  }

  const data = bytes.slice(0, bytes.length - CHECKSUM_LENGTH);
  const expected = bytes.slice(bytes.length - CHECKSUM_LENGTH);
  const actual = await checksum(data);

  for (let index = 0; index < CHECKSUM_LENGTH; index += 1) {
    if (expected[index] !== actual[index]) {
      return {
        version: null,
        payload: null,
        error: '校验和不匹配：输入不是合法的 Base58Check（版本或载荷可能已损坏）',
      };
    }
  }

  return {
    version: data[0] ?? null,
    payload: data.slice(1),
    error: null,
  };
}

/**
 * 把字节数组转为小写十六进制字符串
 *
 * @param bytes - 字节数组
 * @returns 十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 把十六进制字符串解析为字节数组
 *
 * @param hex - 十六进制字符串，允许空白与 0x 前缀
 * @returns 字节数组或错误信息
 */
export function hexToBytes(hex: string): {
  bytes: Uint8Array | null;
  error: string | null;
} {
  const cleaned = hex.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (cleaned === '') {
    return { bytes: new Uint8Array(), error: null };
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    return { bytes: null, error: '十六进制包含非 0-9a-f 字符' };
  }
  if (cleaned.length % 2 !== 0) {
    return { bytes: null, error: '十六进制长度必须为偶数' };
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return { bytes, error: null };
}
