import { describe, expect, it } from 'vitest';
import {
  buildRtpPacket,
  bytesToHex,
  getPayloadTypeName,
  hexToBytes,
  parseRtpPacket,
  type RtpBuildConfig,
} from './rtp';
import { DEFAULT_RTP_HEX } from '../constants';

const baseConfig: RtpBuildConfig = {
  marker: true,
  padding: false,
  extension: false,
  payloadType: 96,
  sequenceNumber: 1,
  timestamp: 13,
  ssrc: 5,
  csrc: [],
  payloadHex: 'AA BB',
};

/** 规范化 hex（去空白），便于比较两种分组输出 */
const squash = (hex: string): string => hex.replace(/\s+/g, '').toUpperCase();

describe('hexToBytes / bytesToHex', () => {
  it('容忍空白、0x 前缀与分隔符', () => {
    expect(hexToBytes('0x80 60,00:01-02')).toEqual([0x80, 0x60, 0x00, 0x01, 0x02]);
    expect(bytesToHex([0x0a, 0xbb, 0x01], 16)).toBe('0ABB01');
  });

  it('拒绝非法字符与奇数 nibble', () => {
    expect(() => hexToBytes('GG')).toThrow('非法十六进制');
    expect(() => hexToBytes('ABC')).toThrow('偶数');
    expect(() => hexToBytes('')).toThrow('请输入');
  });
});

describe('验收向量 1：固定头标准报文解析', () => {
  it('解析默认向量的全部固定头字段', () => {
    const packet = parseRtpPacket(DEFAULT_RTP_HEX);
    expect(packet.version).toBe(2);
    expect(packet.padding).toBe(0);
    expect(packet.extension).toBe(0);
    expect(packet.cc).toBe(0);
    expect(packet.marker).toBe(1);
    expect(packet.payloadType).toBe(96);
    expect(packet.sequenceNumber).toBe(1);
    expect(packet.timestamp).toBe(13);
    expect(packet.ssrc).toBe(5);
    expect(packet.payloadOffset).toBe(12);
    expect(packet.payloadTypeName).toContain('动态');
    expect(squash(packet.payloadHex)).toBe('AABB');
    expect(packet.paddingLength).toBe(0);
    expect(packet.layerOffsets[0]).toEqual({ layer: 'fixed', start: 0, end: 12, length: 12 });
  });

  it('RFC 位布局：byte1=0x60 时 M=0、PT=96；0xE0 时 M=1、PT=96', () => {
    const m0 = parseRtpPacket('80 60 00 01 00 00 00 0D 00 00 00 05 AA BB');
    expect(m0.marker).toBe(0);
    expect(m0.payloadType).toBe(96);
    const m1 = parseRtpPacket('80 E0 00 01 00 00 00 0D 00 00 00 05 AA BB');
    expect(m1.marker).toBe(1);
    expect(m1.payloadType).toBe(96);
  });

  it('静态载荷名称映射正确', () => {
    expect(getPayloadTypeName(0)).toBe('PCMU');
    expect(getPayloadTypeName(8)).toBe('PCMA');
    expect(getPayloadTypeName(26)).toBe('JPEG');
    expect(getPayloadTypeName(100)).toContain('动态');
    expect(getPayloadTypeName(2)).toContain('未分配');
  });
});

describe('验收向量 2：CSRC 构造与还原', () => {
  it('cc=2 时总长 20 字节且解析还原两项 CSRC', () => {
    const built = buildRtpPacket({
      ...baseConfig,
      marker: false,
      payloadHex: '',
      csrc: [0x11223344, 0x55667788],
    });
    expect(built.totalLength).toBe(20);

    const parsed = parseRtpPacket(built.hex);
    expect(parsed.cc).toBe(2);
    expect(parsed.csrc).toEqual([0x11223344, 0x55667788]);
    const csrcLayer = parsed.layerOffsets.find((item) => item.layer === 'csrc');
    expect(csrcLayer).toEqual({ layer: 'csrc', start: 12, end: 20, length: 8 });
  });
});

