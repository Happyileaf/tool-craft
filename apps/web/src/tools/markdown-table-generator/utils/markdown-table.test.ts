import { describe, expect, it } from 'vitest';
import {
  buildMarkdownTable,
  columnLetter,
  detectDelimiter,
  generateTable,
  normalizeCell,
  parseDelimited,
  parseDelimitedLine,
  type TableOptions,
} from './markdown-table';

const DEFAULT_OPTIONS: TableOptions = {
  hasHeader: true,
  align: [],
  padded: true,
  escapePipes: true,
  delimiter: 'auto',
};

describe('detectDelimiter', () => {
  it('含制表符按 TSV，否则按 CSV', () => {
    expect(detectDelimiter('a\tb')).toBe('\t');
    expect(detectDelimiter('a,b')).toBe(',');
  });
});

describe('parseDelimitedLine', () => {
  it('解析逗号分隔', () => {
    expect(parseDelimitedLine('a,b,c', ',')).toEqual(['a', 'b', 'c']);
  });

  it('支持引号与双引号转义，引号内分隔符不拆列', () => {
    expect(parseDelimitedLine('"hello, world","say ""hi"""', ',')).toEqual([
      'hello, world',
      'say "hi"',
    ]);
  });

  it('多字符分隔符（TSV 制表符）正常工作', () => {
    expect(parseDelimitedLine('x\ty', '\t')).toEqual(['x', 'y']);
  });
});

describe('parseDelimited', () => {
  it('跳过空行并处理 CRLF', () => {
    expect(parseDelimited('a,b\r\n\r\n1,2\n', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('支持引号内换行', () => {
    expect(parseDelimited('"line1\nline2",b', ',')).toEqual([['line1\nline2', 'b']]);
  });
});

describe('columnLetter', () => {
  it('A…Z 与 AA 进位', () => {
    expect(columnLetter(0)).toBe('A');
    expect(columnLetter(25)).toBe('Z');
    expect(columnLetter(26)).toBe('AA');
    expect(columnLetter(27)).toBe('AB');
  });
});

describe('normalizeCell', () => {
  it('换行转 <br>，竖线按需转义，首尾空白去除', () => {
    expect(normalizeCell(' a|b\nc ', true)).toBe('a\\|b<br>c');
    expect(normalizeCell('a|b', false)).toBe('a|b');
    expect(normalizeCell(undefined, true)).toBe('');
  });
});

describe('buildMarkdownTable', () => {
  it('基础左对齐并按列宽补齐', () => {
    const result = buildMarkdownTable(
      [
        ['Name', 'Age'],
        ['Ada', '36'],
      ],
      DEFAULT_OPTIONS,
    );
    const lines = result.markdown.split('\n');
    expect(lines[0]).toBe('| Name | Age |');
    expect(lines[1]).toBe('| :--- | :-- |');
    expect(lines[2]).toBe('| Ada  | 36  |');
    expect(result.columnCount).toBe(2);
    expect(result.dataRowCount).toBe(1);
    expect(result.paddedRows).toEqual([]);
  });

  it('居中 / 右对齐分隔行', () => {
    const result = buildMarkdownTable(
      [
        ['L', 'C', 'R'],
        ['a', 'b', 'c'],
      ],
      { ...DEFAULT_OPTIONS, align: ['left', 'center', 'right'], padded: false },
    );
    const lines = result.markdown.split('\n');
    expect(lines[1]).toBe('|:--|:-:|--:|');
  });

  it('无表头时使用 A/B/C 列名', () => {
    const result = buildMarkdownTable([['1', '2', '3']], {
      ...DEFAULT_OPTIONS,
      hasHeader: false,
      padded: false,
    });
    expect(result.markdown.split('\n')[0]).toBe('| A | B | C |');
    expect(result.dataRowCount).toBe(1);
  });

  it('不齐行自动补空列并记录行号', () => {
    const result = buildMarkdownTable(
      [
        ['A', 'B', 'C'],
        ['1', '2'],
      ],
      { ...DEFAULT_OPTIONS, padded: false },
    );
    expect(result.paddedRows).toEqual([2]);
    expect(result.markdown.split('\n')[2]).toBe('| 1 | 2 |  |');
  });

  it('空输入抛中文错误', () => {
    expect(() => buildMarkdownTable([], DEFAULT_OPTIONS)).toThrow('输入内容为空');
    expect(() => buildMarkdownTable([['  ']], DEFAULT_OPTIONS)).toThrow('输入内容为空');
  });

  it('紧凑模式不补空格', () => {
    const result = buildMarkdownTable(
      [
        ['Name', 'Score'],
        ['Li', '9'],
      ],
      { ...DEFAULT_OPTIONS, padded: false },
    );
    const lines = result.markdown.split('\n');
    expect(lines[0]).toBe('| Name | Score |');
    expect(lines[1]).toBe('|:--|:--|');
    expect(lines[2]).toBe('| Li | 9 |');
  });
});

describe('generateTable', () => {
  it('TSV 粘贴（Excel 列）自动识别制表符', () => {
    const result = generateTable('Name\tAge\nAda\t36', {
      ...DEFAULT_OPTIONS,
      padded: false,
    });
    expect(result.markdown.split('\n')[0]).toBe('| Name | Age |');
    expect(result.markdown.split('\n')[2]).toBe('| Ada | 36 |');
  });

  it('CSV 含引号逗号正确生成', () => {
    const result = generateTable('city,note\nShanghai,"hello, world"', {
      ...DEFAULT_OPTIONS,
      padded: false,
    });
    expect(result.markdown.split('\n')[2]).toBe('| Shanghai | hello, world |');
  });
});
