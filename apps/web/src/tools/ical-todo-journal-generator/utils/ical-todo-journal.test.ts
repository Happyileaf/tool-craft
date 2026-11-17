import { describe, it, expect } from 'vitest';
import {
  MAX_LINE_LENGTH,
  buildCombinedCalendar,
  buildVJournal,
  buildVTodo,
  escapeIcsText,
  foldLine,
  quoteParam,
  type VTodoData,
  type VJournalData,
} from './ical-todo-journal';

/** 固定时钟：2026-11-18T06:30:00Z → 20261118T063000Z */
const FIXED_NOW = new Date('2026-11-18T06:30:00.000Z');
const FIXED_UID = 'fixed-uid-1234@test.local';
const FIXED_DEPS = { now: FIXED_NOW, uid: FIXED_UID };

const baseTodo = (overrides: Partial<VTodoData> = {}): VTodoData => ({
  title: '提交季度合规报告',
  dtstart: '2026-11-20T09:00',
  due: '2026-11-25T18:00',
  status: 'IN-PROCESS',
  priority: 1,
  percentComplete: 40,
  completedAt: '',
  rrule: null,
  relatedTo: '',
  categories: ['合规', '季度任务'],
  description: '第一行,第二行;第三行\\结尾',
  ...overrides,
});

const baseJournal = (overrides: Partial<VJournalData> = {}): VJournalData => ({
  title: '项目复盘日记',
  dtstart: '2026-11-18T20:00',
  status: 'FINAL',
  categories: ['复盘'],
  description: '记录当天进展',
  relatedTo: '',
  ...overrides,
});

