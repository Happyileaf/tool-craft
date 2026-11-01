import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  stringifyCsv,
  csvToFwf,
  fwfToCsv,
  type FwfColumn,
} from './fwfCsv';

const COLUMNS: FwfColumn[] = [
  { name: 'name', width: 10, align: 'left' },
  { name: 'age', width: 5, align: 'right' },
  { name: 'city', width: 12, align: 'left' },
];

/** 按列定义把一行字段拼成严格定宽的 FWF 行，避免手写空格计数出错 */
function fwfRow(values: string[], columns: FwfColumn[] = COLUMNS): string {
  return columns
    .map((column, index) => {
      const value = values[index] ?? '';
      return column.align === 'left'
        ? value.padEnd(column.width)
        : value.padStart(column.width);
    })
    .join('');
}

describe('parseCsv', () => {
  it('parses plain rows without trimming', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
    expect(parseCsv(' a , b')).toEqual([[' a ', ' b']]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('does not produce an extra blank row for a single trailing newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']]);
    expect(parseCsv('a,b\r\n')).toEqual([['a', 'b']]);
  });

  it('keeps an explicitly empty trailing field', () => {
    expect(parseCsv('a,')).toEqual([['a', '']]);
    expect(parseCsv('a,"",b')).toEqual([['a', '', 'b']]);
  });

  it('parses quoted fields containing commas and CRLF newlines', () => {
    expect(parseCsv('"Smith, John",30,"New York"\r\n"a\r\nb","x,y"')).toEqual([
      ['Smith, John', '30', 'New York'],
      ['a\r\nb', 'x,y'],
    ]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCsv('"he said ""hi"""')).toEqual([['he said "hi"']]);
  });
});

describe('stringifyCsv', () => {
  it('round-trips simple and special rows with CRLF and a single trailing newline', () => {
    const rows = [
      ['name', 'age', 'city'],
      ['Smith, John', '30', 'New York'],
      ['Jane', '25', 'line1\nline2'],
      ['quote"me', '', '  spaced  '],
    ];
    const csv = stringifyCsv(rows, '\r\n');
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv.endsWith('\r\n\r\n')).toBe(false);
    expect(parseCsv(csv)).toEqual(rows);
  });

  it('supports LF endings and returns empty string for no rows', () => {
    expect(stringifyCsv([['a', 'b']], '\n')).toBe('a,b\n');
    expect(stringifyCsv([])).toBe('');
  });

  it('quotes fields containing CR, LF, comma or double quote', () => {
    expect(stringifyCsv([['a,b', 'x"y', 'c\rd', 'e\nf']], '\n')).toBe(
      '"a,b","x""y","c\rd","e\nf"\n',
    );
  });
});

