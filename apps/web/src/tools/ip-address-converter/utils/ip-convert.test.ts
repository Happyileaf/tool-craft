import { describe, it, expect } from 'vitest';
import {
  parseIpv4,
  formatIpv4,
  parseIpv6,
  expandIpv6,
  compressIpv6,
  convertIp,
  processLines,
} from './ip-convert';

/** 以字符串构造 BigInt，规避 ES2017 target 下的字面量限制 */
function bi(value: string): bigint {
  return BigInt(value);
}

describe('parseIpv4 / formatIpv4', () => {
  it('converts the known vector 192.168.0.1', () => {
    expect(parseIpv4('192.168.0.1')).toBe(bi('3232235521'));
    expect(formatIpv4(bi('3232235521'))).toBe('192.168.0.1');
  });

  it('handles boundaries 0.0.0.0 and 255.255.255.255', () => {
    expect(parseIpv4('0.0.0.0')).toBe(bi('0'));
    expect(parseIpv4('255.255.255.255')).toBe(bi('4294967295'));
    expect(formatIpv4(bi('0'))).toBe('0.0.0.0');
    expect(formatIpv4(bi('4294967295'))).toBe('255.255.255.255');
  });

  it('rejects out-of-range, empty and ambiguous leading-zero segments', () => {
    expect(parseIpv4('256.0.0.1')).toBeNull();
    expect(parseIpv4('1.2.3')).toBeNull();
    expect(parseIpv4('1..1.1')).toBeNull();
    expect(parseIpv4('01.1.1.1')).toBeNull();
    expect(parseIpv4('1.1.1.1.')).toBeNull();
    expect(parseIpv4('a.1.1.1')).toBeNull();
  });

  it('tolerates surrounding whitespace and a single zero segment', () => {
    expect(parseIpv4('  10.0.0.1 ')).toBe(bi('167772161'));
  });
});

describe('parseIpv6 / expandIpv6 / compressIpv6', () => {
  it('expands and recompresses 2001:db8::1', () => {
    const value = parseIpv6('2001:db8::1');
    expect(value).toBe(bi('42540766411282592856903984951653826561'));
    expect(expandIpv6(value as bigint).join(':')).toBe(
      '2001:0db8:0000:0000:0000:0000:0000:0001',
    );
    expect(compressIpv6(value as bigint)).toBe('2001:db8::1');
  });

  it('accepts the fully spelled-out form round trip', () => {
    const full = '2001:0db8:0000:0000:0000:0000:0000:0001';
    const value = parseIpv6(full);
    expect(value).toBe(bi('42540766411282592856903984951653826561'));
    expect(expandIpv6(value as bigint).join(':')).toBe(full);
  });

  it('handles leading, trailing and standalone ::', () => {
    expect(compressIpv6(parseIpv6('::1') as bigint)).toBe('::1');
    expect(expandIpv6(parseIpv6('::1') as bigint)[7]).toBe('0001');
    expect(compressIpv6(parseIpv6('2001:db8::') as bigint)).toBe('2001:db8::');
    expect(parseIpv6('::')).toBe(bi('0'));
    expect(compressIpv6(bi('0'))).toBe('::');
  });

  it('supports an embedded IPv4 tail (::ffff:192.168.0.1)', () => {
    const value = parseIpv6('::ffff:192.168.0.1');
    expect(value).toBe(bi('281473913978881'));
    expect(expandIpv6(value as bigint).join(':')).toBe(
      '0000:0000:0000:0000:0000:ffff:c0a8:0001',
    );
  });

  it('picks the longest zero run, first on tie', () => {
    // 2001:0:0:1:0:0:0:1 -> longest run of 3 at index 4
    expect(compressIpv6(parseIpv6('2001:0:0:1:0:0:0:1') as bigint)).toBe(
      '2001:0:0:1::1',
    );
  });

  it('rejects malformed IPv6 text', () => {
    expect(parseIpv6('2001:db8::1::2')).toBeNull();
    expect(parseIpv6('gggg::1')).toBeNull();
    expect(parseIpv6('2001:db8')).toBeNull();
    expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull();
    expect(parseIpv6('2001:db8:::1')).toBeNull();
    expect(parseIpv6('::ffff:999.0.0.1')).toBeNull();
  });
});

describe('convertIp', () => {
  it('produces every representation for an IPv4 input', () => {
    const result = convertIp('192.168.0.1');
    expect(result.error).toBeNull();
    expect(result.version).toBe(4);
    expect(result.canonical).toBe('192.168.0.1');
    expect(result.decimal).toBe('3232235521');
    expect(result.hex).toBe('0xC0A80001');
    expect(result.binary).toBe('11000000101010000000000000000001');
    expect(result.binary).toHaveLength(32);
  });

  it('produces every representation for an IPv6 input', () => {
    const result = convertIp('2001:db8::1');
    expect(result.version).toBe(6);
    expect(result.canonical).toBe('2001:db8::1');
    expect(result.full).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.hex).toBe('0x20010DB8000000000000000000000001');
    expect(result.binary).toHaveLength(128);
  });

  it('returns an error result instead of throwing', () => {
    expect(convertIp('').error).toMatch(/不能为空/);
    expect(convertIp('256.1.1.1').error).toMatch(/IPv4/);
    expect(convertIp('not-an-ip').error).toMatch(/无法识别/);
  });
});

describe('processLines', () => {
  it('converts valid lines and flags invalid ones with line numbers', () => {
    const result = processLines('192.168.0.1\nnot-an-ip\n2001:db8::1');
    expect(result.output).toContain('[IPv4]');
    expect(result.output).toContain('十进制整数：3232235521');
    expect(result.output).toContain('[IPv6]');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/^第 2 行：/);
  });

  it('keeps blank lines and reports no warning for them', () => {
    const result = processLines('0.0.0.0\n\n255.255.255.255');
    expect(result.warnings).toHaveLength(0);
    expect(result.output.split('\n')).toContain('');
  });
});
