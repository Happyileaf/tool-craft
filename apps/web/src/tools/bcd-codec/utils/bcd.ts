/**
 * BCD（二-十进制编码）零依赖纯函数模块
 *
 * 覆盖四种码制/形态：
 * - 8421 加权码：数字 n 的码组即 n 的 4 位二进制（0000..1001），1010..1111 为非法码组
 * - 余 3 码（Excess-3）：码组 = n + 3 的 4 位二进制（0011..1100），为自补码
 * - 2421 加权码：权重 2/4/2/1，采用标准编码表，0..4 与 8421 相同，5..9 取高位置 1 的形式，
 *   同为自补码；0101..1010 在标准 2421 表中不使用，按非法码组处理
 * - 打包 BCD（packed BCD）：每字节高/低 nibble 各存一位十进制数字（8421 码组），
 *   奇数位数字打包时末字节低 nibble 补 0xF
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出，支持多行批量处理。
 */

export type BcdScheme = '8421' | 'excess3' | '2421';
export type BcdMode = 'encode' | 'decode' | 'pack' | 'unpack';

export interface BcdNibble {
  /** 该码组对应的十进制数字（解码失败时为 null） */
  digit: string | null;
  /** 4 位二进制码组 */
  binary: string;
  /** 码组非法时的说明 */
  error: string | null;
}

export interface BcdResult {
  valid: boolean;
  /** 主输出：码组方向为分组二进制串，打包方向为十六进制字节串 */
  output: string;
  /** 逐码组/逐字节明细，供界面展示对应关系 */
  nibbles: BcdNibble[];
  /** 打包 BCD 专用：十六进制字节序列 */
  bytes: string[];
  error: string | null;
}

/** 8421 码表：下标即数字 */
const ENCODE_8421 = ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001'];

/** 余 3 码表：码组 = 数字 + 3 */
const ENCODE_EXCESS3 = ['0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100'];

/** 2421 加权码标准编码表（0..4 同 8421，5..9 高位恒 1） */
const ENCODE_2421 = ['0000', '0001', '0010', '0011', '0100', '1011', '1100', '1101', '1110', '1111'];

const SCHEME_TABLES: Record<BcdScheme, string[]> = {
  '8421': ENCODE_8421,
  excess3: ENCODE_EXCESS3,
  '2421': ENCODE_2421,
};

const SCHEME_LABELS: Record<BcdScheme, string> = {
  '8421': '8421 码',
  excess3: '余 3 码',
  '2421': '2421 码',
};

function fail(error: string): BcdResult {
  return { valid: false, output: '', nibbles: [], bytes: [], error };
}

/** 数字 → 4 位码组（单码制方向，仅接受 0..9） */
function encodeDigit(digit: string, scheme: BcdScheme): BcdNibble {
  if (!/^\d$/.test(digit)) {
    return { digit: null, binary: '', error: `字符 "${digit}" 不是十进制数字` };
  }
  const table = SCHEME_TABLES[scheme];
  return { digit, binary: table[Number(digit)]!, error: null };
}

/** 4 位码组 → 数字，非法码组返回错误明细 */
function decodeNibble(binary: string, scheme: BcdScheme): BcdNibble {
  if (!/^[01]{4}$/.test(binary)) {
    return { digit: null, binary, error: `"${binary}" 不是 4 位二进制码组` };
  }
  const table = SCHEME_TABLES[scheme];
  const index = table.indexOf(binary);
  if (index === -1) {
    return { digit: null, binary, error: `码组 ${binary} 是 ${SCHEME_LABELS[scheme]}的非法码组` };
  }
  return { digit: String(index), binary, error: null };
}

/** 拆出输入中的 4 位码组：支持空格分隔或连续二进制串（长度须为 4 的倍数） */
function parseNibbleGroups(rawInput: string): string[] | string {
  const cleaned = rawInput.replace(/^0b/i, '').trim();
  if (cleaned === '') return '内容不能为空';
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const only = tokens[0];
  if (tokens.length === 1 && only !== undefined && only.length > 4) {
    if (only.length % 4 !== 0) {
      return `连续二进制长度 ${only.length} 不是 4 的倍数，无法按码组切分`;
    }
    if (!/^[01]+$/.test(only)) return '只能包含 0、1 与分隔空格';
    return only.match(/.{4}/g) as string[];
  }
  for (const token of tokens) {
    if (!/^[01]{4}$/.test(token)) {
      return `"${token}" 不是 4 位二进制码组`;
    }
  }
  return tokens;
}

/** 十进制串 → 指定码制的码组序列 */
export function encodeBcd(rawInput: string, scheme: BcdScheme): BcdResult {
  const digits = rawInput.replace(/\s+/g, '');
  if (digits === '') return fail('内容不能为空');
  if (!/^\d+$/.test(digits)) return fail('只能输入十进制数字（0..9）');

  const nibbles = digits.split('').map((digit) => encodeDigit(digit, scheme));
  const bad = nibbles.find((nibble) => nibble.error !== null);
  if (bad) return fail(bad.error as string);

  return {
    valid: true,
    output: nibbles.map((nibble) => nibble.binary).join(' '),
    nibbles,
    bytes: [],
    error: null,
  };
}

