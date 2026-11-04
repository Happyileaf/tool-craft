import type { Timer555Mode } from './utils/timer555';

export interface ModeOption {
  value: Timer555Mode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'classic',
    label: '经典非稳态',
    hint: '充电经 R1+R2、放电经 R2，占空比恒大于 50%',
  },
  {
    value: 'diode',
    label: '二极管改进型',
    hint: '充电经 R1+二极管、放电经 R2，占空比可接近 50%（忽略二极管压降）',
  },
];

export interface Preset {
  name: string;
  mode: Timer555Mode;
  R1: { value: number; unit: string };
  R2: { value: number; unit: string };
  C: { value: number; unit: string };
}

export const EXAMPLE_PRESETS: Preset[] = [
  {
    name: '经典 1kΩ / 1kΩ / 1µF（≈481 Hz）',
    mode: 'classic',
    R1: { value: 1, unit: 'kΩ' },
    R2: { value: 1, unit: 'kΩ' },
    C: { value: 1, unit: 'µF' },
  },
  {
    name: '秒脉冲 6.8kΩ / 47kΩ / 10µF（≈1 Hz）',
    mode: 'classic',
    R1: { value: 6.8, unit: 'kΩ' },
    R2: { value: 47, unit: 'kΩ' },
    C: { value: 10, unit: 'µF' },
  },
  {
    name: '二极管 50% 10kΩ / 10kΩ / 100nF',
    mode: 'diode',
    R1: { value: 10, unit: 'kΩ' },
    R2: { value: 10, unit: 'kΩ' },
    C: { value: 100, unit: 'nF' },
  },
];
