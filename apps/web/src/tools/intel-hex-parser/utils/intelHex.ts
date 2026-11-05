/**
 * Intel HEX（I8HEX / HEX-32 / HEX-86）解析与校验和工具的纯函数实现。
 *
 * 记录行格式：`:LLAAAATT[DD...]CC`
 * - LL：数据字节数（1 字节，2 位十六进制）
 * - AAAA：16 位起始地址
 * - TT：记录类型（00-05）
 * - DD：LL 个数据字节
 * - CC：校验和（行内全部字节之和按 256 取模应为 0）
 *
 * 本模块不依赖 DOM 与 React，所有运算均为本地确定性运算；
 * 畸形行以带行号的错误返回，不抛出异常、不中断后续行的解析。
 */

/** Intel HEX 记录类型（00-05） */
export type RecordType = 0 | 1 | 2 | 3 | 4 | 5;

/** 校验和状态 */
export type ChecksumStatus = 'valid' | 'invalid';

/** 一条成功解析的 Intel HEX 记录 */
export interface HexRecord {
  /** 所在文本行号，从 1 开始（空行不编号） */
  lineNumber: number;
  /** 原始行文本（去除首尾空白后） */
  raw: string;
  /** LL 字段声明的数据字节数 */
  byteCount: number;
  /** AAAA 字段：16 位行内地址（偏移量） */
  address: number;
  /** TT 字段：记录类型 */
  type: number;
  /** 记录类型中文名，未知类型给出兜底名称 */
  typeName: string;
  /** DD 字段：数据载荷字节数组（不含地址、类型与校验和） */
  data: number[];
  /** CC 字段：行内实际携带的校验和字节 */
  checksum: number;
  /** 依据行内字节重新计算出的期望校验和 */
  expectedChecksum: number;
  /** 校验和状态 */
  checksumStatus: ChecksumStatus;
  /** 数据记录（type 00）的绝对地址；非数据记录为 null */
  absoluteAddress: number | null;
}

/** 一条畸形记录的结构化错误 */
export interface HexParseError {
  /** 所在文本行号，从 1 开始 */
  lineNumber: number;
  /** 原始行文本（去除首尾空白后） */
  raw: string;
  /** 错误原因（中文，含期望值 / 实际值等细节） */
  reason: string;
}

/** 解析汇总信息 */
export interface HexSummary {
  /** 参与解析的非空行总数（含畸形行） */
  totalLines: number;
  /** 数据记录（type 00）条数 */
  dataRecordCount: number;
  /** 数据记录载荷总字节数 */
  totalDataBytes: number;
  /** 最低绝对地址（含每条数据记录覆盖的完整字节区间）；无数据记录时为 null */
  minAddress: number | null;
  /** 最高绝对地址（末字节地址）；无数据记录时为 null */
  maxAddress: number | null;
  /** 记录类型分布，键为两位大写十六进制类型码（如 '00'、'04'），值为出现次数 */
  typeDistribution: Record<string, number>;
  /** EOF（type 01）记录条数 */
  eofCount: number;
  /** EOF 记录是否恰好一条且位于最后一条记录 */
  eofAtEnd: boolean;
}

/** parseIntelHex 的完整解析结果 */
export interface ParseResult {
  /** 成功解析的记录（校验和错误的记录仍保留于此） */
  records: HexRecord[];
  /** 畸形行与校验和错误，按行号升序 */
  errors: HexParseError[];
  /** 不阻断解析的结构性警告（EOF 缺失 / 重复 / 不在末尾等） */
  warnings: string[];
  /** 汇总统计 */
  summary: HexSummary;
}

/** 记录类型码到中文名的映射常量 */
export const RECORD_TYPE_NAMES: Record<RecordType, string> = {
  0: '数据',
  1: '文件结束（EOF）',
  2: '扩展段地址',
  3: '起始段地址',
  4: '扩展线性地址',
  5: '起始线性地址',
};

/** 结构合法但解析过程中需要携带的中间错误（仅模块内部使用） */
interface StructuralRecord {
  lineNumber: number;
  raw: string;
  byteCount: number;
  address: number;
  type: number;
  data: number[];
  checksum: number;
}

/**
 * 按记录类型码获取中文名。
 *
 * @param type - 记录类型数字（0-255）
 * @returns 已知类型返回中文名，未知类型返回「未知记录类型（0xNN）」
 */
