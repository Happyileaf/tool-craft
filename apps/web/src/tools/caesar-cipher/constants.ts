/**
 * 凯撒密码工具内常量
 */
import { MAX_SHIFT, MIN_SHIFT, ROT13_SHIFT } from './utils/caesar';

/** 转换方向 */
export enum CaesarModeEnum {
  /** 明文正向位移为密文 */
  ENCRYPT = 'encrypt',
  /** 密文反向位移还原明文 */
  DECRYPT = 'decrypt',
}

/** 转换方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CaesarModeEnum }[] = [
  { label: '加密（明文 → 密文）', value: CaesarModeEnum.ENCRYPT },
  { label: '解密（密文 → 明文）', value: CaesarModeEnum.DECRYPT },
];

/** 默认示例文本 */
export const DEFAULT_TEXT = 'Hello, World!';

/** 默认位移量 */
export const DEFAULT_SHIFT = 3;

export { MAX_SHIFT, MIN_SHIFT, ROT13_SHIFT };
