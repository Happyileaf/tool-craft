/**
 * 屏幕 PPI 计算器常量
 */

/** 默认分辨率：1920 × 1080 */
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;

/** 默认对角线：24 英寸 */
export const DEFAULT_DIAGONAL_INCH = 24;

/** 常见屏幕预设 */
export interface ScreenPreset {
  /** 设备名 */
  name: string;
  /** 横向像素 */
  width: number;
  /** 纵向像素 */
  height: number;
  /** 对角线（英寸） */
  diagonal: number;
}

/** 一键填充的常见设备参数 */
export const SCREEN_PRESETS: ScreenPreset[] = [
  { name: '24" 1080p', width: 1920, height: 1080, diagonal: 24 },
  { name: '27" 1440p', width: 2560, height: 1440, diagonal: 27 },
  { name: '27" 4K', width: 3840, height: 2160, diagonal: 27 },
  { name: 'iPhone 15（6.1"）', width: 1179, height: 2556, diagonal: 6.1 },
  { name: '13" MacBook Air（2024）', width: 1470, height: 956, diagonal: 13.6 },
];