export function getRecordTypeName(type: number): string {
  if (type === 0 || type === 1 || type === 2 || type === 3 || type === 4 || type === 5) {
    return RECORD_TYPE_NAMES[type];
  }
  return `未知记录类型（0x${toHexByte(type)}）`;
}

/**
 * 将一个字节格式化为两位大写十六进制字符串。
 *
 * @param byte - 0-255 的整数
 * @returns 两位大写 hex，如 255 -> 'FF'
 */
export function toHexByte(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * 将 16 位字格式化为四位大写十六进制字符串。
 *
 * @param word - 0-65535 的整数
 * @returns 四位大写 hex，如 256 -> '0100'
 */
export function toHexWord(word: number): string {
  return word.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * 将完整地址格式化为八位大写十六进制字符串。
 *
 * @param address - 绝对地址
 * @returns 八位大写 hex，如 256 -> '00000100'
 */
export function toHexAddress(address: number): string {
  return (address >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
}

/**
 * 计算一组字节的 Intel HEX 校验和：
 * 全部字节求和后按 256 取模，再对 256 取补。
 *
 * @param bytes - 参与计算的字节数组（不含原校验和字节）
 * @returns 两位 hex 对应的正确校验和字节（0-255）
 */
export function computeChecksum(bytes: number[]): number {
  const sum = bytes.reduce((acc, byte) => acc + byte, 0) & 0xff;
  return (256 - sum) & 0xff;
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

/**
 * 解析单行的结构字段（不含校验和判定），结构非法时抛出 Error。
 *
 * @param line - 去除首尾空白后的单行文本
 * @param lineNumber - 行号
 * @returns 结构化记录
 * @throws 行首非冒号、长度不足、非法 hex、字节数与载荷不符时抛出
 */
function parseStructure(line: string, lineNumber: number): StructuralRecord {
  if (!line.startsWith(':')) {
    throw new Error(`第 ${lineNumber} 行：记录必须以冒号「:」开头`);
  }
  const body = line.slice(1);
  // 最短合法记录：LL(2) + AAAA(4) + TT(2) + CC(2) = 10 个字符
  if (body.length < 10) {
    throw new Error(`第 ${lineNumber} 行：长度不足，完整记录至少需要 11 个字符（含冒号）`);
  }
  if (!isEvenHex(body)) {
    throw new Error(`第 ${lineNumber} 行：包含非法十六进制字符或十六进制位数为奇数`);
  }

  const bytes = hexToBytes(body);
  const byteCount = bytes[0] ?? 0;
  const address = ((bytes[1] ?? 0) << 8) | (bytes[2] ?? 0);
  const type = bytes[3] ?? 0;
  const expectedLength = 4 + byteCount + 1;
  if (bytes.length !== expectedLength) {
    throw new Error(
      `第 ${lineNumber} 行：声明字节数为 ${byteCount}，实际载荷长度与声明不符` +
        `（整行应含 ${expectedLength} 字节，实际 ${bytes.length} 字节）`,
    );
  }

  const data = bytes.slice(4, 4 + byteCount);
  const checksum = bytes[bytes.length - 1] ?? 0;
  return { lineNumber, raw: line, byteCount, address, type, data, checksum };
}

/**
 * 解析 Intel HEX 文本。
 *
 * 逐行解析 `:LLAAAATT[DD...]CC` 记录，跟踪扩展线性地址（type 04，高 16 位基址）
 * 与扩展段地址（type 02，段址 × 16），计算每条数据记录的绝对地址；
 * 畸形行与校验和错误进入 errors 且不中断解析，EOF 唯一性问题进入 warnings。
 *
 * @param text - 完整 Intel HEX 文本（CRLF / LF 均可，空行忽略）
 * @returns 记录列表、错误列表、警告列表与汇总统计
 */
export function parseIntelHex(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const records: HexRecord[] = [];
  const errors: HexParseError[] = [];
  const typeDistribution: Record<string, number> = {};

  let linearBase = 0;
  let segmentBase = 0;
  let dataRecordCount = 0;
  let totalDataBytes = 0;
  let minAddress: number | null = null;
  let maxAddress: number | null = null;
  let totalLines = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }
    const lineNumber = index + 1;
    totalLines += 1;

    let structure: StructuralRecord;
    try {
      structure = parseStructure(line, lineNumber);
    } catch (err) {
      errors.push({ lineNumber, raw: line, reason: (err as Error).message });
      return;
    }

    const payloadBytes = [
      structure.byteCount,
      (structure.address >> 8) & 0xff,
      structure.address & 0xff,
      structure.type,
      ...structure.data,
    ];
    const expectedChecksum = computeChecksum(payloadBytes);
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

    // 基址跟踪：04 设置高 16 位线性基址，02 设置段基址（段址 × 16），两者互斥重置
    if (structure.type === 4 && structure.data.length >= 2) {
      linearBase = ((structure.data[0] ?? 0) << 8) | (structure.data[1] ?? 0);
      segmentBase = 0;
    } else if (structure.type === 2 && structure.data.length >= 2) {
      segmentBase = (((structure.data[0] ?? 0) << 8) | (structure.data[1] ?? 0)) * 16;
      linearBase = 0;
    }

    let absoluteAddress: number | null = null;
    if (structure.type === 0) {
      absoluteAddress = (linearBase << 16) + segmentBase + structure.address;
      dataRecordCount += 1;
      totalDataBytes += structure.byteCount;
      const endAddress = absoluteAddress + structure.byteCount - 1;
      minAddress = minAddress === null ? absoluteAddress : Math.min(minAddress, absoluteAddress);
      maxAddress = maxAddress === null ? endAddress : Math.max(maxAddress, endAddress);
    }

    const typeKey = toHexByte(structure.type);
    typeDistribution[typeKey] = (typeDistribution[typeKey] ?? 0) + 1;

    records.push({
      lineNumber,
      raw: line,
      byteCount: structure.byteCount,
      address: structure.address,
      type: structure.type,
      typeName: getRecordTypeName(structure.type),
      data: structure.data,
      checksum: structure.checksum,
      expectedChecksum,
      checksumStatus: checksumValid ? 'valid' : 'invalid',
      absoluteAddress,
    });
  });

  const eofCount = records.filter((record) => record.type === 1).length;
  const lastRecord = records[records.length - 1] ?? null;
  const eofAtEnd = eofCount === 1 && lastRecord !== null && lastRecord.type === 1;

  const warnings: string[] = [];
  if (totalLines > 0 && eofCount === 0) {
    warnings.push('缺少 EOF（type 01）记录，标准 Intel HEX 文件应以唯一一条 EOF 记录结尾');
  }
  if (eofCount > 1) {
    warnings.push(`检测到 ${eofCount} 条 EOF（type 01）记录，标准文件应恰好包含一条`);
  }
  if (eofCount === 1 && !eofAtEnd) {
    warnings.push('EOF（type 01）记录不在文件末尾，其后仍存在其他记录');
  }

  return {
    records,
    errors,
    warnings,
    summary: {
      totalLines,
      dataRecordCount,
      totalDataBytes,
      minAddress,
      maxAddress,
      typeDistribution,
      eofCount,
      eofAtEnd,
    },
  };
}

/**
 * 由结构字段重建一条规范记录文本（大写 hex，附带正确校验和）。
 *
 * @param structure - 结构合法的记录字段
 * @returns 形如 `:10010000...40` 的完整记录行
 */
function buildRecordLine(structure: StructuralRecord): string {
  const payloadBytes = [
    structure.byteCount,
    (structure.address >> 8) & 0xff,
    structure.address & 0xff,
    structure.type,
    ...structure.data,
  ];
  const checksum = computeChecksum(payloadBytes);
  return ':' + payloadBytes.map(toHexByte).join('') + toHexByte(checksum);
}

/**
 * 重新计算单行记录的校验和并返回修正后的完整记录行。
 *
 * 仅要求数据 / 地址 / 类型结构合法（校验和本身可以错误，也允许用户编辑过载荷）；
 * 结构非法（非冒号开头、非法 hex、长度不足、字节数不符）时抛出 Error。
 *
 * @param line - 原始记录行文本
 * @returns 大写 hex、携带正确两位校验和的完整记录行
 * @throws 结构非法时抛出带行内细节的 Error
 */
export function recalcChecksum(line: string): string {
  const trimmed = line.trim();
  // 单行场景固定按第 1 行报错，错误信息与 parseIntelHex 保持一致
  const structure = parseStructure(trimmed, 1);
  return buildRecordLine(structure);
}

/**
 * 一键修复整段 HEX 文本中所有记录行的校验和。
 *
 * 结构合法的行统一重写为大写 hex 并替换为正确校验和；
 * 畸形行与空行原样保留，行顺序与换行结构不变。
 *
 * @param text - 原始 Intel HEX 文本
 * @returns 修正后的完整 HEX 文本
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
        return recalcChecksum(line);
      } catch {
        return rawLine;
      }
    })
    .join('\n');
}
