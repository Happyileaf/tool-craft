/**
 * CSS 命名颜色查询核心逻辑：颜色值解析、RGB/HSL 换算、名称搜索、
 * RGB 空间欧氏距离反查与排序，均为纯函数，不依赖 DOM。
 */
import { NAMED_COLORS, type NamedColor } from './named-colors';

/** RGB 三元组，分量范围 0–255 */
export type RgbTuple = readonly [number, number, number];

/** 反查结果条目 */
export interface NearestColor {
  color: NamedColor;
  /** 与输入色的 RGB 欧氏距离（0 表示完全一致） */
  distance: number;
}

/** 解析结果 */
export interface ParseResult {
  ok: boolean;
  rgb: RgbTuple | null;
  /** 解析失败时的中文错误说明 */
  error?: string;
}

/**
 * 把任意可能的 3 位 HEX 扩展为 6 位，并归一化为小写 #rrggbb。
 *
 * @param hex - 输入 HEX 字符串（可带 #）
 * @returns 标准 6 位 HEX 或 null（格式非法）
 */
export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim().toLowerCase().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split('')
      .map((char) => char + char)
      .join('');
    return `#${expanded}`;
  }
  if (/^[0-9a-f]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return null;
}

/**
 * 把 HEX 字符串解析为 RGB。
 *
 * @param hex - 输入 HEX
 * @returns RGB 三元组或 null
 */
export function hexToRgb(hex: string): RgbTuple | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  const value = normalized.slice(1);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/**
 * 把 RGB 转换为 CSS hsl() 分量（h: 0–360，s/l: 0–100，四舍五入取整）。
 *
 * @param rgb - RGB 三元组
 * @returns hsl 三元组
 */
export function rgbToHsl(rgb: RgbTuple): readonly [number, number, number] {
  const [r8, g8, b8] = rgb;
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
    }
    hue *= 60;
  }

  return [
    Math.round(hue),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];
}

/**
 * 生成标准 CSS hsl() 字符串。
 *
 * @param rgb - RGB 三元组
 * @returns 如 hsl(240, 100%, 50%)
 */
export function toHslString(rgb: RgbTuple): string {
  const [h, s, l] = rgbToHsl(rgb);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * 解析用户输入的颜色值，支持命名关键字、#rgb / #rrggbb、
 * rgb()/rgba()（整数或百分比）与 hsl()/hsla()。
 *
 * @param input - 原始输入
 * @returns 解析结果
 */
export function parseColorInput(input: string): ParseResult {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === '') {
    return { ok: false, rgb: null, error: '请输入颜色名称或颜色值' };
  }

  // 命名关键字
  const named = NAMED_COLORS.find((item) => item.name === trimmed);
  if (named) {
    return { ok: true, rgb: named.rgb };
  }

  // HEX
  if (trimmed.startsWith('#')) {
    const rgb = hexToRgb(trimmed);
    return rgb
      ? { ok: true, rgb }
      : { ok: false, rgb: null, error: 'HEX 格式非法，应为 #rgb 或 #rrggbb（十六进制字符）' };
  }

  // rgb() / rgba()
  const rgbMatch = /^rgba?\(([^)]+)\)$/.exec(trimmed);
  if (rgbMatch) {
    const parts = rgbMatch[1]!.split(',').map((part) => part.trim());
    if (parts.length < 3 || parts.length > 4) {
      return { ok: false, rgb: null, error: 'rgb() 需要 3 个分量（可选第 4 个 alpha）' };
    }
    const channels = parts.slice(0, 3).map((part) => parseChannel(part));
    if (channels.some((value) => value === null)) {
      return { ok: false, rgb: null, error: 'rgb() 分量应为 0–255 整数或 0%–100% 百分比' };
    }
    return { ok: true, rgb: [channels[0]!, channels[1]!, channels[2]!] as RgbTuple };
  }

  // hsl() / hsla()
  const hslMatch = /^hsla?\(([^)]+)\)$/.exec(trimmed);
  if (hslMatch) {
    const parts = hslMatch[1]!.split(',').map((part) => part.trim());
    if (parts.length < 3 || parts.length > 4) {
      return { ok: false, rgb: null, error: 'hsl() 需要 h、s、l 三个分量（可选 alpha）' };
    }
    const hue = Number(parts[0]!.replace('deg', ''));
    const sat = parsePercent(parts[1]!);
    const light = parsePercent(parts[2]!);
    if (Number.isNaN(hue) || sat === null || light === null) {
      return { ok: false, rgb: null, error: 'hsl() 分量格式非法，如 hsl(240, 100%, 50%)' };
    }
    return { ok: true, rgb: hslToRgb(hue, sat, light) };
  }

  return {
    ok: false,
    rgb: null,
    error: '无法识别的颜色格式，支持名称、#hex、rgb() 与 hsl()',
  };
}

