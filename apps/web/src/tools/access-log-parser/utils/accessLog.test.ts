import { describe, expect, it } from 'vitest';
import {
  parseClfTime,
  parseLine,
  parseLog,
  summarize,
  tokenize,
  type AccessLogEntry,
} from './accessLog';

const COMBINED =
  '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"';
const COMMON = '10.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326';

function ok(line: string): AccessLogEntry {
  const r = parseLine(line, 1);
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`);
  return r.entry;
}
function fail(line: string): string {
  const r = parseLine(line, 1);
  if (r.ok) throw new Error('expected parse failure');
  return r.error;
}

describe('tokenize', () => {
  it('splits bare, bracket and quoted tokens, preserving spaces inside', () => {
    const tokens = tokenize(COMBINED);
    expect(tokens).toHaveLength(9);
    expect(tokens[0]).toEqual({ type: 'bare', value: '127.0.0.1' });
    expect(tokens[3]?.type).toBe('bracket');
    expect(tokens[3]?.value).toBe('10/Oct/2000:13:55:36 -0700');
    expect(tokens[8]?.value).toBe('Mozilla/4.08 [en] (Win98; I ;Nav)');
  });

  it('handles escaped quotes and backslashes', () => {
    const tokens = tokenize(String.raw`1.2.3.4 - - [1/Jan/2020:00:00:00 +0000] "GET /a HTTP/1.1" 200 1 "r" "q\"x\\y"`);
    expect(tokens[8]?.value).toBe(String.raw`q"x\y`);
  });

  it('errors on unterminated bracket / quote', () => {
    expect(() => tokenize('1.1.1.1 - - [10/Oct/2000:13:55:36 -0700 "GET / HTTP/1.1" 200 1')).toThrow(/方括号/);
    expect(() => tokenize('1.1.1.1 - - [x] "GET / HTTP/1.1 200 1')).toThrow(/双引号/);
  });

  it('errors when a closing quote is glued to the next token', () => {
    expect(() => tokenize('a b c [t] "r"x')).toThrow(/空格分隔/);
  });
});

describe('parseClfTime', () => {
  it('converts CLF local time with offset to UTC ISO', () => {
    expect(parseClfTime('10/Oct/2000:13:55:36 -0700').iso).toBe('2000-10-10T20:55:36Z');
    expect(parseClfTime('10/Oct/2000:13:55:36 +0800').iso).toBe('2000-10-10T05:55:36Z');
    expect(parseClfTime('1/Jan/2021:00:00:00 +0000').iso).toBe('2021-01-01T00:00:00Z');
  });

  it('produces consistent epoch ms', () => {
    const a = parseClfTime('10/Oct/2000:13:55:36 -0700');
    const b = parseClfTime('10/Oct/2000:20:55:36 +0000');
    expect(a.epochMs).toBe(b.epochMs);
    expect(a.epochMs).toBe(Date.UTC(2000, 9, 10, 20, 55, 36));
  });

  it('accepts near-midnight local times crossing the UTC date', () => {
    // 本地 2000-10-10 23:30 在 -0700 下对应 UTC 10-11 06:30，日期校验不应误报
    expect(parseClfTime('10/Oct/2000:23:30:00 -0700').iso).toBe('2000-10-11T06:30:00Z');
    // 本地 2000-10-01 02:00 在 +0800 下对应 UTC 09-30 18:00
    expect(parseClfTime('1/Oct/2000:02:00:00 +0800').iso).toBe('2000-09-30T18:00:00Z');
  });

  it('rejects bad month, day or offset', () => {
    expect(() => parseClfTime('10/Xxx/2000:13:55:36 -0700')).toThrow(/月份/);
    expect(() => parseClfTime('32/Oct/2000:13:55:36 -0700')).toThrow(/日期/);
    expect(() => parseClfTime('29/Feb/2023:00:00:00 +0000')).toThrow(/日历日期/);
    expect(() => parseClfTime('10/Oct/2000:13:55:36 -2500')).toThrow(/时区/);
    expect(() => parseClfTime('not a time')).toThrow(/时间格式/);
  });
});

describe('parseLine — standard formats', () => {
  it('parses the Apache Combined reference line field by field', () => {
    const e = ok(COMBINED);
    expect(e.host).toBe('127.0.0.1');
    expect(e.ident).toBeNull();
    expect(e.authUser).toBe('frank');
    expect(e.timeRaw).toBe('10/Oct/2000:13:55:36 -0700');
    expect(e.timeIso).toBe('2000-10-10T20:55:36Z');
    expect(e.method).toBe('GET');
    expect(e.path).toBe('/apache_pb.gif');
    expect(e.protocol).toBe('HTTP/1.0');
    expect(e.status).toBe(200);
    expect(e.bytes).toBe(2326);
    expect(e.referer).toBe('http://www.example.com/start.html');
    expect(e.userAgent).toBe('Mozilla/4.08 [en] (Win98; I ;Nav)');
    expect(e.requestTime).toBeNull();
    expect(e.format).toBe('combined');
  });

  it('parses Common format with null referer / UA', () => {
    const e = ok(COMMON);
    expect(e.format).toBe('common');
    expect(e.referer).toBeNull();
    expect(e.userAgent).toBeNull();
    expect(e.status).toBe(200);
    expect(e.bytes).toBe(2326);
  });

  it('keeps query string in path and accepts missing protocol', () => {
    const e = ok('8.8.8.8 - - [1/Jan/2021:00:00:00 +0000] "GET /a?b=1&c=2" 404 0 "-" "curl/8"');
    expect(e.path).toBe('/a?b=1&c=2');
    expect(e.protocol).toBeNull();
    expect(e.referer).toBeNull();
  });

  it('maps dash bytes to null and parses optional request_time', () => {
    const e = ok('9.9.9.9 - - [1/Jan/2021:00:00:00 +0000] "HEAD / HTTP/1.1" 304 - "-" "-" 0.032');
    expect(e.bytes).toBeNull();
    expect(e.requestTime).toBeCloseTo(0.032, 10);
  });

  it('accepts "-" request line as null method/path/protocol', () => {
    const e = ok('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "-" 400 0 "-" "-"');
    expect(e.method).toBeNull();
    expect(e.path).toBeNull();
    expect(e.protocol).toBeNull();
    expect(e.status).toBe(400);
  });
});

