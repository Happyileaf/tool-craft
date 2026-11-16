import { describe, expect, it } from 'vitest';
import {
  estimateBitrateFromBpp,
  estimateSize,
  multiSegmentSummary,
  reverseBitrate,
} from './bitrate';

describe('estimateBitrateFromBpp', () => {
  it('估算 1080p30 中画质 bpp=0.1 的码率（公式 1920*1080*30*0.1/1000=6220.8 kbps）', () => {
    expect(estimateBitrateFromBpp(1920, 1080, 30, 0.1)).toBeCloseTo(6220.8, 3);
  });

  it('非法参数抛错', () => {
    expect(() => estimateBitrateFromBpp(0, 1080, 30, 0.1)).toThrow('分辨率宽度');
    expect(() => estimateBitrateFromBpp(1920, -1080, 30, 0.1)).toThrow('分辨率高度');
    expect(() => estimateBitrateFromBpp(1920, 1080, 0, 0.1)).toThrow('帧率');
    expect(() => estimateBitrateFromBpp(1920, 1080, 30, 0)).toThrow('bpp');
    expect(() => estimateBitrateFromBpp(1920, 1080, 30, Number.NaN)).toThrow('bpp');
  });
});

describe('estimateSize', () => {
  it('向量1：1080p 8Mbps + 128kbps 音频、600 秒、0% 开销', () => {
    const result = estimateSize({
      videoBitrateKbps: 8000,
      audioBitrateKbps: 128,
      durationSeconds: 600,
      overheadPercent: 0,
    });
    expect(result.totalBitrateKbps).toBe(8128);
    expect(result.sizeMB).toBeCloseTo(609.6, 1);
    // 609_600_000 / 1_048_576 = 581.3599（精确值，保留 1 位小数即 581.4 MiB）
    expect(result.sizeMiB).toBeCloseTo(581.36, 2);
  });

  it('向量2：4K60 40Mbps、300 秒、无音频、0% 开销 → 1500 MB', () => {
    const result = estimateSize({
      videoBitrateKbps: 40000,
      audioBitrateKbps: 0,
      durationSeconds: 300,
      overheadPercent: 0,
    });
    expect(result.sizeMB).toBeCloseTo(1500, 1);
  });

  it('向量3：向量1 参数加 2% 开销 → 621.792 MB', () => {
    const result = estimateSize({
      videoBitrateKbps: 8000,
      audioBitrateKbps: 128,
      durationSeconds: 600,
      overheadPercent: 2,
    });
    expect(result.sizeMB).toBeCloseTo(621.792, 3);
    expect(result.sizeMB).toBeCloseTo(621.8, 1);
  });

  it('每分钟体积同样应用开销', () => {
    const result = estimateSize({
      videoBitrateKbps: 8000,
      audioBitrateKbps: 128,
      durationSeconds: 600,
      overheadPercent: 0,
    });
    expect(result.perMinuteMB).toBeCloseTo(60.96, 3);
  });

  it('提供上行带宽时计算上传耗时（秒）', () => {
    const result = estimateSize({
      videoBitrateKbps: 8000,
      audioBitrateKbps: 128,
      durationSeconds: 600,
      overheadPercent: 0,
      uploadBandwidthKbps: 1000,
    });
    // bytes = 609_600_000；uploadSeconds = bytes*8/1000/1000 = 4876.8
    expect(result.uploadSeconds).toBeCloseTo(4876.8, 3);
  });

  it('不提供上行带宽时 uploadSeconds 为 undefined', () => {
    const result = estimateSize({
      videoBitrateKbps: 8000,
      audioBitrateKbps: 128,
      durationSeconds: 600,
      overheadPercent: 0,
    });
    expect(result.uploadSeconds).toBeUndefined();
  });

  it('非法输入与开销越界抛错', () => {
    expect(() =>
      estimateSize({
        videoBitrateKbps: 0,
        audioBitrateKbps: 128,
        durationSeconds: 600,
        overheadPercent: 0,
      }),
    ).toThrow('视频码率');
    expect(() =>
      estimateSize({
        videoBitrateKbps: 8000,
        audioBitrateKbps: -1,
        durationSeconds: 600,
        overheadPercent: 0,
      }),
    ).toThrow('音频码率');
    expect(() =>
      estimateSize({
        videoBitrateKbps: 8000,
        audioBitrateKbps: 128,
        durationSeconds: 0,
        overheadPercent: 0,
      }),
    ).toThrow('时长');
    expect(() =>
      estimateSize({
        videoBitrateKbps: 8000,
        audioBitrateKbps: 128,
        durationSeconds: 600,
        overheadPercent: 11,
      }),
    ).toThrow('容器开销');
  });
});

