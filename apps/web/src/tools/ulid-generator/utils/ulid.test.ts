import { describe, it, expect } from 'vitest';
import {
  CROCKFORD_ALPHABET,
  RANDOM_LENGTH,
  TIME_LENGTH,
  ULID_LENGTH,
  TIME_MAX,
  createMonotonicUlidFactory,
  encodeRandom,
  encodeTime,
  generateUlid,
  generateUlidBatch,
  incrementRandom,
  parseUlid,
} from './ulid';

/** 固定字节提供器：循环返回固定序列，保证测试可复现 */
function fixedBytes(values: number[]): (length: number) => Uint8Array {
  return (length: number) =>
    Uint8Array.from({ length }, (_, index) => values[index % values.length] ?? 0);
}

describe('时间戳编码', () => {
  it('官方规范向量 1469918176385 → 01ARYZ6S41', () => {
    expect(encodeTime(1469918176385)).toBe('01ARYZ6S41');
  });

  it('0 与 48 位上界', () => {
    expect(encodeTime(0)).toBe('0'.repeat(TIME_LENGTH));
    expect(encodeTime(TIME_MAX)).toBe('7ZZZZZZZZZ');
  });

  it('超出 48 位范围或非法整数抛错', () => {
    expect(() => encodeTime(TIME_MAX + 1)).toThrow('2^48');
    expect(() => encodeTime(-1)).toThrow('2^48');
    expect(() => encodeTime(1.5)).toThrow('2^48');
  });
});

describe('随机段编码', () => {
  it('全零字节编码为 16 个 0', () => {
    expect(encodeRandom(new Uint8Array(10))).toBe('0'.repeat(RANDOM_LENGTH));
  });

  it('全 0xff 字节编码为 16 个 Z', () => {
    expect(encodeRandom(new Uint8Array(10).fill(0xff))).toBe('Z'.repeat(RANDOM_LENGTH));
  });

  it('字节数不是 10 时抛错', () => {
    expect(() => encodeRandom(new Uint8Array(9))).toThrow('10');
  });
});

describe('单调递增', () => {
  it('随机段加一：普通进位与跨字符进位', () => {
    expect(incrementRandom('0000000000000000')).toBe('0000000000000001');
    expect(incrementRandom('000000000000000Z')).toBe('0000000000000010');
    expect(incrementRandom('00000000000000ZZ')).toBe('0000000000000100');
  });

  it('80 位随机段溢出抛错', () => {
    expect(() => incrementRandom('Z'.repeat(RANDOM_LENGTH))).toThrow('进位');
  });

  it('同一毫秒连续生成严格递增，时间前进时重新随机', () => {
    let stamp = 1000;
    const factory = createMonotonicUlidFactory(fixedBytes([0x00, 0xff]));
    const first = factory(stamp);
    const second = factory(stamp);
    const third = factory(stamp + 1);
    expect(second > first).toBe(true);
    expect(third > second).toBe(true);
    expect(third.slice(0, TIME_LENGTH) > second.slice(0, TIME_LENGTH)).toBe(true);
  });

  it('时钟回拨抛错', () => {
    const factory = createMonotonicUlidFactory(fixedBytes([1]));
    factory(2000);
    expect(() => factory(1999)).toThrow('时钟回拨');
  });
});

describe('生成', () => {
  it('单个 ULID 固定 26 字符且仅含 Crockford 字符', () => {
    const id = generateUlid(1469918176385, fixedBytes([0xab]));
    expect(id).toHaveLength(ULID_LENGTH);
    expect(new Set([...id].filter((char) => !CROCKFORD_ALPHABET.includes(char)))).toEqual(
      new Set(),
    );
    expect(id.startsWith('01ARYZ6S41')).toBe(true);
  });

  it('批量生成结果严格升序', () => {
    const ids = generateUlidBatch(100, 5000);
    expect(ids).toHaveLength(100);
    for (let index = 1; index < ids.length; index += 1) {
      expect(ids[index]! > ids[index - 1]!).toBe(true);
    }
    expect(ids.every((id) => id.startsWith(encodeTime(5000)))).toBe(true);
  });

  it('批量数量边界校验', () => {
    expect(() => generateUlidBatch(0)).toThrow('1–500');
    expect(() => generateUlidBatch(501)).toThrow('1–500');
  });
});

describe('解析', () => {
  it('规范示例向量解析出时间戳与分段', () => {
    const parts = parseUlid('01ARYZ6S41TSV4RRFFQ69G5FAV');
    expect(parts.timestamp).toBe(1469918176385);
    expect(parts.timePart).toBe('01ARYZ6S41');
    expect(parts.randomPart).toBe('TSV4RRFFQ69G5FAV');
    expect(parts.randomHex).toHaveLength(20);
  });

  it('解析与生成往返一致（固定随机源）', () => {
    const id = generateUlid(1469918176385, fixedBytes([0x01, 0x23, 0x45, 0x67, 0x89]));
    const parts = parseUlid(id);
    expect(parts.timestamp).toBe(1469918176385);
    expect(encodeRandom(Uint8Array.from([1, 35, 69, 103, 137, 1, 35, 69, 103, 137]))).toBe(
      parts.randomPart,
    );
  });

  it('容忍大小写与首尾空白', () => {
    expect(parseUlid('  01aryz6s41tsv4rrffq69g5fav ').timestamp).toBe(1469918176385);
  });

  it('全零字节随机段往返为 16 个 0 与 20 位 0 十六进制', () => {
    const id = generateUlid(0, () => new Uint8Array(10));
    const parts = parseUlid(id);
    expect(parts.timestamp).toBe(0);
    expect(parts.randomPart).toBe('0'.repeat(RANDOM_LENGTH));
    expect(parts.randomHex).toBe('0'.repeat(20));
  });

  it('长度错误报明确错误', () => {
    expect(() => parseUlid('ABC')).toThrow('长度必须为 26');
  });

  it('包含 I/L/O/U 等非法字符报错', () => {
    const base = '01ARYZ6S41TSV4RRFFQ69G5FAV';
    expect(() => parseUlid(base.replace('T', 'I'))).toThrow('非法字符');
    expect(() => parseUlid(base.replace('T', 'L'))).toThrow('非法字符');
    expect(() => parseUlid(base.replace('T', 'O'))).toThrow('非法字符');
    expect(() => parseUlid(base.replace('T', 'U'))).toThrow('非法字符');
  });

  it('空输入报错', () => {
    expect(() => parseUlid('   ')).toThrow('请输入');
  });
});
