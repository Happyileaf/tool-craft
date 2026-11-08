/**
 * 通用 CRC 参数化计算引擎（BigInt 实现，覆盖 width 1–64）
 *
 * 支持任意 width、poly、init、refIn、refOut、xorOut 组合，
 * 与 catalogue/crc.com 的 Rocksoft™ 参数模型一致。
 */

/** CRC 参数模型 */
export interface CrcModel {
  /** 模型名称 */
  name: string;
  /** 位宽（1–64） */
  width: number;
  /** 生成多项式（省略最高位的正常表示，BigInt） */
  poly: bigint;
  /** 寄存器初始值 */
  init: bigint;
  /** 输入字节是否按位反转 */
  refIn: boolean;
  /** 结果输出前是否按位反转 */
  refOut: boolean;
  /** 最终异或值 */
  xorOut: bigint;
  /** 校验常量：ASCII "123456789" 的 CRC 结果，用于自检 */
  check: bigint;
}

/** 指定位宽下的全 1 掩码 */
function mask(width: number): bigint {
  return (BigInt(1) << BigInt(width)) - BigInt(1);
}

/**
 * 反转 value 的低 bitCount 位
 *
 * @param value - 待反转的非负整数
 * @param bitCount - 参与反转的位数
 * @returns 反转后的整数
 */
export function reverseBits(value: bigint, bitCount: number): bigint {
  let result = BigInt(0);
  let current = value;
  for (let index = 0; index < bitCount; index += 1) {
    result = (result << BigInt(1)) | (current & BigInt(1));
    current >>= BigInt(1);
  }
  return result;
}

/** 反转单个字节的 8 位 */
function reverseByte(byte: number): number {
  let value = byte;
  let result = 0;
  for (let index = 0; index < 8; index += 1) {
    result = (result << 1) | (value & 1);
    value >>= 1;
  }
  return result;
}

/**
 * 计算字节序列的 CRC
 *
 * @param data - 输入字节数组
 * @param model - CRC 参数模型
 * @returns CRC 值（已应用 refOut 与 xorOut）
 */
export function computeCrc(data: Uint8Array, model: CrcModel): bigint {
  const bitMask = mask(model.width);
  const topBit = BigInt(1) << BigInt(model.width - 1);
  let register = model.init & bitMask;

  for (const rawByte of data) {
    const byte = model.refIn ? reverseByte(rawByte) : rawByte;
    register ^= BigInt(byte) << BigInt(model.width - 8);
    for (let bit = 0; bit < 8; bit += 1) {
      if ((register & topBit) !== BigInt(0)) {
        register = ((register << BigInt(1)) ^ model.poly) & bitMask;
      } else {
        register = (register << BigInt(1)) & bitMask;
      }
    }
  }

  if (model.refOut) {
    register = reverseBits(register, model.width);
  }
  return (register ^ model.xorOut) & bitMask;
}

/**
 * 将 CRC 值格式化为固定位宽的大写十六进制字符串（不带 0x 前缀）
 *
 * @param value - CRC 值
 * @param width - 位宽，决定十六进制字符数
 * @returns 如 width=16 → "0BB3"
 */
export function formatCrcHex(value: bigint, width: number): string {
  const hexChars = Math.ceil(width / 4);
  return value.toString(16).toUpperCase().padStart(hexChars, '0');
}

/**
 * 解析十六进制字符串为字节数组
 *
 * @param hex - 形如 "48 65 6C"、"48656C"、"0x48,0x6C" 的文本
 * @returns 字节数组
 */
export function parseHexBytes(hex: string): Uint8Array {
  const cleaned = hex
    .replace(/0x/gi, '')
    .replace(/[,，\s]/g, '');
  if (cleaned === '') {
    return new Uint8Array();
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error('十六进制输入必须由偶数个 0-9a-f 字符组成');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/** UTF-8 文本编码为字节数组 */
export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * 用标准校验串 "123456789" 验证模型参数
 *
 * @param model - 待验证模型
 * @returns 计算值与 check 字段是否一致
 */
export function verifyModel(model: CrcModel): { computed: bigint; expected: bigint; ok: boolean } {
  const checkInput = encodeUtf8('123456789');
  const computed = computeCrc(checkInput, model);
  return { computed, expected: model.check, ok: computed === model.check };
}
