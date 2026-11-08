/** 默认 4 位数据样例（教材经典向量 1011 → 0110011）。 */
export const DEFAULT_DATA = '1011';

/** 默认批量比特流样例。 */
export const DEFAULT_BATCH = '1011 1010 0011';

/** 数据位在码字中的 1 基位置与展示标签。 */
export const DATA_LABEL: Readonly<Record<number, string>> = {
  3: 'D1',
  5: 'D2',
  6: 'D3',
  7: 'D4',
};

/** 校验位在码字中的 1 基位置与展示标签。 */
export const PARITY_LABEL: Readonly<Record<number, string>> = {
  1: 'P1',
  2: 'P2',
  4: 'P4',
};

/** 解码状态对应的中文文案与标签颜色。 */
export const STATUS_META: Readonly<Record<string, { label: string; color: string }>> = {
  ok: { label: '无错', color: 'success' },
  corrected: { label: '单错已纠正', color: 'warning' },
  'double-error': { label: '双错检出·不可纠正', color: 'error' },
};

/** 信道注入选项。 */
export const FLIP_OPTIONS = [
  { label: '无翻转', value: 0 },
  { label: '单比特翻转', value: 1 },
  { label: '双比特翻转', value: 2 },
] as const;