describe('验收向量 3：扩展头', () => {
  it('构造并解析 X=1、lengthWords=1 的扩展头', () => {
    const built = buildRtpPacket({
      ...baseConfig,
      extension: true,
      headerExtension: { profile: 0xbede, dataHex: 'DE AD BE EF' },
    });
    const parsed = parseRtpPacket(built.hex);
    expect(parsed.extension).toBe(1);
    expect(parsed.headerExtension).toBeDefined();
    expect(parsed.headerExtension!.profile).toBe(0xbede);
    expect(parsed.headerExtension!.lengthWords).toBe(1);
    expect(squash(parsed.headerExtension!.dataHex)).toBe('DEADBEEF');
    expect(parsed.headerExtension!.byteOffset).toBe(12);
    // 固定头 12 + 扩展头 8（4 字节头 + 4 字节数据）
    expect(parsed.payloadOffset).toBe(20);
    expect(squash(parsed.payloadHex)).toBe('AABB');
    const extLayer = parsed.layerOffsets.find((item) => item.layer === 'extension');
    expect(extLayer).toEqual({ layer: 'extension', start: 12, end: 20, length: 8 });
  });

  it('扩展数据非 4 的倍数时构造抛错', () => {
    expect(() =>
      buildRtpPacket({
        ...baseConfig,
        extension: true,
        headerExtension: { profile: 0x1234, dataHex: 'AA BB CC' },
      }),
    ).toThrow('4 的倍数');
  });
});

describe('验收向量 4：填充', () => {
  it('P=1、pad=3 时正确剥离填充', () => {
    const built = buildRtpPacket({
      ...baseConfig,
      padding: true,
      paddingLength: 3,
    });
    expect(built.bytes[built.bytes.length - 1]).toBe(3);
    const parsed = parseRtpPacket(built.hex);
    expect(parsed.padding).toBe(1);
    expect(parsed.paddingLength).toBe(3);
    expect(squash(parsed.payloadHex)).toBe('AABB');
    expect(parsed.payloadOffset).toBe(12);
    // payload 长度 = 总长 − 头部 12 − 填充 3
    const payloadLayer = parsed.layerOffsets.find((item) => item.layer === 'payload')!;
    const paddingLayer = parsed.layerOffsets.find((item) => item.layer === 'padding')!;
    expect(payloadLayer.length).toBe(built.totalLength - 12 - 3);
    expect(paddingLayer).toEqual({
      layer: 'padding',
      start: built.totalLength - 3,
      end: built.totalLength,
      length: 3,
    });
  });

  it('构造 pad 越界向量（>255）抛错', () => {
    expect(() =>
      buildRtpPacket({ ...baseConfig, padding: true, paddingLength: 300 }),
    ).toThrow('1–255');
  });

  it('解析侧填充长度越界与 pad=0 均抛错', () => {
    // 12 字节头 + P 置位，但末字节为 0
    const zeroPad = [0xa0, 0x60, 0, 1, 0, 0, 0, 13, 0, 0, 0, 5, 0];
    expect(() => parseRtpPacket(bytesToHex(zeroPad))).toThrow('填充长度为 0');

    // 末字节声明 20 字节填充，但报文只有 13 字节
    const overflowPad = [0xa0, 0x60, 0, 1, 0, 0, 0, 13, 0, 0, 0, 5, 20];
    expect(() => parseRtpPacket(bytesToHex(overflowPad))).toThrow('填充长度 20 字节越界');
  });
});

