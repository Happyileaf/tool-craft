import { describe, expect, it } from 'vitest';
import { buildPtr, detectVersion, parseIpv4, parseIpv6 } from './dnsPtr';

describe('parseIpv4', () => {
  it('解析合法地址', () => {
    expect(parseIpv4('192.0.2.10')).toEqual([192, 0, 2, 10]);
    expect(parseIpv4('  10.20.30.40 ')).toEqual([10, 20, 30, 40]);
  });

  it('拒绝非法地址', () => {
    expect(parseIpv4('256.1.1.1')).toBeNull();
    expect(parseIpv4('1.2.3')).toBeNull();
    expect(parseIpv4('01.1.1.1')).toBeNull();
    expect(parseIpv4('1.2.3.4.5')).toBeNull();
    expect(parseIpv4('a.b.c.d')).toBeNull();
  });
});

describe('parseIpv6', () => {
  it('解析 RFC 3596 示例 2001:db8::1', () => {
    expect(parseIpv6('2001:db8::1')).toEqual([
      0x2001, 0x0db8, 0, 0, 0, 0, 0, 1,
    ]);
  });

  it('解析完整形式与全零压缩', () => {
    expect(parseIpv6('2001:db8:0:0:0:0:0:1')).toEqual([
      0x2001, 0x0db8, 0, 0, 0, 0, 0, 1,
    ]);
    expect(parseIpv6('::')).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(parseIpv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
  });

  it('解析尾部内嵌 IPv4', () => {
    expect(parseIpv6('::ffff:192.0.2.1')).toEqual([
      0, 0, 0, 0, 0, 0xffff, 0xc000, 0x0201,
    ]);
    expect(parseIpv6('0:0:0:0:0:0:192.0.2.1')).toEqual([
      0, 0, 0, 0, 0, 0, 0xc000, 0x0201,
    ]);
  });

  it('拒绝非法地址', () => {
    expect(parseIpv6('2001::db8::1')).toBeNull();
    expect(parseIpv6('2001:db8:::1')).toBeNull();
    expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull();
    expect(parseIpv6('gggg::1')).toBeNull();
    expect(parseIpv6('fe80::1%eth0')).toBeNull();
  });
});

describe('detectVersion', () => {
  it('识别地址版本', () => {
    expect(detectVersion('192.0.2.10')).toBe(4);
    expect(detectVersion('2001:db8::1')).toBe(6);
  });

  it('非法地址抛错', () => {
    expect(() => detectVersion('not-an-ip')).toThrow();
  });
});

describe('buildPtr IPv4', () => {
  it('RFC 1035 完整 PTR 名', () => {
    const result = buildPtr('192.0.2.10');
    expect(result.version).toBe(4);
    expect(result.ptrName).toBe('10.2.0.192.in-addr.arpa');
    expect(result.zoneName).toBe('10.2.0.192.in-addr.arpa');
    expect(result.prefixLength).toBe(32);
  });

  it('/24 zone 名', () => {
    const result = buildPtr('192.0.2.10', 24);
    expect(result.ptrName).toBe('10.2.0.192.in-addr.arpa');
    expect(result.zoneName).toBe('2.0.192.in-addr.arpa');
    expect(result.prefixLength).toBe(24);
  });

  it('/16 与 /8 zone 名', () => {
    expect(buildPtr('10.20.30.40', 16).zoneName).toBe('20.10.in-addr.arpa');
    expect(buildPtr('10.20.30.40', 8).zoneName).toBe('10.in-addr.arpa');
    expect(buildPtr('10.20.30.40', 0).zoneName).toBe('in-addr.arpa');
  });

  it('非法前缀报错', () => {
    expect(() => buildPtr('192.0.2.10', 25)).toThrow();
    expect(() => buildPtr('192.0.2.10', 33)).toThrow();
  });
});

describe('buildPtr IPv6', () => {
  it('RFC 3596 §2.5 完整 PTR 名', () => {
    const result = buildPtr('2001:db8::1');
    expect(result.version).toBe(6);
    expect(result.ptrName).toBe(
      '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
    );
    expect(result.normalized).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(result.prefixLength).toBe(128);
  });

  it('/32 zone 名（RIR 委派边界）', () => {
    const result = buildPtr('2001:db8::1', 32);
    expect(result.zoneName).toBe('8.b.d.0.1.0.0.2.ip6.arpa');
    expect(result.ptrName).toBe(
      '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
    );
  });

  it('大写与内嵌 IPv4 输入规范化', () => {
    const result = buildPtr('2001:DB8::1');
    expect(result.ptrName).toBe(
      '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa',
    );
    const mapped = buildPtr('::ffff:192.0.2.1');
    expect(mapped.ptrName).toBe(
      '1.0.2.0.0.0.0.c.f.f.f.f.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa',
    );
  });

  it('非法前缀报错', () => {
    expect(() => buildPtr('2001:db8::1', 33)).toThrow();
    expect(() => buildPtr('2001:db8::1', 129)).toThrow();
  });
});

describe('非法输入', () => {
  it('非 IP 文本抛错', () => {
    expect(() => buildPtr('example.com')).toThrow();
    expect(() => buildPtr('')).toThrow();
  });
});
