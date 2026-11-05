/**
 * SSE（Server-Sent Events，text/event-stream）线格式编解码零依赖纯函数。
 *
 * 规则依据 HTML Living Standard §9.2 Server-sent events：
 * - 一行 = 以 \r\n、\r 或 \n 结尾的字符序列；文件末尾可无终止换行
 * - 空行派发一条消息并重置事件缓冲区；以「:」开头的行为注释（心跳），忽略
 * - 字段行格式 field:value，冒号后若紧跟一个空格，解析时去掉且只去掉一个
 * - 未知字段忽略；同名 data 行的值以 \n 拼接；event/id 覆盖；retry 仅接受十进制整数
 *
 * 编码侧输出统一使用 \n 换行，多行 data 拆为多个 data: 行，消息之间以空行分隔。
 */

/** 结构化 SSE 消息 */
export interface SseMessage {
  /** 事件数据；多行文本在编码时拆为多个 data: 行 */
  data?: string;
  /** 事件类型（event 字段） */
  event?: string;
  /** 最后一个事件 ID 字符串（lastEventId） */
  id?: string;
  /** 重连等待毫秒数，必须为非负整数 */
  retry?: number;
}

export interface SseComment {
  /** 注释（心跳）文本，不含行首冒号 */
  comment: string;
}

/** 解码产出的流条目：消息或注释 */
export type SseStreamEntry =
  | ({ kind: 'message'; index: number; line: number } & SseMessage)
  | ({ kind: 'comment'; index: number; line: number } & SseComment);

export interface SseDecodeResult {
  /** 按出现顺序排列的消息与注释条目 */
  entries: SseStreamEntry[];
  /** 仅消息条目（便捷视图） */
  messages: SseMessage[];
  /** 解析告警：retry 非法等规范要求忽略但值得提示的情况 */
  warnings: Array<{ line: number; message: string }>;
}

/** 按 §9.2 把流切成行，同时保留每行行号（从 1 开始） */
function splitLines(stream: string): Array<{ text: string; line: number }> {
  const lines: Array<{ text: string; line: number }> = [];
  let lineStart = 0;
  let lineNumber = 1;
  for (let i = 0; i < stream.length; i += 1) {
    const char = stream.charAt(i);
    if (char === '\r') {
      lines.push({ text: stream.substring(lineStart, i), line: lineNumber });
      // \r\n 视为一个行分隔
      if (stream.charAt(i + 1) === '\n') i += 1;
      lineStart = i + 1;
      lineNumber += 1;
    } else if (char === '\n') {
      lines.push({ text: stream.substring(lineStart, i), line: lineNumber });
      lineStart = i + 1;
      lineNumber += 1;
    }
  }
  if (lineStart < stream.length) {
    lines.push({ text: stream.substring(lineStart), line: lineNumber });
  }
  return lines;
}

/** 把任意换行（\r\n / \r / \n）规范化为 \n */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/**
 * 解析 SSE 流文本为结构化条目。
 *
 * 严格遵循标准派发算法：空行触发派发，注释与未知字段忽略，
 * 非法 retry 记入 warnings 且不更新重连时间；id 中的换行属于编码侧约束，
 * 线格式里字段值天然不能跨行，因此解码到的 id 不会包含换行。
 */
