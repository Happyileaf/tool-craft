/** 编解码方向 */
export enum Bech32DirectionEnum {
  ENCODE = 'encode',
  DECODE = 'decode',
}

/** 编码类型选项值 */
export type Bech32KindValue = 'auto' | 'bech32' | 'bech32m';

/** 编码类型标签 */
export const ENCODE_KIND_OPTIONS: Array<{ label: string; value: Bech32KindValue }> = [
  { label: '自动（按 witness 版本：v0→Bech32，v1+→Bech32m）', value: 'auto' },
  { label: 'Bech32（常量 1，BIP-173，witness v0）', value: 'bech32' },
  { label: 'Bech32m（常量 0x2bc830a3，BIP-350，witness v1+）', value: 'bech32m' },
];

/** 编码区默认 HRP */
export const DEFAULT_HRP = 'bc';

/** 编码区默认数据（P2WPKH witness program，20 字节） */
export const DEFAULT_PROGRAM_HEX = '751e76e8199196d454941c45d1b3a323f1433bd6';

/** 编码区默认 witness 版本（-1 表示数据直接作为 5-bit 源的字节，不带版本前缀的通用模式仍按字节转 5bit） */
export const DEFAULT_WITNESS_VERSION = 0;

/** 解码区默认地址（主网 P2WPKH） */
export const DEFAULT_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

/** witness 版本选项：0..16 + 「无（通用字节数据）」 */
export const WITNESS_VERSION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '不带 witness 版本（通用 8→5bit 数据）', value: -1 },
  ...Array.from({ length: 17 }, (_, version) => ({
    label: `witness v${version}${version === 0 ? '（Bech32）' : version === 1 ? '（Bech32m / Taproot）' : '（Bech32m）'}`,
    value: version,
  })),
];
