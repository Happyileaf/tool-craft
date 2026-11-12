/**
 * iCalendar .ics 生成器常量
 */
import type { IcsEventData, ReminderUnit } from './utils/ics';

/** 常用 IANA 时区选项（空值表示 UTC） */
export const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: 'UTC（协调世界时）', value: '' },
  { label: 'Asia/Shanghai（北京时间 UTC+8）', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo（东京 UTC+9）', value: 'Asia/Tokyo' },
  { label: 'Asia/Singapore（新加坡 UTC+8）', value: 'Asia/Singapore' },
  { label: 'Europe/London（伦敦）', value: 'Europe/London' },
  { label: 'Europe/Berlin（柏林）', value: 'Europe/Berlin' },
  { label: 'America/New_York（纽约）', value: 'America/New_York' },
  { label: 'America/Los_Angeles（洛杉矶）', value: 'America/Los_Angeles' },
  { label: 'Australia/Sydney（悉尼）', value: 'Australia/Sydney' },
];

/** 提醒单位选项 */
export const REMINDER_UNIT_OPTIONS: { label: string; value: ReminderUnit }[] = [
  { label: '分钟', value: 'minutes' },
  { label: '小时', value: 'hours' },
  { label: '天', value: 'days' },
];

/** 提醒快捷预设 */
export const REMINDER_PRESETS: { label: string; amount: number; unit: ReminderUnit }[] = [
  { label: '15 分钟前', amount: 15, unit: 'minutes' },
  { label: '1 小时前', amount: 1, unit: 'hours' },
  { label: '1 天前', amount: 1, unit: 'days' },
];

/** 空事件初始值 */
export function createEmptyEvent(): IcsEventData {
  return {
    title: '',
    allDay: false,
    start: '',
    end: '',
    timezone: '',
    location: '',
    description: '',
    organizerEmail: '',
    reminder: null,
  };
}

/** 一键填入的样例事件 */
export const SAMPLE_EVENT: IcsEventData = {
  title: 'v2.0 发版评审会',
  allDay: false,
  start: '2026-12-15T14:00',
  end: '2026-12-15T15:30',
  timezone: 'Asia/Shanghai',
  location: '总部 3 楼; 星河会议室（线上会议号 888-1234）',
  description: '评审 v2.0 发布范围、回滚预案与值班安排，请提前阅读发版清单。',
  organizerEmail: 'release@example.com',
  reminder: { amount: 30, unit: 'minutes' },
};
