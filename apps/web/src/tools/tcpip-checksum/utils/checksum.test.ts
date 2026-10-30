import { describe, expect, it } from 'vitest';
import {
  PROTO_TCP,
  PROTO_UDP,
  TCP_CHECKSUM_OFFSET,
  UDP_CHECKSUM_OFFSET,
  applyChecksum,
  buildPseudoHeader,
  generateChecksum,
  internetChecksum,
  parseHexBytes,
  parseIpv4,
  toHex,
  verifySegment,
} from './checksum';

describe('RFC 1071 标准向量', () => {
  it('偶数长度示例 00 01 f2 03 f4 f5 f6 f7 → 0x220D', () => {
    const bytes = parseHexBytes('00 01 f2 03 f4 f5 f6 f7');
    expect(internetChecksum(bytes)).toBe(0x220d);
  });

  it('奇数长度：末字节作为高字节补 0x00', () => {
    // 词：f203 + f400 = 1e603 → 折叠 e604 → 取反 19fb
    expect(internetChecksum(parseHexBytes('f2 03 f4'))).toBe(0x19fb);
  });

  it('空数据校验和为 0xFFFF', () => {
    expect(internetChecksum([])).toBe(0xffff);
  });
});

describe('解析与格式化', () => {
  it('支持连写、逗号与 0x 前缀', () => {
    expect(parseHexBytes('4500, 0x003c 1c46')).toEqual([0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46]);
  });

  it('非法字符与奇数长度报错', () => {
    expect(() => parseHexBytes('zz')).toThrow();
    expect(() => parseHexBytes('abc')).toThrow();
  });

  it('IPv4 地址解析与范围校验', () => {
    expect(parseIpv4('192.168.1.1')).toEqual([192, 168, 1, 1]);
    expect(() => parseIpv4('1.2.3')).toThrow();
    expect(() => parseIpv4('1.2.3.256')).toThrow();
  });

  it('toHex 大写定长', () => {
    expect(toHex([0x0, 0xa, 0xff])).toBe('00 0A FF');
  });
});

describe('回填与往返一致', () => {
  it('applyChecksum 在指定偏移写入网络序 16 位', () => {
    const filled = applyChecksum(new Array(20).fill(0), 10, 0x1234);
    expect(filled[10]).toBe(0x12);
    expect(filled[11]).toBe(0x34);
  });

  it('生成后再校验必通过（raw 模式，IPv4 首部偏移 10）', () => {
    // 20 字节无选项 IPv4 首部，校验和字段（偏移 10–11）置零
    const header = parseHexBytes('45 00 00 73 00 00 40 00 40 11 00 00 c0 a8 00 01 c0 a8 00 c7');
    const checksum = internetChecksum(header);
    const filled = applyChecksum(header, 10, checksum);
    expect(verifySegment(filled, 'raw')).toBe(true);
  });
});

describe('TCP / UDP 伪首部', () => {
  it('伪首部 12 字节：地址 + 零 + 协议 + 长度', () => {
    const pseudo = buildPseudoHeader([10, 0, 0, 1], [10, 0, 0, 2], PROTO_TCP, 40);
    expect(pseudo).toEqual([10, 0, 0, 1, 10, 0, 0, 2, 0, 6, 0, 40]);
    expect(pseudo.length).toBe(12);
  });

  it('UDP 已知向量（手工可复现，独立实现交叉验证）', () => {
    // 192.168.1.2:1234 → 192.168.1.1:80，段长 14（8 首部 + 6 数据 "Test.\n"）
    // 16 位反码求和：
    //   伪首部 c0a8 0102 c0a8 0101 0011 000e
    //   UDP 首部 04d2 0050 000e 0000，数据 5465 7374 2e0a（奇数末字节补 0）
    // 求和折叠后取反 = 0x8178
    const segmentHex = [
      // UDP 首部：sport=0x04D2 dport=0x0050 len=0x000E checksum=0x0000
      '04 d2 00 50 00 0e 00 00',
      // 数据 6 字节："Test.\n"
      '54 65 73 74 2e 0a',
    ].join(' ');
    const segment = parseHexBytes(segmentHex);
    expect(segment.length).toBe(14);
    const checksum = generateChecksum(segment, 'udp', parseIpv4('192.168.1.2'), parseIpv4('192.168.1.1'));
    expect(checksum).toBe(0x8178);
    const filled = applyChecksum(segment, UDP_CHECKSUM_OFFSET, checksum);
    expect(verifySegment(filled, 'udp', parseIpv4('192.168.1.2'), parseIpv4('192.168.1.1'))).toBe(true);
  });

  it('TCP 生成/校验往返一致', () => {
    // 40 字节最小 TCP 段（20 首部 + 20 数据），校验和偏移 16
    const segment = new Array(40).fill(0);
    segment[0] = 0x1f;
    segment[1] = 0x90; // 源端口 8080
    segment[2] = 0x00;
    segment[3] = 0x50; // 目的端口 80
    segment[4] = 0x00;
    segment[5] = 0x00;
    segment[6] = 0x00;
    segment[7] = 0x01; // seq
    const src = parseIpv4('10.0.0.1');
    const dst = parseIpv4('10.0.0.2');
    const checksum = generateChecksum(segment, 'tcp', src, dst);
    expect(checksum).not.toBe(0);
    const filled = applyChecksum(segment, TCP_CHECKSUM_OFFSET, checksum);
    expect(verifySegment(filled, 'tcp', src, dst)).toBe(true);
  });

  it('TCP / UDP 缺少地址时报错', () => {
    expect(() => generateChecksum(new Array(20).fill(0), 'tcp')).toThrow();
    expect(() => verifySegment(new Array(8).fill(0), 'udp')).toThrow();
  });

  it('协议号常量', () => {
    expect(PROTO_TCP).toBe(6);
    expect(PROTO_UDP).toBe(17);
  });
});
