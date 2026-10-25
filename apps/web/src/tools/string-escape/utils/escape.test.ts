import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_JAVA,
  LANGUAGE_JS,
  LANGUAGE_PYTHON,
  escapeString,
  stripQuotes,
  unescapeString,
} from './escape';

describe('escapeString', () => {
  it('转义引号、反斜杠与常见控制字符', () => {
    expect(escapeString('say "hi"\nline2\t\\end')).toBe(
      'say \\"hi\\"\\nline2\\t\\\\end',
    );
  });

  it('多行文本变为单行字面量内容', () => {
    const input = 'first\r\nsecond\n\nthird';
    expect(escapeString(input)).toBe('first\\r\\nsecond\\n\\nthird');
    expect(escapeString(input).includes('\n')).toBe(false);
  });

  it('回车、退格、换页使用标准短转义', () => {
    expect(escapeString('\b\f\r\t')).toBe('\\b\\f\\r\\t');
  });

  it('非 ASCII 字符在 JS / Java 下输出 \\uXXXX（含代理对）', () => {
    expect(escapeString('中A')).toBe('\\u4e2dA');
    expect(escapeString('😀')).toBe('\\ud83d\\ude00');
  });

  it('Python 下 C0 控制字符使用 \\xHH，非 ASCII 使用 \\uXXXX', () => {
    expect(escapeString('\x1f\x00ok', LANGUAGE_PYTHON)).toBe('\\x1f\\x00ok');
    expect(escapeString('中', LANGUAGE_PYTHON)).toBe('\\u4e2d');
    expect(escapeString('😀', LANGUAGE_PYTHON)).toBe('\\ud83d\\ude00');
  });

  it('JS / Java 下 NUL 使用 \\u0000', () => {
    expect(escapeString('\x00', LANGUAGE_JS)).toBe('\\u0000');
    expect(escapeString('\x00', LANGUAGE_JAVA)).toBe('\\u0000');
  });

  it('DEL 控制字符同样被转义', () => {
    expect(escapeString('\x7f')).toBe('\\u007f');
  });

  it('可打印 ASCII 原样保留', () => {
    const ascii = 'abcXYZ0127 !#$%&*+-/:;<=>?@[]^_{|}~';
    expect(escapeString(ascii)).toBe(ascii);
  });

  it('空字符串返回空字符串', () => {
    expect(escapeString('')).toBe('');
  });
});

