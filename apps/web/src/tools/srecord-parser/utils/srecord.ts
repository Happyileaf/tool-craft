/**
 * Motorola S-Record（S19 / S28 / S37）解析与校验和工具的纯函数实现。
 *
 * 记录行格式：`S<type><byteCount:2hex><address:N hex><data:M hex><checksum:2hex>`
 * - type：一位类型码（0-9），决定地址宽度与记录语义
 * - byteCount：1 字节，等于「地址字节数 + 数据字节数 + 1（校验和自身）」
 * - address：2 / 3 / 4 字节无符号地址（宽度随类型而定）
 * - checksum：byteCount、地址与数据全部字节求和后取低 8 位再取反，
 *   即 (~sum) & 0xFF；校验时把 checksum 字节一并计入，低 8 位应为 0xFF
 *
 * 本模块不依赖 DOM 与 React，所有运算均为本地确定性运算；
 * 畸形行以带行号的错误返回，不抛出异常、不中断后续行的解析。
 */

import { ADDRESS_WIDTHS } from '../constants';

/** S-Record 记录类型码（S0-S9） */
export type SrecordType = 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9';

/** 校验和状态 */
export type ChecksumStatus = 'valid' | 'invalid';

/** S-Record 文件格式，按数据记录的最高地址宽度识别 */
export type SrecordFormat = 'S19' | 'S28' | 'S37';

/** 一条成功解析的 S-Record 记录 */
export interface SrecordRecord {
  /** 所在文本行号，从 1 开始（空行不编号） */
  lineNumber: number;
  /** 原始行文本（去除首尾空白后） */
  raw: string;
  /** 记录类型码，如 'S1' */
  type: SrecordType;
  /** 记录类型中文名 */
  typeName: string;
  /** byteCount 字段声明值（地址 + 数据 + 校验和的字节总数） */
  byteCount: number;
  /** 地址字段解析出的无符号地址（已通过 >>> 0 还原为 32 位无符号数） */
  address: number;
  /** 地址字段的字节宽度（2 / 3 / 4） */
  addressByteWidth: 2 | 3 | 4;
  /** 数据载荷字节数组（不含 byteCount、地址与校验和） */
  data: number[];
  /** 行内实际携带的校验和字节 */
  checksum: number;
  /** 依据行内字节重新计算出的期望校验和 */
  expectedChecksum: number;
  /** 校验和状态 */
  checksumStatus: ChecksumStatus;
  /** 数据记录（S1/S2/S3）的绝对地址（即地址本身）；其余记录为 null */
  absoluteAddress: number | null;
  /** S0 头部记录数据按 ASCII 解码的文本（不可打印字符以 '.' 替换）；其余记录为 null */
  dataAscii: string | null;
}

/** 一条畸形记录的结构化错误 */
export interface SrecordParseError {
  /** 所在文本行号，从 1 开始 */
  lineNumber: number;
  /** 原始行文本（去除首尾空白后） */
  raw: string;
  /** 错误原因（中文，含期望值 / 实际值等细节） */
  reason: string;
}

/** 解析汇总信息 */
export interface SrecordSummary {
  /** 参与解析的非空行总数（含畸形行） */
  totalLines: number;
  /** 数据记录（S1/S2/S3）条数 */
  dataRecordCount: number;
  /** 头部记录（S0）条数 */
  headerRecordCount: number;
  /** 起始地址 / 终止记录（S7/S8/S9）条数 */
  startRecordCount: number;
  /** 计数记录（S5/S6）条数 */
  countRecordCount: number;
  /** 数据记录载荷总字节数 */
  totalDataBytes: number;
  /** 最低数据地址（含每条记录覆盖的完整字节区间）；无数据记录时为 null */
  minAddress: number | null;
  /** 最高数据地址（末字节地址）；无数据记录时为 null */
  maxAddress: number | null;
  /** 按最高地址宽度数据记录识别出的文件格式；无数据记录时为 null */
  format: SrecordFormat | null;
  /** 最后一条 S5/S6 计数记录声明的数据记录数；不存在时为 null */
  declaredCount: number | null;
  /** 最后一条终止记录（S7/S8/S9）携带的起始地址；不存在时为 null */
  startAddress: number | null;
  /** 终止记录是否恰好一条且位于最后一条记录 */
  endAtEnd: boolean;
  /** 终止记录（S7/S8/S9）条数 */
  endRecordCount: number;
  /** 记录类型分布，键为类型码（如 'S1'、'S9'），值为出现次数 */
  typeDistribution: Record<string, number>;
}

