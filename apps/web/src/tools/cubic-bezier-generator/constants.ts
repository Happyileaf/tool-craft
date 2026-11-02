/**
 * cubic-bezier 生成器常量
 */
import { BEZIER_PRESETS, type BezierControlPoints } from './utils/bezier';

/** 初始控制点（ease） */
export const DEFAULT_POINTS: BezierControlPoints = { ...(BEZIER_PRESETS.ease as BezierControlPoints) };

/** 预设展示顺序与中文名 */
export const PRESET_ITEMS: { key: string; label: string }[] = [
  { key: 'linear', label: 'linear' },
  { key: 'ease', label: 'ease' },
  { key: 'ease-in', label: 'ease-in' },
  { key: 'ease-out', label: 'ease-out' },
  { key: 'ease-in-out', label: 'ease-in-out' },
  { key: 'ease-in-back', label: 'easeInBack' },
  { key: 'ease-out-back', label: 'easeOutBack' },
];

/** SVG 画布尺寸 */
export const PLOT_SIZE = 320;
export const PLOT_PADDING = 30;

/** y 轴可视范围（容纳过冲） */
export const Y_MIN = -0.8;
export const Y_MAX = 1.8;
