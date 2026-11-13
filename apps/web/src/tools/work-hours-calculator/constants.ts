import type { WorkSegment } from './utils/workHours';

/** 新建空白打卡段 */
export function createEmptySegment(): WorkSegment {
  return { start: '', end: '', breakMinutes: 0 };
}

/** 初始示例段：一段常白班 + 一段跨午夜夜班 */
export const DEFAULT_SEGMENTS: WorkSegment[] = [
  { start: '09:00', end: '18:00', breakMinutes: 60 },
  { start: '22:00', end: '06:00', breakMinutes: 45 },
];

/** 默认小时费率（元/小时） */
export const DEFAULT_HOURLY_RATE = 50;

/** 时间输入占位提示 */
export const TIME_PLACEHOLDER = 'HH:mm';
