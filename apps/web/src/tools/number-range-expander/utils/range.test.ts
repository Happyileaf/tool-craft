import { describe, it, expect } from 'vitest';
import { expandRanges, collapseRanges, MAX_EXPANDED_VALUES } from './range';

function bi(text: string): bigint {
  return BigInt(text);
}

function valuesOf(text: string): bigint[] {
  const result = expandRanges(text);
  expect(result.error).toBeNull();
  return result.values;
}

describe('expandRanges', () => {
  it('expands the contract vector 1-5, 10, 12-14', () => {
    expect(valuesOf('1-5, 10, 12-14').map((v) => v.toString())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '10',
      '12',
      '13',
      '14',
    ]);
  });

  it('tolerates whitespace, commas and newlines as separators', () => {
    expect(valuesOf(' 1-3\n4\t5,  6 ').map((v) => v.toString())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
  });

  it('expands a stepped range 0-10:2 into even numbers', () => {
    expect(expandRanges('0-10:2').text).toBe('0,2,4,6,8,10');
    // 终点不必恰好落在步点上：1-10:3 截止到 ≤10
    expect(expandRanges('1-10:3').text).toBe('1,4,7,10');
  });

  it('keeps singleton values as-is', () => {
    expect(expandRanges('42').text).toBe('42');
    expect(expandRanges('42, 42').text).toBe('42,42');
  });

  it('supports negative numbers and negative endpoints', () => {
    expect(expandRanges('-3-2').text).toBe('-3,-2,-1,0,1,2');
    expect(expandRanges('-5--1').text).toBe('-5,-4,-3,-2,-1');
    expect(expandRanges('-3, 0, 3').text).toBe('-3,0,3');
  });

  it('supports BigInt values far beyond the safe-integer range', () => {
    const big = bi('9007199254740993'); // 2^53 + 1
    const result = expandRanges('9007199254740993-9007199254740995');
    expect(result.values).toEqual([big, big + bi('1'), big + bi('2')]);
  });

  it('rejects reversed ranges and non-positive steps', () => {
    expect(expandRanges('5-1').error).toMatch(/倒置区间/);
    expect(expandRanges('1-5:0').error).toMatch(/步长必须为正整数/);
    expect(expandRanges('1-5:-2').error).toMatch(/步长必须为正整数/);
  });

  it('rejects malformed tokens and empty input without throwing', () => {
    expect(expandRanges('1-abc').error).toMatch(/端点必须是整数/);
    expect(expandRanges('abc').error).toMatch(/无法识别/);
    expect(expandRanges('1-5:2:1').error).toMatch(/步长只能出现一次/);
    expect(expandRanges('1..5').error).toMatch(/无法识别/);
    expect(expandRanges('  \n ').error).toMatch(/至少输入/);
  });

  it('enforces the output safety cap', () => {
    expect(expandRanges(`0-${MAX_EXPANDED_VALUES + 10}`).error).toMatch(/安全上限/);
  });
});

describe('collapseRanges', () => {
  it('collapses the contract vector with sort and de-dup', () => {
    // 5,3,1,2,4,4,6,8 → 排序去重 1,2,3,4,5,6,8 → 1-6,8
    expect(collapseRanges('5,3,1,2,4,4,6,8').text).toBe('1-6,8');
  });

  it('keeps two consecutive values separate and merges runs of three', () => {
    expect(collapseRanges('1,2,4,5,6').text).toBe('1,2,4-6');
  });

  it('deduplicates repeated values', () => {
    expect(collapseRanges('3,3,3,3').text).toBe('3');
  });

  it('supports negative numbers and BigInt values', () => {
    expect(collapseRanges('-3 -2 -1 0').text).toBe('-3-0');
    const big = bi('9007199254740993');
    const result = collapseRanges(
      [big.toString(), (big + bi('1')).toString(), (big + bi('2')).toString()].join(','),
    );
    expect(result.text).toBe('9007199254740993-9007199254740995');
  });

  it('rejects non-integer tokens and empty input', () => {
    expect(collapseRanges('1, a, 3').error).toMatch(/不是合法整数/);
    expect(collapseRanges('1-5').error).toMatch(/不是合法整数/);
    expect(collapseRanges('\n  ').error).toMatch(/至少输入/);
  });
});

describe('expand ↔ collapse round trip', () => {
  it('expanding then collapsing reproduces the canonical compact form', () => {
    for (const expression of [
      '1-5, 10, 12-14',
      '-5--1, 3, 4, 5, 100-102',
      '0-20:4, 99, 100, 101',
      '9007199254740993-9007199254741000',
    ]) {
      const expanded = expandRanges(expression);
      expect(expanded.error).toBeNull();
      const collapsed = collapseRanges(expanded.text);
      // 再展开压缩结果，元素集合（排序去重后）应与首次展开一致
      const reExpanded = expandRanges(collapsed.text);
      const first = Array.from(new Set(expanded.values.map((v) => v.toString()))).sort();
      const second = Array.from(new Set(reExpanded.values.map((v) => v.toString()))).sort();
      expect(second).toEqual(first);
    }
  });
});
