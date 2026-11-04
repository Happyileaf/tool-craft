import { describe, it, expect } from 'vitest';
import {
  parseIpv4,
  formatIpv4,
  parseIpv6,
  formatIpv6,
  parseRange,
  parseRanges,
  rangeToCidrs,
  formatCidr,
  totalAddresses,
  parseCidr,
  parseCidrs,
  mergeCidrs,
} from './rangeCidr';

describe('IPv4 解析与格式化', () => {
  it('点分十进制往返', () => {
    expect(formatIpv4(parseIpv4('192.168.1.1'))).toBe('192.168.1.1');
    expect(parseIpv4('0.0.0.0')).toBe(BigInt(0));
    expect(parseIpv4('255.255.255.255')).toBe(
      (BigInt(1) << BigInt(32)) - BigInt(1),
    );
  });

  it('非法地址抛出错误', () => {
    expect(() => parseIpv4('1.2.3')).toThrowError(/IPv4 地址非法/);
    expect(() => parseIpv4('1.2.3.256')).toThrowError(/IPv4 地址非法/);
    expect(() => parseIpv4('a.b.c.d')).toThrowError(/IPv4 地址非法/);
  });
});

describe('IPv6 解析与格式化', () => {
  it('完整形式与压缩形式解析一致', () => {
    const full = parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    const compressed = parseIpv6('2001:db8::1');
    expect(full).toBe(compressed);
    expect(formatIpv6(compressed)).toBe('2001:db8::1');
  });

  it('回环与全零地址', () => {
    expect(formatIpv6(parseIpv6('::1'))).toBe('::1');
    expect(formatIpv6(parseIpv6('::'))).toBe('::');
  });

  it('非法地址抛出错误', () => {
    expect(() => parseIpv6('::g')).toThrowError(/IPv6 地址非法/);
    expect(() => parseIpv6('1:2:3:4:5:6:7')).toThrowError(/IPv6 地址非法/);
    expect(() => parseIpv6('1::2::3')).toThrowError(/IPv6 地址非法/);
  });
});

describe('parseRange', () => {
  it('支持短横线与空白分隔', () => {
    const range = parseRange('10.0.0.0 - 10.0.0.255');
    expect(range.family).toBe(4);
    expect(range.end - range.start).toBe(BigInt(255));
    const spaced = parseRange('10.0.0.0 10.0.0.255');
    expect(spaced).toEqual(range);
  });

  it('IPv6 范围', () => {
    const range = parseRange('2001:db8:: - 2001:db8::ffff');
    expect(range.family).toBe(6);
    expect(range.end - range.start).toBe(BigInt(0xffff));
  });

  it('混用地址族与起止倒置抛出错误', () => {
    expect(() => parseRange('10.0.0.0 - ::1')).toThrowError(/同一地址族/);
    expect(() => parseRange('10.0.0.9 - 10.0.0.1')).toThrowError(/起始地址不能大于/);
  });

  it('多行解析', () => {
    const ranges = parseRanges('10.0.0.0-10.0.0.1\n\n  192.168.0.0 - 192.168.0.0\n');
    expect(ranges).toHaveLength(2);
  });
});

describe('rangeToCidrs - IPv4', () => {
  it('单地址返回 /32', () => {
    const blocks = rangeToCidrs(parseRange('192.168.1.5 - 192.168.1.5'));
    expect(blocks.map(formatCidr)).toEqual(['192.168.1.5/32']);
  });

  it('天然对齐的 C 段返回单个 /24', () => {
    const blocks = rangeToCidrs(parseRange('10.0.0.0 - 10.0.0.255'));
    expect(blocks.map(formatCidr)).toEqual(['10.0.0.0/24']);
  });

  it('跨块范围拆为最小 CIDR 集合', () => {
    // 192.168.1.0 ~ 192.168.1.30 的经典聚合结果
    const blocks = rangeToCidrs(parseRange('192.168.1.0 - 192.168.1.30'));
    expect(blocks.map(formatCidr)).toEqual([
      '192.168.1.0/28',
      '192.168.1.16/29',
      '192.168.1.24/30',
      '192.168.1.28/31',
      '192.168.1.30/32',
    ]);
  });

  it('任意范围拼回后无重叠且恰好覆盖原区间', () => {
    const range = parseRange('172.16.5.7 - 172.16.9.123');
    const blocks = rangeToCidrs(range);
    expect(blocks[0]?.start).toBe(range.start);
    expect(blocks[blocks.length - 1]?.end).toBe(range.end);
    expect(totalAddresses(blocks)).toBe(range.end - range.start + BigInt(1));
    blocks.forEach((block, index) => {
      if (index > 0) {
        expect(block.start).toBe((blocks[index - 1]?.end ?? BigInt(0)) + BigInt(1));
      }
    });
  });

  it('全 IPv4 空间聚合为 0.0.0.0/0', () => {
    const blocks = rangeToCidrs(
      parseRange('0.0.0.0 - 255.255.255.255'),
    );
    expect(blocks.map(formatCidr)).toEqual(['0.0.0.0/0']);
  });
});

