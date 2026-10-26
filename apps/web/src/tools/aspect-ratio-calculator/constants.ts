/**
 * 宽高比计算器工具内常量
 */

/** 宽高比计算模式 */
export enum AspectRatioModeEnum {
  /** 化简比例并识别常见标准比例 */
  SIMPLIFY = 'simplify',
  /** 已知尺寸与比值，补全缺失项 */
  RESOLVE = 'resolve',
  /** 按给定比例或尺寸等比缩放 */
  SCALE = 'scale',
}

/** 计算模式中文标签 */
export const ASPECT_RATIO_MODE_LABELS: Record<AspectRatioModeEnum, string> = {
  [AspectRatioModeEnum.SIMPLIFY]: '化简比例',
  [AspectRatioModeEnum.RESOLVE]: '知二求三',
  [AspectRatioModeEnum.SCALE]: '按比例缩放',
};

/** 知二求三模式下待补全的维度 */
export enum ResolveTargetEnum {
  /** 补全宽度 */
  WIDTH = 'width',
  /** 补全高度 */
  HEIGHT = 'height',
}

/** 待补全维度中文标签 */
export const RESOLVE_TARGET_LABELS: Record<ResolveTargetEnum, string> = {
  [ResolveTargetEnum.WIDTH]: '求宽度',
  [ResolveTargetEnum.HEIGHT]: '求高度',
};

/** 缩放模式下已知的缩放依据 */
export enum ScaleTargetEnum {
  /** 已知目标宽度 */
  WIDTH = 'width',
  /** 已知目标高度 */
  HEIGHT = 'height',
  /** 已知缩放倍数 */
  FACTOR = 'factor',
}

/** 缩放依据中文标签 */
export const SCALE_TARGET_LABELS: Record<ScaleTargetEnum, string> = {
  [ScaleTargetEnum.WIDTH]: '缩放到宽度',
  [ScaleTargetEnum.HEIGHT]: '缩放到高度',
  [ScaleTargetEnum.FACTOR]: '按倍数缩放',
};

/** 常见标准宽高比 */
export interface StandardRatio {
  /** 比例宽度分量 */
  readonly width: number;
  /** 比例高度分量 */
  readonly height: number;
  /** 标准比例名称 */
  readonly name: string;
}

/** 常见标准宽高比参考表（含横屏与竖屏方向） */
export const STANDARD_RATIOS: readonly StandardRatio[] = [
  { width: 1, height: 1, name: '1:1（方形）' },
  { width: 4, height: 3, name: '4:3（传统显示器）' },
  { width: 3, height: 2, name: '3:2（胶片 / 相机）' },
  { width: 16, height: 10, name: '16:10（宽屏办公）' },
  { width: 16, height: 9, name: '16:9（全高清视频）' },
  { width: 21, height: 9, name: '21:9（超宽屏）' },
  { width: 9, height: 16, name: '9:16（竖屏短视频）' },
  { width: 2, height: 3, name: '2:3（竖版照片）' },
  { width: 3, height: 4, name: '3:4（竖版社交）' },
];

/** 化简模式默认宽度 */
export const DEFAULT_WIDTH = '1920';

/** 化简模式默认高度 */
export const DEFAULT_HEIGHT = '1080';

/** 知二求三模式默认比值文本 */
export const DEFAULT_RATIO_TEXT = '16:9';

/** 知二求三模式默认已知边长 */
export const DEFAULT_KNOWN_SIDE = '540';

/** 缩放模式默认缩放倍数 */
export const DEFAULT_SCALE_FACTOR = '0.5';

/** 判定为标准比例近似匹配的最大相对误差（1%） */
export const MATCH_TOLERANCE = 0.01;
