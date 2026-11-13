import type { DepreciationMethod } from './utils/depreciation';

/** 默认资产原值 */
export const DEFAULT_COST = 100000;

/** 默认预计净残值 */
export const DEFAULT_SALVAGE = 10000;

/** 默认折旧年限 */
export const DEFAULT_YEARS = 5;

/** 默认预计总工作量（工时 / 里程等） */
export const DEFAULT_TOTAL_UNITS = 90000;

/** 默认各期工作量（逗号分隔，供工作量法使用） */
export const DEFAULT_UNITS_TEXT = '30000,20000,40000';

/** 折旧方法下拉选项，顺序与详情文档保持一致 */
export const METHOD_OPTIONS: { label: string; value: DepreciationMethod }[] = [
  { label: '直线法（平均年限法）', value: 'straight-line' },
  { label: '工作量法', value: 'units-of-activity' },
  { label: '双倍余额递减法', value: 'double-declining' },
  { label: '年数总和法', value: 'sum-of-years-digits' },
];

/** 金额千分位格式化（人民币元，保留两位小数） */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
