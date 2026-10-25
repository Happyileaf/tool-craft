/**
 * 编程语言字符串字面量转义 / 反转义的纯逻辑集合。
 * 支持 JavaScript / JSON、Python、Java 三种双引号字面量风格：
 * 转义把多行原始文本变为可直接粘贴进代码的字面量内容；反转义把
 * `\n`、`\t`、`\uXXXX` 等序列还原为可读明文。不触碰 DOM / React。
 */

/** JavaScript / JSON 风格 */
export const LANGUAGE_JS = 'js' as const;
/** Python 风格 */
export const LANGUAGE_PYTHON = 'python' as const;
/** Java 风格 */
export const LANGUAGE_JAVA = 'java' as const;

/** 支持的语言风格 */
export type EscapeLanguage =
  | typeof LANGUAGE_JS
  | typeof LANGUAGE_PYTHON
  | typeof LANGUAGE_JAVA;

/** 反转义结果 */
export interface UnescapeResult {
  /** 成功时的还原文本 */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 三种语言通用的单字母短转义 */
const COMMON_ESCAPES: Record<string, string> = {
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  '"': '"',
  '\\': '\\',
};

/** 仅 JavaScript 支持的短转义（\/ 为 JSON 兼容序列，\v 为 JS 扩展） */
const JS_EXTRA_ESCAPES: Record<string, string> = {
  '/': '/',
  v: '\v',
  '`': '`',
};

/** 仅 Python 支持的短转义 */
const PYTHON_EXTRA_ESCAPES: Record<string, string> = {
  a: '\x07',
  v: '\v',
  "'": "'",
  '0': '\0',
};

/** Java 额外接受的短转义 */
const JAVA_EXTRA_ESCAPES: Record<string, string> = {
  "'": "'",
};

/** 编码时使用的控制字符短转义 */
const SHORT_ENCODE_ESCAPES: Record<string, string> = {
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
};

/**
 * 按语言风格解析短转义
 *
 * @param marker - 反斜杠后的字符
 * @param language - 语言风格
 * @returns 对应字符；不支持时返回 null
 */
function resolveSimpleEscape(marker: string, language: EscapeLanguage): string | null {
  if (marker in COMMON_ESCAPES) {
    return COMMON_ESCAPES[marker] ?? null;
  }
  if (language === LANGUAGE_JS && marker in JS_EXTRA_ESCAPES) {
    return JS_EXTRA_ESCAPES[marker] ?? null;
  }
  if (language === LANGUAGE_PYTHON && marker in PYTHON_EXTRA_ESCAPES) {
    return PYTHON_EXTRA_ESCAPES[marker] ?? null;
  }
  if (language === LANGUAGE_JAVA && marker in JAVA_EXTRA_ESCAPES) {
    return JAVA_EXTRA_ESCAPES[marker] ?? null;
  }
  return null;
}

/**
 * 把字符编码为 `\uXXXX`（astral 码点拆成代理对）
 *
 * @param char - 单个字符
 * @returns u 转义序列
 */
function toUnicodeEscape(char: string): string {
  const codePoint = char.codePointAt(0) ?? 0;
  if (codePoint <= 0xffff) {
    return `\\u${codePoint.toString(16).padStart(4, '0')}`;
  }
  const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
  const low = ((codePoint - 0x10000) % 0x400) + 0xdc00;
  return `\\u${high.toString(16).padStart(4, '0')}\\u${low
    .toString(16)
    .padStart(4, '0')}`;
}

/**
 * 把原始文本转义为字符串字面量内容（不含外层引号）
 *
 * 输出在三种语言下均可直接放入双引号字面量；非 ASCII 与控制字符
 * 统一使用 `\uXXXX`，Python 的 C0 控制字符额外可使用 `\xHH`。
 *
 * @param text - 原始文本
 * @param language - 语言风格，默认 js
 * @returns 可放入双引号字面量的转义文本
 */
export function escapeString(text: string, language: EscapeLanguage = LANGUAGE_JS): string {
  let output = '';
  for (const char of text) {
    if (char === '"') {
      output += '\\"';
      continue;
    }
    if (char === '\\') {
      output += '\\\\';
      continue;
    }
    const short = SHORT_ENCODE_ESCAPES[char];
    if (short !== undefined) {
      output += short;
      continue;
    }
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint < 0x20 || codePoint === 0x7f) {
      output +=
        language === LANGUAGE_PYTHON
          ? `\\x${codePoint.toString(16).padStart(2, '0')}`
          : toUnicodeEscape(char);
      continue;
    }
    if (codePoint > 0x7e) {
      output += toUnicodeEscape(char);
      continue;
    }
    output += char;
  }
  return output;
}

