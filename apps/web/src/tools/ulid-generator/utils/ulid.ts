/**
 * ULID（Universally Unique Lexicographically Sortable Identifier）生成与解析的纯函数实现，
 * 不依赖 DOM 与 React。遵循 ULID 规范：Crockford Base32（排除 I/L/O/U）、
 * 26 字符 = 10 字符毫秒时间戳（48 位）+ 16 字符随机段（80 位）；
 * 同一毫秒内随机段单调递增以保证字典序，随机字节来自可注入的随机源（默认 Web Crypto）。
 */

/** Crockford Base32 字母表（ULID 规范，不含 I、L、O、U） */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 字符 → 数值反查表 */
const CHAR_VALUE: Record<string, number> = Object.fromEntries(
  [...CROCKFORD_ALPHABET].map((char, index) => [char, index]),
);

/** ULID 总长度 */
export const ULID_LENGTH = 26;

/** 时间戳段长度（字符） */
export const TIME_LENGTH = 10;

/** 随机段长度（字符） */
export const RANDOM_LENGTH = 16;

/** Base32 基数 */
const ENCODING_BASE = 32;

/** 随机段字节数（80 位 = 10 字节） */
const RANDOM_BYTES = 10;

/** 48 位毫秒时间戳上界（2^48 - 1） */
export const TIME_MAX = 281474976710655;

/** 合法 ULID 正则：26 个 Crockford 字符 */
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** 随机字节提供器：返回指定长度的随机字节，便于注入固定向量测试 */
export type RandomBytesProvider = (length: number) => Uint8Array;

/**
 * 基于 Web Crypto 的密码学安全随机字节提供器
 *
 * @param length - 需要的字节数
 * @returns 填充随机字节的 Uint8Array
 */
export function createSecureRandomBytes(length: number = RANDOM_BYTES): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * 把毫秒时间戳编码为 10 字符 Crockford Base32
 *
 * @param timestamp - 毫秒时间戳
 * @returns 10 字符时间戳段
 */
export function encodeTime(timestamp: number): string {
  if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > TIME_MAX) {
    throw new Error(`时间戳必须是 0–${TIME_MAX}（2^48-1）之间的整数毫秒值`);
  }
  let remaining = timestamp;
  let output = '';
  for (let index = TIME_LENGTH - 1; index >= 0; index -= 1) {
    const mod = remaining % ENCODING_BASE;
    output = (CROCKFORD_ALPHABET[mod] ?? '') + output;
    remaining = (remaining - mod) / ENCODING_BASE;
  }
  return output;
}

/**
 * 把 10 个随机字节（80 位）编码为 16 字符 Base32，按 5 位一组精确切分，无取模偏置
 *
 * @param bytes - 恰好 10 字节的随机数据
 * @returns 16 字符随机段
 */
export function encodeRandom(bytes: Uint8Array = createSecureRandomBytes()): string {
  if (bytes.length !== RANDOM_BYTES) {
    throw new Error(`随机段需要恰好 ${RANDOM_BYTES} 个字节`);
  }
  let bitBuffer = 0;
  let bitCount = 0;
  let output = '';
  for (const byte of bytes) {
    bitBuffer = (bitBuffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += CROCKFORD_ALPHABET[(bitBuffer >> bitCount) & 31] ?? '';
    }
  }
  return output;
}

/**
 * 把 16 字符 Base32 随机段视为 80 位整数做加一，溢出时抛错。
 * 进位规则：从最右字符开始，超出字母表末尾则归零并向左进位。
 *
 * @param random - 当前随机段
 * @returns 加一后的随机段
 */
export function incrementRandom(random: string): string {
  const chars = [...random];
  let index = chars.length - 1;
  while (index >= 0 && chars[index] === CROCKFORD_ALPHABET[ENCODING_BASE - 1]) {
    index -= 1;
  }
  if (index < 0) {
    throw new Error('同一毫秒内随机段已全部进位到上界，无法继续单调递增');
  }
  const currentValue = CHAR_VALUE[chars[index] ?? ''] ?? 0;
  chars[index] = CROCKFORD_ALPHABET[currentValue + 1] ?? '0';
  for (let cursor = index + 1; cursor < chars.length; cursor += 1) {
    chars[cursor] = CROCKFORD_ALPHABET[0] ?? '0';
  }
  return chars.join('');
}

