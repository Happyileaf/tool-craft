import { describe, expect, it } from 'vitest';
import {
  MAGIC_PACKET_SIZE,
  WolError,
  base64ToBytes,
  buildMagicPacket,
  bytesToBase64,
  bytesToHex,
  formatMac,
  hexToBytes,
  parseMacAddress,
  parseMagicPacket,
} from './wol';

describe('parseMacAddress', () => {
  it('接受冒号、连字符、Cisco 点分与无分隔符四种写法并产出相同字节', () => {
    const expected = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]);
    expect(parseMacAddress('AA:BB:CC:DD:EE:FF')).toEqual(expected);
    expect(parseMacAddress('aa-bb-cc-dd-ee-ff')).toEqual(expected);
    expect(parseMacAddress('aabb.ccdd.eeff')).toEqual(expected);
    expect(parseMacAddress('AABBCCDDEEFF')).toEqual(expected);
    expect(parseMacAddress('aa bb cc dd ee ff')).toEqual(expected);
  });

  it('对空串、5 字节、含非 hex 字符分别报错', () => {
    expect(() => parseMacAddress('')).toThrow(WolError);
    expect(() => parseMacAddress('AA:BB:CC:DD:EE')).toThrow(/12 个/);
    expect(() => parseMacAddress('GG:BB:CC:DD:EE:FF')).toThrow(WolError);
  });
});

describe('buildMagicPacket', () => {
  it('生成恰为 102 字节且结构为 6 字节 FF 同步头 + 16 次重复 MAC', () => {
    const packet = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    expect(packet).toHaveLength(MAGIC_PACKET_SIZE);
    expect(Array.from(packet.slice(0, 6))).toEqual([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    const macBlock = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
    for (let i = 0; i < 16; i += 1) {
      expect(Array.from(packet.slice(6 + i * 6, 12 + i * 6))).toEqual(macBlock);
    }
  });

  it('三种 MAC 写法产出字节完全一致', () => {
    const a = buildMagicPacket('AABBCCDDEEFF');
    const b = buildMagicPacket('AA-BB-CC-DD-EE-FF');
    const c = buildMagicPacket('AABB.CCDD.EEFF');
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});

describe('hex / base64 双向转换', () => {
  it('hex 与 Base64 输出互相解码后字节相等，Base64 长度为 136', () => {
    const packet = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    const hex = bytesToHex(packet);
    const b64 = bytesToBase64(packet);
    expect(b64).toHaveLength(136);
    expect(hexToBytes(hex)).toEqual(packet);
    expect(base64ToBytes(b64)).toEqual(packet);
  });

  it('带空格分组的 hex 也可被宽松解析', () => {
    const packet = buildMagicPacket('00:11:22:33:44:55');
    expect(hexToBytes(bytesToHex(packet, true))).toEqual(packet);
  });
});

describe('parseMagicPacket', () => {
  it('反向解析构造产物可还原 MAC 且校验通过', () => {
    const packet = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    const parsed = parseMagicPacket(packet);
    expect(parsed.targetMac).toBe('aa:bb:cc:dd:ee:ff');
    expect(formatMac(parseMacAddress(parsed.targetMac))).toBe(parsed.targetMac);
  });

  it('单字节篡改后解析返回明确失败原因', () => {
    const packet = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    packet[20] = 0x00;
    expect(() => parseMagicPacket(packet)).toThrow(/一致性/);
  });

  it('长度错误、同步头错误分别给出定位信息', () => {
    expect(() => parseMagicPacket(new Uint8Array(100))).toThrow(/102 字节/);
    const badSync = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    badSync[0] = 0x00;
    expect(() => parseMagicPacket(badSync)).toThrow(/同步流/);
  });

  it('hexToBytes 对奇数长度与非法字符报错', () => {
    expect(() => hexToBytes('abc')).toThrow(/偶数/);
    expect(() => hexToBytes('zz')).toThrow(/十六进制/);
  });
});
