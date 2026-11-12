import { describe, expect, it } from 'vitest';
import {
  buildIpv4Header,
  bytesToHex,
  getProtocolName,
  internetChecksum,
  parseHexBytes,
  parseIpv4Header,
} from './ipv4';

describe('parseHexBytes', () => {
  it('accepts spaced and 0x-prefixed hex', () => {
    expect(parseHexBytes('45 00 0x00')).toEqual([0x45, 0x00, 0x00]);
  });

  it('rejects odd length and non-hex characters', () => {
    expect(() => parseHexBytes('abc')).toThrow('偶数');
    expect(() => parseHexBytes('zz')).toThrow('非十六进制字符');
  });
});

describe('internetChecksum', () => {
  it('returns the RFC 1071 example checksum for "test" padded data', () => {
    // 固定样例：45 00 00 73 00 00 40 00 40 11 00 00 ... 校验和应为 b861
    const bytes = parseHexBytes(
      '45 00 00 73 00 00 40 00 40 11 00 00 c0 a8 00 01 c0 a8 00 c7',
    );
    expect(internetChecksum(bytes)).toBe(0xb861);
  });
});

describe('parseIpv4Header', () => {
  // 用构造器生成一个合法 UDP 数据报头部作为稳定样例
  const header = buildIpv4Header({
    totalLength: 60,
    identification: 0x1c46,
    df: true,
    ttl: 64,
    protocol: 17,
    source: '192.168.1.10',
    destination: '192.168.1.1',
  });
  const hex = bytesToHex(header);

  it('parses version and IHL', () => {
    const result = parseIpv4Header(hex);
    expect(result.version).toBe(4);
    expect(result.ihl).toBe(5);
    expect(result.headerLength).toBe(20);
  });

  it('parses addresses, protocol and total length', () => {
    const result = parseIpv4Header(hex);
    expect(result.sourceAddress).toBe('192.168.1.10');
    expect(result.destinationAddress).toBe('192.168.1.1');
    expect(result.protocol).toBe(17);
    expect(result.protocolName).toBe('UDP');
    expect(getProtocolName(6)).toBe('TCP');
    expect(result.totalLength).toBe(60);
    expect(result.payloadLength).toBe(40);
    expect(result.ttl).toBe(64);
  });

  it('parses the DF flag and identification', () => {
    const result = parseIpv4Header(hex);
    expect(result.flags.df).toBe(true);
    expect(result.flags.mf).toBe(false);
    expect(result.identification).toBe(0x1c46);
  });

  it('validates a correct checksum', () => {
    const result = parseIpv4Header(hex);
    expect(result.checksumValid).toBe(true);
    expect(result.computedChecksum).toBe(0);
    expect(result.headerChecksum).toBeGreaterThan(0);
  });

  it('detects a corrupted checksum', () => {
    const corrupted = [...header];
    corrupted[8] = 10; // 篡改 TTL
    const result = parseIpv4Header(bytesToHex(corrupted));
    expect(result.checksumValid).toBe(false);
  });

  it('rejects non-IPv4 version', () => {
    const bad = [0x65, ...header.slice(1)];
    expect(() => parseIpv4Header(bytesToHex(bad))).toThrow('版本字段应为 4');
  });

  it('rejects IHL below 5', () => {
    const bad = [0x44, ...header.slice(1)];
    expect(() => parseIpv4Header(bytesToHex(bad))).toThrow('IHL 最小值为 5');
  });

  it('rejects input shorter than 20 bytes', () => {
    expect(() => parseIpv4Header('45 00 00')).toThrow('最少 20 字节');
  });

  it('rejects truncated header relative to IHL', () => {
    // IHL=6 表示 24 字节，但只给 20 字节
    const bad = [0x46, ...header.slice(1, 20)];
    expect(() => parseIpv4Header(bytesToHex(bad))).toThrow('IHL 声明头部');
  });
});

describe('buildIpv4Header', () => {
  it('produces a header that parses back with a valid checksum', () => {
    const bytes = buildIpv4Header({
      totalLength: 40,
      ttl: 128,
      protocol: 6,
      source: '10.0.0.1',
      destination: '10.0.0.2',
      mf: true,
      fragmentOffset: 100,
    });
    const parsed = parseIpv4Header(bytesToHex(bytes));
    expect(parsed.checksumValid).toBe(true);
    expect(parsed.flags.mf).toBe(true);
    expect(parsed.fragmentOffset).toBe(100);
    expect(parsed.protocolName).toBe('TCP');
  });

  it('rejects a malformed dotted address', () => {
    expect(() =>
      buildIpv4Header({
        totalLength: 20,
        ttl: 64,
        protocol: 1,
        source: '1.2.3',
        destination: '1.2.3.4',
      }),
    ).toThrow('点分十进制 IPv4');
  });
});
