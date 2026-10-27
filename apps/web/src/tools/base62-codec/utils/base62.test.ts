import { describe, expect, it } from 'vitest';
import {
  ALTERNATE_ALPHABET,
  GMP_ALPHABET,
  bytesToHex,
  decodeBase62ToText,
  decodeInteger,
  decodeToBytes,
  encodeBytes,
  encodeInteger,
  encodeTextToBase62,
  parseInteger,
} from './base62';

describe('encodeInteger（整数模式编码，GMP 字母表）', () => {
  it('符合公认 Base62 向量', () => {
    expect(encodeInteger(BigInt(0))).toBe('0');
    expect(encodeInteger(BigInt(1))).toBe('1');
    expect(encodeInteger(BigInt(10))).toBe('A');
    expect(encodeInteger(BigInt(35))).toBe('Z');
    expect(encodeInteger(BigInt(36))).toBe('a');
    expect(encodeInteger(BigInt(61))).toBe('z');
    expect(encodeInteger(BigInt(62))).toBe('10');
    expect(encodeInteger(BigInt(255))).toBe('47');
    expect(encodeInteger(BigInt(256))).toBe('48');
    expect(encodeInteger(BigInt(99999))).toBe('Q0t');
    expect(encodeInteger(BigInt('18446744073709551615'))).toBe('LygHa16AHYF');
  });

  it('字母表恰好为 0-9A-Za-z 共 62 个不重复字符', () => {
    expect(GMP_ALPHABET).toHaveLength(62);
    expect(new Set(GMP_ALPHABET).size).toBe(62);
    expect(GMP_ALPHABET).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
  });

  it('负整数抛错', () => {
    expect(() => encodeInteger(BigInt(-1))).toThrow(/非负整数/);
  });
});

