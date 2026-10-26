/**
 * ULID 生成器工具内常量
 */

/** 默认批量生成数量 */
export const DEFAULT_COUNT = 5;

/** 批量数量快捷选项 */
export const COUNT_OPTIONS: { label: string; value: number }[] = [
  { label: '1 个', value: 1 },
  { label: '5 个', value: 5 },
  { label: '10 个', value: 10 },
  { label: '50 个', value: 50 },
  { label: '100 个', value: 100 },
];

/** 解析区默认示例（时间戳 1469918176385，即 2016-07-30 22:36:16.385 UTC） */
export const DEFAULT_SAMPLE_ULID = '01ARYZ6S41TSV4RRFFQ69G5FAV';
