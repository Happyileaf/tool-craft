/**
 * 基于 Web Crypto CSPRNG 的无偏随机选择与排列纯函数
 *
 * 所有随机数均来自 crypto.getRandomValues，并通过拒绝采样消除
 * 「区间长度不是 2^32 因子」时的取模偏置。
 */

/** 可注入的 32 位无符号随机数来源，便于单元测试 */
export type RandomSource = () => number;

/**
 * 默认随机源：crypto.getRandomValues 取一个 Uint32
 *
 * @returns [0, 2^32-1] 区间内的安全随机整数
 */
export const cryptoRandomUint32: RandomSource = () => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] ?? 0;
};

/**
 * 返回 [0, upper) 区间内的无偏随机整数（拒绝采样）
 *
 * @param upper - 上界（不含），必须为 1..2^32 的安全整数
 * @param random - 随机源，默认使用 CSPRNG
 * @returns 区间内的随机整数
 */
export function randomIntBelow(
  upper: number,
  random: RandomSource = cryptoRandomUint32,
): number {
  if (!Number.isSafeInteger(upper) || upper <= 0 || upper > 0x100000000) {
    throw new Error('上界必须是 1..2^32 之间的安全整数');
  }
  if (upper === 0x100000000) {
    return random();
  }
  // 拒绝大于等于 threshold 的取值，保证每个结果等概率
  const threshold = upper * Math.floor(0x100000000 / upper);
  let value = random();
  while (value >= threshold) {
    value = random();
  }
  return value % upper;
}

/**
 * 返回闭区间 [min, max] 内的无偏随机整数
 *
 * @param min - 最小值（含）
 * @param max - 最大值（含）
 * @param random - 随机源
 * @returns 区间内的随机整数
 */
export function randomIntInRange(
  min: number,
  max: number,
  random: RandomSource = cryptoRandomUint32,
): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) {
    throw new Error('需要两个满足 min <= max 的安全整数');
  }
  const span = max - min + 1;
  if (span > 0x100000000) {
    throw new Error('区间宽度不能超过 2^32');
  }
  return min + randomIntBelow(span, random);
}

/**
 * 生成 n 个闭区间 [min, max] 内的随机整数
 *
 * @param min - 最小值（含）
 * @param max - 最大值（含）
 * @param count - 生成数量
 * @param allowDuplicates - 是否允许重复，默认允许
 * @param random - 随机源
 * @returns 随机整数数组
 */
export function randomIntegers(
  min: number,
  max: number,
  count: number,
  allowDuplicates = true,
  random: RandomSource = cryptoRandomUint32,
): number[] {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new Error('数量必须是正整数');
  }
  const span = max - min + 1;
  if (!allowDuplicates && count > span) {
    throw new Error('不重复模式下数量不能超过区间内整数个数');
  }
  if (allowDuplicates) {
    const result: number[] = [];
    for (let i = 0; i < count; i += 1) {
      result.push(randomIntInRange(min, max, random));
    }
    return result;
  }
  // 不重复：对整个区间洗牌取前 count 个（部分 Fisher–Yates）
  const pool: number[] = [];
  for (let value = min; value <= max; value += 1) {
    pool.push(value);
  }
  for (let i = 0; i < count; i += 1) {
    const j = i + randomIntBelow(pool.length - i, random);
    const picked: number = pool[j] as number;
    pool[j] = pool[i] as number;
    pool[i] = picked;
  }
  return pool.slice(0, count);
}

/**
 * Fisher–Yates 洗牌（无偏），返回新数组，不修改入参
 *
 * @param items - 待洗牌列表
 * @param random - 随机源
 * @returns 洗牌后的新数组
 */
export function shuffle<T>(
  items: readonly T[],
  random: RandomSource = cryptoRandomUint32,
): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomIntBelow(i + 1, random);
    const picked: T = result[j] as T;
    result[j] = result[i] as T;
    result[i] = picked;
  }
  return result;
}

/**
 * 从列表中不放回抽取 k 个元素
 *
 * @param items - 候选列表
 * @param k - 抽取数量
 * @param random - 随机源
 * @returns 抽中的元素数组（随机顺序）
 */
export function sampleItems<T>(
  items: readonly T[],
  k: number,
  random: RandomSource = cryptoRandomUint32,
): T[] {
  if (!Number.isSafeInteger(k) || k < 0) {
    throw new Error('抽取数量必须是非负整数');
  }
  if (k > items.length) {
    throw new Error('抽取数量不能超过候选数量');
  }
  return shuffle(items, random).slice(0, k);
}

/**
 * 将列表随机均分为指定组数，组大小相差至多 1（前若干组多 1 个）
 *
 * @param items - 待分组列表
 * @param groupCount - 组数
 * @param random - 随机源
 * @returns 分组后的二维数组
 */
export function splitIntoGroups<T>(
  items: readonly T[],
  groupCount: number,
  random: RandomSource = cryptoRandomUint32,
): T[][] {
  if (!Number.isSafeInteger(groupCount) || groupCount <= 0) {
    throw new Error('组数必须是正整数');
  }
  if (groupCount > items.length) {
    throw new Error('组数不能超过元素数量');
  }
  const shuffled = shuffle(items, random);
  const baseSize = Math.floor(shuffled.length / groupCount);
  const remainder = shuffled.length % groupCount;
  const groups: T[][] = [];
  let offset = 0;
  for (let g = 0; g < groupCount; g += 1) {
    const size = baseSize + (g < remainder ? 1 : 0);
    groups.push(shuffled.slice(offset, offset + size));
    offset += size;
  }
  return groups;
}

/**
 * 将多行文本解析为去空白行的候选条目（行内空白保留）
 *
 * @param text - 原始文本
 * @returns 非空行数组
 */
export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
