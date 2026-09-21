/**
 * 单档色阶定义
 */
export interface ShadeStop {
  /** Tailwind 风格的色阶档位名称 */
  level: string;
  /** 相对基准色的明暗系数，小于 1 提亮，大于 1 压暗 */
  factor: number;
}

/**
 * 从基准色衍生的十级色阶参数，档位顺序与 Tailwind 调色板一致
 */
export const SHADE_STOPS: ShadeStop[] = [
  { level: '50', factor: 0.1 },
  { level: '100', factor: 0.2 },
  { level: '200', factor: 0.35 },
  { level: '300', factor: 0.5 },
  { level: '400', factor: 0.7 },
  { level: '500', factor: 0.85 },
  { level: '600', factor: 1.0 },
  { level: '700', factor: 1.15 },
  { level: '800', factor: 1.3 },
  { level: '900', factor: 1.45 },
];

/**
 * 工具首次载入时使用的基准主色
 */
export const DEFAULT_HEX = '#2563EB';

/**
 * 拾色器预设主色集合
 */
export const PRESET_COLORS = [
  '#2563EB',
  '#059669',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#0F172A',
];

/**
 * WCAG 常规正文达到 AA 级所需对比度
 */
export const WCAG_AA_NORMAL = 4.5;

/**
 * WCAG 大字号文本达到 AA 级所需对比度
 */
export const WCAG_AA_LARGE = 3;
