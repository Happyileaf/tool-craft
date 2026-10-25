import { describe, it, expect } from 'vitest';
import {
  BITCOIN_ALPHABET,
  FLICKR_ALPHABET,
  RIPPLE_ALPHABET,
  bytesToHex,
  decodeBase58,
  decodeBase58Check,
  decodeBase58ToText,
  encodeBase58,
  encodeBase58Check,
  encodeTextToBase58,
  hexToBytes,
} from './base58';

describe('encodeBase58（比特币社区标准向量）', () => {
  it('命中 hex → Base58 标准用例（含前导零保留）', () => {
    const cases: [string, string][] = [
      ['', ''],
      ['61', '2g'],
      ['626262', 'a3gV'],
      ['636363', 'aPEr'],
      ['73696d706c792061206c6f6e6720737472696e67', '2cFupjhnEsSn59qHXstmK2ffpLv2'],
      ['00eb15231dfceb60925886b67d065299925915aeb172c06647', '1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L'],
      ['516b6fcd0f', 'ABnLTmg'],
      ['bf4f89001e670274dd', '3SEo3LWLoPntC'],
      ['572e4794', '3EFU7m'],
      ['ecac89cad93923c02321', 'EJDM8drfXA6uyA'],
      ['10c8511e', 'Rt5zm'],
      ['00000000000000000000', '1111111111'],
    ];

    for (const [hex, expected] of cases) {
      const parsed = hexToBytes(hex);
      expect(parsed.error).toBeNull();
      expect(encodeBase58(parsed.bytes!)).toBe(expected);
    }
  });

  it('文本按 UTF-8 编码并往返一致（含中文）', () => {
    const encoded = encodeTextToBase58('Hello Base58 你好');
    expect(encoded).toMatch(new RegExp(`^[${BITCOIN_ALPHABET}]+$`));
    expect(decodeBase58ToText(encoded).text).toBe('Hello Base58 你好');
  });
});

describe('decodeBase58', () => {
  it('标准向量往返回 hex', () => {
    expect(bytesToHex(decodeBase58('2g').bytes!)).toBe('61');
    expect(bytesToHex(decodeBase58('a3gV').bytes!)).toBe('626262');
    expect(
      bytesToHex(decodeBase58('1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L').bytes!),
    ).toBe('00eb15231dfceb60925886b67d065299925915aeb172c06647');
  });

  it('空串解码为空字节', () => {
    expect(decodeBase58('  ').bytes).toHaveLength(0);
  });

  it('字母表外字符报错并给出位置（0 O I l）', () => {
    const result = decodeBase58('2g0');
    expect(result.error).toContain('非法 Base58 字符');
    expect(result.error).toContain('位置 3');
  });

  it('非 UTF-8 字节转文本时给出友好错误', () => {
    const invalidUtf8 = encodeBase58(new Uint8Array([0xff, 0xfe]));
    expect(decodeBase58ToText(invalidUtf8).error).toContain('UTF-8');
  });
});

describe('Flickr / Ripple 字母表', () => {
  it('flickr 与 ripple 字母表均为 58 字符且无重复', () => {
    for (const alphabet of [FLICKR_ALPHABET, RIPPLE_ALPHABET]) {
      expect(alphabet).toHaveLength(58);
      expect(new Set(alphabet).size).toBe(58);
    }
  });

  it('两种字母表各自往返一致', () => {
    const bytes = new TextEncoder().encode('roundtrip 测试 123');
    for (const kind of ['flickr', 'ripple'] as const) {
      const encoded = encodeBase58(bytes, { alphabet: kind });
      const decoded = decodeBase58(encoded, { alphabet: kind });
      expect(decoded.error).toBeNull();
      expect(bytesToHex(decoded.bytes!)).toBe(bytesToHex(bytes));
    }
  });
});

describe('Base58Check', () => {
  const address = '1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs';

  it('解码比特币主网 P2PKH 地址：版本 0x00 且重编码一致', async () => {
    const result = await decodeBase58Check(address);
    expect(result.error).toBeNull();
    expect(result.version).toBe(0);
    expect(result.payload).toHaveLength(20);
    const reEncoded = await encodeBase58Check(result.payload!, result.version!);
    expect(reEncoded).toBe(address);
  });

  it('自造载荷（version=5、20 字节）编码后解码还原', async () => {
    const { bytes } = hexToBytes('a1b2c3d4e5f60718293a4b5c6d7e8f9001122334');
    const encoded = await encodeBase58Check(bytes!, 5);
    expect(encoded[0]).not.toBe('0');
    const decoded = await decodeBase58Check(encoded);
    expect(decoded.version).toBe(5);
    expect(bytesToHex(decoded.payload!)).toBe(bytesToHex(bytes!));
  });

  it('篡改一个字符后校验和失败', async () => {
    const tampered = `${address.slice(0, -1)}${
      address[address.length - 1] === 's' ? 'z' : 's'
    }`;
    const result = await decodeBase58Check(tampered);
    expect(result.error).toContain('校验和不匹配');
  });

  it('过短输入报错', async () => {
    const result = await decodeBase58Check('2g');
    expect(result.error).toContain('数据过短');
  });

  it('非法版本字节抛错', async () => {
    await expect(
      encodeBase58Check(new Uint8Array([1, 2, 3]), 256),
    ).rejects.toThrow('版本字节');
  });
});

describe('hexToBytes / bytesToHex', () => {
  it('支持 0x 前缀、空白与大小写', () => {
    expect(bytesToHex(hexToBytes('0xFF 0a').bytes!)).toBe('ff0a');
  });

  it('非法字符与奇数长度报错', () => {
    expect(hexToBytes('xyz').error).toContain('0-9a-f');
    expect(hexToBytes('abc').error).toContain('偶数');
  });
});
