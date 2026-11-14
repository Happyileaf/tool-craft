/**
 * 轮胎规格计算器工具内常量
 */

/** 默认原厂轮胎规格 */
export const DEFAULT_ORIGINAL_SPEC = '205/55R16';

/** 默认替换轮胎规格 */
export const DEFAULT_REPLACEMENT_SPEC = '225/45R17';

/** 默认表显车速（km/h） */
export const DEFAULT_INDICATED_SPEED = 100;

/** 推荐的轮胎外径变化容差（±3%） */
export const DIAMETER_TOLERANCE_PERCENT = 3;

/** 常见升级预设，便于快速填充替换规格 */
export interface TirePreset {
  /** 预设名称 */
  readonly label: string;
  /** 原厂规格 */
  readonly original: string;
  /** 替换规格 */
  readonly replacement: string;
}

/** 常见轮胎升级预设 */
export const TIRE_PRESETS: readonly TirePreset[] = [
  { label: '205/55R16 → 225/45R17', original: '205/55R16', replacement: '225/45R17' },
  { label: '215/60R16 → 215/55R17', original: '215/60R16', replacement: '215/55R17' },
  { label: '195/65R15 → 205/55R16', original: '195/65R15', replacement: '205/55R16' },
  { label: '235/45R18 → 245/40R19', original: '235/45R18', replacement: '245/40R19' },
  { label: '265/70R17 → 285/70R17', original: '265/70R17', replacement: '285/70R17' },
];
