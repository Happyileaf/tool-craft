/**
 * iCalendar VTODO / VJOURNAL 组件生成（RFC 5545，零依赖纯函数）
 *
 * 覆盖 RFC 5545 常用子集：
 * - TEXT 值按 Section 3.3.11 转义反斜杠、逗号、分号与换行
 * - 属性参数中的 paramtext 按 Section 3.1 加双引号包裹
 * - 时间统一输出 UTC（YYYYMMDDTHHMMSSZ，Section 3.3.5）
 * - 逻辑行按 Section 3.1 以 75 个八位组折叠，续行以单空格开头，整体 CRLF 行尾
 * - VTODO（Section 3.6.2）：SUMMARY/UID/DTSTAMP 必填，DUE/DTSTART/STATUS/
 *   PRIORITY/PERCENT-COMPLETE/RRULE/RELATED-TO/CATEGORIES 可选
 * - VJOURNAL（Section 3.6.3）：SUMMARY/UID/DTSTAMP 必填，DTSTART/DESCRIPTION/
 *   CATEGORIES/RELATED-TO 可选，STATUS 限定 DRAFT/FINAL/CANCELLED
 * 时钟与 UID 生成器可注入，保证测试输出确定。
 */

/** RFC 5545 逻辑行最大八位组长度 */
export const MAX_LINE_LENGTH = 75;

/** VTODO 状态（RFC 5545 Section 3.6.2） */
export type TodoStatus = 'NEEDS-ACTION' | 'IN-PROCESS' | 'COMPLETED' | 'CANCELLED';

/** VJOURNAL 状态（RFC 5545 Section 3.6.3） */
export type JournalStatus = 'DRAFT' | 'FINAL' | 'CANCELLED';

/** RRULE 重复规则的结构化输入（Section 3.3.10 / 3.8.5.3） */
export interface RRuleSpec {
  freq: 'SECONDLY' | 'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: string;
}

/** VTODO 表单数据 */
export interface VTodoData {
  title: string;
  /** datetime-local 值 YYYY-MM-DDTHH:mm；空串表示不输出 DTSTART */
  dtstart: string;
  /** 截止时间；空串表示不输出 DUE */
  due: string;
  status: TodoStatus;
  /** 优先级 1-9（1 最高）；null 表示不输出 PRIORITY */
  priority: number | null;
  /** 完成百分比 0-100；null 表示不输出 PERCENT-COMPLETE */
  percentComplete: number | null;
  /** 完成时间；仅 STATUS=COMPLETED 时输出 COMPLETED */
  completedAt: string;
  rrule: RRuleSpec | null;
  /** 关联父组件 UID，输出 RELATED-TO */
  relatedTo: string;
  /** 分类标签，输出 CATEGORIES */
  categories: string[];
  description: string;
}

/** VJOURNAL 表单数据 */
export interface VJournalData {
  title: string;
  /** 日记条目日期时间；空串表示不输出 DTSTART */
  dtstart: string;
  status: JournalStatus;
  categories: string[];
  description: string;
  relatedTo: string;
}

export type IcsResult = { ok: true; ics: string } | { ok: false; error: string };

/** 生成器依赖：默认取系统时钟与随机 UID，测试可注入固定值 */
export interface GeneratorDeps {
  now?: Date;
  uid?: string;
}

/**
 * 转义 TEXT 类型值：反斜杠 → \\，分号 → \;，逗号 → \,，换行 → \n（RFC 3.3.11）
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * 属性参数值加双引号包裹（RFC 5545 Section 3.1：含冒号/分号等时 quoted-string）
 */
