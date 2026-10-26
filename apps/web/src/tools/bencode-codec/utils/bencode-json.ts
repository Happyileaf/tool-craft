/**
 * Bencode 与 JSON 之间双向转换的纯函数。
 * Bencode 字节串是二进制安全的，无法直接映射为 JSON 字符串，
 * 因此非 UTF-8 的原始字节串以 { "$$bencodeBytes$$": "<小写十六进制>" } 标记对象呈现，
 * 反向转换时识别该标记还原为 Uint8Array，保证信息无损往返。
 */
import {
  BencodeDict,
  BencodeValue,
  decodeBencode,
  encodeBencode,
} from './bencode';
import { bytesToLatin1, latin1ToBytes } from './bytes-text';

/** JSON 侧原始字节串标记键 */
export const BYTES_MARKER = '$$bencodeBytes$$';

/** JSON 侧可表示的 Bencode 值（原始字节串以标记对象承载） */
export type JsonishValue =
  | number
  | string
  | JsonishValue[]
  | { [key: string]: JsonishValue }
  | { [BYTES_MARKER]: string };

/** 转换结果 */
export interface ConvertResult {
  /** 成功时的结果（解码为 JSON 值或编码后的字节文本） */
  output: JsonishValue | string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 判断值是否为原始字节串标记对象 */
function isBytesMarker(value: unknown): value is { [BYTES_MARKER]: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    BYTES_MARKER in value &&
    Object.keys(value).length === 1 &&
    typeof (value as Record<string, unknown>)[BYTES_MARKER] === 'string'
  );
}

/** 字节序列转小写十六进制 */
function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 十六进制转字节序列，非法时抛错 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`字节标记值 "${hex}" 不是合法的偶数位十六进制字符串`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 把 Bencode 值转换为 JSON 可表示的值，非 UTF-8 字节串转为标记对象
 *
 * @param value - Bencode 值
 * @returns JSON 可序列化的值
 */
export function bencodeToJsonish(value: BencodeValue): JsonishValue {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return { [BYTES_MARKER]: bytesToHex(value) };
  }
  if (Array.isArray(value)) {
    return value.map(bencodeToJsonish);
  }
  const result: Record<string, JsonishValue> = {};
  for (const [key, item] of Object.entries(value as BencodeDict)) {
    result[key] = bencodeToJsonish(item);
  }
  return result;
}

/**
 * 把 JSON 侧的值还原为 Bencode 值，识别原始字节串标记
 *
 * @param value - JSON 值
 * @returns Bencode 值
 */
export function jsonishToBencode(value: JsonishValue): BencodeValue {
  if (isBytesMarker(value)) {
    return hexToBytes(value[BYTES_MARKER]);
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(jsonishToBencode);
  }
  const dict: BencodeDict = {};
  for (const [key, item] of Object.entries(value)) {
    dict[key] = jsonishToBencode(item as JsonishValue);
  }
  return dict;
}

/**
 * 解析 Bencode 文本并返回 JSON 可表示的结构（输入按 Latin-1 映射为字节）
 *
 * @param input - Bencode 字符串（Latin-1 承载）
 * @returns JSON 值或带位置的错误
 */
export function decodeBencodeToJson(input: string): ConvertResult {
  let bytes: Uint8Array;
  try {
    bytes = latin1ToBytes(input);
  } catch (caught) {
    return { output: null, error: caught instanceof Error ? caught.message : '输入解析失败' };
  }
  const result = decodeBencode(bytes);
  if (result.error !== null || result.value === null) {
    return { output: null, error: result.error };
  }
  return { output: bencodeToJsonish(result.value), error: null };
}

/**
 * 把 JSON 文本编码为 Bencode 字符串（输出按 Latin-1 承载）
 *
 * @param jsonText - JSON 文本
 * @returns Bencode 文本或错误
 */
export function encodeJsonToBencode(jsonText: string): ConvertResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (caught) {
    return {
      output: null,
      error: `JSON 解析失败：${caught instanceof Error ? caught.message : '未知错误'}`,
    };
  }
  try {
    const bytes = encodeBencode(jsonishToBencode(parsed as JsonishValue));
    return { output: bytesToLatin1(bytes), error: null };
  } catch (caught) {
    return { output: null, error: caught instanceof Error ? caught.message : 'Bencode 编码失败' };
  }
}
