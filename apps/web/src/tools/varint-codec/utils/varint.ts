/**
 * VarInt / ZigZag / LEB128 编解码纯逻辑集合。
 *
 * 覆盖 Protocol Buffers 使用的 Base-128 变长整数：每字节低 7 位为载荷、
 * 最高位（MSB）为续位标记；有符号整数先经 ZigZag 映射为无符号值再走
 * VarInt（sint32 / sint64）。另支持 DWARF / WASM 使用的有符号 LEB128。
 * 全部基于 BigInt 位运算，不触碰 DOM / React，零新增依赖。
 */

/** 支持的编码类型 */
export const VARINT_TYPES = ['unsigned', 'zigzag32', 'zigzag64', 'signed-leb'] as const;

/** 编码类型标识 */
export type VarIntType = (typeof VARINT_TYPES)[number];

const ZERO = BigInt(0);
const ONE = BigInt(1);
const SEVEN_BITS_MASK = BigInt(0x7f);
const BYTE_MASK = BigInt(0xff);
const CONTINUATION = 0x80;
const SIGN_BIT = 0x40;

const U32_MAX = BigInt('4294967295'); // 2^32 - 1
const U64_MAX = BigInt('18446744073709551615'); // 2^64 - 1
const I32_MAX = BigInt(2147483647); // 2^31 - 1
const I32_MIN = -BigInt(2147483648); // -2^31
const I64_MAX = BigInt('9223372036854775807'); // 2^63 - 1
const I64_MIN = -BigInt('9223372036854775808'); // -2^63

/** 单个字节的可视化拆解 */
export interface VarIntByte {
  /** 字节序号（从 1 开始） */
  index: number;
  /** 字节数值（0-255） */
  value: number;
  /** 两位大写十六进制 */
  hex: string;
  /** 8 位二进制串 */
  binary: string;
  /** 是否置位续位（MSB=1 表示后续还有字节） */
  continuation: boolean;
  /** 低 7 位载荷（0-127） */
  payload: number;
  /** 低 7 位载荷的二进制串 */
  payloadBinary: string;
}

