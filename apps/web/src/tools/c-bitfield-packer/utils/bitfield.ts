/**
 * C 结构体位域打包 / 解包器纯函数模块
 *
 * 模拟常见 C 编译器对结构体位域（bit-field）的位分配规则：
 * - lsb-first（默认）：字段按声明顺序从 bit0 向高位依次排列；
 * - msb-first：第一个字段占据存储单元的最高位，后续字段向低位排列。
 *
 * 所有运算均为零依赖的本地 Number / BigInt 运算，不访问 React 或 DOM；
 * 凡涉及超过 32 位安全整数范围的数值一律使用 BigInt，且禁止 Number 与 BigInt 混合运算。
 * 本模块全部函数为确定性纯函数，便于单元测试。
 */

/** 位域布局顺序：lsb-first 从低位向高位分配，msb-first 从高位向低位分配 */
export type BitOrder = 'lsb-first' | 'msb-first';

/** 存储单元类型，数字为该类型的总位宽 */
export type StorageType = 'uint8' | 'uint16' | 'uint32' | 'uint64';

/** 声明式字段定义：字段名与位宽 */
export interface BitField {
  /** 字段名，匹配 /^[A-Za-z_]\w*$/ */
  name: string;
  /** 位宽，取值 1-64 的正整数 */
  width: number;
}

/** 字段在存储单元中的布局信息 */
export interface FieldLayout extends BitField {
  /** 字段最低位相对存储单元 bit0 的偏移 */
  offset: number;
  /** 字段掩码的 hex 字符串（如 0xFFF0），uint64 宽度也可安全表达 */
  mask: string;
}

/** 打包结果 */
export interface PackResult {
  /** 整体 hex，大写并按存储宽度补零，带 0x 前缀 */
  hex: string;
  /** 二进制字符串，补零到存储宽度 */
  binary: string;
  /** 十进制字符串，uint64 场景下避免 Number 精度丢失 */
  decimal: string;
  /** 参与打包的字段位移表 */
  layouts: FieldLayout[];
}

/** 解包后的单个字段值 */
export interface UnpackedField {
  /** 字段名 */
  name: string;
  /** 位宽 */
  width: number;
  /** 位偏移 */
  offset: number;
  /** 字段值的十进制字符串 */
  value: string;
  /** 字段值的 hex 字符串，大写、带 0x 前缀 */
  hex: string;
}

/** 通用校验结果 */
export interface ValidationResult {
  /** 是否全部通过校验 */
  valid: boolean;
  /** 逐条错误信息，valid 为 true 时为空数组 */
  errors: string[];
}

/** 各存储类型对应的总位宽 */
export const STORAGE_BITS: Record<StorageType, number> = {
  uint8: 8,
  uint16: 16,
  uint32: 32,
  uint64: 64,
};

/** 字段数量上限，与界面 constants 中的 FIELD_LIMIT 保持一致 */
const MAX_FIELD_COUNT = 64;

/** 字段名合法规则：字母或下划线开头，后接字母、数字或下划线 */
const FIELD_NAME_RE = /^[A-Za-z_]\w*$/;

/** 位序指令正则，如 # @order msb-first */
const ORDER_DIRECTIVE_RE = /^#\s*@order\s+(lsb-first|msb-first)\s*$/;

/** 纯十进制数字 */
const DECIMAL_RE = /^\d+$/;

/** 带 0x / 0X 前缀的十六进制数字 */
const HEX_RE = /^0[xX][0-9a-fA-F]+$/;

/**
 * 计算指定位宽的字段掩码
 * @param width - 位宽，1-64
 * @returns BigInt 形式的掩码（2^width - 1）
 */
function maskBigInt(width: number): bigint {
  return (BigInt(1) << BigInt(width)) - BigInt(1);
}

/**
 * 将 BigInt 转换为最小宽度的大写 hex 字符串
 * @param value - 待转换的非负 BigInt
 * @returns 带 0x 前缀的大写 hex，如 0xE
 */
function toMinimalHex(value: bigint): string {
  return `0x${value.toString(16).toUpperCase()}`;
}

/**
 * 解析整数文本，支持 0x / 0X 前缀十六进制与纯十进制，拒绝负数与其他非法格式
 * @param token - 原始文本
 * @returns 解析后的 BigInt；非法输入返回 null
 */
function parseBigIntToken(token: string): bigint | null {
  const trimmed = token.trim();
  if (HEX_RE.test(trimmed) || DECIMAL_RE.test(trimmed)) {
    return BigInt(trimmed);
  }
  return null;
}

/**
 * 将 BigInt 格式化为指定字节宽度的大写 hex 字符串
 * @param value - 待转换的非负 BigInt
 * @param widthBytes - 存储宽度（字节数），决定补零位数
 * @returns 带 0x 前缀、大写并补零到 widthBytes*2 位的 hex 字符串
 */
export function toHex(value: bigint, widthBytes: number): string {
  const digits = value.toString(16).toUpperCase().padStart(widthBytes * 2, '0');
  return `0x${digits}`;
}

