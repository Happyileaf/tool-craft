import { describe, expect, it } from 'vitest';
import {
  DhcpError,
  buildDhcpPacket,
  bytesToHex,
  formatLeaseTime,
  getDhcpMessageName,
  getOptionName,
  hexToBytes,
  parseDhcpPacket,
  type DhcpBuildConfig,
} from './dhcp';
import { SAMPLE_DISCOVER_HEX } from '../constants';

describe('hexToBytes 宽松清洗', () => {
  it('去除空格、换行与 0x 前缀', () => {
    expect(Array.from(hexToBytes('0x01 02\n03'))).toEqual([1, 2, 3]);
  });

  it('奇数位 hex 与非 hex 字符分别报错', () => {
    expect(() => hexToBytes('abc')).toThrow(/奇数/);
    expect(() => hexToBytes('zz')).toThrow(/非十六进制/);
    expect(() => hexToBytes('')).toThrow(/为空/);
  });
});

describe('内置 DISCOVER 样例解析', () => {
  it('op=1、htype=1、hlen=6、xid 与 chaddr 正确，cookie 校验通过，option 53 为 DISCOVER(1)', () => {
    const parsed = parseDhcpPacket(SAMPLE_DISCOVER_HEX);
    expect(parsed.header.op).toBe(1);
    expect(parsed.header.opName).toBe('BOOTREQUEST');
    expect(parsed.header.htype).toBe(1);
    expect(parsed.header.hlen).toBe(6);
    expect(parsed.header.xid).toBe(0x12345678);
    expect(parsed.header.chaddrMac).toBe('00:11:22:33:44:55');
    expect(parsed.cookie).toBe(0x63825363);
    expect(parsed.packetLength).toBe(256);
    const opt53 = parsed.options.find((option) => option.type === 53);
    expect(opt53?.display).toBe('DISCOVER (1)');
    expect(opt53?.name).toBe('DHCP Message Type');
    const opt51 = parsed.options.find((option) => option.type === 51);
    expect(opt51?.display).toContain('86400 秒');
    expect(opt51?.display).toContain('1 天');
    const opt55 = parsed.options.find((option) => option.type === 55);
    expect(opt55?.display).toBe('1, 3, 6');
    expect(parsed.warnings).toEqual([]);
  });
});

describe('构造 + 往返（测试向量①）', () => {
  const config: DhcpBuildConfig = {
    xid: 0x12345678,
    chaddr: '00:11:22:33:44:55',
    messageType: 1,
    options: [
      { type: 51, value: '86400' },
      { type: 55, value: '1,3,6' },
    ],
  };

  it('构造 DISCOVER 并解析回相同字段', () => {
    const bytes = buildDhcpPacket(config);
    const parsed = parseDhcpPacket(bytes);
    expect(parsed.header.op).toBe(1);
    expect(parsed.header.htype).toBe(1);
    expect(parsed.header.hlen).toBe(6);
    expect(parsed.header.xid).toBe(0x12345678);
    expect(parsed.header.chaddrMac).toBe('00:11:22:33:44:55');
    expect(parsed.cookie).toBe(0x63825363);
    const opt53 = parsed.options.find((option) => option.type === 53);
    expect(opt53?.name).toBe('DHCP Message Type');
    expect(opt53?.display).toBe('DISCOVER (1)');
    const opt51 = parsed.options.find((option) => option.type === 51);
    expect(opt51?.valueHex).toBe('00015180');
    expect(opt51?.display).toContain('86400 秒');
    const opt55 = parsed.options.find((option) => option.type === 55);
    expect(opt55?.valueHex).toBe('010306');
    expect(opt55?.display).toBe('1, 3, 6');
    // 以 0xFF end 收尾
    expect(bytes[bytes.length - 1]).toBe(0xff);
  });

  it('parse(build(x)) 往返深等（测试向量⑥）', () => {
    const fullConfig: DhcpBuildConfig = {
      op: 1,
      xid: 0xabcdef01,
      secs: 30,
      flags: 0,
      ciaddr: '0.0.0.0',
      chaddr: 'aa:bb:cc:dd:ee:ff',
      sname: '',
      file: '',
      messageType: 3,
      options: [
        { type: 50, value: '192.168.1.100' },
        { type: 51, value: '3600' },
        { type: 55, value: '1,3,6,12,15' },
        { type: 12, value: 'test-host' },
        { type: 61, value: '01aabbccddeeff' },
        { type: 1, value: '255.255.255.0' },
        { type: 3, value: '192.168.1.1' },
        { type: 6, value: '8.8.8.8, 1.1.1.1' },
        { type: 15, value: 'example.com' },
      ],
    };
    const once = parseDhcpPacket(buildDhcpPacket(fullConfig));
    const twice = parseDhcpPacket(once.packetHex);
    expect(twice.header).toEqual(once.header);
    expect(twice.options).toEqual(once.options);
    expect(twice.cookie).toBe(once.cookie);
    expect(twice.packetLength).toBe(once.packetLength);
  });
});

