/**
 * 视频/音频码率与文件大小估算器的常量定义
 * 码率内部统一使用 kbps（千比特/秒），1 Mbps = 1000 kbps
 */

export type CodecKey = 'h264' | 'h265' | 'av1' | 'vp9' | 'prores';
export type QualityLevel = 'low' | 'medium' | 'high';

/** 各编码器在低/中/高画质档下的 bits per pixel（bpp）预设 */
export const BPP_PRESETS: Record<CodecKey, Record<QualityLevel, number>> = {
  h264: { low: 0.05, medium: 0.1, high: 0.2 },
  h265: { low: 0.03, medium: 0.06, high: 0.12 },
  av1: { low: 0.02, medium: 0.05, high: 0.1 },
  vp9: { low: 0.03, medium: 0.06, high: 0.12 },
  // ProRes 为帧内编码，固定高码率，给 0.8/1.0/1.2 三档粗略参考
  prores: { low: 0.8, medium: 1.0, high: 1.2 },
};

export const CODEC_OPTIONS: ReadonlyArray<{ value: CodecKey; label: string }> = [
  { value: 'h264', label: 'H.264 (AVC)' },
  { value: 'h265', label: 'H.265 (HEVC)' },
  { value: 'av1', label: 'AV1' },
  { value: 'vp9', label: 'VP9' },
  { value: 'prores', label: 'ProRes（高码率参考）' },
];

export const QUALITY_OPTIONS: ReadonlyArray<{ value: QualityLevel; label: string }> = [
  { value: 'low', label: '低画质' },
  { value: 'medium', label: '中画质' },
  { value: 'high', label: '高画质' },
];

export type ResolutionKey = '720p' | '1080p' | '2k' | '4k' | 'custom';

export const RESOLUTION_PRESETS: Record<
  Exclude<ResolutionKey, 'custom'>,
  { label: string; width: number; height: number }
> = {
  '720p': { label: '720p（1280×720）', width: 1280, height: 720 },
  '1080p': { label: '1080p（1920×1080）', width: 1920, height: 1080 },
  '2k': { label: '2K（2560×1440）', width: 2560, height: 1440 },
  '4k': { label: '4K（3840×2160）', width: 3840, height: 2160 },
};

export const RESOLUTION_OPTIONS: ReadonlyArray<{ value: ResolutionKey; label: string }> = [
  ...Object.entries(RESOLUTION_PRESETS).map(([value, item]) => ({
    value: value as ResolutionKey,
    label: item.label,
  })),
  { value: 'custom', label: '自定义分辨率' },
];

export const FPS_PRESETS = [24, 25, 30, 50, 60] as const;

export const AUDIO_BITRATE_PRESETS = [0, 64, 96, 128, 192, 256, 320] as const;

export type CalcMode = 'forward' | 'reverse' | 'segments';

export const MODE_OPTIONS: ReadonlyArray<{ value: CalcMode; label: string }> = [
  { value: 'forward', label: '正向估算' },
  { value: 'reverse', label: '反向求解' },
  { value: 'segments', label: '多片段汇总' },
];

/** 容器开销范围（%） */
export const OVERHEAD_MIN = 0;
export const OVERHEAD_MAX = 10;

export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const DEFAULT_FPS = 30;
export const DEFAULT_CODEC: CodecKey = 'h264';
export const DEFAULT_QUALITY: QualityLevel = 'medium';
export const DEFAULT_VIDEO_BITRATE_KBPS = 8000;
export const DEFAULT_AUDIO_BITRATE_KBPS = 128;
export const DEFAULT_DURATION_HOURS = 0;
export const DEFAULT_DURATION_MINUTES = 10;
export const DEFAULT_DURATION_SECONDS = 0;
export const DEFAULT_OVERHEAD = 0;
export const DEFAULT_TARGET_SIZE_MB = 1000;