/**
 * 将 BigInt 格式化为指定位宽的二进制字符串
 * @param value - 待转换的非负 BigInt
 * @param widthBits - 存储宽度（位数），决定补零位数
 * @returns 补零到 widthBits 位的二进制字符串（不带前缀）
 */
export function toBinary(value: bigint, widthBits: number): string {
  return value.toString(2).padStart(widthBits, '0');
}

/**
 * 解析声明式字段定义文本
 *
 * 每行一个字段，语法为 `字段名:位宽`；# 开头为注释（空行忽略）；
 * 首行可使用 `# @order lsb-first|msb-first` 指令声明布局顺序。
 * @param text - 字段定义文本
 * @returns 字段列表、解析到的位序指令（缺省为 null）与逐条错误信息
 */
export function parseFieldDefinitions(text: string): {
  fields: BitField[];
  order: BitOrder | null;
  errors: string[];
} {
  const fields: BitField[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();
  let order: BitOrder | null = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }
    if (line.startsWith('#')) {
      const directive = line.match(ORDER_DIRECTIVE_RE);
      if (directive !== null) {
        const candidate = directive[1];
        if (candidate === 'lsb-first' || candidate === 'msb-first') {
          order = candidate;
        }
      }
      return;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) {
      errors.push(`第 ${index + 1} 行「${line}」格式非法，应为 字段名:位宽`);
      return;
    }

    const name = line.slice(0, separatorIndex).trim();
    const widthText = line.slice(separatorIndex + 1).trim();
    if (!FIELD_NAME_RE.test(name)) {
      errors.push(
        `第 ${index + 1} 行字段名「${name}」非法，字段名需匹配 /^[A-Za-z_]\\w*$/`,
      );
      return;
    }
    if (seenNames.has(name)) {
      errors.push(`第 ${index + 1} 行字段名「${name}」重复定义`);
      return;
    }
    if (!DECIMAL_RE.test(widthText)) {
      errors.push(`第 ${index + 1} 行字段「${name}」的位宽「${widthText}」非法，必须为 1-64 的正整数`);
      return;
    }
    const width = Number(widthText);
    if (width < 1 || width > STORAGE_BITS.uint64) {
      errors.push(`第 ${index + 1} 行字段「${name}」的位宽 ${width} 超出范围，必须为 1-64 的正整数`);
      return;
    }

    seenNames.add(name);
    fields.push({ name, width });
  });

  if (fields.length > MAX_FIELD_COUNT) {
    errors.push(`字段数量不能超过 ${MAX_FIELD_COUNT} 个，当前为 ${fields.length} 个`);
  }

  return { fields, order, errors };
}

/**
 * 依据字段定义与布局顺序计算每个字段的位偏移与掩码
 *
 * lsb-first 时 offset 从 0 累加；msb-first 时第一个字段从存储单元最高位向下分配。
 * 总位宽超过存储类型位宽时返回错误，且超宽字段不会出现在布局表中。
 * @param fields - 字段定义列表
 * @param order - 布局顺序
 * @param storage - 存储单元类型
 * @returns 字段位移表与布局错误信息
 */
export function buildLayouts(
  fields: BitField[],
  order: BitOrder,
  storage: StorageType,
): { layouts: FieldLayout[]; errors: string[] } {
  const storageBits = STORAGE_BITS[storage];
  const layouts: FieldLayout[] = [];
  const errors: string[] = [];

  if (order === 'lsb-first') {
    let cursor = 0;
    for (const field of fields) {
      if (cursor + field.width > storageBits) {
        errors.push(
          `字段「${field.name}」无法放入 ${storage}：偏移 ${cursor} + 位宽 ${field.width} 超过 ${storageBits} 位`,
        );
        continue;
      }
      layouts.push({
        name: field.name,
        width: field.width,
        offset: cursor,
        mask: toMinimalHex(maskBigInt(field.width) << BigInt(cursor)),
      });
      cursor += field.width;
    }
  } else {
    let highBoundary = storageBits;
    for (const field of fields) {
      const offset = highBoundary - field.width;
      if (offset < 0) {
        errors.push(
          `字段「${field.name}」无法放入 ${storage}：剩余 ${highBoundary} 位不足位宽 ${field.width}`,
        );
        continue;
      }
      layouts.push({
        name: field.name,
        width: field.width,
        offset,
        mask: toMinimalHex(maskBigInt(field.width) << BigInt(offset)),
      });
      highBoundary = offset;
    }
  }

  const totalWidth = fields.reduce((sum, field) => sum + field.width, 0);
  if (totalWidth > storageBits) {
    errors.push(
      `布局溢出：字段总位宽 ${totalWidth} 超过存储类型 ${storage} 的位宽 ${storageBits}`,
    );
  }

  return { layouts, errors };
}

