/**
 * Erlang B 计算器的静态选项与文案
 */

/** 计算模式选项 */
export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: 'blocking' | 'lines' | 'load' }> = [
  { label: '阻塞概率（已知线数与话务量）', value: 'blocking' },
  { label: '所需中继线数（已知话务量与 GoS）', value: 'lines' },
  { label: '可承载话务量（已知线数与 GoS）', value: 'load' },
];

/** 灵敏度对照表最大线数上限 */
export const MAX_TABLE_LINES = 30;
