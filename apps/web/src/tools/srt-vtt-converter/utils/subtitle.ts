/**
 * SRT ⇄ WebVTT 字幕格式双向转换（零依赖纯函数）
 *
 * 规则要点：
 * - SRT：可选数字序号行 + 时间戳 `HH:MM:SS,mmm --> HH:MM:SS,mmm` + 一行或多行正文；
 * - VTT：首行必须以 WEBVTT 开头，时间戳用点号，允许省略小时 `MM:SS.mmm`，
 *   时间戳后可带 positioning 设置（如 `align:start position:0%`），
 *   并允许 NOTE/REGION/STYLE 块；
 * - shiftMs 可对每条 cue 的起止时间整体偏移，结果出现负时间戳即报错。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type SubtitleMode = 'srt2vtt' | 'vtt2srt';

export interface ConvertResult {
  /** 转换后的字幕文本 */
  output: string;
  /** 非致命问题（被忽略的块等） */
  warnings: string[];
  /** 成功解析的 cue 数量 */
  cueCount: number;
  valid: boolean;
  error: string | null;
}

/** 解析阶段的中间 cue 结构 */
interface RawCue {
  startMs: number;
  endMs: number;
  /** VTT 时间戳后的 positioning 设置（SRT 输出时剥离） */
  settings: string;
  /** cue 序号行（SRT 中可选，VTT 中为 cue id） */
  identifier: string;
  /** 正文（一行或多行，已去除每行尾随空白） */
  lines: string[];
}

/** 时/分/秒/毫秒 → 总毫秒数 */
function toMs(hours: number, minutes: number, seconds: number, ms: number): number {
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + ms;
}

