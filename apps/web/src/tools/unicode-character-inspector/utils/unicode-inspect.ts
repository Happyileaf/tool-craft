/**
 * Unicode 逐字符检视纯函数集合：
 * 码点迭代、手写 UTF-8 / UTF-16 编码、General_Category 推断、
 * 不可见 / 特殊字符标记、逐字符检视与归一化对比。
 *
 * 仅使用 String 原型、正则 Unicode 属性转义与 Intl（不依赖 DOM、TextEncoder），
 * 可在 node / jsdom 环境下直接测试。
 */

import { CATEGORY_LABELS, INVISIBLE_CHARS } from '../constants';
import type { InvisibleCharEntry } from '../constants';

/** 单个码点的检视记录 */
export interface CharInfo {
  /** 在原文中的码点序号，可作为列表 key */
  index: number;
  /** 原始字符（增补平面为代理对，孤立代理也原样保留） */
  char: string;
  /** 码点数值 */
  codePoint: number;
  /** U+XXXX 形式的大写十六进制码点（4–6 位） */
  hex: string;
  /** 手写编码得到的 UTF-8 字节序列 */
  utf8: number[];
  /** UTF-8 字节的大写十六进制文本，如 "E4 B8 AD" */
  utf8Hex: string;
  /** UTF-16 码元序列（BMP 1 个，增补平面为高/低代理对） */
  utf16: number[];
  /** UTF-16 码元的大写十六进制文本，如 "D83D DE00" */
  utf16Hex: string;
  /** General_Category：大类 L/N/P/S/Z/M 或细分 Cc/Cf/Cs/Co/Cn */
  category: string;
  /** 类别中文描述 */
  categoryLabel: string;
  /** 字符名（Intl 取不到时降级为类别描述） */
  name: string;
  /** 是否被判定为不可见 / 特殊字符 */
  flagged: boolean;
  /** 判定原因，未标记时为空 */
  flagReason?: string;
}

/** 四种规范化形式的对比结果 */
export interface NormalizeComparison {
  nfc: string;
  nfd: string;
  nfkc: string;
  nfkd: string;
  /** 与原始文本不同的规范化形式名 */
  differs: string[];
}

/** 不可见字符标记结果 */
export interface FlagResult {
  flagged: boolean;
  reason?: string;
}

/**
 * 将码点格式化为 U+XXXX（至少 4 位、大写、增补平面自动扩展到 5–6 位）。
 *
 * @param codePoint - 码点数值
 * @returns U+XXXX 文本
 */
export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * 将字节 / 码元数组格式化为大写十六进制文本（空格分隔）。
 *
 * @param values - 字节或码元数组
 * @param width - 每项宽度，字节 2、UTF-16 码元 4
 * @returns 如 "C3 A9" 或 "D83D DE00"
 */
function toHex(values: number[], width: number): string {
  return values.map((v) => v.toString(16).toUpperCase().padStart(width, '0')).join(' ');
}

/**
 * 按码点迭代文本，正确处理代理对，不按 UTF-16 码元切割；
 * 孤立的高 / 低代理也作为独立码点产出。
 *
 * @param text - 输入文本
 * @returns 码点数值数组
 */
export function iterateCodePoints(text: string): number[] {
  const points: number[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (typeof cp === 'number') {
      points.push(cp);
    }
  }
  return points;
}

/**
 * 手写 UTF-8 编码（RFC 3629），不依赖 TextEncoder：
 * U+0000–U+007F 1 字节；U+0080–U+07FF 2 字节；
 * U+0800–U+FFFF 3 字节；U+10000–U+10FFFF 4 字节。
 * 孤立代理码点（0xD800–0xDFFF）按 CESU-8 风格编码为 3 字节。
 *
 * @param codePoint - 码点数值
 * @returns UTF-8 字节序列
 */
