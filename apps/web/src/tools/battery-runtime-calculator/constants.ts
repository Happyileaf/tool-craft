export const CAPACITY_UNITS = [
  { value: 'mAh', label: 'mAh' },
  { value: 'Ah', label: 'Ah' },
  { value: 'Wh', label: 'Wh' },
] as const;

export const LOAD_TYPES = [
  { value: 'current', label: '负载电流（A）' },
  { value: 'power', label: '负载功率（W）' },
] as const;

export const DEFAULT_CAPACITY = 10;
export const DEFAULT_VOLTAGE = 12;
export const DEFAULT_LOAD_VALUE = 2;
export const DEFAULT_EFFICIENCY = 90;
export const DEFAULT_DOD = 80;

export const DEFAULT_CELL_CAPACITY = 2500;
export const DEFAULT_CELL_VOLTAGE = 3.7;
export const DEFAULT_SERIES = 3;
export const DEFAULT_PARALLEL = 2;

export const EFFICIENCY_PRESETS = [100, 90, 85, 80];
