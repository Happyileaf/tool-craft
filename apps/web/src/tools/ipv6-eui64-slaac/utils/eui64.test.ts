import { describe, expect, it } from 'vitest';
import {
  combineAddress,
  compressIpv6,
  computeEui64,
  deriveEui64,
  formatInterfaceId,
  formatMac,
  parseMac,
  parsePrefix64,
} from './eui64';

describe('parseMac', () => {
  it('解析冒号分隔写法', () => {
    expect(parseMac('00:1c:c0:ff:fe:80')).toEqual([0x00, 0x1c, 0xc0, 0xff, 0xfe, 0x80]);
  });

  it('解析连字符与无分隔符写法', () => {
    expect(parseMac('00-1C-C0-FF-FE-80')).toEqual([0x00, 0x1c, 0xc0, 0xff, 0xfe, 0x80]);
    expect(parseMac('001cc0fffe80')).toEqual([0x00, 0x1c, 0xc0, 0xff, 0xfe, 0x80]);
  });

  it('解析 Cisco 点分写法', () => {
    expect(parseMac('001c.c0ff.fe80')).toEqual([0x00, 0x1c, 0xc0, 0xff, 0xfe, 0x80]);
  });

  it('规范化为冒号小写形式', () => {
    expect(formatMac(parseMac('00-1C-C0-FF-FE-80')!)).toBe('00:1c:c0:ff:fe:80');
  });

  it('拒绝非法输入', () => {
    expect(parseMac('')).toBeNull();
    expect(parseMac('00:1c:c0:ff:fe')).toBeNull();
    expect(parseMac('00:1c:c0:ff:fe:zz')).toBeNull();
    expect(parseMac('001cc0fffe')).toBeNull();
    expect(parseMac('001c.c0ff.fe8')).toBeNull();
    expect(parseMac('gggg.hhhh.iiii')).toBeNull();
  });
});

describe('deriveEui64', () => {
  it('RFC 4291 向量：插入 ff:fe 并翻转 U/L 位', () => {
    const mac = parseMac('00-1C-C0-FF-FE-80')!;
    const eui = deriveEui64(mac);
    expect(eui).toEqual([0x02, 0x1c, 0xc0, 0xff, 0xfe, 0xff, 0xfe, 0x80]);
    expect(formatInterfaceId(eui)).toBe('21c:c0ff:feff:fe80');
  });

  it('已置位 U/L 位的首字节翻转回 0', () => {
    // 首字节 0x02（bit 1 为 1）→ 翻转为 0x00
    const eui = deriveEui64([0x02, 0x00, 0x00, 0x00, 0x00, 0x01]);
    expect(eui[0]).toBe(0x00);
  });

  it('奇数位值（如 0x0e）只翻转 bit 1（0x0e → 0x0c）', () => {
    const eui = deriveEui64([0x0e, 0, 0, 0, 0, 0]);
    expect(eui[0]).toBe(0x0c);
  });
});

describe('compressIpv6', () => {
  it('压缩最长零组', () => {
    expect(compressIpv6(['fe80', '0000', '0000', '0000', '021c', 'c0ff', 'feff', 'fe80']))
      .toBe('fe80::21c:c0ff:feff:fe80');
    expect(compressIpv6(['2001', '0db8', '0000', '0000', '0000', '0000', '0000', '0001']))
      .toBe('2001:db8::1');
    expect(compressIpv6(['0000', '0000', '0000', '0000', '0000', '0000', '0000', '0001']))
      .toBe('::1');
  });

  it('只有单个零组时不压缩', () => {
    expect(compressIpv6(['2001', '0db8', '0000', '0001', '0001', '0001', '0001', '0001']))
      .toBe('2001:db8:0:1:1:1:1:1');
  });
});

describe('parsePrefix64', () => {
  it('解析带与不带 /64 的前缀', () => {
    expect(parsePrefix64('2001:db8:1::/64')).toEqual([
      0x20, 0x01, 0x0d, 0xb8, 0x00, 0x01, 0x00, 0x00,
    ]);
    expect(parsePrefix64('2001:db8:1::')).toEqual([
      0x20, 0x01, 0x0d, 0xb8, 0x00, 0x01, 0x00, 0x00,
    ]);
  });

  it('拒绝非法前缀', () => {
    expect(parsePrefix64('2001:db8:1::/48')).toBeNull();
    expect(parsePrefix64('not-an-ip')).toBeNull();
    expect(parsePrefix64('2001::db8::1')).toBeNull();
  });
});

describe('computeEui64 端到端', () => {
  it('RFC 4291 经典向量', () => {
    const r = computeEui64('00-1C-C0-FF-FE-80');
    expect(r.error).toBeNull();
    expect(r.mac).toBe('00:1c:c0:ff:fe:80');
    expect(r.firstByteBefore).toBe('00');
    expect(r.firstByteAfter).toBe('02');
    expect(r.interfaceId).toBe('21c:c0ff:feff:fe80');
    expect(r.linkLocal).toBe('fe80::21c:c0ff:feff:fe80');
  });

  it('三种 MAC 写法结果一致', () => {
    const a = computeEui64('aa:bb:cc:dd:ee:ff');
    const b = computeEui64('aa-bb-cc-dd-ee-ff');
    const c = computeEui64('aabb.ccdd.eeff');
    expect(a.interfaceId).toBe('a8bb:ccff:fedd:eeff');
    expect(a.interfaceId).toBe(b.interfaceId);
    expect(b.interfaceId).toBe(c.interfaceId);
    expect(a.linkLocal).toBe('fe80::a8bb:ccff:fedd:eeff');
  });

  it('自定义 /64 前缀组合 SLAAC 地址', () => {
    const r = computeEui64('00:1c:c0:ff:fe:80', '2001:db8:abcd:0012::/64');
    expect(r.error).toBeNull();
    expect(r.slaac).toBe('2001:db8:abcd:12:21c:c0ff:feff:fe80');
  });

  it('省略 /64 后缀的前缀也可组合', () => {
    const r = computeEui64('00:1c:c0:ff:fe:80', '2001:db8:abcd:12::');
    expect(r.slaac).toBe('2001:db8:abcd:12:21c:c0ff:feff:fe80');
  });

  it('非 /64 掩码报错', () => {
    const r = computeEui64('00:1c:c0:ff:fe:80', '2001:db8::/48');
    expect(r.error).toContain('/64');
    expect(r.slaac).toBeNull();
  });

  it('非法 MAC 报错', () => {
    const r = computeEui64('zz:zz:zz:zz:zz:zz');
    expect(r.error).not.toBeNull();
    expect(r.interfaceId).toBeNull();
  });

  it('非法前缀报错但保留链路本地结果', () => {
    const r = computeEui64('00:1c:c0:ff:fe:80', 'garbage');
    expect(r.error).toContain('前缀');
    expect(r.linkLocal).toBe('fe80::21c:c0ff:feff:fe80');
  });
});

describe('combineAddress', () => {
  it('拼接前缀与接口标识', () => {
    const prefix = parsePrefix64('2001:db8::')!;
    const eui = deriveEui64(parseMac('00:1c:c0:ff:fe:80')!);
    expect(combineAddress(prefix, eui)).toBe('2001:db8::21c:c0ff:feff:fe80');
  });
});
