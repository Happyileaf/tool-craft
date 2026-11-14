import { describe, expect, it } from 'vitest';
import { addLineNumbers, stripLineNumbers, validateOptions } from './line-number';

const baseOptions = {
  start: 3,
  step: 2,
  separator: '. ',
  padWidth: 3,
  numberBlankLines: false,
};

describe('addLineNumbers', () => {
  it('按起始值、步长与零填充宽度编号并跳过空行', () => {
    expect(addLineNumbers('a\n\nb', baseOptions)).toBe('003. a\n\n005. b');
  });

  it('开启空行编号时空行获得当前序号并占用步长', () => {
    expect(addLineNumbers('a\n\nb', { ...baseOptions, numberBlankLines: true })).toBe(
      '003. a\n005. \n007. b',
    );
  });

  it('宽度为 0 时按最大编号自动对齐', () => {
    expect(
      addLineNumbers('a\nb\nc', {
        ...baseOptions,
        start: 8,
        step: 1,
        padWidth: 0,
        separator: ' | ',
      }),
    ).toBe('08 | a\n09 | b\n10 | c');
  });

  it('支持 Tab 与单个空格分隔符', () => {
    expect(
      addLineNumbers('x\ny', {
        ...baseOptions,
        start: 1,
        step: 1,
        padWidth: 0,
        separator: '\t',
      }),
    ).toBe('1\tx\n2\ty');
    expect(
      addLineNumbers('x', { ...baseOptions, start: 1, step: 1, padWidth: 0, separator: ' ' }),
    ).toBe('1 x');
  });

  it('空输入返回空字符串', () => {
    expect(addLineNumbers('', baseOptions)).toBe('');
  });

  it('非法参数抛出可展示的错误', () => {
    expect(() => validateOptions({ ...baseOptions, start: -1 })).toThrow(/起始编号/);
    expect(() => validateOptions({ ...baseOptions, step: 0 })).toThrow(/步长/);
    expect(() => validateOptions({ ...baseOptions, padWidth: 13 })).toThrow(/对齐宽度/);
    expect(() => validateOptions({ ...baseOptions, separator: '' })).toThrow(/分隔符/);
  });
});

describe('stripLineNumbers', () => {
  it('移除常见编号前缀', () => {
    const input = '1. alpha\n02: beta\n3) gamma\n4 | delta\n5\t epsilon';
    expect(stripLineNumbers(input)).toBe('alpha\nbeta\ngamma\ndelta\nepsilon');
  });

  it('保留无前缀行与空行', () => {
    expect(stripLineNumbers('标题\n\n1. 内容')).toBe('标题\n\n内容');
  });

  it('不误删日期等非编号数字', () => {
    expect(stripLineNumbers('2026.11.15 发布\n版本 1.2.3')).toBe('2026.11.15 发布\n版本 1.2.3');
  });

  it('支持右对齐空格填充的编号', () => {
    expect(stripLineNumbers('  12. 尾部内容')).toBe('尾部内容');
  });

  it('空输入返回空字符串', () => {
    expect(stripLineNumbers('')).toBe('');
  });
});
