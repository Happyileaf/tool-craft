export type SseToolMode = 'decode' | 'encode';

export interface ModeOption {
  value: SseToolMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'decode',
    label: 'SSE 流 → 结构化消息',
    hint: '解析 text/event-stream：拆分事件、多行 data、注释心跳与 retry',
  },
  {
    value: 'encode',
    label: '结构化消息 → SSE 流',
    hint: '把消息列表编码为符合 HTML §9.2 的线格式文本',
  },
];

export const DEFAULT_DECODE_INPUT = `: 心跳注释
event: update
id: 42
retry: 5000
data: {"price": 12.5, "symbol": "ACME"}

data: 第一行
data: 第二行

event: done
data: goodbye`;

export const DEFAULT_ENCODE_MESSAGES = [
  { event: 'open', id: '1', data: '{"status":"ready"}' },
  { data: '多行数据\n第二行内容', retry: 3000 },
  { event: 'done', data: 'bye' },
];

/** 字段展示的中文标签与顺序 */
export const FIELD_LABELS: Array<{ key: 'event' | 'id' | 'retry' | 'data'; label: string }> = [
  { key: 'event', label: 'event 事件类型' },
  { key: 'id', label: 'id 最后事件 ID' },
  { key: 'retry', label: 'retry 重连毫秒' },
  { key: 'data', label: 'data 数据' },
];
