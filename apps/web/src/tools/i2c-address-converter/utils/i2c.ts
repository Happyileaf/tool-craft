/**
 * I2C 地址换算纯函数模块：在 7-bit 从地址与 8-bit 读 / 写地址之间互转，
 * 并依据 I2C 保留地址表（UM10204 §3.1.10）识别保留段。
 *
 * 所有函数均为确定性纯函数，不依赖浏览器 API，便于单测覆盖。
 */

/** 7-bit I2C 地址的合法上限（0x77） */
export const I2C_7BIT_MAX = 0x77;
/** 8-bit I2C 地址的合法上限（0xFF） */
export const I2C_8BIT_MAX = 0xff;

/** I2C 保留地址条目 */
export interface ReservedRange {
  /** 7-bit 起始地址 */
  start: number;
  /** 7-bit 结束地址（含） */
  end: number;
  /** 用途说明 */
  purpose: string;
}

/**
 * I2C 保留地址表（7-bit 视角，依据 NXP UM10204 Table 4）。
 * 0000 000 ~ 0000 011 与 1111 000 ~ 1111 111 为保留 / 特殊用途。
 */
export const RESERVED_RANGES: ReadonlyArray<ReservedRange> = [
  { start: 0x00, end: 0x07, purpose: '保留（含通用呼叫地址 0x00 与 CBUS 0x01）' },
  { start: 0x78, end: 0x7f, purpose: '保留（10-bit 寻址等特殊用途）' },
];

/** 换算结果 */
export interface I2cConversion {
  /** 规范化后的 7-bit 地址（0x00–0x77） */
  address7: number;
  /** 8-bit 写地址（7-bit 左移 1 位，最低位 0） */
  write8: number;
  /** 8-bit 读地址（7-bit 左移 1 位，最低位 1） */
  read8: number;
  /** 是否落在保留地址段 */
  isReserved: boolean;
  /** 保留用途说明（非保留时为空字符串） */
  reservedPurpose: string;
  /** 非阻断性提示信息 */
  warnings: string[];
}

/**
 * 解析用户输入的地址文本，支持 0x / $ 前缀的十六进制与十进制。
 *
 * @param raw - 用户原始输入
 * @returns 解析出的整数；非法输入返回 null
 */
export function parseAddress(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') {
    return null;
  }
  // 统一前缀：$ 是部分烧录器使用的十六进制写法
  const normalized = trimmed.replace(/^\$/, '0x');
  const isHex = normalized.startsWith('0x');
  const body = isHex ? normalized.slice(2) : normalized;
  if (body === '' || /[^0-9a-f]/.test(body)) {
    return null;
  }
  const value = parseInt(body, isHex ? 16 : 10);
  return Number.isNaN(value) ? null : value;
}

/** 将整数格式化为两位大写十六进制（不带前缀） */
export function toHex(value: number, digits = 2): string {
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

/**
 * 判断 7-bit 地址是否为保留地址。
 *
 * @param address7 - 7-bit 地址
 * @returns 命中的保留段；未命中返回 null
 */
export function findReservedRange(address7: number): ReservedRange | null {
  return RESERVED_RANGES.find((range) => address7 >= range.start && address7 <= range.end) ?? null;
}

/**
 * 由 7-bit 地址执行完整换算。
 *
 * @param address7 - 7-bit 从地址（0x00–0x77）
 * @returns 换算结果；地址越界时返回错误描述
 */
export function convertFrom7Bit(address7: number): I2cConversion & { errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Number.isInteger(address7) || address7 < 0 || address7 > I2C_7BIT_MAX) {
    errors.push(`7-bit 地址必须是 0x00–0x77（十进制 0–119）之间的整数，当前为 ${address7}`);
  }
  const safe = errors.length === 0 ? address7 : 0;
  const write8 = (safe << 1) & 0xfe;
  const read8 = write8 | 0x01;
  const reserved = findReservedRange(safe);
  if (reserved) {
    warnings.push(`地址 0x${toHex(safe)} 属于保留段：${reserved.purpose}，普通从机不应使用`);
  }
  return {
    address7: safe,
    write8,
    read8,
    isReserved: reserved !== null,
    reservedPurpose: reserved?.purpose ?? '',
    warnings,
    errors,
  };
}

/**
 * 由 8-bit 地址（读或写）反推 7-bit 地址。
 *
 * @param address8 - 8-bit 地址（0x00–0xFF）
 * @returns 换算结果；地址越界时返回错误描述
 */
export function convertFrom8Bit(address8: number): I2cConversion & { errors: string[]; rwBit: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Number.isInteger(address8) || address8 < 0 || address8 > I2C_8BIT_MAX) {
    errors.push(`8-bit 地址必须是 0x00–0xFF（十进制 0–255）之间的整数，当前为 ${address8}`);
  }
  const safe = errors.length === 0 ? address8 : 0;
  const rwBit = safe & 0x01;
  const address7 = safe >> 1;
  const write8 = (address7 << 1) & 0xfe;
  const read8 = write8 | 0x01;
  const reserved = findReservedRange(address7);
  if (reserved) {
    warnings.push(`对应 7-bit 地址 0x${toHex(address7)} 属于保留段：${reserved.purpose}`);
  }
  if (address7 > I2C_7BIT_MAX) {
    // 0x78–0x7F 的 8-bit 形式落在 0xF0–0xFF，右移后仍在保留段内，仅提示
    warnings.push('该 8-bit 地址对应 7-bit 保留区，不作为常规从机地址使用');
  }
  return {
    address7,
    write8,
    read8,
    isReserved: reserved !== null,
    reservedPurpose: reserved?.purpose ?? '',
    warnings,
    errors,
    rwBit,
  };
}

/** 默认样例输入：EEPROM 常见地址 0x50 */
export const DEFAULT_7BIT_INPUT = '0x50';
