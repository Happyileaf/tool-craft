/**
 * JSON 转 Zod schema 工具内常量
 */

/**
 * 首次载入时的示例 JSON：覆盖嵌套对象、数组、email/uuid 格式、
 * 可空字段与枚举字符串
 */
export const DEFAULT_SAMPLE = `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "admin",
  "age": 36,
  "active": true,
  "profile": {
    "website": "https://example.com",
    "birthday": "1815-12-10"
  },
  "tags": ["math", "science"],
  "friends": [
    { "name": "Alan", "age": 41 }
  ],
  "note": null
}`;

/**
 * 多样例推断示例（空行分隔的两个 JSON 文档）：
 * 演示缺失字段变 .optional()、null 变 .nullable()、离散字符串变 z.enum
 */
export const MULTI_SAMPLE = `{
  "id": 1,
  "status": "open",
  "owner": "ada",
  "closedAt": null
}

{
  "id": 2,
  "status": "done",
  "owner": "grace",
  "closedAt": "2026-11-04T10:00:00Z",
  "priority": 5
}`;

/** 根 schema 名默认值 */
export const DEFAULT_ROOT_NAME = "Schema";

/** 缩进宽度可选值（空格数） */
export const INDENT_OPTIONS: number[] = [2, 4];

/** 缩进宽度默认值（空格数） */
export const DEFAULT_INDENT = 2;
