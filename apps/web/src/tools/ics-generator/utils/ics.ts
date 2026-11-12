/**
 * iCalendar（RFC 5545）单事件 VEVENT 生成的纯函数实现。
 *
 * 覆盖常用子集：
 * - 文本值按 RFC 5545 Section 3.3.11 转义反斜杠、逗号、分号与换行
 * - 时间支持 UTC（Z 后缀）与 TZID 本地时间两种形式
 * - 全天事件使用 VALUE=DATE（DTSTART；DTEND 按 RFC 5545 取排他性次日）
 * - 提醒 VALARM 支持分钟 / 小时 / 天的提前量
 * - 逻辑行按 75 个八位组折叠，续行以单个空格开头，整体使用 CRLF 行尾
 */

/** 提醒提前量单位 */
export type ReminderUnit = 'minutes' | 'hours' | 'days';

/** 事件提醒 */
export interface EventReminder {
  /** 提前量数值（正整数） */
  amount: number;
  /** 提前量单位 */
  unit: ReminderUnit;
}

/** 单事件表单数据 */
export interface IcsEventData {
  /** 事件标题 SUMMARY（必填） */
  title: string;
  /** 是否全天事件 */
  allDay: boolean;
  /** 开始：定时事件为 datetime-local 值 YYYY-MM-DDTHH:mm；全天为 YYYY-MM-DD */
  start: string;
  /** 结束：格式同 start；全天事件表示最后一天 */
  end: string;
  /** 时区 IANA 名称（如 Asia/Shanghai）；空串表示按 UTC 输出 */
  timezone: string;
  /** 地点 LOCATION */
  location: string;
  /** 描述 DESCRIPTION */
  description: string;
  /** 组织者邮箱 CN（可选） */
  organizerEmail: string;
  /** 提醒；null 表示不输出 VALARM */
  reminder: EventReminder | null;
}

/** 生成结果 */
export type IcsResult =
  | { ok: true; ics: string }
  | { ok: false; error: string };

/** RFC 5545 逻辑行最大八位组长度 */
export const MAX_LINE_LENGTH = 75;

/**
 * 转义 TEXT 类型值：反斜杠 → \\，逗号 → \,，分号 → \;，
 * 换行（\r\n / \r / \n）→ \n。
 *
 * @param value - 原始文本
 * @returns 转义后的安全文本
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * 按 RFC 5545 Section 3.1 折叠逻辑行：首行最多 75 个八位组，
 * 超出部分每 74 个八位组折为以单个空格起始的续行。
 * 为避免把多字节 UTF-8 字符截断，按字符累计其 UTF-8 字节长度切分。
 *
 * @param line - 不含行尾的逻辑行
 * @param maxLength - 首行八位组上限，默认 75
 * @returns 折叠后的物理行（以 CRLF 连接，不含末尾行尾）
 */
export function foldLine(line: string, maxLength = MAX_LINE_LENGTH): string {
  const chars = Array.from(line);
  const lines: string[] = [];
  let current = '';
  let currentLength = 0;
  let continuation = false;

  for (const char of chars) {
    const byteLength = new TextEncoder().encode(char).length;
    const limit = continuation ? maxLength - 1 : maxLength;
    if (currentLength + byteLength > limit) {
      lines.push(continuation ? ` ${current}` : current);
      current = char;
      currentLength = byteLength;
      continuation = true;
    } else {
      current += char;
      currentLength += byteLength;
    }
  }
  if (current.length > 0 || lines.length === 0) {
    lines.push(continuation ? ` ${current}` : current);
  }
  return lines.join('\r\n');
}

/** 校验 datetime-local 输入 YYYY-MM-DDTHH:mm */
function isValidDateTimeLocal(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= 31 && hour <= 23 && minute <= 59
  );
}

