import { describe, expect, it } from 'vitest';
import {
  formatIpv4,
  formatIpv6,
  parseCidr,
  parseIp,
  parseIpv4,
  parseIpv6,
  parseRangeToCidrs,
  rangeToCidrs,
  summarizeCidrs,
} from './ip';

describe('parseIpv4 / formatIpv4', () => {
  it('标准地址往返', () => {
    expect(formatIpv4(parseIpv4('0.0.0.0'))).toBe('0.0.0.0');
    expect(formatIpv4(parseIpv4('192.168.1.1'))).toBe('192.168.1.1');
    expect(formatIpv4(parseIpv4('255.255.255.255'))).toBe('255.255.255.255');
    expect(parseIpv4('10.0.0.1')).toBe(BigInt(0x0a000001));
  });

  it('拒绝非法写法', () => {
    expect(() => parseIpv4('1.2.3')).toThrow();
    expect(() => parseIpv4('1.2.3.256')).toThrow();
    expect(() => parseIpv4('1.2.3.a')).toThrow();
    expect(() => parseIpv4('01.2.3.4')).toThrow();
  });
});

describe('parseIpv6 / formatIpv6', () => {
  it('完整形式', () => {
    const value = parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(formatIpv6(value)).toBe('2001:db8::1');
  });

  it(':: 压缩与全零', () => {
    expect(formatIpv6(parseIpv6('::'))).toBe('::');
    expect(formatIpv6(parseIpv6('::1'))).toBe('::1');
    expect(formatIpv6(parseIpv6('2001:db8::'))).toBe('2001:db8::');
    expect(parseIpv6('::1')).toBe(BigInt(1));
  });

  it('末段内嵌 IPv4', () => {
    const value = parseIpv6('::ffff:192.0.2.1');
    expect(formatIpv6(value)).toBe('::ffff:c000:201');
  });

  it('多个 :: 非法', () => {
    expect(() => parseIpv6('2001::db8::1')).toThrow();
  });

  it('非法段', () => {
    expect(() => parseIpv6('2001:db8::gggg')).toThrow();
    expect(() => parseIpv6('2001:db8:::1')).toThrow();
  });

  it('RFC 5952 并列零段取第一个（最长）', () => {
    // 2001:0:0:1:0:0:1:0 → 前两个零段更长，压缩位置在中间
    const value = parseIpv6('2001:0:0:1:0:0:1:0');
    expect(formatIpv6(value)).toBe('2001::1:0:0:1:0');
  });
});

describe('parseIp 自动识别', () => {
  it('识别版本', () => {
    expect(parseIp('10.0.0.1').version).toBe(4);
    expect(parseIp('2001:db8::1').version).toBe(6);
    expect(() => parseIp('not-an-ip')).toThrow();
  });
});

describe('rangeToCidrs IPv4', () => {
  it('单 IP 为 /32', () => {
    const blocks = parseRangeToCidrs('192.168.1.1', '192.168.1.1');
    expect(blocks.map((b) => b.text)).toEqual(['192.168.1.1/32']);
  });

  it('完整对齐 /24', () => {
    const blocks = parseRangeToCidrs('192.168.1.0', '192.168.1.255');
    expect(blocks.map((b) => b.text)).toEqual(['192.168.1.0/24']);
  });

  it('非对齐起点：192.168.1.0 - 192.168.1.25', () => {
    const blocks = parseRangeToCidrs('192.168.1.0', '192.168.1.25');
    expect(blocks.map((b) => b.text)).toEqual([
      '192.168.1.0/28',
      '192.168.1.16/29',
      '192.168.1.24/31',
    ]);
    expect(blocks.reduce((sum, block) => sum + block.size, BigInt(0))).toBe(BigInt(26));
  });

  it('经典向量 192.168.1.5 - 192.168.1.11', () => {
    const blocks = parseRangeToCidrs('192.168.1.5', '192.168.1.11');
    expect(blocks.map((b) => b.text)).toEqual([
      '192.168.1.5/32',
      '192.168.1.6/31',
      '192.168.1.8/30',
    ]);
  });

  it('对齐起点经典向量 192.168.1.8 - 192.168.1.15 为单一 /29', () => {
    const blocks = parseRangeToCidrs('192.168.1.8', '192.168.1.15');
    expect(blocks.map((b) => b.text)).toEqual(['192.168.1.8/29']);
  });

  it('整段 0.0.0.0 - 255.255.255.255 为 /0', () => {
    const blocks = rangeToCidrs(BigInt(0), (BigInt(1) << BigInt(32)) - BigInt(1), 4);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.text).toBe('0.0.0.0/0');
    expect(blocks[0]?.size).toBe(BigInt(1) << BigInt(32));
  });

  it('跨 /24 边界：192.168.1.255 - 192.168.2.0', () => {
    const blocks = parseRangeToCidrs('192.168.1.255', '192.168.2.0');
    expect(blocks.map((b) => b.text)).toEqual(['192.168.1.255/32', '192.168.2.0/32']);
  });

  it('各 CIDR 不重叠且并集恰好覆盖区间', () => {
    const start = parseIpv4('10.11.12.13');
    const end = parseIpv4('10.11.13.99');
    const blocks = rangeToCidrs(start, end, 4);
    let cursor = start;
    blocks.forEach((block) => {
      expect(block.network).toBe(cursor);
      cursor += block.size;
    });
    expect(cursor - BigInt(1)).toBe(end);
  });
});

