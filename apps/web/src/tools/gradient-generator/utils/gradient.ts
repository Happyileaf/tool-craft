/**
 * 渐变类型
 */
export type GradientType = 'linear' | 'radial' | 'conic';

/**
 * 渐变颜色节点
 */
export interface GradientStop {
  /** 节点唯一标识 */
  id: string;
  /** 大写 HEX 颜色值 */
  color: string;
  /** 节点位置，取值 0 至 100 */
  position: number;
}

/**
 * 将全部颜色节点按位置升序排列，并拼装为 CSS 渐变函数中的节点片段
 *
 * @param stops - 颜色节点集合
 * @returns 形如 "#2563EB 0%, #7C3AED 100%" 的片段
 */
export function formatStops(stops: GradientStop[]) {
  return [...stops]
    .sort((first, second) => first.position - second.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');
}

/**
 * 依据渐变类型、角度与颜色节点生成完整的 CSS background 值
 *
 * @param type - 渐变类型
 * @param angle - 线性渐变角度，取值 0 至 360
 * @param stops - 颜色节点集合
 * @returns 可直接用于 background 属性的 CSS 字符串
 */
export function buildGradientCss(
  type: GradientType,
  angle: number,
  stops: GradientStop[],
) {
  const stopText = formatStops(stops);
  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${stopText})`;
  }
  if (type === 'radial') {
    return `radial-gradient(circle at center, ${stopText})`;
  }
  return `conic-gradient(from ${angle}deg at center, ${stopText})`;
}

/**
 * 依据渐变类型、角度与颜色节点生成 Tailwind 任意值类名
 *
 * @param type - 渐变类型
 * @param angle - 线性或锥形渐变角度
 * @param stops - 颜色节点集合
 * @returns 形如 bg-[linear-gradient(135deg,#2563EB_0%,#7C3AED_100%)] 的类名
 */
export function buildTailwindClass(
  type: GradientType,
  angle: number,
  stops: GradientStop[],
) {
  const stopText = [...stops]
    .sort((first, second) => first.position - second.position)
    .map((stop) => `${stop.color}_${stop.position}%`)
    .join(',');
  if (type === 'linear') {
    return `bg-[linear-gradient(${angle}deg,${stopText})]`;
  }
  if (type === 'radial') {
    return `bg-[radial-gradient(circle_at_center,${stopText})]`;
  }
  return `bg-[conic-gradient(from_${angle}deg_at_center,${stopText})]`;
}

/**
 * 常用渐变预设集合
 */
export const GRADIENT_PRESETS: { name: string; stops: Omit<GradientStop, 'id'>[] }[] =
  [
    {
      name: 'Ocean Blue',
      stops: [
        { color: '#2563EB', position: 0 },
        { color: '#06B6D4', position: 100 },
      ],
    },
    {
      name: 'Sunset',
      stops: [
        { color: '#F97316', position: 0 },
        { color: '#EC4899', position: 55 },
        { color: '#8B5CF6', position: 100 },
      ],
    },
    {
      name: 'Emerald',
      stops: [
        { color: '#10B981', position: 0 },
        { color: '#0F766E', position: 100 },
      ],
    },
    {
      name: 'Aurora',
      stops: [
        { color: '#8B5CF6', position: 0 },
        { color: '#EC4899', position: 50 },
        { color: '#F59E0B', position: 100 },
      ],
    },
    {
      name: 'Midnight',
      stops: [
        { color: '#0F172A', position: 0 },
        { color: '#334155', position: 100 },
      ],
    },
  ];
