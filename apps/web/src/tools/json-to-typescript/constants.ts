/**
 * JSON 转 TypeScript 类型 工具内常量
 */

/**
 * 工具首次载入时填入的示例 JSON，包含嵌套对象与数组，
 * 便于直观展示类型推断与 interface 生成效果
 */
export const DEFAULT_SAMPLE = `{
  "id": 1,
  "name": "Ada Lovelace",
  "active": true,
  "profile": {
    "email": "ada@example.com",
    "age": 36
  },
  "tags": ["math", "science"],
  "friends": [
    { "name": "Alan", "age": 41 },
    { "name": "Grace", "age": 45, "title": "Admiral" }
  ],
  "metadata": null
}`;

/**
 * 根类型名默认值
 */
export const DEFAULT_ROOT_NAME = 'Root';

/**
 * 缩进宽度可选值（空格数）
 */
export const INDENT_OPTIONS: number[] = [2, 4];

/**
 * 缩进宽度默认值（空格数）
 */
export const DEFAULT_INDENT = 2;

/**
 * 根类型默认是否添加 export 前缀
 */
export const DEFAULT_EXPORT_ROOT = true;
