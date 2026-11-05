/**
 * Server-Sent Events（text/event-stream）线格式编解码纯函数，
 * 实现 HTML 标准 §9.2「Interpreting an event stream」的行解析与派发规则，
 * 不依赖 DOM 与 React，可在 Node 与浏览器环境运行。
 */

/**
 * 待编码的结构化 SSE 消息，字段均为可选（data 通常应提供）。
 */
export interface SseMessage {
  /** 消息数据；含换行时拆分为多个 data: 行 */
  data?: string;
  /** 事件类型，对应 event: 行 */
  event?: string;
  /** 最后事件 ID，对应 id: 行 */
  id?: string;
  /** 重连等待毫秒数，对应 retry: 行，必须是非负十进制整数 */
  retry?: number;
  /** 可选注释/心跳内容，序列化为以冒号开头的行；多行逐行加冒号 */
  comment?: string;
}

/**
 * 编码成功结果。
 */
export interface EncodeSuccess {
  /** 固定为 true，表示校验通过 */
  ok: true;
  /** text/event-stream 线格式文本 */
  output: string;
}

/**
 * 编码失败结果。
 */
export interface EncodeFailure {
  /** 固定为 false，表示存在校验错误 */
  ok: false;
  /** 全部校验错误信息，按消息顺序排列 */
  errors: string[];
}

/** 编码函数的联合返回类型 */
export type EncodeResult = EncodeSuccess | EncodeFailure;

/**
 * 解码得到的一条已派发事件（缓冲中至少出现过一个 data 行才会派发）。
 */
export interface DecodedEvent {
  /** 事件类型；缓冲未出现 event 行时为 null */
  event: string | null;
  /** 最后事件 ID；缓冲未出现 id 行时为 null */
  id: string | null;
  /** 重连等待毫秒数；缓冲未出现合法 retry 行时为 null */
  retry: number | null;
  /** 多个 data 行的值以 \n 拼接后的负载 */
  data: string;
}

/**
 * 解码过程中的非致命警告（可定位到具体行号）。
 */
export interface DecodeWarning {
  /** 触发警告的行号（从 1 开始） */
  line: number;
  /** 警告说明 */
  message: string;
}

/**
 * decodeSse 的完整返回结果。
 */
export interface DecodeResult {
  /** 成功派发的事件数组，按流中出现顺序排列 */
  events: DecodedEvent[];
  /** 非致命警告（如 retry 值非法被忽略），按出现顺序排列 */
  warnings: DecodeWarning[];
  /** 因缺少 data 行而未派发的缓冲事件数量（与浏览器 EventSource 行为一致） */
  skipped: number;
}

/** 非负十进制整数（不含符号、小数点、指数写法） */
const NON_NEGATIVE_INTEGER = /^\d+$/;

/**
 * 规范化换行：将 \r\n 与单独的 \r 统一转换为 \n。
 *
 * @param text - 原始文本
 * @returns 换行统一为 \n 的文本
 */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/**
 * 校验 retry 是否为非负十进制整数。
 *
 * @param value - 待校验数值
 * @returns 合法返回 true，否则 false
 */