/** 码组序列 → 十进制串 */
export function decodeBcd(rawInput: string, scheme: BcdScheme): BcdResult {
  const groups = parseNibbleGroups(rawInput);
  if (typeof groups === 'string') return fail(groups);

  const nibbles = groups.map((group) => decodeNibble(group, scheme));
  const bad = nibbles.find((nibble) => nibble.error !== null);
  if (bad) return fail(bad.error as string);

  return {
    valid: true,
    output: nibbles.map((nibble) => nibble.digit).join(''),
    nibbles,
    bytes: [],
    error: null,
  };
}

/** 解析十六进制字节输入：去除 0x 前缀与空白，要求偶数位 hex */
function parseHexBytes(rawInput: string): string[] | string {
  const cleaned = rawInput.replace(/0x/gi, '').replace(/[\s,]+/g, '').toUpperCase();
  if (cleaned === '') return '内容不能为空';
  if (!/^[0-9A-F]+$/.test(cleaned)) return '只能包含十六进制字符（0..9、A..F）';
  if (cleaned.length % 2 !== 0) return '十六进制位数必须为偶数，每两位构成一个字节';
  return cleaned.match(/.{2}/g) as string[];
}

function to4Bit(value: number): string {
  return value.toString(2).padStart(4, '0');
}

/** 十进制串 → 打包 BCD 字节（8421 码组，奇数位末 nibble 补 0xF） */
export function packBcd(rawInput: string): BcdResult {
  const digits = rawInput.replace(/\s+/g, '');
  if (digits === '') return fail('内容不能为空');
  if (!/^\d+$/.test(digits)) return fail('只能输入十进制数字（0..9）');

  const nibbles = digits.split('').map((digit) => encodeDigit(digit, '8421'));
  const padded = nibbles.length % 2 === 1;
  if (padded) {
    nibbles.push({ digit: null, binary: '1111', error: null });
  }

  const bytes: string[] = [];
  for (let i = 0; i < nibbles.length; i += 2) {
    const high = parseInt(nibbles[i]!.binary, 2);
    const low = parseInt(nibbles[i + 1]!.binary, 2);
    bytes.push(((high << 4) | low).toString(16).toUpperCase().padStart(2, '0'));
  }

  return {
    valid: true,
    output: bytes.join(' '),
    nibbles,
    bytes,
    error: padded ? '数字位数为奇数，末字节低 nibble 已按惯例补 0xF' : null,
  };
}

/** 打包 BCD 字节 → 十进制串 */
export function unpackBcd(rawInput: string): BcdResult {
  const byteList = parseHexBytes(rawInput);
  if (typeof byteList === 'string') return fail(byteList);

  const nibbles: BcdNibble[] = [];
  const lastByteIndex = byteList.length - 1;
  let paddingF = false;
  byteList.forEach((byteHex, byteIndex) => {
    const byte = parseInt(byteHex, 16);
    const values = [byte >> 4, byte & 0x0f];
    values.forEach((value, nibbleIndex) => {
      const isTrailingPad =
        byteIndex === lastByteIndex && nibbleIndex === 1 && value === 0x0f;
      if (isTrailingPad) {
        // 仅末字节低 nibble 允许 0xF 填充位，解码时跳过不计入数字
        paddingF = true;
        nibbles.push({ digit: null, binary: '1111', error: null });
        return;
      }
      if (value > 9) {
        nibbles.push({
          digit: null,
          binary: to4Bit(value),
          error: `nibble ${to4Bit(value)}（0x${value.toString(16).toUpperCase()}）是非法 8421 码组`,
        });
      } else {
        nibbles.push({ digit: String(value), binary: to4Bit(value), error: null });
      }
    });
  });

  const bad = nibbles.find((nibble) => nibble.error !== null);
  if (bad) return fail(bad.error as string);

  return {
    valid: true,
    output: nibbles.map((nibble) => nibble.digit ?? '').join(''),
    nibbles,
    bytes: byteList,
    error: paddingF ? '检测到末字节低 nibble 为 0xF 填充位，已自动跳过' : null,
  };
}

/** 单行统一入口，按模式分派 */
export function processLine(rawLine: string, mode: BcdMode, scheme: BcdScheme): BcdResult {
  switch (mode) {
    case 'encode':
      return encodeBcd(rawLine, scheme);
    case 'decode':
      return decodeBcd(rawLine, scheme);
    case 'pack':
      return packBcd(rawLine);
    default:
      return unpackBcd(rawLine);
  }
}

/** 多行批量处理，空行跳过 */
export function processBatch(rawBatch: string, mode: BcdMode, scheme: BcdScheme): BcdResult[] {
  return rawBatch
    .split(/\r?\n/)
    .map((line) => (line.trim() === '' ? null : processLine(line, mode, scheme)))
    .filter((result): result is BcdResult => result !== null);
}
