import { describe, it, expect } from 'vitest';
import { parseNamedSets, computePair, computeSimilarity } from './similarity';

describe('parseNamedSets', () => {
  it('首个 token 作为集合名，其余元素按多分隔符拆分并去重保序', () => {
    const sets = parseNamedSets(['tags apple, banana apple\nbanana cherry'], {
      lowercase: false,
    });
    expect(sets).toHaveLength(1);
    expect(sets[0]!.name).toBe('tags');
    expect(sets[0]!.elements).toEqual(['apple', 'banana', 'cherry']);
  });

  it('支持中文逗号与空白分隔，忽略大小写开关生效', () => {
    const sets = parseNamedSets(['A Foo foo BAR', 'B foo bar baz'], { lowercase: true });
    expect(sets[0]!.elements).toEqual(['foo', 'bar']);
    expect(sets[1]!.elements).toEqual(['foo', 'bar', 'baz']);
  });

  it('跳过全空白文本段', () => {
    const sets = parseNamedSets(['A 1 2', '   ', 'B 3'], { lowercase: false });
    expect(sets.map((set) => set.name)).toEqual(['A', 'B']);
  });
});

describe('computePair', () => {
  const a = { name: 'A', elements: ['1', '2', '3'] };
  const b = { name: 'B', elements: ['2', '3', '4'] };

  it('标准集合三系系数与手工计算一致', () => {
    const pair = computePair(a, b);
    expect(pair.intersectionSize).toBe(2);
    expect(pair.unionSize).toBe(4);
    expect(pair.intersection).toEqual(['2', '3']);
    expect(pair.jaccard).toBeCloseTo(0.5);
    expect(pair.dice).toBeCloseTo(2 / 3);
    expect(pair.overlap).toBeCloseTo(2 / 3);
  });

  it('相同集合三系数均为 1', () => {
    const pair = computePair(a, { name: 'A2', elements: ['1', '2', '3'] });
    expect(pair.jaccard).toBe(1);
    expect(pair.dice).toBe(1);
    expect(pair.overlap).toBe(1);
  });

  it('互不相交集合三系数均为 0', () => {
    const pair = computePair({ name: 'X', elements: ['1'] }, { name: 'Y', elements: ['9'] });
    expect(pair.jaccard).toBe(0);
    expect(pair.dice).toBe(0);
    expect(pair.overlap).toBe(0);
  });

  it('包含关系下 Overlap=1 且 Jaccard=|A|/|B|', () => {
    const small = { name: 'S', elements: ['1', '2'] };
    const big = { name: 'L', elements: ['1', '2', '3', '4'] };
    const pair = computePair(small, big);
    expect(pair.overlap).toBe(1);
    expect(pair.jaccard).toBeCloseTo(0.5);
  });

  it('空集合除零保护：两空集合系数为 1，一空一非空为 0', () => {
    const bothEmpty = computePair(
      { name: 'E1', elements: [] },
      { name: 'E2', elements: [] },
    );
    expect(bothEmpty.jaccard).toBe(1);
    expect(bothEmpty.dice).toBe(1);
    expect(bothEmpty.overlap).toBe(1);

    const oneEmpty = computePair(
      { name: 'E', elements: [] },
      { name: 'N', elements: ['x'] },
    );
    expect(oneEmpty.jaccard).toBe(0);
    expect(oneEmpty.dice).toBe(0);
    expect(oneEmpty.overlap).toBe(0);
  });
});

describe('computeSimilarity', () => {
  it('生成对称 Jaccard 矩阵且对角线为 1', () => {
    const result = computeSimilarity([
      { name: 'A', elements: ['1', '2'] },
      { name: 'B', elements: ['2', '3'] },
      { name: 'C', elements: ['3', '4'] },
    ]);
    expect(result.pairs).toHaveLength(3);
    expect(result.matrix).toHaveLength(3);
    expect(result.matrix[0]![0]).toBe(1);
    expect(result.matrix[1]![1]).toBe(1);
    expect(result.matrix[2]![2]).toBe(1);
    expect(result.matrix[0]![1]).toBe(result.matrix[1]![0]);
    expect(result.matrix[0]![2]).toBe(0);
    expect(result.matrix[0]![1]).toBeCloseTo(1 / 3);
  });

  it('集合数小于 2 时无配对且矩阵只有对角线', () => {
    const result = computeSimilarity([{ name: 'A', elements: ['1'] }]);
    expect(result.pairs).toEqual([]);
    expect(result.matrix).toEqual([[1]]);
  });
});
