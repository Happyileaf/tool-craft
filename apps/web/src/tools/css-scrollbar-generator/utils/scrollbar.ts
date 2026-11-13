/**
 * CSS 滚动条样式生成器纯函数模块
 *
 * 负责把滚动条配置拼装为两套 CSS：WebKit 私有伪元素组与标准 scrollbar-width/color 组。
 * 不接触 React / DOM，便于在 Vitest（node 环境）下单测。
 */

/** 标准属性 scrollbar-width 的取值 */
export type ScrollbarWidthKeyword = 'auto' | 'thin' | 'none';

/** 滚动条样式配置 */
export interface ScrollbarConfig {
  /** WebKit 滚动条宽度（px），同时映射到标准属性的关键字判断 */
  width: number;
  /** 轨道（track）颜色，CSS 颜色值 */
  trackColor: string;
  /** 滑块（thumb）颜色，CSS 颜色值 */
  thumbColor: string;
  /** 滑块 hover 颜色 */
  thumbHoverColor: string;
  /** 滑块圆角（px） */
  thumbRadius: number;
  /** 轨道圆角（px） */
  trackRadius: number;
  /** 是否显示两端按钮（WebKit ::-webkit-scrollbar-button） */
  showButtons: boolean;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** 校验颜色是否为十六进制写法（本工具颜色选择器统一输出 hex） */
export function isValidHexColor(color: string): boolean {
  return HEX_COLOR.test(color.trim());
}

/** 校验完整配置，返回错误信息；合法返回 null */
export function validateScrollbar(config: ScrollbarConfig): string | null {
  if (!Number.isFinite(config.width) || config.width <= 0) {
    return '滚动条宽度必须为正数';
  }
  if (!isValidHexColor(config.trackColor)) {
    return '轨道颜色格式不正确';
  }
  if (!isValidHexColor(config.thumbColor)) {
    return '滑块颜色格式不正确';
  }
  if (!isValidHexColor(config.thumbHoverColor)) {
    return '滑块 hover 颜色格式不正确';
  }
  if (config.thumbRadius < 0 || config.trackRadius < 0) {
    return '圆角不能为负数';
  }
  return null;
}

/**
 * 根据 WebKit 像素宽度推断标准 scrollbar-width 关键字。
 * 约定：<=8px 视为 thin，隐藏（width<=0，理论上被校验拦截）视为 none，其余 auto。
 */
export function toStandardWidthKeyword(width: number): ScrollbarWidthKeyword {
  if (width <= 0) return 'none';
  if (width <= 8) return 'thin';
  return 'auto';
}

/** 生成 Firefox / 标准属性组 */
export function buildStandardCss(config: ScrollbarConfig): string {
  const lines = [
    '/* Firefox 与支持标准属性的浏览器 */',
    `.example-scrollbar {`,
    `  scrollbar-width: ${toStandardWidthKeyword(config.width)};`,
    `  scrollbar-color: ${config.thumbColor} ${config.trackColor};`,
    `}`,
  ];
  return lines.join('\n');
}

/** 生成 WebKit 私有伪元素属性组 */
export function buildWebkitCss(config: ScrollbarConfig): string {
  const lines: string[] = ['/* Chrome / Edge / Safari（WebKit 私有属性） */'];
  lines.push('.example-scrollbar::-webkit-scrollbar {')
  lines.push(`  width: ${config.width}px;`);
  lines.push(`  height: ${config.width}px;`);
  lines.push('}');
  lines.push('');
  lines.push('.example-scrollbar::-webkit-scrollbar-track {');
  lines.push(`  background: ${config.trackColor};`);
  lines.push(`  border-radius: ${config.trackRadius}px;`);
  lines.push('}');
  lines.push('');
  lines.push('.example-scrollbar::-webkit-scrollbar-thumb {');
  lines.push(`  background: ${config.thumbColor};`);
  lines.push(`  border-radius: ${config.thumbRadius}px;`);
  lines.push('}');
  lines.push('');
  lines.push('.example-scrollbar::-webkit-scrollbar-thumb:hover {');
  lines.push(`  background: ${config.thumbHoverColor};`);
  lines.push('}');
  if (config.showButtons) {
    lines.push('');
    lines.push('.example-scrollbar::-webkit-scrollbar-button {');
    lines.push(`  background: ${config.trackColor};`);
    lines.push('}');
  }
  return lines.join('\n');
}

/** 完整双输出：标准组与 WebKit 组以空行分隔 */
export function buildScrollbarCss(config: ScrollbarConfig): string {
  return `${buildStandardCss(config)}\n\n${buildWebkitCss(config)}`;
}
