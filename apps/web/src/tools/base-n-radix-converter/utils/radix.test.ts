import { describe, expect, it } from 'vitest';
import {
  CROCKFORD_ALPHABET,
  DEFAULT_ALPHABET,
  convertRadix,
  convertToCommonBases,
  formatBigInt,
  groupDigits,
  normalizeInput,
  parseBigInt,
  validateAlphabet,
} from './radix';

describe('validateAlphabet', () => {
  it('标准字母表与 Crockford 字母表合法', () => {
    expect(validateAlphabet(DEFAULT_ALPHABET)).toBe(true);
    expect(validateAlphabet(CROCKFORD_ALPHABET)).toBe(true);
  });

  it('长度不足或字符重复时非法', () => {
    expect(validateAlphabet('0')).toBe(false);
    expect(validateAlphabet('0101')).toBe(false);
  });
});

describe('normalizeInput', () => {
  it('识别 0x/0o/0b 前缀并覆盖回退进制', () => {
    expect(normalizeInput('0xFF', 10)).toMatchObject({ radix: 16, digits: 'ff' });
    expect(normalizeInput('0o777', 10)).toMatchObject({ radix: 8, digits: '777' });
    expect(normalizeInput('0b1010', 10)).toMatchObject({ radix: 2, digits: '1010' });
  });

  it('处理负号、加号与下划线分隔', () => {
    expect(normalizeInput('-1_000', 10)).toMatchObject({ negative: true, digits: '1000' });
    expect(normalizeInput('+10', 2)).toMatchObject({ negative: false, radix: 2, digits: '10' });
  });
});

describe('parseBigInt / formatBigInt', () => {
  it('大整数超出 2^53 不丢精度', () => {
    const big = '18446744073709551615';
    const value = parseBigInt(big, 10);
    expect(value).toBe(BigInt('18446744073709551615'));
    expect(formatBigInt(value, 10)).toBe(big);
  });

  it('255 在各进制下的经典表示', () => {
    const value = parseBigInt('255', 10);
    expect(formatBigInt(value, 2)).toBe('11111111');
    expect(formatBigInt(value, 8)).toBe('377');
    expect(formatBigInt(value, 16)).toBe('ff');
  });

  it('零与负数处理', () => {
    expect(formatBigInt(BigInt(0), 16)).toBe('0');
    expect(formatBigInt(BigInt(-255), 16)).toBe('-ff');
    expect(parseBigInt('0', 2)).toBe(BigInt(0));
  });

  it('拒绝字母表外字符', () => {
    expect(() => parseBigInt('102', 2)).toThrow();
    expect(() => parseBigInt('zz', 16)).toThrow();
  });

  it('进制超出字母表范围时报错', () => {
    expect(() => parseBigInt('10', 37)).toThrow();
    expect(() => parseBigInt('10', 1)).toThrow();
  });
});

describe('convertRadix', () => {
  it('十进制 255 → 二进制', () => {
    const result = convertRadix({ input: '255', fromRadix: 10, toRadix: 2 });
    expect(result.output).toBe('11111111');
    expect(result.decimalValue).toBe(BigInt(255));
  });

  it('十六进制 ff 带前缀 → 十进制', () => {
    const result = convertRadix({ input: '0xff', fromRadix: 10, toRadix: 10 });
    expect(result.output).toBe('255');
    expect(result.effectiveRadix).toBe(16);
  });

  it('支持 2–36 全范围（base36）', () => {
    const result = convertRadix({ input: 'zz', fromRadix: 36, toRadix: 10 });
    expect(result.output).toBe('1295');
  });

  it('负数跨进制保持符号', () => {
    const result = convertRadix({ input: '-255', fromRadix: 10, toRadix: 16 });
    expect(result.output).toBe('-ff');
    expect(result.negative).toBe(true);
  });

  it('自定义 Crockford Base32 字母表编码', () => {
    const result = convertRadix({
      input: '1234',
      fromRadix: 10,
      toRadix: 32,
      toAlphabet: CROCKFORD_ALPHABET,
    });
    // 1234 的标准 base32 = crockford base32（数值相同，字母表不同位置）
    expect(result.decimalValue).toBe(BigInt(1234));
    expect(parseBigInt(result.output, 32, CROCKFORD_ALPHABET)).toBe(BigInt(1234));
  });

  it('拒绝小于 2 的进制', () => {
    expect(() => convertRadix({ input: '10', fromRadix: 1, toRadix: 10 })).toThrow();
  });
});

describe('convertToCommonBases', () => {
  it('一次输出四种常用进制', () => {
    const rows = convertToCommonBases('255', 10);
    expect(rows).toHaveLength(4);
    expect(rows.find((row) => row.radix === 2)?.value).toBe('11111111');
    expect(rows.find((row) => row.radix === 8)?.value).toBe('377');
    expect(rows.find((row) => row.radix === 10)?.value).toBe('255');
    expect(rows.find((row) => row.radix === 16)?.value).toBe('ff');
  });

  it('2^64-1 四进制视图均无精度损失', () => {
    const rows = convertToCommonBases('18446744073709551615', 10);
    expect(rows.find((row) => row.radix === 16)?.value).toBe('ffffffffffffffff');
    expect(rows.find((row) => row.radix === 2)?.value).toHaveLength(64);
  });
});

describe('groupDigits', () => {
  it('按 4 位分组二进制', () => {
    expect(groupDigits('11111111', 4)).toBe('1111 1111');
  });

  it('负数分组保留符号', () => {
    expect(groupDigits('-11111111', 4)).toBe('-1111 1111');
  });
});
