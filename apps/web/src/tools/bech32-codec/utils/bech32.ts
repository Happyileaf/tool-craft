/**
 * Bech32 / Bech32m 编解码纯函数（BIP-173 / BIP-350）
 *
 * 全部运算为同步本地运算，无任何外部依赖。
 */

/** Bech32 数据部分字符集（BIP-173） */
export const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/** Bech32 校验和常量（witness version 0） */
export const BECH32_CONST = 1;

/** Bech32m 校验和常量（witness version 1+，BIP-350） */
export const BECH32M_CONST = 0x2bc830a3;

/** BIP-173 规定的最大编码长度 */
export const BECH32_MAX_LENGTH = 90;

/** 校验和类型 */
export type ChecksumType = 'bech32' | 'bech32m';

/** 编码类型选择 */
export type EncodeKind = 'bech32' | 'bech32m' | 'auto';

/** 解码结果 */
export interface Bech32Decoded {
  hrp: string;
  /** 5-bit 数据（不含 6 位校验和） */
  data: number[];
  checksumType: ChecksumType;
}

/** SegWit 解读结果 */
export interface SegwitInfo {
  network: string;
  witnessVersion: number;
  programHex: string;
  /** 可明确判定的脚本类型，无法命名时为 null */
  scriptType: 'P2WPKH' | 'P2WSH' | 'P2TR' | null;
}

const CHARSET_RE = /^[ -~]+$/;

/** polymod 步进系数（BIP-173） */
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

/**
 * Bech32 polymod 校验和运算
 *
 * @param values - HRP 展开值 + 数据 + 校验和
 * @returns 30 位校验值
 */
export function polymod(values: number[]): number {
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i] as number;
      }
    }
  }
  return chk;
}

/**
 * 展开 HRP：高位值 + 0 分隔 + 低位值
 *
 * @param hrp - human-readable part
 * @returns 展开后的数值数组
 */
export function hrpExpand(hrp: string): number[] {
  const lower = hrp.toLowerCase();
  const result: number[] = [];
  for (const char of lower) {
    result.push(char.charCodeAt(0) >> 5);
  }
  result.push(0);
  for (const char of lower) {
    result.push(char.charCodeAt(0) & 31);
  }
  return result;
}

/**
 * 按给定常量校验校验和
 *
 * @param hrp - human-readable part
 * @param data - 含 6 位校验和的完整 5-bit 数据
 * @param constant - 校验常量
 * @returns 是否通过
 */
export function verifyChecksum(hrp: string, data: number[], constant: number): boolean {
  return polymod(hrpExpand(hrp).concat(data)) === constant;
}

/**
 * 生成 6 位 5-bit 校验和
 *
 * @param hrp - human-readable part
 * @param data - 不含校验和的 5-bit 数据
 * @param constant - 校验常量
 * @returns 6 位校验和
 */
export function createChecksum(hrp: string, data: number[], constant: number): number[] {
  const expanded = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(expanded) ^ constant;
  const result: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    result.push((mod >> (5 * (5 - i))) & 31);
  }
  return result;
}

/**
 * 编码 Bech32 / Bech32m
 *
 * @param hrp - human-readable part，1..83 个 ASCII 可见字符
 * @param data - 5-bit 数据（每个值 0..31，不含校验和）
 * @param kind - bech32 / bech32m / auto（auto 按首字节 witness version 选择）
 * @returns 完整 bech32 字符串
 */
export function encodeBech32(hrp: string, data: number[], kind: EncodeKind = 'auto'): string {
  const normalized = normalizeHrp(hrp);
  validateHrp(normalized);
  for (const value of data) {
    if (!Number.isInteger(value) || value < 0 || value > 31) {
      throw new Error('数据必须是 0..31 的 5-bit 值');
    }
  }
  let checksumType: ChecksumType;
  if (kind === 'auto') {
    const version = data[0];
    checksumType = version === undefined || version === 0 ? 'bech32' : 'bech32m';
  } else {
    checksumType = kind;
  }
  const constant = checksumType === 'bech32' ? BECH32_CONST : BECH32M_CONST;
  const checksum = createChecksum(normalized, data, constant);
  const combined = data.concat(checksum);
  let result = `${normalized}1`;
  for (const value of combined) {
    result += BECH32_CHARSET[value];
  }
  return result;
}

/**
 * 解码 Bech32 字符串，同时用两种常量探测校验和类型
 *
 * @param input - 待解码字符串
 * @returns HRP、5-bit 数据（不含校验和）与校验和类型
 */