/** parseSrecord 的完整解析结果 */
export interface ParseSrecordResult {
  /** 成功解析的记录（校验和错误的记录仍保留于此） */
  records: SrecordRecord[];
  /** 畸形行与校验和错误，按行号升序 */
  errors: SrecordParseError[];
  /** 不阻断解析的结构性警告（终止记录缺失 / 重复 / 不在末尾、计数不符、S4 保留等） */
  warnings: string[];
  /** 汇总统计 */
  summary: SrecordSummary;
}

/** 记录类型码到中文名的映射常量 */
export const RECORD_TYPE_NAMES: Record<string, string> = {
  S0: '头部记录',
  S1: '16位地址数据',
  S2: '24位地址数据',
  S3: '32位地址数据',
  S4: '保留',
  S5: '计数记录',
  S6: '24位计数记录',
  S7: '32位起始地址终止',
  S8: '24位起始地址终止',
  S9: '16位起始地址终止',
};

/** 结构合法但解析过程中需要携带的中间字段（仅模块内部使用） */
interface StructuralSrecord {
  lineNumber: number;
  raw: string;
  type: SrecordType;
  byteCount: number;
  address: number;
  addressByteWidth: 2 | 3 | 4;
  data: number[];
  checksum: number;
}

/** 数据记录类型集合（仅模块内部使用） */
const DATA_TYPES: ReadonlySet<string> = new Set(['S1', 'S2', 'S3']);

/** 终止记录类型集合（仅模块内部使用） */
const END_TYPES: ReadonlySet<string> = new Set(['S7', 'S8', 'S9']);

/**
 * 校验输入是否为 0-255 的有限整数，不合法时抛出 RangeError。
 *
 * @param value - 待校验数值
 * @param label - 出错信息中使用的字段名
 * @returns 校验通过的原始数值
 * @throws 非有限数 / 非整数 / 超出字节范围时抛出
 */