describe('rangeToCidrs - IPv6', () => {
  it('单地址返回 /128', () => {
    const blocks = rangeToCidrs(parseRange('2001:db8::1 - 2001:db8::1'));
    expect(blocks.map(formatCidr)).toEqual(['2001:db8::1/128']);
  });

  it('对齐的 65536 地址段返回 /112', () => {
    const blocks = rangeToCidrs(parseRange('2001:db8:: - 2001:db8::ffff'));
    expect(blocks.map(formatCidr)).toEqual(['2001:db8::/112']);
  });

  it('覆盖连续性与地址总数正确', () => {
    const range = parseRange('2001:db8::1234 - 2001:db8::abcd');
    const blocks = rangeToCidrs(range);
    expect(totalAddresses(blocks)).toBe(range.end - range.start + BigInt(1));
    blocks.forEach((block) => {
      expect(block.family).toBe(6);
      expect(block.prefix).toBeGreaterThanOrEqual(0);
      expect(block.prefix).toBeLessThanOrEqual(128);
    });
  });
});

describe('parseCidr', () => {
  it('解析并对齐网络地址', () => {
    const block = parseCidr('192.168.1.10/24');
    expect(block.network).toBe('192.168.1.0');
    expect(block.prefix).toBe(24);
    expect(formatIpv4(block.end)).toBe('192.168.1.255');
  });

  it('解析 IPv6 与默认路由', () => {
    expect(formatCidr(parseCidr('2001:db8::1/64'))).toBe('2001:db8::/64');
    expect(formatCidr(parseCidr('0.0.0.0/0'))).toBe('0.0.0.0/0');
  });

  it('非法 CIDR 抛出错误', () => {
    expect(() => parseCidr('10.0.0.0')).toThrowError(/CIDR 格式非法/);
    expect(() => parseCidr('10.0.0.0/33')).toThrowError(/超出范围/);
    expect(parseCidrs('10.0.0.0/24\n\n10.0.1.0/24')).toHaveLength(2);
  });
});

describe('mergeCidrs 超网合并', () => {
  it('相邻对齐的同级块逐级合并', () => {
    const merged = mergeCidrs(parseCidrs('10.0.0.0/25\n10.0.0.128/25'));
    expect(merged.map(formatCidr)).toEqual(['10.0.0.0/24']);
  });

  it('重叠与包含关系先去重再合并', () => {
    const merged = mergeCidrs(
      parseCidrs('192.168.0.0/24\n192.168.1.0/24\n192.168.0.128/25\n192.168.2.0/24\n192.168.3.0/24'),
    );
    expect(merged.map(formatCidr)).toEqual(['192.168.0.0/22']);
  });

  it('无法合并时原样返回（排序后）', () => {
    const merged = mergeCidrs(parseCidrs('172.16.0.0/24\n172.16.2.0/24'));
    expect(merged.map(formatCidr)).toEqual(['172.16.0.0/24', '172.16.2.0/24']);
  });

  it('IPv6 超网合并', () => {
    const merged = mergeCidrs(parseCidrs('2001:db8::/65\n2001:db8:0:0:8000::/65'));
    expect(merged.map(formatCidr)).toEqual(['2001:db8::/64']);
  });

  it('混用地址族与空输入抛出错误', () => {
    expect(() => mergeCidrs(parseCidrs('10.0.0.0/24\n2001:db8::/64'))).toThrowError(
      /同一地址族/,
    );
    expect(() => mergeCidrs([])).toThrowError(/至少输入一个/);
  });

  it('range→CIDR 与 CIDR→超网往返一致', () => {
    const range = parseRange('192.168.1.0 - 192.168.1.30');
    const blocks = rangeToCidrs(range);
    const merged = mergeCidrs(blocks);
    // 该范围本身不是对齐整块，合并后覆盖空间只会大于等于原范围
    expect(merged[0]?.start).toBeLessThanOrEqual(range.start);
    expect(merged[merged.length - 1]?.end).toBeGreaterThanOrEqual(range.end);
  });
});
