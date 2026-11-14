export type ConvertMode = 'auto' | 'to-url' | 'to-standard';

export const MODE_OPTIONS: Array<{ label: string; value: ConvertMode }> = [
  { label: '自动识别（统一输出 Base64URL）', value: 'auto' },
  { label: '标准 Base64 → Base64URL', value: 'to-url' },
  { label: 'Base64URL → 标准 Base64（补填充）', value: 'to-standard' },
];

export const DEFAULT_INPUT = `Zm9vYmFy
++//
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0=
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0

bad*token`;