describe('验收向量 5：异常与截断', () => {
  it('10 字节截断抛带字节偏移的中文错误', () => {
    expect(() => parseRtpPacket('80 60 00 01 00 00 00 0D 00 00')).toThrow('12 字节');
  });

  it('V=0 默认抛错，allowBadVersion 时带 warning 返回', () => {
    const v0 = [0x00, 0x60, 0, 1, 0, 0, 0, 13, 0, 0, 0, 5];
    expect(() => parseRtpPacket(bytesToHex(v0))).toThrow('V=0');
    const allowed = parseRtpPacket(bytesToHex(v0), { allowBadVersion: true });
    expect(allowed.version).toBe(0);
    expect(allowed.warnings[0]).toContain('V=0');
  });

  it('CC=5 但后续仅 8 字节时抛错', () => {
    // 低 4 位 CC=5，固定头后只给 8 字节（需要 20）
    const truncated = [
      0x85, 0x60, 0, 1, 0, 0, 0, 13, 0, 0, 0, 5, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    ];
    expect(() => parseRtpPacket(bytesToHex(truncated))).toThrow('CC=5');
  });

  it('扩展 length 越界抛带字节偏移的错误', () => {
    // X=1，扩展头声称 lengthWords=10（40 字节），实际无扩展数据
    const badExt = [
      0x90, 0x60, 0, 1, 0, 0, 0, 13, 0, 0, 0, 5, 0xbe, 0xde, 0x00, 0x0a,
    ];
    expect(() => parseRtpPacket(bytesToHex(badExt))).toThrow('超出报文范围');
  });
});

describe('验收向量 6：LCG 伪随机闭环', () => {
  /** 固定种子的 LCG，保证测试可复现 */
  const createLcg = (seed: number) => {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0;
      return state >>> 0;
    };
  };

  it('20 组随机合法报文构造再解析字段完全一致', () => {
    const rand = createLcg(0x20261116);
    for (let round = 0; round < 20; round += 1) {
      const csrcCount = rand() % 4;
      const csrc = Array.from({ length: csrcCount }, () => rand());
      const useExtension = rand() % 2 === 0;
      const usePadding = rand() % 2 === 0;
      const extDataWords = useExtension ? 1 + (rand() % 3) : 0;
      const extData = Array.from({ length: extDataWords * 4 }, () => rand() & 0xff);
      const payload = Array.from({ length: rand() % 8 }, () => rand() & 0xff);
      const profile = rand() & 0xffff;
      const paddingLength = usePadding ? 1 + (rand() % 5) : 0;
      const config: RtpBuildConfig = {
        marker: rand() % 2 === 1,
        padding: usePadding,
        extension: useExtension,
        payloadType: rand() % 128,
        sequenceNumber: rand() & 0xffff,
        timestamp: rand(),
        ssrc: rand(),
        csrc,
        headerExtension: useExtension
          ? { profile, dataHex: bytesToHex(extData) }
          : undefined,
        paddingLength: usePadding ? paddingLength : undefined,
        payloadHex: bytesToHex(payload),
      };

      const built = buildRtpPacket(config);
      const parsed = parseRtpPacket(built.hex);
      expect(parsed.version).toBe(2);
      expect(parsed.marker).toBe(config.marker ? 1 : 0);
      expect(parsed.padding).toBe(usePadding ? 1 : 0);
      expect(parsed.extension).toBe(useExtension ? 1 : 0);
      expect(parsed.cc).toBe(csrcCount);
      expect(parsed.csrc).toEqual(csrc);
      expect(parsed.payloadType).toBe(config.payloadType);
      expect(parsed.sequenceNumber).toBe(config.sequenceNumber);
      expect(parsed.timestamp).toBe(config.timestamp >>> 0);
      expect(parsed.ssrc).toBe(config.ssrc >>> 0);
      expect(squash(parsed.payloadHex)).toBe(squash(bytesToHex(payload)));
      expect(parsed.paddingLength).toBe(usePadding ? paddingLength : 0);
      if (useExtension) {
        expect(parsed.headerExtension!.profile).toBe(profile);
        expect(parsed.headerExtension!.lengthWords).toBe(extDataWords);
        expect(squash(parsed.headerExtension!.dataHex)).toBe(squash(bytesToHex(extData)));
      } else {
        expect(parsed.headerExtension).toBeUndefined();
      }
    }
  });
});

describe('验收向量 7：PT 越界', () => {
  it('PT=128 构造抛错', () => {
    expect(() => buildRtpPacket({ ...baseConfig, payloadType: 128 })).toThrow('0–127');
  });

  it('V=0/1 构造允许通过但返回 warning', () => {
    const built = buildRtpPacket({ ...baseConfig, version: 1 });
    expect(built.warnings[0]).toContain('V=1');
    expect(parseRtpPacket(built.hex, { allowBadVersion: true }).version).toBe(1);
  });
});
