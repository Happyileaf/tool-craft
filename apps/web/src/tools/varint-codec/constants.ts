/**
 * VarInt / ZigZag / LEB128 编解码工具内常量
 */

import { VARINT_TYPES, type VarIntType } from './utils/varint';

/** 编解码方向 */
export enum CodecDirectionEnum {
  /** 整数 → 字节序列 */
  ENCODE = 'encode',
  /** 字节序列 → 整数 */
  DECODE = 'decode',
}

/** 编码类型选项数据源 */
export const VARINT_TYPE_OPTIONS: { label: string; value: VarIntType }[] = [
  { label: '无符号 VarInt / ULEB128', value: VARINT_TYPES[0] },
  { label: 'ZigZag sint32（int32）', value: VARINT_TYPES[1] },
  { label: 'ZigZag sint64（int64）', value: VARINT_TYPES[2] },
  { label: '有符号 LEB128（DWARF / WASM）', value: VARINT_TYPES[3] },
];

/** 编码方向默认示例整数 */
export const DEFAULT_INTEGER = '300';

/** 解码方向默认示例十六进制（300 的无符号 VarInt） */
export const DEFAULT_HEX = 'AC 02';
