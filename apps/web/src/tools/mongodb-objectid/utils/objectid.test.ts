import { describe, it, expect } from 'vitest';
import {
  normalizeObjectId,
  parseObjectId,
  generateObjectId,
  generateObjectIdBatch,
  COUNTER_MAX,
} from './objectid';

// 已知向量：时间戳部分 507f1f77 = 1350508407（2012-10-17 21:13:27 UTC）
const KNOWN_HEX = '507f1f77bcf86cd799439011';
const KNOWN_SECONDS = 0x507f1f77;

describe('parseObjectId', () => {
  it('decomposes a well-known ObjectId', () => {
    const parts = parseObjectId(KNOWN_HEX);
    expect(parts.hex).toBe(KNOWN_HEX);
    expect(parts.timestampSeconds).toBe(KNOWN_SECONDS);
    expect(parts.timestampMs).toBe(KNOWN_SECONDS * 1000);
    expect(parts.randomHex).toBe('bcf86cd799');
    expect(parts.machineHex).toBe('bcf86c');
    expect(parts.processId).toBe(0xd799);
    expect(parts.counter).toBe(0x439011);
  });

  it('creates the time in UTC correctly', () => {
    const parts = parseObjectId(KNOWN_HEX);
    expect(new Date(parts.timestampMs).toISOString()).toBe('2012-10-17T21:13:27.000Z');
  });

  it('accepts uppercase hex and surrounding whitespace', () => {
    const parts = parseObjectId(`  ${KNOWN_HEX.toUpperCase()}\n`);
    expect(parts.hex).toBe(KNOWN_HEX);
  });

  it('rejects empty input', () => {
    expect(() => parseObjectId('  ')).toThrow(/不能为空/);
  });

  it('rejects non-hex or wrong-length strings', () => {
    expect(() => parseObjectId('zz7f1f77bcf86cd799439011')).toThrow(/十六进制/);
    expect(() => parseObjectId('507f1f77bcf86cd79943901')).toThrow(/24 位/);
    expect(() => parseObjectId(`${KNOWN_HEX}aa`)).toThrow(/24 位/);
  });
});

describe('normalizeObjectId', () => {
  it('lowercases and trims', () => {
    expect(normalizeObjectId(` ${KNOWN_HEX.toUpperCase()} `)).toBe(KNOWN_HEX);
  });
});

describe('generateObjectId', () => {
  it('round-trips through parse with the given timestamp', () => {
    const hex = generateObjectId({ timestampSeconds: KNOWN_SECONDS });
    expect(hex).toHaveLength(24);
    expect(parseObjectId(hex).timestampSeconds).toBe(KNOWN_SECONDS);
  });

  it('honors fully specified parts deterministically', () => {
    const hex = generateObjectId({
      timestampSeconds: KNOWN_SECONDS,
      randomHex: 'bcf86cd799',
      counter: 0x439011,
    });
    expect(hex).toBe(KNOWN_HEX);
  });

  it('uses Web Crypto randomness when parts are omitted', () => {
    const a = generateObjectId();
    const b = generateObjectId();
    // 时间戳可能相同，但随机段/计数器几乎不可能连续相同
    expect(a).not.toBe(b);
  });

  it('rejects out-of-range timestamps', () => {
    expect(() => generateObjectId({ timestampSeconds: -1 })).toThrow(/时间戳/);
    expect(() => generateObjectId({ timestampSeconds: 0x100000000 })).toThrow(/时间戳/);
  });

  it('rejects malformed random segment and counter', () => {
    expect(() => generateObjectId({ randomHex: 'zzz' })).toThrow(/随机段/);
    expect(() => generateObjectId({ counter: COUNTER_MAX + 1 })).toThrow(/计数器/);
    expect(() => generateObjectId({ counter: -1 })).toThrow(/计数器/);
  });

  it('normalizes an uppercase random segment', () => {
    const hex = generateObjectId({
      timestampSeconds: 1,
      randomHex: 'BCF86CD799',
      counter: 0,
    });
    expect(hex).toBe('00000001bcf86cd799000000');
  });
});

describe('generateObjectIdBatch', () => {
  it('produces the requested count with a shared prefix and sequential counters', () => {
    const ids = generateObjectIdBatch(3, KNOWN_SECONDS);
    expect(ids).toHaveLength(3);
    const parsed = ids.map((id) => parseObjectId(id));
    // 前 18 位（时间戳 + 随机段）完全一致
    expect(ids[0]!.slice(0, 18)).toBe(ids[1]!.slice(0, 18));
    expect(ids[0]!.slice(0, 18)).toBe(ids[2]!.slice(0, 18));
    expect(parsed[1]!.counter).toBe(parsed[0]!.counter + 1);
    expect(parsed[2]!.counter).toBe(parsed[0]!.counter + 2);
  });

  it('rejects invalid counts', () => {
    expect(() => generateObjectIdBatch(0)).toThrow(/正整数/);
    expect(() => generateObjectIdBatch(1001)).toThrow(/1000/);
  });
});
