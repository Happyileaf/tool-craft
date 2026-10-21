import { describe, it, expect } from 'vitest';
import { parseList, setOperations } from './set-ops';

describe('parseList', () => {
  it('按行切分并默认 trim、丢弃空行', () => {
    expect(parseList('a\n b \n\nc', { trim: true, lowercase: false })).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('关闭 trim 时保留首尾空白与空白行以外的内容', () => {
    expect(parseList(' a \nb', { trim: false, lowercase: false })).toEqual([' a ', 'b']);
  });

  it('开启 lowercase 时统一小写', () => {
    expect(parseList('A\nBc', { trim: true, lowercase: true })).toEqual(['a', 'bc']);
  });

  it('空文本返回空数组', () => {
    expect(parseList('', { trim: true, lowercase: false })).toEqual([]);
    expect(parseList('\n  \n', { trim: true, lowercase: false })).toEqual([]);
  });

  it('解析阶段不去重', () => {
    expect(parseList('a\na\nb', { trim: true, lowercase: false })).toEqual(['a', 'a', 'b']);
  });
});

describe('setOperations 去重开启', () => {
  const a = ['a', 'b', 'c'];
  const b = ['b', 'c', 'd'];

  it('五种基础运算结果正确', () => {
    const result = setOperations(a, b, { dedupe: true });
    expect(result.intersection).toEqual(['b', 'c']);
    expect(result.union).toEqual(['a', 'b', 'c', 'd']);
    expect(result.leftOnly).toEqual(['a']);
    expect(result.rightOnly).toEqual(['d']);
    expect(result.symmetricDifference).toEqual(['a', 'd']);
  });

  it('按首次出现顺序保序（并集以 A 顺序为准）', () => {
    const result = setOperations(['c', 'a', 'b'], ['d', 'b'], { dedupe: true });
    expect(result.intersection).toEqual(['b']);
    expect(result.union).toEqual(['c', 'a', 'b', 'd']);
    expect(result.leftOnly).toEqual(['c', 'a']);
    expect(result.rightOnly).toEqual(['d']);
  });

  it('空列表返回空结果', () => {
    const result = setOperations([], [], { dedupe: true });
    expect(result.intersection).toEqual([]);
    expect(result.union).toEqual([]);
    expect(result.leftOnly).toEqual([]);
    expect(result.rightOnly).toEqual([]);
    expect(result.symmetricDifference).toEqual([]);
  });

  it('无交集时交集为空、并集为两侧拼接', () => {
    const result = setOperations(['a'], ['b'], { dedupe: true });
    expect(result.intersection).toEqual([]);
    expect(result.union).toEqual(['a', 'b']);
    expect(result.symmetricDifference).toEqual(['a', 'b']);
  });
});

describe('setOperations 去重关闭', () => {
  it('交集命中即保留 A 中全部重复（A=a,a,b、B=a → a,a），A−B 按次数相减', () => {
    const result = setOperations(['a', 'a', 'b'], ['a'], { dedupe: false });
    expect(result.intersection).toEqual(['a', 'a']);
    expect(result.leftOnly).toEqual(['a', 'b']);
    expect(result.union).toEqual(['a', 'a', 'b']);
  });

  it('差集减去对应次数（A=a,a,a,b、B=a,a → leftOnly 保留 a,b）', () => {
    const result = setOperations(['a', 'a', 'a', 'b'], ['a', 'a'], {
      dedupe: false,
    });
    expect(result.leftOnly).toEqual(['a', 'b']);
    expect(result.intersection).toEqual(['a', 'a', 'a']);
  });

  it('rightOnly 以 B 为基准对称保留重复', () => {
    const result = setOperations(['a'], ['a', 'd', 'd'], { dedupe: false });
    expect(result.rightOnly).toEqual(['d', 'd']);
    expect(result.symmetricDifference).toEqual(['d', 'd']);
  });

  it('交集次数取较小值：B 中重复更多时以 A 次数为准', () => {
    const result = setOperations(['a', 'b'], ['a', 'a', 'b', 'b'], {
      dedupe: false,
    });
    expect(result.intersection).toEqual(['a', 'b']);
    expect(result.rightOnly).toEqual(['a', 'b']);
  });
});

describe('setOperations 配合预处理', () => {
  it('忽略大小写后 A=a 与 B=A 视为同一项', () => {
    const parsedA = parseList('a', { trim: true, lowercase: true });
    const parsedB = parseList('A', { trim: true, lowercase: true });
    const result = setOperations(parsedA, parsedB, { dedupe: true });
    expect(result.intersection).toEqual(['a']);
    expect(result.union).toEqual(['a']);
  });

  it('trim 开启后 " a " 与 a 视为同一项', () => {
    const parsedA = parseList(' a ', { trim: true, lowercase: false });
    const parsedB = parseList('a', { trim: true, lowercase: false });
    const result = setOperations(parsedA, parsedB, { dedupe: true });
    expect(result.intersection).toEqual(['a']);
  });
});
