/**
 * HTTP 请求方法速查工具常量
 */

/** 工具标题 */
export const TOOL_TITLE = 'HTTP 请求方法速查（RFC 9110 / 5789）';

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER = '搜索方法或关键字，如 GET、幂等、safe、cors、补丁';

/** 数据来源提示 */
export const DATA_SOURCE_HINT =
  '数据依据 RFC 9110（HTTP 语义）、RFC 9111（缓存）与 RFC 5789（PATCH）内置，纯本地检索，不发起任何网络请求；请求 / 响应片段仅为文本示例。';

/** 分组筛选项 */
export const GROUP_OPTIONS: { label: string; value: 'all' | 'common' | 'special' }[] = [
  { label: '全部方法', value: 'all' },
  { label: '常用 CRUD 方法', value: 'common' },
  { label: '特殊方法', value: 'special' },
];
