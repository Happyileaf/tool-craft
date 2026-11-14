/** 电容标码工具的内置常量与样例 */

/** 默认示例标码 */
export const DEFAULT_SAMPLE_CODE = '104K';

/** 常用标码示例，便于一键载入 */
export const PRESET_CODES = ['104', '104K', '47', '4R7', '2N2', '100N'];

/** 反查容值的默认数值 */
export const DEFAULT_TARGET_VALUE = 100;

/** 反查容值的单位选项 */
export const TARGET_UNIT_OPTIONS = [
  { label: 'pF', value: 'pF' },
  { label: 'nF', value: 'nF' },
  { label: 'µF', value: 'µF' },
];

/** 各单位对应的皮法倍数 */
export const UNIT_TO_PF: Record<string, number> = {
  pF: 1,
  nF: 1e3,
  µF: 1e6,
};
