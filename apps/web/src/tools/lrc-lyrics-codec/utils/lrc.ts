/**
 * LRC 歌词解析与序列化纯函数（零依赖）
 *
 * 支持：
 * - ID 标签 [ar:歌手] [ti:标题] [al:专辑] [offset:+250] 等
 * - 时间标签 [mm:ss.xx] / [mm:ss.xxx]，一行多标签展开为多行
 * - 整体时间平移、乱序 / 非法标签校验
 * 解析不抛异常，格式问题进入 issues 列表。
 */

export interface LrcLine {
  /** 时间点（秒） */
  time: number;
  text: string;
}

export interface LrcIssue {
  /** 1 起始的行号 */
  line: number;
  level: 'error' | 'warning';
  message: string;
}

export interface LrcParseResult {
  meta: Record<string, string>;
  lines: LrcLine[];
  /** 没有任何时间标签的纯文本行 */
  plain: string[];
  issues: LrcIssue[];
}

const TIME_TAG_REGEX = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const META_TAG_REGEX = /^\[([a-zA-Z]+):(.*)]$/;

/** 剥离 UTF-8 BOM 并归一化换行 */
export function normalizeLrcText(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

export function parseLrc(text: string): LrcParseResult {
  const normalized = normalizeLrcText(text);
  const meta: Record<string, string> = {};
  const lines: LrcLine[] = [];
  const plain: string[] = [];
  const issues: LrcIssue[] = [];

  const rawLines = normalized.split('\n');
  rawLines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      return;
    }

    // 时间标签行：收集行首全部 [mm:ss.xx]
    const timeMatches = [...trimmed.matchAll(TIME_TAG_REGEX)];
    if (timeMatches.length > 0) {
      // 截取最后一个时间标签之后的内容作为歌词文本
      const lastMatch = timeMatches[timeMatches.length - 1]!;
      const lastIndex = (lastMatch.index ?? 0) + lastMatch[0].length;
      const lyricText = trimmed.slice(lastIndex).trim();

      for (const match of timeMatches) {
        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const fractionRaw = match[3];
        if (minutes > 99 || seconds >= 60) {
          issues.push({
            line,
            level: 'error',
            message: `第 ${line} 行时间标签「${match[0]}」分钟或秒数越界`,
          });
          continue;
        }
        let fraction = 0;
        if (fractionRaw !== undefined) {
          // 两位按百分秒、三位按毫秒处理
          fraction =
            fractionRaw.length === 2
              ? Number(fractionRaw) / 100
              : Number(fractionRaw) / 1000;
        }
        lines.push({ time: minutes * 60 + seconds + fraction, text: lyricText });
      }
      return;
    }

    // ID 元数据标签
    const metaMatch = trimmed.match(META_TAG_REGEX);
    if (metaMatch) {
      const key = metaMatch[1]!.toLowerCase();
      meta[key] = metaMatch[2]!.trim();
      return;
    }

    // 形如 [xx:yy] 但未被时间正则接受的非法标签
    if (trimmed.startsWith('[') && trimmed.includes(']')) {
      issues.push({
        line,
        level: 'error',
        message: `第 ${line} 行包含无法识别的标签「${trimmed.slice(0, trimmed.indexOf(']') + 1)}」`,
      });
      return;
    }

    plain.push(trimmed);
  });

  // 乱序检测（按文档出现顺序，不改变 lines 原顺序）
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]!.time < lines[i - 1]!.time) {
      issues.push({
        line: 0,
        level: 'warning',
        message: `时间标签在第 ${i + 1} 个歌词点处出现乱序（${lines[i - 1]!.time}s → ${lines[i]!.time}s）`,
      });
      break;
    }
  }

  if (lines.length === 0) {
    issues.push({
      line: 0,
      level: 'warning',
      message: '未解析到任何带时间标签的歌词行',
    });
  }

  return { meta, lines, plain, issues };
}

/** 秒数格式化为 [mm:ss.xx]，负时间钳位为 0，59.999 正确进位 */
export function formatTimeTag(timeSeconds: number): string {
  const clamped = Math.max(0, timeSeconds);
  const totalCentiseconds = Math.round(clamped * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const xx = String(centiseconds).padStart(2, '0');
  return `[${mm}:${ss}.${xx}]`;
}

export interface StringifyOptions {
  /** 是否按时间升序输出，默认 true */
  sort?: boolean;
}

/** 把结构化结果序列化为 LRC 文本（LF，两位百分秒） */
export function stringifyLrc(parsed: LrcParseResult, options: StringifyOptions = {}): string {
  const { sort = true } = options;
  const out: string[] = [];

  for (const [key, value] of Object.entries(parsed.meta)) {
    out.push(`[${key}:${value}]`);
  }

  const ordered = sort
    ? [...parsed.lines].sort((a, b) => a.time - b.time)
    : parsed.lines;
  for (const line of ordered) {
    out.push(`${formatTimeTag(line.time)}${line.text}`);
  }
  for (const text of parsed.plain) {
    out.push(text);
  }
  return out.join('\n');
}

/** 整体平移时间（毫秒），负平移钳位到 0 并通过返回值告知发生钳位的行数 */
export function shiftOffset(
  parsed: LrcParseResult,
  deltaMs: number,
): { result: LrcParseResult; clampedCount: number } {
  const deltaSeconds = deltaMs / 1000;
  let clampedCount = 0;
  const lines = parsed.lines.map((line) => {
    const next = line.time + deltaSeconds;
    if (next < 0) {
      clampedCount += 1;
      return { ...line, time: 0 };
    }
    return { ...line, time: next };
  });
  return { result: { ...parsed, lines }, clampedCount };
}

export function validateLrc(text: string): LrcIssue[] {
  return parseLrc(text).issues;
}