function assertByte(value: number, label: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${label} 必须是 0-255 的整数，实际值为 ${String(value)}`);
  }
  return value;
}

/**
 * 将一个字节格式化为两位大写十六进制字符串。
 *
 * @param byte - 0-255 的整数
 * @returns 两位大写 hex，如 255 -> 'FF'
 * @throws 入参不是 0-255 的有限整数时抛出 RangeError
 */
export function toHexByte(byte: number): string {
  assertByte(byte, '字节');
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * 将地址格式化为指定宽度的大写十六进制字符串。
 *
 * @param address - 地址数值（内部以 >>> 0 还原为 32 位无符号数）
 * @param width - hex 位数，仅支持 4 / 6 / 8，默认 8（对应 2 / 3 / 4 字节地址）
 * @returns 大写补零 hex，如 toHexAddress(256, 4) -> '0100'
 * @throws 入参不是有限整数时抛出 RangeError
 */
export function toHexAddress(address: number, width: 4 | 6 | 8 = 8): string {
  if (!Number.isFinite(address) || !Number.isInteger(address)) {
    throw new RangeError(`地址必须是有限整数，实际值为 ${String(address)}`);
  }
  const padWidth = width === 4 || width === 6 ? width : 8;
  return (address >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(padWidth, '0');
}

/**
 * 计算一组字节的 S-Record 校验和：
 * 全部字节求和后取低 8 位，再按位取反（(~sum) & 0xFF）。
 *
 * @param bytes - 参与计算的字节数组（byteCount + 地址 + 数据，不含原校验和字节）
 * @returns 正确校验和字节（0-255）
 * @throws 数组中存在非 0-255 的有限整数时抛出 RangeError
 */
export function computeChecksum(bytes: number[]): number {
  let sum = 0;
  bytes.forEach((byte, index) => {
    sum += assertByte(byte, `第 ${index} 个字节`);
  });
  return (~sum) & 0xff;
}

/**
 * 将字节数组按 ASCII 解码为字符串，不可打印字符（0x00-0x1F、0x7F 及其余非 ASCII）以 '.' 替换。
 *
 * @param bytes - 0-255 的字节数组
 * @returns 解码后的可显示字符串
 */
export function decodeAscii(bytes: number[]): string {
  return bytes
    .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.'))
    .join('');
}

/** 判断字符串是否为偶数位纯十六进制字符 */
function isEvenHex(value: string): boolean {
  return value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}

/** 将十六进制字符串按两位一切片为字节数组 */
function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 将无符号地址按指定字节宽度拆成大端字节数组 */
function addressToBytes(address: number, width: 2 | 3 | 4): number[] {
  const bytes: number[] = [];
  for (let shift = (width - 1) * 8; shift >= 0; shift -= 8) {
    bytes.push((address >>> shift) & 0xff);
  }
  return bytes;
}

/**
 * 按记录类型码获取中文名。
 *
 * @param type - 记录类型码（如 'S1'）
 * @returns 已知类型返回中文名，未知类型返回兜底名称
 */
function getRecordTypeName(type: string): string {
  return RECORD_TYPE_NAMES[type] ?? `未知记录类型（${type}）`;
}

/**
 * 解析单行的结构字段（不含校验和判定），结构非法时抛出 Error。
 *
 * @param line - 去除首尾空白后的单行文本
 * @param lineNumber - 行号
 * @returns 结构化记录
 * @throws 行首非 S、类型码未知、长度不足、非法 hex、字节数与载荷不符时抛出
 */
function parseStructure(line: string, lineNumber: number): StructuralSrecord {
  if (!line.startsWith('S')) {
    throw new Error(`第 ${lineNumber} 行：记录必须以字母「S」开头`);
  }
  // 最短合法记录：S + 类型(1) + byteCount(2) + 2 字节地址(4) + checksum(2) = 10 个字符
  if (line.length < 10) {
    throw new Error(`第 ${lineNumber} 行：长度不足，完整记录至少需要 10 个字符`);
  }

  const typeChar = line.charAt(1);
  const typeKey = `S${typeChar}`;
  if (!Object.prototype.hasOwnProperty.call(RECORD_TYPE_NAMES, typeKey)) {
    throw new Error(`第 ${lineNumber} 行：未知记录类型字符「${typeChar}」，类型码必须为 0-9`);
  }
  const type = typeKey as SrecordType;

  const body = line.slice(2);
  if (!isEvenHex(body)) {
    throw new Error(`第 ${lineNumber} 行：包含非法十六进制字符或十六进制位数为奇数`);
  }

  const bytes = hexToBytes(body);
  const byteCount = bytes[0] ?? 0;
  const width = ADDRESS_WIDTHS[type];
  if (width !== 2 && width !== 3 && width !== 4) {
    throw new Error(`第 ${lineNumber} 行：类型 ${type} 缺少地址宽度定义`);
  }
  // byteCount 至少要覆盖地址字节与 1 字节校验和
  if (byteCount < width + 1) {
    throw new Error(
      `第 ${lineNumber} 行：byteCount=${byteCount} 小于该类型最小长度 ${width + 1}` +
        `（${width} 字节地址 + 1 字节校验和）`,
    );
  }
  const expectedLength = 1 + byteCount;
  if (bytes.length !== expectedLength) {
    throw new Error(
      `第 ${lineNumber} 行：byteCount 声明为 ${byteCount}，实际载荷长度与声明不符` +
        `（整行应含 ${expectedLength} 字节，实际 ${bytes.length} 字节）`,
    );
  }

  const addressBytes = bytes.slice(1, 1 + width);
  let address = 0;
  addressBytes.forEach((byte) => {
    address = ((address << 8) | byte) >>> 0;
  });

  const data = bytes.slice(1 + width, bytes.length - 1);
  const checksum = bytes[bytes.length - 1] ?? 0;
  return { lineNumber, raw: line, type, byteCount, address, addressByteWidth: width, data, checksum };
}

/**
 * 由结构字段重建一条规范记录文本（大写 hex，附带正确校验和）。
 *
 * @param structure - 结构合法的记录字段
 * @returns 形如 `S1130000...3D` 的完整记录行
 */
function buildRecordLine(structure: StructuralSrecord): string {
  const payload = [
    structure.byteCount,
    ...addressToBytes(structure.address, structure.addressByteWidth),
    ...structure.data,
  ];
  const checksum = computeChecksum(payload);
  return structure.type + payload.map(toHexByte).join('') + toHexByte(checksum);
}

/**
 * 解析 Motorola S-Record 文本。
 *
 * 逐行解析 `S<type><byteCount><address><data><checksum>` 记录，识别 S19/S28/S37 格式，
 * 校验每行校验和，统计数据记录、头部、计数与终止记录；畸形行与校验和错误进入 errors
 * 且不中断解析，终止记录缺失 / 重复 / 不在末尾、S5/S6 计数不符、S4 保留类型等进入 warnings。
 *
 * @param text - 完整 S-Record 文本（CRLF / LF 均可，空行忽略）
 * @returns 记录列表、错误列表、警告列表与汇总统计
 */
export function parseSrecord(text: string): ParseSrecordResult {
  const lines = text.split(/\r?\n/);
  const records: SrecordRecord[] = [];
  const errors: SrecordParseError[] = [];
  const warnings: string[] = [];
  const typeDistribution: Record<string, number> = {};

  let totalLines = 0;
  let dataRecordCount = 0;
  let headerRecordCount = 0;
  let startRecordCount = 0;
  let countRecordCount = 0;
  let endRecordCount = 0;
  let totalDataBytes = 0;
  let minAddress: number | null = null;
  let maxAddress: number | null = null;
  let maxDataWidth = 0;
  let declaredCount: number | null = null;
  let startAddress: number | null = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }
    const lineNumber = index + 1;
    totalLines += 1;

    let structure: StructuralSrecord;
    try {
      structure = parseStructure(line, lineNumber);
    } catch (err) {
      errors.push({ lineNumber, raw: line, reason: (err as Error).message });
      return;
    }

    const payload = [
      structure.byteCount,
      ...addressToBytes(structure.address, structure.addressByteWidth),
      ...structure.data,
    ];
    const expectedChecksum = computeChecksum(payload);
    const checksumValid = expectedChecksum === structure.checksum;
    if (!checksumValid) {
      errors.push({
        lineNumber,
        raw: line,
        reason:
          `第 ${lineNumber} 行：校验和错误，期望值 0x${toHexByte(expectedChecksum)}，` +
          `实际值 0x${toHexByte(structure.checksum)}`,
      });
    }

    if (structure.type === 'S4') {
      warnings.push(`第 ${lineNumber} 行：S4 为保留记录类型，标准 S-Record 文件不应使用`);
    }

    let absoluteAddress: number | null = null;
    let dataAscii: string | null = null;
    if (DATA_TYPES.has(structure.type)) {
      absoluteAddress = structure.address >>> 0;
      dataRecordCount += 1;
      totalDataBytes += structure.data.length;
      maxDataWidth = Math.max(maxDataWidth, structure.addressByteWidth);
      const start = structure.address >>> 0;
      const end = start + structure.data.length - 1;
      minAddress = minAddress === null ? start : Math.min(minAddress, start);
      maxAddress = maxAddress === null ? end : Math.max(maxAddress, end);
    } else if (structure.type === 'S0') {
      headerRecordCount += 1;
      dataAscii = decodeAscii(structure.data);
    } else if (structure.type === 'S5' || structure.type === 'S6') {
      countRecordCount += 1;
      const expectedDataLength = structure.type === 'S5' ? 2 : 3;
      if (structure.data.length === expectedDataLength) {
        let count = 0;
        structure.data.forEach((byte) => {
          count = ((count << 8) | byte) >>> 0;
        });
        declaredCount = count;
      }
    } else if (END_TYPES.has(structure.type)) {
      endRecordCount += 1;
      startRecordCount += 1;
      startAddress = structure.address >>> 0;
    }

    const typeKey = structure.type;
    typeDistribution[typeKey] = (typeDistribution[typeKey] ?? 0) + 1;

    records.push({
      lineNumber,
      raw: line,
      type: structure.type,
      typeName: getRecordTypeName(structure.type),
      byteCount: structure.byteCount,
      address: structure.address >>> 0,
      addressByteWidth: structure.addressByteWidth,
      data: structure.data,
      checksum: structure.checksum,
      expectedChecksum,
      checksumStatus: checksumValid ? 'valid' : 'invalid',
      absoluteAddress,
      dataAscii,
    });
  });

  const lastRecord = records[records.length - 1] ?? null;
  const endAtEnd =
    endRecordCount === 1 && lastRecord !== null && END_TYPES.has(lastRecord.type);

  if (totalLines > 0 && endRecordCount === 0) {
    warnings.push('缺少终止记录（S7/S8/S9），标准 S-Record 文件应以唯一一条终止记录结尾');
  }
  if (endRecordCount > 1) {
    warnings.push(`检测到 ${endRecordCount} 条终止记录（S7/S8/S9），标准文件应恰好包含一条`);
  }
  if (endRecordCount === 1 && !endAtEnd) {
    warnings.push('终止记录（S7/S8/S9）不在文件末尾，其后仍存在其他记录');
  }
  if (declaredCount !== null && declaredCount !== dataRecordCount) {
    warnings.push(
      `计数记录声明的数据记录数为 ${declaredCount}，实际解析到 ${dataRecordCount} 条 S1/S2/S3 数据记录`,
    );
  }

  const format: SrecordFormat | null =
    maxDataWidth === 4 ? 'S37' : maxDataWidth === 3 ? 'S28' : maxDataWidth === 2 ? 'S19' : null;

  return {
    records,
    errors,
    warnings,
    summary: {
      totalLines,
      dataRecordCount,
      headerRecordCount,
      startRecordCount,
      countRecordCount,
      totalDataBytes,
      minAddress,
      maxAddress,
      format,
      declaredCount,
      startAddress,
      endAtEnd,
      endRecordCount,
      typeDistribution,
    },
  };
}

/**
 * 一键修复整段 S-Record 文本中所有记录行的校验和。
 *
 * 结构合法的行统一重写为大写 hex 并替换为正确校验和；
 * 畸形行与空行原样保留，行顺序与换行结构不变，输出统一使用 LF 换行。
 *
 * @param text - 原始 S-Record 文本
 * @returns 修正后的完整 S-Record 文本
 */
export function fixChecksums(text: string): string {
  return text
    .split(/\r?\n/)
    .map((rawLine) => {
      const line = rawLine.trim();
      if (line === '') {
        return rawLine;
      }
      try {
        return buildRecordLine(parseStructure(line, 1));
      } catch {
        return rawLine;
      }
    })
    .join('\n');
}
