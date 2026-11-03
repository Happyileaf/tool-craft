/** 方向选项 */
export const GPS_DIRECTION_OPTIONS = [
  { label: 'UTC 日期 → GPS 周/TOW', value: 'utc-to-gps' as const },
  { label: 'GPS 周/TOW → UTC 日期', value: 'gps-to-utc' as const },
];

/** 回卷周期选项（LNAV WN 解释） */
export const GPS_ROLLOVER_OPTIONS = [
  { label: '第 1 周期（1980–1999）', value: 0 },
  { label: '第 2 周期（1999–2019）', value: 1 },
  { label: '第 3 周期（2019–2038）', value: 2 },
  { label: '第 4 周期（2038– ）', value: 3 },
];

export const GPS_SAMPLE_DATE = '2024-03-01T00:00:00Z';
