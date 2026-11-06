/**
 * Syslog 日志行解析器工具内常量
 */

/** 输入框默认样例，覆盖 RFC 5424、RFC 3164 与纯文本三种形态 */
export const DEFAULT_SYSLOG_INPUT = `<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource="Application"] An application event log entry
<34>1 2026-11-07T08:00:00Z host.example.com sshd 1234 - - Accepted password for admin
<13>Oct 11 22:14:15 mymachine su: 'su root' failed for lonvick on /dev/pts/8
this line has no PRI prefix and is treated as unknown`;

/** 输入框行数 */
export const INPUT_ROWS = 10;

/** 结果表格最大渲染行数（超出提示截断，解析仍对全量输入执行） */
export const MAX_TABLE_ROWS = 500;

/** severity 名称 → antd Tag 语义色，越严重越偏红 */
export const SEVERITY_TAG_COLORS: Record<string, string> = {
  emergency: 'red',
  alert: 'red',
  critical: 'volcano',
  error: 'orange',
  warning: 'gold',
  notice: 'blue',
  informational: 'cyan',
  debug: 'default',
};

/** 格式 → antd Tag 颜色 */
export const FORMAT_TAG_COLORS: Record<string, string> = {
  rfc5424: 'green',
  rfc3164: 'geekblue',
  unknown: 'default',
};

/** 格式中文标签 */
export const FORMAT_LABELS: Record<string, string> = {
  rfc5424: 'RFC 5424',
  rfc3164: 'RFC 3164',
  unknown: '未知',
};
