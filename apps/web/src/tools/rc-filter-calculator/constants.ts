import type { RcSolveMode } from './utils/rc';

export interface ModeOption {
  value: RcSolveMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'rc', label: 'R + C → fc', hint: '已知电阻与电容，求截止频率与时间常数' },
  { value: 'rf', label: 'R + fc → C', hint: '已知电阻与目标截止频率，求所需电容' },
  { value: 'cf', label: 'C + fc → R', hint: '已知电容与目标截止频率，求所需电阻' },
];

export interface FieldDef {
  key: 'R' | 'C' | 'fc';
  label: string;
  defaultUnit: string;
  placeholder: string;
}

export const FIELDS: Record<'R' | 'C' | 'fc', FieldDef> = {
  R: { key: 'R', label: '电阻 R', defaultUnit: 'kΩ', placeholder: '如 1' },
  C: { key: 'C', label: '电容 C', defaultUnit: 'µF', placeholder: '如 1' },
  fc: { key: 'fc', label: '截止频率 fc', defaultUnit: 'Hz', placeholder: '如 159.15' },
};

export interface Preset {
  name: string;
  mode: RcSolveMode;
  inputs: {
    R?: { value: number; unit: string };
    C?: { value: number; unit: string };
    fc?: { value: number; unit: string };
  };
}

export const EXAMPLE_PRESETS: Preset[] = [
  {
    name: '经典 1kΩ × 1µF',
    mode: 'rc',
    inputs: { R: { value: 1, unit: 'kΩ' }, C: { value: 1, unit: 'µF' } },
  },
  {
    name: '音频 10nF → 1kHz',
    mode: 'cf',
    inputs: { C: { value: 10, unit: 'nF' }, fc: { value: 1, unit: 'kHz' } },
  },
  {
    name: '去抖 10kΩ → 16Hz',
    mode: 'rf',
    inputs: { R: { value: 10, unit: 'kΩ' }, fc: { value: 16, unit: 'Hz' } },
  },
];
