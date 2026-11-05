import type { SexagenaryDirection } from './utils/sexagenary';

export interface DirectionOption {
  value: SexagenaryDirection;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    value: 'year-to-ganzhi',
    label: '公历年 → 干支',
    hint: '输入公历年，输出天干地支、六十甲子序号、生肖与五行',
  },
  {
    value: 'ganzhi-to-year',
    label: '干支 → 公历年',
    hint: '输入甲子序号（1–60）或干支组合，反推指定区间内的公历年份',
  },
];

export const DEFAULT_FORWARD_INPUT = '1984\n2024\n1985\n2023';

export const DEFAULT_REVERSE_INPUT = '甲子\n41\n癸卯';

export const DEFAULT_RANGE_FROM = 1900;

export const DEFAULT_RANGE_TO = 2100;
