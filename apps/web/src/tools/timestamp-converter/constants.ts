/**
 * 世界主要城市时区结构
 */
export interface TimezoneCity {
  /** 城市名称对应的国际化文案键 */
  labelKey: string;
  /** IANA 时区标识符 */
  timeZone: string;
}

/**
 * 全球主要金融与科技枢纽时区集合
 */
export const TIMEZONE_CITIES: TimezoneCity[] = [
  { labelKey: 'tools.timestamp.cityBeijing', timeZone: 'Asia/Shanghai' },
  { labelKey: 'tools.timestamp.cityTokyo', timeZone: 'Asia/Tokyo' },
  { labelKey: 'tools.timestamp.cityLondon', timeZone: 'Europe/London' },
  { labelKey: 'tools.timestamp.cityNewYork', timeZone: 'America/New_York' },
  {
    labelKey: 'tools.timestamp.cityLosAngeles',
    timeZone: 'America/Los_Angeles',
  },
];

/**
 * 秒级时间戳的数字位数阈值，不超过该位数时视为秒
 */
export const SECOND_MAX_DIGITS = 10;

/**
 * 实时时钟刷新间隔（毫秒）
 */
export const CLOCK_INTERVAL = 1000;
