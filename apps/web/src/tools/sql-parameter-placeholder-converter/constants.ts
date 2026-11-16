/**
 * SQL 参数占位符风格转换器的常量定义
 *
 * 支持九种占位符风格，分为位置式、编号式与命名式三类；
 * 本文件只承载静态配置，词法扫描与转换逻辑见 utils/sql.ts。
 */

/** 占位符风格标识（slug） */
export type PlaceholderStyle =
  | 'question'
  | 'percent-s'
  | 'dollar-number'
  | 'colon-number'
  | 'at-p-number'
  | 'colon-name'
  | 'at-name'
  | 'py-named'
  | 'double-brace';

/** 占位符大类 */
export type PlaceholderKind = 'positional' | 'numbered' | 'named';

/** 风格元数据 */
export interface StyleMeta {
  style: PlaceholderStyle;
  kind: PlaceholderKind;
  /** 中文名 */
  label: string;
  /** 英文名 */
  labelEn: string;
  /** 形态示例 */
  sample: string;
}

/** 全部九种风格的元数据（下拉选项顺序） */
export const STYLE_OPTIONS: StyleMeta[] = [
  { style: 'question', kind: 'positional', label: '问号 ?（JDBC / SQLite 位置式）', labelEn: 'Question mark', sample: '?' },
  { style: 'percent-s', kind: 'positional', label: '%s（Python psycopg2 位置式）', labelEn: 'Percent-s', sample: '%s' },
  { style: 'dollar-number', kind: 'numbered', label: '$n（PostgreSQL 编号式）', labelEn: 'Dollar-number', sample: '$1' },
  { style: 'colon-number', kind: 'numbered', label: ':n（编号式）', labelEn: 'Colon-number', sample: ':1' },
  { style: 'at-p-number', kind: 'numbered', label: '@pN（SQL Server 编号式）', labelEn: 'At-p-number', sample: '@p1' },
  { style: 'colon-name', kind: 'named', label: ':name（命名式）', labelEn: 'Colon-name', sample: ':id' },
  { style: 'at-name', kind: 'named', label: '@name（命名式）', labelEn: 'At-name', sample: '@id' },
  { style: 'py-named', kind: 'named', label: '%(name)s（Python 命名式）', labelEn: 'Python named', sample: '%(id)s' },
  { style: 'double-brace', kind: 'named', label: '{{name}}（模板命名式）', labelEn: 'Double-brace', sample: '{{id}}' },
];

/** 自动识别选项（与九种风格并列于源风格下拉） */
export const AUTO_DETECT = 'auto' as const;

/** 位置式 → 命名式时的默认名称前缀 */
export const DEFAULT_NAME_PREFIX = 'p';

/** 命名占位符名称规则：首字符字母或下划线，其余字母数字下划线 */
export const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** 输入 SQL 长度上限（字符数） */
export const MAX_SQL_LENGTH = 200_000;

/** 示例 SQL（JDBC 问号风格，含字符串 / 注释 / 美元引用等跳过区域演示） */
export const DEFAULT_SAMPLE = `SELECT id, name
FROM users
WHERE status = ?            -- 活跃状态
  AND age > ?
  AND name NOT LIKE '?'
  AND tags @> ?::jsonb`;

/** 风格标识 → 元数据的快速索引 */
export const STYLE_META_MAP: Record<PlaceholderStyle, StyleMeta> = STYLE_OPTIONS.reduce(
  (acc, meta) => {
    acc[meta.style] = meta;
    return acc;
  },
  {} as Record<PlaceholderStyle, StyleMeta>,
);
