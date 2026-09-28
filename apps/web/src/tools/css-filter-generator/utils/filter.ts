/**
 * 滤镜参数集合
 */
export interface FilterSettings {
  /** 模糊，单位像素 */
  blur: number;
  /** 亮度，百分比 */
  brightness: number;
  /** 对比度，百分比 */
  contrast: number;
  /** 饱和度，百分比 */
  saturate: number;
  /** 灰度，百分比 */
  grayscale: number;
  /** 褐调，百分比 */
  sepia: number;
  /** 反相，百分比 */
  invert: number;
  /** 色相旋转，单位度 */
  hueRotate: number;
}

/**
 * 毛玻璃卡片参数
 */
export interface GlassSettings {
  /** 背景透明度，取值 0 至 100 */
  opacity: number;
  /** 模糊半径，单位像素 */
  blur: number;
  /** 饱和度，百分比 */
  saturate: number;
  /** 圆角，单位像素 */
  radius: number;
  /** 边框宽度，单位像素 */
  borderWidth: number;
  /** 边框颜色 HEX */
  borderColor: string;
  /** 边框透明度，取值 0 至 100 */
  borderOpacity: number;
}

/**
 * 创建默认滤镜参数
 *
 * @returns 默认滤镜参数
 */
export function createDefaultFilter(): FilterSettings {
  return {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hueRotate: 0,
  };
}

/**
 * 拼装 filter CSS 值，跳过处于默认值的函数以保持输出简洁
 *
 * @param settings - 滤镜参数
 * @returns filter CSS 值
 */
export function buildFilterCss(settings: FilterSettings): string {
  const parts: string[] = [];
  if (settings.blur > 0) {
    parts.push(`blur(${settings.blur}px)`);
  }
  if (settings.brightness !== 100) {
    parts.push(`brightness(${settings.brightness}%)`);
  }
  if (settings.contrast !== 100) {
    parts.push(`contrast(${settings.contrast}%)`);
  }
  if (settings.saturate !== 100) {
    parts.push(`saturate(${settings.saturate}%)`);
  }
  if (settings.grayscale > 0) {
    parts.push(`grayscale(${settings.grayscale}%)`);
  }
  if (settings.sepia > 0) {
    parts.push(`sepia(${settings.sepia}%)`);
  }
  if (settings.invert > 0) {
    parts.push(`invert(${settings.invert}%)`);
  }
  if (settings.hueRotate !== 0) {
    parts.push(`hue-rotate(${settings.hueRotate}deg)`);
  }
  return parts.join(' ');
}

/**
 * 将 HEX 与透明度转换为 rgba() 文本
 *
 * @param hex - HEX 颜色
 * @param opacityPercent - 透明度百分比
 * @returns rgba() 文本
 */
export function formatRgba(hex: string, opacityPercent: number): string {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return `rgba(255, 255, 255, ${opacityPercent / 100})`;
  }
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${(opacityPercent / 100).toFixed(2)})`;
}

/**
 * 生成毛玻璃卡片的完整 backdrop-filter 与背景样式文本
 *
 * @param glass - 毛玻璃参数
 * @returns 多行 CSS 声明
 */
export function buildGlassCss(glass: GlassSettings): string {
  const backdrop = `backdrop-filter: blur(${glass.blur}px) saturate(${glass.saturate}%);`;
  const background = `background-color: ${formatRgba('#FFFFFF', glass.opacity)};`;
  const border = `border: ${glass.borderWidth}px solid ${formatRgba(glass.borderColor, glass.borderOpacity)};`;
  const radius = `border-radius: ${glass.radius}px;`;
  return [background, backdrop, border, radius].join('\n');
}

/** 滤镜风格预设 */
export const FILTER_PRESETS: { name: string; settings: Partial<FilterSettings> }[] = [
  { name: 'B&W', settings: { grayscale: 100 } },
  { name: 'Sepia', settings: { sepia: 70 } },
  { name: 'Cool', settings: { hueRotate: 180, saturate: 130 } },
  { name: 'Dream', settings: { blur: 2, brightness: 115, contrast: 90 } },
  { name: 'Vivid', settings: { saturate: 180, contrast: 120 } },
];
