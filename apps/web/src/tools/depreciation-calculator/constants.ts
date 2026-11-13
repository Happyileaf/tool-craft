import type { DepreciationMethod } from './utils/depreciation';

/** 默认固定资产参数 */
export const DEFAULT_ASSET = {
  /** 默认原值（元） */
  cost: 100000,
  /** 默认预计净残值（元） */
  salvage: 5000,
  /** 默认预计使用年限（年） */
  usefulLife: 5,
};

/** 工作量法默认预计总工作量 */
export const DEFAULT_TOTAL_UNITS = 95000;

/** 工作量法默认各年度实际工作量 */
export const DEFAULT_YEARLY_UNITS: number[] = [20000, 30000, 25000, 20000];

/** 工作量法默认年度工作量输入文本（逗号分隔） */
export const DEFAULT_YEARLY_UNITS_TEXT = DEFAULT_YEARLY_UNITS.join(',');

/** 折旧方法选项 */
export const METHOD_OPTIONS: Array<{
  value: DepreciationMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'straight-line',
    label: '年限平均法（直线法）',
    description: '年折旧额 =（原值 − 预计净残值）÷ 预计使用年限，每年折旧额相同。',
  },
  {
    value: 'units-of-production',
    label: '工作量法',
    description: '单位折旧额 =（原值 − 预计净残值）÷ 预计总工作量，按当年实际工作量计提。',
  },
  {
    value: 'double-declining',
    label: '双倍余额递减法',
    description: '前期按 2/年限 的年折旧率对年初账面净值计提，最后两年改按直线法平均摊销。',
  },
  {
    value: 'sum-of-years-digits',
    label: '年数总和法',
    description: '年折旧 = 应计折旧额 × 剩余使用年数 ÷ 年数总和，折旧额逐年递减。',
  },
];