/** 解码结果 */
export interface VarIntDecodeResult {
  /** 还原出的整数（有符号模式可为负） */
  value: bigint | null;
  /** 消费的字节数 */
  length: number;
  /** 逐字节拆解 */
  bytes: VarIntByte[];
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 构造单字节可视化信息
 *
 * @param byte - 字节数值
 * @param index - 字节序号
 * @returns 字节拆解
 */
function describeByte(byte: number, index: number): VarIntByte {
  return {
    index,
    value: byte,
    hex: byte.toString(16).toUpperCase().padStart(2, '0'),
    binary: byte.toString(2).padStart(8, '0'),
    continuation: byte >= CONTINUATION,
    payload: byte & 0x7f,
    payloadBinary: (byte & 0x7f).toString(2).padStart(7, '0'),
  };
}

/**
 * 无符号 64 位整数的 Base-128（VarInt / ULEB128）编码
 *
 * @param value - 非负整数（不超过 2^64-1）
 * @param maxBytes - 允许的最大字节数（sint32 用 5，其余 10）
 * @returns 字节数组或错误信息
 */
function encodeUnsignedCore(
  value: bigint,
  maxBytes: number,
): { bytes: Uint8Array | null; error: string | null } {
  if (value < ZERO) {
    return { bytes: null, error: '无符号 VarInt 仅接受非负整数，负数请使用 ZigZag 或有符号 LEB128' };
  }
  if (maxBytes === 10 && value > U64_MAX) {
    return { bytes: null, error: '数值超出 uint64 范围（0 ~ 2^64-1），无法用最多 10 字节编码' };
  }
  if (maxBytes === 5 && value > U32_MAX) {
    return { bytes: null, error: '数值超出 uint32 范围（0 ~ 2^32-1），sint32 编码最多 5 字节' };
  }

  const output: number[] = [];
  let number = value;
  while (number >= BigInt(0x80)) {
    output.push(Number(number & SEVEN_BITS_MASK) | CONTINUATION);
    number >>= BigInt(7);
  }
  output.push(Number(number));

  if (output.length > maxBytes) {
    return { bytes: null, error: `编码需要 ${output.length} 字节，超过上限 ${maxBytes} 字节` };
  }
  return { bytes: Uint8Array.from(output), error: null };
}

/**
 * ZigZag 映射：有符号整数 → 非负无符号整数
 *
 * 公式（width 为位宽 32 / 64）：(n << 1) ^ (n >> (width - 1))，
 * 算术右移在 BigInt 下对负数补 1，再按位宽掩码。
 *
 * @param value - 有符号整数
 * @param width - 位宽（32 或 64）
 * @returns ZigZag 无符号值
 */
export function zigzagEncode(value: bigint, width: 32 | 64): bigint {
  const mask = width === 32 ? U32_MAX : U64_MAX;
  return ((value << ONE) ^ (value >> BigInt(width - 1))) & mask;
}

/**
 * ZigZag 反映射：非负无符号整数 → 有符号整数
 *
 * 公式：(n >>> 1) ^ -(n & 1)
 *
 * @param value - ZigZag 无符号值
 * @returns 有符号整数
 */
export function zigzagDecode(value: bigint): bigint {
  return (value >> ONE) ^ -(value & ONE);
}

/**
 * 按指定类型编码整数
 *
 * @param value - 待编码整数
 * @param type - 编码类型
 * @returns 字节数组、逐字节拆解或错误信息
 */
export function encodeVarInt(
  value: bigint,
  type: VarIntType,
): { bytes: Uint8Array | null; bytesDetail: VarIntByte[]; error: string | null } {
  let unsigned = value;

  if (type === 'zigzag32') {
    if (value < I32_MIN || value > I32_MAX) {
      return {
        bytes: null,
        bytesDetail: [],
        error: `sint32 取值范围为 ${I32_MIN.toString()} ~ ${I32_MAX.toString()}`,
      };
    }
    unsigned = zigzagEncode(value, 32);
  } else if (type === 'zigzag64') {
    if (value < I64_MIN || value > I64_MAX) {
      return {
        bytes: null,
        bytesDetail: [],
        error: `sint64 取值范围为 ${I64_MIN.toString()} ~ ${I64_MAX.toString()}`,
      };
    }
    unsigned = zigzagEncode(value, 64);
  } else if (type === 'signed-leb') {
    if (value < I64_MIN || value > I64_MAX) {
      return {
        bytes: null,
        bytesDetail: [],
        error: `有符号 LEB128 按 int64 处理，取值范围为 ${I64_MIN.toString()} ~ ${I64_MAX.toString()}`,
      };
    }
    return encodeSignedLeb128(value);
  }

  const maxBytes = type === 'zigzag32' ? 5 : 10;
  const result = encodeUnsignedCore(unsigned, maxBytes);
  if (result.error || !result.bytes) {
    return { bytes: null, bytesDetail: [], error: result.error };
  }
  return {
    bytes: result.bytes,
    bytesDetail: Array.from(result.bytes).map((byte, index) => describeByte(byte, index + 1)),
    error: null,
  };
}

/**
 * 有符号 LEB128 编码
 *
 * @param value - int64 范围内的有符号整数
 * @returns 字节数组与逐字节拆解
 */
function encodeSignedLeb128(value: bigint): {
  bytes: Uint8Array | null;
  bytesDetail: VarIntByte[];
  error: string | null;
} {
  let number = value;
  const output: number[] = [];
  let more = true;
  while (more) {
    let byte = Number(number & SEVEN_BITS_MASK);
    number >>= BigInt(7);
    // 符号位为第 6 位（0x40）：number=0 且符号位 0、或 number=-1 且符号位 1 时可终止
    if ((number === ZERO && (byte & SIGN_BIT) === 0) ||
        (number === -ONE && (byte & SIGN_BIT) !== 0)) {
      more = false;
    } else {
      byte |= CONTINUATION;
    }
    output.push(byte);
  }
  if (output.length > 10) {
    return { bytes: null, bytesDetail: [], error: '编码超过 10 字节，超出 int64 范围' };
  }
  const bytes = Uint8Array.from(output);
  return {
    bytes,
    bytesDetail: Array.from(bytes).map((byte, index) => describeByte(byte, index + 1)),
    error: null,
  };
}

/**
 * 解析用户输入的整数（十进制或 0x 十六进制，允许前导正负号与下划线 / 空格 / 逗号分隔）
 *
 * @param input - 原始输入文本
 * @returns BigInt 值或错误信息
 */
export function parseIntegerInput(input: string): {
  value: bigint | null;
  error: string | null;
} {
  const cleaned = input.trim().replace(/[_,\s]/g, '');
  if (cleaned === '') {
    return { value: null, error: '请输入整数' };
  }

  let negative = false;
  let body = cleaned;
  if (body.startsWith('-')) {
    negative = true;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }
  if (body === '') {
    return { value: null, error: '符号后缺少数字' };
  }
  if (body.includes('.') || body.includes('/')) {
    return { value: null, error: 'VarInt 仅支持整数，不支持小数或分数' };
  }

  let value: bigint;
  if (/^0[xX][0-9a-fA-F]+$/.test(body)) {
    value = BigInt(body);
  } else if (/^[0-9]+$/.test(body)) {
    value = BigInt(body);
  } else {
    return { value: null, error: '无法识别的整数格式（支持十进制与 0x 十六进制）' };
  }
  return { value: negative ? -value : value, error: null };
}

/**
 * 解析十六进制字符串为字节数组
 *
 * @param hex - 十六进制输入，允许空白、0x 前缀与逐字节空格
 * @returns 字节数组或错误信息
 */
export function hexToBytes(hex: string): {
  bytes: Uint8Array | null;
  error: string | null;
} {
  const cleaned = hex.trim().replace(/0x/gi, '').replace(/[\s,]/g, '');
  if (cleaned === '') {
    return { bytes: new Uint8Array(), error: null };
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    return { bytes: null, error: '十六进制包含非 0-9a-f 字符' };
  }
  if (cleaned.length % 2 !== 0) {
    return { bytes: null, error: '十六进制长度必须为偶数（每字节两位）' };
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return { bytes, error: null };
}

/**
 * 解码无符号 VarInt / ULEB128，并校验截断与非规范（过长）编码
 *
 * @param bytes - 字节序列
 * @returns 解码结果
 */
function decodeUnsigned(bytes: Uint8Array): VarIntDecodeResult {
  const detail: VarIntByte[] = [];
  let result = ZERO;

  for (let index = 0; index < bytes.length && index < 10; index += 1) {
    const byte = bytes[index] as number;
    detail.push(describeByte(byte, index + 1));

    if (index === 9) {
      // 第 10 字节只能使用最低 1 位，且必须是末字节
      if (byte >= CONTINUATION) {
        return {
          value: null,
          length: 10,
          bytes: detail,
          error: 'VarInt 超过 10 字节（uint64 上限），或第 10 字节仍置位续位',
        };
      }
      if ((byte & 0x7e) !== 0) {
        return {
          value: null,
          length: 10,
          bytes: detail,
          error: '非规范编码：第 10 字节只能使用最低 1 位（载荷需 ≤ 1）',
        };
      }
    }

    result |= BigInt(byte & 0x7f) << BigInt(index * 7);

    if (byte < CONTINUATION) {
      // 非规范过长校验：末字节载荷为 0 且前面还有续位字节，说明可再缩短
      if (index > 0 && (byte & 0x7f) === 0) {
        return {
          value: null,
          length: index + 1,
          bytes: detail,
          error: '非规范（冗余）编码：末字节载荷为 0，序列可以更短',
        };
      }
      return { value: result, length: index + 1, bytes: detail, error: null };
    }
  }

  return {
    value: null,
    length: bytes.length,
    bytes: detail,
    error: '截断的 VarInt：末字节仍置位续位（MSB=1）但后面没有数据',
  };
}

/**
 * 解码有符号 LEB128
 *
 * @param bytes - 字节序列
 * @returns 解码结果
 */
function decodeSignedLeb128(bytes: Uint8Array): VarIntDecodeResult {
  const detail: VarIntByte[] = [];
  let result = ZERO;
  let shift = 0;

  for (let index = 0; index < bytes.length && index < 10; index += 1) {
    const byte = bytes[index] as number;
    detail.push(describeByte(byte, index + 1));
    const payload = BigInt(byte & 0x7f);
    result |= payload << BigInt(shift);
    shift += 7;

    if (byte < CONTINUATION) {
      if (index === 9) {
        // 第 10 字节仅贡献 1 个有效位（bit63），载荷只能是 0x00 或 0x7F
        if (byte === 0x00) {
          // bit63=0（正数）：合法边界要求 bit62=1（否则 9 字节即可表示）
          if ((result & (ONE << BigInt(62))) === ZERO) {
            return {
              value: null,
              length: 10,
              bytes: detail,
              error: '非规范（冗余）编码：末字节为冗余符号扩展，序列可以更短',
            };
          }
        } else if (byte === 0x7f) {
          result |= ONE << BigInt(63);
          // bit63=1（负数）：合法边界要求 bit62=0（否则 9 字节带符号扩展即可表示）
          if ((result & (ONE << BigInt(62))) !== ZERO) {
            return {
              value: null,
              length: 10,
              bytes: detail,
              error: '非规范（冗余）编码：末字节为冗余符号扩展，序列可以更短',
            };
          }
          // 按 int64 做符号扩展
          result |= -ONE << BigInt(63);
        } else {
          return {
            value: null,
            length: 10,
            bytes: detail,
            error: '非规范编码：10 字节有符号 LEB128 的末字节只能是 0x00 或 0x7F（超出 int64 范围）',
          };
        }
        return { value: result, length: 10, bytes: detail, error: null };
      }

      // 不足位宽时按符号位扩展
      if ((byte & SIGN_BIT) !== 0) {
        result |= -ONE << BigInt(shift);
      }
      // 最小长度校验（末字节贡献完整 7 位时）：末字节若与上一字节载荷
      // 符号位完全同号（0x00 / 0x7F），则提前终止也能得到相同值
      if (index > 0) {
        const previousSignBit = (bytes[index - 1] as number) & SIGN_BIT;
        const redundantZero = byte === 0x00 && previousSignBit === 0;
        const redundantOnes = byte === 0x7f && previousSignBit !== 0;
        if (redundantZero || redundantOnes) {
          return {
            value: null,
            length: index + 1,
            bytes: detail,
            error: '非规范（冗余）编码：末字节为冗余符号扩展，序列可以更短',
          };
        }
      }
      return { value: result, length: index + 1, bytes: detail, error: null };
    }
  }

  return {
    value: null,
    length: bytes.length,
    bytes: detail,
    error: '截断的有符号 LEB128：末字节仍置位续位但后面没有数据',
  };
}

/**
 * 按指定类型解码字节序列
 *
 * @param bytes - 字节序列
 * @param type - 编码类型
 * @returns 解码结果（ZigZag 模式先解无符号再反映射并校验范围）
 */
export function decodeVarInt(bytes: Uint8Array, type: VarIntType): VarIntDecodeResult {
  if (type === 'signed-leb') {
    return decodeSignedLeb128(bytes);
  }

  const unsigned = decodeUnsigned(bytes);
  if (unsigned.error || unsigned.value === null) {
    return unsigned;
  }

  if (type === 'unsigned') {
    return unsigned;
  }

  if (type === 'zigzag32' && unsigned.value > U32_MAX) {
    return {
      value: null,
      length: unsigned.length,
      bytes: unsigned.bytes,
      error: 'sint32 的 ZigZag 值超出 uint32 范围（编码不应超过 5 字节）',
    };
  }

  const signed = zigzagDecode(unsigned.value);
  if (type === 'zigzag32' && (signed < I32_MIN || signed > I32_MAX)) {
    return {
      value: null,
      length: unsigned.length,
      bytes: unsigned.bytes,
      error: 'ZigZag 解码结果超出 sint32 范围',
    };
  }
  return { ...unsigned, value: signed };
}

/**
 * 把字节数组格式化为大写十六进制串（无分隔）
 *
 * @param bytes - 字节数组
 * @returns 十六进制串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

/**
 * 把字节数组格式化为带空格的十六进制串（如 AC 02）
 *
 * @param bytes - 字节数组
 * @returns 带空格十六进制串
 */
export function bytesToSpacedHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

/** 供界面 / 测试引用的位宽边界常量 */
export const LIMITS = {
  U32_MAX,
  U64_MAX,
  I32_MIN,
  I32_MAX,
  I64_MIN,
  I64_MAX,
  BYTE_MASK,
};
