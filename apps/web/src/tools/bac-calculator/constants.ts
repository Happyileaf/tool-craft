/**
 * BAC 血液酒精浓度估算器的静态配置与预设。
 */
import type { DrinkInput } from './utils/bac';

/** 常见饮品预设（容量 ml / ABV%），点击即可追加一行 */
export const DRINK_PRESETS: { label: string; drink: Omit<DrinkInput, 'quantity'> }[] = [
  { label: '啤酒 330mL（5%）', drink: { name: '啤酒', volumeMl: 330, abvPercent: 5 } },
  { label: '啤酒 500mL（5%）', drink: { name: '啤酒', volumeMl: 500, abvPercent: 5 } },
  { label: '红酒 150mL（12%）', drink: { name: '红酒', volumeMl: 150, abvPercent: 12 } },
  { label: '白酒 50mL（52%）', drink: { name: '白酒', volumeMl: 50, abvPercent: 52 } },
  { label: '威士忌 45mL（40%）', drink: { name: '威士忌', volumeMl: 45, abvPercent: 40 } },
  { label: '清酒 180mL（15%）', drink: { name: '清酒', volumeMl: 180, abvPercent: 15 } },
];

/** 默认饮酒明细 */
export const DEFAULT_DRINKS: DrinkInput[] = [
  { name: '啤酒', volumeMl: 500, abvPercent: 5, quantity: 2 },
  { name: '红酒', volumeMl: 150, abvPercent: 12, quantity: 1 },
];

/** 常见法定/医学 BAC 阈值（g/100mL），用于结果区风险提示 */
export const BAC_THRESHOLDS: { value: number; label: string; color: string }[] = [
  { value: 0.02, label: '0.02% 轻微放松，判断力开始下降', color: 'blue' },
  { value: 0.05, label: '0.05% 协调能力下降，多数地区酒驾标准附近', color: 'gold' },
  { value: 0.08, label: '0.08% 中国醉驾参考线 / 美国酒驾标准', color: 'orange' },
  { value: 0.2, label: '0.20% 意识模糊、呕吐风险显著', color: 'red' },
  { value: 0.4, label: '0.40% 可能危及生命', color: 'red' },
];
