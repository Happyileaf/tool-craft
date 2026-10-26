/**
 * Nano ID 风格随机标识符生成的纯函数实现，不依赖 DOM 与 React。
 * 默认字母表 A-Za-z0-9_-（URL/HTML id 友好），随机源可注入以便用固定向量测试；
 * 通过拒绝采样（rejection sampling）消除取模偏置，保证字母表内每个字符等概率。
 */

/** Nano ID 默认字母表（与官方 nano-id 的 urlAlphabet 一致，64 字符） */
export const DEFAULT_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Nano ID 默认长度（与官方 nano-id 默认值一致） */
export const DEFAULT_SIZE = 21;

/** 单次生成允许的最大长度，防止误填超大值拖死页面 */
export const MAX_SIZE = 1000;

/** 自定义字母表允许的字符数范围 */
const MIN_ALPHABET_LENGTH = 1;
const MAX_ALPHABET_LENGTH = 256;

/** 随机字节提供器：返回一个 0–255 的整数，便于注入固定向量 */
export type RandomByteProvider = () => number;

/**
 * 基于 Web Crypto 的密码学安全随机字节提供器。
 * 内部维护一个缓冲池，用完再向 getRandomValues 批量取字节，减少调用次数。
 *
 * @returns 随机字节提供器函数
 */
export function createSecureRandomByteProvider(): RandomByteProvider {
  const poolSize = 256;
  let pool = new Uint8Array(0);
  let cursor = 0;

  return () => {
    if (cursor >= pool.length) {
      pool = new Uint8Array(poolSize);
      globalThis.crypto.getRandomValues(pool);
      cursor = 0;
    }
    const byte = pool[cursor] ?? 0;
    cursor += 1;
    return byte;
  };
}

/**
 * 生成单个 Nano ID
 *
 * @param size - ID 长度（1–1000），默认 21
 * @param alphabet - 自定义字母表（1–256 个非重复字符），默认 urlAlphabet
 * @param randomByte - 可注入的随机字节提供器，默认使用 Web Crypto
 * @returns 指定长度的随机标识符
 */
export function generateNanoId(
  size: number = DEFAULT_SIZE,
  alphabet: string = DEFAULT_ALPHABET,
  randomByte: RandomByteProvider = createSecureRandomByteProvider(),
): string {
  if (!Number.isInteger(size) || size < 1 || size > MAX_SIZE) {
    throw new Error(`ID 长度必须是 1–${MAX_SIZE} 之间的整数`);
  }

  const chars = [...alphabet];
  if (chars.length < MIN_ALPHABET_LENGTH || chars.length > MAX_ALPHABET_LENGTH) {
    throw new Error(`字母表字符数必须在 ${MIN_ALPHABET_LENGTH}–${MAX_ALPHABET_LENGTH} 之间`);
  }
  if (new Set(chars).size !== chars.length) {
    throw new Error('字母表中不能包含重复字符');
  }

  // 拒绝采样上界：256 中能被字符数整除的最大段长度，落在此值及以上的字节重抽
  const maskLength = 256 - (256 % chars.length);

  let id = '';
  while ([...id].length < size) {
    const byte = randomByte();
    if (byte >= maskLength) {
      continue;
    }
    id += chars[byte % chars.length] ?? '';
  }
  return id;
}

/**
 * 批量生成多个 Nano ID
 *
 * @param count - 生成数量（1–1000）
 * @param size - 单个 ID 长度
 * @param alphabet - 自定义字母表
 * @param randomByte - 可注入的随机字节提供器
 * @returns Nano ID 数组
 */
export function generateNanoIdBatch(
  count: number,
  size: number = DEFAULT_SIZE,
  alphabet: string = DEFAULT_ALPHABET,
  randomByte: RandomByteProvider = createSecureRandomByteProvider(),
): string[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_SIZE) {
    throw new Error(`生成数量必须是 1–${MAX_SIZE} 之间的整数`);
  }
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    ids.push(generateNanoId(size, alphabet, randomByte));
  }
  return ids;
}