/**
 * 解析 rgb 分量：0–255 整数或 0%–100% 百分比。
 *
 * @param token - 分量文本
 * @returns 0–255 数值或 null
 */
function parseChannel(token: string): number | null {
  if (token.endsWith('%')) {
    const percent = parsePercent(token);
    return percent === null ? null : Math.round((percent / 100) * 255);
  }
  if (!/^\d+$/.test(token)) {
    return null;
  }
  const value = Number(token);
  return value >= 0 && value <= 255 ? value : null;
}

/**
 * 解析百分比文本。
 *
 * @param token - 如 100%
 * @returns 0–100 数值或 null
 */
function parsePercent(token: string): number | null {
  if (!token.endsWith('%')) {
    return null;
  }
  const value = Number(token.slice(0, -1));
  return Number.isNaN(value) || value < 0 || value > 100 ? null : value;
}

/**
 * HSL 转 RGB（CSS 整数分量）。
 *
 * @param hue - 色相 0–360
 * @param saturation - 饱和度 0–100
 * @param lightness - 亮度 0–100
 * @returns RGB 三元组
 */
export function hslToRgb(hue: number, saturation: number, lightness: number): RgbTuple {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/**
 * 计算两个 RGB 颜色的欧氏距离。
 *
 * @param a - 颜色 A
 * @param b - 颜色 B
 * @returns 距离值
 */
export function colorDistance(a: RgbTuple, b: RgbTuple): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 按名称关键字搜索命名颜色（包含匹配、大小写不敏感）。
 *
 * @param keyword - 名称片段
 * @returns 命中的命名颜色
 */
export function searchByName(keyword: string): NamedColor[] {
  const lower = keyword.trim().toLowerCase();
  if (!lower) {
    return [...NAMED_COLORS];
  }
  return NAMED_COLORS.filter((item) => item.name.includes(lower));
}

/**
 * 按 HEX 值精确查找命名颜色。
 *
 * @param hex - 输入 HEX
 * @returns 命中条目或 null
 */
export function lookupByHex(hex: string): NamedColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  return NAMED_COLORS.find((item) => item.hex === normalized) ?? null;
}

/**
 * 反查与给定 RGB 最接近的若干命名颜色，按距离升序。
 *
 * @param rgb - 输入 RGB
 * @param limit - 返回条数，默认 3
 * @returns 最近颜色列表
 */
export function findNearestColors(rgb: RgbTuple, limit = 3): NearestColor[] {
  return NAMED_COLORS.map((color) => ({
    color,
    distance: colorDistance(rgb, color.rgb),
  }))
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.color.name.localeCompare(b.color.name);
    })
    .slice(0, limit);
}

/**
 * 按色相排序（灰度色 hue=0 时依据亮度排在末尾区域），同色相近似保持稳定。
 *
 * @param colors - 待排序颜色
 * @returns 新数组
 */
export function sortByHue(colors: readonly NamedColor[]): NamedColor[] {
  return [...colors].sort((a, b) => {
    const [ha, , la] = rgbToHsl(a.rgb);
    const [hb, , lb] = rgbToHsl(b.rgb);
    if (ha !== hb) {
      return ha - hb;
    }
    if (la !== lb) {
      return la - lb;
    }
    return a.name.localeCompare(b.name);
  });
}
