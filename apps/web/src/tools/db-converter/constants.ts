/**
 * 分贝换算器内常量
 */

import { DbModeEnum } from './utils/db';

/** 模式选择项数据源 */
export const MODE_OPTIONS: { label: string; value: DbModeEnum }[] = [
  { label: '功率量（功率 / 能量，×10 公式）', value: DbModeEnum.POWER },
  { label: '场量（电压 / 幅值 / 声压，×20 公式）', value: DbModeEnum.AMPLITUDE },
];

/** 常用 dB 参考值（仅做快捷填入） */
export const DB_PRESETS: number[] = [-20, -10, -6, -3, 0, 3, 6, 10, 20];

/** 默认模式 */
export const DEFAULT_MODE: DbModeEnum = DbModeEnum.POWER;

/** 默认 dB 值 */
export const DEFAULT_DB_TEXT = '3';

/** 默认倍数 */
export const DEFAULT_RATIO_TEXT = '2';

/** 默认级联输入 */
export const DEFAULT_CASCADE_TEXT = '3, 3, -3';
