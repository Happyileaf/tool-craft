import { describe, expect, it } from 'vitest';
import {
  MAGIC_PACKET_LENGTH,
  buildMagicPacket,
  formatMac,
  fromHex,
  parseMac,
  parseMagicPacket,
  toHex,
} from './wol';

describe('parseMac', () => {
  it('解析冒号分隔的标准 MAC', () => {
    expect(parseMac('aa:bb:cc:dd:ee:ff')).toEqual([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]);
  });

  it('解析连字符与无分隔符写法（含大写）', () => {
    expect(parseMac('00-11-22-33-44-55')).toEqual([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
    expect(parseMac('001122334455')).toEqual([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
  });

  it('解析 Cisco 点分风格 xxxx.xxxx.xxxx', () => {
    expect(parseMac('0011.2233.4455')).toEqual([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
  });

  it('非法输入抛出明确错误', () => {
    expect(() => parseMac('')).toThrow('不能为空');
    expect(() => parseMac('zz:bb:cc:dd:ee:ff')).toThrow('非法字符');
    expect(() => parseMac('aa:bb:cc:dd:ee')).toThrow('6 个字节');
    expect(() => parseMac('aa:bb:cc:dd:ee:ff:00')).toThrow('6 个字节');
  });
});

describe('formatMac', () => {
  it('输出冒号分隔大写格式', () => {
    expect(formatMac([0x00, 0x11, 0xab, 0xcd, 0xef, 0xff])).toBe('00:11:AB:CD:EF:FF');
  });
});

describe('buildMagicPacket', () => {
  it('生成 102 字节且结构正确的魔术包', () => {
    const packet = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    expect(packet).toBeInstanceOf(Uint8Array);
    expect(packet.length).toBe(MAGIC_PACKET_LENGTH);

    // 前 6 字节同步流
    expect(Array.from(packet.slice(0, 6))).toEqual([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);

    // 随后 16 次重复 MAC
    const mac = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
    for (let i = 0; i < 16; i += 1) {
      const start = 6 + i * 6;
      expect(Array.from(packet.slice(start, start + 6))).toEqual(mac);
    }
  });

  it('已知向量：以 00:11:22:33:44:55 生成的包头与包尾十六进制正确', () => {
    const packet = buildMagicPacket('00:11:22:33:44:55');
    const hex = toHex(packet);
    expect(hex.startsWith('FFFFFF'.repeat(1))).toBe(true);
    expect(hex.slice(0, 12)).toBe('FFFFFFFFFFFF');
    expect(hex.slice(12, 24)).toBe('001122334455');
    // 最后一次重复结尾
    expect(hex.slice(-12)).toBe('001122334455');
    expect(hex.length).toBe(102 * 2);
  });

  it('MAC 非法时抛错', () => {
    expect(() => buildMagicPacket('not-a-mac')).toThrow();
  });
});

describe('toHex / fromHex', () => {
  it('支持分隔符与大小写选项', () => {
    const bytes = new Uint8Array([0x0a, 0xff, 0x00]);
    expect(toHex(bytes)).toBe('0AFF00');
    expect(toHex(bytes, { separator: ' ' })).toBe('0A FF 00');
    expect(toHex(bytes, { uppercase: false })).toBe('0aff00');
  });

  it('fromHex 容忍空白、换行与 0x 前缀', () => {
    expect(Array.from(fromHex('0xFF FF\n00'))).toEqual([0xff, 0xff, 0x00]);
    expect(Array.from(fromHex('aabbcc'))).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it('fromHex 拒绝非法字符与奇数长度', () => {
    expect(() => fromHex('xyz')).toThrow('非法字符');
    expect(() => fromHex('abc')).toThrow('偶数');
    expect(() => fromHex('')).toThrow('不能为空');
  });
});

describe('parseMagicPacket', () => {
  it('往返：构造后解析还原目标 MAC', () => {
    const packet = buildMagicPacket('DE:AD:BE:EF:00:01');
    const parsed = parseMagicPacket(packet);
    expect(parsed.targetMac).toBe('DE:AD:BE:EF:00:01');
    expect(parsed.length).toBe(MAGIC_PACKET_LENGTH);
    expect(parsed.syncStream.every((byte) => byte === 0xff)).toBe(true);
    expect(parsed.repetitions).toHaveLength(16);
  });

  it('解析外部十六进制魔术包', () => {
    const packet = buildMagicPacket('11:22:33:44:55:66');
    const reparsed = parseMagicPacket(fromHex(toHex(packet, { separator: ' ' })));
    expect(reparsed.targetMac).toBe('11:22:33:44:55:66');
  });

  it('损坏包给出明确错误', () => {
    const badLength = new Uint8Array(100);
    expect(() => parseMagicPacket(badLength)).toThrow('102 字节');

    const badSync = new Uint8Array(MAGIC_PACKET_LENGTH);
    badSync.fill(0xff);
    badSync[0] = 0x00;
    expect(() => parseMagicPacket(badSync)).toThrow('同步流');

    const badRepeat = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    badRepeat[6 + 5 * 6] = 0x00;
    expect(() => parseMagicPacket(badRepeat)).toThrow('不一致');
  });
});
