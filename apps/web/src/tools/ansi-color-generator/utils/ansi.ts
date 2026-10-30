/**
 * ANSI SGR 终端颜色码生成（ECMA-48 / 常见终端实现）。
 * 纯字符串拼接与编号映射，不依赖任何外部库。
 */

/** 标准 16 色前景 SGR 编号（暗色 30–37、亮色 90–97） */
export const STANDARD_FG: Record<string, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
};

/** 标准 16 色背景 SGR 编号（暗色 40–47、亮色 100–107） */
export const STANDARD_BG: Record<string, number> = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
  brightBlack: 100,
  brightRed: 101,
  brightGreen: 102,
  brightYellow: 103,
  brightBlue: 104,
  brightMagenta: 105,
  brightCyan: 106,
  brightWhite: 107,
};

/** 标准 16 色对应的 CSS 颜色（xterm 调色板近似） */
export const STANDARD_CSS: Record<string, string> = {
  black: '#000000',
  red: '#cc0000',
  green: '#4e9a06',
  yellow: '#c4a000',
  blue: '#3465a4',
  magenta: '#75507b',
  cyan: '#06989a',
  white: '#d3d7cf',
  brightBlack: '#555753',
  brightRed: '#ef2929',
  brightGreen: '#8ae234',
  brightYellow: '#fce94f',
  brightBlue: '#729fcf',
  brightMagenta: '#ad7fa8',
  brightCyan: '#34e2e2',
  brightWhite: '#eeeeec',
};

/** 可切换的样式 SGR 属性 */
export const STYLE_CODES: Record<string, number> = {
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  blink: 5,
  reverse: 7,
  hidden: 8,
  strikethrough: 9,
};

export type ColorSpace = 'none' | 'standard' | 'palette256' | 'rgb';

export interface ColorSpec {
  space: ColorSpace;
  /** standard 模式：STANDARD_FG / STANDARD_BG 的键 */
  name?: string;
  /** palette256 模式：0–255 */
  index?: number;
  /** rgb 模式：0–255 三分量 */
  r?: number;
  g?: number;
  b?: number;
}

export interface AnsiInput {
  text: string;
  fg: ColorSpec;
  bg: ColorSpec;
  styles: string[];
}

export interface AnsiResult {
  /** 实际转义序列（ESC 为 U+001B） */
  sequence: string | null;
  /** JS 字符串字面量（\x1b 转义，不含外层引号） */
  jsLiteral: string | null;
  /** echo -e 可用的 shell 命令（\033 转义） */
  shellCommand: string | null;
  /** 本地 CSS 预览样式 */
  previewCss: { color?: string; background?: string };
  error: string | null;
}

/** 计算 256 色调色板某编号的 CSS 颜色 */
export function palette256ToCss(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n > 255) {
    return null;
  }
  if (n < 16) {
    const keys = Object.keys(STANDARD_CSS);
    return STANDARD_CSS[keys[n]!] ?? null;
  }
  if (n < 232) {
    const value = n - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    const r = levels[Math.floor(value / 36)]!;
    const g = levels[Math.floor((value % 36) / 6)]!;
    const b = levels[value % 6]!;
    return rgbToCss(r, g, b);
  }
  const gray = 8 + (n - 232) * 10;
  return rgbToCss(gray, gray, gray);
}

function rgbToCss(r: number, g: number, b: number): string {
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function validComponent(value: number | undefined): value is number {
  return Number.isInteger(value) && value! >= 0 && value! <= 255;
}

/** 把颜色规格展开为 SGR 参数数组（前景 isForeground=true，背景 false） */
function colorParams(spec: ColorSpec, isForeground: boolean): number[] | string {
  const standardMap = isForeground ? STANDARD_FG : STANDARD_BG;
  if (spec.space === 'none') {
    return [];
  }
  if (spec.space === 'standard') {
    const code = spec.name ? standardMap[spec.name] : undefined;
    if (code === undefined) {
      return '标准颜色名称不合法';
    }
    return [code];
  }
  if (spec.space === 'palette256') {
    if (!Number.isInteger(spec.index) || (spec.index ?? -1) < 0 || (spec.index ?? 256) > 255) {
      return '256 色编号需为 0–255 的整数';
    }
    return [isForeground ? 38 : 48, 5, spec.index!];
  }
  // rgb
  const { r, g, b } = spec;
  if (!validComponent(r) || !validComponent(g) || !validComponent(b)) {
    return 'RGB 分量需为 0–255 的整数';
  }
  return [isForeground ? 38 : 48, 2, r, g, b];
}

function colorToCss(spec: ColorSpec): string | undefined {
  if (spec.space === 'standard') {
    return spec.name ? STANDARD_CSS[spec.name] : undefined;
  }
  if (spec.space === 'palette256') {
    return spec.index === undefined ? undefined : palette256ToCss(spec.index) ?? undefined;
  }
  if (spec.space === 'rgb') {
    const { r, g, b } = spec;
    if (!validComponent(r) || !validComponent(g) || !validComponent(b)) {
      return undefined;
    }
    return rgbToCss(r, g, b);
  }
  return undefined;
}

/** 主入口：生成转义序列、JS 字面量与 shell 命令 */
export function generateAnsi(input: AnsiInput): AnsiResult {
  const previewCss: { color?: string; background?: string } = {};
  const fgCss = colorToCss(input.fg);
  const bgCss = colorToCss(input.bg);
  if (fgCss) {
    previewCss.color = fgCss;
  }
  if (bgCss) {
    previewCss.background = bgCss;
  }

  const fgParams = colorParams(input.fg, true);
  const bgParams = colorParams(input.bg, false);
  if (typeof fgParams === 'string') {
    return { sequence: null, jsLiteral: null, shellCommand: null, previewCss, error: fgParams };
  }
  if (typeof bgParams === 'string') {
    return { sequence: null, jsLiteral: null, shellCommand: null, previewCss, error: bgParams };
  }

  const styleParams: number[] = [];
  for (const style of input.styles) {
    const code = STYLE_CODES[style];
    if (code === undefined) {
      return {
        sequence: null,
        jsLiteral: null,
        shellCommand: null,
        previewCss,
        error: `未知样式：${style}`,
      };
    }
    styleParams.push(code);
  }

  const params = [...styleParams, ...fgParams, ...bgParams];
  const text = input.text;
  if (params.length === 0) {
    return {
      sequence: text,
      jsLiteral: text,
      shellCommand: `echo -e '${text.replace(/'/g, `'\\''`)}'`,
      previewCss,
      error: null,
    };
  }

  const paramText = params.join(';');
  const ESC = '\x1b';
  const sequence = `${ESC}[${paramText}m${text}${ESC}[0m`;
  const jsLiteral = `\\x1b[${paramText}m${text}\\x1b[0m`;
  const quoted = text.replace(/'/g, `'\\''`);
  const shellCommand = `echo -e '\\033[${paramText}m${quoted}\\033[0m'`;

  return { sequence, jsLiteral, shellCommand, previewCss, error: null };
}
