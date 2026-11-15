/** 睡眠周期推算的纯函数 */

/** 单个完整睡眠周期时长（分钟） */
export const SLEEP_CYCLE_MINUTES = 90;

/** 默认起床时间 */
export const DEFAULT_WAKE_TIME = '07:00';

/** 默认入睡缓冲（分钟） */
export const DEFAULT_BUFFER_MINUTES = 15;

/** 默认展示的周期数 */
export const CYCLE_OPTIONS = [4, 5, 6] as const;

/** 推算方向：按起床时间倒推就寝，或按就寝时间正推起床 */
export type SleepDirection = 'wake' | 'bed';

/** 单个周期数对应的作息方案 */
export interface SleepPlan {
  /** 完整睡眠周期数 */
  cycles: number;
  /** 总睡眠时长（分钟） */
  totalSleepMinutes: number;
  /** 未归一化的目标时刻（分钟，可为负数或超过 1440） */
  timeMinutes: number;
  /** 格式化后的时刻文本 */
  clock: string;
  /** 相对输入日期的天偏移：-1 前一日，0 当日，1 次日 */
  dayOffset: number;
}

const CLOCK_PATTERN = /^([0-9]{1,2}):([0-9]{2})$/;

/**
 * 将 HH:MM 解析为自 00:00 起的分钟数
 */
export function parseClock(input: string): number {
  const matched = CLOCK_PATTERN.exec(input.trim());
  if (!matched) {
    throw new Error('时间格式应为 HH:MM，例如 07:00');
  }
  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  if (hours > 23) {
    throw new Error('小时需在 00–23 之间');
  }
  if (minutes > 59) {
    throw new Error('分钟需在 00–59 之间');
  }
  return hours * 60 + minutes;
}

/**
 * 将分钟数格式化为 24 或 12 小时制时刻，自动按 1440 分钟回绕
 */
export function formatClock(totalMinutes: number, use12Hour: boolean): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');

  if (!use12Hour) {
    return `${String(hours).padStart(2, '0')}:${paddedMinutes}`;
  }
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${paddedMinutes} ${suffix}`;
}

/**
 * 将天偏移描述为前一日 / 当日 / 次日等多个日期前缀
 */
export function formatDayOffset(offset: number): string {
  if (offset === 0) {
    return '当日';
  }
  if (offset === 1) {
    return '次日';
  }
  if (offset === -1) {
    return '前一日';
  }
  return offset > 1 ? `后 ${offset} 日` : `前 ${Math.abs(offset)} 日`;
}

/**
 * 校验并计算各周期数对应的作息方案
 */
export function calculateSleepPlans(
  direction: SleepDirection,
  timeMinutes: number,
  bufferMinutes: number,
  cycles: readonly number[],
  use12Hour: boolean,
): SleepPlan[] {
  if (!Number.isInteger(timeMinutes) || timeMinutes < 0 || timeMinutes >= 1440) {
    throw new Error('时间需在 00:00–23:59 之间');
  }
  if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > 60) {
    throw new Error('入睡缓冲需为 0–60 分钟的整数');
  }
  if (cycles.length === 0) {
    throw new Error('请至少选择一个周期数');
  }

  return [...cycles]
    .sort((a, b) => a - b)
    .map((cycleCount) => {
      if (!Number.isInteger(cycleCount) || cycleCount < 1 || cycleCount > 12) {
        throw new Error('周期数需为 1–12 的整数');
      }
      const totalSleepMinutes = cycleCount * SLEEP_CYCLE_MINUTES;
      const resultMinutes =
        direction === 'wake'
          ? timeMinutes - totalSleepMinutes - bufferMinutes
          : timeMinutes + bufferMinutes + totalSleepMinutes;
      return {
        cycles: cycleCount,
        totalSleepMinutes,
        timeMinutes: resultMinutes,
        clock: formatClock(resultMinutes, use12Hour),
        dayOffset: Math.floor(resultMinutes / 1440),
      };
    });
}

/**
 * 将总睡眠分钟数格式化为「x 小时 y 分钟」
 */
export function formatSleepDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${minutes} 分钟`;
}
