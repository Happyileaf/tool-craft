import { describe, it, expect } from 'vitest';
import { csvToJson, jsonToCsv } from './csv';

describe('csvToJson', () => {
  it('输入为空时返回空串', () => {
    expect(csvToJson('')).toBe('');
    expect(csvToJson('   \n ')).toBe('');
  });

  it('把首行表头映射为对象键', () => {
    const csv = 'name,age,city\nJohn,30,New York\nJane,25,London';
    expect(JSON.parse(csvToJson(csv))).toEqual([
      { name: 'John', age: '30', city: 'New York' },
      { name: 'Jane', age: '25', city: 'London' },
    ]);
  });

  it('正确解析引号包裹字段内的分隔符、换行与双引号', () => {
    const csv = 'name,note\n"Doe, John","line1\nline2"\n"Say ""hi""",x';
    expect(JSON.parse(csvToJson(csv))).toEqual([
      { name: 'Doe, John', note: 'line1\nline2' },
      { name: 'Say "hi"', note: 'x' },
    ]);
  });

  it('兼容 UTF-8 BOM 与 CRLF 换行', () => {
    const csv = '\uFEFFa,b\r\n1,2\r\n';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('跳过多余空行', () => {
    const csv = 'a,b\n\n1,2\n';
    expect(JSON.parse(csvToJson(csv))).toEqual([{ a: '1', b: '2' }]);
  });

  it('关闭表头开关时输出二维数组', () => {
    const csv = 'a,b\n1,2';
    expect(JSON.parse(csvToJson(csv, { hasHeader: false }))).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('支持自定义分隔符', () => {
    const csv = 'a;b\n1;2';
    expect(JSON.parse(csvToJson(csv, { delimiter: ';' }))).toEqual([{ a: '1', b: '2' }]);
  });
});

describe('jsonToCsv', () => {
  it('输入为空时返回空串', () => {
    expect(jsonToCsv('')).toBe('');
    expect(jsonToCsv('[]')).toBe('');
  });

  it('将对象数组转换为带表头的 CSV', () => {
    const json = JSON.stringify([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ]);
    expect(jsonToCsv(json)).toBe('name,age\nJohn,30\nJane,25');
  });

  it('按键并集生成表头，缺失值填空', () => {
    const json = JSON.stringify([{ a: 1 }, { b: 2 }]);
    expect(jsonToCsv(json)).toBe('a,b\n1,\n,2');
  });

  it('对含分隔符、引号与换行的值做转义', () => {
    const json = JSON.stringify([{ name: 'Doe, John', note: 'a "quote" and\nnewline' }]);
    expect(jsonToCsv(json)).toBe('name,note\n"Doe, John","a ""quote"" and\nnewline"');
  });

  it('支持二维数组输入', () => {
    const json = JSON.stringify([
      ['a', 'b'],
      [1, 2],
    ]);
    expect(jsonToCsv(json)).toBe('a,b\n1,2');
  });

  it('非法 JSON 抛出可读错误', () => {
    expect(() => jsonToCsv('{ bad json')).toThrowError(/JSON 解析失败/);
  });

  it('根节点不是数组时抛出可读错误', () => {
    expect(() => jsonToCsv('{"a":1}')).toThrowError(/必须是数组/);
  });
});
