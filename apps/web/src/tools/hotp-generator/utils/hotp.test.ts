import { describe, it, expect } from 'vitest';
import {
  base32Decode,
  hexDecode,
  textToKeyBytes,
  parseSecret,
  generateHotp,
  verifyHotp,
  RFC4226_SECRET_BASE32,
  RFC4226_VECTORS,
} from './hotp';

describe('密钥解析', () => {
  it('Base32 解码 RFC 4226 密钥得到 20 字节', () => {
    expect(base32Decode(RFC4226_SECRET_BASE32)).toHaveLength(20);
  });

  it('Base32 非法字符与空输入抛出错误', () => {
    expect(() => base32Decode('AB@C')).toThrowError(/非法字符/);
    expect(() => base32Decode('  ')).toThrowError(/输入为空/);
  });

  it('Hex 解码支持 0x 前缀与空白', () => {
    expect(Array.from(hexDecode('0x31 32'))).toEqual([0x31, 0x32]);
  });

  it('Hex 奇数长度与非法字符抛出错误', () => {
    expect(() => hexDecode('abc')).toThrowError(/偶数/);
    expect(() => hexDecode('zz')).toThrowError(/非十六进制/);
  });

  it('文本按 UTF-8 编码', () => {
    expect(Array.from(textToKeyBytes('12'))).toEqual([0x31, 0x32]);
    expect(() => textToKeyBytes('')).toThrowError(/输入为空/);
  });

  it('parseSecret 按格式分发', () => {
    expect(Array.from(parseSecret('3132', 'hex'))).toEqual([0x31, 0x32]);
    expect(Array.from(parseSecret('12', 'text'))).toEqual([0x31, 0x32]);
  });
});

describe('generateHotp - RFC 4226 附录 D 官方向量', () => {
  const secret = base32Decode(RFC4226_SECRET_BASE32);

  RFC4226_VECTORS.forEach(({ counter, code }) => {
    it(`counter ${counter} → ${code}`, async () => {
      await expect(generateHotp(secret, counter)).resolves.toBe(code);
    });
  });

  it('支持 8 位长度', async () => {
    const code6 = await generateHotp(secret, BigInt(0), { digits: 6 });
    const code8 = await generateHotp(secret, BigInt(0), { digits: 8 });
    expect(code8).toHaveLength(8);
    expect(code8.endsWith(code6)).toBe(true);
  });

  it('SHA-256 与 SHA-512 可生成且长度正确', async () => {
    const sha256 = await generateHotp(secret, BigInt(3), { algorithm: 'SHA-256' });
    const sha512 = await generateHotp(secret, BigInt(3), { algorithm: 'SHA-512' });
    expect(sha256).toHaveLength(6);
    expect(sha512).toHaveLength(6);
    expect(sha256).not.toBe(sha512);
  });

  it('位数越界与负计数器抛出错误', async () => {
    await expect(generateHotp(secret, BigInt(0), { digits: 5 })).rejects.toThrowError(
      /6 ~ 8/,
    );
    await expect(generateHotp(secret, BigInt(-1))).rejects.toThrowError(/非负整数/);
  });
});

describe('verifyHotp 窗口校验', () => {
  const secret = base32Decode(RFC4226_SECRET_BASE32);

  it('当前计数器精确命中，ahead = 0', async () => {
    const result = await verifyHotp(secret, '755224', BigInt(0), 0);
    expect(result).toEqual({ valid: true, ahead: 0, matchedCounter: BigInt(0) });
  });

  it('窗口内命中并返回前进步数', async () => {
    // 服务端计数器停在 0，用户提交 counter=2 的码，窗口 2
    const result = await verifyHotp(secret, '359152', BigInt(0), 2);
    expect(result.valid).toBe(true);
    expect(result.ahead).toBe(2);
    expect(result.matchedCounter).toBe(BigInt(2));
  });

  it('窗口外不通过', async () => {
    const result = await verifyHotp(secret, '969429', BigInt(0), 2);
    expect(result.valid).toBe(false);
    expect(result.ahead).toBe(-1);
  });

  it('非数字提交码直接拒绝', async () => {
    const result = await verifyHotp(secret, 'abcdef', BigInt(0), 5);
    expect(result.valid).toBe(false);
  });

  it('重放旧计数器码（窗口为 0）不通过', async () => {
    // 当前计数器已推进到 5，counter=0 的旧码不应再命中
    const result = await verifyHotp(secret, '755224', BigInt(5), 0);
    expect(result.valid).toBe(false);
  });

  it('非法窗口参数抛出错误', async () => {
    await expect(verifyHotp(secret, '755224', BigInt(0), -1)).rejects.toThrowError(
      /非负整数/,
    );
  });
});
