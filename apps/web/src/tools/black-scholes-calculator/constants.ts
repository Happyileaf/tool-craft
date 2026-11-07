/**
 * Black-Scholes 工具的选项与默认输入
 */

export enum OptionTypeEnum {
  CALL = 'call',
  PUT = 'put',
}

export const OPTION_TYPE_OPTIONS: { label: string; value: OptionTypeEnum }[] = [
  { label: '看涨 Call', value: OptionTypeEnum.CALL },
  { label: '看跌 Put', value: OptionTypeEnum.PUT },
];

/** 默认输入（年化比率用小数，如 0.05 = 5%） */
export const DEFAULT_INPUTS = {
  spot: '100',
  strike: '100',
  rate: '5%',
  volatility: '20%',
  maturity: '1',
  dividend: '0%',
  marketPrice: '',
};

/** 输入字段元数据：key、中文标签、单位/提示 */
export const FIELD_META: { key: keyof typeof DEFAULT_INPUTS; label: string; hint: string }[] = [
  { key: 'spot', label: '标的现价 S', hint: '正数' },
  { key: 'strike', label: '行权价 K', hint: '正数' },
  { key: 'rate', label: '无风险利率 r', hint: '年化，如 5%' },
  { key: 'volatility', label: '波动率 σ', hint: '年化，如 20%' },
  { key: 'maturity', label: '期限 T', hint: '单位：年（0.25 = 3 个月）' },
  { key: 'dividend', label: '连续股息率 q', hint: '年化，无股息填 0%' },
  { key: 'marketPrice', label: '市场价格（可选）', hint: '填写后反解隐含波动率' },
];
