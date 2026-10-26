export const DEFAULT_INPUT = 'name,email\r\n张三,zhangsan@example.com\r\n李四,lisi@example.com\r\n';

export const TARGET_OPTIONS = [
  { label: 'LF（Unix / macOS）', value: 'LF' },
  { label: 'CRLF（Windows）', value: 'CRLF' },
  { label: 'CR（经典 Mac）', value: 'CR' },
] as const;

export type TargetLineEnding = (typeof TARGET_OPTIONS)[number]['value'];

export const LINE_ENDING_META: Record<string, { label: string; literal: string }> = {
  LF: { label: 'LF（\\n，Unix / macOS）', literal: '\\n' },
  CRLF: { label: 'CRLF（\\r\\n，Windows）', literal: '\\r\\n' },
  CR: { label: 'CR（\\r，经典 Mac）', literal: '\\r' },
};
