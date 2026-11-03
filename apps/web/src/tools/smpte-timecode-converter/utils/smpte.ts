/**
 * SMPTE 时间码（ST 12-1 / ST 12-2）与总帧数、真实时长的双向换算
 *
 * 支持整数帧率（24/25/30 fps，非丢帧）与丢帧（29.97 NTSC DF）两种模式。
 * 丢帧时间码显示为 HH:MM:SS;FF（分号），每分钟（除每 10 分钟外）跳过帧号 0 和 1。
 */

export interface FpsProfile {
  /** 显示帧率，如 29.97 */
  label: string;
  /** 每秒标称帧数（换算用的整数帧率） */
  nominalFps: number;
  /** 是否丢帧 */
  dropFrame: boolean;
  /** 每标称帧对应的真实秒数相对 1/nominalFps 的倍数（29.97 系为 1.001），整数帧率为 1 */
  realtimeFactor: number;
}

export const FPS_PROFILES: Record<string, FpsProfile> = {
  '24': { label: '24 fps（电影）', nominalFps: 24, dropFrame: false, realtimeFactor: 1 },
  '25': { label: '25 fps（PAL）', nominalFps: 25, dropFrame: false, realtimeFactor: 1 },
  '30': { label: '30 fps（非丢帧）', nominalFps: 30, dropFrame: false, realtimeFactor: 1 },
  '29.97df': { label: '29.97 fps（NTSC 丢帧 DF）', nominalFps: 30, dropFrame: true, realtimeFactor: 1.001 },
  '29.97ndf': { label: '29.97 fps（NTSC 非丢帧 NDF）', nominalFps: 30, dropFrame: false, realtimeFactor: 1.001 },
};

export const SMPTE_PROFILE_KEYS = Object.keys(FPS_PROFILES);

export interface TimecodeParts {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

/**
 * 校验时间码各字段合法性（丢帧模式下额外检查被跳过的帧号）
 */
export function validateTimecode(parts: TimecodeParts, profile: FpsProfile): string | null {
  const { hours, minutes, seconds, frames } = parts;
  if (hours < 0 || hours > 99 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return '小时应为 00–99，分钟与秒应为 00–59';
  }
  if (frames < 0 || frames >= profile.nominalFps) {
    return `帧号应为 00–${String(profile.nominalFps - 1).padStart(2, '0')}`;
  }
  if (profile.dropFrame && frames < 2 && seconds === 0 && minutes % 10 !== 0) {
    return '丢帧模式下，非整 10 分钟的第 0、1 帧被跳过（不存在该时间码）';
  }
  return null;
}

/**
 * 解析 HH:MM:SS:FF 或 HH:MM:SS;FF（分号表示丢帧）
 */
export function parseTimecode(text: string): { parts: TimecodeParts; separator: ':' | ';' } | null {
  const match = text.trim().match(/^(\d{1,2})\s*[:;：，,]\s*(\d{1,2})\s*[:;：，,]\s*(\d{1,2})\s*[:;：，,]\s*(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const [, h, m, s, f] = match;
  return {
    parts: { hours: Number(h), minutes: Number(m), seconds: Number(s), frames: Number(f) },
    separator: text.includes(';') ? ';' : ':',
  };
}

/**
 * 时间码 → 总帧数（从 00:00:00;00 起计数）
 */
export function timecodeToTotalFrames(parts: TimecodeParts, profile: FpsProfile): number {
  const { hours, minutes, seconds, frames } = parts;
  const totalMinutes = 60 * hours + minutes;
  let result =
    (totalMinutes * 60 + seconds) * profile.nominalFps + frames;
  if (profile.dropFrame) {
    // 每分钟丢 2 帧，每 10 分钟不丢
    const dropped = 2 * (totalMinutes - Math.floor(totalMinutes / 10));
    result -= dropped;
  }
  return result;
}

/**
 * 总帧数 → 时间码
 */
export function totalFramesToTimecode(totalFramesInput: number, profile: FpsProfile): TimecodeParts {
  let frameCount = Math.max(0, Math.floor(totalFramesInput));

  if (profile.dropFrame) {
    // 由真实总帧数求丢帧显示帧计数（raw frame 从 0 起算的 NTSC DF 逆推）
    const dropFrames = profile.nominalFps / 15; // 每分钟丢 2 帧
    const framesPerMinute = profile.nominalFps * 60 - dropFrames; // 1798
    const framesPer10Minutes = framesPerMinute * 10 + dropFrames; // 17982
    const d = Math.floor(frameCount / framesPer10Minutes);
    const remainder = frameCount % framesPer10Minutes;
    frameCount +=
      dropFrames * 9 * d +
      dropFrames * Math.max(0, Math.floor((remainder - dropFrames) / framesPerMinute));
  }

  const fps = profile.nominalFps;
  const frames = frameCount % fps;
  const totalSeconds = Math.floor(frameCount / fps);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60) % 100;
  return { hours, minutes, seconds, frames };
}

export function formatTimecode(parts: TimecodeParts, dropFrame: boolean): string {
  const sep = dropFrame ? ';' : ':';
  return [parts.hours, parts.minutes, parts.seconds, parts.frames]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
    .replace(/:(?=\d{2}$)/, sep);
}

/**
 * 总帧数 → 真实时长（毫秒）
 *
 * 非丢帧：frames / fps；29.97 系：每帧真实时长为 1.001/30 秒（DF 与 NDF 相同）。
 */
export function totalFramesToRealMs(totalFrames: number, profile: FpsProfile): number {
  const realSecondsPerFrame = profile.realtimeFactor / profile.nominalFps;
  return totalFrames * realSecondsPerFrame * 1000;
}

/**
 * 真实时长（毫秒）→ 总帧数（向下取整）
 */
export function realMsToTotalFrames(realMs: number, profile: FpsProfile): number {
  const realSecondsPerFrame = profile.realtimeFactor / profile.nominalFps;
  return Math.floor(realMs / 1000 / realSecondsPerFrame);
}

/** 将毫秒格式化为 H:MM:SS.mmm */
export function formatRealDuration(realMs: number): string {
  const sign = realMs < 0 ? '-' : '';
  let value = Math.abs(Math.round(realMs));
  const ms = value % 1000;
  value = Math.floor(value / 1000);
  const s = value % 60;
  value = Math.floor(value / 60);
  const m = value % 60;
  const h = Math.floor(value / 60);
  return `${sign}${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
