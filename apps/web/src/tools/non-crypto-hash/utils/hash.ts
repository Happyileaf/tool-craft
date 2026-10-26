/**
 * 常用非加密哈希算法的纯函数实现，不依赖 DOM 与 React。
 * 包含 FNV-1 / FNV-1a（32 位与 64 位）、MurmurHash3（x86 32 位，支持 seed）、
 * djb2、sdbm 与 Java String.hashCode()。
 *
 * 与密码学哈希相反，这些算法追求速度与均匀分布，用于哈希表分桶、
 * 数据分片 / 路由键与算法教学，不应用于安全用途。
 * 输入统一按 UTF-8 编码取字节；32 位结果使用无符号整数表示，
 * 64 位结果超出 JS 安全整数范围，以 BigInt 计算并以十进制 / 无符号十六进制呈现。
 */

/** 单个算法的计算结果 */
export interface HashResult {
  /** 算法标识 */
  id: string;
  /** 算法展示名 */
  name: string;
  /** 十进制结果（64 位算法为完整无符号十进制） */
  decimal: string;
  /** 无符号十六进制结果（32 位为 8 位、64 位为 16 位，小写） */
  hex: string;
}

/** 32 位算法标识 */
export type Hash32Id =
  | 'fnv1-32'
  | 'fnv1a-32'
  | 'murmurhash3-32'
  | 'djb2'
  | 'sdbm'
  | 'java-hashcode';

/** 64 位算法标识 */
export type Hash64Id = 'fnv1-64' | 'fnv1a-64';

/** 全部算法标识 */
export type HashAlgorithmId = Hash32Id | Hash64Id;

/** MurmurHash3 默认种子 */
export const DEFAULT_MURMUR_SEED = 0;

const FNV_32_OFFSET_BASIS = 0x811c9dc5;
const FNV_32_PRIME = 0x01000193;

const LOW_32_MASK = BigInt(0xffffffff);
const SHIFT_32 = BigInt(32);
const MASK_64 = (BigInt(1) << SHIFT_32 << SHIFT_32) - BigInt(1);
const FNV_64_OFFSET_BASIS = BigInt('0xcbf29ce484222325');
const FNV_64_PRIME = BigInt('0x100000001b3');

/**
 * FNV-1（32 位）：先乘后异或
 *
 * @param bytes - 输入字节
 * @returns 无符号 32 位哈希
 */
export function fnv1_32(bytes: Uint8Array): number {
  let hash = FNV_32_OFFSET_BASIS;
  for (const byte of bytes) {
    hash = Math.imul(hash, FNV_32_PRIME);
    hash ^= byte;
  }
  return hash >>> 0;
}

/**
 * FNV-1a（32 位）：先异或后乘
 *
 * @param bytes - 输入字节
 * @returns 无符号 32 位哈希
 */
export function fnv1a_32(bytes: Uint8Array): number {
  let hash = FNV_32_OFFSET_BASIS;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_32_PRIME);
  }
  return hash >>> 0;
}

/**
 * 64 位无符号乘法（a * b 模 2^64）
 *
 * 把两个 64 位数拆成高 32 / 低 32 位组合，仅保留低 64 位，
 * 其中中段乘积取 Math.imul 的低 32 位无符号值（高位会被低 64 位窗口丢弃）。
 *
 * @param a - 左侧 64 位无符号整数
 * @param b - 右侧 64 位无符号整数
 * @returns 乘积的低 64 位
 */
function multiply64(a: bigint, b: bigint): bigint {
  const aLow = a & LOW_32_MASK;
  const aHigh = a >> SHIFT_32;
  const bLow = b & LOW_32_MASK;
  const bHigh = b >> SHIFT_32;
  const low = aLow * bLow;
  const middle = (aLow * bHigh + aHigh * bLow) & LOW_32_MASK;
  return (low + (middle << SHIFT_32)) & MASK_64;
}

/**
 * FNV-1（64 位）：先乘后异或
 *
 * @param bytes - 输入字节
 * @returns 无符号 64 位哈希（BigInt）
 */
export function fnv1_64(bytes: Uint8Array): bigint {
  let hash = FNV_64_OFFSET_BASIS;
  for (const byte of bytes) {
    hash = multiply64(hash, FNV_64_PRIME);
    hash ^= BigInt(byte);
  }
  return hash;
}

/**
 * FNV-1a（64 位）：先异或后乘
 *
 * @param bytes - 输入字节
 * @returns 无符号 64 位哈希（BigInt）
 */
export function fnv1a_64(bytes: Uint8Array): bigint {
  let hash = FNV_64_OFFSET_BASIS;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = multiply64(hash, FNV_64_PRIME);
  }
  return hash;
}

/**
 * MurmurHash3（x86 32 位，参见 Appleby 公开参考实现）
 *
 * @param bytes - 输入字节
 * @param seed - 种子，默认 0
 * @returns 无符号 32 位哈希
 */
