/** 默认 CSV 样例 */
export const DEFAULT_CSV = [
  'id,name,email,age,note',
  '1,Alice,alice@example.com,30,"VIP, founder"',
  "2,Bob,bob@example.com,,O'Brien team",
  '3,Carol,carol@example.com,28,NULL',
].join('\n');

/** 默认表名 */
export const DEFAULT_TABLE = 'users';

/** 标识符引号风格选项 */
export const QUOTE_OPTIONS = [
  { label: '反引号 `（MySQL）', value: 'backtick' },
  { label: '双引号 "（ANSI / PostgreSQL）', value: 'double' },
  { label: '方括号 []（SQL Server）', value: 'bracket' },
] as const;

/** 分隔符选项 */
export const DELIMITER_OPTIONS = [
  { label: '自动探测', value: 'auto' },
  { label: '逗号 ,', value: ',' },
  { label: '分号 ;', value: ';' },
  { label: '制表符 Tab', value: '\t' },
  { label: '竖线 |', value: '|' },
] as const;

/** 空值处理选项 */
export const NULL_MODE_OPTIONS = [
  { label: '空单元格 → NULL', value: 'empty-to-null' },
  { label: '空单元格 → 空字符串', value: 'empty-to-string' },
] as const;

/** 默认每批行数（0 = 全部合并为一条） */
export const DEFAULT_BATCH_SIZE = 0;