describe('rangeToCidrs IPv6', () => {
  it('单地址 /128', () => {
    const blocks = parseRangeToCidrs('2001:db8::1', '2001:db8::1');
    expect(blocks.map((b) => b.text)).toEqual(['2001:db8::1/128']);
  });

  it('对齐 /48', () => {
    const blocks = parseRangeToCidrs('2001:db8::', '2001:db8:0:ffff:ffff:ffff:ffff:ffff');
    expect(blocks.map((b) => b.text)).toEqual(['2001:db8::/48']);
  });

  it('非对齐区间输出 RFC 5952 格式且总数正确', () => {
    const start = parseIpv6('2001:db8::1');
    const end = parseIpv6('2001:db8::100');
    const blocks = rangeToCidrs(start, end, 6);
    const total = blocks.reduce((sum, block) => sum + block.size, BigInt(0));
    expect(total).toBe(BigInt(0x100));
    let cursor = start;
    blocks.forEach((block) => {
      expect(block.network).toBe(cursor);
      cursor += block.size;
    });
  });

  it('全部地址空间为 /0', () => {
    const blocks = rangeToCidrs(BigInt(0), (BigInt(1) << BigInt(128)) - BigInt(1), 6);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.text).toBe('::/0');
  });
});

describe('错误处理', () => {
  it('起止颠倒报错', () => {
    expect(() => parseRangeToCidrs('192.168.1.10', '192.168.1.1')).toThrow();
  });

  it('IPv4/IPv6 混用报错', () => {
    expect(() => parseRangeToCidrs('192.168.1.1', '2001:db8::1')).toThrow();
  });
});

describe('parseCidr', () => {
  it('解析 IPv4 CIDR 区间', () => {
    const result = parseCidr('192.168.1.10/24');
    expect(result.version).toBe(4);
    expect(result.low).toBe(parseIpv4('192.168.1.0'));
    expect(result.high).toBe(parseIpv4('192.168.1.255'));
  });

  it('解析 IPv6 /32', () => {
    const result = parseCidr('2001:db8:9::/32');
    expect(result.low).toBe(parseIpv6('2001:db8::'));
    expect(result.high).toBe(parseIpv6('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
  });

  it('/0 覆盖全空间', () => {
    const result = parseCidr('0.0.0.0/0');
    expect(result.low).toBe(BigInt(0));
    expect(result.high).toBe((BigInt(1) << BigInt(32)) - BigInt(1));
  });

  it('非法前缀', () => {
    expect(() => parseCidr('10.0.0.0/33')).toThrow();
    expect(() => parseCidr('10.0.0.0')).toThrow();
    expect(() => parseCidr('10.0.0.0/-1')).toThrow();
  });
});

describe('summarizeCidrs', () => {
  it('相邻 /25 合并为 /24', () => {
    const blocks = summarizeCidrs(['192.168.1.0/25', '192.168.1.128/25']);
    expect(blocks.map((b) => b.text)).toEqual(['192.168.1.0/24']);
  });

  it('重叠输入去重', () => {
    const blocks = summarizeCidrs(['10.0.0.0/24', '10.0.0.0/25', '10.0.0.128/25']);
    expect(blocks.map((b) => b.text)).toEqual(['10.0.0.0/24']);
  });

  it('不可超网时保持多块', () => {
    const blocks = summarizeCidrs(['10.0.0.0/24', '10.0.2.0/24']);
    expect(blocks.map((b) => b.text)).toEqual(['10.0.0.0/24', '10.0.2.0/24']);
  });

  it('包含关系归一到外层超网', () => {
    const blocks = summarizeCidrs(['10.0.0.0/24', '10.0.0.2/32']);
    expect(blocks.map((b) => b.text)).toEqual(['10.0.0.0/24']);
  });

  it('多段合并为最小集合：192.168.0.0/24 + 192.168.1.0/24 + 192.168.2.0/24', () => {
    const blocks = summarizeCidrs(['192.168.0.0/24', '192.168.1.0/24', '192.168.2.0/24']);
    expect(blocks.map((b) => b.text)).toEqual([
      '192.168.0.0/23',
      '192.168.2.0/24',
    ]);
  });

  it('IPv6 相邻 /33 合并为 /32', () => {
    const blocks = summarizeCidrs(['2001:db8::/33', '2001:db8:8000::/33']);
    expect(blocks.map((b) => b.text)).toEqual(['2001:db8::/32']);
  });

  it('混合版本报错', () => {
    expect(() => summarizeCidrs(['10.0.0.0/24', '2001:db8::/32'])).toThrow();
  });

  it('空数组返回空', () => {
    expect(summarizeCidrs([])).toEqual([]);
  });
});
