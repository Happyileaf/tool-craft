import { describe, expect, it } from 'vitest';
import {
  buildTcpSegment,
  computeTcpChecksum,
  parseIpv4,
  parseTcpSegment,
  type TcpBuildConfig,
} from './tcp';
import { DEFAULT_DESTINATION_IP, DEFAULT_SOURCE_IP, DEFAULT_TCP_HEX } from '../constants';

const baseBuild: TcpBuildConfig = {
  sourcePort: 49152,
  destinationPort: 80,
  sequenceNumber: 0x11223344,
  acknowledgmentNumber: 0x55667788,
  flags: { psh: true, ack: true },
  windowSize: 0x2000,
  urgentPointer: 0,
  payloadHex: '48 65 6C 6C 6F',
  sourceIp: '192.168.1.10',
  destinationIp: '192.168.1.20',
};

describe('parseIpv4', () => {
  it('parses dotted decimal addresses', () => {
    expect(parseIpv4('10.0.0.1')).toEqual([10, 0, 0, 1]);
  });

  it('rejects malformed addresses', () => {
    expect(() => parseIpv4('10.0.0')).toThrow('无效');
    expect(() => parseIpv4('10.0.0.256')).toThrow('0–255');
  });
});

describe('computeTcpChecksum', () => {
  it('matches the independently computed 0x16E1 vector', () => {
    const segment = [
      0xc0, 0x00, 0x00, 0x50, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
      0x50, 0x18, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f,
    ];
    expect(computeTcpChecksum([192, 168, 1, 10], [192, 168, 1, 20], segment)).toBe(0x16e1);
  });
});

describe('parseTcpSegment', () => {
  it('parses the SYN sample with options and validates its checksum', () => {
    const segment = parseTcpSegment(DEFAULT_TCP_HEX, DEFAULT_SOURCE_IP, DEFAULT_DESTINATION_IP);
    expect(segment.sourcePort).toBe(12345);
    expect(segment.destinationPort).toBe(80);
    expect(segment.sequenceNumber).toBe(1000);
    expect(segment.acknowledgmentNumber).toBe(0);
    expect(segment.dataOffset).toBe(7);
    expect(segment.headerLength).toBe(28);
    expect(segment.flags.syn).toBe(true);
    expect(segment.flags.ack).toBe(false);
    expect(segment.windowSize).toBe(64496);
    expect(segment.checksum).toBe(0x3ebb);
    expect(segment.checksumValid).toBe(true);
    expect(segment.expectedChecksum).toBe(0x3ebb);
    expect(segment.payloadLength).toBe(0);
    expect(segment.options).toHaveLength(4);
    expect(segment.options[0]!.description).toContain('1460');
    expect(segment.options[1]!.description).toContain('SACK');
  });

  it('detects a checksum mismatch for other addresses and skips without IPs', () => {
    const wrong = parseTcpSegment(DEFAULT_TCP_HEX, '10.0.0.9', DEFAULT_DESTINATION_IP);
    expect(wrong.checksumValid).toBe(false);
    expect(wrong.expectedChecksum).not.toBe(0x3ebb);

    const skipped = parseTcpSegment(DEFAULT_TCP_HEX);
    expect(skipped.checksumValid).toBeNull();
    expect(skipped.expectedChecksum).toBeNull();
  });

  it('decodes flags, urgent pointer and payload', () => {
    const segment = parseTcpSegment(
      'C0 00 00 50 11 22 33 44 55 66 77 88 50 18 20 00 16 DA 00 07 48 65 6C 6C 6F',
      '192.168.1.10',
      '192.168.1.20',
    );
    expect(segment.flags.psh).toBe(true);
    expect(segment.flags.ack).toBe(true);
    expect(segment.urgentPointer).toBe(7);
    expect(segment.payloadLength).toBe(5);
    expect(segment.checksumValid).toBe(true);
  });

  it('rejects short, invalid data offset and truncated option payloads', () => {
    expect(() => parseTcpSegment('30 39 00 50')).toThrow('20 字节');
    expect(() =>
      parseTcpSegment('30 39 00 50 00 00 00 01 00 00 00 00 40 02 20 00 00 00 00 00'),
    ).toThrow('数据偏移');
    expect(() =>
      parseTcpSegment('30 39 00 50 00 00 00 01 00 00 00 00 60 02 20 00 00 00 00 00 02 FF 00 00'),
    ).toThrow('超出选项区');
  });
});

describe('buildTcpSegment', () => {
  it('reproduces the fixed Hello vector exactly', () => {
    const built = buildTcpSegment(baseBuild);
    expect(built.checksum).toBe(0x16e1);
    expect(built.hex).toBe('C0000050112233445566778850182000 16E1000048656C6C6F');
  });

  it('round-trips a segment with MSS, SACK and padding', () => {
    const built = buildTcpSegment({
      ...baseBuild,
      flags: { syn: true },
      payloadHex: '',
      options: { mss: 1460, sackPermitted: true },
    });
    const parsed = parseTcpSegment(built.hex, '192.168.1.10', '192.168.1.20');
    expect(parsed.headerLength).toBe(28);
    expect(parsed.options.map((item) => item.kind)).toEqual([2, 4, 1, 1]);
    expect(parsed.checksumValid).toBe(true);
  });

  it('leaves the checksum zero when IPs are absent', () => {
    const built = buildTcpSegment({ ...baseBuild, sourceIp: undefined, destinationIp: undefined });
    expect(built.checksum).toBeNull();
    expect(built.bytes[16]).toBe(0);
    expect(built.bytes[17]).toBe(0);
  });

  it('rejects out-of-range ports and option values', () => {
    expect(() => buildTcpSegment({ ...baseBuild, sourcePort: 70000 })).toThrow('0–65535');
    expect(() => buildTcpSegment({ ...baseBuild, options: { windowScale: 256 } })).toThrow('0–255');
  });
});