export function murmurhash3_32(bytes: Uint8Array, seed = DEFAULT_MURMUR_SEED): number {
  const c1 = 0xcc9e2d51 | 0;
  const c2 = 0x1b873593 | 0;
  let h1 = seed | 0;

  const roundedLength = bytes.length - (bytes.length % 4);
  for (let offset = 0; offset < roundedLength; offset += 4) {
    let k1 =
      ((bytes[offset] ?? 0) |
        ((bytes[offset + 1] ?? 0) << 8) |
        ((bytes[offset + 2] ?? 0) << 16) |
        ((bytes[offset + 3] ?? 0) << 24)) |
      0;

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let tail = 0;
  const remainder = bytes.length & 3;
  if (remainder === 3) {
    tail ^= (bytes[roundedLength + 2] ?? 0) << 16;
  }
  if (remainder >= 2) {
    tail ^= (bytes[roundedLength + 1] ?? 0) << 8;
  }
  if (remainder >= 1) {
    tail ^= bytes[roundedLength] ?? 0;
    tail = Math.imul(tail, c1);
    tail = (tail << 15) | (tail >>> 17);
    tail = Math.imul(tail, c2);
    h1 ^= tail;
  }

  h1 ^= bytes.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

/**
 * djb2（Daniel J. Bernstein）：hash = hash * 33 + byte
 *
 * @param bytes - 输入字节
 * @returns 无符号 32 位哈希
 */
export function djb2(bytes: Uint8Array): number {
  let hash = 5381;
  for (const byte of bytes) {
    hash = (Math.imul(hash, 33) + byte) | 0;
  }
  return hash >>> 0;
}
/**
 * sdbm（Berkeley DB SDBM 经典字符串哈希）：hash = byte + (hash << 6) + (hash << 16) - hash
 *
 * @param bytes - 输入字节
 * @returns 无符号 32 位哈希
 */
export function sdbm(bytes: Uint8Array): number {
  let hash = 0;
  for (const byte of bytes) {
    hash = byte + (hash << 6) + (hash << 16) - hash;
    hash |= 0;
  }
  return hash >>> 0;
}

/**
 * Java String.hashCode()：hash = hash * 31 + codeUnit，按 UTF-16 码元累加
 *
 * 注意：为与 Java 行为一致，这里遍历字符串的 UTF-16 码元而非 UTF-8 字节。
 *
 * @param text - 输入文本
 * @returns 有符号 32 位哈希（与 Java 一致，可为负）
 */
export function javaHashCode(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = Math.imul(31, hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return hash;
}

/** 32 位算法展示名 */
export const HASH_NAMES: Record<HashAlgorithmId, string> = {
  'fnv1-32': 'FNV-1（32 位）',
  'fnv1a-32': 'FNV-1a（32 位）',
  'murmurhash3-32': 'MurmurHash3 x86 32 位',
  djb2: 'djb2',
  sdbm: 'sdbm',
  'java-hashcode': 'Java String.hashCode()',
  'fnv1-64': 'FNV-1（64 位）',
  'fnv1a-64': 'FNV-1a（64 位）',
};

/** 全部算法的展示顺序 */
export const HASH_ORDER: HashAlgorithmId[] = [
  'fnv1-32',
  'fnv1a-32',
  'fnv1-64',
  'fnv1a-64',
  'murmurhash3-32',
  'djb2',
  'sdbm',
  'java-hashcode',
];

/**
 * 把 32 位无符号整数格式化为 8 位小写十六进制
 *
 * @param value - 32 位无符号整数
 * @returns 8 位十六进制字符串
 */
function toHex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

/**
 * 把 64 位无符号 BigInt 格式化为 16 位小写十六进制
 *
 * @param value - 64 位无符号整数
 * @returns 16 位十六进制字符串
 */
function toHex64(value: bigint): string {
  return value.toString(16).padStart(16, '0');
}

/**
 * 一次性计算全部非加密哈希
 *
 * @param text - 输入文本（Java hashCode 按 UTF-16 码元，其余算法按 UTF-8 字节）
 * @param seed - MurmurHash3 种子
 * @returns 按 HASH_ORDER 排列的全部算法结果
 */
export function computeAllHashes(text: string, seed = DEFAULT_MURMUR_SEED): HashResult[] {
  const bytes = new TextEncoder().encode(text);
  const values: Record<HashAlgorithmId, { decimal: string; hex: string }> = {
    'fnv1-32': { decimal: String(fnv1_32(bytes)), hex: toHex32(fnv1_32(bytes)) },
    'fnv1a-32': { decimal: String(fnv1a_32(bytes)), hex: toHex32(fnv1a_32(bytes)) },
    'fnv1-64': { decimal: fnv1_64(bytes).toString(), hex: toHex64(fnv1_64(bytes)) },
    'fnv1a-64': { decimal: fnv1a_64(bytes).toString(), hex: toHex64(fnv1a_64(bytes)) },
    'murmurhash3-32': {
      decimal: String(murmurhash3_32(bytes, seed)),
      hex: toHex32(murmurhash3_32(bytes, seed)),
    },
    djb2: { decimal: String(djb2(bytes)), hex: toHex32(djb2(bytes)) },
    sdbm: { decimal: String(sdbm(bytes)), hex: toHex32(sdbm(bytes)) },
    'java-hashcode': {
      decimal: String(javaHashCode(text)),
      hex: toHex32(javaHashCode(text) >>> 0),
    },
  };
  return HASH_ORDER.map((id) => ({ id, name: HASH_NAMES[id], ...values[id] }));
}