/**
 * 单调 ULID 生成器工厂。时间戳前进时重新抽取随机段；
 * 同一毫秒内对随机段加一保证严格递增；时钟回拨（时间戳变小）抛错。
 *
 * @param randomBytes - 可注入的随机字节提供器
 * @returns 接收可选毫秒时间戳、返回 ULID 的生成函数
 */
export function createMonotonicUlidFactory(
  randomBytes: RandomBytesProvider = createSecureRandomBytes,
): (timestamp?: number) => string {
  let lastTime = -1;
  let lastRandom = '';

  return (timestamp?: number) => {
    const now = timestamp ?? Date.now();
    if (now < lastTime) {
      throw new Error('时间戳小于上一次生成，单调序列不允许时钟回拨');
    }
    if (now > lastTime) {
      lastTime = now;
      lastRandom = encodeRandom(randomBytes(RANDOM_BYTES));
    } else {
      lastRandom = incrementRandom(lastRandom);
    }
    return encodeTime(lastTime) + lastRandom;
  };
}

/**
 * 生成单个 ULID
 *
 * @param timestamp - 可选毫秒时间戳，默认当前时间
 * @param randomBytes - 可注入的随机字节提供器
 * @returns 26 字符 ULID
 */
export function generateUlid(
  timestamp?: number,
  randomBytes: RandomBytesProvider = createSecureRandomBytes,
): string {
  const time = timestamp ?? Date.now();
  return encodeTime(time) + encodeRandom(randomBytes(RANDOM_BYTES));
}

/**
 * 批量生成 ULID，结果严格按字典序升序。
 * 不指定时间戳时按真实时间生成；指定时间戳时全部落在该毫秒，随机段单调递增。
 *
 * @param count - 生成数量（1–500）
 * @param timestamp - 可选固定毫秒时间戳
 * @returns 升序排列的 ULID 数组
 */
export function generateUlidBatch(count: number, timestamp?: number): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    throw new Error('生成数量必须是 1–500 之间的整数');
  }
  const next = createMonotonicUlidFactory();
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    ids.push(next(timestamp));
  }
  return ids;
}

/** ULID 解析结果 */
export interface UlidParts {
  /** 毫秒时间戳 */
  timestamp: number;
  /** 10 字符时间戳段 */
  timePart: string;
  /** 16 字符随机段 */
  randomPart: string;
  /** 随机段对应的 20 位十六进制（80 位） */
  randomHex: string;
}

/**
 * 解析 ULID，校验长度与 Crockford 字符集并反解时间戳与随机段。
 *
 * @param input - 待解析的 ULID（容忍首尾空白，大小写不敏感）
 * @returns 时间戳、分段与随机段十六进制
 */
export function parseUlid(input: string): UlidParts {
  const normalized = input.trim().toUpperCase();
  if (normalized.length === 0) {
    throw new Error('请输入需要解析的 ULID');
  }
  if (normalized.length !== ULID_LENGTH) {
    throw new Error(`ULID 长度必须为 ${ULID_LENGTH} 个字符，当前为 ${normalized.length} 个`);
  }
  if (!ULID_PATTERN.test(normalized)) {
    throw new Error('包含非法字符：ULID 仅允许 Crockford Base32 字符（0-9A-Z，且不含 I、L、O、U）');
  }

  const timePart = normalized.slice(0, TIME_LENGTH);
  const randomPart = normalized.slice(TIME_LENGTH);

  let timestamp = 0;
  for (const char of timePart) {
    timestamp = timestamp * ENCODING_BASE + (CHAR_VALUE[char] ?? 0);
  }
  if (timestamp > TIME_MAX) {
    throw new Error('时间戳段超出 48 位范围（大于 2^48-1），不是合法 ULID');
  }

  let bitBuffer = 0;
  let bitCount = 0;
  const bytes: number[] = [];
  for (const char of randomPart) {
    bitBuffer = (bitBuffer << 5) | (CHAR_VALUE[char] ?? 0);
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((bitBuffer >> bitCount) & 0xff);
    }
  }
  const randomHex = bytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return { timestamp, timePart, randomPart, randomHex };
}