export function decodeBech32(input: string): Bech32Decoded {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('输入为空');
  }
  if (trimmed.length > BECH32_MAX_LENGTH) {
    throw new Error(`长度超过 BIP-173 上限 ${BECH32_MAX_LENGTH} 字符`);
  }
  if (trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase()) {
    throw new Error('不允许混用大小写');
  }
  if (!CHARSET_RE.test(trimmed)) {
    throw new Error('包含非 ASCII 可见字符');
  }
  const lower = trimmed.toLowerCase();
  const separator = lower.lastIndexOf('1');
  if (separator < 1) {
    throw new Error('缺少 HRP 与数据之间的分隔符 “1”');
  }
  const hrp = lower.slice(0, separator);
  const payload = lower.slice(separator + 1);
  validateHrp(hrp);
  if (payload.length < 6) {
    throw new Error('数据部分过短，至少需要 6 位校验和');
  }
  const data: number[] = [];
  for (const char of payload) {
    const index = BECH32_CHARSET.indexOf(char);
    if (index === -1) {
      throw new Error(`非法字符 “${char}”，不属于 Bech32 字符集`);
    }
    data.push(index);
  }
  const isBech32 = verifyChecksum(hrp, data, BECH32_CONST);
  const isBech32m = verifyChecksum(hrp, data, BECH32M_CONST);
  if (!isBech32 && !isBech32m) {
    throw new Error('校验和无效：Bech32 与 Bech32m 常量均不匹配');
  }
  if (isBech32 && isBech32m) {
    // 理论上不会发生，防御性处理
    throw new Error('校验和同时匹配两种常量，输入异常');
  }
  return {
    hrp,
    data: data.slice(0, data.length - 6),
    checksumType: isBech32 ? 'bech32' : 'bech32m',
  };
}

/**
 * 规范化 HRP（转小写、去首尾空白）
 *
 * @param hrp - 原始 HRP
 * @returns 小写 HRP
 */
export function normalizeHrp(hrp: string): string {
  return hrp.trim().toLowerCase();
}

/**
 * 校验 HRP 合法性
 *
 * @param hrp - 已小写化的 HRP
 */
export function validateHrp(hrp: string): void {
  if (hrp.length === 0) {
    throw new Error('HRP 不能为空');
  }
  if (hrp.length > 83) {
    throw new Error('HRP 长度不能超过 83');
  }
  for (const char of hrp) {
    const code = char.charCodeAt(0);
    // BIP-173 要求 HRP 每个字符为 33..126 的 ASCII 可见字符
    if (code < 33 || code > 126) {
      throw new Error('HRP 只能包含 ASCII 可见字符');
    }
  }
}

/**
 * 在 fromBits 与 toBits 之间做通用基数转换（convertbits）
 *
 * @param data - 输入数值数组
 * @param fromBits - 输入位宽（如 8）
 * @param toBits - 输出位宽（如 5）
 * @param pad - 是否允许补零
 * @returns 转换后的数值数组
 */
export function convertBits(
  data: ArrayLike<number>,
  fromBits: number,
  toBits: number,
  pad: boolean,
): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i] as number;
    if (value < 0 || (value >> fromBits) !== 0) {
      throw new Error(`存在超出 ${fromBits} 位范围的数值：${value}`);
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv) !== 0) {
    throw new Error('padding 非零或存在未消费的剩余位，数据非法');
  }
  return result;
}

/**
 * 将十六进制字符串解析为字节数组（允许空格与 0x 前缀）
 *
 * @param hex - 十六进制字符串
 * @returns 字节数组
 */
export function hexToBytes(hex: string): number[] {
  const cleaned = hex
    .trim()
    .replace(/^0x/i, '')
    .replace(/\s+/g, '');
  if (cleaned.length === 0) {
    throw new Error('十六进制输入为空');
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制长度必须为偶数');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * 字节数组转小写十六进制
 *
 * @param bytes - 字节数组
 * @returns 十六进制字符串
 */
export function bytesToHex(bytes: ArrayLike<number>): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += (bytes[i] as number).toString(16).padStart(2, '0');
  }
  return result;
}

const SEGWIT_NETWORKS: Record<string, string> = {
  bc: '比特币主网',
  tb: '比特币测试网（testnet）',
  bcrt: '比特币回归测试网（regtest）',
};

const VALID_PROGRAM_LENGTHS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);

/**
 * 解读 SegWit 地址：校验 witness version / program 长度并命名常见脚本类型
 *
 * @param decoded - decodeBech32 的结果
 * @returns SegWit 信息；不是已知网络或结构非法时返回 null
 */
export function interpretSegwit(decoded: Bech32Decoded): SegwitInfo | null {
  const network = SEGWIT_NETWORKS[decoded.hrp];
  if (!network || decoded.data.length === 0) {
    return null;
  }
  const version = decoded.data[0] as number;
  if (version < 0 || version > 16) {
    return null;
  }
  // version 0 必须使用 Bech32；version 1+ 必须使用 Bech32m
  if (version === 0 && decoded.checksumType !== 'bech32') {
    throw new Error('witness version 0 必须使用 Bech32 校验常量');
  }
  if (version > 0 && decoded.checksumType !== 'bech32m') {
    throw new Error(`witness version ${version} 必须使用 Bech32m 校验常量`);
  }
  const program = convertBits(decoded.data.slice(1), 5, 8, false);
  if (!VALID_PROGRAM_LENGTHS.has(program.length)) {
    throw new Error(`witness program 长度 ${program.length} 字节不合法（允许 2..40 字节）`);
  }
  if (version === 0 && program.length !== 20 && program.length !== 32) {
    throw new Error('version 0 的 witness program 只能是 20（P2WPKH）或 32（P2WSH）字节');
  }
  let scriptType: SegwitInfo['scriptType'] = null;
  if (version === 0 && program.length === 20) {
    scriptType = 'P2WPKH';
  } else if (version === 0 && program.length === 32) {
    scriptType = 'P2WSH';
  } else if (version === 1 && program.length === 32) {
    scriptType = 'P2TR';
  }
  return {
    network,
    witnessVersion: version,
    programHex: bytesToHex(program),
    scriptType,
  };
}
