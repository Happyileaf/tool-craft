/**
 * NCSA Common / Combined Log Format 访问日志解析与汇总（零依赖纯函数）。
 *
 * 标准 Combined 行形如：
 *   host ident authuser [10/Oct/2000:13:55:36 -0700] "GET /a?b=1 HTTP/1.0" 200 2326 "http://r/" "UA/1.0" 0.032
 * Common 行缺最后的 referer / user-agent；末尾数值为可选 request_time 扩展。
 */

export type LogFormat = 'common' | 'combined';

export interface AccessLogEntry {
  /** 1 起始的原始文件行号（空行也占号） */
  lineNumber: number;
  host: string;
  ident: string | null;
  authUser: string | null;
  /** CLF 时间戳原文，如 10/Oct/2000:13:55:36 -0700 */
  timeRaw: string;
  /** 转换后的 ISO 8601（含原始时区偏移） */
  timeIso: string;
  /** Unix 毫秒时间戳，用于排序 / 跨度统计 */
  epochMs: number;
  /** 请求行为 "-" 或异常空串时为 null */
  method: string | null;
  path: string | null;
  protocol: string | null;
  status: number;
  /** 字节字段为 "-" 时为 null（空响应体） */
  bytes: number | null;
  referer: string | null;
  userAgent: string | null;
  requestTime: number | null;
  format: LogFormat;
}

export type LineResult =
  | { ok: true; lineNumber: number; entry: AccessLogEntry }
  | { ok: false; lineNumber: number; raw: string; error: string };

export interface CountItem {
  key: string;
  count: number;
}

export interface LogSummary {
  totalLines: number;
  parsed: number;
  failed: number;
  blank: number;
  successRate: number;
  statusClasses: Record<'1xx' | '2xx' | '3xx' | '4xx' | '5xx', number>;
  statusCounts: CountItem[];
  totalBytes: number;
  nullBytes: number;
  topIps: CountItem[];
  topPaths: CountItem[];
  topUserAgents: CountItem[];
  startMs: number | null;
  endMs: number | null;
  startIso: string | null;
  endIso: string | null;
  qps: number;
  avgRequestTimeMs: number | null;
}

interface Token {
  /** bare：裸 token；bracket：[..]；quote：".." */
  type: 'bare' | 'bracket' | 'quote';
  value: string;
}

const CLF_MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/**
 * 将一行日志切分为 token：裸字段、[方括号]、"双引号" 三类，引号 / 反斜杠可转义。
 * 方括号或引号未闭合时抛错。
 */
export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    while (i < n && line[i] === ' ') i += 1;
    if (i >= n) break;

    const start = i;
    const opener = line[i];

    if (opener === '[' || opener === '"') {
      const close = opener === '[' ? ']' : '"';
      const chars: string[] = [];
      i += 1;
      let closed = false;
      while (i < n) {
        const ch = line[i];
        if (ch === undefined) break;
        if (ch === '\\') {
          const next = line[i + 1];
          if (next !== undefined) {
            if (close === '"' && (next === '"' || next === '\\')) {
              chars.push(next);
            } else {
              chars.push(ch, next);
            }
            i += 2;
            continue;
          }
        }
        if (ch === close) {
          closed = true;
          i += 1;
          break;
        }
        chars.push(ch);
        i += 1;
      }
      if (!closed) {
        throw new Error(opener === '[' ? '方括号 [ 未闭合' : '双引号 " 未闭合');
      }
      tokens.push({ type: opener === '[' ? 'bracket' : 'quote', value: chars.join('') });
      // 闭合符后若紧跟非空白字符，视为字段粘连畸形
      if (i < n && line[i] !== ' ') {
        throw new Error(`字段在位置 ${i + 1} 后缺少空格分隔`);
      }
    } else {
      let j = i;
      while (j < n && line[j] !== ' ') j += 1;
      tokens.push({ type: 'bare', value: line.slice(i, j) });
      i = j;
    }

    if (start === i) {
      // 理论不可达，防御死循环
      throw new Error('日志行切分失败');
    }
  }

  return tokens;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 毫秒时间戳 → 秒精度 ISO 8601（Z 结尾），输入需为合法时间 */
function toIsoSecond(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(
    d.getUTCHours(),
  )}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
}

/**
 * CLF 时间（10/Oct/2000:13:55:36 -0700）转 ISO 8601 与 epoch 毫秒。
 * 非法日期 / 月份 / 偏移抛错，不做静默回退。
 */
