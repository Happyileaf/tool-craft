/**
 * JSON ↔ NDJSON converter 工具内常量
 */

/**
 * 转换方向枚举
 */
export enum NdjsonDirectionEnum {
  /** JSON 数组转 NDJSON */
  JSON_TO_NDJSON = 'json-to-ndjson',
  /** NDJSON 转 JSON 数组 */
  NDJSON_TO_JSON = 'ndjson-to-json',
}

/**
 * JSON 数组 → NDJSON 方向的示例输入
 */
export const DEFAULT_JSON_SAMPLE = `[
  { "id": 1, "name": "Alice", "roles": ["admin", "dev"] },
  { "id": 2, "name": "Bob", "roles": ["ops"] },
  { "id": 3, "name": "Carol", "active": false }
]`;

/**
 * NDJSON → JSON 数组方向的示例输入
 */
export const DEFAULT_NDJSON_SAMPLE = `{"id":1,"name":"Alice","roles":["admin","dev"]}
{"id":2,"name":"Bob","roles":["ops"]}
{"id":3,"name":"Carol","active":false}`;
