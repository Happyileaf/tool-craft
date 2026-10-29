import { describe, it, expect } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  decodeInput,
  deriveHkdf,
  hexToBytes,
} from './hkdf';

const IKM_0B_22 = '0b'.repeat(22);
const SALT_00_0C = '000102030405060708090a0b0c';
const INFO_F0_F9 = 'f0f1f2f3f4f5f6f7f8f9';

const RFC5869_CASE1_PRK =
  '077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5';
const RFC5869_CASE1_OKM =
  '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865';

const RFC5869_CASE3_PRK =
  '19ef24a32c717b167f33a91d6f648bdf96596776afdb6377ac434c1c293ccb04';
const RFC5869_CASE3_OKM =
  '8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8';

describe('deriveHkdf - RFC 5869 官方向量', () => {
  it('命中 SHA-256 Test Case 1（含 salt 与 info，L=42）', async () => {
    const result = await deriveHkdf(
      IKM_0B_22,
      'hex',
      SALT_00_0C,
      'hex',
      INFO_F0_F9,
      'hex',
      'SHA-256',
      42,
    );
    expect('error' in result).toBe(false);
    if ('prk' in result) {
      expect(result.prk).toBe(RFC5869_CASE1_PRK);
      expect(result.okm).toBe(RFC5869_CASE1_OKM);
      expect(result.okm).toHaveLength(84);
    }
  });

  it('命中 SHA-256 Test Case 3（零长 salt/info 使用默认全零 salt）', async () => {
    const result = await deriveHkdf(
      IKM_0B_22,
      'hex',
      '',
      'hex',
      '',
      'hex',
      'SHA-256',
      42,
    );
    expect('error' in result).toBe(false);
    if ('prk' in result) {
      expect(result.prk).toBe(RFC5869_CASE3_PRK);
      expect(result.okm).toBe(RFC5869_CASE3_OKM);
    }
  });

  it('文本载体按 UTF-8 解析，结果与等价 hex 一致', async () => {
    const textResult = await deriveHkdf(
      'secret',
      'text',
      'mysalt',
      'text',
      'myinfo',
      'text',
      'SHA-256',
      32,
    );
    const hexResult = await deriveHkdf(
      bytesToHex(new TextEncoder().encode('secret')),
      'hex',
      bytesToHex(new TextEncoder().encode('mysalt')),
      'hex',
      bytesToHex(new TextEncoder().encode('myinfo')),
      'hex',
      'SHA-256',
      32,
    );
    expect(textResult).toEqual(hexResult);
  });

  it('输出长度超过 255×HashLen 时报错', async () => {
    const result = await deriveHkdf(
      IKM_0B_22,
      'hex',
      SALT_00_0C,
      'hex',
      '',
      'hex',
      'SHA-256',
      255 * 32 + 1,
    );
    expect(result).toHaveProperty('error');
  });

  it('非法 hex 的 IKM 返回明确错误', async () => {
    const result = await deriveHkdf(
      '0b0',
      'hex',
      '',
      'hex',
      '',
      'hex',
      'SHA-256',
      32,
    );
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('IKM');
  });
});

describe('hexToBytes', () => {
  it('支持空白、0x 前缀与大小写', () => {
    const parsed = hexToBytes('0x0A 0b\n0C');
    expect(parsed.error).toBeNull();
    expect([...(parsed.bytes ?? [])]).toEqual([10, 11, 12]);
  });

  it('奇数位与非法字符报错', () => {
    expect(hexToBytes('abc').error).toContain('非法');
    expect(hexToBytes('zz').error).toContain('非法');
  });
});

describe('base64ToBytes', () => {
  it('标准 Base64 与 Base64URL 均可解析', () => {
    expect([...(base64ToBytes('AAEC+rv/').bytes ?? [])]).toEqual([
      0, 1, 2, 250, 187, 255,
    ]);
    expect([...(base64ToBytes('AAEC-rv_').bytes ?? [])]).toEqual([
      0, 1, 2, 250, 187, 255,
    ]);
  });

  it('非法填充报错', () => {
    expect(base64ToBytes('a').error).toContain('非法');
  });

  it('与 bytesToBase64 往返一致', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    expect(base64ToBytes(bytesToBase64(bytes)).bytes).toEqual(bytes);
  });
});

describe('decodeInput', () => {
  it('空文本得到零字节，空 hex 同样零字节', () => {
    expect(decodeInput('', 'text').bytes).toEqual(new Uint8Array(0));
    expect(decodeInput('', 'hex').bytes).toEqual(new Uint8Array(0));
  });
});
