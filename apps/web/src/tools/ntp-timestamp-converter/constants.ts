/** NTP 时间戳工具的示例输入：点分十进制，对应 2024-01-01T00:00:00Z */
export const NTP_SAMPLE_INPUT = '3913056000.0';

/** 方向选项 */
export const NTP_DIRECTION_OPTIONS = [
  { label: 'NTP 时间戳 → 日期', value: 'ntp-to-date' as const },
  { label: '日期 → NTP 时间戳', value: 'date-to-ntp' as const },
];

/** 日期输入框的占位提示 */
export const NTP_DATE_PLACEHOLDER = '2026-11-03T00:00:00Z（支持 ISO/Unix 毫秒/秒）';
