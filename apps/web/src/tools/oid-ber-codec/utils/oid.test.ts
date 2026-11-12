import { describe, expect, it } from 'vitest';
import {
  bytesToHex,
  decodeOidContent,
  decodeOidTlv,
  encodeLength,
  encodeOidContent,
  encodeOidTlv,
  parseDottedOid,
  parseHexBytes,
} from './oid';

describe('parseDottedOid', () => {
  it('parses a normal dotted OID', () => {
    expect(parseDottedOid('1.2.840.113549')).toEqual([1, 2, 840, 113549]);
  });

  it('rejects empty input', () => {
    expect(() => parseDottedOid('   ')).toThrow('不能为空');
  });

  it('rejects a single arc', () => {
    expect(() => parseDottedOid('1')).toThrow('至少需要两个弧');
  });

  it('rejects non-numeric arc', () => {
    expect(() => parseDottedOid('1.a.3')).toThrow('不是非负整数');
  });

  it('rejects first arc greater than 2', () => {
    expect(() => parseDottedOid('3.10')).toThrow('第一个弧只能是 0、1 或 2');
  });

  it('rejects second arc >= 40 when first arc is 0 or 1', () => {
    expect(() => parseDottedOid('0.40')).toThrow('第二个弧必须小于 40');
    expect(() => parseDottedOid('1.40')).toThrow('第二个弧必须小于 40');
  });

  it('allows large second arc when first arc is 2', () => {
    expect(parseDottedOid('2.100.3')).toEqual([2, 100, 3]);
  });
});

describe('encodeBase128 / encodeOidContent', () => {
  it('encodes the canonical 1.2 -> single byte 0x2a', () => {
    expect(encodeOidContent([1, 2])).toEqual([0x2a]);
  });

  it('encodes 2.100 -> 81 34 (base-128 continuation)', () => {
    expect(encodeOidContent([2, 100])).toEqual([0x81, 0x34]);
  });

  it('encodes RSA OID 1.2.840.113549 -> 2a 86 48 86 f7 0d', () => {
    expect(bytesToHex(encodeOidContent([1, 2, 840, 113549]))).toBe('2a 86 48 86 f7 0d');
  });

  it('encodes 840 as 86 48 across two bytes', () => {
    // 40*1+2 = 42 (0x2a); 840 = 0x348 -> base128: 0x86 0x48
    expect(encodeOidContent([1, 2, 840])).toEqual([0x2a, 0x86, 0x48]);
  });
});

describe('encodeLength', () => {
  it('uses short form below 128', () => {
    expect(encodeLength(5)).toEqual([5]);
    expect(encodeLength(127)).toEqual([127]);
  });

  it('uses long form at 128', () => {
    expect(encodeLength(128)).toEqual([0x81, 0x80]);
  });

  it('uses two length bytes for 300', () => {
    expect(encodeLength(300)).toEqual([0x82, 0x01, 0x2c]);
  });
});

describe('encodeOidTlv', () => {
  it('builds a complete TLV for 1.2', () => {
    expect(bytesToHex(encodeOidTlv('1.2'))).toBe('06 01 2a');
  });

  it('builds a complete TLV for the RSA OID', () => {
    expect(bytesToHex(encodeOidTlv('1.2.840.113549'))).toBe('06 06 2a 86 48 86 f7 0d');
  });
});

describe('parseHexBytes', () => {
  it('accepts spaced, comma and 0x-prefixed hex', () => {
    expect(parseHexBytes('06 01,2a')).toEqual([6, 1, 42]);
    expect(parseHexBytes('0x06 0x01 0x2a')).toEqual([6, 1, 42]);
  });

  it('rejects odd-length and non-hex input', () => {
    expect(() => parseHexBytes('abc')).toThrow('偶数');
    expect(() => parseHexBytes('zz')).toThrow('非十六进制字符');
  });
});

describe('decodeOidContent', () => {
  it('decodes 2a back to 1.2', () => {
    expect(decodeOidContent([0x2a])).toEqual([1, 2]);
  });

  it('decodes 81 34 back to 2.100', () => {
    expect(decodeOidContent([0x81, 0x34])).toEqual([2, 100]);
  });

  it('decodes the RSA content bytes', () => {
    expect(decodeOidContent([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d])).toEqual([
      1, 2, 840, 113549,
    ]);
  });

  it('rejects a dangling continuation byte', () => {
    expect(() => decodeOidContent([0x86])).toThrow('缺少结束字节');
  });
});

describe('decodeOidTlv', () => {
  it('round-trips the RSA OID through full TLV', () => {
    const result = decodeOidTlv('06 06 2a 86 48 86 f7 0d');
    expect(result.dotted).toBe('1.2.840.113549');
    expect(result.arcs).toEqual([1, 2, 840, 113549]);
    expect(result.contentHex).toBe('2a 86 48 86 f7 0d');
  });

  it('rejects wrong tag', () => {
    expect(() => decodeOidTlv('04 01 2a')).toThrow('Tag 应为 0x06');
  });

  it('rejects length mismatch', () => {
    expect(() => decodeOidTlv('06 02 2a')).toThrow('长度字段声明');
  });

  it('supports long-form length', () => {
    // content 2a with long-form length 81 01
    const result = decodeOidTlv('06 81 01 2a');
    expect(result.dotted).toBe('1.2');
  });

  it('round-trips encode then decode for a deep OID', () => {
    const original = '2.999.123456.7.8901234';
    const tlv = bytesToHex(encodeOidTlv(original));
    expect(decodeOidTlv(tlv).dotted).toBe(original);
  });
});
