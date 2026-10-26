import { describe, it, expect } from 'vitest';
import { analyzeMac, formatMac, mac48ToEui64, parseMac } from './mac';

const MAC_48_BYTES = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
const EUI_64_BYTES = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77];

describe('parseMac', () => {
  it('解析冒号分隔的 MAC-48', () => {
    const result = parseMac('AA:BB:CC:DD:EE:FF');
    expect(result.bytes).toEqual(MAC_48_BYTES);
    expect(result.bitCount).toBe(48);
    expect(result.format).toBe('colon');
  });

  it('解析小写冒号地址并去除首尾空白', () => {
    const result = parseMac('  aa:bb:cc:dd:ee:ff\n');
    expect(result.bytes).toEqual(MAC_48_BYTES);
    expect(result.bitCount).toBe(48);
  });

  it('解析连字符分隔的 MAC-48', () => {
    const result = parseMac('AA-BB-CC-DD-EE-FF');
    expect(result.bytes).toEqual(MAC_48_BYTES);
    expect(result.format).toBe('hyphen');
  });

  it('解析 Cisco 点分 MAC-48', () => {
    const result = parseMac('aabb.ccdd.eeff');
    expect(result.bytes).toEqual(MAC_48_BYTES);
    expect(result.bitCount).toBe(48);
    expect(result.format).toBe('cisco');
  });

  it('解析裸十六进制 MAC-48', () => {
    const result = parseMac('AABBCCDDEEFF');
    expect(result.bytes).toEqual(MAC_48_BYTES);
    expect(result.format).toBe('bare');
  });

  it('解析冒号分隔的 EUI-64', () => {
    const result = parseMac('00:11:22:33:44:55:66:77');
    expect(result.bytes).toEqual(EUI_64_BYTES);
    expect(result.bitCount).toBe(64);
    expect(result.format).toBe('colon');
  });

  it('解析 Cisco 点分 EUI-64（4 组）', () => {
    const result = parseMac('0011.2233.4455.6677');
    expect(result.bytes).toEqual(EUI_64_BYTES);
    expect(result.bitCount).toBe(64);
  });

  it('解析裸十六进制 EUI-64', () => {
    const result = parseMac('0011223344556677');
    expect(result.bytes).toEqual(EUI_64_BYTES);
    expect(result.bitCount).toBe(64);
  });

  it('空输入抛出中文错误', () => {
    expect(() => parseMac('   ')).toThrow('请输入 MAC 地址');
  });

  it('冒号格式存在非 2 位分组时报错', () => {
    expect(() => parseMac('AA:BB:CC:DD:EE:F')).toThrow('冒号格式');
    expect(() => parseMac('AA:BB:CC:DD:EE:FFF')).toThrow('冒号格式');
  });

  it('连字符格式存在非 2 位分组时报错', () => {
    expect(() => parseMac('AA-BB-CC-DD-EE')).toThrow('仅支持 48 位');
    expect(() => parseMac('AA-BB-CC-DD-EE-GG')).toThrow('连字符格式');
  });

  it('Cisco 点分格式存在非 4 位分组时报错', () => {
    expect(() => parseMac('aabb.ccdd.ee')).toThrow('Cisco 点分格式要求每组 4 位');
  });

  it('Cisco 点分格式组数既非 3 也非 4 时报错', () => {
    expect(() => parseMac('aabb.ccdd')).toThrow('Cisco 点分格式 MAC-48 为 3 组、EUI-64 为 4 组');
  });

  it('裸十六进非法长度或非法字符时报错', () => {
    expect(() => parseMac('AABBCCDDEE')).toThrow('裸十六进制格式');
    expect(() => parseMac('AABBCCDDEEFF0')).toThrow('裸十六进制格式');
    expect(() => parseMac('AABBCCDDEEGG')).toThrow('裸十六进制格式');
  });

  it('分隔格式分组数对应的位数不合法时报错', () => {
    expect(() => parseMac('AA:BB:CC:DD:EE')).toThrow('仅支持 48 位');
    expect(() => parseMac('AA:BB:CC:DD:EE:FF:00')).toThrow('仅支持 48 位');
  });
});

