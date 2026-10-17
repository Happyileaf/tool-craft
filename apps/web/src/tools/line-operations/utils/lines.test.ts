import { describe, it, expect } from 'vitest';
import {
  FilterActionEnum,
  FilterModeEnum,
  SortModeEnum,
  SortOrderEnum,
  applyLineOperations,
  dedupeLines,
  detectNewline,
  filterLines,
  naturalCompare,
  sortLines,
  splitLines,
  type LineOperationOptions,
} from './lines';

/** 构造一份默认选项，便于在单测中按需覆写 */
function createOptions(
  overrides: Partial<LineOperationOptions> = {},
): LineOperationOptions {
  return {
    sortMode: SortModeEnum.NONE,
    order: SortOrderEnum.ASC,
    dedupe: false,
    caseSensitive: true,
    reverse: false,
    trimLines: false,
    removeEmpty: false,
    filterMode: FilterModeEnum.NONE,
    filterKeyword: '',
    filterAction: FilterActionEnum.KEEP,
    ...overrides,
  };
}

describe('splitLines / detectNewline', () => {
  it('按 LF 拆分并忽略末尾换行产生的空行', () => {
    expect(splitLines('a\nb\nc\n')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\nb')).toEqual(['a', 'b']);
  });

  it('兼容 CRLF 与 CR 换行', () => {
    expect(splitLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\rb')).toEqual(['a', 'b']);
  });

  it('空文本返回空数组', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('识别主导换行符', () => {
    expect(detectNewline('a\r\nb\r\nc')).toBe('\r\n');
    expect(detectNewline('a\nb\nc')).toBe('\n');
  });
});

describe('naturalCompare', () => {
  it('数字片段按数值比较而非字典序', () => {
    expect(naturalCompare('item2', 'item10', true)).toBeLessThan(0);
    expect(naturalCompare('v1.9', 'v1.10', true)).toBeLessThan(0);
  });

  it('非数字片段按字典序比较', () => {
    expect(naturalCompare('apple', 'banana', true)).toBeLessThan(0);
  });

  it('忽略大小写时 A 与 a 相等', () => {
    expect(naturalCompare('Alpha', 'alpha', false)).toBe(0);
    expect(naturalCompare('Alpha', 'alpha', true)).not.toBe(0);
  });
});

describe('sortLines', () => {
  it('字典序升序与降序', () => {
    const input = ['banana', 'apple', 'cherry'];
    expect(
      sortLines(input, SortModeEnum.LEXICAL, SortOrderEnum.ASC, true),
    ).toEqual(['apple', 'banana', 'cherry']);
    expect(
      sortLines(input, SortModeEnum.LEXICAL, SortOrderEnum.DESC, true),
    ).toEqual(['cherry', 'banana', 'apple']);
  });

  it('自然排序让 item2 排在 item10 之前', () => {
    const input = ['item10', 'item2', 'item1'];
    expect(
      sortLines(input, SortModeEnum.NATURAL, SortOrderEnum.ASC, true),
    ).toEqual(['item1', 'item2', 'item10']);
  });

  it('按行长与按数值排序', () => {
    expect(
      sortLines(
        ['ccc', 'a', 'bb'],
        SortModeEnum.LENGTH,
        SortOrderEnum.ASC,
        true,
      ),
    ).toEqual(['a', 'bb', 'ccc']);
    expect(
      sortLines(
        ['10', '2', '30'],
        SortModeEnum.NUMERIC,
        SortOrderEnum.ASC,
        true,
      ),
    ).toEqual(['2', '10', '30']);
  });

  it('不排序时保持原顺序', () => {
    expect(
      sortLines(['b', 'a'], SortModeEnum.NONE, SortOrderEnum.ASC, true),
    ).toEqual(['b', 'a']);
  });

  it('排序稳定，相等元素保持原有相对顺序', () => {
    const input = ['b2', 'a1', 'b1', 'a2'];
    expect(
      sortLines(input, SortModeEnum.LENGTH, SortOrderEnum.ASC, true),
    ).toEqual(['b2', 'a1', 'b1', 'a2']);
  });
});

describe('dedupeLines', () => {
  it('保留首次出现的行', () => {
    expect(dedupeLines(['a', 'b', 'a', 'c', 'b'], true)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('区分大小写开关生效', () => {
    expect(dedupeLines(['A', 'a'], true)).toEqual(['A', 'a']);
    expect(dedupeLines(['A', 'a'], false)).toEqual(['A']);
  });
});

describe('filterLines', () => {
  it('按关键字保留与剔除命中的行', () => {
    const lines = ['error: disk', 'info: ok', 'error: net'];
    expect(
      filterLines(lines, FilterModeEnum.CONTAINS, 'error', FilterActionEnum.KEEP, true)
        .lines,
    ).toEqual(['error: disk', 'error: net']);
    expect(
      filterLines(
        lines,
        FilterModeEnum.CONTAINS,
        'error',
        FilterActionEnum.REMOVE,
        true,
      ).lines,
    ).toEqual(['info: ok']);
  });

  it('按正则过滤并支持忽略大小写', () => {
    const lines = ['GET /a', 'POST /b', 'get /c'];
    expect(
      filterLines(lines, FilterModeEnum.REGEX, '^get', FilterActionEnum.KEEP, false)
        .lines,
    ).toEqual(['GET /a', 'get /c']);
  });

  it('正则非法时返回错误而不抛异常', () => {
    const result = filterLines(
      ['a'],
      FilterModeEnum.REGEX,
      '([',
      FilterActionEnum.KEEP,
      true,
    );
    expect(result.error).toContain('正则表达式无效');
  });

  it('关键字为空时不过滤', () => {
    expect(
      filterLines(['a'], FilterModeEnum.CONTAINS, '', FilterActionEnum.KEEP, true)
        .lines,
    ).toEqual(['a']);
  });
});

describe('applyLineOperations', () => {
  it('叠加去空白、去空行、去重与排序', () => {
    const result = applyLineOperations('  b \n\n a\n  b\n', createOptions({
      trimLines: true,
      removeEmpty: true,
      dedupe: true,
      sortMode: SortModeEnum.LEXICAL,
      order: SortOrderEnum.ASC,
    }));
    expect(result.error).toBeNull();
    expect(result.output).toBe('a\nb');
    expect(result.inputCount).toBe(4);
    expect(result.outputCount).toBe(2);
  });

  it('反转行序', () => {
    const result = applyLineOperations('a\nb\nc', createOptions({ reverse: true }));
    expect(result.output).toBe('c\nb\na');
  });

  it('保留 CRLF 行尾风格', () => {
    const result = applyLineOperations('b\r\na\r', createOptions({
      sortMode: SortModeEnum.LEXICAL,
    }));
    expect(result.output).toBe('a\r\nb');
  });

  it('过滤正则非法时返回错误', () => {
    const result = applyLineOperations('a', createOptions({
      filterMode: FilterModeEnum.REGEX,
      filterKeyword: '([',
    }));
    expect(result.error).toContain('正则表达式无效');
    expect(result.output).toBe('');
  });

  it('空输入输出为空', () => {
    const result = applyLineOperations('', createOptions({
      dedupe: true,
      sortMode: SortModeEnum.LEXICAL,
    }));
    expect(result.output).toBe('');
    expect(result.inputCount).toBe(0);
    expect(result.outputCount).toBe(0);
  });
});
