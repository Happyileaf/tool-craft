/**
 * 单层阴影参数
 */
export interface ShadowLayer {
  /** 水平偏移，单位像素 */
  offsetX: number;
  /** 垂直偏移，单位像素 */
  offsetY: number;
  /** 模糊半径，单位像素 */
  blur: number;
  /** 扩散半径，单位像素 */
  spread: number;
  /** 阴影颜色 HEX */
  color: string;
  /** 阴影透明度，取值 0 至 100 */
  opacity: number;
  /** 是否为内阴影 */
  inset: boolean;
}

/**
 * 将 HEX 颜色与透明度转换为 rgba() 文本
 *
 * @param hex - HEX 颜色
 * @param opacityPercent - 透明度百分比，取值 0 至 100
 * @returns rgba() 文本；HEX 非法时回退为黑色
 */
export function formatShadowColor(hex: string, opacityPercent: number): string {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return `rgba(0, 0, 0, ${opacityPercent / 100})`;
  }
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${(opacityPercent / 100).toFixed(2)})`;
}

/**
 * 拼装单层 box-shadow 文本
 *
 * @param layer - 阴影参数
 * @returns 单层 box-shadow 片段
 */
export function formatSingleShadow(layer: ShadowLayer): string {
  const insetPrefix = layer.inset ? 'inset ' : '';
  return `${insetPrefix}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${formatShadowColor(layer.color, layer.opacity)}`;
}

/**
 * 拼装多层 box-shadow 完整 CSS 值
 *
 * @param layers - 阴影层集合
 * @returns box-shadow CSS 值
 */
export function buildShadowCss(layers: ShadowLayer[]): string {
  return layers.map(formatSingleShadow).join(', ');
}

/**
 * 创建一个带默认值的阴影层
 *
 * @param overrides - 需要覆盖的默认字段
 * @returns 完整阴影层参数
 */
export function createLayer(overrides: Partial<ShadowLayer> = {}): ShadowLayer {
  return {
    offsetX: 0,
    offsetY: 8,
    blur: 24,
    spread: -6,
    color: '#0F172A',
    opacity: 15,
    inset: false,
    ...overrides,
  };
}

/** 常用阴影预设 */
export const SHADOW_PRESETS: { name: string; layers: ShadowLayer[] }[] = [
  {
    name: 'Soft',
    layers: [createLayer({ offsetY: 10, blur: 30, spread: -8, opacity: 12 })],
  },
  {
    name: 'Lifted',
    layers: [
      createLayer({ offsetY: 2, blur: 6, spread: -2, opacity: 10 }),
      createLayer({ offsetY: 12, blur: 24, spread: -6, opacity: 12 }),
    ],
  },
  {
    name: 'Neumorphism',
    layers: [
      createLayer({ offsetX: -8, offsetY: -8, blur: 16, spread: 0, color: '#FFFFFF', opacity: 80 }),
      createLayer({ offsetX: 8, offsetY: 8, blur: 16, spread: 0, color: '#94A3B8', opacity: 30 }),
    ],
  },
  {
    name: 'Inset Glow',
    layers: [createLayer({ offsetY: 0, blur: 20, spread: 0, color: '#2563EB', opacity: 45, inset: true })],
  },
];
