import { describe, expect, it } from 'vitest';
import {
  buildUdpDatagram,
  bytesToHex,
  computeUdpChecksum,
  hexToBytes,
  onesComplementSum,
  parseIpv4,
  parseIpv6,
  parseUdpDatagram,
  type UdpBuildConfig,
} from './udp';
import {
  DEFAULT_DESTINATION_IPV4,
  DEFAULT_SOURCE_IPV4,
  DEFAULT_UDP_HEX,
} from '../constants';

const vector1Config: UdpBuildConfig = {
  sourcePort: 1234,
  destinationPort: 80,
  payloadHex: '54 65 73 74 2e 0a',
  checksumMode: 'ipv4',
  srcIp: DEFAULT_SOURCE_IPV4,
  dstIp: DEFAULT_DESTINATION_IPV4,
};

describe('hexToBytes / bytesToHex', () => {
  it('容忍空格、逗号、冒号、换行与 0x 前缀', () => {
    expect(hexToBytes('0x04 d2,00:50\n00 0e')).toEqual([0x04, 0xd2, 0x00, 0x50, 0x00, 0x0e]);
  });

  it('拒绝非法字符并给出 nibble 偏移', () => {
    expect(() => hexToBytes('gg')).toThrow('偏移 0');
    expect(() => hexToBytes('ab g')).toThrow('偏移 2');
  });

  it('拒绝奇数 nibble', () => {
    expect(() => hexToBytes('abc')).toThrow('奇数');
  });

  it('大写分组输出', () => {
    expect(bytesToHex([0x04, 0xd2, 0x00, 0x50], 16)).toBe('04D20050');
  });
});

describe('parseIpv4 / parseIpv6', () => {
  it('parseIpv4 解析并拒绝非法地址', () => {
    expect(parseIpv4('192.168.1.2')).toEqual([192, 168, 1, 2]);
    expect(() => parseIpv4('192.168.1')).toThrow('四段');
    expect(() => parseIpv4('192.168.1.256')).toThrow('0–255');
  });

  it('parseIpv6 解析完整、压缩与嵌入 IPv4 形式', () => {
    expect(parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toEqual(
      parseIpv6('2001:db8::1'),
    );
    expect(parseIpv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(parseIpv6('::ffff:192.0.2.1')).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 192, 0, 2, 1,
    ]);
    expect(parseIpv6('2001:db8::')).toHaveLength(16);
  });

  it('parseIpv6 拒绝非法压缩与分组', () => {
    expect(() => parseIpv6('2001::db8::1')).toThrow('::');
    expect(() => parseIpv6('2001:db8:::1')).toThrow('非法分组');
    expect(() => parseIpv6('1:2:3:4:5:6:7')).toThrow('8 个分组');
    expect(() => parseIpv6('1:2:3:4:5:6:7:8:9')).toThrow('8 个分组');
  });
});

describe('onesComplementSum', () => {
  it('奇数字节末尾补 0 参与求和', () => {
    expect(onesComplementSum([0xab])).toBe(0xab00);
    // 0xFFFF + 末字节补零后的 0x0100 = 0x100FF，折叠进位后为 0x0100
    expect(onesComplementSum([0xff, 0xff, 0x01])).toBe(0x0100);
  });
});

describe('向量 1：构造 RFC 768 标准报文', () => {
  it('长度、前缀与独立硬编码校验和 0x8178 一致', () => {
    const built = buildUdpDatagram(vector1Config);
    expect(built.length).toBe(14);
    expect(built.bytes).toHaveLength(14);
    expect(built.hex.replace(/\s/g, '').startsWith('04D20050000E')).toBe(true);
    expect(built.checksum).toBe(0x8178);
    expect(built.bytes[6]).toBe(0x81);
    expect(built.bytes[7]).toBe(0x78);
    expect(built.fieldViews.map((item) => item.field)).toContain('校验和 Checksum');
  });

  it('computeUdpChecksum 独立反码求和同样得到 0x8178', () => {
    const datagram = hexToBytes('04 D2 00 50 00 0E 00 00 54 65 73 74 2E 0A');
    expect(
      computeUdpChecksum([192, 168, 1, 2], [192, 168, 1, 1], 'ipv4', datagram),
    ).toBe(0x8178);
  });
});

