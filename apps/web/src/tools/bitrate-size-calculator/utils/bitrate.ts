import { OVERHEAD_MAX, OVERHEAD_MIN } from '../constants';

/** 正向估算入参 */
export interface SizeEstimateInput {
  /** 视频码率（kbps） */
  videoBitrateKbps: number;
  /** 音频码率（kbps），无音频时传 0 */
  audioBitrateKbps: number;
  /** 时长（秒） */
  durationSeconds: number;
  /** 容器开销百分比，0–10 */
  overheadPercent: number;
  /** 上行带宽（kbps），给出时计算上传耗时 */
  uploadBandwidthKbps?: number;
}

/** 正向估算结果，原始数值不截断 */
export interface SizeEstimateResult {
  totalBitrateKbps: number;
  bytes: number;
  /** 十进制 MB = bytes / 1_000_000 */
  sizeMB: number;
  /** 二进制 MiB = bytes / 1048576 */
  sizeMiB: number;
  /** 每分钟体积（MB，已应用开销） */
  perMinuteMB: number;
  /** 上传耗时（秒），仅在提供上行带宽时存在 */
  uploadSeconds?: number;
}

/** 反向求解入参 */
export interface ReverseBitrateInput {
  targetSizeMB: number;
  durationSeconds: number;
  audioBitrateKbps: number;
  overheadPercent: number;
}

/** 反向求解结果 */
export interface ReverseBitrateResult {
  totalBitrateKbps: number;
  videoBitrateKbps: number;
  baseBytes: number;
}

/** 多片段中的单个片段 */
export interface SegmentInput {
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  durationSeconds: number;
  /** 容器开销百分比，缺省为 0 */
  overheadPercent?: number;
}

/** 多片段汇总结果 */
export interface MultiSegmentResult {
  totalBytes: number;
  totalMB: number;
  totalMiB: number;
  totalDurationSeconds: number;
  segmentCount: number;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}必须为大于 0 的有效数字`);
  }
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}必须为不小于 0 的有效数字`);
  }
}

function assertOverhead(value: number): void {
  if (!Number.isFinite(value) || value < OVERHEAD_MIN || value > OVERHEAD_MAX) {
    throw new Error(`容器开销必须在 ${OVERHEAD_MIN} 到 ${OVERHEAD_MAX} 之间`);
  }
}

/**
 * 按 bits per pixel 估算视频码率
 * kbps = width × height × fps × bpp / 1000
 */
export function estimateBitrateFromBpp(
  width: number,
  height: number,
  fps: number,
  bpp: number,
): number {
  assertPositive(width, '分辨率宽度');
  assertPositive(height, '分辨率高度');
  assertPositive(fps, '帧率');
  assertPositive(bpp, 'bpp 档位值');
  return (width * height * fps * bpp) / 1000;
}

/**
 * 正向估算：由总码率与时长计算文件体积
 * bytes = 总码率(kbps) × 1000 × 时长秒 / 8，再应用容器开销
 */
export function estimateSize(input: SizeEstimateInput): SizeEstimateResult {
  assertPositive(input.videoBitrateKbps, '视频码率');
  assertNonNegative(input.audioBitrateKbps, '音频码率');
  assertPositive(input.durationSeconds, '时长');
  assertOverhead(input.overheadPercent);
  if (input.uploadBandwidthKbps !== undefined) {
    assertPositive(input.uploadBandwidthKbps, '上行带宽');
  }

  const totalBitrateKbps = input.videoBitrateKbps + input.audioBitrateKbps;
  const baseBytes = (totalBitrateKbps * 1000 * input.durationSeconds) / 8;
  const bytes = baseBytes * (1 + input.overheadPercent / 100);
  const perMinuteBaseBytes = (totalBitrateKbps * 1000 * 60) / 8;
  const perMinuteBytes = perMinuteBaseBytes * (1 + input.overheadPercent / 100);

  const result: SizeEstimateResult = {
    totalBitrateKbps,
    bytes,
    sizeMB: bytes / 1_000_000,
    sizeMiB: bytes / 1048576,
    perMinuteMB: perMinuteBytes / 1_000_000,
  };
  if (input.uploadBandwidthKbps !== undefined) {
    result.uploadSeconds = (bytes * 8) / 1000 / input.uploadBandwidthKbps;
  }
  return result;
}

/**
 * 反向求解：由目标体积与时长反推可用总码率与推荐视频码率
 */
export function reverseBitrate(input: ReverseBitrateInput): ReverseBitrateResult {
  assertPositive(input.targetSizeMB, '目标体积');
  assertPositive(input.durationSeconds, '时长');
  assertNonNegative(input.audioBitrateKbps, '音频码率');
  assertOverhead(input.overheadPercent);

  const targetBytes = input.targetSizeMB * 1_000_000;
  const baseBytes = targetBytes / (1 + input.overheadPercent / 100);
  const totalBitrateKbps = (baseBytes * 8) / 1000 / input.durationSeconds;
  const videoBitrateKbps = totalBitrateKbps - input.audioBitrateKbps;
  if (videoBitrateKbps <= 0) {
    throw new Error('目标体积不足以覆盖音频码率');
  }

  return {
    totalBitrateKbps,
    videoBitrateKbps,
    baseBytes,
  };
}

/**
 * 多片段汇总：各段独立计算体积（独立应用各自开销）后求和
 */
export function multiSegmentSummary(segments: SegmentInput[]): MultiSegmentResult {
  if (segments.length === 0) {
    throw new Error('请至少添加一个片段');
  }

  let totalBytes = 0;
  let totalDurationSeconds = 0;
  segments.forEach((segment) => {
    assertPositive(segment.videoBitrateKbps, '视频码率');
    assertNonNegative(segment.audioBitrateKbps, '音频码率');
    assertPositive(segment.durationSeconds, '时长');
    assertOverhead(segment.overheadPercent ?? 0);

    const totalBitrateKbps = segment.videoBitrateKbps + segment.audioBitrateKbps;
    const baseBytes = (totalBitrateKbps * 1000 * segment.durationSeconds) / 8;
    totalBytes += baseBytes * (1 + (segment.overheadPercent ?? 0) / 100);
    totalDurationSeconds += segment.durationSeconds;
  });

  return {
    totalBytes,
    totalMB: totalBytes / 1_000_000,
    totalMiB: totalBytes / 1048576,
    totalDurationSeconds,
    segmentCount: segments.length,
  };
}
