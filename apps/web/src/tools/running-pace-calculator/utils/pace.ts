/**
 * 跑步配速 / 完赛时间 / 距离 / 速度互算纯函数，不依赖 DOM 与 React。
 * 约定：配速 paceSecPerKm 为每公里秒数；duration 为总秒数；
 * distance 为公里数；speed 为 km/h。
 */

/** 互算结果 */
export interface PaceResult {
  /** 配速（秒 / 公里） */
  paceSecPerKm: number;
  /** 完赛总时长（秒） */
  duration: number;
  /** 距离（公里） */
  distance: number;
  /** 速度（km/h） */
  speed: number;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 空结果工厂 */
function emptyResult(error: string): PaceResult {
  return { paceSecPerKm: 0, duration: 0, distance: 0, speed: 0, error };
}

/**
 * 将时间文本解析为秒数。
 * 支持：
 * - 秒数（如 "90"）
 * - 分:秒（如 "5:00"，秒必须为 0–59）
 * - 时:分:秒（如 "1:30:58"，分必须为 0–59）
 *
 * @param text - 时间文本
 * @returns 秒数；无法解析返回 null
 */
export function parseTimeToSeconds(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const parts = trimmed.split(':');
  if (parts.length > 3 || parts.some((part) => part.trim() === '')) {
    return null;
  }
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    return null;
  }
  if (parts.length === 1) {
    return numbers[0] ?? 0;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = numbers;
    if ((seconds ?? 0) >= 60) {
      return null;
    }
    return (minutes ?? 0) * 60 + (seconds ?? 0);
  }
  const [hours, minutes, seconds] = numbers;
  if ((minutes ?? 0) >= 60 || (seconds ?? 0) >= 60) {
    return null;
  }
  return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
}

/**
 * 将秒数格式化为 mm:ss（不足 1 小时）或 h:mm:ss
 *
 * @param totalSeconds - 秒数（非负，可为小数）
 * @returns 时间文本
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '--:--';
  }
  const totalWholeSeconds = Math.round(totalSeconds);
  const hours = Math.floor(totalWholeSeconds / 3600);
  const minutes = Math.floor((totalWholeSeconds % 3600) / 60);
  const seconds = totalWholeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * 将配速（秒 / 公里）格式化为 mm:ss /km
 *
 * @param paceSecPerKm - 每公里秒数
 * @returns 配速文本
 */
export function formatPace(paceSecPerKm: number): string {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return '--:--';
  }
  const totalWholeSeconds = Math.round(paceSecPerKm);
  const minutes = Math.floor(totalWholeSeconds / 60);
  const seconds = totalWholeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 配速（秒 / 公里）换算速度（km/h）
 *
 * @param paceSecPerKm - 每公里秒数
 * @returns km/h；非法返回 null
 */
export function paceToSpeed(paceSecPerKm: number): number | null {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return null;
  }
  return 3600 / paceSecPerKm;
}

/**
 * 速度（km/h）换算配速（秒 / 公里）
 *
 * @param speed - km/h
 * @returns 每公里秒数；非法返回 null
 */
export function speedToPace(speed: number): number | null {
  if (!Number.isFinite(speed) || speed <= 0) {
    return null;
  }
  return 3600 / speed;
}

/**
 * 校验距离合法性
 *
 * @param distance - 公里数
 * @returns 错误信息，合法为 null
 */
export function validateDistance(distance: number): string | null {
  if (!Number.isFinite(distance)) {
    return '距离必须是有效数字';
  }
  if (distance <= 0) {
    return '距离必须大于 0';
  }
  return null;
}

/**
 * 已知配速与距离，求完赛时间与速度
 *
 * @param paceSecPerKm - 每公里秒数
 * @param distance - 公里数
 * @returns 互算结果
 */
export function solveByPaceDistance(paceSecPerKm: number, distance: number): PaceResult {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return emptyResult('配速必须大于 0');
  }
  const distanceError = validateDistance(distance);
  if (distanceError) {
    return emptyResult(distanceError);
  }
  const duration = paceSecPerKm * distance;
  return {
    paceSecPerKm,
    duration,
    distance,
    speed: 3600 / paceSecPerKm,
    error: null,
  };
}

/**
 * 已知完赛时间与距离，求配速与速度
 *
 * @param duration - 总秒数
 * @param distance - 公里数
 * @returns 互算结果
 */
export function solveByDurationDistance(duration: number, distance: number): PaceResult {
  if (!Number.isFinite(duration) || duration <= 0) {
    return emptyResult('完赛时间必须大于 0');
  }
  const distanceError = validateDistance(distance);
  if (distanceError) {
    return emptyResult(distanceError);
  }
  const paceSecPerKm = duration / distance;
  return {
    paceSecPerKm,
    duration,
    distance,
    speed: 3600 / paceSecPerKm,
    error: null,
  };
}

/**
 * 已知配速与完赛时间，求距离与速度
 *
 * @param paceSecPerKm - 每公里秒数
 * @param duration - 总秒数
 * @returns 互算结果
 */
export function solveByPaceDuration(paceSecPerKm: number, duration: number): PaceResult {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return emptyResult('配速必须大于 0');
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return emptyResult('完赛时间必须大于 0');
  }
  const distance = duration / paceSecPerKm;
  return {
    paceSecPerKm,
    duration,
    distance,
    speed: 3600 / paceSecPerKm,
    error: null,
  };
}
