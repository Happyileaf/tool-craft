/**
 * 雷诺数与管内流态计算器常量：介质预设、管材粗糙度参考与字段配置
 */

/** 常用流体介质预设（SI 物性，20 °C 常压附近） */
export interface FluidPreset {
  /** 预设名称 */
  name: string;
  /** 运动黏度 ν，m²/s */
  kinematicViscosity: number;
  /** 密度 ρ，kg/m³ */
  density: number;
}

/** 介质下拉预设集合 */
export const FLUID_PRESETS: FluidPreset[] = [
  { name: '20 °C 清水', kinematicViscosity: 1.004e-6, density: 998.2 },
  { name: '60 °C 热水', kinematicViscosity: 0.475e-6, density: 983.2 },
  { name: '20 °C 空气', kinematicViscosity: 1.51e-5, density: 1.204 },
  { name: '40 °C 机油（ISO VG46 参考）', kinematicViscosity: 46e-6, density: 872 },
  { name: '自定义', kinematicViscosity: 1.004e-6, density: 998.2 },
];

/** 常用管材绝对粗糙度参考（仅提示，不强制绑定），单位 mm */
export const PIPE_ROUGHNESS_HINTS: Array<{ material: string; rangeMm: string }> = [
  { material: '拉拔管 / PVC / PE / 铜管', rangeMm: '0.0015 – 0.01' },
  { material: '商用钢管 / 焊接钢管（新）', rangeMm: '0.045 – 0.09' },
  { material: '铸铁管（新）', rangeMm: '0.25 – 0.5' },
  { material: '混凝土管', rangeMm: '0.3 – 3.0' },
];

/** 输入模式 */
export type InputMode = 'velocity' | 'flowRate';

/** 流态徽标配色与中文名 */
export const REGIME_META: Record<
  'laminar' | 'critical' | 'turbulent',
  { label: string; color: string; description: string }
> = {
  laminar: {
    label: '层流',
    color: 'blue',
    description: 'Re < 2300，流体质点沿平行轴线分层流动，摩擦系数 f = 64/Re。',
  },
  critical: {
    label: '临界过渡区',
    color: 'orange',
    description: '2300 ≤ Re ≤ 4000，层流向湍流过渡，摩擦系数公式不确定，不强行给值。',
  },
  turbulent: {
    label: '湍流',
    color: 'red',
    description: 'Re > 4000，质点强烈混掺，采用 Swamee–Jain 显式式求 Darcy 摩擦系数。',
  },
};