describe('8 种消息类型 option53 映射（测试向量②）', () => {
  const names = ['DISCOVER', 'OFFER', 'REQUEST', 'DECLINE', 'ACK', 'NAK', 'RELEASE', 'INFORM'];
  it.each(names.map((name, index) => [name, index + 1] as const))(
    '%s 对应 option 53 值 %d',
    (name, code) => {
      const parsed = parseDhcpPacket(
        buildDhcpPacket({ xid: 1, chaddr: '00:11:22:33:44:55', messageType: code }),
      );
      const opt53 = parsed.options.find((option) => option.type === 53);
      expect(opt53?.display).toBe(`${name} (${code})`);
      expect(getDhcpMessageName(code)).toBe(name);
    },
  );
});

describe('padding 与 end 处理（测试向量③）', () => {
  it('构造产物含 0x00 padding 时解析不报错且 padding 被跳过', () => {
    const bytes = buildDhcpPacket({
      xid: 0x12345678,
      chaddr: '00:11:22:33:44:55',
      messageType: 1,
      options: [{ type: 55, value: '1,3,6' }],
    });
    // 53(3B) + 55(5B) = 8B，options 起始 240，240+8=248，(248+1)%4=1 → 3 字节 padding 后 end
    const padCount = bytes.slice(240, bytes.length - 1).filter((b) => b === 0).length;
    expect(padCount).toBeGreaterThan(0);
    const parsed = parseDhcpPacket(bytes);
    expect(parsed.options).toHaveLength(2);
    expect(parsed.warnings).toEqual([]);
  });

  it('手工注入的连续 padding 也被跳过', () => {
    const bytes = buildDhcpPacket({
      xid: 1,
      chaddr: '00:11:22:33:44:55',
      messageType: 1,
    });
    const mutated = new Uint8Array(bytes.length + 3);
    mutated.set(bytes.slice(0, bytes.length - 1), 0);
    mutated.set([0, 0, 0xff], bytes.length - 1);
    const parsed = parseDhcpPacket(mutated);
    expect(parsed.options).toHaveLength(1);
  });

  it('缺少 end 标记时给出非阻断警告且字段正常解析', () => {
    const bytes = buildDhcpPacket({
      xid: 1,
      chaddr: '00:11:22:33:44:55',
      messageType: 1,
    });
    const noEnd = bytes.slice(0, bytes.length - 1);
    const parsed = parseDhcpPacket(noEnd);
    expect(parsed.warnings.some((warning) => warning.includes('end'))).toBe(true);
    expect(parsed.options).toHaveLength(1);
  });
});

describe('未知 option（测试向量④）', () => {
  it('未知 type 显示 Unknown (<type>) 并保留原始 hex', () => {
    const bytes = buildDhcpPacket({
      xid: 1,
      chaddr: '00:11:22:33:44:55',
      messageType: 1,
      options: [{ type: 230, value: 'deadbeef' }],
    });
    const parsed = parseDhcpPacket(bytes);
    const unknown = parsed.options.find((option) => option.type === 230);
    expect(unknown?.name).toBe('Unknown (230)');
    expect(unknown?.valueHex).toBe('DEADBEEF');
    expect(unknown?.display).toBe('DEADBEEF');
    expect(getOptionName(99)).toBe('Unknown (99)');
  });
});

