import { describe, it, expect } from 'vitest';
import {
  computeAllHashes,
  djb2,
  fnv1_32,
  fnv1_64,
  fnv1a_32,
  fnv1a_64,
  javaHashCode,
  murmurhash3_32,
  sdbm,
} from './hash';

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('FNV-1 / FNV-1a 权威向量', () => {
  it('FNV-1a 32 位：空串为 offset basis', () => {
    expect(fnv1a_32(utf8(''))).toBe(0x811c9dc5);
  });

  it('FNV-1 32 位：空串为 offset basis', () => {
    expect(fnv1_32(utf8(''))).toBe(0x811c9dc5);
  });

  it('FNV-1a 32 位："foobar"', () => {
    expect(fnv1a_32(utf8('foobar'))).toBe(0xbf9cf968);
  });

  it('FNV-1 32 位："foobar"', () => {
    expect(fnv1_32(utf8('foobar'))).toBe(0x31f0b262);
  });

  it('FNV-1a 64 位：空串与 "foobar"', () => {
    expect(fnv1a_64(utf8(''))).toBe(BigInt('0xcbf29ce484222325'));
    expect(fnv1a_64(utf8('foobar'))).toBe(BigInt('0x85944171f73967e8'));
  });

  it('FNV-1 64 位：空串与 "foobar"', () => {
    expect(fnv1_64(utf8(''))).toBe(BigInt('0xcbf29ce484222325'));
    expect(fnv1_64(utf8('foobar'))).toBe(BigInt('0x340d8765a4dda9c2'));
  });
});

describe('MurmurHash3 x86 32 位', () => {
  it('空串与权威测试串', () => {
    expect(murmurhash3_32(utf8(''))).toBe(0x00000000);
    expect(murmurhash3_32(utf8('0'))).toBe(0xd271c07f);
    expect(murmurhash3_32(utf8('Hello, world!'))).toBe(0xc0363e43);
    expect(murmurhash3_32(utf8('The quick brown fox jumps over the lazy dog'))).toBe(0x2e4ff723);
  });

  it('带种子的结果与默认种子不同', () => {
    const seeded = murmurhash3_32(utf8('test'), 42);
    expect(seeded).not.toBe(murmurhash3_32(utf8('test'), 0));
    expect(seeded).toBeGreaterThan(0);
  });
});

describe('djb2 与 sdbm', () => {
  it('djb2 经典向量', () => {
    expect(djb2(utf8(''))).toBe(5381);
    expect(djb2(utf8('a'))).toBe(177670);
    expect(djb2(utf8('foo'))).toBe(193491849);
  });

  it('sdbm 空串与 "test"', () => {
    expect(sdbm(utf8(''))).toBe(0);
    expect(sdbm(utf8('test'))).toBe(0x4745d132);
  });
});

describe('Java String.hashCode()', () => {
  it('空串、"test"、"Aa" 与 "BB" 碰撞向量', () => {
    expect(javaHashCode('')).toBe(0);
    expect(javaHashCode('test')).toBe(3556498);
    expect(javaHashCode('Aa')).toBe(javaHashCode('BB'));
    expect(javaHashCode('Aa')).toBe(2112);
  });

  it('可以为负数（有符号 32 位）', () => {
    expect(javaHashCode('AaAaAaAa')).toBe(-540425984);
  });
});

describe('UTF-8 编码与批量结果', () => {
  it('非 ASCII 文本按 UTF-8 字节计算', () => {
    expect(fnv1a_32(utf8('中文'))).toBe(fnv1a_32(utf8('中文')));
    expect(fnv1a_32(utf8('é'))).toBe(0x1e9de8c1);
  });

  it('computeAllHashes 返回全部 8 个算法及十进制/十六进制', () => {
    const results = computeAllHashes('foobar');
    expect(results).toHaveLength(8);
    expect(results.map((item) => item.id)).toEqual([
      'fnv1-32',
      'fnv1a-32',
      'fnv1-64',
      'fnv1a-64',
      'murmurhash3-32',
      'djb2',
      'sdbm',
      'java-hashcode',
    ]);
    const fnv1a64 = results.find((item) => item.id === 'fnv1a-64');
    expect(fnv1a64?.hex).toBe('85944171f73967e8');
    expect(fnv1a64?.decimal).toBe(BigInt('0x85944171f73967e8').toString(10));
    const fnv1a32 = results.find((item) => item.id === 'fnv1a-32');
    expect(fnv1a32?.hex).toBe('bf9cf968');
  });

  it('空串时 FNV 结果为 offset basis，十六进制补齐到固定位宽', () => {
    const results = computeAllHashes('');
    expect(results.find((item) => item.id === 'fnv1a-32')?.hex).toBe('811c9dc5');
    expect(results.find((item) => item.id === 'fnv1a-64')?.hex).toBe('cbf29ce484222325');
    expect(results.find((item) => item.id === 'murmurhash3-32')?.hex).toBe('00000000');
  });
});
