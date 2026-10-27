import { describe, it, expect } from 'vitest';
import {
  randomIntBelow,
  randomIntInRange,
  randomIntegers,
  shuffle,
  sampleItems,
  splitIntoGroups,
  parseLines,
} from './random';

/** 返回固定序列的伪随机源，按顺序回放给定 Uint32 值 */
function seededRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
}

describe('randomIntBelow', () => {
  it('拒绝采样：落在拒绝区时重取，结果始终小于上界', () => {
    // 上界 3 时 threshold = 3 * floor(2^32 / 3) = 4294967295，
    // 4294967295 落在拒绝区必须重取
    const random = seededRandom([4294967295, 4]);
    expect(randomIntBelow(3, random)).toBe(1);
  });

  it('上界为 2^32 时直接返回随机值', () => {
    const random = seededRandom([0xffffffff]);
    expect(randomIntBelow(0x100000000, random)).toBe(0xffffffff);
  });

  it('非法上界抛错', () => {
    expect(() => randomIntBelow(0)).toThrow();
    expect(() => randomIntBelow(-1)).toThrow();
    expect(() => randomIntBelow(1.5)).toThrow();
  });
});

describe('randomIntInRange', () => {
  it('结果落在闭区间 [min, max]', () => {
    const random = seededRandom([0, 1, 2, 99, 0xffffffff]);
    for (let i = 0; i < 5; i += 1) {
      const value = randomIntInRange(10, 20, random);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it('min === max 时恒等于该值', () => {
    const random = seededRandom([0xffffffff, 0]);
    expect(randomIntInRange(7, 7, random)).toBe(7);
    expect(randomIntInRange(7, 7, random)).toBe(7);
  });

  it('min > max 抛错', () => {
    expect(() => randomIntInRange(5, 4)).toThrow();
  });
});

describe('randomIntegers', () => {
  it('允许重复时返回指定数量且全部在区间内', () => {
    const result = randomIntegers(1, 6, 100, true, seededRandom(new Array(200).fill(0)));
    expect(result).toHaveLength(100);
    expect(result.every((v) => v >= 1 && v <= 6)).toBe(true);
  });

  it('不重复时无重复且数量正确（小区间穷举）', () => {
    const seq: number[] = [];
    for (let i = 0; i < 1000; i += 1) {
      seq.push((i * 2654435761) >>> 0);
    }
    const result = randomIntegers(1, 10, 10, false, seededRandom(seq));
    expect(result).toHaveLength(10);
    expect(new Set(result).size).toBe(10);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('不重复但数量超过区间宽度抛错', () => {
    expect(() => randomIntegers(1, 3, 4, false)).toThrow();
  });

  it('非法数量抛错', () => {
    expect(() => randomIntegers(1, 3, 0)).toThrow();
  });
});

describe('shuffle', () => {
  it('返回新数组且不修改原数组', () => {
    const original = [1, 2, 3, 4];
    const snapshot = original.slice();
    const result = shuffle(original, seededRandom([0, 0, 0]));
    expect(original).toEqual(snapshot);
    expect(result).not.toBe(original);
  });

  it('保持元素多重集合不变', () => {
    const seq = Array.from({ length: 50 }, (_, i) => (i * 1103515245 + 12345) >>> 0);
    const result = shuffle(['a', 'b', 'c', 'd', 'e', 'f'], seededRandom(seq));
    expect(result.slice().sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('空数组与单元素数组正确处理', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42], seededRandom([0]))).toEqual([42]);
  });
});

describe('sampleItems', () => {
  it('不放回抽取 k 个且无重复', () => {
    const items = ['甲', '乙', '丙', '丁', '戊'];
    const seq = Array.from({ length: 30 }, (_, i) => (i * 22695477 + 1) >>> 0);
    const picked = sampleItems(items, 3, seededRandom(seq));
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    expect(picked.every((item) => items.includes(item))).toBe(true);
  });

  it('k 超过候选数量抛错', () => {
    expect(() => sampleItems([1, 2], 3)).toThrow();
  });

  it('k 为 0 返回空数组', () => {
    expect(sampleItems([1, 2, 3], 0)).toEqual([]);
  });
});

describe('splitIntoGroups', () => {
  it('分组并集等于原名单且组大小相差至多 1', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const seq = Array.from({ length: 50 }, (_, i) => (i * 1664525 + 1013904223) >>> 0);
    const groups = splitIntoGroups(items, 3, seededRandom(seq));
    expect(groups).toHaveLength(3);
    expect(groups.flat().sort()).toEqual(items.slice().sort());
    expect(new Set(groups.flat()).size).toBe(7);
    const sizes = groups.map((group) => group.length).sort((a, b) => b - a);
    expect(sizes).toEqual([3, 2, 2]);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('组数大于元素数量或非正数抛错', () => {
    expect(() => splitIntoGroups([1], 2)).toThrow();
    expect(() => splitIntoGroups([1, 2], 0)).toThrow();
  });
});

describe('parseLines', () => {
  it('按行拆分并去除空行与首尾空白', () => {
    expect(parseLines(' 张三 \n\n 李四\r\n王五 ')).toEqual(['张三', '李四', '王五']);
    expect(parseLines('')).toEqual([]);
  });
});
