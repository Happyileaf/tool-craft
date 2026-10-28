/**
 * UTF-8 文本 ↔ 十六进制互转与经典 hex dump 格式化（零依赖纯函数）
 *
 * TextEncoder / TextDecoder 由运行环境（浏览器 / Node）提供，
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出。
 */

export type HexSeparator = 'none' | 'space' | '0x' | 'colon';
export type HexCase = 'lower' | 'upper';
export type HexOutputMode = 'plain' | 'dump';

export interface EncodeOptions {
  hexCase: HexCase;
  separator: HexSeparator;
  mode: HexOutputMode;
}

export interface HexResult {
  output: string;
  error: string | null;
}

const HEX_LOWER = '0123456789abcdef';

/** 把字符串编码为 UTF-8 字节序列 */
export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** 单字节转两位十六进制 */
function byteToHex(byte: number, hexCase: HexCase): string {
  const high = HEX_LOWER[byte >> 4] ?? '0';
  const low = HEX_LOWER[byte & 0x0f] ?? '0';
  const pair = high + low;
  return hexCase === 'upper' ? pair.toUpperCase() : pair;
}

/** 文本 → 十六进制串（可选分隔符） */
export function textToHex(text: string, options: EncodeOptions): HexResult {
  const bytes = encodeUtf8(text);
  if (options.mode === 'dump') {
    return { output: bytesToDump(bytes), error: null };
  }
  const pairs: string[] = [];
  for (const byte of bytes) {
    pairs.push(byteToHex(byte, options.hexCase));
  }
  let output: string;
  switch (options.separator) {
    case 'space':
      output = pairs.join(' ');
      break;
    case 'colon':
      output = pairs.join(':');
      break;
    case '0x':
      output = pairs.map((pair) => `0x${pair}`).join(' ');
      break;
    default:
      output = pairs.join('');
  }
  return { output, error: null };
}

/** 从宽松的十六进制文本中提取字节；容忍空白、0x、冒号、连字符、换行 */
export function parseHexBytes(input: string): Uint8Array {
  const cleaned = input
    .replace(/0x/gi, '')
    .replace(/[\s:,-]+/g, '');
  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error(`十六进制位数必须为偶数，当前为 ${cleaned.length} 位（可能缺少一个字符）`);
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    const invalid = cleaned.match(/[^0-9a-fA-F]/);
    throw new Error(
      `包含非法十六进制字符「${invalid ? invalid[0] : ''}」，仅允许 0-9、a-f、A-F`,
    );
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}

/** 字节序列按 fatal UTF-8 解码为文本 */
export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** 十六进制串 → 文本；非法 hex 或非法 UTF-8 返回错误 */
export function hexToText(input: string): HexResult {
  try {
    const bytes = parseHexBytes(input);
    return { output: decodeUtf8(bytes), error: null };
  } catch (err) {
    return { output: '', error: (err as Error).message };
  }
}

/** 偏移量转 8 位十六进制 */
function formatOffset(offset: number): string {
  return offset.toString(16).padStart(8, '0');
}

/** 可打印 ASCII（0x20-0x7e）原样显示，其余显示为 . */
function byteToAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.';
}

/**
 * 生成经典 hex dump：每行 16 字节
 * 「偏移 | 前 8 字节  后 8 字节 | ASCII 预览」
 */
export function bytesToDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const slice = bytes.slice(offset, offset + 16);
    const hexPairs: string[] = [];
    const asciiChars: string[] = [];
    for (let i = 0; i < 16; i++) {
      if (i < slice.length) {
        const byte = slice[i] ?? 0;
        hexPairs.push(byteToHex(byte, 'lower'));
        asciiChars.push(byteToAscii(byte));
      } else {
        hexPairs.push('  ');
        asciiChars.push(' ');
      }
    }
    const hexArea =
      hexPairs.slice(0, 8).join(' ') + '  ' + hexPairs.slice(8, 16).join(' ');
    lines.push(`${formatOffset(offset)}  ${hexArea}  |${asciiChars.join('')}|`);
  }
  return lines.join('\n');
}

/** 便捷封装：文本 → hex dump */
export function textToDump(text: string): string {
  return bytesToDump(encodeUtf8(text));
}