/** 校验日期输入 YYYY-MM-DD */
function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** datetime-local 值转 iCalendar UTC 形式 YYYYMMDDTHHMMSSZ */
function toUtcStamp(dateTimeLocal: string): string {
  const iso = `${dateTimeLocal}:00Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error('时间无法解析为合法日期');
  }
  return toStampParts(date);
}

/** 把 Date 的 UTC 字段格式化为 YYYYMMDDTHHMMSSZ */
function toStampParts(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** datetime-local 值转浮动本地形式 YYYYMMDDTHHMMSS（配合 TZID 使用） */
function toFloatingStamp(dateTimeLocal: string): string {
  return `${dateTimeLocal.replace(/[-:]/g, '')}00`;
}

/** 日期值转 ICS DATE 形式 YYYYMMDD */
function toDateStamp(dateValue: string): string {
  return dateValue.replace(/-/g, '');
}

/** 全天事件的排他性结束日期：最后一天 +1 天 */
function nextDateStamp(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** 提醒单位换算为分钟 */
function reminderToMinutes(reminder: EventReminder): number {
  switch (reminder.unit) {
    case 'minutes':
      return reminder.amount;
    case 'hours':
      return reminder.amount * 60;
    case 'days':
      return reminder.amount * 60 * 24;
  }
}

/** 生成稳定 UID（时间戳 + 随机段，纯本地生成） */
function generateUid(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}@ics-generator.local`;
}

/**
 * 组装单事件 iCalendar 文本。
 *
 * @param data - 事件表单数据
 * @returns 成功时返回 CRLF 行尾、按 75 八位组折叠的 .ics 文本；校验失败返回错误
 */
export function buildIcsEvent(data: IcsEventData): IcsResult {
  const title = data.title.trim();
  if (title.length === 0) {
    return { ok: false, error: '事件标题为必填项，请先填写标题' };
  }
  if (data.allDay) {
    if (!isValidDate(data.start) || !isValidDate(data.end)) {
      return { ok: false, error: '全天事件的开始 / 结束日期必须为 YYYY-MM-DD 格式' };
    }
    if (data.end < data.start) {
      return { ok: false, error: '结束日期不能早于开始日期' };
    }
  } else {
    if (!isValidDateTimeLocal(data.start) || !isValidDateTimeLocal(data.end)) {
      return { ok: false, error: '开始 / 结束时间必须为完整的日期时间（YYYY-MM-DD HH:mm）' };
    }
    if (data.end <= data.start) {
      return { ok: false, error: '结束时间必须晚于开始时间' };
    }
  }
  if (data.reminder !== null && (!Number.isInteger(data.reminder.amount) || data.reminder.amount <= 0)) {
    return { ok: false, error: '提醒提前量必须为正整数' };
  }

  const logicalLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trae Tools//ICS Generator//ZH-CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUid()}`,
    `DTSTAMP:${toStampParts(new Date())}`,
  ];

  if (data.allDay) {
    logicalLines.push(`DTSTART;VALUE=DATE:${toDateStamp(data.start)}`);
    logicalLines.push(`DTEND;VALUE=DATE:${nextDateStamp(data.end)}`);
  } else if (data.timezone.trim().length > 0) {
    const tzid = data.timezone.trim();
    logicalLines.push(`DTSTART;TZID=${tzid}:${toFloatingStamp(data.start)}`);
    logicalLines.push(`DTEND;TZID=${tzid}:${toFloatingStamp(data.end)}`);
  } else {
    logicalLines.push(`DTSTART:${toUtcStamp(data.start)}`);
    logicalLines.push(`DTEND:${toUtcStamp(data.end)}`);
  }

  logicalLines.push(`SUMMARY:${escapeIcsText(title)}`);

  if (data.location.trim().length > 0) {
    logicalLines.push(`LOCATION:${escapeIcsText(data.location.trim())}`);
  }
  if (data.description.trim().length > 0) {
    logicalLines.push(`DESCRIPTION:${escapeIcsText(data.description.trim())}`);
  }
  if (data.organizerEmail.trim().length > 0) {
    const email = data.organizerEmail.trim();
    logicalLines.push(`ORGANIZER;CN=${escapeIcsText(email)}:mailto:${email}`);
  }

  if (data.reminder !== null) {
    logicalLines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(title)}`,
      `TRIGGER:-PT${reminderToMinutes(data.reminder)}M`,
      'END:VALARM',
    );
  }

  logicalLines.push('END:VEVENT', 'END:VCALENDAR');

  const ics = logicalLines.map((line) => foldLine(line)).join('\r\n').concat('\r\n');
  return { ok: true, ics };
}
