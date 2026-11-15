/**
 * JSON → C++ struct 生成器 工具内常量
 */

/**
 * 工具首次载入时填入的示例 JSON，覆盖嵌套对象、数组、可空字段与浮点数
 */
export const DEFAULT_SAMPLE = `{
  "id": 1,
  "name": "Ada Lovelace",
  "active": true,
  "score": 1.5,
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
 * 根 struct 名称默认值
 */
export const DEFAULT_ROOT_NAME = 'Root';

/**
 * 输出命名空间默认值（留空表示不包裹命名空间）
 */
export const DEFAULT_NAMESPACE = '';

/**
 * 缩进宽度可选值（空格数）
 */
export const INDENT_OPTIONS: number[] = [2, 4];

/**
 * 缩进宽度默认值（空格数）
 */
export const DEFAULT_INDENT = 2;

/**
 * 空数组元素类型的可选策略
 */
export type EmptyArrayStrategy = 'vector-any' | 'any';

/**
 * 空数组策略文案
 */
export const EMPTY_ARRAY_OPTIONS: Array<{ label: string; value: EmptyArrayStrategy }> = [
  { label: 'std::vector<std::any>', value: 'vector-any' },
  { label: 'std::any', value: 'any' },
];

/**
 * 空数组策略默认值
 */
export const DEFAULT_EMPTY_ARRAY_STRATEGY: EmptyArrayStrategy = 'vector-any';