describe('formatMac', () => {
  it('输出冒号、连字符、Cisco 与裸格式（默认大写）', () => {
    expect(formatMac(MAC_48_BYTES, 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(formatMac(MAC_48_BYTES, 'hyphen')).toBe('AA-BB-CC-DD-EE-FF');
    expect(formatMac(MAC_48_BYTES, 'cisco')).toBe('AABB.CCDD.EEFF');
    expect(formatMac(MAC_48_BYTES, 'bare')).toBe('AABBCCDDEEFF');
  });

  it('小写输出保留前导零', () => {
    const bytes = [0x00, 0x0a, 0xff, 0x01, 0x02, 0x03];
    expect(formatMac(bytes, 'colon', false)).toBe('00:0a:ff:01:02:03');
    expect(formatMac(bytes, 'cisco', false)).toBe('000a.ff01.0203');
  });

  it('EUI-64 字节输出为 4 个 Cisco 词', () => {
    expect(formatMac(EUI_64_BYTES, 'cisco')).toBe('0011.2233.4455.6677');
  });

  it('解析后再格式化可跨格式往返', () => {
    const parsed = parseMac('aabb.ccdd.eeff');
    expect(formatMac(parsed.bytes, 'colon')).toBe('AA:BB:CC:DD:EE:FF');
    expect(formatMac(parsed.bytes, 'bare', false)).toBe('aabbccddeeff');
  });
});

describe('analyzeMac', () => {
  it('识别全球单播地址（I/G=0、U/L=0）', () => {
    const analysis = analyzeMac([0x3c, 0x5a, 0xb4, 0xdd, 0xee, 0xff], 48);
    expect(analysis.bitCount).toBe(48);
    expect(analysis.isMulticast).toBe(false);
    expect(analysis.isLocallyAdministered).toBe(false);
    expect(analysis.transmissionType).toContain('单播');
    expect(analysis.administrationType).toContain('全球唯一');
    expect(analysis.oui).toBe('3C:5A:B4');
    expect(analysis.deviceIdentifier).toBe('DD:EE:FF');
    expect(analysis.firstOctetBinary).toBe('00111100');
  });

  it('识别组播位（首字节最低位为 1）', () => {
    const analysis = analyzeMac([0x01, 0x00, 0x5e, 0x00, 0x00, 0x01], 48);
    expect(analysis.isMulticast).toBe(true);
    expect(analysis.transmissionType).toContain('组播');
    expect(analysis.firstOctetBinary).toBe('00000001');
  });

  it('识别本地管理位（首字节次低位为 1）', () => {
    const analysis = analyzeMac([0x02, 0x42, 0x0b, 0x12, 0x34, 0x56], 48);
    expect(analysis.isMulticast).toBe(false);
    expect(analysis.isLocallyAdministered).toBe(true);
    expect(analysis.administrationType).toContain('本地管理');
  });

  it('组播与本地管理位同时置位（首字节 0x03）', () => {
    const analysis = analyzeMac([0x03, 0x00, 0x00, 0x00, 0x00, 0x01], 48);
    expect(analysis.isMulticast).toBe(true);
    expect(analysis.isLocallyAdministered).toBe(true);
  });

  it('EUI-64 的设备标识为后 5 字节', () => {
    const analysis = analyzeMac(EUI_64_BYTES, 64);
    expect(analysis.oui).toBe('00:11:22');
    expect(analysis.deviceIdentifier).toBe('33:44:55:66:77');
    expect(analysis.bitCount).toBe(64);
  });
});

describe('mac48ToEui64', () => {
  it('在第 3、4 字节之间插入 FF:FE', () => {
    expect(mac48ToEui64(MAC_48_BYTES)).toEqual([
      0xaa, 0xbb, 0xcc, 0xff, 0xfe, 0xdd, 0xee, 0xff,
    ]);
  });

  it('派生结果可格式化为 8 字节冒号形式', () => {
    const eui64 = mac48ToEui64(parseMac('00:11:22:33:44:55').bytes);
    expect(formatMac(eui64, 'colon')).toBe('00:11:22:FF:FE:33:44:55');
  });

  it('非 6 字节输入抛出错误', () => {
    expect(() => mac48ToEui64(EUI_64_BYTES)).toThrow('仅 MAC-48（6 字节）可以派生 EUI-64');
    expect(() => mac48ToEui64([0xaa, 0xbb])).toThrow('仅 MAC-48（6 字节）可以派生 EUI-64');
  });
});