export function parseClfTime(raw: string): { iso: string; epochMs: number } {
  const match = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/.exec(raw);
  if (!match) {
    throw new Error(`时间格式非法：${raw}`);
  }
  const dayStr = match[1];
  const mon = match[2];
  const yearStr = match[3];
  const hh = match[4];
  const mm = match[5];
  const ss = match[6];
  const tz = match[7];
  if (!dayStr || !mon || !yearStr || !hh || !mm || !ss || !tz) {
    throw new Error(`时间格式非法：${raw}`);
  }
  if (!(mon in CLF_MONTHS)) {
    throw new Error(`时间中的月份非法：${mon}`);
  }
  const day = Number(dayStr);
  const year = Number(yearStr);
  if (day < 1 || day > 31) {
    throw new Error(`时间中的日期非法：${dayStr}`);
  }
  const sign = tz[0] === '-' ? -1 : 1;
  const tzHour = Number(tz.slice(1, 3));
  const tzMin = Number(tz.slice(3, 5));
  if (tzHour > 23 || tzMin > 59) {
    throw new Error(`时间的时区偏移非法：${tz}`);
  }

  // 先按「无时区」构造，校验本地分量是否构成合法日历日（如 2 月 30 日）
  const utcMs = Date.UTC(year, CLF_MONTHS[mon], day, Number(hh), Number(mm), Number(ss));
  const localDate = new Date(utcMs);
  if (
    localDate.getUTCMonth() !== CLF_MONTHS[mon] ||
    localDate.getUTCDate() !== day ||
    localDate.getUTCHours() !== Number(hh)
  ) {
    throw new Error(`时间不是有效日历日期：${raw}`);
  }
  // 再减去本地偏移，使 epochMs 对应日志中的绝对时刻
  const epochMs = utcMs - sign * (tzHour * 60 + tzMin) * 60_000;
  return { iso: toIsoSecond(epochMs), epochMs };
}

function nullDash(value: string): string | null {
  return value === '-' ? null : value;
}

function parseRequest(raw: string): { method: string | null; path: string | null; protocol: string | null } {
  if (raw === '-') return { method: null, path: null, protocol: null };
  const parts = raw.split(' ');
  const method = parts[0];
  if (!method) throw new Error('请求行格式非法（应为 "METHOD PATH PROTOCOL"）');
  if (parts.length >= 3) {
    // 路径本身理论上不含裸空格；protocol 取末段，path 取中间各段拼回
    const protocol = parts[parts.length - 1];
    if (!protocol) throw new Error('请求行格式非法（缺少协议字段）');
    return {
      method,
      path: parts.slice(1, -1).join(' '),
      protocol,
    };
  }
  if (parts.length === 2) {
    return { method, path: parts[1] ?? '', protocol: null };
  }
  throw new Error('请求行格式非法（应为 "METHOD PATH PROTOCOL"）');
}

/**
 * 解析单行 Common / Combined 日志。
 * @param line 原始日志行（不含行尾换行）
 * @param lineNumber 1 起始的行号
 */
