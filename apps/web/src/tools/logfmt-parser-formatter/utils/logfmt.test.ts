import { describe, it, expect } from 'vitest';
import {
  parseLogfmtLine,
  parseLogfmt,
  inferValue,
  quoteValueIfNeeded,
  formatField,
  formatRecord,
  formatLogfmt,
} from './logfmt';

describe('parseLogfmtLine 基础解析', () => {
  it('解析基础 key=value 并保留字段顺序', () => {
    const line = parseLogfmtLine('level=info msg=started', 1);
    expect(line.errors).toEqual([]);
    expect(line.fields.map((field) => field.key)).toEqual(['level', 'msg']);
    expect(line.fields[0]!.rawValue).toBe('info');
  });

  it('容忍行首行尾的多余空格', () => {
    const line = parseLogfmtLine('   level=info   msg=hi  ', 1);
    expect(line.fields).toHaveLength(2);
    expect(line.fields[0]!.key).toBe('level');
    expect(line.fields[1]!.rawValue).toBe('hi');
  });

  it('解析含空格的双引号值', () => {
    const line = parseLogfmtLine('msg="hello world" level=info', 1);
    expect(line.fields[0]!.rawValue).toBe('hello world');
    expect(line.fields[1]!.rawValue).toBe('info');
  });

  it('处理引号值内的反斜杠转义序列', () => {
    const line = parseLogfmtLine('path="C:\\\\tmp\\\\a\\"" note="line1\\nline2\\ttab"', 1);
    expect(line.fields[0]!.rawValue).toBe('C:\\tmp\\a"');
    expect(line.fields[1]!.rawValue).toBe('line1\nline2\ttab');
    expect(line.errors).toEqual([]);
  });

  it('未知转义保留反斜杠原样', () => {
    const line = parseLogfmtLine('msg="a\\qb"', 1);
    expect(line.fields[0]!.rawValue).toBe('a\\qb');
  });

  it('裸键（无等号）推断为布尔 true', () => {
    const line = parseLogfmtLine('verbose level=debug', 1);
    expect(line.fields[0]).toMatchObject({
      key: 'verbose',
      rawValue: 'true',
      type: 'boolean',
      value: true,
    });
  });

  it('key= 后接空格或行尾视为空字符串', () => {
    const trailing = parseLogfmtLine('empty= next=1', 1);
    expect(trailing.fields[0]).toMatchObject({ key: 'empty', rawValue: '', type: 'string' });
    const atEnd = parseLogfmtLine('empty=', 1);
    expect(atEnd.fields[0]).toMatchObject({ rawValue: '', value: '' });
    const quotedEmpty = parseLogfmtLine('empty=""', 1);
    expect(quotedEmpty.fields[0]!.rawValue).toBe('');
  });

  it('引号值内允许出现等号', () => {
    const line = parseLogfmtLine('query="a=b&c=d"', 1);
    expect(line.fields[0]!.rawValue).toBe('a=b&c=d');
  });

  it('未闭合的双引号产出错误但不抛异常', () => {
    const line = parseLogfmtLine('msg="unterminated level=info', 1);
    expect(line.errors).toHaveLength(1);
    expect(line.errors[0]).toMatch(/双引号未闭合/);
    expect(line.fields[0]!.key).toBe('msg');
  });

  it('闭合引号后缺少空格分隔时给出警告', () => {
    const line = parseLogfmtLine('msg="hi"level=info', 1);
    expect(line.errors.some((error) => error.includes('缺少空格分隔'))).toBe(true);
  });
});

describe('inferValue 类型推断', () => {
  it('整数推断为 number', () => {
    expect(inferValue('42')).toEqual({ type: 'number', value: 42 });
    expect(inferValue('-7')).toEqual({ type: 'number', value: -7 });
  });

  it('浮点与科学计数法推断为 number', () => {
    expect(inferValue('3.14')).toEqual({ type: 'number', value: 3.14 });
    expect(inferValue('-0.5').type).toBe('number');
    expect(inferValue('1e3').type).toBe('number');
  });

  it('true/false 推断为 boolean', () => {
    expect(inferValue('true')).toEqual({ type: 'boolean', value: true });
    expect(inferValue('false')).toEqual({ type: 'boolean', value: false });
  });

  it('其余值推断为 string', () => {
    expect(inferValue('info')).toEqual({ type: 'string', value: 'info' });
    expect(inferValue('3.14.1')).toEqual({ type: 'string', value: '3.14.1' });
  });

  it('超出安全整数范围的数字保留字符串', () => {
    const huge = '9007199254740993';
    const result = inferValue(huge);
    expect(result.type).toBe('string');
    expect(result.value).toBe(huge);
  });
});