export function quoteParam(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

/**
 * 按 RFC 5545 Section 3.1 折叠逻辑行：首行最多 75 个八位组，
 * 续行以单空格开头、最多 74 个八位组；按字符的 UTF-8 字节长度切分，避免截断多字节字符。
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
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 && hour <= 23 && minute <= 59;
}

/** datetime-local 值转 UTC 形式 YYYYMMDDTHHMMSSZ（输入按 UTC 解释，避免时区漂移） */
function toUtcStamp(dateTimeLocal: string): string {
  const date = new Date(`${dateTimeLocal}:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('时间无法解析为合法日期');
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Date 转 UTC 形式 YYYYMMDDTHHMMSSZ */
function dateToStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** 默认 UID：时间戳 + 随机段，保证浏览器本地唯一性 */
function defaultUid(now: Date): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${now.getTime().toString(36)}-${random}@ical-todo-journal.local`;
}

/** 校验 RRULE 结构化输入并序列化为 RRULE 内容行的值部分 */
function serializeRRule(rrule: RRuleSpec): string {
  if (rrule.interval !== undefined && (!Number.isInteger(rrule.interval) || rrule.interval < 1)) {
    throw new Error('RRULE INTERVAL 必须为不小于 1 的整数');
  }
  if (rrule.count !== undefined && (!Number.isInteger(rrule.count) || rrule.count < 1)) {
    throw new Error('RRULE COUNT 必须为不小于 1 的整数');
  }
  if (rrule.count !== undefined && rrule.until !== undefined) {
    throw new Error('RRULE 的 COUNT 与 UNTIL 互斥，只能二选一');
  }
  if (rrule.until !== undefined && !isValidDateTimeLocal(rrule.until)) {
    throw new Error('RRULE UNTIL 必须为完整日期时间（YYYY-MM-DD HH:mm）');
  }
  const parts = [`FREQ=${rrule.freq}`];
  if (rrule.interval !== undefined) {
    parts.push(`INTERVAL=${rrule.interval}`);
  }
  if (rrule.count !== undefined) {
    parts.push(`COUNT=${rrule.count}`);
  }
  if (rrule.until !== undefined) {
    parts.push(`UNTIL=${toUtcStamp(rrule.until)}`);
  }
  return parts.join(';');
}

/** 序列化 CATEGORIES 内容行（多值逗号分隔，TEXT 逐项转义） */
function categoriesLine(categories: string[]): string | null {
  const values = categories.map((item) => item.trim()).filter((item) => item.length > 0);
  if (values.length === 0) {
    return null;
  }
  return `CATEGORIES:${values.map(escapeIcsText).join(',')}`;
}

/** VCALENDAR 外壳与公共必填行 */
function calendarShell(deps: GeneratorDeps): { now: Date; uid: string; header: string[] } {
  const now = deps.now ?? new Date();
  const uid = deps.uid ?? defaultUid(now);
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trae Tools//iCalendar Todo Journal//ZH-CN',
    'CALSCALE:GREGORIAN',
  ];
  return { now, uid, header };
}

/** 把逻辑行折叠并以 CRLF 拼接，末尾补 CRLF */
function assemble(lines: string[]): string {
  return lines.map((line) => foldLine(line)).join('\r\n').concat('\r\n');
}

type LinesResult = { ok: true; lines: string[] } | { ok: false; error: string };

/** 校验 VTODO 表单并产出组件逻辑行（不含 VCALENDAR 外壳，不做折叠） */
function buildVTodoLines(data: VTodoData, deps: GeneratorDeps): LinesResult {
  const title = data.title.trim();
  if (title.length === 0) {
    return { ok: false, error: '待办标题 SUMMARY 为必填项' };
  }
  if (data.dtstart && !isValidDateTimeLocal(data.dtstart)) {
    return { ok: false, error: 'DTSTART 必须为完整日期时间（YYYY-MM-DD HH:mm）' };
  }
  if (data.due && !isValidDateTimeLocal(data.due)) {
    return { ok: false, error: 'DUE 必须为完整日期时间（YYYY-MM-DD HH:mm）' };
  }
  if (data.dtstart && data.due && data.due <= data.dtstart) {
    return { ok: false, error: 'DUE 必须晚于 DTSTART' };
  }
  if (data.priority !== null && (!Number.isInteger(data.priority) || data.priority < 1 || data.priority > 9)) {
    return { ok: false, error: 'PRIORITY 取值范围为 1-9 的整数（1 最高，9 最低）' };
  }
  if (
    data.percentComplete !== null &&
    (!Number.isInteger(data.percentComplete) || data.percentComplete < 0 || data.percentComplete > 100)
  ) {
    return { ok: false, error: 'PERCENT-COMPLETE 取值范围为 0-100 的整数' };
  }
  if (data.status === 'COMPLETED' && data.percentComplete !== null && data.percentComplete !== 100) {
    return { ok: false, error: 'STATUS=COMPLETED 时 PERCENT-COMPLETE 必须为 100 或留空' };
  }
  if (data.completedAt && data.status !== 'COMPLETED') {
    return { ok: false, error: 'COMPLETED 仅在 STATUS=COMPLETED 时允许输出' };
  }
  if (data.completedAt && !isValidDateTimeLocal(data.completedAt)) {
    return { ok: false, error: 'COMPLETED 时间必须为完整日期时间（YYYY-MM-DD HH:mm）' };
  }

  let rruleValue: string;
  try {
    rruleValue = data.rrule ? serializeRRule(data.rrule) : '';
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'RRULE 不合法' };
  }

  const { now, uid } = calendarShell(deps);
  const lines = ['BEGIN:VTODO', `UID:${uid}`, `DTSTAMP:${dateToStamp(now)}`];

  if (data.dtstart) {
    lines.push(`DTSTART:${toUtcStamp(data.dtstart)}`);
  }
  if (data.due) {
    lines.push(`DUE:${toUtcStamp(data.due)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(title)}`);
  if (data.description.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(data.description.trim())}`);
  }
  lines.push(`STATUS:${data.status}`);
  if (data.priority !== null) {
    lines.push(`PRIORITY:${data.priority}`);
  }
  if (data.percentComplete !== null) {
    lines.push(`PERCENT-COMPLETE:${data.percentComplete}`);
  }
  if (data.status === 'COMPLETED' && data.completedAt) {
    lines.push(`COMPLETED:${toUtcStamp(data.completedAt)}`);
  }
  if (rruleValue) {
    lines.push(`RRULE:${rruleValue}`);
  }
  const categoryLine = categoriesLine(data.categories);
  if (categoryLine) {
    lines.push(categoryLine);
  }
  if (data.relatedTo.trim()) {
    lines.push(`RELATED-TO:${escapeIcsText(data.relatedTo.trim())}`);
  }

  lines.push('END:VTODO');
  return { ok: true, lines };
}

/** 校验 VJOURNAL 表单并产出组件逻辑行（不含 VCALENDAR 外壳，不做折叠） */
function buildVJournalLines(data: VJournalData, deps: GeneratorDeps): LinesResult {
  const title = data.title.trim();
  if (title.length === 0) {
    return { ok: false, error: '日记标题 SUMMARY 为必填项' };
  }
  if (data.dtstart && !isValidDateTimeLocal(data.dtstart)) {
    return { ok: false, error: 'DTSTART 必须为完整日期时间（YYYY-MM-DD HH:mm）' };
  }

  const { now, uid } = calendarShell(deps);
  const lines = ['BEGIN:VJOURNAL', `UID:${uid}`, `DTSTAMP:${dateToStamp(now)}`];

  if (data.dtstart) {
    lines.push(`DTSTART:${toUtcStamp(data.dtstart)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(title)}`);
  if (data.description.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(data.description.trim())}`);
  }
  lines.push(`STATUS:${data.status}`);
  const categoryLine = categoriesLine(data.categories);
  if (categoryLine) {
    lines.push(categoryLine);
  }
  if (data.relatedTo.trim()) {
    lines.push(`RELATED-TO:${escapeIcsText(data.relatedTo.trim())}`);
  }

  lines.push('END:VJOURNAL');
  return { ok: true, lines };
}