describe('错误场景（测试向量⑤）', () => {
  it('总长不足 240 字节报错', () => {
    expect(() => parseDhcpPacket(new Uint8Array(239))).toThrow(/240|236/);
  });

  it('cookie 错误报错并带偏移定位', () => {
    const bytes = new Uint8Array(244);
    expect(() => parseDhcpPacket(bytes)).toThrow(/magic cookie|偏移 236/);
  });

  it('option length 越界报错', () => {
    const bytes = new Uint8Array(244);
    bytes[236] = 0x63;
    bytes[237] = 0x82;
    bytes[238] = 0x53;
    bytes[239] = 0x63;
    bytes[240] = 50;
    bytes[241] = 4;
    // 声明 4 字节但后面没有 value
    expect(() => parseDhcpPacket(bytes)).toThrow(/越界/);
  });

  it('option 缺 length 字节报错', () => {
    const bytes = new Uint8Array(241);
    bytes[236] = 0x63;
    bytes[237] = 0x82;
    bytes[238] = 0x53;
    bytes[239] = 0x63;
    bytes[240] = 50;
    expect(() => parseDhcpPacket(bytes)).toThrow(/length/);
  });

  it('奇数位 hex 报错', () => {
    expect(() => parseDhcpPacket('abc')).toThrow(DhcpError);
  });

  it('构造期非法输入抛 DhcpError', () => {
    expect(() =>
      buildDhcpPacket({ xid: 1, chaddr: '00:11:22:33:44', messageType: 1 }),
    ).toThrow(/MAC/);
    expect(() =>
      buildDhcpPacket({ xid: 1, chaddr: '00:11:22:33:44:55', messageType: 9 }),
    ).toThrow(/1–8/);
    expect(() =>
      buildDhcpPacket({
        xid: 1,
        chaddr: '00:11:22:33:44:55',
        messageType: 1,
        options: [{ type: 53, value: '1' }],
      }),
    ).toThrow(/option 53/);
    expect(() =>
      buildDhcpPacket({
        xid: 1,
        chaddr: '00:11:22:33:44:55',
        messageType: 1,
        options: [{ type: 51, value: 'abc' }],
      }),
    ).toThrow(/租期/);
  });
});

describe('常用 option 语义化展示', () => {
  it('IP 类、文本类与租期换算正确', () => {
    const parsed = parseDhcpPacket(
      buildDhcpPacket({
        xid: 1,
        chaddr: '00:11:22:33:44:55',
        messageType: 5,
        options: [
          { type: 1, value: '255.255.255.0' },
          { type: 6, value: '8.8.8.8, 1.1.1.1' },
          { type: 12, value: 'host-1' },
          { type: 82, value: '0106aabbccddeeff' },
        ],
      }),
    );
    expect(parsed.options.find((o) => o.type === 1)?.display).toBe('255.255.255.0');
    expect(parsed.options.find((o) => o.type === 6)?.display).toBe('8.8.8.8, 1.1.1.1');
    expect(parsed.options.find((o) => o.type === 12)?.display).toBe('host-1');
    expect(parsed.options.find((o) => o.type === 82)?.display).toContain('0106AABBCCDDEEFF');
  });

  it('formatLeaseTime 天/时换算', () => {
    expect(formatLeaseTime(86400)).toContain('1 天');
    expect(formatLeaseTime(3600)).toContain('1 小时');
    expect(formatLeaseTime(60)).toBe('60 秒');
  });
});

describe('chaddr 冗余字节警告', () => {
  it('hlen 之外存在非零字节时给出警告但 MAC 仍按 hlen 解析', () => {
    const bytes = buildDhcpPacket({
      xid: 1,
      chaddr: '00:11:22:33:44:55',
      messageType: 1,
    });
    bytes[28 + 6] = 0xab; // chaddr 第 7 字节
    const parsed = parseDhcpPacket(bytes);
    expect(parsed.header.chaddrMac).toBe('00:11:22:33:44:55');
    expect(parsed.warnings.some((w) => w.includes('chaddr'))).toBe(true);
  });
});

describe('bytesToHex', () => {
  it('输出连续大写 hex', () => {
    expect(bytesToHex(new Uint8Array([0x0a, 0xff, 0x00]))).toBe('0AFF00');
  });
});
