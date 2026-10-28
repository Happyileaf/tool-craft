import type { ExcelDirection } from './utils/excel-column';

export interface DirectionOption {
  value: ExcelDirection;
  label: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'toNumber', label: '列名 → 序号' },
  { value: 'toColumn', label: '序号 → 列名' },
];

export const DEFAULT_INPUT = 'A\nZ\nAA\nAZ\nZZ\nAAA\nXFD';

export const RANGE_HINT = 'Excel 列范围：A–XFD（序号 1–16384），每行一个值';