describe('parseLine — malformed input', () => {
  it('reports too few fields', () => {
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1"')).toMatch(/字段不足/);
  });

  it('rejects orphan 8th field', () => {
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1" 200 1 "-"')).toMatch(/User-Agent/);
  });

  it('rejects bad status, bytes and request_time', () => {
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1" 99 1 "-" "x"')).toMatch(/状态码/);
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1" 200 abc')).toMatch(/字节/);
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1" 200 1 "-" "x" -0.5')).toMatch(/响应时间/);
  });

  it('rejects malformed request line', () => {
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "" 200 1 "-" "x"')).toMatch(/请求行/);
  });

  it('rejects wrong token types', () => {
    expect(fail('1.1.1.1 - - 1/Jan/2021:00:00:00 "GET / HTTP/1.1" 200 1')).toMatch(/方括号/);
    expect(fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] GET / HTTP/1.1 200 1')).toMatch(/双引号/);
  });

  it('rejects more than 10 fields', () => {
    expect(
      fail('1.1.1.1 - - [1/Jan/2021:00:00:00 +0000] "GET / HTTP/1.1" 200 1 "-" "ua" 0.1 extra'),
    ).toMatch(/字段过多/);
  });

  it('carries the 1-based line number on failure', () => {
    const r = parseLine('garbage line', 42);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.lineNumber).toBe(42);
      expect(r.raw).toBe('garbage line');
    }
  });
});

describe('parseLog + summarize', () => {
  const sample = [
    '10.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /a HTTP/1.0" 200 100 "-" "UA-A" 0.010',
    '',
    '10.0.0.1 - alice [10/Oct/2000:13:55:37 -0700] "POST /b HTTP/1.0" 201 50 "http://r/" "UA-A" 0.030',
    '10.0.0.2 - - [10/Oct/2000:13:55:38 -0700] "GET /a HTTP/1.0" 304 - "-" "UA-B"',
    '10.0.0.3 - - [10/Oct/2000:13:55:39 -0700] "GET /missing HTTP/1.0" 404 12 "-" "UA-B"',
    'this line is broken',
  ].join('\n');

  it('skips blank lines and keeps file line numbers', () => {
    const results = parseLog(sample);
    expect(results).toHaveLength(5);
    expect(results[0]?.ok && results[0]?.lineNumber).toBe(1);
    expect(results[1]?.ok && results[1]?.lineNumber).toBe(3);
    expect(results[4]?.ok).toBe(false);
    if (results[4] && !results[4].ok) expect(results[4].lineNumber).toBe(6);
  });

  it('aggregates counts, classes, bytes, tops, span and qps in one pass', () => {
    const results = parseLog(sample);
    const s = summarize(results, 1);
    expect(s.blank).toBe(1);
    expect(s.parsed).toBe(4);
    expect(s.failed).toBe(1);
    expect(s.totalLines).toBe(6);
    expect(s.successRate).toBeCloseTo(0.8, 5);
    expect(s.statusClasses['2xx']).toBe(2);
    expect(s.statusClasses['3xx']).toBe(1);
    expect(s.statusClasses['4xx']).toBe(1);
    expect(s.statusClasses['5xx']).toBe(0);
    expect(s.totalBytes).toBe(162);
    expect(s.nullBytes).toBe(1);
    expect(s.topIps[0]).toEqual({ key: '10.0.0.1', count: 2 });
    expect(s.topPaths[0]).toEqual({ key: '/a', count: 2 });
    // UA-A 与 UA-B 均为 2 次，并列时按字典序 UA-A 在前
    expect(s.topUserAgents[0]).toEqual({ key: 'UA-A', count: 2 });
    expect(s.topUserAgents[1]).toEqual({ key: 'UA-B', count: 2 });
    expect(s.statusCounts).toContainEqual({ key: '200', count: 1 });
    expect(s.startIso).toBe('2000-10-10T20:55:36Z');
    expect(s.endIso).toBe('2000-10-10T20:55:39Z');
    expect(s.qps).toBeCloseTo(4 / 3, 5);
    expect(s.avgRequestTimeMs).toBeCloseTo(20, 10);
  });

  it('handles empty input and zero span', () => {
    const empty = summarize([], 0);
    expect(empty.parsed).toBe(0);
    expect(empty.qps).toBe(0);
    expect(empty.startMs).toBeNull();

    const one = summarize(parseLog(COMMON), 0);
    expect(one.qps).toBe(1);
    expect(one.startIso).toBe(one.endIso);
    expect(one.avgRequestTimeMs).toBeNull();
  });
});
