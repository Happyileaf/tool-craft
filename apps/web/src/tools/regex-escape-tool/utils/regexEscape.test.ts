import { describe, expect, it } from 'vitest';
import {
  buildRegexLiteral,
  buildRegExpConstructor,
  escapeRegex,
  unescapeRegex,
} from './regexEscape';

describe('escapeRegex', () => {
  it('escapes ECMA-262 syntax characters and slash', () => {
    expect(escapeRegex('.')).toBe('\\.');
    expect(escapeRegex('*')).toBe('\\*');
    expect(escapeRegex('+')).toBe('\\+');
    expect(escapeRegex('?')).toBe('\\?');
    expect(escapeRegex('^')).toBe('\\^');
    expect(escapeRegex('$')).toBe('\\$');
    expect(escapeRegex('(')).toBe('\\(');
    expect(escapeRegex(')')).toBe('\\)');
    expect(escapeRegex('[')).toBe('\\[');
    expect(escapeRegex(']')).toBe('\\]');
    expect(escapeRegex('{')).toBe('\\{');
    expect(escapeRegex('}')).toBe('\\}');
    expect(escapeRegex('|')).toBe('\\|');
    expect(escapeRegex('/')).toBe('\\/');
    expect(escapeRegex('\\')).toBe('\\\\');
    expect(escapeRegex('-')).toBe('\\-');
  });

  it('escapes a realistic mixed string', () => {
    expect(escapeRegex('a.b*c?d/e')).toBe('a\\.b\\*c\\?d\\/e');
    expect(escapeRegex('price: $5.00 (USD)')).toBe(
      'price: \\$5\\.00 \\(USD\\)',
    );
  });

  it('escapes line terminators', () => {
    expect(escapeRegex('a\nb')).toBe('a\\nb');
    expect(escapeRegex('a\rb')).toBe('a\\rb');
    expect(escapeRegex('a b')).toBe('a\\u2028b');
    expect(escapeRegex('a b')).toBe('a\\u2029b');
  });

  it('leaves ordinary characters untouched and handles empty input', () => {
    expect(escapeRegex('hello 世界 123')).toBe('hello 世界 123');
    expect(escapeRegex('')).toBe('');
  });

  it('produces a pattern that matches the literal text via real RegExp', () => {
    const raw = 'C:\\tools\\v2\\file.txt (v1.0)?';
    const pattern = new RegExp(escapeRegex(raw));
    expect(pattern.test(raw)).toBe(true);
    expect(pattern.test('C:/tools/v2/file.txt (v1.0)?')).toBe(false);
  });
});

describe('unescapeRegex', () => {
  it('restores escaped metacharacters', () => {
    expect(unescapeRegex('a\\.b\\*c')).toBe('a.b*c');
    expect(unescapeRegex('\\/\\(\\)\\[\\]')).toBe('/()[]');
  });

  it('restores control sequences', () => {
    expect(unescapeRegex('a\\nb\\tc')).toBe('a\nb\tc');
    expect(unescapeRegex('\\r\\b\\f\\v\\0')).toBe('\r\b\f\v\0');
  });

  it('restores unicode and hex escapes', () => {
    expect(unescapeRegex('\\u0041\\u0042')).toBe('AB');
    expect(unescapeRegex('\\x41')).toBe('A');
  });

  it('handles a trailing lone backslash without throwing', () => {
    expect(unescapeRegex('abc\\')).toBe('abc\\');
  });

  it('round-trips escaped text back to the original', () => {
    const samples = [
      'simple',
      'a.b*c?d+e^f$g(h)i[j]k{l}m|n',
      'C:\\path\\to\\file.txt',
      'price: $5.00 (USD) / eur',
      'line1\nline2\rtab\tend',
    ];
    for (const sample of samples) {
      expect(unescapeRegex(escapeRegex(sample))).toBe(sample);
    }
  });
});

describe('buildRegExpConstructor', () => {
  it('builds a constructor call with double-escaped backslashes', () => {
    // 原始文本 a.b\c 转义后为正则片段 a\.b\\c；放进字符串字面量需再翻倍反斜杠
    const escaped = escapeRegex('a.b\\c');
    expect(escaped).toBe('a\\.b\\\\c');
    expect(buildRegExpConstructor(escaped)).toBe('new RegExp("a\\\\.b\\\\\\\\c")');
  });

  it('appends flags when provided and escapes embedded quotes', () => {
    // 输入片段含字面量双引号 \"hi\"，构造字符串需转义引号
    expect(buildRegExpConstructor('say \\"hi\\"', { flags: 'gi' })).toBe(
      'new RegExp("say \\\\\\"hi\\\\\\"", "gi")',
    );
  });

  it('the generated constructor source evaluates to a working RegExp', () => {
    const raw = '2026-11-14 10:00 (on-time)?';
    const source = buildRegExpConstructor(escapeRegex(raw), { flags: 'i' });
    const re = eval(source) as RegExp;
    expect(re).toBeInstanceOf(RegExp);
    expect(re.flags).toBe('i');
    expect(re.test(raw)).toBe(true);
  });
});

describe('buildRegexLiteral', () => {
  it('wraps the escaped pattern in slashes', () => {
    expect(buildRegexLiteral('a\\.b')).toBe('/a\\.b/');
    expect(buildRegexLiteral('a\\/b', { flags: 'g' })).toBe('/a\\/b/g');
  });

  it('the generated literal is valid when evaluated', () => {
    const raw = 'foo.bar/baz';
    const literal = buildRegexLiteral(escapeRegex(raw), { flags: 'g' });
    const re = eval(literal) as RegExp;
    expect(re.test(raw)).toBe(true);
  });
});
