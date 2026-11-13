/** 默认焦距（mm） */
export const DEFAULT_FOCAL_LENGTH = 50;

/** 默认光圈 f 值 */
export const DEFAULT_APERTURE = 2.8;

/** 默认对焦距离（mm，对应 3 m） */
export const DEFAULT_FOCUS_DISTANCE = 3000;

/** 默认弥散圆（mm，全画幅标准） */
export const DEFAULT_COC = 0.03;

/** 对焦距离输入单位 */
export type DistanceUnit = 'm' | 'mm';

/** 单位与毫米的换算关系 */
export const UNIT_TO_MM: Record<DistanceUnit, number> = {
  m: 1000,
  mm: 1,
};

/** 单位展示名 */
export const UNIT_LABELS: Record<DistanceUnit, string> = {
  m: '米（m）',
  mm: '毫米（mm）',
};

/** 反推模式下的目标近界默认值（mm，对应 2 m） */
export const DEFAULT_TARGET_NEAR = 2000;
