/**
 * 平均照度计算器常量：维护系数参考、默认 CU 对照表与计算模式
 */
import type { CuTablePoint } from './utils/lumen-method';

/** 计算模式 */
export type CalcMode = 'forward' | 'reverse-count' | 'reverse-lumen';

/** 模式选项 */
export const CALC_MODE_OPTIONS: Array<{ value: CalcMode; label: string; hint: string }> = [
  {
    value: 'forward',
    label: '正算平均照度 Eavg',
    hint: '已知灯具数 N 与单灯光通量 Φ，求工作面平均维持照度',
  },
  {
    value: 'reverse-count',
    label: '反算所需灯具数 N',
    hint: '给定目标照度与 Φ，向上取整求 N 并复核实际照度',
  },
  {
    value: 'reverse-lumen',
    label: '反算所需单灯光通量 Φ',
    hint: '给定目标照度与固定灯具数 N，求每盏灯所需光通量',
  },
];

/** CU 输入方式 */
export type CuInputMode = 'direct' | 'table';

/** 维护系数 MF 环境参考 */
export const MAINTENANCE_HINTS: Array<{ scene: string; range: string; typical: number }> = [
  { scene: '洁净环境（洁净室、空调办公室、低粉尘）', range: '0.75 – 0.80', typical: 0.8 },
  { scene: '一般环境（普通办公室、教室、商店）', range: '0.65 – 0.75', typical: 0.7 },
  { scene: '污染环境（工厂、仓库、多尘场所）', range: '0.55 – 0.65', typical: 0.6 },
];

/**
 * 默认 RCR→CU 对照示例表（通用下照灯具的示意数据）
 *
 * 注意：实际工程必须替换为所选灯具厂商光度数据表中的利用系数。
 */
export const DEFAULT_CU_TABLE: CuTablePoint[] = [
  { rcr: 0, cu: 0.78 },
  { rcr: 1, cu: 0.72 },
  { rcr: 2, cu: 0.64 },
  { rcr: 3, cu: 0.56 },
  { rcr: 4, cu: 0.49 },
  { rcr: 5, cu: 0.43 },
  { rcr: 6, cu: 0.38 },
  { rcr: 8, cu: 0.3 },
  { rcr: 10, cu: 0.24 },
];

/** RCR 偏大诊断阈值（超过则提示利用系数通常偏低） */
export const HIGH_RCR_WARN = 6;

/** 常见场所照度标准参考（lux，仅入门提示） */
export const ILLUMINANCE_REFERENCE: Array<{ scene: string; lux: string }> = [
  { scene: '一般走道、储藏室', lux: '100 – 150' },
  { scene: '普通办公室、教室', lux: '300 – 500' },
  { scene: '精细办公、设计绘图', lux: '500 – 750' },
  { scene: '精密装配、检验', lux: '750 – 1500' },
];