/**
 * 按字段位移表打包各字段值
 *
 * 赋值文本每行一条 `字段名=值`，值支持 0x / 0X 前缀十六进制与十进制；
 * 缺字段、未知字段、重复赋值、非法数字与超出字段位宽可表示范围均报错。
 * @param fields - 字段定义列表
 * @param layouts - buildLayouts 产出的位移表
 * @param valuesText - 字段赋值文本
 * @param order - 布局顺序（位移已由 layouts 决定，保留入参以显式声明布局上下文）
 * @param storage - 存储单元类型
 * @returns 打包结果（存在错误时 result 缺省）与错误信息
 */
export function packValues(
  fields: BitField[],
  layouts: FieldLayout[],
  valuesText: string,
  order: BitOrder,
  storage: StorageType,
): { result?: PackResult; errors: string[] } {
  const storageBits = STORAGE_BITS[storage];
  const errors: string[] = [];
  const totalWidth = fields.reduce((sum, field) => sum + field.width, 0);
  if (totalWidth > storageBits || layouts.length !== fields.length) {
    errors.push(
      `布局溢出：字段总位宽 ${totalWidth} 超过存储类型 ${storage} 的位宽 ${storageBits}`,
    );
    return { errors };
  }

  const valueMap = new Map<string, bigint>();
  valuesText.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      return;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      errors.push(`第 ${index + 1} 行「${line}」格式非法，应为 字段名=值`);
      return;
    }
    const name = line.slice(0, separatorIndex).trim();
    const valueText = line.slice(separatorIndex + 1).trim();
    const field = fields.find((item) => item.name === name);
    if (field === undefined) {
      errors.push(`第 ${index + 1} 行出现未知字段「${name}」`);
      return;
    }
    if (valueMap.has(name)) {
      errors.push(`第 ${index + 1} 行字段「${name}」被重复赋值`);
      return;
    }
    const parsed = parseBigIntToken(valueText);
    if (parsed === null) {
      errors.push(`第 ${index + 1} 行字段「${name}」的值「${valueText}」不是合法的十进制或 0x 十六进制整数`);
      return;
    }
    valueMap.set(name, parsed);
  });

  for (const field of fields) {
    if (!valueMap.has(field.name)) {
      errors.push(`字段「${field.name}」缺少赋值`);
    }
  }
  if (errors.length > 0) {
    return { errors };
  }

  let packed = BigInt(0);
  for (const layout of layouts) {
    const value = valueMap.get(layout.name);
    if (value === undefined) {
      errors.push(`字段「${layout.name}」缺少赋值`);
      continue;
    }
    const max = maskBigInt(layout.width);
    if (value < BigInt(0) || value > max) {
      errors.push(
        `字段「${layout.name}」值 ${value.toString(10)} 溢出：位宽 ${layout.width} 允许范围为 0 ~ ${max.toString(10)}`,
      );
      continue;
    }
    packed |= value << BigInt(layout.offset);
  }
  if (errors.length > 0) {
    return { errors };
  }

  const widthBytes = storageBits / 8;
  return {
    errors: [],
    result: {
      hex: toHex(packed, widthBytes),
      binary: toBinary(packed, storageBits),
      decimal: packed.toString(10),
      layouts,
    },
  };
}

/**
 * 按同一字段定义与位移表解包原始整数
 *
 * 输入支持 0x / 0X 前缀十六进制与十进制；超出存储类型可表示范围时报错。
 * @param fields - 字段定义列表
 * @param layouts - buildLayouts 产出的位移表
 * @param rawText - 原始整数文本
 * @param storage - 存储单元类型
 * @returns 逐字段解包结果（存在错误时 result 缺省）与错误信息
 */
export function unpackValue(
  fields: BitField[],
  layouts: FieldLayout[],
  rawText: string,
  storage: StorageType,
): { result?: UnpackedField[]; errors: string[] } {
  const storageBits = STORAGE_BITS[storage];
  const errors: string[] = [];
  const totalWidth = fields.reduce((sum, field) => sum + field.width, 0);
  if (totalWidth > storageBits || layouts.length !== fields.length) {
    errors.push(
      `布局溢出：字段总位宽 ${totalWidth} 超过存储类型 ${storage} 的位宽 ${storageBits}`,
    );
    return { errors };
  }

  const trimmed = rawText.trim();
  if (trimmed === '') {
    errors.push('解包输入不能为空');
    return { errors };
  }
  const raw = parseBigIntToken(trimmed);
  if (raw === null) {
    errors.push(`输入「${trimmed}」不是合法的十进制或 0x 十六进制整数`);
    return { errors };
  }

  const storageMax = maskBigInt(storageBits);
  if (raw < BigInt(0) || raw > storageMax) {
    errors.push(
      `输入值 ${raw.toString(10)} 超过存储类型 ${storage} 的可表示范围 0 ~ ${storageMax.toString(10)}`,
    );
    return { errors };
  }

  const result: UnpackedField[] = layouts.map((layout) => {
    const fieldValue = (raw >> BigInt(layout.offset)) & maskBigInt(layout.width);
    return {
      name: layout.name,
      width: layout.width,
      offset: layout.offset,
      value: fieldValue.toString(10),
      hex: toMinimalHex(fieldValue),
    };
  });

  return { result, errors };
}
