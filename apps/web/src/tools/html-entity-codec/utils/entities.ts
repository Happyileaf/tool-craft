/**
 * HTML 实体编解码纯函数集合。
 * 全部逻辑在浏览器本地执行，不触碰 DOM / React，也不发起任何网络请求。
 */

/**
 * HTML 实体编码选项
 */
export interface EncodeOptions {
  /** 是否把非 ASCII 字符编码为实体（命中命名实体表则用命名实体，否则用十进制数字实体） */
  encodeNonAscii?: boolean;
}

/**
 * 基础 ASCII 敏感字符到命名实体的映射，`&` 必须优先处理以避免二次转义
 */
const BASIC_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * 常见命名实体到字符的映射，同时用于解码还原与编码时的命名实体查找
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  bull: '\u2022',
  middot: '\u00b7',
  deg: '\u00b0',
  plusmn: '\u00b1',
  times: '\u00d7',
  divide: '\u00f7',
  micro: '\u00b5',
  euro: '\u20ac',
  pound: '\u00a3',
  yen: '\u00a5',
  cent: '\u00a2',
  sect: '\u00a7',
  para: '\u00b6',
  frac12: '\u00bd',
  frac14: '\u00bc',
  frac34: '\u00be',
  sup2: '\u00b2',
  sup3: '\u00b3',
  larr: '\u2190',
  rarr: '\u2192',
  uarr: '\u2191',
  darr: '\u2193',
  harr: '\u2194',
  infin: '\u221e',
  ne: '\u2260',
  le: '\u2264',
  ge: '\u2265',
  sum: '\u2211',
  radic: '\u221a',
  check: '\u2713',
  cross: '\u2717',
  star: '\u2605',
  hearts: '\u2665',
  spades: '\u2660',
  clubs: '\u2663',
  diams: '\u2666',
};

/**
 * 字符到命名实体的反查表，用于编码非 ASCII 字符时命中命名实体
 */
const CHAR_TO_NAME: Record<string, string> = {};
for (const [name, char] of Object.entries(NAMED_ENTITIES)) {
  if (!(char in CHAR_TO_NAME)) {
    CHAR_TO_NAME[char] = name;
  }
}

/** 匹配命名实体、十进制数字实体与十六进制数字实体的正则 */
const ENTITY_PATTERN = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g;

/**
 * 判断码点是否可作为 Unicode 标量输出
 *
 * @param code - 待判断的码点
 * @returns 合法返回 true
 */
function isValidCodePoint(code: number): boolean {
  return Number.isInteger(code) && code >= 0 && code <= 0x10ffff;
}

/**
 * 把文本编码为 HTML 实体
 *
 * @param text - 待编码文本
 * @param options - 编码选项，可开启「编码非 ASCII 字符」
 * @returns 编码后的文本；`&` 仅处理一次，不会二次转义
 */
export function encodeHtml(text: string, options: EncodeOptions = {}): string {
  const encodeNonAscii = options.encodeNonAscii ?? false;
  let result = '';
  for (const char of text) {
    const basic = BASIC_ENTITY_MAP[char];
    if (basic) {
      result += basic;
      continue;
    }
    const code = char.codePointAt(0) ?? 0;
    if (code > 127 && encodeNonAscii) {
      const name = CHAR_TO_NAME[char];
      result += name ? `&${name};` : `&#${code};`;
      continue;
    }
    result += char;
  }
  return result;
}

/**
 * 把文本中的 HTML 实体还原为字符
 *
 * @param text - 含实体的文本
 * @returns 还原后的文本；未知命名实体与非法数字实体保留原文，不抛异常
 */
export function decodeHtml(text: string): string {
  return text.replace(ENTITY_PATTERN, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return isValidCodePoint(code) ? String.fromCodePoint(code) : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return isValidCodePoint(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}