describe('parseLogfmt 多行与警告', () => {
  it('多行解析并跳过空行、汇总统计', () => {
    const result = parseLogfmt('a=1\n\nb=2\n');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]!.lineNo).toBe(1);
    expect(result.lines[1]!.lineNo).toBe(3);
    expect(result.summary).toEqual({ total: 2, errorLines: 0, fieldCount: 2 });
    expect(result.warnings).toEqual([]);
  });

  it('坏行产出带行号的中文警告且不影响其他行', () => {
    const result = parseLogfmt('a=1\nmsg="bad\nc=3');
    expect(result.summary.errorLines).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/^第 2 行：.*双引号未闭合/);
    expect(result.lines).toHaveLength(3);
  });

  it('输出缩进 2 空格的 JSON 数组且采用推断值', () => {
    const result = parseLogfmt('count=2 ok=true msg=hi');
    const parsed = JSON.parse(result.jsonOutput) as Array<Record<string, unknown>>;
    expect(parsed[0]).toEqual({ count: 2, ok: true, msg: 'hi' });
    expect(result.jsonOutput).toContain('\n  ');
  });

  it('空输入返回空 JSON 输出', () => {
    const result = parseLogfmt('  \n\n');
    expect(result.lines).toEqual([]);
    expect(result.jsonOutput).toBe('');
  });
});

describe('quoteValueIfNeeded 加引号判定', () => {
  it('简单值不加引号', () => {
    expect(quoteValueIfNeeded('info')).toBe('info');
    expect(quoteValueIfNeeded('3.14')).toBe('3.14');
  });

  it('空值、含空格、引号、等号、反斜杠时加引号并转义', () => {
    expect(quoteValueIfNeeded('')).toBe('""');
    expect(quoteValueIfNeeded('hello world')).toBe('"hello world"');
    expect(quoteValueIfNeeded('a=b')).toBe('"a=b"');
    expect(quoteValueIfNeeded('say "hi"')).toBe('"say \\"hi\\""');
    expect(quoteValueIfNeeded('C:\\tmp')).toBe('"C:\\\\tmp"');
  });
});

describe('formatLogfmt 序列化与往返', () => {
  it('布尔 true 输出裸键，false 输出 key=false', () => {
    expect(formatField('verbose', true)).toBe('verbose');
    expect(formatField('enabled', false)).toBe('enabled=false');
  });

  it('null/undefined 序列化为空值', () => {
    expect(formatField('x', null)).toBe('x=');
    expect(formatField('x', undefined)).toBe('x=');
  });

  it('序列化单条记录并处理需要引号的值', () => {
    const line = formatRecord({
      level: 'info',
      msg: 'hello world',
      count: 3,
      empty: '',
      verbose: true,
    });
    expect(line).toBe('level=info msg="hello world" count=3 empty= verbose');
  });

  it('JSON 数组序列化为多行 logfmt', () => {
    const result = formatLogfmt('[\n  {"a": 1, "b": "x y"},\n  {"c": true}\n]');
    expect(result.error).toBeNull();
    expect(result.output).toBe('a=1 b="x y"\nc');
  });

  it('支持 NDJSON（每行一个对象）', () => {
    const result = formatLogfmt('{"a": 1}\n{"b": 2}\n');
    expect(result.error).toBeNull();
    expect(result.output).toBe('a=1\nb=2');
  });

  it('JSON 解析失败返回可读错误', () => {
    const arrayError = formatLogfmt('[{"a": 1}');
    expect(arrayError.error).toMatch(/JSON 数组解析失败/);
    const lineError = formatLogfmt('{"a": 1}\n{bad}\n');
    expect(lineError.error).toMatch(/第 2 行 JSON 解析失败/);
    expect(lineError.output).toBe('');
  });

  it('非对象元素给出定位错误', () => {
    const result = formatLogfmt('[1, 2]');
    expect(result.error).toMatch(/第 1 条记录不是 JSON 对象/);
  });

  it('format 往返：parse(format(x)) 与原数据等值', () => {
    const records = [
      {
        int: -12,
        float: 3.14,
        boolTrue: true,
        boolFalse: false,
        spaced: 'hello world',
        quoted: 'say "hi"',
        eq: 'a=b',
        empty: '',
        slash: 'C:\\tmp',
      },
      { verbose: true, level: 'info' },
    ];
    const formatted = formatLogfmt(JSON.stringify(records));
    expect(formatted.error).toBeNull();
    const reparsed = parseLogfmt(formatted.output);
    expect(reparsed.warnings).toEqual([]);
    expect(reparsed.lines).toHaveLength(2);
    expect(reparsed.lines[0]!.fields.map((field) => field.value)).toEqual([
      -12,
      3.14,
      true,
      false,
      'hello world',
      'say "hi"',
      'a=b',
      '',
      'C:\\tmp',
    ]);
    expect(reparsed.lines[1]!.fields[0]).toMatchObject({ key: 'verbose', value: true });
  });
});
