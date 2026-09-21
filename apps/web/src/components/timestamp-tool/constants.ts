/**
 * 时间戳转换方向枚举
 * 枚举值与 time.timestamp-convert 能力 params.direction 的取值对齐，可直接作为参数传递
 */
enum TimestampDirectionEnum {
  /** 日期时间文本 → 时间戳 */
  ToTimestamp = 'toTimestamp',
  /** 时间戳 → UTC ISO 8601 日期时间文本 */
  ToDateTime = 'toDateTime',
}

/**
 * 时间戳转换方向名称Map
 */
const TimestampDirectionLabelMap = {
  /** 日期时间转时间戳的展示文案 */
  [TimestampDirectionEnum.ToTimestamp]: '日期时间 → 时间戳',
  /** 时间戳转日期时间的展示文案 */
  [TimestampDirectionEnum.ToDateTime]: '时间戳 → 日期时间',
};

/**
 * 时间戳转换方向选项数据源
 */
const TimestampDirectionOptions = [
  {
    label: TimestampDirectionLabelMap[TimestampDirectionEnum.ToTimestamp],
    value: TimestampDirectionEnum.ToTimestamp,
  },
  {
    label: TimestampDirectionLabelMap[TimestampDirectionEnum.ToDateTime],
    value: TimestampDirectionEnum.ToDateTime,
  },
];

/**
 * 时间戳单位枚举
 * 枚举值与 time.timestamp-convert 能力 params.unit 的取值对齐，可直接作为参数传递
 */
enum TimestampUnitEnum {
  /** 秒 */
  Seconds = 'seconds',
  /** 毫秒 */
  Milliseconds = 'milliseconds',
}

/**
 * 时间戳单位名称Map
 */
const TimestampUnitLabelMap = {
  /** 秒单位的展示文案 */
  [TimestampUnitEnum.Seconds]: '秒（s）',
  /** 毫秒单位的展示文案 */
  [TimestampUnitEnum.Milliseconds]: '毫秒（ms）',
};

/**
 * 时间戳单位选项数据源
 */
const TimestampUnitOptions = [
  {
    label: TimestampUnitLabelMap[TimestampUnitEnum.Seconds],
    value: TimestampUnitEnum.Seconds,
  },
  {
    label: TimestampUnitLabelMap[TimestampUnitEnum.Milliseconds],
    value: TimestampUnitEnum.Milliseconds,
  },
];

export {
  TimestampDirectionEnum,
  TimestampDirectionLabelMap,
  TimestampDirectionOptions,
  TimestampUnitEnum,
  TimestampUnitLabelMap,
  TimestampUnitOptions,
};
