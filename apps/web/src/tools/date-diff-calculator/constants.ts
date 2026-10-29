import type { OffsetUnit } from './utils/dateMath';

/** 日期差默认起始日 */
export const DEFAULT_START = '2024-01-01';
/** 日期差默认结束日（与起始日相差 60 天，含闰年 2 月） */
export const DEFAULT_END = '2024-03-01';
/** 日期加减默认基准日（月末，便于展示月偏移钳制） */
export const DEFAULT_BASE_DATE = '2024-01-31';
/** 默认偏移量 */
export const DEFAULT_OFFSET_AMOUNT = '1';
/** 默认偏移单位 */
export const DEFAULT_OFFSET_UNIT: OffsetUnit = 'months';

/** 偏移单位选项（值与展示标签） */
export const OFFSET_UNIT_OPTIONS: { value: OffsetUnit; label: string }[] = [
  { value: 'years', label: '年' },
  { value: 'months', label: '月' },
  { value: 'weeks', label: '周' },
  { value: 'days', label: '日' },
  { value: 'hours', label: '小时' },
  { value: 'minutes', label: '分钟' },
];

/** ISO 星期序号（1=周一 … 7=周日）对应的中文短名 */
export const WEEKDAY_NAMES: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};
