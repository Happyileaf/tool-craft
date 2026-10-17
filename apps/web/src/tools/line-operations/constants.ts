/**
 * 行级文本处理工具内常量
 */

import {
  FilterActionEnum,
  FilterModeEnum,
  SortModeEnum,
  SortOrderEnum,
} from './utils/lines';

export { FilterActionEnum, FilterModeEnum, SortModeEnum, SortOrderEnum };

/** 工具首次载入时填入的默认样例文本 */
export const DEFAULT_INPUT = `error: failed to connect 10.0.0.2
info: cache warmed

warn: retry scheduled
error: failed to connect 10.0.0.2
info: request finished`;

/** 排序方式下拉选项 */
export const SORT_MODE_OPTIONS: { label: string; value: SortModeEnum }[] = [
  { label: '不排序', value: SortModeEnum.NONE },
  { label: '字典序', value: SortModeEnum.LEXICAL },
  { label: '自然序', value: SortModeEnum.NATURAL },
  { label: '按行长', value: SortModeEnum.LENGTH },
  { label: '按数值', value: SortModeEnum.NUMERIC },
];

/** 排序方向选项 */
export const SORT_ORDER_OPTIONS: { label: string; value: SortOrderEnum }[] = [
  { label: '升序', value: SortOrderEnum.ASC },
  { label: '降序', value: SortOrderEnum.DESC },
];

/** 过滤模式下拉选项 */
export const FILTER_MODE_OPTIONS: { label: string; value: FilterModeEnum }[] = [
  { label: '不过滤', value: FilterModeEnum.NONE },
  { label: '按关键字包含', value: FilterModeEnum.CONTAINS },
  { label: '按正则匹配', value: FilterModeEnum.REGEX },
];

/** 过滤动作选项 */
export const FILTER_ACTION_OPTIONS: { label: string; value: FilterActionEnum }[] =
  [
    { label: '仅保留命中行', value: FilterActionEnum.KEEP },
    { label: '剔除命中行', value: FilterActionEnum.REMOVE },
  ];
