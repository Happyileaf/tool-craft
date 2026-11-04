/**
 * 位掩码纯函数集合
 *
 * 使用 BigInt 承载最多 64 位掩码，全部函数不触碰 DOM / React，
 * 可在 Vitest 中直接验收。位编号从 0（最低位 LSB）开始。
 */

/** 支持的位宽 */
export type BitWidth = 8 | 16 | 32 | 64;

/** 双掩码位运算类型 */
export type BinaryOp = 'and' | 'or' | 'xor';

/** 移位类型 */
export type ShiftOp = 'shl' | 'shr-logical' | 'shr-arithmetic' | 'rotl' | 'rotr';

/**
 * 解析十进制、0x 十六进制、0o 八进制或二进制（0b / 裸位串）整数
 *
 * @param input - 用户输入
 * @param width - 当前位宽，用于溢出判断
 * @returns 解析后的非负 BigInt
 * @throws 空输入、非法格式或超出位宽时抛出错误
 */
export function parseMask(input: string, width: BitWidth): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('输入不能为空');
  }
  const normalized = trimmed.replace(/^\+/, '');
  let value: bigint;
  if (/^0[xX][0-9a-fA-F]+$/.test(normalized)) {
    value = BigInt(normalized);
  } else if (/^0[oO][0-7]+$/.test(normalized)) {
    value = BigInt(normalized);
  } else if (/^0[bB][01]+$/.test(normalized)) {
    value = BigInt(normalized);
  } else if (/^[01]+$/.test(normalized) && normalized.length > 1) {
    // 裸二进制位串
    value = BigInt(`0b${normalized}`);
  } else if (/^\d+$/.test(normalized)) {
    value = BigInt(normalized);
  } else {
    throw new Error(
      `无法解析：${trimmed}（支持十进制、0x 十六进制、0o 八进制、0b 二进制）`,
    );
  }
  if (value < BigInt(0)) {
    throw new Error('掩码不支持负数，请使用无符号输入');
  }
  if (value >= BigInt(1) << BigInt(width)) {
    throw new Error(`数值超出 ${width} 位无符号范围（0 ~ 2^${width} - 1）`);
  }
  return value;
}

/** 位宽对应的全 1 掩码 */
export function maxMask(width: BitWidth): bigint {
  return (BigInt(1) << BigInt(width)) - BigInt(1);
}

/** 把数值规范化到位宽内（高位截断） */
export function normalize(value: bigint, width: BitWidth): bigint {
  return value & maxMask(width);
}

/** 置位 set：返回将第 bit 位设为 1 的新掩码 */
export function setBit(mask: bigint, bit: number, width: BitWidth): bigint {
  assertBitIndex(bit, width);
  return normalize(mask | (BigInt(1) << BigInt(bit)), width);
}

/** 清位 clear：返回将第 bit 位设为 0 的新掩码 */
export function clearBit(mask: bigint, bit: number, width: BitWidth): bigint {
  assertBitIndex(bit, width);
  return normalize(mask & ~(BigInt(1) << BigInt(bit)), width);
}

/** 翻转 toggle：返回第 bit 位取反后的新掩码 */
export function toggleBit(mask: bigint, bit: number, width: BitWidth): bigint {
  assertBitIndex(bit, width);
  return normalize(mask ^ (BigInt(1) << BigInt(bit)), width);
}

/** 测试 test：第 bit 位是否为 1 */
export function testBit(mask: bigint, bit: number, width: BitWidth): boolean {
  assertBitIndex(bit, width);
  return ((mask >> BigInt(bit)) & BigInt(1)) === BigInt(1);
}

/** 双掩码运算 AND / OR / XOR */
export function binaryOp(
  left: bigint,
  right: bigint,
  op: BinaryOp,
  width: BitWidth,
): bigint {
  if (op === 'and') {
    return normalize(left & right, width);
  }
  if (op === 'or') {
    return normalize(left | right, width);
  }
  return normalize(left ^ right, width);
}

/** 按位取反 NOT（位宽内） */
export function notOp(mask: bigint, width: BitWidth): bigint {
  return normalize(~mask, width);
}

