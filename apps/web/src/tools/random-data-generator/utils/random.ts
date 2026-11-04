import {
  EMAIL_DOMAINS,
  FIRST_NAMES,
  LAST_NAMES,
  LOREM_WORDS,
  PHONE_PREFIXES,
  WORDS,
} from './word-bank';
import { MAX_DECIMALS } from '../constants';

/**
 * 使用加密安全随机源返回 [0, max) 区间内的整数
 *
 * 采用拒绝采样消除取模偏差，max 上限为 2^32
 *
 * @param max - 上界（不含），必须为正整数
 * @returns [0, max) 区间内的随机整数
 */
export function randomInt(max: number): number {
  const limit = Math.floor(max);
  if (limit <= 0) {
    throw new Error('randomInt 的上界必须为正整数');
  }
  const maxUint32 = 0x100000000;
  // 能被 limit 整除的最大阈值，落在阈值外的采样丢弃以消除偏差
  const threshold = maxUint32 - (maxUint32 % limit);
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= threshold);
  return value % limit;
}

/**
 * 从数组中随机选取一个元素
 *
 * @param list - 非空候选数组
 * @returns 随机选中的元素
 */
export function pickOne<T>(list: readonly T[]): T {
  if (list.length === 0) {
    throw new Error('pickOne 的候选数组不能为空');
  }
  const selected = list[randomInt(list.length)];
  if (selected === undefined) {
    throw new Error('pickOne 选取结果为空');
  }
  return selected;
}

/**
 * 生成 [min, max] 闭区间内的随机整数
 *
 * @param min - 下限（含）
 * @param max - 上限（含）
 * @returns 区间内随机整数
 */
export function randomIntegerInRange(min: number, max: number): number {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return lower + randomInt(upper - lower + 1);
}

/**
 * 生成 [min, max) 区间内的随机浮点数并保留指定小数位
 *
 * @param min - 下限（含）
 * @param max - 上限（不含）
 * @param decimals - 保留小数位，范围 0-10
 * @returns 四舍五入到指定小数位的随机浮点数
 */
export function randomFloatInRange(
  min: number,
  max: number,
  decimals: number,
): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const clampedDecimals = Math.min(
    MAX_DECIMALS,
    Math.max(0, Math.floor(decimals)),
  );
  const span = upper - lower;
  // 用 32 位随机值归一化得到 [0,1) 因子，精度足以覆盖常见模拟场景
  const factor = randomInt(0x100000000) / 0x100000000;
  const value = lower + factor * span;
  const factor10 = 10 ** clampedDecimals;
  return Math.round(value * factor10) / factor10;
}

/**
 * 生成随机布尔值
 *
 * @returns true 或 false，概率各半
 */
export function randomBoolean(): boolean {
  return randomInt(2) === 1;
}

/**
 * 生成 #rrggbb 形式的随机十六进制颜色
 *
 * @returns 小写十六进制颜色字符串
 */
export function randomHexColor(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return (
    '#' +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * 生成 rgb(r, g, b) 形式的随机颜色
 *
 * @returns RGB 颜色字符串
 */
export function randomRgbColor(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const [r = 0, g = 0, b = 0] = Array.from(bytes);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 生成符合 RFC 4122 的版本 4 UUID
 *
 * 通过 crypto.randomUUID 生成，在不支持的环境回退到手写 v4 实现
 *
 * @returns 标准 UUID v4 字符串
 */
export function randomUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // 设置 version(4) 与 variant(10xx) 位
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((byte) =>
    byte.toString(16).padStart(2, '0'),
  );
  return `${hex.slice(0, 4).join('')}-${hex
    .slice(4, 6)
    .join('')}-${hex.slice(6, 8).join('')}-${hex
    .slice(8, 10)
    .join('')}-${hex.slice(10, 16).join('')}`;
}

/**
 * 生成随机英文姓名（名 + 姓）
 *
 * @returns 形如 "Mary Smith" 的姓名
 */
export function randomName(): string {
  return `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`;
}

/**
 * 生成随机电子邮箱地址
 *
 * @returns 形如 james.smith12@gmail.com 的邮箱
 */
export function randomEmail(): string {
  const local = `${pickOne(FIRST_NAMES)}.${pickOne(LAST_NAMES)}${randomInt(1000)}`.toLowerCase();
  return `${local}@${pickOne(EMAIL_DOMAINS)}`;
}

/**
 * 生成随机中国大陆手机号
 *
 * @returns 11 位手机号字符串
 */
export function randomPhone(): string {
  const prefix = pickOne(PHONE_PREFIXES);
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += String(randomInt(10));
  }
  return `${prefix}${suffix}`;
}

/**
 * 生成随机英文单词
 *
 * @returns 词库中的随机单词
 */
export function randomWord(): string {
  return pickOne(WORDS);
}

/**
 * 生成指定句数的 Lorem ipsum 段落，每句以大写开头并以句号结尾
 *
 * @param sentenceCount - 段落包含的句子数量
 * @returns 单个段落字符串
 */
export function randomParagraph(sentenceCount: number): string {
  const count = Math.max(1, Math.floor(sentenceCount));
  const sentences: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const wordCount = randomIntegerInRange(6, 12);
    const words: string[] = [];
    for (let j = 0; j < wordCount; j += 1) {
      words.push(pickOne(LOREM_WORDS));
    }
    const sentence = words.join(' ');
    sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
  }
  return sentences.join(' ');
}

/**
 * 生成 [start, end) 区间内的随机 ISO 日期时间字符串
 *
 * @param start - 时间范围下限
 * @param end - 时间范围上限
 * @returns ISO 8601 字符串
 */
export function randomDateTime(start: Date, end: Date): string {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const span = Math.max(0, endTime - startTime);
  const offset = Math.floor(randomInt(0x100000000) / 0x100000000 * span);
  return new Date(startTime + offset).toISOString();
}
