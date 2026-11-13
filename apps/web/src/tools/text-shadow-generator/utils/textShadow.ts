/**
 * CSS text-shadow 多层文字阴影生成器纯函数模块
 *
 * 负责单层阴影的格式化与多层叠加拼装，不接触 React / DOM，便于 Vitest 单测。
 */

/** 单层文字阴影配置 */
export interface TextShadowLayer {
  /** X 轴偏移（px），正值向右 */
  offsetX: number;
  /** Y 轴偏移（px），正值向下 */
  offsetY: number;
  /** 模糊半径（px），不能为负 */
  blur: number;
  /** 阴影颜色（hex 或任意 CSS 颜色字符串） */
  color: string;
  /** 是否启用该层；禁用层不参与输出 */
  enabled: boolean;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNCTIONAL_COLOR = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i;

/** 颜色校验：接受 hex 与函数式颜色（rgb()/hsl() 等），覆盖取色器与手写值 */
export function isValidShadowColor(color: string): boolean {
  const trimmed = color.trim();
  if (!trimmed) return false;
  return HEX_COLOR.test(trimmed) || FUNCTIONAL_COLOR.test(trimmed);
}

/** 校验单层阴影，返回错误信息；合法返回 null */
export function validateLayer(layer: TextShadowLayer): string | null {
  if (!Number.isFinite(layer.offsetX) || !Number.isFinite(layer.offsetY)) {
    return '偏移量必须为有效数字';
  }
  if (!Number.isFinite(layer.blur) || layer.blur < 0) {
    return '模糊半径必须为不小于 0 的数字';
  }
  if (!isValidShadowColor(layer.color)) {
    return '阴影颜色格式不正确';
  }
  return null;
}

/** 数字格式化为 CSS 像素值（去掉多余小数与负零） */
function px(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

/** 拼装单层 text-shadow 值，例如 `2px 4px 6px rgba(0,0,0,.3)` */
export function formatLayer(layer: TextShadowLayer): string {
  return `${px(layer.offsetX)}px ${px(layer.offsetY)}px ${px(layer.blur)}px ${layer.color.trim()}`;
}

/**
 * 多层叠加：仅输出 enabled 且通过校验的层，层间以逗号分隔。
 * 全部禁用或非法时返回空串。
 */
export function buildTextShadow(layers: TextShadowLayer[]): string {
  return layers
    .filter((layer) => layer.enabled && validateLayer(layer) === null)
    .map(formatLayer)
    .join(', ');
}

/** 完整 CSS 声明（不含选择器），无有效层时返回空串 */
export function buildTextShadowDeclaration(layers: TextShadowLayer[]): string {
  const value = buildTextShadow(layers);
  return value ? `text-shadow: ${value};` : '';
}
