/**
 * Fletcher 系列校验和（Fletcher-16 / 32 / 64）的纯函数实现
 * 参考 Wikipedia "Fletcher's checksum"：每个变体在对应字宽上维护两个累加和
 * S1、S2，模数为 2^width - 1，最终按 (S2 << width) | S1 组合
 */

/** 输入模式 */
export type InputMode = 'text' | 'hex';

/** Fletcher 变体标识 */
export type FletcherVariant = 'fletcher16' | 'fletcher32' | 'fletcher64';

/** 单个变体的计算结果 */
export interface FletcherResult {
  /** 变体标识 */
  key: FletcherVariant;
  /** 展示名称 */
  name: string;
  /** 第一累加和 */
  sum1: number;
  /** 第二累加和 */
  sum2: number;
  /** 组合后的十进制值（64 位变体为 BigInt） */
  value: bigint;
  /** 定长小写十六进制 */
  hex: string;
  /** 十六进制宽度（字符数） */
  hexWidth: number;
}

const BIG_ONE = BigInt(1);
const BIG_ZERO = BigInt(0);
const BIG_EIGHT = BigInt(8);
const BIG_THIRTY_TWO = BigInt(32);
const BIG_SIXTEEN = BigInt(16);
const BIG_EIGHT_AS_SHIFT = BigInt(8);
const FLETCHER64_MODULUS = (BIG_ONE << BIG_THIRTY_TWO) - BIG_ONE;

/**
 * 将文本按 UTF-8 编码为字节序列
 */
export function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/**
 * 解析十六进制字节流：允许空格、逗号、分号、下划线、换行分隔与 0x 前缀；
 * 字符总数必须为偶数，且每个字节在 00-FF 之间
 */
export function parseHexBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,;_-]/g, '');
  if (cleaned.length === 0) {
    return [];
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const pair = cleaned.slice(i, i + 2);
    const byte = parseInt(pair, 16);
    if (Number.isNaN(byte) || byte < 0 || byte > 0xff) {
      throw new Error(`非法字节：${pair}`);
    }
    bytes.push(byte);
  }
  return bytes;
}

/**
 * Fletcher-16：按单字节、模 255 累加
 */
export function fletcher16(bytes: number[]): { sum1: number; sum2: number } {
  let sum1 = 0;
  let sum2 = 0;
  for (const byte of bytes) {
    sum1 = (sum1 + (byte & 0xff)) % 255;
    sum2 = (sum2 + sum1) % 255;
  }
  return { sum1, sum2 };
}

/**
 * Fletcher-32：按 16 位字、模 65535 累加；输入字节数为奇数时末字高字节补零
 */
export function fletcher32(bytes: number[]): { sum1: number; sum2: number } {
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    const low = bytes[i] ?? 0;
    const high = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const word = (low & 0xffff) | (high << 8);
    sum1 = (sum1 + word) % 65535;
    sum2 = (sum2 + sum1) % 65535;
  }
  return { sum1, sum2 };
}

/**
 * Fletcher-64：按 32 位字、模 2^32-1 累加；输入字节数不是 4 的倍数时末字补零
 */
export function fletcher64(bytes: number[]): { sum1: bigint; sum2: bigint } {
  let sum1 = BIG_ZERO;
  let sum2 = BIG_ZERO;
  for (let i = 0; i < bytes.length; i += 4) {
    let word = BIG_ZERO;
    for (let offset = 0; offset < 4; offset += 1) {
      const raw = i + offset < bytes.length ? bytes[i + offset] : undefined;
      const byte = BigInt(raw === undefined ? 0 : raw & 0xff);
      word |= byte << (BIG_EIGHT_AS_SHIFT * BigInt(offset));
    }
    sum1 = (sum1 + word) % FLETCHER64_MODULUS;
    sum2 = (sum2 + sum1) % FLETCHER64_MODULUS;
  }
  return { sum1, sum2 };
}

const VARIANT_META: Record<FletcherVariant, { name: string; hexWidth: number }> = {
  fletcher16: { name: 'Fletcher-16', hexWidth: 4 },
  fletcher32: { name: 'Fletcher-32', hexWidth: 8 },
  fletcher64: { name: 'Fletcher-64', hexWidth: 16 },
};

/**
 * 计算指定变体的 Fletcher 校验和
 */
export function computeFletcher(bytes: number[], variant: FletcherVariant): FletcherResult {
  const meta = VARIANT_META[variant];
  if (variant === 'fletcher16') {
    const { sum1, sum2 } = fletcher16(bytes);
    const value = (BigInt(sum2) << BIG_EIGHT) | BigInt(sum1);
    return {
      key: variant,
      name: meta.name,
      sum1,
      sum2,
      value,
      hex: value.toString(16).padStart(meta.hexWidth, '0'),
      hexWidth: meta.hexWidth,
    };
  }
  if (variant === 'fletcher32') {
    const { sum1, sum2 } = fletcher32(bytes);
    const value = (BigInt(sum2) << BIG_SIXTEEN) | BigInt(sum1);
    return {
      key: variant,
      name: meta.name,
      sum1,
      sum2,
      value,
      hex: value.toString(16).padStart(meta.hexWidth, '0'),
      hexWidth: meta.hexWidth,
    };
  }
  const { sum1, sum2 } = fletcher64(bytes);
  const value = (sum2 << BIG_THIRTY_TWO) | sum1;
  return {
    key: variant,
    name: meta.name,
    sum1: Number(sum1),
    sum2: Number(sum2),
    value,
    hex: value.toString(16).padStart(meta.hexWidth, '0'),
    hexWidth: meta.hexWidth,
  };
}

/**
 * 一次性计算全部三种 Fletcher 变体
 */
export function computeAll(bytes: number[]): FletcherResult[] {
  return (['fletcher16', 'fletcher32', 'fletcher64'] as FletcherVariant[]).map((variant) =>
    computeFletcher(bytes, variant),
  );
}

/**
 * appended checksum 校验：对「原数据 + 追加的校验字节」整体重新计算，
 * 两个累加和同时归零即视为通过（Fletcher 的经典自校验性质）
 */
export function verifyAppended(
  bytes: number[],
  variant: FletcherVariant,
): { valid: boolean; sum1: number; sum2: number } {
  if (variant === 'fletcher16') {
    const { sum1, sum2 } = fletcher16(bytes);
    return { valid: sum1 === 0 && sum2 === 0, sum1, sum2 };
  }
  if (variant === 'fletcher32') {
    const { sum1, sum2 } = fletcher32(bytes);
    return { valid: sum1 === 0 && sum2 === 0, sum1, sum2 };
  }
  const { sum1, sum2 } = fletcher64(bytes);
  return {
    valid: sum1 === BIG_ZERO && sum2 === BIG_ZERO,
    sum1: Number(sum1),
    sum2: Number(sum2),
  };
}
