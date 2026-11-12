import { describe, expect, it } from 'vitest';
import {
  MAX_LINE_LENGTH,
  buildIcsEvent,
  escapeIcsText,
  foldLine,
  type IcsEventData,
} from './ics';

/** 构造合法的最小事件数据，单测按需覆盖字段 */
function createEvent(overrides: Partial<IcsEventData> = {}): IcsEventData {
  return {
    title: '需求评审会',
    allDay: false,
    start: '2026-12-01T09:30',
    end: '2026-12-01T10:30',
    timezone: '',
    location: '',
    description: '',
    organizerEmail: '',
    reminder: null,
    ...overrides,
  };
}

describe('escapeIcsText', () => {
  it('escapes backslashes, semicolons, commas and newlines per RFC 5545', () => {
    expect(escapeIcsText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
    expect(escapeIcsText('line1\r\nline2')).toBe('line1\\nline2');
  });
});

describe('foldLine', () => {
  it('keeps short lines untouched', () => {
    expect(foldLine('SUMMARY:短会')).toBe('SUMMARY:短会');
  });

  it('folds long ASCII lines at 75 octets with a leading space', () => {
    const line = `SUMMARY:${'a'.repeat(100)}`;
    const folded = foldLine(line);
    const physical = folded.split('\r\n');
    expect(physical[0]).toHaveLength(MAX_LINE_LENGTH);
    expect(physical[1]?.startsWith(' ')).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('does not split a multibyte UTF-8 character across lines', () => {
    // 每个中文字符占 3 个八位组，75 不是 3 的整数倍，折叠边界必须落在字符之间
    const line = `DESCRIPTION:${'中'.repeat(40)}`;
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    for (const physical of folded.split('\r\n')) {
      expect(new TextEncoder().encode(physical).length).toBeLessThanOrEqual(MAX_LINE_LENGTH);
    }
  });
});

describe('buildIcsEvent validation', () => {
  it('rejects empty title', () => {
    const result = buildIcsEvent(createEvent({ title: '   ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/标题/);
    }
  });

  it('rejects malformed datetime and inverted time range', () => {
    expect(buildIcsEvent(createEvent({ start: '2026-12-01 09:30' })).ok).toBe(false);
    expect(
      buildIcsEvent(createEvent({ start: '2026-12-01T11:00', end: '2026-12-01T10:00' })).ok,
    ).toBe(false);
  });

  it('rejects inverted all-day range and malformed date', () => {
    expect(
      buildIcsEvent(
        createEvent({ allDay: true, start: '2026-12-05', end: '2026-12-04' }),
      ).ok,
    ).toBe(false);
    expect(
      buildIcsEvent(createEvent({ allDay: true, start: '2026-12-05T00:00', end: '2026-12-06' }))
        .ok,
    ).toBe(false);
  });

  it('rejects non-positive reminder amount', () => {
    expect(
      buildIcsEvent(createEvent({ reminder: { amount: 0, unit: 'minutes' } })).ok,
    ).toBe(false);
  });
});

describe('buildIcsEvent output', () => {
  it('builds a UTC timed event with required envelope fields and CRLF endings', () => {
    const result = buildIcsEvent(
      createEvent({
        location: '会议室 A; 北京',
        description: '讨论 Q1 路线图, 请准时',
        organizerEmail: 'host@example.com',
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(result.ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(result.ics).toContain('VERSION:2.0');
    expect(result.ics).toMatch(/UID:[^\r\n]+/);
    expect(result.ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(result.ics).toContain('DTSTART:20261201T093000Z');
    expect(result.ics).toContain('DTEND:20261201T103000Z');
    expect(result.ics).toContain('SUMMARY:需求评审会');
    expect(result.ics).toContain('LOCATION:会议室 A\\; 北京');
    expect(result.ics).toContain('DESCRIPTION:讨论 Q1 路线图\\, 请准时');
    expect(result.ics).toContain('ORGANIZER;CN=host@example.com:mailto:host@example.com');
  });

  it('emits TZID local floating stamps when a timezone is supplied', () => {
    const result = buildIcsEvent(
      createEvent({ timezone: 'Asia/Shanghai' }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.ics).toContain('DTSTART;TZID=Asia/Shanghai:20261201T093000');
    expect(result.ics).toContain('DTEND;TZID=Asia/Shanghai:20261201T103000');
    expect(result.ics).not.toContain('DTSTART:');
  });

  it('emits VALUE=DATE for all-day events with exclusive DTEND on the next day', () => {
    const result = buildIcsEvent(
      createEvent({ allDay: true, start: '2026-12-31', end: '2027-01-01' }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.ics).toContain('DTSTART;VALUE=DATE:20261231');
    expect(result.ics).toContain('DTEND;VALUE=DATE:20270102');
  });

  it('adds a VALARM block with a duration trigger for the reminder', () => {
    const result = buildIcsEvent(
      createEvent({ reminder: { amount: 2, unit: 'hours' } }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.ics).toContain('BEGIN:VALARM');
    expect(result.ics).toContain('ACTION:DISPLAY');
    expect(result.ics).toContain('TRIGGER:-PT120M');
    expect(result.ics).toContain('END:VALARM');
  });

  it('converts day reminders to minutes in the trigger', () => {
    const result = buildIcsEvent(
      createEvent({ reminder: { amount: 1, unit: 'days' } }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.ics).toContain('TRIGGER:-PT1440M');
  });
});