export function codePointToUtf8(codePoint: number): number[] {
  if (codePoint < 0x80) {
    return [codePoint];
  }
  if (codePoint < 0x800) {
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
  }
  if (codePoint < 0x10000) {
    return [
      0xe0 | (codePoint >> 12),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  }
  return [
    0xf0 | (codePoint >> 18),
    0x80 | ((codePoint >> 12) & 0x3f),
    0x80 | ((codePoint >> 6) & 0x3f),
    0x80 | (codePoint & 0x3f),
  ];
}

/**
 * 将码点编码为 UTF-16 码元序列：BMP 码点为 1 个码元，
 * 增补平面码点为高代理 + 低代理两个码元。
 *
 * @param codePoint - 码点数值
 * @returns 1 或 2 个 UTF-16 码元
 */
export function codePointToUtf16(codePoint: number): number[] {
  if (codePoint < 0x10000) {
    return [codePoint];
  }
  const offset = codePoint - 0x10000;
  return [0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff)];
}

/**
 * 推断码点的 General_Category：
 * 先用区间识别 Cc（C0/C1 控制符）与 Cs（代理），
 * 再用正则 Unicode 属性转义判定 L/M/N/P/S/Z 大类及 Cf / Co / Cn，
 * 其余归入 C（其他）。
 *
 * @param codePoint - 码点数值
 * @returns 类别标识，如 "L"、"Cc"、"Cf"
 */
export function getCategory(codePoint: number): string {
  if (codePoint < 0x20 || codePoint === 0x7f || (codePoint >= 0x80 && codePoint <= 0x9f)) {
    return 'Cc';
  }
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
    return 'Cs';
  }
  const char = String.fromCodePoint(codePoint);
  if (/\p{L}/u.test(char)) {
    return 'L';
  }
  if (/\p{M}/u.test(char)) {
    return 'M';
  }
  if (/\p{N}/u.test(char)) {
    return 'N';
  }
  if (/\p{P}/u.test(char)) {
    return 'P';
  }
  if (/\p{S}/u.test(char)) {
    return 'S';
  }
  if (/\p{Z}/u.test(char)) {
    return 'Z';
  }
  if (/\p{Cf}/u.test(char)) {
    return 'Cf';
  }
  if (/\p{Co}/u.test(char)) {
    return 'Co';
  }
  if (/\p{Cn}/u.test(char)) {
    return 'Cn';
  }
  return 'C';
}

/**
 * 在内置码点表中查找码点对应的不可见字符条目。
 *
 * @param codePoint - 码点数值
 * @returns 命中条目，未命中为 undefined
 */
function findInvisibleEntry(codePoint: number): InvisibleCharEntry | undefined {
  return INVISIBLE_CHARS.find((entry) => {
    const end = entry.end ?? entry.start;
    return codePoint >= entry.start && codePoint <= end;
  });
}

/**
 * 判断码点是否为不可见 / 特殊字符并给出原因：
 * 1. 命中内置码点表（零宽、bidi 控制、BOM、变体选择符等）；
 * 2. Cc / Cf / Cs 类别默认标记，原因取类别描述；
 * 3. Z 类空白中的非 ASCII 空格（如 U+3000、U+2000 系列）提示。
 *
 * @param codePoint - 码点数值
 * @returns flagged 与 reason
 */
export function getFlag(codePoint: number): FlagResult {
  const entry = findInvisibleEntry(codePoint);
  if (entry) {
    return { flagged: true, reason: `${entry.name}：${entry.reason}` };
  }

  const category = getCategory(codePoint);
  if (category === 'Cc' || category === 'Cf' || category === 'Cs') {
    return { flagged: true, reason: CATEGORY_LABELS[category] };
  }

  if (category === 'Z' && codePoint !== 0x20) {
    return { flagged: true, reason: '空白字符（非 ASCII 空格），外观与普通空格难以区分' };
  }

  return { flagged: false };
}

/** 懒加载的字符名 DisplayNames（部分运行环境的 ICU 不支持 character 类型） */
let characterDisplayNames: Intl.DisplayNames | undefined;
let characterDisplayNamesTried = false;

