/**
 * logfmt 解析与格式化工具内常量
 */

/** 工作模式：logfmt → 表格/JSON，或 JSON → logfmt */
export type ToolMode = 'parse' | 'format';

export interface ModeOption {
  value: ToolMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'parse', label: 'logfmt 解析', hint: 'key=value → 键值表 / JSON' },
  { value: 'format', label: 'JSON → logfmt', hint: 'JSON 数组或 NDJSON 序列化为 key=value' },
];

/** 解析结果视图 */
export type ParseView = 'table' | 'json';

export const VIEW_OPTIONS: { value: ParseView; label: string }[] = [
  { value: 'table', label: '键值表' },
  { value: 'json', label: 'JSON' },
];

/** 输入框默认样例：覆盖引号值、转义、裸布尔键、空值与各推断类型 */
export const DEFAULT_INPUT = `ts=2026-11-09T10:15:32.142Z level=info service=api-gateway msg="request completed" method=GET path=/healthz status=200 duration_ms=12.5 trace_id=8f3a2c1e9b04
ts=2026-11-09T10:15:33.018Z level=warn service=billing msg="retry after timeout" attempt=3 retried=true user="alice\\"ops" empty=
ts=2026-11-09T10:15:34.877Z level=error service=worker msg="panic: runtime error" fatal stack="goroutine 1 [running]:\\nmain.main()\\n\\t/app/main.go:42 +0x2f"
ts=2026-11-09T10:15:35.001Z level=debug service=cache verbose hit=false key=user:10086 latency=0.004
ts=2026-11-09T10:15:36.220Z level=info service=api-gateway msg="dangling quote ahead note="oops`;

/** 格式化模式默认样例：JSON 数组，覆盖需要加引号、裸布尔键与空值等场景 */
export const DEFAULT_JSON_INPUT = `[
  {
    "ts": "2026-11-09T10:15:32.142Z",
    "level": "info",
    "msg": "request completed",
    "status": 200,
    "duration_ms": 12.5,
    "ok": true,
    "empty": ""
  },
  {
    "level": "error",
    "msg": "panic: runtime error",
    "stack": "goroutine 1 [running]:\\nmain.main()",
    "fatal": true,
    "retried": false
  }
]`;

/** 输入框行数 */
export const INPUT_ROWS = 10;

/** 结果表格最大渲染行数（超出提示截断，解析仍对全量输入执行） */
export const MAX_TABLE_ROWS = 500;

/** 推断类型 → antd Tag 语义色 */
export const TYPE_TAG_COLORS: Record<string, string> = {
  number: 'blue',
  boolean: 'green',
  string: 'default',
};

/** 推断类型中文标签 */
export const TYPE_LABELS: Record<string, string> = {
  number: 'number',
  boolean: 'boolean',
  string: 'string',
};
