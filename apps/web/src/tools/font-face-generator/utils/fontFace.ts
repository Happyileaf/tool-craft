/**
 * @font-face 声明生成器纯函数模块
 *
 * 只负责数据结构与 CSS 字符串拼装，不接触 React / DOM，便于在 Vitest（node 环境）下单测。
 */

/** 单个字体格式条目，url 为资源地址，format 为 CSS src format 提示 */
export interface FontSource {
  /** 字体资源 URL 或相对路径，例如 /fonts/Inter-Regular.woff2 */
  url: string;
  /** format 提示，例如 woff2 / woff / truetype；留空表示不输出 format() */
  format: string;
}

/** 单个字重（一个 @font-face 规则）的完整配置 */
export interface FontFaceConfig {
  /** font-family 名称 */
  family: string;
  /** font-weight 描述符，例如 normal / bold / 400 / 100 900 */
  weight: string;
  /** font-style 描述符：normal / italic / oblique */
  style: string;
  /** font-display 描述符：auto / block / swap / fallback / optional */
  display: string;
  /** 该字重下的多格式资源（按现代格式在前的顺序拼装） */
  sources: FontSource[];
  /** 可选 unicode-range 描述符，留空表示不输出 */
  unicodeRange?: string;
}

const VALID_DISPLAYS = ['auto', 'block', 'swap', 'fallback', 'optional'] as const;

/** 去掉首尾空白；空串视为未填写 */
export const trim = (value: string): string => value.trim();

/**
 * 校验单条配置，返回错误信息；合法返回 null。
 * family 必填，weight/style/display 需在允许集合内，且至少有一条非空 src。
 */
export function validateFontFace(config: FontFaceConfig): string | null {
  if (!trim(config.family)) {
    return 'font-family 名称不能为空';
  }
  if (!trim(config.weight)) {
    return 'font-weight 不能为空';
  }
  if (!['normal', 'italic', 'oblique'].includes(trim(config.style))) {
    return 'font-style 仅支持 normal / italic / oblique';
  }
  if (!VALID_DISPLAYS.includes(trim(config.display) as (typeof VALID_DISPLAYS)[number])) {
    return 'font-display 仅支持 auto / block / swap / fallback / optional';
  }
  const validSources = config.sources.filter((source) => trim(source.url));
  if (validSources.length === 0) {
    return '至少需要一个有效的字体资源地址（src）';
  }
  return null;
}

/** 给字体名加引号（CSS 自定义字体名通常需要引号包裹） */
function quoteFamily(family: string): string {
  const trimmed = trim(family);
  // 已被引号包裹则原样返回
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed;
  }
  return `"${trimmed}"`;
}

/** 拼装单条 src：url("...") format("...")；format 为空时仅输出 url() */
function formatSource(source: FontSource): string {
  const url = trim(source.url);
  const format = trim(source.format);
  const urlPart = `url("${url}")`;
  return format ? `${urlPart} format("${format}")` : urlPart;
}

/**
 * 将单条字重配置拼装为一段 @font-face CSS（不含尾随空行）。
 * 调用前应先通过 validateFontFace 校验。
 */
export function buildFontFaceRule(config: FontFaceConfig): string {
  const lines: string[] = ['@font-face {'];
  lines.push(`  font-family: ${quoteFamily(config.family)};`);
  lines.push(`  font-style: ${trim(config.style)};`);
  lines.push(`  font-weight: ${trim(config.weight)};`);
  lines.push(`  font-display: ${trim(config.display)};`);
  const srcValue = config.sources
    .filter((source) => trim(source.url))
    .map(formatSource)
    .join(', ');
  lines.push(`  src: ${srcValue};`);
  const unicodeRange = trim(config.unicodeRange ?? '');
  if (unicodeRange) {
    lines.push(`  unicode-range: ${unicodeRange};`);
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * 批量拼装多个字重的 @font-face 声明，规则之间以空行分隔。
 * 自动过滤未通过校验的条目，全部非法时返回空串。
 */
export function buildFontFaceBundle(configs: FontFaceConfig[]): string {
  return configs
    .filter((config) => validateFontFace(config) === null)
    .map(buildFontFaceRule)
    .join('\n\n');
}