/** 总毫秒数 → HH:MM:SS 形式时间戳，sep 为毫秒分隔符（',' 或 '.'），毫秒恒为三位 */
function formatTimestamp(totalMs: number, sep: ',' | '.'): string {
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${sep}${String(ms).padStart(3, '0')}`;
}

/**
 * 解析单个时间戳，兼容 `HH:MM:SS.mmm` 与 `MM:SS.mmm`，分隔符为点或逗号。
 * 数字越界（小时 ≥100、分/秒 ≥60、毫秒非三位）返回错误描述。
 */
function parseTimestamp(token: string): { ms: number } | { error: string } {
  const longMatch = /^(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})$/.exec(token.trim());
  if (longMatch) {
    const hours = Number(longMatch[1]);
    const minutes = Number(longMatch[2]);
    const seconds = Number(longMatch[3]);
    const ms = Number(longMatch[4]);
    if (hours >= 100) return { error: `时间戳「${token}」小时必须小于 100` };
    if (minutes >= 60) return { error: `时间戳「${token}」分钟必须小于 60` };
    if (seconds >= 60) return { error: `时间戳「${token}」秒必须小于 60` };
    return { ms: toMs(hours, minutes, seconds, ms) };
  }

  const shortMatch = /^(\d{2}):(\d{2})[.,](\d{3})$/.exec(token.trim());
  if (shortMatch) {
    const minutes = Number(shortMatch[1]);
    const seconds = Number(shortMatch[2]);
    const ms = Number(shortMatch[3]);
    if (minutes >= 60) return { error: `时间戳「${token}」分钟必须小于 60` };
    if (seconds >= 60) return { error: `时间戳「${token}」秒必须小于 60` };
    return { ms: toMs(0, minutes, seconds, ms) };
  }

  return { error: `时间戳「${token}」格式非法（应为 HH:MM:SS.mmm 或 MM:SS.mmm）` };
}

/** 识别时间戳行，返回起止毫秒与右侧设置；非时间戳行或时间戳非法时返回 null/错误 */
function parseTimingLine(
  line: string,
): { startMs: number; endMs: number; settings: string } | { error: string } | null {
  const arrowIndex = line.indexOf('-->');
  if (arrowIndex < 0) return null;

  const left = line.slice(0, arrowIndex).trim();
  const rightRaw = line.slice(arrowIndex + 3).trim();
  if (left === '' || rightRaw === '') {
    return { error: `时间戳行「${line}」缺少起止时间` };
  }
  // 右侧第一个空白之前是结束时间，其余为 positioning 设置
  const spaceIndex = rightRaw.search(/\s/);
  const endToken = spaceIndex >= 0 ? rightRaw.slice(0, spaceIndex) : rightRaw;
  const settings = spaceIndex >= 0 ? rightRaw.slice(spaceIndex + 1).trim() : '';

  const start = parseTimestamp(left);
  if ('error' in start) return { error: start.error };
  const end = parseTimestamp(endToken);
  if ('error' in end) return { error: end.error };
  return { startMs: start.ms, endMs: end.ms, settings };
}

/** 判断行是否由纯数字构成（SRT 序号行） */
function isSequenceLine(line: string): boolean {
  return /^\d+$/.test(line.trim());
}

/** NOTE/REGION/STYLE 块的首行判定（仅 VTT 头部与 cue 之间出现） */
function isHeaderBlockStart(line: string): boolean {
  return /^(NOTE|REGION|STYLE)(\s|$)/.test(line);
}

/** 按空行切块，返回每个块的起始行号（1 起，基于原始行）与行内容 */
function splitBlocks(lines: string[]): Array<{ startLine: number; rows: string[] }> {
  const blocks: Array<{ startLine: number; rows: string[] }> = [];
  let rows: string[] = [];
  let startLine = 1;
  lines.forEach((line, index) => {
    if (line.trim() === '') {
      if (rows.length > 0) {
        blocks.push({ startLine, rows });
        rows = [];
      }
    } else {
      if (rows.length === 0) startLine = index + 1;
      rows.push(line);
    }
  });
  if (rows.length > 0) blocks.push({ startLine, rows });
  return blocks;
}

/**
 * 解析 VTT 的 cue 块：剥离 WEBVTT 头块与 NOTE/REGION/STYLE 块，
 * 返回剩余块（splitBlocks 的行号基于原始行，可直接沿用）。
 */
function selectVttCueBlocks(
  blocks: Array<{ startLine: number; rows: string[] }>,
): Array<{ startLine: number; rows: string[] }> {
  return blocks.filter((block, index) => {
    if (index === 0 && /^WEBVTT/.test(block.rows[0]!.trim())) return false;
    if (isHeaderBlockStart(block.rows[0]!)) return false;
    return true;
  });
}

/** 从 cue 块中解析出 RawCue；找不到时间戳行返回 null */
function parseCueBlock(
  rows: string[],
  startLine: number,
  mode: SubtitleMode,
  warnings: string[],
): RawCue | { error: string } | null {
  let timingIndex = -1;
  let timing: { startMs: number; endMs: number; settings: string } | null = null;
  for (let index = 0; index < rows.length; index += 1) {
    const parsed = parseTimingLine(rows[index]!);
    if (parsed === null) continue;
    if ('error' in parsed) {
      return { error: `第 ${startLine + index} 行：${parsed.error}` };
    }
    timingIndex = index;
    timing = parsed;
    break;
  }
  if (timingIndex < 0 || timing === null) return null;

  const before = rows.slice(0, timingIndex);
  // SRT 时间戳之前仅允许单个数字序号行；VTT 之前视为 cue id（非数字也保留，转 SRT 时丢弃）
  let identifier = '';
  if (before.length > 0) {
    if (mode === 'srt2vtt' && before.length === 1 && isSequenceLine(before[0]!)) {
      identifier = before[0]!.trim();
    } else if (mode === 'vtt2srt') {
      identifier = before[before.length - 1]!.trim();
      if (before.length > 1) {
        warnings.push(`第 ${startLine} 行附近：cue 前存在 ${before.length} 行非正文内容，已忽略`);
      }
    } else {
      warnings.push(`第 ${startLine} 行附近：时间戳前存在无法识别的内容，已忽略`);
    }
  }

  const textLines = rows.slice(timingIndex + 1);
  return {
    startMs: timing.startMs,
    endMs: timing.endMs,
    settings: timing.settings,
    identifier,
    lines: textLines,
  };
}

/** 组装输出：srt2vtt 保留序号（若有），vtt2srt 从 1 连续编号并剥离设置 */
function renderCues(cues: RawCue[], mode: SubtitleMode): string {
  const sep = mode === 'srt2vtt' ? '.' : ',';
  const blocks = cues.map((cue, index) => {
    const timing = `${formatTimestamp(cue.startMs, sep)} --> ${formatTimestamp(cue.endMs, sep)}${
      mode === 'srt2vtt' && cue.settings !== '' ? ` ${cue.settings}` : ''
    }`;
    const head: string[] = mode === 'vtt2srt' ? [String(index + 1)] : [];
    if (mode === 'srt2vtt' && cue.identifier !== '') head.push(cue.identifier);
    return [...head, timing, ...cue.lines].join('\n');
  });
  return blocks.join('\n\n');
}

/** 转换入口：解析、时间偏移、格式渲染统一在此完成 */
export function convertSubtitle(
  input: string,
  mode: SubtitleMode,
  options?: { shiftMs?: number },
): ConvertResult {
  const shiftMs = options?.shiftMs ?? 0;
  const warnings: string[] = [];

  const failure = (error: string, extraWarnings: string[] = []): ConvertResult => ({
    output: '',
    warnings: extraWarnings,
    cueCount: 0,
    valid: false,
    error,
  });

  if (input.trim() === '') {
    return failure('输入内容不能为空');
  }

  // 去掉开头的 UTF-8 BOM，统一换行符，去除每行尾随空白
  const normalized = input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '');
  if (normalized.trim() === '') {
    return failure('输入内容不能为空');
  }
  const lines = normalized.split('\n');

  if (mode === 'vtt2srt' && !/^WEBVTT/.test(lines[0]!.trim())) {
    return failure('不是合法的 WebVTT 文件：首行必须以 WEBVTT 开头');
  }

  const allBlocks = splitBlocks(lines);
  const parseBlocks =
    mode === 'vtt2srt' ? selectVttCueBlocks(allBlocks) : allBlocks;

  const cues: RawCue[] = [];
  for (const block of parseBlocks) {
    const parsed = parseCueBlock(block.rows, block.startLine, mode, warnings);
    if (parsed === null) {
      warnings.push(`第 ${block.startLine} 行附近：未找到时间戳行，已忽略该块`);
      continue;
    }
    if ('error' in parsed) {
      return failure(parsed.error, warnings);
    }
    cues.push(parsed);
  }

  if (cues.length === 0) {
    return failure('未找到任何合法的字幕条目（缺少时间戳行）', warnings);
  }

  // 时间偏移；出现负时间戳即按 cue 序号报错
  const shiftedCues: RawCue[] = [];
  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index]!;
    const startMs = cue.startMs + shiftMs;
    const endMs = cue.endMs + shiftMs;
    if (startMs < 0 || endMs < 0) {
      return failure(
        `第 ${index + 1} 个字幕条目偏移 ${shiftMs}ms 后出现负时间戳，请减小负向偏移量`,
        warnings,
      );
    }
    shiftedCues.push({ ...cue, startMs, endMs });
  }

  const body = renderCues(shiftedCues, mode);
  const output = mode === 'srt2vtt' ? `WEBVTT\n\n${body}` : body;

  return { output, warnings, cueCount: shiftedCues.length, valid: true, error: null };
}
