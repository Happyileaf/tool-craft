/**
 * 调查抽样样本量计算器常量定义
 */

/** 可选置信水平（百分比展示，内部转为比例） */
export const CONFIDENCE_OPTIONS: ReadonlyArray<{ label: string; value: number }> = Object.freeze([
  { label: '80%', value: 0.8 },
  { label: '85%', value: 0.85 },
  { label: '90%', value: 0.9 },
  { label: '95%（常用）', value: 0.95 },
  { label: '99%（高置信）', value: 0.99 },
]);

/** 计算模式 */
export const CALC_MODE = Object.freeze({
  SAMPLE_SIZE: 'sample-size',
  MARGIN: 'margin',
} as const);

/** 计算模式字面量联合类型 */
export type CalcMode = (typeof CALC_MODE)[keyof typeof CALC_MODE];

/** 示例预设 */
export const SAMPLE_PRESETS: ReadonlyArray<{
  label: string;
  confidenceLevel: number;
  marginOfError: number;
  proportion: number;
  populationSize: number;
}> = Object.freeze([
  {
    label: '全国民意调查（95% / ±5% / 无限总体）',
    confidenceLevel: 0.95,
    marginOfError: 0.05,
    proportion: 0.5,
    populationSize: 0,
  },
  {
    label: '企业全员调研（N=1000，FPC 校正）',
    confidenceLevel: 0.95,
    marginOfError: 0.05,
    proportion: 0.5,
    populationSize: 1000,
  },
  {
    label: '高精度 A/B 实验（99% / ±3%）',
    confidenceLevel: 0.99,
    marginOfError: 0.03,
    proportion: 0.5,
    populationSize: 0,
  },
]);
