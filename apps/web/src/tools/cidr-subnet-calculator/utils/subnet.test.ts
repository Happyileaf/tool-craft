import { describe, it, expect } from 'vitest';
import {
  calculateIpv4Subnet,
  calculateIpv6Subnet,
  formatIpv4,
  parseIpv4,
  prefixFromMask,
} from './subnet';

describe('parseIpv4 / formatIpv4', () => {
  it('解析点分十进制地址并还原', () => {
    expect(parseIpv4('192.168.1.10')).toBe(0xc0a8010a);
    expect(formatIpv4(parseIpv4('192.168.1.10'))).toBe('192.168.1.10');
    expect(formatIpv4(parseIpv4('255.255.255.255'))).toBe('255.255.255.255');
    expect(formatIpv4(parseIpv4('0.0.0.0'))).toBe('0.0.0.0');
  });

  it('非法地址抛出可读错误', () => {
    expect(() => parseIpv4('999.1.1.1')).toThrowError(/IPv4 地址非法/);
    expect(() => parseIpv4('1.2.3')).toThrowError(/IPv4 地址非法/);
    expect(() => parseIpv4('1.2.3.x')).toThrowError(/IPv4 地址非法/);
  });
});

describe('prefixFromMask', () => {
  it('由连续掩码得到前缀长度', () => {
    expect(prefixFromMask('255.255.255.0')).toBe(24);
    expect(prefixFromMask('255.255.0.0')).toBe(16);
    expect(prefixFromMask('255.255.255.255')).toBe(32);
    expect(prefixFromMask('0.0.0.0')).toBe(0);
  });

  it('非连续掩码抛出可读错误', () => {
    expect(() => prefixFromMask('255.0.255.0')).toThrowError(/子网掩码非法/);
  });
});

describe('calculateIpv4Subnet', () => {
  it('计算 /24 子网的全部字段', () => {
    const result = calculateIpv4Subnet('192.168.1.10/24');
    expect(result.address).toBe('192.168.1.10');
    expect(result.prefixLength).toBe(24);
    expect(result.netmask).toBe('255.255.255.0');
    expect(result.wildcardMask).toBe('0.0.0.255');
    expect(result.networkAddress).toBe('192.168.1.0');
    expect(result.broadcastAddress).toBe('192.168.1.255');
    expect(result.firstHost).toBe('192.168.1.1');
    expect(result.lastHost).toBe('192.168.1.254');
    expect(result.usableHosts).toBe(254);
    expect(result.totalAddresses).toBe(256);
    expect(result.isPrivate).toBe(true);
    expect(result.ipClass).toBe('C');
    expect(result.binaryAddress).toBe('11000000101010000000000100001010');
    expect(result.binaryNetmask).toBe('11111111111111111111111100000000');
  });

  it('点分掩码输入与 CIDR 前缀结果等价', () => {
    const byPrefix = calculateIpv4Subnet('192.168.1.10/24');
    const bySpaceMask = calculateIpv4Subnet('192.168.1.10 255.255.255.0');
    const bySlashMask = calculateIpv4Subnet('192.168.1.10/255.255.255.0');
    expect(bySpaceMask).toEqual(byPrefix);
    expect(bySlashMask).toEqual(byPrefix);
  });

  it('/31 按 RFC 3021 提供 2 个可用主机', () => {
    const result = calculateIpv4Subnet('10.0.0.0/31');
    expect(result.usableHosts).toBe(2);
    expect(result.networkAddress).toBe('10.0.0.0');
    expect(result.broadcastAddress).toBe('10.0.0.1');
    expect(result.firstHost).toBe('10.0.0.0');
    expect(result.lastHost).toBe('10.0.0.1');
  });

  it('/32 仅 1 个可用主机', () => {
    const result = calculateIpv4Subnet('10.0.0.1/32');
    expect(result.usableHosts).toBe(1);
    expect(result.firstHost).toBe('10.0.0.1');
    expect(result.lastHost).toBe('10.0.0.1');
  });

  it('识别地址类别与私有网段', () => {
    expect(calculateIpv4Subnet('10.0.0.1/8').ipClass).toBe('A');
    expect(calculateIpv4Subnet('172.16.0.1/12').isPrivate).toBe(true);
    expect(calculateIpv4Subnet('192.168.0.1/16').isPrivate).toBe(true);
    expect(calculateIpv4Subnet('127.0.0.1/8').isPrivate).toBe(true);
    expect(calculateIpv4Subnet('8.8.8.8/32').isPrivate).toBe(false);
    expect(calculateIpv4Subnet('224.0.0.1/32').ipClass).toBe('D');
    expect(calculateIpv4Subnet('240.0.0.1/32').ipClass).toBe('E');
  });

  it('非法地址、越界前缀与非法掩码抛出可读错误', () => {
    expect(() => calculateIpv4Subnet('999.1.1.1/24')).toThrowError(/IPv4 地址非法/);
    expect(() => calculateIpv4Subnet('1.2.3.4/33')).toThrowError(/超出范围/);
    expect(() => calculateIpv4Subnet('1.2.3.4 255.0.255.0')).toThrowError(/子网掩码非法/);
    expect(() => calculateIpv4Subnet('/24')).toThrowError(/缺少/);
    expect(() => calculateIpv4Subnet('1.2.3.4')).toThrowError(/缺少/);
  });
});

describe('calculateIpv6Subnet', () => {
  it('计算 /64 的网络地址与地址总数', () => {
    const result = calculateIpv6Subnet('2001:db8::1/64');
    expect(result.address).toBe('2001:db8::1');
    expect(result.prefixLength).toBe(64);
    expect(result.networkAddress).toBe('2001:db8::');
    expect(result.totalAddresses).toBe('18446744073709551616');
  });

  it('输出小写并按 RFC 5952 压缩最长连续 0 段', () => {
    const result = calculateIpv6Subnet('2001:DB8:0:0:0:0:0:1/64');
    expect(result.address).toBe('2001:db8::1');
    expect(result.networkAddress).toBe('2001:db8::');
    expect(result.lastAddress).toBe('2001:db8::ffff:ffff:ffff:ffff');
  });

  it('/128 时仅一个地址', () => {
    const result = calculateIpv6Subnet('2001:db8::1/128');
    expect(result.networkAddress).toBe('2001:db8::1');
    expect(result.firstAddress).toBe('2001:db8::1');
    expect(result.lastAddress).toBe('2001:db8::1');
    expect(result.totalAddresses).toBe('1');
  });

  it('非法输入抛出可读错误', () => {
    expect(() => calculateIpv6Subnet('2001:db8::1')).toThrowError(/缺少/);
    expect(() => calculateIpv6Subnet('2001:db8::1/129')).toThrowError(/超出范围/);
    expect(() => calculateIpv6Subnet('2001:db8::1::2/64')).toThrowError(/IPv6 地址非法/);
    expect(() => calculateIpv6Subnet('gggg::1/64')).toThrowError(/IPv6 地址非法/);
  });
});