function isValidRetry(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * 将结构化消息数组编码为 SSE 线格式文本。
 *
 * 字段输出顺序固定为 comment、id、event、retry、data；多行 data 按 \n
 * 拆分为多个 `data:` 行；每条消息后输出一个空行分隔。retry 必须是非负
 * 十进制整数，id / event / comment 不允许包含换行，否则整体校验失败。
 *
 * @param messages - 结构化消息数组
 * @returns 校验通过返回 `{ ok: true, output }`，否则返回 `{ ok: false, errors }`
 */
export function encodeSse(messages: SseMessage[]): EncodeResult {
  const errors: string[] = [];
  const blocks: string[] = [];

  messages.forEach((message, index) => {
    const label = `第 ${index + 1} 条消息`;

    if (message.retry !== undefined && !isValidRetry(message.retry)) {
      errors.push(`${label}：retry 必须是非负十进制整数，实际为 ${String(message.retry)}`);
    }
    if (message.id !== undefined && /[\r\n]/.test(message.id)) {
      errors.push(`${label}：id 不能包含换行符`);
    }
    if (message.event !== undefined && /[\r\n]/.test(message.event)) {
      errors.push(`${label}：event 不能包含换行符`);
    }
    if (message.comment !== undefined && /[\r\n]/.test(message.comment)) {
      errors.push(`${label}：comment 不能包含换行符`);
    }

    if (errors.length > 0) {
      return;
    }

    const lines: string[] = [];
    if (message.comment !== undefined && message.comment !== '') {
      lines.push(`: ${message.comment}`);
    }
    if (message.id !== undefined) {
      lines.push(`id: ${message.id}`);
    }
    if (message.event !== undefined) {
      lines.push(`event: ${message.event}`);
    }
    if (message.retry !== undefined) {
      lines.push(`retry: ${String(message.retry)}`);
    }
    if (message.data !== undefined) {
      for (const piece of normalizeNewlines(message.data).split('\n')) {
        lines.push(`data: ${piece}`);
      }
    }
    blocks.push(lines.join('\n'));
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (blocks.length === 0) {
    return { ok: true, output: '' };
  }

  return { ok: true, output: `${blocks.join('\n\n')}\n\n` };
}

/**
 * 将原始 SSE 流文本解码为结构化事件数组。
 *
 * 严格按 HTML 标准行解析：先统一 \r\n / \r 换行；空行派发当前缓冲并重置；
 * 以冒号开头的行视为注释忽略；行内首个冒号前为字段名、其后为值（若值的
 * 首字符是空格则去掉一个）；无冒号的行字段值为空串；未知字段忽略；多个
 * data 行以 \n 拼接；event / id / retry 记录到缓冲，retry 非数字时忽略并
 * 记录警告；只有出现过 data 行的缓冲才会派发，无 data 的缓冲计入 skipped。
 *
 * @param text - 原始 text/event-stream 文本
 * @returns 事件数组、警告与跳过计数
 */
export function decodeSse(text: string): DecodeResult {
  const events: DecodedEvent[] = [];
  const warnings: DecodeWarning[] = [];
  let skipped = 0;

  let data = '';
  let hasData = false;
  let event: string | null = null;
  let id: string | null = null;
  let retry: number | null = null;
  let hasOtherField = false;

  /** 派发当前缓冲并重置全部缓冲状态 */
  const dispatch = (): void => {
    if (hasData) {
      events.push({
        event,
        id,
        retry,
        data: data.endsWith('\n') ? data.slice(0, -1) : data,
      });
    } else if (hasOtherField) {
      skipped += 1;
    }
    data = '';
    hasData = false;
    event = null;
    id = null;
    retry = null;
    hasOtherField = false;
  };

  const lines = normalizeNewlines(text).split('\n');

  lines.forEach((rawLine, lineIndex) => {
    const lineNumber = lineIndex + 1;

    if (rawLine === '') {
      dispatch();
      return;
    }
    if (rawLine.startsWith(':')) {
      return;
    }

    const colonIndex = rawLine.indexOf(':');
    let field: string;
    let value: string;
    if (colonIndex === -1) {
      field = rawLine;
      value = '';
    } else {
      field = rawLine.slice(0, colonIndex);
      value = rawLine.slice(colonIndex + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
    }

    switch (field) {
      case 'data':
        data += `${value}\n`;
        hasData = true;
        break;
      case 'event':
        event = value;
        hasOtherField = true;
        break;
      case 'id':
        id = value;
        hasOtherField = true;
        break;
      case 'retry': {
        if (NON_NEGATIVE_INTEGER.test(value)) {
          retry = Number(value);
        } else {
          warnings.push({
            line: lineNumber,
            message: `retry 值「${value}」不是非负十进制整数，已按规范忽略`,
          });
        }
        hasOtherField = true;
        break;
      }
      default:
        break;
    }
  });

  return { events, warnings, skipped };
}
