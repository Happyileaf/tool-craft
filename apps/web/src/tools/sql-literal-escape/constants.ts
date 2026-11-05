import type { SqlEscapeMode } from './utils/sqlEscape';

export interface ModeOption {
  value: SqlEscapeMode;
  label: string;
  hint: string;
  /** 是否为转义方向（原始文本 → 字面量）；false 为反转义方向 */
  isEscape: boolean;
  /** 是否为 LIKE 系列模式，用于界面提示与附加输出 */
  isLike: boolean;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'standard-escape',
    label: '标准 SQL 转义',
    hint: "单引号双写为 ''，兼容 ANSI SQL / PostgreSQL / Oracle 等",
    isEscape: true,
    isLike: false,
  },
  {
    value: 'standard-unescape',
    label: '标准 SQL 反转义',
    hint: "输入带外层引号的字面量，'' 还原为单引号，未闭合引号报错",
    isEscape: false,
    isLike: false,
  },
  {
    value: 'mysql-escape',
    label: 'MySQL 转义',
    hint: "反斜杠序列 \\' \\\\ \\n \\t 等，并同时双写单引号",
    isEscape: true,
    isLike: false,
  },
  {
    value: 'mysql-unescape',
    label: 'MySQL 反转义',
    hint: '解析反斜杠转义序列，未知序列与孤立反斜杠报错',
    isEscape: false,
    isLike: false,
  },
  {
    value: 'like-escape',
    label: 'LIKE 通配符转义',
    hint: "转义 % _ 与反斜杠，生成 LIKE '...' ESCAPE '\\' 表达式",
    isEscape: true,
    isLike: true,
  },
  {
    value: 'like-unescape',
    label: 'LIKE 反转义',
    hint: "解析 LIKE 内容或完整 LIKE ... ESCAPE 表达式，还原 % _ 字面量",
    isEscape: false,
    isLike: true,
  },
];

export const DEFAULT_INPUTS: Record<SqlEscapeMode, string> = {
  'standard-escape': "O'Reilly\nit's a test",
  'standard-unescape': "'O''Reilly'\n'it''s a test'",
  'mysql-escape': "O'Reilly\nC:\\temp\\new\nline\tbreak",
  'mysql-unescape': "'O\\'Reilly'\n'C:\\\\temp\\\\new'",
  'like-escape': '100% off_a\\b\n50% discount_free',
  'like-unescape': "'100\\% off\\_a\\\\b'\nLIKE '50\\% discount\\_free' ESCAPE '\\'",
};
