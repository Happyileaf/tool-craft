/**
 * 语义化版本解析与比较工具内常量
 */

/** 版本校验与解析区块的默认样例版本 */
export const DEFAULT_VERSION = '1.2.3-alpha.1+build.7';

/** 版本比较区块的默认左侧版本 */
export const DEFAULT_VERSION_A = '1.2.10';

/** 版本比较区块的默认右侧版本 */
export const DEFAULT_VERSION_B = '1.3.0';

/** 范围命中判断区块的默认范围表达式 */
export const DEFAULT_RANGE = '^1.2.3';

/** 范围命中判断区块的默认待判断版本 */
export const DEFAULT_RANGE_VERSION = '1.9.0';

/** 版本比较结果的中文标签映射 */
export const COMPARE_RESULT_LABELS: Record<string, string> = {
  less: 'A 小于 B',
  equal: 'A 等于 B',
  greater: 'A 大于 B',
};
