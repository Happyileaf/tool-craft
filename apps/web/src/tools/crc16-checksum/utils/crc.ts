/**
 * CRC-16 参数化实现与 Adler-32 校验和的纯函数模块
 * 参数模型参考 CRC RevEng 目录（https://reveng.sourceforge.io/crc-catalogue/16.htm）
 */

/** CRC 参数模型（RockSoft 模型参数） */
export interface CrcParams {
  /** 算法名称 */
  name: string;
  /** 多项式（不含最高位的正常表示） */
  poly: number;
  /** 初始值 */
  init: number;
  /** 输入字节是否按位反转 */
  refin: boolean;
  /** 输出是否按位反转 */
  refout: boolean;
  /** 结果异或值 */
  xorout: number;
}

/** 单个算法的校验和结果 */
export interface ChecksumResult {
  /** 算法标识 */
  key: string;
  /** 展示名称 */
  name: string;
  /** 十进制值 */
  decimal: number;
  /** 4 位大写十六进制（CRC-16）或 8 位（Adler-32） */
  hex: string;
}

/** 输入模式 */
export type InputMode = 'text' | 'hex';

/** 常见 CRC-16 参数模型 */
export const CRC16_PRESETS: CrcParams[] = [
  { name: 'CRC-16/CCITT-FALSE', poly: 0x1021, init: 0xffff, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/ARC', poly: 0x8005, init: 0x0000, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/XMODEM', poly: 0x1021, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/MODBUS', poly: 0x8005, init: 0xffff, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/GENIBUS', poly: 0x1021, init: 0xffff, refin: false, refout: false, xorout: 0xffff },
  { name: 'CRC-16/KERMIT', poly: 0x1021, init: 0x0000, refin: true, refout: true, xorout: 0x0000 },
];

/** Adler-32 模数 */
const ADLER_MOD = 65521;

/**
 * 反转 16 位整数的位序
 */
function reverse16(value: number): number {
  let result = 0;
  let current = value;
  for (let i = 0; i < 16; i += 1) {
    result = (result << 1) | (current & 1);
    current >>= 1;
  }
  return result & 0xffff;
}

/**
 * 反转单个字节的位序
 */
function reverse8(value: number): number {
  let result = 0;
  let current = value;
  for (let i = 0; i < 8; i += 1) {
    result = (result << 1) | (current & 1);
    current >>= 1;
  }
  return result & 0xff;
}

/**
 * 按参数模型计算 CRC-16
 */
export function crc16(bytes: number[], params: CrcParams): number {
  let crc = params.init & 0xffff;
  for (const rawByte of bytes) {
    const byte = params.refin ? reverse8(rawByte & 0xff) : rawByte & 0xff;
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ params.poly) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const finalValue = params.refout ? reverse16(crc) : crc;
  return (finalValue ^ params.xorout) & 0xffff;
}

/**
 * 计算 Adler-32 校验和（RFC 1950）
 */
export function adler32(bytes: number[]): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + (byte & 0xff)) % ADLER_MOD;
    b = (b + a) % ADLER_MOD;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * 将文本按 UTF-8 编码为字节序列（使用 TextEncoder）
 */
export function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/**
 * 解析十六进制字节流：允许空格、0x 前缀、逗号与换行分隔；
 * 字符总数必须为偶数，且每个字节在 00-FF 之间
 */
export function parseHexBytes(input: string): number[] {
  const cleaned = input
    .replace(/0x/gi, '')
    .replace(/[\s,;_-]/g, '');
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
    const value = parseInt(pair, 16);
    if (Number.isNaN(value) || value < 0 || value > 0xff) {
      throw new Error(`非法字节：${pair}`);
    }
    bytes.push(value);
  }
  return bytes;
}

/**
 * 格式化为定长大写十六进制
 */
export function toHex(value: number, width: number): string {
  return value.toString(16).toUpperCase().padStart(width, '0');
}

/**
 * 对给定字节计算全部 CRC-16 预设与 Adler-32
 */
export function computeAll(bytes: number[]): ChecksumResult[] {
  const results: ChecksumResult[] = CRC16_PRESETS.map((preset) => {
    const value = crc16(bytes, preset);
    return {
      key: preset.name,
      name: preset.name,
      decimal: value,
      hex: toHex(value, 4),
    };
  });
  const adler = adler32(bytes);
  results.push({
    key: 'Adler-32',
    name: 'Adler-32',
    decimal: adler,
    hex: toHex(adler, 8),
  });
  return results;
}