export function decodeSseStream(stream: string): SseDecodeResult {
  const entries: SseStreamEntry[] = [];
  const messages: SseMessage[] = [];
  const warnings: SseDecodeResult['warnings'] = [];

  // 事件缓冲区（对应规范的 data buffer、event type buffer、last event id 等）
  let dataBuffer: string[] = [];
  let eventType = '';
  let lastEventId = '';
  let retry: number | undefined;
  // 自上次派发以来是否写入过任何字段；lastEventId/retry 是持久态，不能用于守卫
  let dirty = false;
  let messageIndex = 0;
  let commentIndex = 0;

  const dispatch = (line: number) => {
    if (!dirty) {
      // 连续空行或流首空行：没有任何字段，不产生消息
      return;
    }
    const message: SseMessage = {};
    if (dataBuffer.length > 0) message.data = dataBuffer.join('\n');
    if (eventType !== '') message.event = eventType;
    if (lastEventId !== '') message.id = lastEventId;
    if (retry !== undefined) message.retry = retry;
    messages.push(message);
    entries.push({ kind: 'message', index: messageIndex, line, ...message });
    messageIndex += 1;
    // 派发后重置 data 与 event；lastEventId 与 retry 是持久状态，标准下不随派发重置
    dataBuffer = [];
    eventType = '';
    dirty = false;
  };

  const lines = splitLines(stream.replace(/^\uFEFF/, ''));
  for (const { text, line } of lines) {
    if (text === '') {
      dispatch(line);
      continue;
    }
    if (text.charAt(0) === ':') {
      const comment = text.length > 1 ? text.substring(1) : '';
      entries.push({ kind: 'comment', index: commentIndex, line, comment });
      commentIndex += 1;
      continue;
    }

    const colonIndex = text.indexOf(':');
    let field: string;
    let rawValue: string;
    if (colonIndex === -1) {
      field = text;
      rawValue = '';
    } else {
      field = text.substring(0, colonIndex);
      rawValue = text.substring(colonIndex + 1);
    }
    // 冒号后紧跟的单个空格移除
    const value = rawValue.charAt(0) === ' ' ? rawValue.substring(1) : rawValue;

    switch (field) {
      case 'event':
        eventType = value;
        dirty = true;
        break;
      case 'data':
        dataBuffer.push(value);
        dirty = true;
        break;
      case 'id':
        if (value.includes('\n') || value.includes('\r')) {
          warnings.push({ line, message: `第 ${line} 行 id 字段不能包含换行，已按规范忽略` });
        } else {
          lastEventId = value;
          dirty = true;
        }
        break;
      case 'retry': {
        if (/^[0-9]+$/.test(value)) {
          retry = Number(value);
          dirty = true;
        } else {
          warnings.push({
            line,
            message: `第 ${line} 行 retry「${value}」不是十进制整数，已按规范忽略`,
          });
        }
        break;
      }
      default:
        // 未知字段：标准要求忽略
        break;
    }
  }

  // 流末尾没有终止空行时，仍按规范派发未完成的最后一个事件块
  dispatch(lines.length > 0 ? (lines[lines.length - 1]?.line ?? 1) : 1);

  return { entries, messages, warnings };
}

export interface EncodeOptions {
  /** 是否在每条消息之间输出空行分隔（默认 true） */
  separator?: boolean;
}

/**
 * 把单条结构化消息编码为 SSE 线格式文本（不含尾随空行）。
 *
 * @throws retry 不是非负整数、字段值含非法换行形态之外的非法内容时抛错
 */
export function encodeSseMessage(message: SseMessage): string {
  const lines: string[] = [];

  if (message.retry !== undefined) {
    if (!Number.isInteger(message.retry) || message.retry < 0) {
      throw new Error(`retry 必须是非负十进制整数，收到：${String(message.retry)}`);
    }
    lines.push(`retry: ${message.retry}`);
  }
  if (message.event !== undefined) {
    const event = normalizeNewlines(message.event);
    if (event.includes('\n')) {
      throw new Error('event 事件名不能包含换行');
    }
    lines.push(`event: ${event}`);
  }
  if (message.id !== undefined) {
    const id = normalizeNewlines(message.id);
    if (id.includes('\n')) {
      throw new Error('id 不能包含换行（SSE 字段值不允许跨行）');
    }
    lines.push(`id: ${id}`);
  }
  if (message.data !== undefined) {
    const data = normalizeNewlines(message.data);
    // 末尾单个换行会产生一个空 data 行，符合标准（data: 后空值）
    for (const piece of data.split('\n')) {
      lines.push(`data: ${piece}`);
    }
  }

  if (lines.length === 0) {
    throw new Error('消息至少需要 data / event / id / retry 中的一个字段');
  }
  return lines.join('\n');
}

/** 批量编码消息列表，消息之间以空行分隔，并以结尾空行派发最后一条 */
export function encodeSseStream(messages: SseMessage[], options: EncodeOptions = {}): string {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('至少需要一条消息');
  }
  const separator = options.separator ?? true;
  const blocks = messages.map((message) => encodeSseMessage(message));
  // 标准以空行派发：块之间空行，结尾补一个空行保证最后一条消息被派发
  return separator ? `${blocks.join('\n\n')}\n\n` : blocks.join('\n');
}

/** 生成注释（心跳）行，如 :ping */
export function encodeComment(comment: string): string {
  const normalized = normalizeNewlines(comment);
  if (normalized.includes('\n')) {
    throw new Error('注释不能包含换行');
  }
  return `:${normalized}`;
}
