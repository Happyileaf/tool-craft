/**
 * CRON expression parser 工具内常量
 */

/**
 * 常用 CRON 表达式示例，供「载入示例」控件渲染
 */
export const CRON_SAMPLES: { label: string; value: string }[] = [
  { label: '每 15 分钟', value: '*/15 * * * *' },
  { label: '工作日 9-17 点整点', value: '0 9-17 * * MON-FRI' },
  { label: '每天 0 点', value: '0 0 * * *' },
  { label: '每月 1 日上午 8 点', value: '0 8 1 * *' },
  { label: '每周一至周五 8:30', value: '30 8 * * 1-5' },
];

/**
 * 工具首次载入时填入的默认表达式
 */
export const DEFAULT_CRON_EXPRESSION = '*/15 9-17 * * MON-FRI';

/**
 * 执行时间预览条数可选值
 */
export const PREVIEW_COUNT_OPTIONS: number[] = [5, 10, 20];

/**
 * 执行时间预览条数默认值
 */
export const DEFAULT_PREVIEW_COUNT = 5;
