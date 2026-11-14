import { describe, expect, it } from 'vitest';
import {
  buildEthernetFrame,
  bytesToHex,
  crc32,
  formatMac,
  getEtherTypeName,
  hexToBytes,
  parseEthernetFrame,
  parseMac,
} from './ethernet';
import { DEFAULT_FRAME_HEX, SAMPLE_PAYLOAD_HEX } from '../constants';

describe('crc32', () => {
  it('matches the CRC-32/ISO-HDLC check value 0xCBF43926 for "123456789"', () => {
    expect(crc32([...'123456789'].map((char) => char.charCodeAt(0)))).toBe(0xcbf43926);
  });
});

describe('hex helpers', () => {
  it('accepts spaces, commas, colons and 0x prefixes', () => {
    expect(hexToBytes('0x02, 00:00-00 01')).toEqual([2, 0, 0, 0, 1]);
  });

  it('rejects odd length and non-hex characters', () => {
    expect(() => hexToBytes('abc')).toThrow('偶数');
    expect(() => hexToBytes('zz')).toThrow('非法');
    expect(() => hexToBytes('')).toThrow('请输入');
  });

  it('formats MAC addresses', () => {
    expect(formatMac(parseMac('02-00-00-00-00-01'))).toBe('02:00:00:00:00:01');
    expect(() => parseMac('02:00:00:00:01')).toThrow('无效');
  });

  it('groups bytes when requested', () => {
    expect(bytesToHex([1, 2, 3, 4], 2)).toBe('0102 0304');
  });

  it('maps known EtherTypes', () => {
    expect(getEtherTypeName(0x0800)).toBe('IPv4');
    expect(getEtherTypeName(0x1234)).toContain('未知');
  });
});

describe('parseEthernetFrame', () => {
  it('parses the 64-byte sample and validates FCS', () => {
    const frame = parseEthernetFrame(DEFAULT_FRAME_HEX);
    expect(frame.destinationMac).toBe('02:00:00:00:00:01');
    expect(frame.sourceMac).toBe('02:00:00:00:00:02');
    expect(frame.etherType).toBe(0x0800);
    expect(frame.etherTypeName).toBe('IPv4');
    expect(frame.frameLength).toBe(64);
    expect(frame.payloadLength).toBe(46);
    expect(frame.fcsHex).toBe('DF 73 52 01');
    expect(frame.fcsValid).toBe(true);
    expect(frame.warnings).toEqual([]);
  });

  it('parses a frame without FCS', () => {
    const body = hexToBytes(DEFAULT_FRAME_HEX).slice(0, -4);
    const frame = parseEthernetFrame(bytesToHex(body));
    expect(frame.fcsHex).toBeNull();
    expect(frame.fcsValid).toBe(false);
    expect(frame.payloadLength).toBe(46);
    expect(frame.warnings.some((item) => item.includes('不匹配'))).toBe(true);
  });

  it('flags a corrupted frame', () => {
    const bytes = hexToBytes(DEFAULT_FRAME_HEX);
    bytes[20]! ^= 0xff;
    const frame = parseEthernetFrame(bytesToHex(bytes));
    expect(frame.fcsValid).toBe(false);
  });

  it('warns on frames shorter than 64 bytes', () => {
    const bytes = hexToBytes(DEFAULT_FRAME_HEX).slice(0, 40);
    const frame = parseEthernetFrame(bytesToHex(bytes));
    expect(frame.warnings.some((item) => item.includes('64 字节'))).toBe(true);
  });

  it('rejects frames shorter than the 14-byte header', () => {
    expect(() => parseEthernetFrame('02 00 00 00 00 01')).toThrow('14 字节');
  });
});

describe('buildEthernetFrame', () => {
  it('round-trips a constructed frame with a valid FCS', () => {
    const built = buildEthernetFrame({
      destination: '02:00:00:00:00:01',
      source: '02:00:00:00:00:02',
      etherType: 0x0800,
      payloadHex: SAMPLE_PAYLOAD_HEX,
    });
    expect(built.bytes).toHaveLength(64);

    const parsed = parseEthernetFrame(built.hex);
    expect(parsed.fcsValid).toBe(true);
    expect(parsed.payloadLength).toBe(46);
    expect(built.fcs).toBe(crc32(built.bytes.slice(0, -4)));
  });

  it('rejects oversized payloads', () => {
    expect(() =>
      buildEthernetFrame({
        destination: '02:00:00:00:00:01',
        source: '02:00:00:00:00:02',
        etherType: 0x0800,
        payloadHex: '00 '.repeat(1501),
      }),
    ).toThrow('1500');
  });

  it('rejects an invalid EtherType and empty payload', () => {
    expect(() =>
      buildEthernetFrame({
        destination: '02:00:00:00:00:01',
        source: '02:00:00:00:00:02',
        etherType: 70000,
        payloadHex: '00',
      }),
    ).toThrow('EtherType');
    expect(() =>
      buildEthernetFrame({
        destination: '02:00:00:00:00:01',
        source: '02:00:00:00:00:02',
        etherType: 0x0800,
        payloadHex: '',
      }),
    ).toThrow('请输入十六进制数据');
  });
});