describe('csvToFwf', () => {
  it('pads left columns on the right and right columns on the left', () => {
    const result = csvToFwf('John,30,Paris\nBob,7,London', COLUMNS, {
      overflow: 'error',
      newline: '\n',
      hasHeader: false,
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe(
      `${fwfRow(['John', '30', 'Paris'])}\n${fwfRow(['Bob', '7', 'London'])}\n`,
    );
    expect(result.truncatedCount).toBe(0);
  });

  it('emits CRLF line endings when requested', () => {
    const result = csvToFwf('John,30,Paris', COLUMNS, {
      overflow: 'error',
      newline: '\r\n',
      hasHeader: false,
    });
    expect(result.output).toBe(`${fwfRow(['John', '30', 'Paris'])}\r\n`);
  });

  it('truncates overflowing fields and counts them', () => {
    const long = 'Christopher,123456,San Francisco';
    const result = csvToFwf(long, COLUMNS, {
      overflow: 'truncate',
      newline: '\n',
      hasHeader: false,
    });
    expect(result.error).toBeNull();
    expect(result.truncatedCount).toBe(3);
    expect(result.output).toBe('Christophe12345San Francisc\n');
  });

  it('returns a Chinese error with data row number and column name in error mode', () => {
    const result = csvToFwf('John,30,Paris\nChristopher,30,Paris', COLUMNS, {
      overflow: 'error',
      newline: '\n',
      hasHeader: false,
    });
    expect(result.error).toBe('数据行 2 列「name」内容超出列宽 10');
    expect(result.output).toBe('');
  });

  it('reports field count mismatch with the data row number', () => {
    const result = csvToFwf('John,30\nBob,7,London', COLUMNS, {
      overflow: 'error',
      newline: '\n',
      hasHeader: false,
    });
    expect(result.error).toBe('数据行 1 的字段数为 2，与列数 3 不一致');
  });

  it('rejects non-positive or non-integer widths', () => {
    const zero = [{ name: 'x', width: 0, align: 'left' as const }];
    expect(csvToFwf('a', zero, { overflow: 'error', newline: '\n', hasHeader: false }).error).toBe(
      '列「x」的宽度必须为正整数',
    );
    const float = [{ name: 'x', width: 1.5, align: 'left' as const }];
    expect(
      csvToFwf('a', float, { overflow: 'error', newline: '\n', hasHeader: false }).error,
    ).toBe('列「x」的宽度必须为正整数');
  });

  it('skips the first row as header and numbers data rows from 1', () => {
    const result = csvToFwf('name,age,city\nJohn,30,Paris', COLUMNS, {
      overflow: 'error',
      newline: '\n',
      hasHeader: true,
    });
    expect(result.error).toBeNull();
    expect(result.output).toBe(`${fwfRow(['John', '30', 'Paris'])}\n`);

    const overflow = csvToFwf('name,age,city\nChristopher,30,Paris', COLUMNS, {
      overflow: 'error',
      newline: '\n',
      hasHeader: true,
    });
    expect(overflow.error).toBe('数据行 1 列「name」内容超出列宽 10');
  });

  it('returns empty output for empty input', () => {
    const result = csvToFwf('', COLUMNS, {
      overflow: 'truncate',
      newline: '\n',
      hasHeader: false,
    });
    expect(result).toEqual({ output: '', truncatedCount: 0, error: null });
  });
});

describe('fwfToCsv', () => {
  it('slices fields by cumulative positions and strips padding per alignment', () => {
    const input = `${fwfRow(['John', '30', 'Paris'])}\n${fwfRow(['Bob', '7', 'London'])}\n`;
    const result = fwfToCsv(input, COLUMNS, { newline: '\n', hasHeader: false });
    expect(result.error).toBeNull();
    expect(result.headers).toEqual(['name', 'age', 'city']);
    expect(result.output).toBe('John,30,Paris\nBob,7,London\n');
  });

  it('left columns keep leading spaces and right columns keep trailing spaces', () => {
    const columns: FwfColumn[] = [
      { name: 'a', width: 6, align: 'left' },
      { name: 'b', width: 6, align: 'right' },
    ];
    // left 列保留内容前导空格；right 列保留内容尾随空格
    const result = fwfToCsv(`${fwfRow(['  abc', 'xyz '], columns)}\n`, columns, {
      newline: '\n',
      hasHeader: false,
    });
    expect(parseCsv(result.output)).toEqual([['  abc', 'xyz ']]);
  });

  it('does not crash on short rows and produces short fields', () => {
    const result = fwfToCsv('John\nBob,7', COLUMNS, { newline: '\n', hasHeader: false });
    expect(result.error).toBeNull();
    expect(parseCsv(result.output)).toEqual([
      ['John', '', ''],
      ['Bob,7', '', ''],
    ]);
  });

  it('splits on CR, LF and CRLF line endings and tolerates no final newline', () => {
    const input = `${fwfRow(['John', '30', 'Paris'])}\r${fwfRow(['Bob', '7', 'London'])}`;
    const result = fwfToCsv(input, COLUMNS, { newline: '\r\n', hasHeader: false });
    expect(parseCsv(result.output)).toEqual([
      ['John', '30', 'Paris'],
      ['Bob', '7', 'London'],
    ]);
  });

  it('takes headers from the first sliced row when hasHeader is true', () => {
    const input = `${fwfRow(['name', 'age', 'city'])}\n${fwfRow(['John', '30', 'Paris'])}\n`;
    const result = fwfToCsv(input, COLUMNS, { newline: '\n', hasHeader: true });
    expect(result.headers).toEqual(['name', 'age', 'city']);
    expect(parseCsv(result.output)).toEqual([
      ['name', 'age', 'city'],
      ['John', '30', 'Paris'],
    ]);
  });

  it('returns empty output for empty input', () => {
    const result = fwfToCsv('', COLUMNS, { newline: '\r\n', hasHeader: true });
    expect(result.output).toBe('');
    expect(result.error).toBeNull();
  });

  it('rejects illegal widths', () => {
    const bad = [{ name: 'x', width: -2, align: 'left' as const }];
    expect(fwfToCsv('x', bad, { newline: '\n', hasHeader: false }).error).toBe(
      '列「x」的宽度必须为正整数',
    );
  });

  it('produces legal CSV when sliced fields contain commas or double quotes', () => {
    const columns: FwfColumn[] = [{ name: 'a', width: 20, align: 'left' }];
    const raw = 'Smith, John         \nshe said "hi"       ';
    const result = fwfToCsv(raw, columns, { newline: '\n', hasHeader: false });
    expect(result.error).toBeNull();
    expect(parseCsv(result.output)).toEqual([['Smith, John'], ['she said "hi"']]);
  });
});

describe('round trip', () => {
  it('rows -> CSV -> FWF -> CSV restores field contents', () => {
    const roundColumns: FwfColumn[] = [
      { name: 'name', width: 12, align: 'left' },
      { name: 'age', width: 5, align: 'right' },
      { name: 'city', width: 12, align: 'left' },
    ];
    const rows = [
      ['Alice', '28', 'Beijing'],
      ['Smith, John', '30', 'New York'],
      ['  spaced', '7', 'a"b'],
    ];
    const csv = stringifyCsv(rows, '\n');
    const toFwf = csvToFwf(csv, roundColumns, {
      overflow: 'error',
      newline: '\n',
      hasHeader: false,
    });
    expect(toFwf.error).toBeNull();
    const back = fwfToCsv(toFwf.output, roundColumns, { newline: '\n', hasHeader: false });
    expect(back.error).toBeNull();
    expect(parseCsv(back.output)).toEqual(rows);
  });
});
