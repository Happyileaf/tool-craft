/**
 * JSON → SQL DDL 生成器 常量
 */
import type { SqlDialect } from './utils/ddl';

/** 方言切换选项 */
export const DIALECT_OPTIONS: { label: string; value: SqlDialect }[] = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
];

/** 默认表名 */
export const DEFAULT_TABLE_NAME = 'my_table';

/** 字符串退化 TEXT 的阈值选项 */
export const TEXT_THRESHOLD_OPTIONS: { label: string; value: number | null }[] = [
  { label: '不退化（始终 VARCHAR/TEXT 按长度）', value: null },
  { label: '超过 255 字符用 TEXT', value: 255 },
  { label: '超过 500 字符用 TEXT', value: 500 },
  { label: '超过 1000 字符用 TEXT', value: 1000 },
];

/** 默认示例输入 */
export const DEFAULT_JSON_INPUT = JSON.stringify(
  [
    {
      userId: 1,
      userName: 'alice',
      email: 'alice@example.com',
      isActive: true,
      loginCount: 12,
      balance: 99.5,
      createdAt: '2026-11-05T09:00:00Z',
      profile: { city: 'Hangzhou', level: 3 },
    },
    {
      userId: 2147483650,
      userName: 'bob-with-a-longer-name',
      email: 'bob@example.com',
      isActive: false,
      loginCount: null,
      balance: 0,
      createdAt: '2026-11-04T22:18:00Z',
      profile: { city: 'Beijing', level: 1 },
    },
  ],
  null,
  2,
);