describe('encodeInteger（替代字母表 0-9a-zA-Z）', () => {
  it('大小写位置互换，数字区不受影响', () => {
    expect(encodeInteger(BigInt(10), { alphabet: 'alternate' })).toBe('a');
    expect(encodeInteger(BigInt(35), { alphabet: 'alternate' })).toBe('z');
    expect(encodeInteger(BigInt(36), { alphabet: 'alternate' })).toBe('A');
    expect(encodeInteger(BigInt(61), { alphabet: 'alternate' })).toBe('Z');
    expect(encodeInteger(BigInt(99999), { alphabet: 'alternate' })).toBe('q0T');
    expect(
      encodeInteger(BigInt('18446744073709551615'), { alphabet: 'alternate' }),
    ).toBe('lYGhA16ahyf');
    expect(ALTERNATE_ALPHABET).toBe(
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
  });
});

describe('parseInteger（整数解析）', () => {
  it('解析十进制与 0x 十六进制', () => {
    expect(parseInteger('256').value).toBe(BigInt(256));
    expect(parseInteger('  256 ').value).toBe(BigInt(256));
    expect(parseInteger('0x10').value).toBe(BigInt(16));
    expect(parseInteger('0XFF').value).toBe(BigInt(255));
  });

  it('允许千分位逗号与下划线分隔', () => {
    expect(parseInteger('1,000').value).toBe(BigInt(1000));
    expect(parseInteger('1_000').value).toBe(BigInt(1000));
  });

  it('空输入、非法格式与正负号给出错误', () => {
    expect(parseInteger('').error).toMatch(/请输入/);
    expect(parseInteger('abc').error).toMatch(/无法识别/);
    expect(parseInteger('-1').error).toMatch(/非负整数/);
    expect(parseInteger('+1').error).toMatch(/非负整数/);
    expect(parseInteger('1.5').value).toBeNull();
  });
});

describe('decodeInteger（整数模式解码）', () => {
  it.each([
    '0',
    '1',
    '10',
    'Q0t',
    'LygHa16AHYF',
    '7n42DGM5Tflk9n8mt7Fhc7',
  ])('编码后解码往返一致：%s', (encoded) => {
    const decoded = decodeInteger(encoded);
    expect(decoded.error).toBeNull();
    expect(encodeInteger(decoded.value as bigint)).toBe(encoded);
  });

  it('解码已知向量', () => {
    expect(decodeInteger('10').value).toBe(BigInt(62));
    expect(decodeInteger('48').value).toBe(BigInt(256));
  });

  it('替代字母表按对应字符表解码', () => {
    expect(decodeInteger('lYGhA16ahyf', { alphabet: 'alternate' }).value).toBe(
      BigInt('18446744073709551615'),
    );
  });

  it('字母表外字符报出具体位置', () => {
    const result = decodeInteger('a!z');
    expect(result.value).toBeNull();
    expect(result.error).toContain('位置 2');
  });

  it('空输入给出错误', () => {
    expect(decodeInteger('  ').error).toMatch(/请输入/);
  });

  it('两种字母表互不兼容：GMP 表解码 alt 风格串得到不同整数', () => {
    expect(decodeInteger('a').value).toBe(BigInt(36));
    expect(decodeInteger('a', { alphabet: 'alternate' }).value).toBe(BigInt(10));
  });
});

describe('encodeBytes / decodeToBytes（字节模式）', () => {
  it('经典向量：Hello World', () => {
    const bytes = new TextEncoder().encode('Hello World');
    expect(encodeBytes(bytes)).toBe('73XpUgyMwkGr29M');
  });

  it('保留前导零字节', () => {
    expect(encodeBytes(Uint8Array.from([0, 0, 1]))).toBe('001');
    const decoded = decodeToBytes('001');
    expect(decoded.error).toBeNull();
    expect(Array.from(decoded.bytes as Uint8Array)).toEqual([0, 0, 1]);
  });

  it('单字节 0x00 与空字节串边界', () => {
    expect(encodeBytes(Uint8Array.from([0]))).toBe('0');
    expect(encodeBytes(new Uint8Array())).toBe('');
    expect(decodeToBytes('').bytes).toEqual(new Uint8Array());
  });

  it('随机字节往返一致（含前导零）', () => {
    const cases: Uint8Array[] = [
      Uint8Array.from([0, 255, 0, 128, 1, 2]),
      Uint8Array.from([0, 0, 0, 255, 255, 255]),
      new TextEncoder().encode('Base62 支持中文与 emoji：🎉'),
      crypto.getRandomValues(new Uint8Array(64)),
    ];
    for (const bytes of cases) {
      const encoded = encodeBytes(bytes);
      const decoded = decodeToBytes(encoded);
      expect(decoded.error).toBeNull();
      expect(Array.from(decoded.bytes as Uint8Array)).toEqual(Array.from(bytes));
    }
  });

  it('替代字母表字节模式往返一致', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    const encoded = encodeBytes(bytes, { alphabet: 'alternate' });
    const decoded = decodeToBytes(encoded, { alphabet: 'alternate' });
    expect(Array.from(decoded.bytes as Uint8Array)).toEqual(Array.from(bytes));
  });

  it('非法字符报错', () => {
    expect(decodeToBytes('ab=cd').error).toContain('位置 3');
  });
});

describe('encodeTextToBase62 / decodeBase62ToText（文本便捷封装）', () => {
  it('文本往返一致', () => {
    for (const text of ['', 'a', 'Hello World', '短链 token：xT9Zq2']) {
      const encoded = encodeTextToBase62(text);
      const decoded = decodeBase62ToText(encoded);
      expect(decoded.error).toBeNull();
      expect(decoded.text).toBe(text);
    }
  });

  it('空文本编码为空串并可往返', () => {
    expect(encodeTextToBase62('')).toBe('');
    expect(decodeBase62ToText('').text).toBe('');
  });

  it('解码非 UTF-8 字节给出明确错误', () => {
    // 0xFF 单字节在两种字母表下都是 "47"，且不是合法 UTF-8
    const result = decodeBase62ToText('47');
    expect(result.text).toBeNull();
    expect(result.error).toMatch(/UTF-8/);
    expect(bytesToHex(decodeToBytes('47').bytes as Uint8Array)).toBe('ff');
  });
});
