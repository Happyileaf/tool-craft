/**
 * css-named-colors-lookup 静态文案与视图选项。
 */

export const TOOL_TITLE = 'CSS 命名颜色速查';

export const SEARCH_PLACEHOLDER = '按名称（blue）或颜色值（#ff0000、rgb(255,0,0)、hsl(0,100%,50%)）搜索 / 反查';

export const DATA_SOURCE_HINT =
  '数据来自 CSS Color Module Level 4 §4 定义的 148 个命名颜色（含 rebeccapurple），全部内置为构建时常量，离线可用、无网络请求。';

/** 排序方式 */
export const SORT_OPTIONS = [
  { value: 'alpha', label: '字母排序' },
  { value: 'hue', label: '色相排序' },
] as const;

/** 分组过滤 */
export const GROUP_OPTIONS = [
  { value: 'all', label: `全部颜色（148）` },
  { value: 'basic', label: '基础 16 色' },
  { value: 'extended', label: '扩展颜色（132）' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['value'];
export type GroupKey = (typeof GROUP_OPTIONS)[number]['value'];
