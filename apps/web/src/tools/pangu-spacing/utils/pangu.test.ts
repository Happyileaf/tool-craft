import { describe, expect, it } from 'vitest';
import { addSpacing, removeSpacing } from './pangu';

describe('addSpacing', () => {
  it('在中文与英文单词边界插入空格', () => {
    const result = addSpacing('使用React构建界面');
    expect(result.output).toBe('使用 React 构建界面');
    expect(result.changed).toBe(2);
  });

  it('在中文与数字及百分号边界插入空格', () => {
    expect(addSpacing('覆盖率80%以上').output).toBe('覆盖率 80% 以上');
  });

  it('已有空格不重复插入', () => {
    const result = addSpacing('使用 React 构建界面');
    expect(result.output).toBe('使用 React 构建界面');
    expect(result.changed).toBe(0);
  });

  it('全角标点边界不额外加空格', () => {
    expect(addSpacing('你好，world。').output).toBe('你好， world。');
    expect(addSpacing('中文，中文').output).toBe('中文，中文');
  });

  it('跳过行内代码', () => {
    const result = addSpacing('调用`fooBar()`函数处理');
    expect(result.output).toBe('调用 `fooBar()` 函数处理');
    expect(result.output).toContain('`fooBar()`');
  });

  it('跳过围栏代码块内部', () => {
    const input = '说明如下：\n```\n使用React构建\n```\n结束';
    const result = addSpacing(input);
    expect(result.output).toContain('使用React构建');
    expect(result.output.startsWith('说明如下：')).toBe(true);
    expect(result.output).toContain('\n结束');
  });

  it('跳过 URL', () => {
    const result = addSpacing('访问https://example.com/path?a=1查看');
    expect(result.output).toBe('访问 https://example.com/path?a=1 查看');
  });

  it('不破坏连续空白与纯英文文本', () => {
    expect(addSpacing('hello world  ').output).toBe('hello world  ');
  });

  it('空输入原样返回', () => {
    expect(addSpacing('')).toEqual({ output: '', changed: 0 });
  });

  it('多语言 CJK：日文假名与韩文音节同样生效', () => {
    expect(addSpacing('テストABC終了').output).toBe('テスト ABC 終了');
  });
});

describe('removeSpacing', () => {
  it('移除中英文之间的空格', () => {
    const result = removeSpacing('使用 React 构建 界面 ');
    expect(result.output).toBe('使用React构建 界面 ');
    expect(result.changed).toBe(2);
  });

  it('代码块与 URL 内的空格不移除', () => {
    const input = '访问 https://example.com/a b 查看\n```\n使用 React\n```';
    const result = removeSpacing(input);
    expect(result.output).toContain('https://example.com/a b');
    expect(result.output).toContain('使用 React');
  });

  it('addSpacing 与 removeSpacing 可往返还原原文', () => {
    const original = '使用React构建界面，覆盖率80%。';
    const spaced = addSpacing(original).output;
    expect(removeSpacing(spaced).output).toBe(original);
  });
});
