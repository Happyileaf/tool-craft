/**
 * Base62 编解码工具内常量
 */

import { BASE62_ALPHABETS, type Base62AlphabetKind } from './utils/base62';

/** 工作模式 */
export enum Base62ModeEnum {
  /** 非负整数与 Base62 互转（按 62 进制大整数表示） */
  INTEGER = 'integer',
  /** 文本 / 字节与 Base62 互转（保留前导零字节） */
  BYTES = 'bytes',
}

/** 编解码方向 */
export enum CodecDirectionEnum {
  /** 编码 */
  ENCODE = 'encode',
  /** 解码 */
  DECODE = 'decode',
}

/** 字母表选择项数据源 */
export const ALPHABET_OPTIONS: { label: string; value: Base62AlphabetKind }[] = [
  { label: 'GMP 风格（0-9A-Za-z）', value: BASE62_ALPHABETS[0] },
  { label: '替代风格（0-9a-zA-Z）', value: BASE62_ALPHABETS[1] },
];

/** 整数模式编码方向默认示例（u64 最大值，Base62 为 LygHa16AHYF） */
export const DEFAULT_INTEGER = '18446744073709551615';

/** 整数模式解码方向默认示例 */
export const DEFAULT_BASE62_INTEGER = 'LygHa16AHYF';

/** 字节模式编码方向默认示例文本 */
export const DEFAULT_TEXT = 'Hello World';

/** 字节模式解码方向默认示例 Base62 */
export const DEFAULT_BASE62_TEXT = '73XpUgyMwkGr29M';
