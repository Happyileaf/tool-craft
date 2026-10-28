export const DEFAULT_INPUT = '1-5, 10, 12-14\n0-10:2\n-5--1';

export type RangeDirection = 'expand' | 'collapse';

export interface SeparatorOption {
  label: string;
  value: string;
}

export const SEPARATOR_OPTIONS: SeparatorOption[] = [
  { label: '逗号 1,2,3', value: ',' },
  { label: '逗号+空格 1, 2, 3', value: ', ' },
  { label: '换行', value: '\n' },
  { label: '空格 1 2 3', value: ' ' },
];
