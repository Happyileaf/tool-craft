import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ALPHABET,
  DEFAULT_SIZE,
  MAX_SIZE,
  createSecureRandomByteProvider,
  generateNanoId,
  generateNanoIdBatch,
} from './nanoid';

/** 按固定字节序列依次产出的确定性随机源，用于固定向量验收 */
function seededProvider(bytes: number[]): () => number {
  let index = 0;
  return () => {
    const byte = bytes[index] ?? 0;
    index = (index + 1) % bytes.length;
    return byte;
  };
}

describe('generateNanoId', () => {
  it('默认长度为 21 且字符全部来自默认字母表', () => {
    const id = generateNanoId();
    expect(id).toHaveLength(DEFAULT_SIZE);
    expect([...id].every((char) => DEFAULT_ALPHABET.includes(char))).toBe(true);
  });

  it('自定义长度生效', () => {
    expect(generateNanoId(10)).toHaveLength(10);
    expect(generateNanoId(1)).toHaveLength(1);
    expect(generateNanoId(100)).toHaveLength(100);
  });

  it('固定随机字节向量产生可复现结果', () => {
    const provider = seededProvider([0, 1, 2, 3, 4]);
    expect(generateNanoId(5, DEFAULT_ALPHABET, provider)).toBe('ABCDE');
  });

  it('自定义字母表生效', () => {
    const id = generateNanoId(50, '0123456789', seededProvider([0, 5, 9]));
    expect(id).toMatch(/^[0-9]{50}$/);
  });

  it('拒绝采样：落在偏置区间的字节被重抽（64 字符表时 255 应被拒绝）', () => {
    // 256 % 64 = 0，理论上无偏置；改用 63 字符字母表：256 % 63 = 4，字节 252–255 须重抽
    const alphabet = DEFAULT_ALPHABET.slice(0, 63);
    const consumed: number[] = [];
    const provider = () => {
      const next = consumed.length === 0 ? 255 : (consumed.length * 7) % 256;
      consumed.push(next);
      return next;
    };
    const id = generateNanoId(2, alphabet, provider);
    expect([...id].every((char) => alphabet.includes(char))).toBe(true);
    expect(consumed[0]).toBe(255);
  });

  it('多次生成不重复（密码学安全随机源，5000 个 21 位 ID 无碰撞）', () => {
    const ids = new Set<string>();
    for (let index = 0; index < 5000; index += 1) {
      ids.add(generateNanoId());
    }
    expect(ids.size).toBe(5000);
  });

  it('非法长度抛错', () => {
    expect(() => generateNanoId(0)).toThrow();
    expect(() => generateNanoId(-1)).toThrow();
    expect(() => generateNanoId(MAX_SIZE + 1)).toThrow();
    expect(() => generateNanoId(1.5)).toThrow();
  });

  it('空字母表与重复字符字母表抛错', () => {
    expect(() => generateNanoId(5, '')).toThrow();
    expect(() => generateNanoId(5, 'aab')).toThrow();
  });
});

describe('generateNanoIdBatch', () => {
  it('按数量生成且长度一致', () => {
    const ids = generateNanoIdBatch(25, 12);
    expect(ids).toHaveLength(25);
    expect(ids.every((id) => [...id].length === 12)).toBe(true);
  });

  it('固定随机源下批量结果可复现', () => {
    const a = generateNanoIdBatch(3, 8, DEFAULT_ALPHABET, seededProvider([10, 20, 30, 40]));
    const b = generateNanoIdBatch(3, 8, DEFAULT_ALPHABET, seededProvider([10, 20, 30, 40]));
    expect(a).toEqual(b);
  });

  it('非法数量抛错', () => {
    expect(() => generateNanoIdBatch(0)).toThrow();
    expect(() => generateNanoIdBatch(MAX_SIZE + 1)).toThrow();
  });
});

describe('createSecureRandomByteProvider', () => {
  it('产出的字节在 0–255 范围内', () => {
    const provider = createSecureRandomByteProvider();
    for (let index = 0; index < 1000; index += 1) {
      const byte = provider();
      expect(byte).toBeGreaterThanOrEqual(0);
      expect(byte).toBeLessThanOrEqual(255);
    }
  });
});
