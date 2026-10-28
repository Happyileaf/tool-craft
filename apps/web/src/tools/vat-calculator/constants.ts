/**
 * 增值税计算器内常量
 */

import { VatDirectionEnum } from './utils/vat';

/** 计算方向选择项数据源 */
export const DIRECTION_OPTIONS: { label: string; value: VatDirectionEnum }[] = [
  { label: '不含税金额 → 税额 / 含税金额', value: VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE },
  { label: '含税金额 → 不含税金额 / 税额', value: VatDirectionEnum.INCLUSIVE_TO_EXCLUSIVE },
];

/** 中国增值税常用税率档位（百分比数值） */
export const PRESET_RATES: number[] = [13, 9, 6, 3, 1];

/** 默认金额（元） */
export const DEFAULT_AMOUNT = '1000';

/** 默认税率（百分比数值） */
export const DEFAULT_RATE = 13;
