/**
 * URL 解析与查询参数编辑工具内常量
 */

/** 默认载入的示例 URL */
export const DEFAULT_URL =
  'https://example.com/search?q=hello%20world&tag=a&tag=b&flag#results';

/** URL 各组件的中文标签 */
export const COMPONENT_LABELS: { key: ComponentKey; label: string }[] = [
  { key: 'scheme', label: '协议' },
  { key: 'username', label: '用户名' },
  { key: 'password', label: '密码' },
  { key: 'host', label: '主机' },
  { key: 'port', label: '端口' },
  { key: 'pathname', label: '路径' },
  { key: 'query', label: '查询串' },
  { key: 'hash', label: '哈希片段' },
];

/** URL 结构组件键类型 */
export type ComponentKey =
  | 'scheme'
  | 'username'
  | 'password'
  | 'host'
  | 'port'
  | 'pathname'
  | 'query'
  | 'hash';
