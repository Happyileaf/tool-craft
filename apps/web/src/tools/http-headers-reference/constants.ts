/**
 * HTTP 头字段速查工具常量
 */

/** 工具标题 */
export const TOOL_TITLE = 'HTTP 头字段速查（RFC 9110 / 9111 / 6265 等）';

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER = '搜索头字段或关键字，如 Content-Type、缓存、csp、cookie、cors';

/** 数据来源提示 */
export const DATA_SOURCE_HINT =
  '数据依据 RFC 9110（HTTP 语义）、RFC 9111（缓存）、RFC 6265（Cookie）、Fetch / CORS 与各安全头规范内置，纯本地检索，不发起任何网络请求；「禁止修改」对应 Fetch 标准的 forbidden header 清单。';

/** 分类筛选项 */
export const CATEGORY_OPTIONS: { label: string; value: 'all' | string }[] = [
  { label: '全部分类', value: 'all' },
  { label: '通用', value: 'general' },
  { label: '请求', value: 'request' },
  { label: '响应', value: 'response' },
  { label: '表示 / 实体', value: 'entity' },
  { label: '缓存', value: 'caching' },
  { label: 'CORS 跨域', value: 'cors' },
  { label: '安全', value: 'security' },
];

/** 方向筛选项 */
export const DIRECTION_OPTIONS: { label: string; value: 'all' | 'request' | 'response' | 'both' }[] = [
  { label: '全部方向', value: 'all' },
  { label: '仅请求头', value: 'request' },
  { label: '仅响应头', value: 'response' },
  { label: '请求 / 响应通用', value: 'both' },
];
