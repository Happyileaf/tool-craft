import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, parsePcap } from './pcap';
import { DEFAULT_PCAP_HEX } from '../constants';

const u16le = (value: number): number[] => [value & 0xff, (value >> 8) & 0xff];
const u32le = (value: number): number[] => [
  value & 0xff,
  (value >>> 8) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 24) & 0xff,
];
const u32be = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

const buildGlobalHeader = (
  magic: number[],
  endian: 'le' | 'be',
  version: [number, number],
  snapLength: number,
  linkType: number,
): number[] => {
  const w16 = endian === 'le' ? u16le : (value: number) => [value >>> 8, value & 0xff];
  const w32 = endian === 'le' ? u32le : u32be;
  return [
    ...magic,
    ...w16(version[0]),
    ...w16(version[1]),
    ...w32(0),
    ...w32(0),
    ...w32(snapLength),
    ...w32(linkType),
  ];
};

const buildRecord = (
  endian: 'le' | 'be',
  seconds: number,
  fraction: number,
  captured: number,
  original: number,
  data: number[],
): number[] => {
  const w32 = endian === 'le' ? u32le : u32be;
  return [...w32(seconds), ...w32(fraction), ...w32(captured), ...w32(original), ...data];
};

describe('hexToBytes / bytesToHex', () => {
  it('tolerates spaces, colons, dashes and 0x prefixes', () => {
    expect(hexToBytes('0xd4 0xc3:b2-a1')).toEqual([0xd4, 0xc3, 0xb2, 0xa1]);
  });

  it('rejects empty input, illegal characters and odd length', () => {
    expect(() => hexToBytes('   ')).toThrow('请输入十六进制数据');
    expect(() => hexToBytes('zz')).toThrow('包含非法十六进制字符');
    expect(() => hexToBytes('abc')).toThrow('偶数');
  });

  it('groups output by hex characters', () => {
    expect(bytesToHex([1, 2, 3, 4], 1)).toBe('01 02 03 04');
    expect(bytesToHex([1, 2, 3, 4], 4)).toBe('01020304');
    expect(bytesToHex([1, 2, 3, 4, 5, 6, 7, 8], 4)).toBe('01020304 05060708');
  });
});

describe('parsePcap with the default sample', () => {
  it('parses the global header of the little-endian microsecond sample', () => {
    const file = parsePcap(hexToBytes(DEFAULT_PCAP_HEX));
    expect(file.magic).toBe('0xA1B2C3D4');
    expect(file.endianness).toBe('little');
    expect(file.timestampResolution).toBe('microsecond');
    expect(file.versionMajor).toBe(2);
    expect(file.versionMinor).toBe(4);
    expect(file.snapLength).toBe(262144);
    expect(file.linkType).toBe(1);
    expect(file.linkTypeName).toBe('Ethernet (10Mb)');
    expect(file.fileLength).toBe(174);
    expect(file.totalPackets).toBe(2);
    expect(file.omittedPackets).toBe(0);
    expect(file.warnings).toEqual([]);
  });

  it('parses packet records including a snaplen-truncated packet', () => {
    const file = parsePcap(hexToBytes(DEFAULT_PCAP_HEX));
    expect(file.packets).toHaveLength(2);

    const first = file.packets[0]!;
    expect(first.index).toBe(1);
    expect(first.timestampSeconds).toBe(1700000000);
    expect(first.timestampFraction).toBe(123456);
    expect(first.timestamp).toBe('2023-11-14T22:13:20.123Z');
    expect(first.capturedLength).toBe(67);
    expect(first.originalLength).toBe(67);
    expect(first.truncated).toBe(false);

    const second = file.packets[1]!;
    expect(second.index).toBe(2);
    expect(second.timestamp).toBe('2023-11-14T22:13:21.000Z');
    expect(second.capturedLength).toBe(51);
    expect(second.originalLength).toBe(61);
    expect(second.truncated).toBe(true);
  });
});

describe('parsePcap endianness and timestamp precision', () => {
  it('parses a big-endian microsecond file', () => {
    const bytes = [
      ...buildGlobalHeader([0xa1, 0xb2, 0xc3, 0xd4], 'be', [2, 4], 65535, 1),
      ...buildRecord('be', 1000, 500000, 4, 4, [0xaa, 0xbb, 0xcc, 0xdd]),
    ];
    const file = parsePcap(bytes);
    expect(file.endianness).toBe('big');
    expect(file.timestampResolution).toBe('microsecond');
    expect(file.magic).toBe('0xA1B2C3D4');
    expect(file.packets).toHaveLength(1);
    expect(file.packets[0]!.timestamp).toBe('1970-01-01T00:16:40.500Z');
    expect(file.packets[0]!.dataHex).toBe('AABBCCDD');
  });

  it('parses a little-endian nanosecond file', () => {
    const bytes = [
      ...buildGlobalHeader([0x4d, 0x3c, 0xb2, 0xa1], 'le', [2, 4], 65535, 1),
      ...buildRecord('le', 1, 123456789, 2, 2, [0x01, 0x02]),
    ];
    const file = parsePcap(bytes);
    expect(file.endianness).toBe('little');
    expect(file.timestampResolution).toBe('nanosecond');
    expect(file.magic).toBe('0xA1B23C4D');
    expect(file.packets[0]!.timestamp).toBe('1970-01-01T00:00:01.123Z');
  });
});

describe('parsePcap validation', () => {
  it('rejects pcapng files with a clear message', () => {
    const pcapng = [0x0a, 0x0d, 0x0d, 0x0a, ...new Array(20).fill(0)];
    expect(() => parsePcap(pcapng)).toThrow('pcapng');
  });

  it('rejects unknown magic values', () => {
    expect(() => parsePcap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])).toThrow(
      '未识别的文件 magic',
    );
  });

  it('rejects files shorter than the global header', () => {
    expect(() => parsePcap([0xd4, 0xc3, 0xb2, 0xa1])).toThrow('24 字节');
  });

  it('warns when trailing bytes cannot form a complete record header', () => {
    const bytes = [
      ...buildGlobalHeader([0xd4, 0xc3, 0xb2, 0xa1], 'le', [2, 4], 65535, 1),
      0x01,
      0x02,
      0x03,
    ];
    const file = parsePcap(bytes);
    expect(file.packets).toHaveLength(0);
    expect(file.warnings[0]).toContain('不足以构成完整分组头');
  });

  it('throws when a record claims more captured bytes than remain', () => {
    const bytes = [
      ...buildGlobalHeader([0xd4, 0xc3, 0xb2, 0xa1], 'le', [2, 4], 65535, 1),
      ...buildRecord('le', 1, 0, 64, 64, [0x00, 0x01]),
    ];
    expect(() => parsePcap(bytes)).toThrow('仅剩 2 字节');
  });

  it('warns when captured length exceeds the global snaplen', () => {
    const bytes = [
      ...buildGlobalHeader([0xd4, 0xc3, 0xb2, 0xa1], 'le', [2, 4], 2, 1),
      ...buildRecord('le', 1, 0, 4, 4, [1, 2, 3, 4]),
    ];
    const file = parsePcap(bytes);
    expect(file.warnings[0]).toContain('超过全局 snaplen 2');
  });
});
