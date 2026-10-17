import { describe, it, expect } from 'vitest';
import {
  base32Decode,
  generateTotp,
  getCounter,
  getRemainingSeconds,
} from './totp';

describe('base32Decode', () => {
  it('把 20 字节密钥解码为原始 ASCII 字节', () => {
    const bytes = base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(bytes.length).toBe(20);
    expect(Array.from(bytes)).toEqual(
      Array.from(new TextEncoder().encode('12345678901234567890')),
    );
  });

  it('忽略空白与尾部填充符', () => {
    const bytes = base32Decode(' gezd gnbv gy3t qojq = ');
    expect(bytes.length).toBe(10);
  });

  it('遇到非法字符抛出 Base32 错误', () => {
    expect(() => base32Decode('ABC1')).toThrowError(/Base32/);
  });

  it('空输入抛出 Base32 错误', () => {
    expect(() => base32Decode('   = ')).toThrowError(/Base32/);
  });
});

describe('generateTotp（RFC 6238 附录 B 测试向量，T = 59s）', () => {
  const timestampMs = 59_000;

  it('SHA-1 20 字节密钥生成 8 位验证码', async () => {
    const secret = new TextEncoder().encode('12345678901234567890');
    await expect(
      generateTotp(secret, { timestampMs, digits: 8, algorithm: 'SHA-1' }),
    ).resolves.toBe('94287082');
  });

  it('SHA-1 20 字节密钥生成 6 位验证码', async () => {
    const secret = new TextEncoder().encode('12345678901234567890');
    await expect(
      generateTotp(secret, { timestampMs, digits: 6, algorithm: 'SHA-1' }),
    ).resolves.toBe('287082');
  });

  it('SHA-256 32 字节密钥生成 8 位验证码', async () => {
    const secret = new TextEncoder().encode(
      '12345678901234567890123456789012',
    );
    await expect(
      generateTotp(secret, { timestampMs, digits: 8, algorithm: 'SHA-256' }),
    ).resolves.toBe('46119246');
  });

  it('SHA-512 64 字节密钥生成 8 位验证码', async () => {
    const secret = new TextEncoder().encode(
      '1234567890123456789012345678901234567890123456789012345678901234',
    );
    await expect(
      generateTotp(secret, { timestampMs, digits: 8, algorithm: 'SHA-512' }),
    ).resolves.toBe('90693936');
  });
});

describe('getCounter / getRemainingSeconds', () => {
  it('按 30 秒步长把 T=59s 折算为计数器 1', () => {
    expect(getCounter(59_000, 30)).toBe(1);
  });

  it('T=59s 时本步剩余 1 秒', () => {
    expect(getRemainingSeconds(59_000, 30)).toBe(1);
  });
});