export function parseLine(line: string, lineNumber: number): LineResult {
  const fail = (error: string): LineResult => ({ ok: false, lineNumber, raw: line, error });
  let tokens: Token[];
  try {
    tokens = tokenize(line);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  if (tokens.length < 7) {
    return fail(`字段不足：至少需要 7 个字段，实际 ${tokens.length} 个`);
  }

  const [hostTok, identTok, authTok, timeTok, reqTok, statusTok, bytesTok, refererTok, uaTok, rtTok] = tokens;
  if (!hostTok || !identTok || !authTok || !timeTok || !reqTok || !statusTok || !bytesTok) {
    return fail('字段不足：至少需要 7 个字段');
  }

  if (hostTok.type !== 'bare') return fail('第 1 个字段（主机）不能包含引号或方括号');
  if (timeTok.type !== 'bracket') return fail('第 4 个字段必须是方括号包裹的时间戳');
  if (reqTok.type !== 'quote') return fail('第 5 个字段必须是双引号包裹的请求行');
  for (const [idx, tok] of [[2, identTok], [3, authTok], [6, statusTok], [7, bytesTok]] as const) {
    if (tok.type !== 'bare') return fail(`第 ${idx} 个字段不能包含引号或方括号`);
  }

  const host = hostTok.value;
  if (!host) return fail('主机（IP）字段为空');

  let time: { iso: string; epochMs: number };
  try {
    time = parseClfTime(timeTok.value);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  let request: { method: string | null; path: string | null; protocol: string | null };
  try {
    request = parseRequest(reqTok.value);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const status = Number(statusTok.value);
  if (!/^\d{3}$/.test(statusTok.value) || status < 100 || status > 599) {
    return fail(`状态码非法：${statusTok.value}`);
  }

  let bytes: number | null;
  if (bytesTok.value === '-') {
    bytes = null;
  } else {
    bytes = Number(bytesTok.value);
    if (!/^\d+$/.test(bytesTok.value)) {
      return fail(`字节数字段非法：${bytesTok.value}`);
    }
  }

  let referer: string | null = null;
  let userAgent: string | null = null;
  let format: LogFormat = 'common';
  if (tokens.length >= 9) {
    if (!refererTok || !uaTok) return fail('Combined 格式缺少 Referer 或 User-Agent 字段');
    if (refererTok.type !== 'quote') return fail('Referer 字段必须是双引号包裹的字符串');
    if (uaTok.type !== 'quote') return fail('User-Agent 字段必须是双引号包裹的字符串');
    referer = nullDash(refererTok.value);
    userAgent = nullDash(uaTok.value);
    format = 'combined';
  } else if (tokens.length === 8) {
    return fail('检测到第 8 个字段但缺少 User-Agent（Combined 需 Referer 与 UA 成对出现）');
  }

  let requestTime: number | null = null;
  if (tokens.length > 10) {
    return fail(`字段过多：最多支持 10 个字段，实际 ${tokens.length} 个`);
  }
  if (rtTok) {
    if (rtTok.type !== 'bare') return fail('响应时间字段必须是裸数值');
    requestTime = Number(rtTok.value);
    if (rtTok.value.trim() === '' || !Number.isFinite(requestTime) || requestTime < 0) {
      return fail(`响应时间字段非法：${rtTok.value}`);
    }
  }

  return {
    ok: true,
    lineNumber,
    entry: {
      lineNumber,
      host,
      ident: nullDash(identTok.value),
      authUser: nullDash(authTok.value),
      timeRaw: timeTok.value,
      timeIso: time.iso,
      epochMs: time.epochMs,
      method: request.method,
      path: request.path,
      protocol: request.protocol,
      status,
      bytes,
      referer,
      userAgent,
      requestTime,
      format,
    },
  };
}

/**
 * 解析整段日志文本：按行拆分，空行跳过并计入 blank。
 */
export function parseLog(text: string): LineResult[] {
  const results: LineResult[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined || line.trim() === '') continue;
    results.push(parseLine(line, i + 1));
  }
  return results;
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topN(map: Map<string, number>, limit: number): CountItem[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => (b.count - a.count || a.key.localeCompare(b.key)))
    .slice(0, limit);
}

/**
 * 对任意顺序的逐行解析结果做单次 O(n) 遍历聚合。
 * @param results parseLog / parseLine 的结果（可只传部分行）
 * @param blank 空行数（parseLog 不计入 results，由 UI 传入）
 */
export function summarize(results: LineResult[], blank = 0): LogSummary {
  const statusClasses: LogSummary['statusClasses'] = { '1xx': 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  const statusMap = new Map<string, number>();
  const ipMap = new Map<string, number>();
  const pathMap = new Map<string, number>();
  const uaMap = new Map<string, number>();

  let parsed = 0;
  let failed = 0;
  let totalBytes = 0;
  let nullBytes = 0;
  let startMs = Number.POSITIVE_INFINITY;
  let endMs = Number.NEGATIVE_INFINITY;
  let requestTimeSum = 0;
  let requestTimeCount = 0;

  for (const result of results) {
    if (!result.ok) {
      failed += 1;
      continue;
    }
    const e = result.entry;
    parsed += 1;
    statusClasses[`${Math.floor(e.status / 100)}xx` as keyof LogSummary['statusClasses']] += 1;
    bump(statusMap, String(e.status));
    bump(ipMap, e.host);
    if (e.path) bump(pathMap, e.path);
    if (e.userAgent) bump(uaMap, e.userAgent);
    if (e.bytes === null) {
      nullBytes += 1;
    } else {
      totalBytes += e.bytes;
    }
    if (e.epochMs < startMs) startMs = e.epochMs;
    if (e.epochMs > endMs) endMs = e.epochMs;
    if (e.requestTime !== null) {
      requestTimeSum += e.requestTime;
      requestTimeCount += 1;
    }
  }

  const realStart = parsed > 0 ? startMs : null;
  const realEnd = parsed > 0 ? endMs : null;
  const spanSec = realStart !== null && realEnd !== null ? (realEnd - realStart) / 1000 : 0;
  // 跨度为 0（所有时间戳相同）时按 1 秒窗口计 QPS
  const qps = parsed > 0 ? (spanSec > 0 ? parsed / spanSec : parsed) : 0;

  return {
    totalLines: parsed + failed + blank,
    parsed,
    failed,
    blank,
    successRate: parsed + failed > 0 ? parsed / (parsed + failed) : 0,
    statusClasses,
    statusCounts: topN(statusMap, 10),
    totalBytes,
    nullBytes,
    topIps: topN(ipMap, 5),
    topPaths: topN(pathMap, 5),
    topUserAgents: topN(uaMap, 5),
    startMs: realStart,
    endMs: realEnd,
    startIso: realStart !== null ? toIsoSecond(realStart) : null,
    endIso: realEnd !== null ? toIsoSecond(realEnd) : null,
    qps,
    avgRequestTimeMs: requestTimeCount > 0 ? (requestTimeSum / requestTimeCount) * 1000 : null,
  };
}
