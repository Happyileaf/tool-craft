import { describe, expect, it } from 'vitest';

import { formatImfFixdate, parseHttpDate } from './httpDate';

// RFC 9110 §5.6.7 three equivalent forms of 1994-11-06T08:49:37Z.
const EXPECTED_EPOCH = Date.UTC(1994, 10, 6, 8, 49, 37) / 1000;
const EXPECTED_ISO = '1994-11-06T08:49:37.000Z';
const IMF = 'Sun, 06 Nov 1994 08:49:37 GMT';
const RFC850 = 'Sunday, 06-Nov-94 08:49:37 GMT';
const ASCTIME = 'Sun Nov  6 08:49:37 1994';

describe('parseHttpDate', () => {
  it('parses IMF-fixdate', () => {
    const result = parseHttpDate(IMF);
    expect(result.ok).toBe(true);
    expect(result.epochSeconds).toBe(EXPECTED_EPOCH);
    expect(result.format).toBe('IMF-fixdate');
    expect(result.iso).toBe(EXPECTED_ISO);
  });

  it('parses RFC 850 date with two-digit year', () => {
    const result = parseHttpDate(RFC850);
    expect(result.ok).toBe(true);
    expect(result.epochSeconds).toBe(EXPECTED_EPOCH);
    expect(result.format).toBe('RFC850');
  });

  it('parses asctime date with single-digit day', () => {
    const result = parseHttpDate(ASCTIME);
    expect(result.ok).toBe(true);
    expect(result.epochSeconds).toBe(EXPECTED_EPOCH);
    expect(result.format).toBe('asctime');
  });

  it('rejects a value missing the GMT suffix', () => {
    const result = parseHttpDate('Sun, 06 Nov 1994 08:49:37');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects an impossible calendar day', () => {
    expect(parseHttpDate('Mon, 31 Feb 2000 00:00:00 GMT').ok).toBe(false);
  });

  it('rejects a weekday that contradicts the date', () => {
    // 1994-11-06 is a Sunday, not Monday.
    const result = parseHttpDate('Mon, 06 Nov 1994 08:49:37 GMT');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('星期');
  });

  it('rejects empty and unrecognized input', () => {
    expect(parseHttpDate('').ok).toBe(false);
    expect(parseHttpDate('not a date').ok).toBe(false);
  });
});

describe('formatImfFixdate', () => {
  it('emits the canonical IMF-fixdate in UTC', () => {
    expect(formatImfFixdate(EXPECTED_EPOCH)).toBe(IMF);
  });

  it('round-trips through the parser', () => {
    const epoch = Date.UTC(2026, 0, 31, 23, 59, 59) / 1000;
    const formatted = formatImfFixdate(epoch);
    expect(parseHttpDate(formatted).epochSeconds).toBe(epoch);
  });
});