describe('reverseBitrate', () => {
  it('向量4：1000MB、1800 秒、128kbps 音频、0% 开销', () => {
    const result = reverseBitrate({
      targetSizeMB: 1000,
      durationSeconds: 1800,
      audioBitrateKbps: 128,
      overheadPercent: 0,
    });
    expect(result.totalBitrateKbps).toBeCloseTo(4444.444, 2);
    expect(result.videoBitrateKbps).toBeCloseTo(4316.444, 2);
  });

  it('带开销时先扣除开销再反推码率', () => {
    const result = reverseBitrate({
      targetSizeMB: 1000,
      durationSeconds: 1800,
      audioBitrateKbps: 0,
      overheadPercent: 2,
    });
    // baseBytes = 1e9 / 1.02；totalBitrate = baseBytes*8/1000/1800
    const expected = ((1e9 / 1.02) * 8) / 1000 / 1800;
    expect(result.totalBitrateKbps).toBeCloseTo(expected, 3);
  });

  it('向量6：目标体积为 0 或时长为 0 抛错', () => {
    expect(() =>
      reverseBitrate({
        targetSizeMB: 0,
        durationSeconds: 1800,
        audioBitrateKbps: 128,
        overheadPercent: 0,
      }),
    ).toThrow('目标体积');
    expect(() =>
      reverseBitrate({
        targetSizeMB: 1000,
        durationSeconds: 0,
        audioBitrateKbps: 128,
        overheadPercent: 0,
      }),
    ).toThrow('时长');
  });

  it('向量6：目标过小无法覆盖音频码率时抛中文错', () => {
    expect(() =>
      reverseBitrate({
        targetSizeMB: 1,
        durationSeconds: 1800,
        audioBitrateKbps: 128,
        overheadPercent: 0,
      }),
    ).toThrow('目标体积不足以覆盖音频码率');
  });
});

describe('multiSegmentSummary', () => {
  it('向量5：无音频两段汇总为 2100 MB', () => {
    const result = multiSegmentSummary([
      {
        videoBitrateKbps: 8000,
        audioBitrateKbps: 0,
        durationSeconds: 600,
        overheadPercent: 0,
      },
      {
        videoBitrateKbps: 40000,
        audioBitrateKbps: 0,
        durationSeconds: 300,
        overheadPercent: 0,
      },
    ]);
    expect(result.totalMB).toBeCloseTo(2100, 1);
    expect(result.totalDurationSeconds).toBe(900);
    expect(result.segmentCount).toBe(2);
  });

  it('带 128kbps 音频的 10 分钟片段为 609.6 MB', () => {
    const result = multiSegmentSummary([
      {
        videoBitrateKbps: 8000,
        audioBitrateKbps: 128,
        durationSeconds: 600,
        overheadPercent: 0,
      },
    ]);
    expect(result.totalMB).toBeCloseTo(609.6, 1);
  });

  it('各段独立应用开销后求和', () => {
    const result = multiSegmentSummary([
      {
        videoBitrateKbps: 8000,
        audioBitrateKbps: 128,
        durationSeconds: 600,
        overheadPercent: 2,
      },
      {
        videoBitrateKbps: 40000,
        audioBitrateKbps: 0,
        durationSeconds: 300,
        overheadPercent: 0,
      },
    ]);
    expect(result.totalMB).toBeCloseTo(621.792 + 1500, 3);
  });

  it('缺省开销按 0 处理', () => {
    const result = multiSegmentSummary([
      { videoBitrateKbps: 8000, audioBitrateKbps: 0, durationSeconds: 600 },
    ]);
    expect(result.totalMB).toBeCloseTo(600, 1);
  });

  it('空片段列表与非法片段抛错', () => {
    expect(() => multiSegmentSummary([])).toThrow('至少添加一个片段');
    expect(() =>
      multiSegmentSummary([
        {
          videoBitrateKbps: 8000,
          audioBitrateKbps: 0,
          durationSeconds: -600,
          overheadPercent: 0,
        },
      ]),
    ).toThrow('时长');
  });
});