describe('向量 2：解析完整报文并验证校验和', () => {
  it('四字段还原、长度一致、校验通过', () => {
    const parsed = parseUdpDatagram(DEFAULT_UDP_HEX, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.sourcePort).toBe(1234);
    expect(parsed.destinationPort).toBe(80);
    expect(parsed.length).toBe(14);
    expect(parsed.checksum).toBe(0x8178);
    expect(parsed.datagramLength).toBe(14);
    expect(parsed.payloadHex).toBe('546573742E0A');
    expect(parsed.payloadText).toBe('Test.\n');
    expect(parsed.checksumValid).toBe(true);
    expect(parsed.expectedChecksum).toBe(0x8178);
    expect(parsed.fieldViews).toHaveLength(5);
  });

  it('伪首部地址不匹配时校验失败；缺地址时跳过', () => {
    const wrong = parseUdpDatagram(DEFAULT_UDP_HEX, {
      srcIp: '10.0.0.9',
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(wrong.checksumValid).toBe(false);

    const skipped = parseUdpDatagram(DEFAULT_UDP_HEX);
    expect(skipped.checksumValid).toBeNull();
    expect(skipped.expectedChecksum).toBeNull();
  });

  it('构造-解析往返一致', () => {
    const built = buildUdpDatagram(vector1Config);
    const parsed = parseUdpDatagram(built.hex, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.checksumValid).toBe(true);
  });
});

describe('向量 3：禁用校验和', () => {
  it('IPv4 禁用时字段为 0000，解析标注未启用（checksumValid=null）', () => {
    const built = buildUdpDatagram({ ...vector1Config, checksumMode: 'disabled' });
    expect(built.checksum).toBeNull();
    expect(built.hex).toContain('0000');
    expect(built.bytes[6]).toBe(0);
    expect(built.bytes[7]).toBe(0);

    const parsed = parseUdpDatagram(built.hex, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.checksum).toBe(0);
    expect(parsed.checksumValid).toBeNull();
  });

  it('IPv6 禁用校验和必须抛错（RFC 8200）', () => {
    expect(() =>
      buildUdpDatagram({
        ...vector1Config,
        checksumMode: 'disabled',
        ipVersion: 'ipv6',
        srcIp: '2001:db8::2',
        dstIp: '2001:db8::1',
      }),
    ).toThrow('IPv6');
    expect(() =>
      buildUdpDatagram({
        ...vector1Config,
        checksumMode: 'disabled',
        srcIp: '2001:db8::2',
        dstIp: '2001:db8::1',
      }),
    ).toThrow('IPv6');
  });

  it('IPv6 伪首部构造的报文可被正确解析', () => {
    const built = buildUdpDatagram({
      ...vector1Config,
      checksumMode: 'ipv6',
      srcIp: '2001:db8::2',
      dstIp: '2001:db8::1',
    });
    const parsed = parseUdpDatagram(built.hex, {
      ipVersion: 'ipv6',
      srcIp: '2001:db8::2',
      dstIp: '2001:db8::1',
    });
    expect(parsed.checksumValid).toBe(true);
  });
});

describe('向量 4：奇数长度载荷内部补 0', () => {
  it('5 字节载荷输出 13 字节且不含补字节，校验和为独立常量 0x6E58', () => {
    const built = buildUdpDatagram({
      ...vector1Config,
      payloadHex: '01 02 03 04 05',
    });
    expect(built.length).toBe(13);
    expect(built.bytes).toHaveLength(13);
    expect(built.bytes.slice(8)).toEqual([1, 2, 3, 4, 5]);
    expect(built.checksum).toBe(0x6e58);

    const parsed = parseUdpDatagram(built.hex, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.checksumValid).toBe(true);
    expect(parsed.payloadLength).toBe(5);
  });
});

describe('向量 5：异常输入全部中文抛错并带字段名或偏移', () => {
  it('7 字节 hex 抛错', () => {
    expect(() => parseUdpDatagram('04 D2 00 50 00 0E 81')).toThrow('8 字节');
  });

  it('Length 声明 20 实际 14 抛错并带字段名', () => {
    const truncated = '04 D2 00 50 00 14 81 78 54 65 73 74 2E 0A';
    expect(() => parseUdpDatagram(truncated)).toThrow('长度字段（Length');
  });

  it('Length 小于 8 抛错', () => {
    expect(() => parseUdpDatagram('04 D2 00 50 00 07 00 00')).toThrow('长度字段（Length');
  });

  it('端口 65536 抛错并带字段名，目的端口 0 抛错', () => {
    expect(() => buildUdpDatagram({ ...vector1Config, sourcePort: 65536 })).toThrow(
      '源端口（sourcePort）',
    );
    expect(() => buildUdpDatagram({ ...vector1Config, destinationPort: 65536 })).toThrow(
      '目的端口（destinationPort）',
    );
    expect(() => buildUdpDatagram({ ...vector1Config, destinationPort: 0 })).toThrow(
      '目的端口（destinationPort）',
    );
  });

  it('非法 hex gg 抛错', () => {
    expect(() => parseUdpDatagram('gg')).toThrow('十六进制（hex）');
  });
});

describe('向量 6：求和取反为 0 时传输 0xFFFF', () => {
  it('穷举确认源端口 34378 的原始反码和恰为 0，传输值改写为 0xFFFF，且回验通过', () => {
    // 独立穷举：找出所有使校验和字段为 0xFFFF 的源端口，34378 必须在列
    const ffffPorts: number[] = [];
    for (let port = 0; port <= 0xffff; port += 1) {
      const built = buildUdpDatagram({ ...vector1Config, sourcePort: port });
      if (built.checksum === 0xffff) {
        ffffPorts.push(port);
      }
    }
    expect(ffffPorts).toContain(34378);

    const built = buildUdpDatagram({ ...vector1Config, sourcePort: 34378 });
    expect(built.checksum).toBe(0xffff);
    expect(built.bytes[6]).toBe(0xff);
    expect(built.bytes[7]).toBe(0xff);

    const parsed = parseUdpDatagram(built.hex, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.checksumValid).toBe(true);
  });
});

describe('文本载荷', () => {
  it('payloadText 使用 UTF-8 编码并可往返解码', () => {
    const built = buildUdpDatagram({
      sourcePort: 40000,
      destinationPort: 53,
      payloadText: '你好',
      checksumMode: 'ipv4',
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(built.length).toBe(14);
    const parsed = parseUdpDatagram(built.hex, {
      srcIp: DEFAULT_SOURCE_IPV4,
      dstIp: DEFAULT_DESTINATION_IPV4,
    });
    expect(parsed.payloadText).toBe('你好');
    expect(parsed.checksumValid).toBe(true);
  });
});