/** 与非 NAND（位宽内） */
export function nandOp(left: bigint, right: bigint, width: BitWidth): bigint {
  return notOp(left & right, width);
}

/**
 * 移位与循环移位
 *
 * @param mask - 输入掩码
 * @param amount - 移动位数（非负整数）
 * @param op - shl / shr-logical / shr-arithmetic / rotl / rotr
 * @param width - 位宽
 * @returns 位宽内规范化结果
 */
export function shift(
  mask: bigint,
  amount: number,
  op: ShiftOp,
  width: BitWidth,
): bigint {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('移位位数必须为非负整数');
  }
  const shiftAmount = BigInt(amount);
  const widthBig = BigInt(width);
  const normalizedMask = normalize(mask, width);

  switch (op) {
    case 'shl':
      return normalize(normalizedMask << shiftAmount, width);
    case 'shr-logical':
      return normalizedMask >> shiftAmount;
    case 'shr-arithmetic': {
      // 先转二补码有符号值，再做算术右移，最后解释回无符号
      const signed = toSigned(normalizedMask, width);
      const shifted = signed >> shiftAmount;
      return fromSigned(shifted, width);
    }
    case 'rotl': {
      if (amount === 0) {
        return normalizedMask;
      }
      const k = shiftAmount % widthBig;
      return normalize(
        ((normalizedMask << k) | (normalizedMask >> (widthBig - k))) & maxMask(width),
        width,
      );
    }
    case 'rotr': {
      if (amount === 0) {
        return normalizedMask;
      }
      const k = shiftAmount % widthBig;
      return (
        ((normalizedMask >> k) | (normalizedMask << (widthBig - k))) & maxMask(width)
      );
    }
    default:
      throw new Error(`未知移位类型：${op as string}`);
  }
}

/** 最高有效位编号（从 0 开始），全 0 返回 -1 */
export function msbIndex(mask: bigint): number {
  if (mask === BigInt(0)) {
    return -1;
  }
  return mask.toString(2).length - 1;
}

/** 最低有效位编号（从 0 开始），全 0 返回 -1 */
export function lsbIndex(mask: bigint): number {
  if (mask === BigInt(0)) {
    return -1;
  }
  let index = 0;
  let current = mask;
  while ((current & BigInt(1)) === BigInt(0)) {
    current >>= BigInt(1);
    index += 1;
  }
  return index;
}

/** 置位（1）的个数，即 popcount / Hamming weight */
export function popCount(mask: bigint): number {
  let count = 0;
  let current = mask;
  while (current > BigInt(0)) {
    current &= current - BigInt(1);
    count += 1;
  }
  return count;
}

/** 无符号转有符号（二补码解释） */
export function toSigned(mask: bigint, width: BitWidth): bigint {
  const normalized = normalize(mask, width);
  const signBit = BigInt(1) << BigInt(width - 1);
  if ((normalized & signBit) === BigInt(0)) {
    return normalized;
  }
  return normalized - (BigInt(1) << BigInt(width));
}

/** 有符号值解释回位宽内无符号表示 */
export function fromSigned(value: bigint, width: BitWidth): bigint {
  return normalize(value, width);
}

/** 转指定位宽的二进制字符串（含前导零），高位在前 */
export function toBinaryString(mask: bigint, width: BitWidth): string {
  const normalized = normalize(mask, width);
  return normalized.toString(2).padStart(width, '0');
}

/** 转八进制字符串（不带 0o 前缀） */
export function toOctalString(mask: bigint): string {
  return mask.toString(8);
}

/** 转十六进制字符串（不带 0x 前缀，大写） */
export function toHexString(mask: bigint): string {
  return mask.toString(16).toUpperCase();
}

/** 校验位编号在当前位宽内 */
function assertBitIndex(bit: number, width: BitWidth): void {
  if (!Number.isInteger(bit) || bit < 0 || bit >= width) {
    throw new Error(`位编号必须在 0 ~ ${width - 1} 之间`);
  }
}