describe('unescapeString', () => {
  it('还原常见短转义', () => {
    const result = unescapeString('say \\"hi\\"\\nline2\\t\\\\end');
    expect(result.error).toBeNull();
    expect(result.text).toBe('say "hi"\nline2\t\\end');
  });

  it('还原 \\uXXXX 与代理对', () => {
    expect(unescapeString('\\u4e2dA').text).toBe('中A');
    expect(unescapeString('\\ud83d\\ude00').text).toBe('😀');
    expect(unescapeString('\\u00e9').text).toBe('é');
  });

  it('JS 支持 \\u{码点} 与 \\/、\\v、\\`', () => {
    expect(unescapeString('\\u{1f600}', LANGUAGE_JS).text).toBe('😀');
    expect(unescapeString('a\\/b', LANGUAGE_JS).text).toBe('a/b');
    expect(unescapeString('a\\vb', LANGUAGE_JS).text).toBe('a\vb');
    expect(unescapeString('\\`', LANGUAGE_JS).text).toBe('`');
  });

  it('Python 支持 \\xHH、\\Uxxxxxxxx、\\a、\\v、\\0 与行连接反斜杠', () => {
    expect(unescapeString('\\x41\\x00', LANGUAGE_PYTHON).text).toBe('A\x00');
    expect(unescapeString('\\U0001F600', LANGUAGE_PYTHON).text).toBe('😀');
    expect(unescapeString('\\a', LANGUAGE_PYTHON).text).toBe('\x07');
    expect(unescapeString('a\\0b', LANGUAGE_PYTHON).text).toBe('a\0b');
    expect(unescapeString('a\\\nb', LANGUAGE_PYTHON).text).toBe('ab');
    expect(unescapeString('a\\\r\nb', LANGUAGE_PYTHON).text).toBe('ab');
  });

  it('Java 支持 \\uXXXX 与通用短转义但不支持 \\x 与 \\u{}', () => {
    expect(unescapeString('a\\tb\\u0041', LANGUAGE_JAVA).text).toBe('a\tbA');
    expect(unescapeString('\\x41', LANGUAGE_JAVA).error).toContain('Python');
    expect(unescapeString('\\u{41}', LANGUAGE_JAVA).error).toContain('四位十六进制');
  });

  it('JS / Java 遇到 \\v 之外的语言专有序列时报错', () => {
    expect(unescapeString('\\a', LANGUAGE_JS).error).toContain('不支持');
    expect(unescapeString('\\U0001F600', LANGUAGE_JAVA).error).toContain('不支持');
    expect(unescapeString('\\v', LANGUAGE_JAVA).error).toContain('不支持');
  });

  it('Python 不支持 \\/ 与 \\` 序列', () => {
    expect(unescapeString('a\\/b', LANGUAGE_PYTHON).error).toContain('不支持');
    expect(unescapeString('\\`', LANGUAGE_PYTHON).error).toContain('不支持');
  });

  it('孤立反斜杠报错', () => {
    expect(unescapeString('abc\\').error).toContain('孤立的反斜杠');
  });

  it('\\u 数字不足四位报错', () => {
    expect(unescapeString('\\u004').error).toContain('四位十六进制');
    expect(unescapeString('\\u00zz').error).toContain('四位十六进制');
  });

  it('\\u{} 缺少闭合或码点非法时报错', () => {
    expect(unescapeString('\\u{41', LANGUAGE_JS).error).toContain('闭合');
    expect(unescapeString('\\u{110000}', LANGUAGE_JS).error).toContain('Unicode 码点');
  });

  it('Python \\x 数字不足或 \\U 码点非法时报错', () => {
    expect(unescapeString('\\x4', LANGUAGE_PYTHON).error).toContain('两位十六进制');
    expect(unescapeString('\\U00110000', LANGUAGE_PYTHON).error).toContain('八位');
  });

  it('孤立高代理替换为 U+FFFD 而不抛错', () => {
    const result = unescapeString('\\ud800x');
    expect(result.error).toBeNull();
    expect(result.text).toBe('\ufffdx');
    expect(unescapeString('\\udfff').text).toBe('\ufffd');
  });

  it('无反斜杠的普通文本原样返回', () => {
    expect(unescapeString('plain text 123').text).toBe('plain text 123');
  });

  it('空字符串返回空文本', () => {
    expect(unescapeString('')).toEqual({ text: '', error: null });
  });
});

describe('escapeString / unescapeString 往返', () => {
  it.each([LANGUAGE_JS, LANGUAGE_JAVA])(
    '%s 风格往返保持等价',
    (language) => {
      const original = '多行\n文本\t"引号" 与 \\反斜杠\\，中文与 emoji 😀，NUL\x00结尾';
      const escaped = escapeString(original, language);
      const result = unescapeString(escaped, language);
      expect(result.error).toBeNull();
      expect(result.text).toBe(original);
    },
  );

  it('Python 风格往返保持等价', () => {
    const original = 'line1\nline2\t"q"\\s\n中\x01\x7f😀';
    const result = unescapeString(escapeString(original, LANGUAGE_PYTHON), LANGUAGE_PYTHON);
    expect(result.error).toBeNull();
    expect(result.text).toBe(original);
  });
});

describe('stripQuotes', () => {
  it('去掉成对双引号、单引号或反引号', () => {
    expect(stripQuotes('"abc"')).toBe('abc');
    expect(stripQuotes("'abc'")).toBe('abc');
    expect(stripQuotes('`abc`')).toBe('abc');
  });

  it('去掉首尾空白并处理引号', () => {
    expect(stripQuotes('  "a b"  ')).toBe('a b');
  });

  it('引号不成对时返回去空白原文', () => {
    expect(stripQuotes('"abc')).toBe('"abc');
    expect(stripQuotes("a'b")).toBe("a'b");
  });

  it('单字符或空字符串安全返回', () => {
    expect(stripQuotes('"')).toBe('"');
    expect(stripQuotes('')).toBe('');
  });
});
