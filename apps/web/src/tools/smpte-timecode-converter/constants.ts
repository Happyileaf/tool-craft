/** 默认示例时间码 */
export const SMPTE_SAMPLE_TIMECODE = '00:01:00;02';

/** 默认示例总帧数 */
export const SMPTE_SAMPLE_FRAMES = '1800';

/** 方向选项 */
export const SMPTE_DIRECTION_OPTIONS = [
  { label: '时间码 → 帧/时长', value: 'tc-to-frames' as const },
  { label: '帧/时长 → 时间码', value: 'frames-to-tc' as const },
];
