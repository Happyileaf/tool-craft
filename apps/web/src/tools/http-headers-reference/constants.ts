/** HTTP 头字段速查常量 */

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER =
  '按头名称或关键字搜索，如 cache、authorization、CSP、跨域';

/** 快捷搜索示例 */
export const QUICK_SAMPLES: string[] = ['cache', 'cookie', 'CORS', '安全', 'forbidden'];

/** 方向筛选项 */
export const DIRECTION_OPTIONS: { value: 'all' | 'request' | 'response' | 'both'; label: string }[] = [
  { value: 'all', label: '全部方向' },
  { value: 'request', label: '请求头' },
  { value: 'response', label: '响应头' },
  { value: 'both', label: '通用' },
];
