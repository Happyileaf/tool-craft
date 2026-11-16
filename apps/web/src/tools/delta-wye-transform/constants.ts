import type { TransformDirection, DeltaResistors, WyeResistors } from './utils/deltaWye';

export interface DirectionOption {
  value: TransformDirection;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    value: 'delta-to-wye',
    label: 'Δ → Y（三角形 → 星形）',
    hint: '已知三边电阻 R_AB / R_BC / R_CA，求三臂电阻 R_A / R_B / R_C',
  },
  {
    value: 'wye-to-delta',
    label: 'Y → Δ（星形 → 三角形）',
    hint: '已知三臂电阻 R_A / R_B / R_C，求三边电阻 R_AB / R_BC / R_CA',
  },
];

export interface DeltaWyePreset {
  name: string;
  direction: TransformDirection;
  delta: DeltaResistors;
  wye: WyeResistors;
}

export const EXAMPLE_PRESETS: DeltaWyePreset[] = [
  {
    name: '平衡网络 Δ 30Ω → Y 10Ω',
    direction: 'delta-to-wye',
    delta: { rab: 30, rbc: 30, rca: 30 },
    wye: { ra: 10, rb: 10, rc: 10 },
  },
  {
    name: '教材向量 Δ(150/50/100Ω) → Y(50/25/16.67Ω)',
    direction: 'delta-to-wye',
    delta: { rab: 150, rbc: 50, rca: 100 },
    wye: { ra: 50, rb: 25, rc: 50 / 3 },
  },
  {
    name: '反向 Y(50/25/16.67Ω) → Δ(150/50/100Ω)',
    direction: 'wye-to-delta',
    delta: { rab: 150, rbc: 50, rca: 100 },
    wye: { ra: 50, rb: 25, rc: 50 / 3 },
  },
];
