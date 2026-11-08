/**
 * LRC 歌词时间戳的纯函数工具集：时间戳与毫秒互转、LRC 文本解析与序列化。
 * 全部逻辑不依赖 DOM，可在 Node / 浏览器环境直接单测。
 */

/** LRC ID 标签（ar/ti/al/by/offset 等）键值对 */
export interface LrcTag {
  /** 标签名，如 ti、ar、al、by、offset */
  key: string;
  /** 标签原始值（offset 保留字符串，由消费方解析） */
  value: string;
}

/** 一条结构化歌词条目 */
export interface LrcLine {
  /** 起始时间，单位毫秒 */
  timeMs: number;
  /** 歌词文本，空字符串表示纯伴奏行（如 [00:10.00]） */
  text: string;
}

/** LRC 解析结果 */
export interface LrcParseResult {
  /** 按首次出现顺序收集的 ID 标签 */
  tags: LrcTag[];
  /** 按时间升序排列的歌词条目（行内多时间戳已展开） */
  lines: LrcLine[];
  /** 解析过程中发现的问题，空数组表示无错误 */
  errors: string[];
}

/** 单个时间戳标签 [mm:ss.cc] 或 [mm:ss.ccc] / [hh:mm:ss.xx] */
const TIMESTAMP_PATTERN = /\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?]/g;

/** ID 标签行 [key:value]，key 为字母 */
const TAG_PATTERN = /^\[([a-zA-Z]+):(.*)]$/;

/**
 * 把毫秒格式化为 LRC 时间戳 [mm:ss.cc]（分:秒.百分秒）。
 *
 * @param timeMs - 非负毫秒数
 * @returns 形如 [01:23.45] 的时间戳
 */
export function formatTimestamp(timeMs: number): string {
  if (!Number.isFinite(timeMs) || timeMs < 0) {
    throw new Error(`时间戳必须是非负有限数值，收到：${timeMs}`);
  }
  const totalMs = Math.round(timeMs);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  // 先按百分秒四舍五入，再处理进位（如 1299ms -> 1.30 秒）
  const centiseconds = Math.round((totalMs % 1000) / 10);
  const carrySeconds = Math.floor(centiseconds / 100);
  const finalSeconds = seconds + carrySeconds;
  const finalMinutes = minutes + Math.floor(finalSeconds / 60);
  return `[${String(finalMinutes).padStart(2, '0')}:${String(finalSeconds % 60).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}]`;
}

/**
 * 解析单个 LRC 时间戳标签为毫秒。
 *
 * @param tag - 完整标签，如 [01:23.45]
 * @returns 对应的毫秒数
 */
export function parseTimestamp(tag: string): number {
  const match = /^\[(\d+):(\d{1,2})(?:[.:](\d{1,3}))?]$/.exec(tag.trim());
  if (!match) {
    throw new Error(`非法时间戳：${tag}`);
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds >= 60) {
    throw new Error(`时间戳秒数必须小于 60：${tag}`);
  }
  const fractionRaw = match[3] ?? '';
  // 百分秒两位、毫秒三位，按位数归一到毫秒
  const fractionMs =
    fractionRaw === ''
      ? 0
      : Number(fractionRaw.padEnd(3, '0').slice(0, 3));
  return minutes * 60000 + seconds * 1000 + fractionMs;
}

/**
 * 解析整段 LRC 文本：识别 ID 标签、展开行内多时间戳、收集格式错误。
 *
 * @param input - 原始 LRC 文本
 * @returns 标签、按时间排序的歌词条目与错误清单
 */
export function parseLrc(input: string): LrcParseResult {
  const tags: LrcTag[] = [];
  const lines: LrcLine[] = [];
  const errors: string[] = [];
  const rows = input.split(/\r\n|\r|\n/);

  rows.forEach((rawRow, rowIndex) => {
    const row = rawRow.trim();
    if (row === '') {
      return;
    }
    const timestamps = [...row.matchAll(TIMESTAMP_PATTERN)].map((item) => item[0]);

    if (timestamps.length === 0) {
      const tagMatch = TAG_PATTERN.exec(row);
      if (tagMatch) {
        tags.push({ key: tagMatch[1].toLowerCase(), value: tagMatch[2].trim() });
        return;
      }
      errors.push(`第 ${rowIndex + 1} 行无法识别：${rawRow}`);
      return;
    }

    const text = row.replace(TIMESTAMP_PATTERN, '').trim();
    timestamps.forEach((tag) => {
      try {
        lines.push({ timeMs: parseTimestamp(tag), text });
      } catch (error) {
        errors.push(`第 ${rowIndex + 1} 行${error instanceof Error ? error.message : String(error)}`);
      }
    });
  });

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return { tags, lines, errors };
}

/** LRC 序列化选项 */
export interface LrcSerializeOptions {
  /** ID 标签集合，按数组顺序输出 */
  tags?: LrcTag[];
  /** 全局偏移（毫秒），正值提前、负值延后，输出为 offset 标签（百分秒） */
  offsetMs?: number;
}

/**
 * 把结构化歌词条目序列化为标准 LRC 文本。
 *
 * @param lines - 歌词条目，输出前按时间升序排序
 * @param options - 标签与偏移选项
 * @returns LRC 文本，使用 CRLF 行尾
 */
export function serializeLrc(lines: LrcLine[], options: LrcSerializeOptions = {}): string {
  const output: string[] = [];
  const tags = [...(options.tags ?? [])];

  if (typeof options.offsetMs === 'number' && options.offsetMs !== 0) {
    // LRC offset 单位为百分秒（1/100 秒）
    const offsetCentis = Math.round(options.offsetMs / 10);
    tags.push({ key: 'offset', value: String(offsetCentis) });
  }

  tags.forEach((tag) => {
    output.push(`[${tag.key}:${tag.value}]`);
  });

  const sorted = [...lines].sort((a, b) => a.timeMs - b.timeMs);
  sorted.forEach((line) => {
    output.push(`${formatTimestamp(line.timeMs)}${line.text}`);
  });

  return output.join('\r\n');
}

/**
 * 把「时间戳 + 文本」逐行格式（每行 mm:ss.cc 文本）解析为结构化条目，
 * 用于生成模式下的快速录入；空行跳过，非法行抛出带行号的错误。
 *
 * @param input - 每行形如 `01:23.45 歌词` 的文本
 * @returns 结构化歌词条目
 */
export function parseTimestampedLyrics(input: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const rows = input.split(/\r\n|\r|\n/);
  rows.forEach((rawRow, rowIndex) => {
    const row = rawRow.trim();
    if (row === '') {
      return;
    }
    const match = /^(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\s+(.*)$/.exec(row);
    if (!match) {
      throw new Error(`第 ${rowIndex + 1} 行格式错误，应为 mm:ss.cc 歌词：${rawRow}`);
    }
    const seconds = Number(match[2]);
    if (seconds >= 60) {
      throw new Error(`第 ${rowIndex + 1} 行秒数必须小于 60：${rawRow}`);
    }
    const fractionRaw = match[3] ?? '';
    const fractionMs =
      fractionRaw === '' ? 0 : Number(fractionRaw.padEnd(3, '0').slice(0, 3));
    lines.push({
      timeMs: Number(match[1]) * 60000 + seconds * 1000 + fractionMs,
      text: match[4].trim(),
    });
  });
  return lines;
}