/**
 * 用 Intl.DisplayNames 的 character 类型获取字符名
 * （CHARACTER_PROPERTY_ALIAS 风格）。
 * 运行环境不支持或取不到名称时返回 undefined，不抛错。
 *
 * @param codePoint - 码点数值
 * @returns 字符名或 undefined
 */
export function getCharacterName(codePoint: number): string | undefined {
  if (!characterDisplayNamesTried) {
    characterDisplayNamesTried = true;
    try {
      // 部分 TS lib 版本的 DisplayNamesType 未收录 'character'，但 Node 20+/现代浏览器支持
      characterDisplayNames = new Intl.DisplayNames(['en'], {
        type: 'character',
      } as unknown as Intl.DisplayNamesOptions);
    } catch {
      characterDisplayNames = undefined;
    }
  }
  if (!characterDisplayNames) {
    return undefined;
  }
  try {
    const name = characterDisplayNames.of(formatCodePoint(codePoint));
    return typeof name === 'string' && name.length > 0 ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 逐码点检视文本，为每个字符产出编码、类别、名称与可疑标记。
 * 直接遍历字符串以原样保留孤立代理，不用 String.fromCodePoint 重建。
 *
 * @param text - 输入文本
 * @returns 逐字符检视记录
 */
export function inspectText(text: string): CharInfo[] {
  const records: CharInfo[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (typeof codePoint !== 'number') {
      continue;
    }
    records.push(buildCharInfo(char, codePoint, records.length));
  }
  return records;
}

/**
 * 依据原始字符与码点组装单条检视记录。
 *
 * @param char - 原始字符
 * @param codePoint - 码点数值
 * @param index - 在原文中的码点序号
 * @returns 检视记录
 */
function buildCharInfo(char: string, codePoint: number, index: number): CharInfo {
  const category = getCategory(codePoint);
  const flag = getFlag(codePoint);
  const utf8 = codePointToUtf8(codePoint);
  const utf16 = codePointToUtf16(codePoint);
  return {
    index,
    char,
    codePoint,
    hex: formatCodePoint(codePoint),
    utf8,
    utf8Hex: toHex(utf8, 2),
    utf16,
    utf16Hex: toHex(utf16, 4),
    category,
    categoryLabel: CATEGORY_LABELS[category] ?? CATEGORY_LABELS.C ?? '其他',
    name: getCharacterName(codePoint) ?? (CATEGORY_LABELS[category] ?? CATEGORY_LABELS.C ?? '其他'),
    flagged: flag.flagged,
    flagReason: flag.reason,
  };
}

/**
 * 对文本做 NFC / NFD / NFKC / NFKD 四种归一化，并指出与原文不同的形式。
 *
 * @param text - 输入文本
 * @returns 四种归一化结果与差异形式名
 */
export function normalizeCompare(text: string): NormalizeComparison {
  const nfc = text.normalize('NFC');
  const nfd = text.normalize('NFD');
  const nfkc = text.normalize('NFKC');
  const nfkd = text.normalize('NFKD');
  const differs: string[] = [];
  if (nfc !== text) {
    differs.push('NFC');
  }
  if (nfd !== text) {
    differs.push('NFD');
  }
  if (nfkc !== text) {
    differs.push('NFKC');
  }
  if (nfkd !== text) {
    differs.push('NFKD');
  }
  return { nfc, nfd, nfkc, nfkd, differs };
}

/**
 * 统计整段文本的总码点数、UTF-8 字节数（手写编码累加）。
 *
 * @param text - 输入文本
 * @returns 码点总数与 UTF-8 字节总数
 */
export function summarizeEncoding(text: string): { codePointCount: number; utf8Bytes: number } {
  const points = iterateCodePoints(text);
  return {
    codePointCount: points.length,
    utf8Bytes: points.reduce((sum, cp) => sum + codePointToUtf8(cp).length, 0),
  };
}
