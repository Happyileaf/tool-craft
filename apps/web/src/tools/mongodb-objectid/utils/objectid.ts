/**
 * MongoDB ObjectId 生成与解析（零新增依赖）
 *
 * ObjectId 为 12 字节（24 位十六进制），布局（大端）：
 *   bytes[0..3]  4 字节 Unix 秒级时间戳
 *   bytes[4..8]  5 字节随机值（传统驱动为 3 字节机器标识 + 2 字节进程标识）
 *   bytes[9..11] 3 字节自增计数器（随机初值）
 *
 * 随机数使用 Web Crypto（crypto.getRandomValues），不访问任何数据库。
 * 本模块不触碰 DOM 与 React，错误以抛出 Error（message 面向用户）的方式返回，
 * 与既有 snowflake-id-parser 等纯函数工具保持一致。
 */

export const OBJECTID_HEX_LENGTH = 24;
export const OBJECTID_BYTE_LENGTH = 12;
export const TIMESTAMP_BYTES = 4;
export const RANDOM_BYTES = 5;
export const COUNTER_BYTES = 3;
export const COUNTER_MAX = 0xffffff;
export const UINT32_MAX = 0xffffffff;

const HEX_PATTERN = /^[0-9a-fA-F]{24}$/;

export interface ObjectIdParts {
  /** 规范化后的小写十六进制 */
  hex: string;
  /** Unix 秒级时间戳 */
  timestampSeconds: number;
  /** Unix 毫秒时间戳（秒 × 1000） */
  timestampMs: number;
  /** 5 字节随机段的十六进制（10 位） */
  randomHex: string;
  /** 传统布局：前 3 字节机器标识的十六进制（6 位） */
  machineHex: string;
  /** 传统布局：后 2 字节进程标识（0–65535） */
  processId: number;
  /** 末 3 字节计数器（0–16777215） */
  counter: number;
}

/** 校验并规范化 ObjectId 十六进制串，返回小写形式 */
export function normalizeObjectId(input: string): string {
  const hex = input.trim().toLowerCase();
  if (hex.length === 0) {
    throw new Error('内容不能为空');
  }
  if (!HEX_PATTERN.test(hex)) {
    throw new Error('ObjectId 必须是 24 位十六进制字符（0-9 / a-f）');
  }
  return hex;
}

/** 解析 ObjectId 为时间戳 / 随机值 / 计数器等组成部分 */
export function parseObjectId(input: string): ObjectIdParts {
  const hex = normalizeObjectId(input);

  const timestampSeconds = parseInt(hex.slice(0, 8), 16);
  const randomHex = hex.slice(8, 18);
  const machineHex = randomHex.slice(0, 6);
  const processId = parseInt(randomHex.slice(6, 10), 16);
  const counter = parseInt(hex.slice(18, 24), 16);

  return {
    hex,
    timestampSeconds,
    timestampMs: timestampSeconds * 1000,
    randomHex,
    machineHex,
    processId,
    counter,
  };
}

/** 把秒级时间戳编码为 8 位十六进制（大端 4 字节） */
function timestampToHex(seconds: number): string {
  return seconds.toString(16).padStart(8, '0');
}

/** 生成 5 字节随机段的 10 位小写十六进制 */
function randomSegmentHex(): string {
  const bytes = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface GenerateOptions {
  /** Unix 秒级时间戳；默认当前时间 */
  timestampSeconds?: number;
  /** 指定 5 字节随机段（10 位十六进制）；默认随机生成 */
  randomHex?: string;
  /** 指定 3 字节计数器（0–16777215）；默认随机生成 */
  counter?: number;
}

/**
 * 生成一个 ObjectId。
 * 时间戳可指定（用于复现），随机段与计数器缺省时由 Web Crypto 生成。
 */
export function generateObjectId(options: GenerateOptions = {}): string {
  const seconds = options.timestampSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > UINT32_MAX) {
    throw new Error('时间戳必须是 0–4294967295 的 Unix 秒级整数');
  }

  let randomHex = options.randomHex;
  if (randomHex === undefined) {
    randomHex = randomSegmentHex();
  } else {
    const normalized = randomHex.trim().toLowerCase();
    if (!/^[0-9a-f]{10}$/.test(normalized)) {
      throw new Error('随机段必须是 10 位十六进制字符（5 字节）');
    }
    randomHex = normalized;
  }

  let counter = options.counter;
  if (counter === undefined) {
    const bytes = new Uint8Array(COUNTER_BYTES);
    crypto.getRandomValues(bytes);
    // 3 字节大端拼合，并屏蔽最高位以保证落在 0–0xffffff
    counter = ((bytes[0]! << 16) | (bytes[1]! << 8) | bytes[2]!) & COUNTER_MAX;
  } else if (!Number.isInteger(counter) || counter < 0 || counter > COUNTER_MAX) {
    throw new Error('计数器必须是 0–16777215（3 字节）的整数');
  }

  const counterHex = counter.toString(16).padStart(6, '0');
  return `${timestampToHex(seconds)}${randomHex}${counterHex}`;
}

/**
 * 批量生成 ObjectId：同一批共享时间戳与随机段，计数器连续递增（模拟同一进程），
 * 到达 0xffffff 后回绕到 0。
 */
export function generateObjectIdBatch(count: number, timestampSeconds?: number): string[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('生成数量必须是正整数');
  }
  if (count > 1000) {
    throw new Error('单次最多生成 1000 个 ObjectId');
  }
  const seconds = timestampSeconds ?? Math.floor(Date.now() / 1000);
  const randomHex = randomSegmentHex();
  const seedBytes = new Uint8Array(COUNTER_BYTES);
  crypto.getRandomValues(seedBytes);
  let current =
    ((seedBytes[0]! << 16) | (seedBytes[1]! << 8) | seedBytes[2]!) & COUNTER_MAX;

  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    ids.push(
      `${timestampToHex(seconds)}${randomHex}${current.toString(16).padStart(6, '0')}`,
    );
    current = current >= COUNTER_MAX ? 0 : current + 1;
  }
  return ids;
}
