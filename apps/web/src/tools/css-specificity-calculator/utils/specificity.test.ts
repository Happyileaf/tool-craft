import { describe, it, expect } from 'vitest';
import {
  addSpecificity,
  calculateSpecificity,
  calculateSpecificityLines,
  compareSpecificity,
  formatSpecificity,
  maxSpecificity,
} from './specificity';

describe('addSpecificity / maxSpecificity / compareSpecificity', () => {
  it('逐项相加', () => {
    expect(addSpecificity({ a: 1, b: 2, c: 3 }, { a: 0, b: 1, c: 1 })).toEqual({
      a: 1,
      b: 3,
      c: 4,
    });
  });

  it('按 a → b → c 取最大值', () => {
    expect(maxSpecificity({ a: 1, b: 0, c: 0 }, { a: 0, b: 9, c: 9 })).toEqual({
      a: 1,
      b: 0,
      c: 0,
    });
    expect(maxSpecificity({ a: 0, b: 1, c: 9 }, { a: 0, b: 2, c: 0 })).toEqual({
      a: 0,
      b: 2,
      c: 0,
    });
  });

  it('比较返回 1 / -1 / 0', () => {
    expect(compareSpecificity({ a: 1, b: 0, c: 0 }, { a: 0, b: 9, c: 9 })).toBe(1);
    expect(compareSpecificity({ a: 0, b: 0, c: 1 }, { a: 0, b: 1, c: 0 })).toBe(-1);
    expect(compareSpecificity({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })).toBe(0);
  });
});

describe('calculateSpecificity 基础选择器', () => {
  it('类型、类、ID、通配', () => {
    expect(calculateSpecificity('div').specificity).toEqual({ a: 0, b: 0, c: 1 });
    expect(calculateSpecificity('*').specificity).toEqual({ a: 0, b: 0, c: 0 });
    expect(calculateSpecificity('.btn').specificity).toEqual({ a: 0, b: 1, c: 0 });
    expect(calculateSpecificity('#main').specificity).toEqual({ a: 1, b: 0, c: 0 });
    expect(calculateSpecificity('a.button').specificity).toEqual({ a: 0, b: 1, c: 1 });
  });

  it('后代、子代、相邻与兄弟组合子', () => {
    expect(calculateSpecificity('ul li a').specificity).toEqual({ a: 0, b: 0, c: 3 });
    expect(calculateSpecificity('.nav > li + a ~ span').specificity).toEqual({
      a: 0,
      b: 1,
      c: 3,
    });
  });

  it('属性选择器按 b 列计', () => {
    expect(calculateSpecificity('[type="text"]').specificity).toEqual({ a: 0, b: 1, c: 0 });
    expect(calculateSpecificity('a[href][target]').specificity).toEqual({ a: 0, b: 2, c: 1 });
    expect(calculateSpecificity('[data-attr="a,b ]"]').specificity).toEqual({
      a: 0,
      b: 1,
      c: 0,
    });
  });

  it('伪类按 b 列、伪元素按 c 列计', () => {
    expect(calculateSpecificity('a:hover').specificity).toEqual({ a: 0, b: 1, c: 1 });
    expect(calculateSpecificity('p::first-line').specificity).toEqual({ a: 0, b: 0, c: 2 });
    expect(calculateSpecificity('div:before').specificity).toEqual({ a: 0, b: 0, c: 2 });
    expect(calculateSpecificity('div::before').specificity).toEqual({ a: 0, b: 0, c: 2 });
  });
});

describe(':is() / :where() / :not() / :has()', () => {
  it(':is() 取参数列表最高权重', () => {
    expect(calculateSpecificity(':is(div, .btn, #id)').specificity).toEqual({
      a: 1,
      b: 0,
      c: 0,
    });
    expect(calculateSpecificity('a:is(.nav > span)').specificity).toEqual({
      a: 0,
      b: 1,
      c: 2,
    });
  });

  it(':where() 权重恒为 0', () => {
    expect(calculateSpecificity(':where(#id.btn)').specificity).toEqual({ a: 0, b: 0, c: 0 });
    expect(calculateSpecificity('p:where(.a)').specificity).toEqual({ a: 0, b: 0, c: 1 });
  });

  it(':not() 取参数最高权重', () => {
    expect(calculateSpecificity('div:not(.active)').specificity).toEqual({ a: 0, b: 1, c: 1 });
    expect(calculateSpecificity('a:not(.x, #y)').specificity).toEqual({ a: 1, b: 0, c: 1 });
  });

  it(':has() 取参数最高权重', () => {
    expect(calculateSpecificity('section:has(> h2)').specificity).toEqual({ a: 0, b: 0, c: 2 });
  });

  it('嵌套函数取内层最高权重', () => {
    expect(calculateSpecificity(':is(:where(#a), :not(.b))').specificity).toEqual({
      a: 0,
      b: 1,
      c: 0,
    });
  });
});

describe(':nth-child() of 语法', () => {
  it('普通 An+B 只算一个伪类', () => {
    expect(calculateSpecificity('li:nth-child(2n+1)').specificity).toEqual({
      a: 0,
      b: 1,
      c: 1,
    });
  });

  it('of S 过滤语法叠加过滤选择器权重', () => {
    expect(calculateSpecificity('li:nth-child(odd of .item)').specificity).toEqual({
      a: 0,
      b: 2,
      c: 1,
    });
  });
});

describe('选择器列表与非法输入', () => {
  it('逗号分隔列表取最高权重', () => {
    expect(calculateSpecificity('div, .btn, #id span').specificity).toEqual({
      a: 1,
      b: 0,
      c: 1,
    });
  });

  it('空串与空白非法', () => {
    expect(calculateSpecificity('').valid).toBe(false);
    expect(calculateSpecificity('   ').valid).toBe(false);
  });

  it('括号不配对、尾随组合子、非法起始字符均判非法', () => {
    expect(calculateSpecificity('div >').valid).toBe(false);
    expect(calculateSpecificity(':is(div').valid).toBe(false);
    expect(calculateSpecificity('[attr').valid).toBe(false);
    expect(calculateSpecificity('.').valid).toBe(false);
    expect(calculateSpecificity('> div').valid).toBe(false);
  });

  it('& 嵌套选择器自身权重为 0', () => {
    expect(calculateSpecificity('&.active').specificity).toEqual({ a: 0, b: 1, c: 0 });
  });
});

describe('calculateSpecificityLines / formatSpecificity', () => {
  it('忽略空行并逐行解析', () => {
    const results = calculateSpecificityLines('.a\n\n#b\n');
    expect(results).toHaveLength(2);
    expect(results[0]?.specificity).toEqual({ a: 0, b: 1, c: 0 });
    expect(results[1]?.specificity).toEqual({ a: 1, b: 0, c: 0 });
  });

  it('格式化为 (a, b, c)', () => {
    expect(formatSpecificity({ a: 1, b: 2, c: 3 })).toBe('(1, 2, 3)');
  });
});
