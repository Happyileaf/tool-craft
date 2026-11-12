/**
 * EDN ↔ JSON 转换器静态配置
 */

/** 转换方向 */
export const DIRECTIONS = [
  { value: 'edn-to-json', label: 'EDN → JSON' },
  { value: 'json-to-edn', label: 'JSON → EDN' },
] as const;

export type ConvertDirection = (typeof DIRECTIONS)[number]['value'];

/** 类型标记说明，用于帮助面板 */
export const MARKER_REFERENCE = [
  { edn: ':keyword', json: '{ "___edn_type": "keyword", "value": ":keyword" }' },
  { edn: 'symbol', json: '{ "___edn_type": "symbol", "value": "symbol" }' },
  { edn: '#{1 2}', json: '{ "___edn_type": "set", "items": [1, 2] }' },
  { edn: '(1 2)', json: '{ "___edn_type": "list", "items": [1, 2] }' },
  { edn: '#inst "..."', json: '{ "___edn_type": "inst", "value": "..." }' },
  { edn: '#uuid "..."', json: '{ "___edn_type": "uuid", "value": "..." }' },
] as const;
