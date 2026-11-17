/**
 * 梁弯曲计算器常量：材料弹性模量预设与选项标签
 */
import type { BeamType, LoadType, SectionType } from './utils/beam';

/** 材料弹性模量预设（Pa） */
export interface MaterialPreset {
  /** 材料名称 */
  name: string;
  /** 弹性模量 E，Pa */
  modulus: number;
  /** 常见许用弯曲应力参考，Pa（仅作填入建议） */
  allowableStress?: number;
}

/** 材料下拉预设 */
export const MATERIAL_PRESETS: MaterialPreset[] = [
  { name: '结构钢 Q235（E≈206 GPa）', modulus: 206e9, allowableStress: 160e6 },
  { name: '结构钢 Q355（E≈206 GPa）', modulus: 206e9, allowableStress: 250e6 },
  { name: '铝合金 6061-T6（E≈70 GPa）', modulus: 70e9, allowableStress: 150e6 },
  { name: '混凝土（E≈30 GPa，仅弹性估算）', modulus: 30e9 },
  { name: '松木顺纹（E≈10 GPa，仅弹性估算）', modulus: 10e9, allowableStress: 10e6 },
  { name: '自定义', modulus: 206e9 },
];

/** 梁形式选项 */
export const BEAM_TYPE_OPTIONS: Array<{ value: BeamType; label: string; hint: string }> = [
  {
    value: 'simply-supported',
    label: '简支梁',
    hint: '两端铰支，x=0 与 x=L 处挠度为 0',
  },
  {
    value: 'cantilever',
    label: '悬臂梁',
    hint: '固定端在 x=0，自由端在 x=L',
  },
];

/** 按梁形式返回可选荷载类型 */
export function loadTypeOptions(beamType: BeamType): Array<{ value: LoadType; label: string }> {
  if (beamType === 'simply-supported') {
    return [
      { value: 'central-point', label: '跨中集中力 P' },
      { value: 'arbitrary-point', label: '任意位置集中力（距左端 a）' },
      { value: 'uniform', label: '满跨均布荷载 q' },
    ];
  }
  return [
    { value: 'central-point', label: '自由端集中力 P' },
    { value: 'arbitrary-point', label: '任意位置集中力（距固定端 a）' },
    { value: 'uniform', label: '满跨均布荷载 q' },
  ];
}

/** 截面类型选项 */
export const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string }> = [
  { value: 'rectangle', label: '矩形截面 b×h' },
  { value: 'circle', label: '实心圆截面 d' },
  { value: 'custom', label: '自定义 I / W 直输' },
];

/** 矩形截面高宽比提示阈值 */
export const SLENDER_RATIO_WARN = 50;
