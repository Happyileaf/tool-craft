/**
 * ISO 8601 时长解析与格式化工具内常量
 */

/** 转换方向 */
export enum DurationModeEnum {
  /** ISO 时长字符串解析为单位明细 */
  PARSE = 'parse',
  /** 秒数 / 时分秒格式化为 ISO 时长 */
  FORMAT = 'format',
}

/** 转换方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: DurationModeEnum }[] = [
  { label: '解析（ISO 时长 → 明细）', value: DurationModeEnum.PARSE },
  { label: '格式化（秒数 → ISO 时长）', value: DurationModeEnum.FORMAT },
];

/** 解析方向的默认示例 */
export const DEFAULT_DURATION = 'P1Y2M3DT4H5M6S';

/** 格式化方向的默认秒数 */
export const DEFAULT_SECONDS = 90540;

/** 一年折算天数（非历法换算，用于总秒数近似，按 365 天平年） */
export const DAYS_PER_YEAR = 365;

/** 一月折算天数（非历法换算，用于总秒数近似，按 30 天/月） */
export const DAYS_PER_MONTH = 30;

/** 一天的秒数 */
export const SECONDS_PER_DAY = 86400;

/** 一小时的秒数 */
export const SECONDS_PER_HOUR = 3600;

/** 一分钟的秒数 */
export const SECONDS_PER_MINUTE = 60;

/** 组件数值允许的最大值（防止异常输入） */
export const MAX_COMPONENT_VALUE = 1e12;
