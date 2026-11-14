import { describe, it, expect } from 'vitest';
import { addLineNumbers, stripLineNumbers } from './lineNumber';

const base = {
  separator: ':',
  padWidth: 0,
  numberBlankLines: true,
  spaceAfterSeparator: true,
};

describe('addLineNumbers', () => {
  it('numbers lines starting at 1 with step 1', () => {
    const r = addLineNumbers('a\nb', { ...base, start: 1, step: 1 });
    expect(r.error).toBeNull();
    expect(r.output).toBe('1: a\n2: b');
  });

  it('supports custom separator without trailing space', () => {
    const r = addLineNumbers('a\nb', {
      ...base,
      start: 1,
      step: 1,
      separator: '.',
      spaceAfterSeparator: false,
    });
    expect(r.output).toBe('1.a\n2.b');
  });

  it('zero-pads to the requested width', () => {
    const r = addLineNumbers('a\nb\nc', { ...base, start: 1, step: 1, padWidth: 2 });
    expect(r.output).toBe('01: a\n02: b\n03: c');
    expect(r.effectivePadWidth).toBe(2);
  });

  it('honors custom start and step', () => {
    const r = addLineNumbers('a\nb\nc', { ...base, start: 10, step: 5, padWidth: 0 });
    expect(r.output).toBe('10: a\n15: b\n20: c');
  });

  it('auto widens pad when numbers exceed the requested width', () => {
    const r = addLineNumbers('a\nb', { ...base, start: 100, step: 1, padWidth: 1 });
    expect(r.effectivePadWidth).toBe(3);
    expect(r.output).toBe('100: a\n101: b');
  });

  it('skips blank lines when numberBlankLines is false', () => {
    const r = addLineNumbers('a\n\nb', {
      ...base,
      start: 1,
      step: 1,
      numberBlankLines: false,
    });
    expect(r.output).toBe('1: a\n\n2: b');
  });

  it('numbers blank lines when enabled', () => {
    const r = addLineNumbers('a\n\nb', {
      ...base,
      start: 1,
      step: 1,
      numberBlankLines: true,
    });
    expect(r.output).toBe('1: a\n2: \n3: b');
  });

  it('rejects invalid start, step and padWidth', () => {
    expect(addLineNumbers('a', { ...base, start: 1.5, step: 1 }).error).toMatch(/整数/);
    expect(addLineNumbers('a', { ...base, start: 1, step: 0 }).error).toMatch(/步长不能为 0/);
    expect(addLineNumbers('a', { ...base, start: 1, step: 1, padWidth: -1 }).error).toMatch(
      /填充宽度/,
    );
    expect(
      addLineNumbers('a', { ...base, start: 1, step: 1, separator: '' }).error,
    ).toMatch(/分隔符/);
  });

  it('supports negative descending numbering', () => {
    const r = addLineNumbers('a\nb\nc', { ...base, start: 3, step: -1, padWidth: 1 });
    expect(r.output).toBe('3: a\n2: b\n1: c');
  });
});

describe('stripLineNumbers', () => {
  it('removes colon-style prefixes', () => {
    expect(stripLineNumbers('1: a\n2: b')).toBe('a\nb');
  });

  it('removes zero-padded pipe-style prefixes', () => {
    expect(stripLineNumbers('01 | a\n02 | b')).toBe('a\nb');
  });

  it('removes dot and paren prefixes', () => {
    expect(stripLineNumbers('1.a\n2)b')).toBe('a\nb');
  });

  it('keeps lines without a line-number prefix verbatim', () => {
    expect(stripLineNumbers('1: a\nplain line')).toBe('a\nplain line');
  });

  it('only strips one prefix and respects custom separators', () => {
    expect(stripLineNumbers('5 -> x', ['->'])).toBe('x');
    // 默认分隔符集合不包含 ->，因此原样保留
    expect(stripLineNumbers('5 -> x')).toBe('5 -> x');
  });

  it('round-trips add then strip', () => {
    const original = 'alpha\nbeta\ngamma';
    const added = addLineNumbers(original, { ...base, start: 1, step: 1, padWidth: 3 }).output;
    expect(stripLineNumbers(added)).toBe(original);
  });
});
