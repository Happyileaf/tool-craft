import { describe, expect, it } from 'vitest';
import {
  bytesToHex,
  decodeOid,
  encodeOid,
  hexToBytes,
  lookupOidName,
  wrapDerTlv,
} from './oid';

describe('encodeOid', () => {
  it('RFC 标准向量 1.2.840.113549.1.1.11 -> 2A864886F70D01010B', () => {
    const result = encodeOid('1.2.840.113549.1.1.11');
    expect(result.ok).toBe(true);
    expect(result.hex).toBe('2A864886F70D01010B');
  });

  it('常见短 OID 2.5.4.3 -> 550403（CN）', () => {
    expect(encodeOid('2.5.4.3').hex).toBe('550403');
  });

  it('第一弧为 0 时首字节直接等于第二弧 0.9 -> 09', () => {
    expect(encodeOid('0.9').hex).toBe('09');
  });

  it('第一弧为 1 时首字节为 40+Y：1.2 -> 2A', () => {
    expect(encodeOid('1.2').hex).toBe('2A');
  });

  it('第一弧为 2 时第二弧可超过 40：2.100 -> 8114', () => {
    // 2*40+100 = 180 = 0xB4 -> base128: 81 34
    expect(encodeOid('2.100').hex).toBe('8134');
  });

  it('多字节 base-128 分组正确：弧 840 -> 86 48', () => {
    const result = encodeOid('1.2.840');
    expect(result.hex).toBe('2A8648');
    expect(result.steps?.[1]?.groups).toEqual([6, 72]);
    expect(result.steps?.[1]?.bytes).toEqual([0x86, 0x48]);
  });

  it('拒绝非法首弧与越界第二弧', () => {
    expect(encodeOid('3.1').ok).toBe(false);
    expect(encodeOid('3.1').error).toContain('第一弧');
    expect(encodeOid('0.40').error).toContain('第二弧');
    expect(encodeOid('1.40').error).toContain('第二弧');
  });

  it('拒绝空串、单弧与非数字', () => {
    expect(encodeOid('').ok).toBe(false);
    expect(encodeOid('1').ok).toBe(false);
    expect(encodeOid('1.a.3').ok).toBe(false);
  });
});

describe('decodeOid', () => {
  it('标准向量往返 2A864886F70D01010B', () => {
    const result = decodeOid('2A864886F70D01010B');
    expect(result.ok).toBe(true);
    expect(result.oid).toBe('1.2.840.113549.1.1.11');
  });

  it('容忍空格、冒号、0x 前缀与小写', () => {
    expect(decodeOid('2a 86 48 86 f7 0d 01 01 0b').oid).toBe(
      '1.2.840.113549.1.1.11',
    );
    expect(decodeOid('0x55:04:03').oid).toBe('2.5.4.3');
  });

  it('首字节拆弧边界：0x27 -> 0.39，0x28 -> 1.0，0x4F -> 1.39，0x50 -> 2.0', () => {
    expect(decodeOid('27').oid).toBe('0.39');
    expect(decodeOid('28').oid).toBe('1.0');
    expect(decodeOid('4F').oid).toBe('1.39');
    expect(decodeOid('50').oid).toBe('2.0');
  });

  it('2.100 的 8134 可正确还原', () => {
    expect(decodeOid('8134').oid).toBe('2.100');
  });

  it('未结束的 base-128 整数报错', () => {
    expect(decodeOid('86').error).toContain('结束字节');
  });

  it('拒绝奇数长度与非法字符', () => {
    expect(decodeOid('ABC').error).toContain('偶数');
    expect(decodeOid('ZZ').error).toContain('十六进制字符');
  });

  it('与 encodeOid 双向往返', () => {
    const samples = ['1.2.840.10045.2.1', '2.16.840.1.101.3.4.2.1', '0.9.2342.19200300.100.1.25'];
    samples.forEach((oid) => {
      const encoded = encodeOid(oid);
      expect(encoded.ok).toBe(true);
      const decoded = decodeOid(encoded.hex ?? '');
      expect(decoded.oid).toBe(oid);
    });
  });
});

describe('辅助函数', () => {
  it('hexToBytes 与 bytesToHex 互逆', () => {
    const parsed = hexToBytes('2A 86');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.bytes).toEqual([0x2a, 0x86]);
    }
    expect(bytesToHex([0x2a, 0x86])).toBe('2A86');
  });

  it('wrapDerTlv 生成短/长两种长度编码', () => {
    expect(wrapDerTlv([0x2a])).toBe('06012A');
    const longContent = new Array(130).fill(0x01);
    const tlv = wrapDerTlv(longContent);
    // 130 = 0x82 -> 长形式 81 82
    expect(tlv.startsWith('068182')).toBe(true);
  });

  it('lookupOidName 命中内置名称表', () => {
    expect(lookupOidName('1.2.840.113549.1.1.11')).toContain('sha256WithRSA');
    expect(lookupOidName('9.9.9')).toBeNull();
  });
});