/**
 * 生成单个 VTODO 组件的 .ics 文本。
 *
 * @param data - 待办表单数据
 * @param deps - 可选时钟 / UID 注入（测试固定向量用）
 */
export function buildVTodo(data: VTodoData, deps: GeneratorDeps = {}): IcsResult {
  const result = buildVTodoLines(data, deps);
  if (!result.ok) {
    return result;
  }
  const { header } = calendarShell(deps);
  return { ok: true, ics: assemble([...header, ...result.lines, 'END:VCALENDAR']) };
}

/**
 * 生成单个 VJOURNAL 组件的 .ics 文本。
 *
 * @param data - 日记表单数据
 * @param deps - 可选时钟 / UID 注入（测试固定向量用）
 */
export function buildVJournal(data: VJournalData, deps: GeneratorDeps = {}): IcsResult {
  const result = buildVJournalLines(data, deps);
  if (!result.ok) {
    return result;
  }
  const { header } = calendarShell(deps);
  return { ok: true, ics: assemble([...header, ...result.lines, 'END:VCALENDAR']) };
}

/**
 * 把 VTODO 与 VJOURNAL 组装进同一个 VCALENDAR（可分别为空）。
 * 两类组件至少需要一个，否则返回错误。
 */
export function buildCombinedCalendar(
  todos: VTodoData[],
  journals: VJournalData[],
  deps: GeneratorDeps = {},
): IcsResult {
  if (todos.length === 0 && journals.length === 0) {
    return { ok: false, error: '至少需要一个 VTODO 或 VJOURNAL 组件' };
  }
  const { now, header } = calendarShell(deps);
  const lines = [...header];
  let uidSeed = 0;
  const nextDeps = (): GeneratorDeps => {
    uidSeed += 1;
    return { now, uid: deps.uid ? `${deps.uid}-${uidSeed}` : undefined };
  };

  for (const todo of todos) {
    const result = buildVTodoLines(todo, nextDeps());
    if (!result.ok) {
      return result;
    }
    lines.push(...result.lines);
  }
  for (const journal of journals) {
    const result = buildVJournalLines(journal, nextDeps());
    if (!result.ok) {
      return result;
    }
    lines.push(...result.lines);
  }

  lines.push('END:VCALENDAR');
  return { ok: true, ics: assemble(lines) };
}
