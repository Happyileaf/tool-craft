import { describe, expect, it } from 'vitest';
import {
  ICMP_HEADER_LENGTH,
  ICMP_TYPE_ECHO_REPLY,
  ICMP_TYPE_ECHO_REQUEST,
  TYPICAL_PAYLOAD_LIMIT,
  type IcmpBuildInput,
  type IcmpEchoType,
  buildIcmpPacket,
  decodeTextPayload,
  encodeTextPayload,
  formatHex,
  internetChecksum,
  normalizeHexInput,
  onesComplementSum,
  parseIcmpPacket,
} from './icmp';

/** 独立 node 参考实现预计算：id=0x1234 seq=1 + 32 字节字母表 payload，校验和 0x3B27 */
const KNOWN_REQUEST_HEX =
  '08 00 3B 27 12 34 00 01 61 62 63 64 65 66 67 68 69 6A 6B 6C 6D 6E 6F 70 71 72 73 74 75 76 77 61 62 63 64 65 66 67 68 69';

describe('RFC 1071 校验和', () => {
  it('全 0 数据校验和为 0xFFFF', () => {
    expect(internetChecksum(new Uint8Array([0, 0, 0, 0]))).toBe(0xffff);
  });

  it('含合法校验和的完整报文反码求和折叠为 0xFFFF', () => {
    const bytes = normalizeHexInput(KNOWN_REQUEST_HEX);
    expect(onesComplementSum(bytes)).toBe(0xffff);
  });

  it('奇数长度 payload 末尾补 0 参与求和', () => {
    // 参考实现预计算：首部清零 + 三字节 0x414243
    const zeroed = new Uint8Array([8, 0, 0, 0, 0, 1, 0, 1, 0x41, 0x42, 0x43]);
    expect(internetChecksum(zeroed)).toBe(0x73bb);
  });
});

describe('buildIcmpPacket 构建', () => {
  it('按 RFC 792 大端布局输出，校验和与独立计算一致', () => {
    const packet = buildIcmpPacket({
      type: ICMP_TYPE_ECHO_REQUEST,
      identifier: 0x1234,
      sequence: 0x0001,
      data: encodeTextPayload('abcdefghijklmnopqrstuvwabcdefghi'),
    });
    expect(packet.length).toBe(ICMP_HEADER_LENGTH + 32);
    expect(formatHex(packet)).toBe(KNOWN_REQUEST_HEX);
  });

  it('Echo Reply 使用 Type=0，Code 恒为 0，校验和随类型变化', () => {
    const reply = buildIcmpPacket({
      type: ICMP_TYPE_ECHO_REPLY,
      identifier: 1,
      sequence: 1,
      data: new Uint8Array(0),
    });
    expect(reply[0]).toBe(0);
    expect(reply[1]).toBe(0);
    const request = buildIcmpPacket({
      type: ICMP_TYPE_ECHO_REQUEST,
      identifier: 1,
      sequence: 1,
      data: new Uint8Array(0),
    });
    expect(request[0]).toBe(8);
    expect(reply[2]).not.toBe(request[2]);
  });

  it('标识符 / 序列号越界与非法 Type 抛错', () => {
    const base: IcmpBuildInput = {
      type: ICMP_TYPE_ECHO_REQUEST,
      identifier: 0,
      sequence: 0,
      data: new Uint8Array(0),
    };
    expect(() => buildIcmpPacket({ ...base, identifier: 65536 })).toThrow('Identifier');
    expect(() => buildIcmpPacket({ ...base, sequence: -1 })).toThrow('Sequence');
    expect(() => buildIcmpPacket({ ...base, type: 3 as IcmpEchoType })).toThrow('Type');
  });
});

describe('parseIcmpPacket 解析', () => {
  it('已知抓包 hex 逐字段解析正确，校验和核对通过', () => {
    const parsed = parseIcmpPacket(normalizeHexInput(KNOWN_REQUEST_HEX));
    expect(parsed.type).toBe(8);
    expect(parsed.code).toBe(0);
    expect(parsed.checksum).toBe(0x3b27);
    expect(parsed.identifier).toBe(0x1234);
    expect(parsed.sequence).toBe(1);
    expect(parsed.data.length).toBe(32);
    expect(parsed.checksumValid).toBe(true);
    expect(parsed.recomputedChecksum).toBe(0x3b27);
    expect(decodeTextPayload(parsed.data).startsWith('abcdefgh')).toBe(true);
  });

  it('构建 → 解析往返一致', () => {
    const original: IcmpBuildInput = {
      type: ICMP_TYPE_ECHO_REQUEST,
      identifier: 54321,
      sequence: 42,
      data: encodeTextPayload('ping round-trip'),
    };
    const parsed = parseIcmpPacket(buildIcmpPacket(original));
    expect(parsed.type).toBe(original.type);
    expect(parsed.identifier).toBe(original.identifier);
    expect(parsed.sequence).toBe(original.sequence);
    expect(Array.from(parsed.data)).toEqual(Array.from(original.data));
    expect(parsed.checksumValid).toBe(true);
  });

  it('篡改报文后校验和核对失败，但重算值仍可给出', () => {
    const bytes = normalizeHexInput(KNOWN_REQUEST_HEX);
    bytes[10] = 0x00; // 破坏 payload
    const parsed = parseIcmpPacket(bytes);
    expect(parsed.checksumValid).toBe(false);
    expect(parsed.recomputedChecksum).not.toBe(parsed.checksum);
  });

  it('Code 非 0 与超长 payload 产生警告', () => {
    const bytes = normalizeHexInput(KNOWN_REQUEST_HEX);
    bytes[1] = 5;
    const parsed = parseIcmpPacket(bytes);
    expect(parsed.warnings.some((item) => item.includes('Code'))).toBe(true);

    const longInput: IcmpBuildInput = {
      type: ICMP_TYPE_ECHO_REQUEST,
      identifier: 1,
      sequence: 1,
      data: new Uint8Array(TYPICAL_PAYLOAD_LIMIT + 1),
    };
    const longPacket = buildIcmpPacket(longInput);
    expect(parseIcmpPacket(longPacket).warnings.some((item) => item.includes('MTU'))).toBe(true);
  });

  it('不足 8 字节抛错', () => {
    expect(() => parseIcmpPacket(new Uint8Array([8, 0, 0, 0]))).toThrow('不足');
  });
});

describe('normalizeHexInput 噪声剥离', () => {
  it('容忍空格、冒号、逗号、换行与 0x 前缀', () => {
    const expected = Array.from(normalizeHexInput(KNOWN_REQUEST_HEX));
    const noisy = `0x08:00, 0x3B\n0x27 12 34`;
    expect(Array.from(normalizeHexInput(noisy))).toEqual(expected.slice(0, 6));
  });

  it('非法字符与奇数长度抛错', () => {
    expect(() => normalizeHexInput('08 GG')).toThrow('非法字符');
    expect(() => normalizeHexInput('080')).toThrow('奇数');
  });

  it('空输入返回零长度数组', () => {
    expect(normalizeHexInput('   ').length).toBe(0);
  });
});
