import { RESERVED_RANGES } from '../constants';

/** 地址解析结果：value 为解析出的非负整数，radix 为识别到的进制 */
export interface ParsedAddress {
  value: number;
  radix: 2 | 8 | 10 | 16;
}

/** 单个地址的多进制展示 */
export interface AddressView {
  hex: string;
  dec: string;
  bin: string;
}

/** I2C 地址换算结果 */
export interface I2cResult {
  errors: string[];
  /** 输入被解释为 7-bit 还是 8-bit（仅在解析成功且范围可判定时给出） */
  interpretedAs: '7bit' | '8bit' | null;
  sevenBit: AddressView | null;
  writeAddress: AddressView | null;
  readAddress: AddressView | null;
  reserved: boolean;
  generalCall: boolean;
}

/**
 * 解析多进制整数写法：0x/0X 十六进制、0b/0B 二进制、0o/0O 八进制、
 * 以 h/H 结尾的十六进制（如 50h），其余按十进制处理。
 *
 * @param raw - 用户输入的原始字符串
 * @returns 解析结果；无法解析时抛错，由调用方归集
 */
export function parseAddress(raw: string): ParsedAddress {
  const text = raw.trim().replace(/\s+/g, '');
  if (text === '') {
    throw new Error('地址不能为空');
  }
  if (!/^[0-9a-fA-FxXbBoOhH]+$/.test(text)) {
    throw new Error(`无法识别的地址写法：${raw}`);
  }

  const lower = text.toLowerCase();
  if (lower.startsWith('0x')) {
    const body = lower.slice(2);
    if (body === '' || !/^[0-9a-f]+$/.test(body)) {
      throw new Error(`十六进制地址格式错误：${raw}`);
    }
    return { value: parseInt(body, 16), radix: 16 };
  }
  if (lower.startsWith('0b')) {
    const body = lower.slice(2);
    if (body === '' || !/^[01]+$/.test(body)) {
      throw new Error(`二进制地址格式错误：${raw}`);
    }
    return { value: parseInt(body, 2), radix: 2 };
  }
  if (lower.startsWith('0o')) {
    const body = lower.slice(2);
    if (body === '' || !/^[0-7]+$/.test(body)) {
      throw new Error(`八进制地址格式错误：${raw}`);
    }
    return { value: parseInt(body, 8), radix: 8 };
  }
  if (lower.endsWith('h')) {
    const body = lower.slice(0, -1);
    if (body === '' || !/^[0-9a-f]+$/.test(body)) {
      throw new Error(`十六进制地址格式错误：${raw}`);
    }
    return { value: parseInt(body, 16), radix: 16 };
  }
  if (!/^\d+$/.test(lower)) {
    throw new Error(`无法识别的地址写法：${raw}`);
  }
  return { value: parseInt(lower, 10), radix: 10 };
}

function toView(value: number): AddressView {
  return {
    hex: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
    dec: String(value),
    bin: value.toString(2).padStart(8, '0'),
  };
}

/** 判断 7-bit 地址是否落在 UM10204 保留区间 */
export function isReservedSevenBit(sevenBit: number): boolean {
  return RESERVED_RANGES.some(([low, high]) => sevenBit >= low && sevenBit <= high);
}

/**
 * 换算 I2C 地址：自动识别 7-bit（0–127）或 8-bit（0–255 偶数对齐）输入，
 * 输出 7-bit 地址与对应的 8-bit 写 / 读地址三种进制，并标注保留区间。
 *
 * @param raw - 用户输入字符串
 * @returns 结构化换算结果，错误归集在 errors 中
 */
export function convertI2cAddress(raw: string): I2cResult {
  const result: I2cResult = {
    errors: [],
    interpretedAs: null,
    sevenBit: null,
    writeAddress: null,
    readAddress: null,
    reserved: false,
    generalCall: false,
  };

  let parsed: ParsedAddress;
  try {
    parsed = parseAddress(raw);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : '地址解析失败');
    return result;
  }

  const { value } = parsed;
  if (value < 0 || value > 0xff) {
    result.errors.push(`地址超出 8-bit 范围（0–255）：${value}`);
    return result;
  }

  let sevenBit: number;
  if (value <= 0x7f) {
    sevenBit = value;
    result.interpretedAs = '7bit';
  } else {
    // 8-bit 读写地址：右移一位还原 7-bit 地址
    sevenBit = value >> 1;
    result.interpretedAs = '8bit';
    if ((value & 0x01) === 1) {
      result.errors.push(
        `输入 0x${value.toString(16).toUpperCase()} 最低位为 1，按 8-bit 读地址解释（写地址为 0x${((sevenBit << 1) & 0xff)
          .toString(16)
          .toUpperCase()
          .padStart(2, '0')}）`,
      );
    }
  }

  const write = (sevenBit << 1) & 0xff;
  const read = write | 0x01;

  result.sevenBit = toView(sevenBit);
  result.writeAddress = toView(write);
  result.readAddress = toView(read);
  result.reserved = isReservedSevenBit(sevenBit);
  result.generalCall = sevenBit === 0x00;

  return result;
}
