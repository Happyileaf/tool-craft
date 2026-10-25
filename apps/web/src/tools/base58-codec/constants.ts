/**
 * Base58 / Base58Check 编解码工具内常量
 */

import { BASE58_ALPHABETS, type Base58AlphabetKind } from './utils/base58';

/** 工作模式 */
export enum Base58ModeEnum {
  /** 文本 / 字节与 Base58 互转 */
  CODEC = 'codec',
  /** Base58Check（版本字节 + 校验和）编码 */
  CHECK_ENCODE = 'check-encode',
  /** Base58Check 解码与校验 */
  CHECK_DECODE = 'check-decode',
}

/** 编解码方向（CODEC 模式） */
export enum CodecDirectionEnum {
  /** 文本编码为 Base58 */
  ENCODE = 'encode',
  /** Base58 解码为文本 */
  DECODE = 'decode',
}

/** 模式选择项数据源 */
export const MODE_OPTIONS: { label: string; value: Base58ModeEnum }[] = [
  { label: 'Base58 文本编码', value: Base58ModeEnum.CODEC },
  { label: 'Base58Check 编码', value: Base58ModeEnum.CHECK_ENCODE },
  { label: 'Base58Check 解码', value: Base58ModeEnum.CHECK_DECODE },
];

/** 字母表选择项数据源 */
export const ALPHABET_OPTIONS: { label: string; value: Base58AlphabetKind }[] = [
  { label: 'Bitcoin / IPFS（标准）', value: BASE58_ALPHABETS[0] },
  { label: 'Flickr', value: BASE58_ALPHABETS[1] },
  { label: 'Ripple / XRP Ledger', value: BASE58_ALPHABETS[2] },
];

/** CODEC 模式编码方向的默认示例文本（经典比特币 Wiki 向量，Base58 为 JxF12TrwUP45BMd） */
export const DEFAULT_TEXT = 'Hello World';

/** CODEC 模式解码方向的默认示例 Base58 */
export const DEFAULT_BASE58 = 'JxF12TrwUP45BMd';

/** Base58Check 编码方向的默认载荷（20 字节十六进制，比特币创世地址的公钥哈希） */
export const DEFAULT_PAYLOAD_HEX =
  '62e907b15cbf27d5425399ebf6f0fb50ebb88f18';

/** Base58Check 默认版本字节（0x00 = 比特币主网 P2PKH） */
export const DEFAULT_VERSION = 0;

/** Base58Check 解码方向的默认示例地址 */
export const DEFAULT_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
