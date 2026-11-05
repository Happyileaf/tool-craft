import type { LcSolveMode } from './utils/lc';

export interface ModeOption {
  value: LcSolveMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'lc', label: 'L + C → f₀', hint: '已知电感与电容，求谐振频率与谐振点电抗' },
  { value: 'lf', label: 'L + f₀ → C', hint: '已知电感与目标谐振频率，求所需电容' },
  { value: 'cf', label: 'C + f₀ → L', hint: '已知电容与目标谐振频率，求所需电感' },
  { value: 'xl', label: 'L + f → Xl', hint: '已知电感与频率，求感抗 Xl = 2πfL' },
  { value: 'xc', label: 'C + f → Xc', hint: '已知电容与频率，求容抗 Xc = 1/(2πfC)' },
];

export type FieldKey = 'L' | 'C' | 'f';

export interface FieldDef {
  key: FieldKey;
  label: string;
  defaultUnit: string;
  placeholder: string;
}

export const FIELDS: Record<FieldKey, FieldDef> = {
  L: { key: 'L', label: '电感 L', defaultUnit: 'µH', placeholder: '如 100' },
  C: { key: 'C', label: '电容 C', defaultUnit: 'pF', placeholder: '如 100' },
  f: { key: 'f', label: '频率 f / f₀', defaultUnit: 'MHz', placeholder: '如 1.5915' },
};

export interface Preset {
  name: string;
  mode: LcSolveMode;
  inputs: {
    L?: { value: number; unit: string };
    C?: { value: number; unit: string };
    f?: { value: number; unit: string };
  };
}

export const EXAMPLE_PRESETS: Preset[] = [
  {
    name: '100µH × 100pF（f₀≈1.59MHz）',
    mode: 'lc',
    inputs: { L: { value: 100, unit: 'µH' }, C: { value: 100, unit: 'pF' } },
  },
  {
    name: '10µH 反求 1MHz 电容',
    mode: 'lf',
    inputs: { L: { value: 10, unit: 'µH' }, f: { value: 1, unit: 'MHz' } },
  },
  {
    name: '1mH 感抗 @1kHz',
    mode: 'xl',
    inputs: { L: { value: 1, unit: 'mH' }, f: { value: 1, unit: 'kHz' } },
  },
  {
    name: '100nF 容抗 @1kHz',
    mode: 'xc',
    inputs: { C: { value: 100, unit: 'nF' }, f: { value: 1, unit: 'kHz' } },
  },
];
