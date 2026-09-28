/**
 * RGB 三通道颜色
 */
export interface RgbColor {
  /** 红色通道，取值 0 至 255 */
  r: number;
  /** 绿色通道，取值 0 至 255 */
  g: number;
  /** 蓝色通道，取值 0 至 255 */
  b: number;
}

/**
 * 命名颜色令牌
 */
export interface ColorToken {
  /** 语义名称 */
  name: string;
  /** HEX 颜色 */
  value: string;
}

/**
 * 解析六位 HEX 颜色
 *
 * @param hex - HEX 颜色
 * @returns RGB 或 null
 */
export function parseHexToRgb(hex: string): RgbColor | null {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return null;
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * 将名称转换为 kebab-case，用于 CSS 变量命名
 *
 * @param name - 原始名称
 * @returns kebab-case 名称
 */
export function toKebabCase(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

/**
 * 将名称转换为 camelCase，用于 JS 常量命名
 *
 * @param name - 原始名称
 * @returns camelCase 名称
 */
export function toCamelCase(name: string): string {
  const kebab = toKebabCase(name);
  return kebab.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/**
 * 将名称转换为 SCREAMING_SNAKE_CASE，用于环境变量式常量
 *
 * @param name - 原始名称
 * @returns SCREAMING_SNAKE_CASE 名称
 */
export function toScreamingSnake(name: string): string {
  return toKebabCase(name).replace(/-/g, '_').toUpperCase();
}

/**
 * 由令牌集合生成 CSS 自定义属性文本
 *
 * @param tokens - 令牌集合
 * @returns :root 变量声明文本
 */
export function buildCssVariables(tokens: ColorToken[]): string {
  const lines = tokens
    .filter((token) => toKebabCase(token.name).length > 0)
    .map((token) => `  --color-${toKebabCase(token.name)}: ${token.value};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

/**
 * 由令牌集合生成 JS 常量对象文本
 *
 * @param tokens - 令牌集合
 * @returns ES Module 导出文本
 */
export function buildJsConstants(tokens: ColorToken[]): string {
  const lines = tokens
    .filter((token) => toCamelCase(token.name).length > 0)
    .map(
      (token) =>
        `  ${toCamelCase(token.name)}: '${token.value}',`,
    );
  return `export const colors = {\n${lines.join('\n')}\n} as const;`;
}

/**
 * 由令牌集合生成 SCSS 变量文本
 *
 * @param tokens - 令牌集合
 * @returns SCSS 变量声明文本
 */
export function buildScssVariables(tokens: ColorToken[]): string {
  return tokens
    .filter((token) => toKebabCase(token.name).length > 0)
    .map((token) => `$color-${toKebabCase(token.name)}: ${token.value};`)
    .join('\n');
}
