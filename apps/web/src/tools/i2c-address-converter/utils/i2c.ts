/**
 * I2C 地址换算纯函数（UM10204 §2.1.2）
 *
 * 规则：
 *   - I2C 设备寻址使用 7-bit 地址（0x00–0x7F），总线上实际发送的字节
 *     由 7-bit 地址左移一位、最低位放读写方向位构成：
 *       写字节 = (addr << 1) | 0，读字节 = (addr << 1) | 1
 *   - 保留区间 0x00–0x03（含 General Call 0x00）与 0x78–0x7F
 *     （10-bit 寻址使能与保留位）不得分配给普通从设备。
 *
 * 全部为移位与范围判断的零依赖纯函数，不触碰 DOM / React。
 */

/** 7-bit I2C 地址上限 */
export const I2C_7BIT_MAX = 0x7f;

/** 保留地址区间描述（UM10204 Table 2） */
export const RESERVED_RANGES: ReadonlyArray<{ from: number; to: number; reason: string }> = [
  { from: 0x00, to: 0x03, reason: '0000 000–0000 011：含通用呼叫 General Call（0x00）与起始字节，保留' },
  { from: 0x78, to: 0x7f, reason: '1111 0XX–1111 1XX：10-bit 寻址使能与保留位，保留' },
];

/** 换算结果中的单地址三进制表示 */
export interface RadixViews {
  /** 大写、带 0x 前缀的十六进制 */
  hex: string;
  /** 十进制字符串 */
  dec: string;
  /** 带 0b 前缀、按 width 补齐的二进制 */
  bin: string;
}

/** 7-bit → 8-bit 的完整换算结果 */
export interface I2cForwardResult {
  /** 规范化后的 7-bit 地址数值 */
  address7: number;
  /** 7-bit 地址的三进制视图（二进制 7 位） */
  views7: RadixViews;
  /** 8-bit 写地址 (addr<<1)|0 */
  writeByte: number;
  /** 8-bit 读地址 (addr<<1)|1 */
  readByte: number;
  /** 写地址三进制视图（二进制 8 位） */
  writeViews: RadixViews;
  /** 读地址三进制视图（二进制 8 位） */
  readViews: RadixViews;
  /** 是否落在保留区间；为 true 时 reservedReason 给出说明 */
  reserved: boolean;
  /** 保留原因（仅保留地址） */
  reservedReason?: string;
}

/** 8-bit → 7-bit 反向还原结果 */
export interface I2cReverseResult {
  /** 输入的 8-bit 字节数值 */
  byte: number;
  /** 最低位方向：0 为写、1 为读 */
  direction: 'write' | 'read';
  /** 右移一位还原的 7-bit 地址 */
  address7: number;
  /** 7-bit 地址三进制视图 */
  views7: RadixViews;
  /** 是否落在保留区间 */
  reserved: boolean;
  /** 保留原因（仅保留地址） */
  reservedReason?: string;
}

/**
 * 解析多进制整数写法：
 * - 0x 前缀 / h 后缀：十六进制
 * - 0b 前缀：二进制
 * - 0o 前缀：八进制
 * - 其余按十进制（允许下划线分隔）
 *
 * @param raw 原始输入
 * @returns 解析后的非负整数
 * @throws 为空、含非法字符或数值超出 Number.MAX_SAFE_INTEGER 时抛错
 */
export function parseInteger(raw: string): number {
  const trimmed = raw.trim().replace(/_/g, '');
  if (trimmed === '') {
    throw new Error('地址不能为空');
  }
  let value: number;
  if (/^0x[0-9a-f]+$/i.test(trimmed)) {
    value = parseInt(trimmed.slice(2), 16);
  } else if (/^[0-9a-f]+h$/i.test(trimmed)) {
    value = parseInt(trimmed.slice(0, -1), 16);
  } else if (/^0b[01]+$/.test(trimmed)) {
    value = parseInt(trimmed.slice(2), 2);
  } else if (/^0o[0-7]+$/.test(trimmed)) {
    value = parseInt(trimmed.slice(2), 8);
  } else if (/^\d+$/.test(trimmed)) {
    value = parseInt(trimmed, 10);
  } else {
    throw new Error('无法识别的数字写法，支持 0x50、50h、0b1010000、80 等形式');
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('地址必须为非负安全整数');
  }
  return value;
}

/** 生成固定位宽、带 0b 前缀的二进制字符串 */
function toBin(value: number, width: number): string {
  return `0b${value.toString(2).padStart(width, '0')}`;
}

/** 数值转三进制视图 */
function toRadixViews(value: number, binWidth: number): RadixViews {
  return {
    hex: `0x${value.toString(16).toUpperCase().padStart(Math.ceil(binWidth / 4), '0')}`,
    dec: String(value),
    bin: toBin(value, binWidth),
  };
}

/** 判断 7-bit 地址是否保留并返回原因 */
export function getReservedReason(address7: number): string | undefined {
  return RESERVED_RANGES.find((range) => address7 >= range.from && address7 <= range.to)?.reason;
}

/**
 * 7-bit 地址正向换算：输出三进制视图与 8-bit 读/写字节。
 *
 * @param raw 原始地址输入（任意受 parseInteger 支持的写法）
 * @returns 完整换算结果
 * @throws 数值超出 7-bit 范围（0–127）时抛错
 */
export function convert7To8(raw: string): I2cForwardResult {
  const address7 = parseInteger(raw);
  if (address7 > I2C_7BIT_MAX) {
    throw new Error(`7-bit I2C 地址必须在 0x00–0x7F（0–127）之间，当前为 0x${address7.toString(16).toUpperCase()}`);
  }
  const writeByte = (address7 << 1) | 0;
  const readByte = (address7 << 1) | 1;
  const reason = getReservedReason(address7);
  return {
    address7,
    views7: toRadixViews(address7, 7),
    writeByte,
    readByte,
    writeViews: toRadixViews(writeByte, 8),
    readViews: toRadixViews(readByte, 8),
    reserved: reason !== undefined,
    reservedReason: reason,
  };
}

/**
 * 8-bit 发送字节反向还原：右移一位得到 7-bit 地址并识别读写方向。
 *
 * @param raw 原始字节输入（任意受 parseInteger 支持的写法）
 * @returns 方向位、还原的 7-bit 地址与三进制视图
 * @throws 数值超出单字节范围或最低位语义异常时抛错
 */
export function convert8To7(raw: string): I2cReverseResult {
  const byte = parseInteger(raw);
  if (byte > 0xff) {
    throw new Error(`8-bit 地址字节必须在单字节范围 0x00–0xFF 内，当前为 0x${byte.toString(16).toUpperCase()}`);
  }
  if (byte === 0xff) {
    throw new Error('0xFF 不是合法的 I2C 地址字节：方向位为 1 时还原地址 0x7F 落在保留区间，且全 1 字节通常表示总线异常电平');
  }
  const directionBit = byte & 1;
  const address7 = byte >> 1;
  const reason = getReservedReason(address7);
  return {
    byte,
    direction: directionBit === 0 ? 'write' : 'read',
    address7,
    views7: toRadixViews(address7, 7),
    reserved: reason !== undefined,
    reservedReason: reason,
  };
}
