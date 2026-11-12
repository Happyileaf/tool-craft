/** Redis RESP2/RESP3 编解码工具的常量与示例 */

export const DEFAULT_PARSE_INPUT = `*2\r
$4\r
INFO\r
$11\r
replication\r
`;

export const DEFAULT_INLINE_INPUT = 'SET greeting "hello world"';

export const DEFAULT_VALUE_INPUT = `{
  "id": 42,
  "name": "redis",
  "active": true,
  "tags": ["cache", "queue"]
}`;

export const RESP_PLACEHOLDER =
  '粘贴 RESP 协议文本（含 \\r\\n 结束符），支持 RESP2 五类型与 RESP3 新类型';

export type RespMode = 'parse' | 'inline' | 'value';

export const MODE_OPTIONS: Array<{ value: RespMode; label: string }> = [
  { value: 'parse', label: 'RESP 文本 → 解析树' },
  { value: 'inline', label: 'Inline 命令 → RESP' },
  { value: 'value', label: 'JSON 值 → RESP3' },
];

export const PARSE_PRESETS: Array<{ label: string; payload: string }> = [
  {
    label: 'RESP2 命令数组',
    payload: DEFAULT_PARSE_INPUT,
  },
  {
    label: 'Null Bulk / 数组',
    payload: '$-1\r\n*-1\r\n',
  },
  {
    label: 'RESP3 Map 与布尔',
    payload: '|2\r\n+first\r\n:1\r\n$6\r\nsecond\r\n#t\r\n',
  },
  {
    label: 'RESP3 新类型集合',
    payload:
      '_\r\n,3.14\r\n#t\r\n(3492890328409238509324568730\r\n=15\r\ntxt:Some string\r\n',
  },
  {
    label: 'Push 事件',
    payload: '>3\r\n$9\r\nsubscribe\r\n$3\r\nfoo\r\n:1\r\n',
  },
];