/**
 * 从指定位置解析固定位数的十六进制数字
 *
 * @param text - 完整文本
 * @param start - 数字起始下标
 * @param count - 需要的十六进制位数
 * @returns 数值与数字结束下标；数字不足时返回 null
 */
function readHex(text: string, start: number, count: number): { value: number; end: number } | null {
  let value = 0;
  let index = start;
  for (; index < start + count; index += 1) {
    const digit = parseInt(text.slice(index, index + 1), 16);
    if (Number.isNaN(digit)) {
      return null;
    }
    value = value * 16 + digit;
  }
  return { value, end: index };
}

/**
 * 输出一个 UTF-16 码元，孤立代理替换为 U+FFFD
 *
 * @param code - 码元数值
 * @returns 对应字符
 */
function codeUnitToChar(code: number): string {
  if (code >= 0xd800 && code <= 0xdfff) {
    return String.fromCharCode(0xfffd);
  }
  return String.fromCharCode(code);
}

/**
 * 把转义后的字面量内容还原为原始文本
 *
 * @param text - 不含外层引号的转义文本
 * @param language - 语言风格，默认 js
 * @returns 还原结果（含可读错误）
 */
export function unescapeString(
  text: string,
  language: EscapeLanguage = LANGUAGE_JS,
): UnescapeResult {
  let output = '';
  let index = 0;

  while (index < text.length) {
    const char = text[index];
    if (char !== '\\') {
      output += char;
      index += 1;
      continue;
    }

    const marker = text[index + 1];
    if (marker === undefined) {
      return { text: null, error: '反转义失败：末尾存在孤立的反斜杠 “\\”' };
    }

    const simple = resolveSimpleEscape(marker, language);
    if (simple !== null) {
      output += simple;
      index += 2;
      continue;
    }

    if (marker === 'x') {
      if (language !== LANGUAGE_PYTHON) {
        return {
          text: null,
          error: '反转义失败：\\xHH 仅 Python 支持，JavaScript / Java 请使用 \\uXXXX',
        };
      }
      const hex = readHex(text, index + 2, 2);
      if (hex === null) {
        return { text: null, error: '反转义失败：\\x 需要两位十六进制数字（如 \\x1f）' };
      }
      output += String.fromCharCode(hex.value);
      index = hex.end;
      continue;
    }

    if (marker === 'U' && language === LANGUAGE_PYTHON) {
      const hex = readHex(text, index + 2, 8);
      if (hex === null || hex.value > 0x10ffff) {
        return { text: null, error: '反转义失败：\\U 需要八位合法 Unicode 码点（如 \\U0001F600）' };
      }
      output += String.fromCodePoint(hex.value);
      index = hex.end;
      continue;
    }

    if (marker === 'u') {
      if (text[index + 2] === '{' && language === LANGUAGE_JS) {
        const close = text.indexOf('}', index + 3);
        if (close === -1) {
          return { text: null, error: '反转义失败：\\u{ 缺少闭合的 }' };
        }
        const codePoint = parseInt(text.slice(index + 3, close), 16);
        if (Number.isNaN(codePoint) || codePoint > 0x10ffff) {
          return { text: null, error: '反转义失败：\\u{} 内不是合法的 Unicode 码点' };
        }
        output += String.fromCodePoint(codePoint);
        index = close + 1;
        continue;
      }
      const hex = readHex(text, index + 2, 4);
      if (hex === null) {
        return { text: null, error: '反转义失败：\\u 需要四位十六进制数字（如 \\u0041）' };
      }
      if (hex.value >= 0xd800 && hex.value <= 0xdbff && text.slice(hex.end, hex.end + 2) === '\\u') {
        const low = readHex(text, hex.end + 2, 4);
        if (low !== null && low.value >= 0xdc00 && low.value <= 0xdfff) {
          const codePoint = 0x10000 + (hex.value - 0xd800) * 0x400 + (low.value - 0xdc00);
          output += String.fromCodePoint(codePoint);
          index = low.end;
          continue;
        }
      }
      output += codeUnitToChar(hex.value);
      index = hex.end;
      continue;
    }

    if (language === LANGUAGE_PYTHON && (marker === '\n' || marker === '\r')) {
      index += marker === '\r' && text[index + 2] === '\n' ? 3 : 2;
      continue;
    }

    return {
      text: null,
      error: `反转义失败：${language === LANGUAGE_PYTHON ? 'Python' : language === LANGUAGE_JAVA ? 'Java' : 'JavaScript / JSON'} 不支持转义序列 “\\${marker}”`,
    };
  }

  return { text: output, error: null };
}

/**
 * 去掉字面量最外层成对引号（若存在）
 *
 * @param text - 原始输入
 * @returns 引号内文本；无成对引号时返回去空白后的原文
 */
export function stripQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if (
      first !== undefined &&
      (first === '"' || first === "'" || first === '`') &&
      first === last
    ) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}