describe('escapeIcsText / quoteParam 文本处理（RFC 3.3.11 / 3.1）', () => {
  it('转义反斜杠、分号、逗号与换行', () => {
    expect(escapeIcsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
    expect(escapeIcsText('x\r\ny')).toBe('x\\ny');
  });

  it('quoteParam 包裹双引号并剔除内嵌引号', () => {
    expect(quoteParam('Asia/Shanghai')).toBe('"Asia/Shanghai"');
    expect(quoteParam('a"b')).toBe('"ab"');
  });
});

describe('foldLine 75 八位组折叠（RFC 3.1）', () => {
  it('短行不折叠', () => {
    expect(foldLine('SUMMARY:短')).toBe('SUMMARY:短');
  });

  it('超长 ASCII 行按 75/74 切分且续行以空格开头', () => {
    const line = `DESCRIPTION:${'a'.repeat(160)}`;
    const folded = foldLine(line);
    const physical = folded.split('\r\n');
    expect(physical[0]!).toHaveLength(MAX_LINE_LENGTH);
    expect(physical[1]!.startsWith(' ')).toBe(true);
    expect(physical[1]!).toHaveLength(MAX_LINE_LENGTH);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('按 UTF-8 字节而非字符数切分，不截断多字节字符', () => {
    const line = `SUMMARY:${'中'.repeat(40)}`;
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    for (const physical of folded.split('\r\n')) {
      expect(new TextEncoder().encode(physical).length).toBeLessThanOrEqual(MAX_LINE_LENGTH);
    }
  });
});

describe('buildVTodo 固定向量', () => {
  it('完整 VTODO 输出确定的字段顺序与 UTC 时间格式', () => {
    const result = buildVTodo(baseTodo(), FIXED_DEPS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toBe(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Trae Tools//iCalendar Todo Journal//ZH-CN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VTODO',
        `UID:${FIXED_UID}`,
        'DTSTAMP:20261118T063000Z',
        'DTSTART:20261120T090000Z',
        'DUE:20261125T180000Z',
        'SUMMARY:提交季度合规报告',
        'DESCRIPTION:第一行\\,第二行\\;第三行\\\\结尾',
        'STATUS:IN-PROCESS',
        'PRIORITY:1',
        'PERCENT-COMPLETE:40',
        'CATEGORIES:合规,季度任务',
        'END:VTODO',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );
  });

  it('RRULE 与 RELATED-TO 正确序列化，UNTIL 转 UTC', () => {
    const result = buildVTodo(
      baseTodo({
        rrule: { freq: 'WEEKLY', interval: 2, until: '2026-12-31T23:59' },
        relatedTo: 'parent-uid-1@test.local',
      }),
      FIXED_DEPS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T235900Z\r\n');
    expect(result.ics).toContain('RELATED-TO:parent-uid-1@test.local\r\n');
  });

  it('RRULE COUNT 形式与 FREQ 输出', () => {
    const result = buildVTodo(baseTodo({ rrule: { freq: 'DAILY', count: 5 } }), FIXED_DEPS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toContain('RRULE:FREQ=DAILY;COUNT=5\r\n');
  });

  it('COMPLETED 状态输出 COMPLETED 行且 PERCENT-COMPLETE=100', () => {
    const result = buildVTodo(
      baseTodo({ status: 'COMPLETED', percentComplete: 100, completedAt: '2026-11-18T10:00' }),
      FIXED_DEPS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toContain('COMPLETED:20261118T100000Z\r\n');
    expect(result.ics).toContain('STATUS:COMPLETED\r\n');
  });

  it('最小 VTODO：仅标题与状态，可选项全部省略', () => {
    const result = buildVTodo(
      baseTodo({
        dtstart: '',
        due: '',
        priority: null,
        percentComplete: null,
        rrule: null,
        categories: [],
        description: '',
      }),
      FIXED_DEPS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).not.toContain('DTSTART:');
    expect(result.ics).not.toContain('DUE:');
    expect(result.ics).not.toContain('PRIORITY:');
    expect(result.ics).not.toContain('PERCENT-COMPLETE:');
    expect(result.ics).not.toContain('CATEGORIES:');
    expect(result.ics).toContain('STATUS:IN-PROCESS\r\n');
  });
});

describe('buildVTodo 校验失败', () => {
  it('标题为空', () => {
    const result = buildVTodo(baseTodo({ title: '   ' }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('SUMMARY');
  });

  it('DUE 早于 DTSTART', () => {
    const result = buildVTodo(baseTodo({ dtstart: '2026-11-25T18:00', due: '2026-11-20T09:00' }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('DUE 必须晚于 DTSTART');
  });

  it('PRIORITY 越界（0 与 10 均非法）', () => {
    expect(buildVTodo(baseTodo({ priority: 0 }), FIXED_DEPS).ok).toBe(false);
    expect(buildVTodo(baseTodo({ priority: 10 }), FIXED_DEPS).ok).toBe(false);
  });

  it('PERCENT-COMPLETE 越界', () => {
    const result = buildVTodo(baseTodo({ percentComplete: 101 }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('0-100');
  });

  it('COMPLETED 状态却给非 100 完成度', () => {
    const result = buildVTodo(baseTodo({ status: 'COMPLETED', percentComplete: 80 }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('100');
  });

  it('非 COMPLETED 状态填写 COMPLETED 时间被拒', () => {
    const result = buildVTodo(baseTodo({ completedAt: '2026-11-18T10:00' }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('COMPLETED 仅在');
  });

  it('RRULE COUNT 与 UNTIL 互斥', () => {
    const result = buildVTodo(
      baseTodo({ rrule: { freq: 'DAILY', count: 3, until: '2026-12-31T23:59' } }),
      FIXED_DEPS,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('互斥');
  });

  it('INTERVAL 必须为正整数', () => {
    const result = buildVTodo(baseTodo({ rrule: { freq: 'DAILY', interval: 0 } }), FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('INTERVAL');
  });
});

describe('buildVJournal 固定向量', () => {
  it('完整 VJOURNAL 输出确定字段', () => {
    const result = buildVJournal(baseJournal(), FIXED_DEPS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).toBe(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Trae Tools//iCalendar Todo Journal//ZH-CN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VJOURNAL',
        `UID:${FIXED_UID}`,
        'DTSTAMP:20261118T063000Z',
        'DTSTART:20261118T200000Z',
        'SUMMARY:项目复盘日记',
        'DESCRIPTION:记录当天进展',
        'STATUS:FINAL',
        'CATEGORIES:复盘',
        'END:VJOURNAL',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );
  });

  it('DRAFT 日记无 DTSTART 时仍合法（VJOURNAL 不强制 DTSTART）', () => {
    const result = buildVJournal(baseJournal({ dtstart: '', status: 'DRAFT', categories: [] }), FIXED_DEPS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics).not.toContain('DTSTART:');
    expect(result.ics).toContain('STATUS:DRAFT\r\n');
    expect(result.ics).not.toContain('CATEGORIES:');
  });

  it('标题为空时报错', () => {
    const result = buildVJournal(baseJournal({ title: '' }), FIXED_DEPS);
    expect(result.ok).toBe(false);
  });
});

describe('buildCombinedCalendar 混合日历', () => {
  it('VTODO 与 VJOURNAL 进入同一 VCALENDAR，UID 自动区分', () => {
    const result = buildCombinedCalendar([baseTodo()], [baseJournal()], FIXED_DEPS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ics.match(/BEGIN:VCALENDAR/g)).toHaveLength(1);
    expect(result.ics.match(/END:VCALENDAR/g)).toHaveLength(1);
    expect(result.ics).toContain('BEGIN:VTODO\r\n');
    expect(result.ics).toContain('END:VTODO\r\n');
    expect(result.ics).toContain('BEGIN:VJOURNAL\r\n');
    expect(result.ics).toContain('END:VJOURNAL\r\n');
    expect(result.ics).toContain(`UID:${FIXED_UID}-1\r\n`);
    expect(result.ics).toContain(`UID:${FIXED_UID}-2\r\n`);
    expect(result.ics.endsWith('\r\n')).toBe(true);
  });

  it('两个组件都为空时报错', () => {
    const result = buildCombinedCalendar([], [], FIXED_DEPS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('至少需要一个');
  });

  it('内部组件校验失败时整体返回错误', () => {
    const result = buildCombinedCalendar([baseTodo({ title: '' })], [], FIXED_DEPS);
    expect(result.ok).toBe(false);
  });
});
