/**
 * CSS 命名颜色查询与反查：颜色解析、名称/值过滤、RGB 空间最近邻匹配。
 * 全部为确定性纯函数，不触碰 DOM、零新增依赖。
 */
import { NAMED_COLORS, type NamedColor } from './namedColorsData';

/** RGB 三元组 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** 颜色解析结果 */
export interface ParsedColor {
  /** 是否解析成功 */
  ok: boolean;
  /** 解析出的 RGB（失败时为 null） */
  rgb: Rgb | null;
  /** 失败原因（成功时为 null） */
  error: string | null;
}

/** 反查命中项：命名色及其与目标色的欧氏距离 */
export interface NearestColor {
  color: NamedColor;
  /** RGB 空间欧氏距离（0-441.67 量级） */
  distance: number;
}

/**
 * 解析用户输入的颜色值，支持：
 * - 3 位 / 6 位 HEX（#rgb、#rrggbb，# 可省略）
 * - rgb(r, g, b) / rgba(r, g, b, a)
 * - hsl(h, s%, l%)（alpha 忽略，按不透明处理）
 * - 148 个命名颜色名称
 *
 * @param input - 原始输入
 * @returns 解析结果，非法输入返回 ok=false 与原因，不抛异常
 */
export function parseColorInput(input: string): ParsedColor {
  const text = (input ?? '').trim().toLowerCase();
  if (!text) {
    return { ok: false, rgb: null, error: '请输入颜色名称或 HEX / RGB / HSL 值。' };
  }

  // 命名颜色
  const named = NAMED_COLORS.find((color) => color.name === text);
  if (named) {
    return { ok: true, rgb: { ...named.rgb }, error: null };
  }

  // HEX：#rgb / #rrggbb（含省略 # 的形式）
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (hexMatch) {
    let digits = hexMatch[1]!;
    if (digits.length === 3) {
      digits = digits
        .split('')
        .map((char) => char + char)
        .join('');
    }
    return {
      ok: true,
      rgb: {
        r: parseInt(digits.slice(0, 2), 16),
        g: parseInt(digits.slice(2, 4), 16),
        b: parseInt(digits.slice(4, 6), 16),
      },
      error: null,
    };
  }

  // rgb() / rgba()
  const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/.exec(
    text,
  );
  if (rgbMatch) {
    const channels = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((value) => Number(value));
    if (channels.some((value) => value > 255)) {
      return { ok: false, rgb: null, error: 'RGB 通道取值必须在 0-255 之间。' };
    }
    return {
      ok: true,
      rgb: { r: channels[0]!, g: channels[1]!, b: channels[2]! },
      error: null,
    };
  }

  // hsl() / hsla()
  const hslMatch =
    /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*[\d.]+)?\s*\)$/.exec(text);
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    if (h > 360 || s > 1 || l > 1) {
      return { ok: false, rgb: null, error: 'HSL 取值非法：h 应在 0-360，s/l 应在 0-100%。' };
    }
    return { ok: true, rgb: hslToRgb(h, s, l), error: null };
  }

  return {
    ok: false,
    rgb: null,
    error: '无法识别的颜色格式，支持名称、#rrggbb、rgb() 与 hsl()。',
  };
}

/** HSL -> RGB（h: 0-360, s/l: 0-1） */
function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/** 两色在 RGB 空间的欧氏距离 */
export function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2,
  );
}

/**
 * 反查与目标 RGB 最接近的若干命名颜色，按距离升序。
 *
 * @param target - 目标 RGB
 * @param limit - 返回条目数，默认 3
 * @returns 最近的命名色及距离
 */
export function findNearestNamedColors(target: Rgb, limit = 3): NearestColor[] {
  return NAMED_COLORS.map((color) => ({
    color,
    distance: colorDistance(target, color.rgb),
  }))
    .sort((a, b) => a.distance - b.distance || a.color.name.localeCompare(b.color.name))
    .slice(0, limit);
}

/**
 * 按名称关键字过滤命名颜色（不区分大小写的包含匹配，天然覆盖前缀匹配）。
 *
 * @param keyword - 名称关键字
 * @returns 命中的命名色
 */
export function filterByName(keyword: string): NamedColor[] {
  const key = (keyword ?? '').trim().toLowerCase();
  if (!key) {
    return NAMED_COLORS;
  }
  return NAMED_COLORS.filter((color) => color.name.includes(key));
}

/** 排序方式：字母序或色相（HSL 色相环）序 */
export type ColorSortMode = 'alphabetical' | 'hue';

/**
 * 对命名色排序。
 *
 * @param colors - 待排序数组
 * @param mode - alphabetical 字母序；hue 按 HSL 色相、再按饱和度与亮度
 * @returns 排序后的新数组
 */
export function sortColors(colors: NamedColor[], mode: ColorSortMode): NamedColor[] {
  const copy = [...colors];
  if (mode === 'alphabetical') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort(
    (a, b) =>
      a.hsl.h - b.hsl.h ||
      a.hsl.s - b.hsl.s ||
      a.hsl.l - b.hsl.l ||
      a.name.localeCompare(b.name),
  );
}

/** 格式化为 CSS rgb() 字符串 */
export function formatRgb(color: NamedColor): string {
  return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
}

/** 格式化为 CSS hsl() 字符串 */
export function formatHsl(color: NamedColor): string {
  return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
}
