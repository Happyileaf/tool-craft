/**
 * HTTP 状态码速查工具常量
 */
import type { StatusClass } from './utils/http-status';

/** 分类筛选项 */
export const CATEGORY_OPTIONS: { label: string; value: StatusClass | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '1xx 信息响应', value: '1xx' },
  { label: '2xx 成功', value: '2xx' },
  { label: '3xx 重定向', value: '3xx' },
  { label: '4xx 客户端错误', value: '4xx' },
  { label: '5xx 服务器错误', value: '5xx' },
];

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER =
  '搜索编号或关键词，如 404、4、not found、重定向、网关';

/** 各分类对应的标签颜色（antd Tag 内置色板） */
export const CATEGORY_TAG_COLOR: Record<StatusClass, string> = {
  '1xx': 'blue',
  '2xx': 'green',
  '3xx': 'gold',
  '4xx': 'orange',
  '5xx': 'red',
};

/** 各分类中文标题 */
export const CATEGORY_TITLE: Record<StatusClass, string> = {
  '1xx': '1xx 信息响应',
  '2xx': '2xx 成功响应',
  '3xx': '3xx 重定向',
  '4xx': '4xx 客户端错误',
  '5xx': '5xx 服务器错误',
};
