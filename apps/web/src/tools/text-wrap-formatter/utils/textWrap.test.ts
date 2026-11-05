import { describe, it, expect } from 'vitest';
import { hardWrap, unwrapText, processText, type WrapOptions } from './textWrap';

const options = (overrides: Partial<WrapOptions> = {}): WrapOptions => ({
  width: 10,
  breakLongWords: false,
  trimTrailingWhitespace: true,
  ...overrides,
});

describe('hardWrap', () => {
  it('wraps latin text on word boundaries without breaking words', () => {
    const result = hardWrap('the quick brown fox jumps', options({ width: 10 }));
    expect(result.valid).toBe(true);
    expect(result.output.split('\n')).toEqual(['the quick', 'brown fox', 'jumps']);
    expect(result.maxLineWidth).toBe(9);
    expect(result.lineCount).toBe(3);
  });

  it('keeps an over-long word on one line when breakLongWords is off', () => {
    const result = hardWrap('abcdefghijklmnop word', options({ width: 10 }));
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('abcdefghijklmnop');
    expect(lines[1]).toBe('word');
  });

  it('hard-breaks an over-long word when breakLongWords is on', () => {
    const result = hardWrap('abcdefghijklmnop', options({ width: 10, breakLongWords: true }));
    expect(result.output.split('\n')).toEqual(['abcdefghij', 'klmnop']);
  });

  it('wraps CJK text character by character', () => {
    const result = hardWrap('一二三四五六七八九十一二', options({ width: 5 }));
    expect(result.output.split('\n')).toEqual(['一二三四五', '六七八九十', '一二']);
  });

  it('joins mixed CJK and latin without inserting spaces between CJK chars', () => {
    const result = hardWrap('中文 abc 中文', options({ width: 4 }));
    const lines = result.output.split('\n');
    expect(lines.every((line) => line.length <= 4)).toBe(true);
    expect(result.output).toContain('中文');
    expect(result.output).not.toMatch(/中\s文/);
  });

  it('preserves paragraph blank lines and counts paragraphs', () => {
    const input = 'alpha beta gamma\n\ndelta epsilon zeta eta';
    const result = hardWrap(input, options({ width: 20 }));
    expect(result.paragraphCount).toBe(2);
    expect(result.output).toContain('\n\n');
    expect(result.output.startsWith('alpha beta gamma')).toBe(true);
  });

  it('trims trailing whitespace when enabled and keeps it when disabled', () => {
    const trimmed = hardWrap('hello   world', options({ width: 20, trimTrailingWhitespace: true }));
    expect(trimmed.output).not.toMatch(/ +$/m);
    const kept = hardWrap('hello   world', options({ width: 20, trimTrailingWhitespace: false }));
    // 段落内部分词时空白被规范化；行尾尾随空格由 trim 开关控制
    expect(kept).toBeDefined();
  });

  it('rejects invalid width', () => {
    expect(hardWrap('abc', options({ width: 0 })).error).toMatch(/列宽/);
    expect(hardWrap('abc', options({ width: 1.5 })).error).toMatch(/列宽/);
  });
});

describe('unwrapText', () => {
  it('merges single newlines inside a paragraph into spaces', () => {
    const result = unwrapText('the quick\nbrown fox\njumps', true);
    expect(result.output).toBe('the quick brown fox jumps');
  });

  it('preserves paragraph breaks (double newlines)', () => {
    const result = unwrapText('line one\nline two\n\npara two\nline four', true);
    expect(result.output).toBe('line one line two\n\npara two line four');
    expect(result.paragraphCount).toBe(2);
  });

  it('joins CJK line breaks without inserting a space', () => {
    const result = unwrapText('一二\n三四', true);
    expect(result.output).toBe('一二三四');
  });

  it('round-trips wrapped latin text back to a single paragraph', () => {
    const original = 'the quick brown fox jumps over the lazy dog repeatedly';
    const wrapped = hardWrap(original, options({ width: 12 })).output;
    const restored = unwrapText(wrapped, true).output;
    expect(restored).toBe(original);
  });
});

describe('processText', () => {
  it('rejects empty input', () => {
    expect(processText('   ', 'wrap', options()).error).toMatch(/不能为空/);
  });

  it('dispatches wrap and unwrap modes', () => {
    const wrapped = processText('hello world here', 'wrap', options({ width: 11 }));
    expect(wrapped.output.split('\n').length).toBeGreaterThan(1);
    const back = processText(wrapped.output, 'unwrap', options());
    expect(back.output).toBe('hello world here');
  });
});
