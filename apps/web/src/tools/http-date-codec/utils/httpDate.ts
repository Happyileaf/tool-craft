// HTTP-date parsing and formatting per RFC 9110 §5.6.7.
// Three historical formats are accepted on input; the preferred IMF-fixdate
// is always produced on output. All times are interpreted/generated in UTC.

export type HttpDateFormat = 'IMF-fixdate' | 'RFC850' | 'asctime';

export interface ParsedHttpDate {
  ok: boolean;
  epochSeconds: number;
  format?: HttpDateFormat;
  iso?: string;
  error?: string;
}

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DateFields {
  year: number;
  month: number; // 0-based
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Validate calendar ranges and weekday consistency, then return epoch seconds. */
function toEpoch(fields: DateFields, declaredWeekday: string | undefined): number {
  const { year, month, day, hour, minute, second } = fields;
  if (month < 0 || month > 11) {
    throw new Error('非法月份');
  }
  if (day < 1 || day > 31) {
    throw new Error('日期超出 1-31 范围');
  }
  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error('时间字段超出范围');
  }
  // Date.UTC rejects impossible days (e.g. Feb 30) by rolling over; detect via re-format.
  const epoch = Date.UTC(year, month, day, hour, minute, second);
  if (Number.isNaN(epoch)) {
    throw new Error('无法构造有效日期');
  }
  const check = new Date(epoch);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month ||
    check.getUTCDate() !== day
  ) {
    throw new Error('日期在该月份不存在');
  }
  if (declaredWeekday !== undefined) {
    const actual = WEEKDAYS[check.getUTCDay()];
    if (actual !== declaredWeekday) {
      throw new Error(`星期不匹配：该日期应为 ${actual}`);
    }
  }
  return Math.floor(epoch / 1000);
}

// IMF-fixdate: Sun, 06 Nov 1994 08:49:37 GMT
const IMF_REGEX =
  /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+)?(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/;

// RFC 850: Sunday, 06-Nov-94 08:49:37 GMT
const RFC850_REGEX =
  /^(?:[A-Za-z]+,\s+)?(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/;

// asctime: Sun Nov  6 08:49:37 1994
const ASCTIME_REGEX =
  /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\d{4})$/;

/** Parse an HTTP-date header value into epoch seconds. */
export function parseHttpDate(input: string): ParsedHttpDate {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, epochSeconds: 0, error: '输入为空' };
  }

  let match = IMF_REGEX.exec(raw);
  if (match) {
    try {
      const epochSeconds = toEpoch(
        {
          year: Number(match[4]),
          month: MONTHS[match[3] as string] ?? -1,
          day: Number(match[2]),
          hour: Number(match[5]),
          minute: Number(match[6]),
          second: Number(match[7]),
        },
        match[1],
      );
      return success(epochSeconds, 'IMF-fixdate');
    } catch (error) {
      return { ok: false, epochSeconds: 0, error: (error as Error).message };
    }
  }

  match = RFC850_REGEX.exec(raw);
  if (match) {
    try {
      const twoDigitYear = Number(match[3]);
      // RFC 9110: two-digit year > current year's last two digits implies previous century.
      const currentTwoDigit = new Date().getUTCFullYear() % 100;
      const century = twoDigitYear <= currentTwoDigit ? 2000 : 1900;
      const epochSeconds = toEpoch(
        {
          year: century + twoDigitYear,
          month: MONTHS[match[2] as string] ?? -1,
          day: Number(match[1]),
          hour: Number(match[4]),
          minute: Number(match[5]),
          second: Number(match[6]),
        },
        undefined,
      );
      return success(epochSeconds, 'RFC850');
    } catch (error) {
      return { ok: false, epochSeconds: 0, error: (error as Error).message };
    }
  }

  match = ASCTIME_REGEX.exec(raw);
  if (match) {
    try {
      const epochSeconds = toEpoch(
        {
          year: Number(match[7]),
          month: MONTHS[match[2] as string] ?? -1,
          day: Number(match[3]),
          hour: Number(match[4]),
          minute: Number(match[5]),
          second: Number(match[6]),
        },
        match[1],
      );
      return success(epochSeconds, 'asctime');
    } catch (error) {
      return { ok: false, epochSeconds: 0, error: (error as Error).message };
    }
  }

  return {
    ok: false,
    epochSeconds: 0,
    error: '不匹配 IMF-fixdate / RFC 850 / asctime 任一格式（注意必须以 GMT 结尾）',
  };
}

function success(epochSeconds: number, format: HttpDateFormat): ParsedHttpDate {
  return {
    ok: true,
    epochSeconds,
    format,
    iso: new Date(epochSeconds * 1000).toISOString(),
  };
}

/** Format epoch seconds (or a Date) as the preferred IMF-fixdate, in UTC. */
export function formatImfFixdate(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    throw new Error('无效的 epoch 秒数');
  }
  const weekday = WEEKDAYS[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  return `${weekday}, ${day} ${month} ${year} ${hour}:${minute}:${second} GMT`;
}
