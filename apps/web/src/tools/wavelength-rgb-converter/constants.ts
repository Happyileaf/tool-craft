/**
 * 可见光波长 → RGB/HEX 转换器常量
 *
 * 可见光谱按 Dan Bruton 经典近似算法划分为六段插值区间，
 * 本文件同时固定光谱区间中文名与边界归属，保证纯函数可断言。
 */

/** 可见光谱下限（nm，含），低于该值视为近紫外 */
export const VISIBLE_MIN_NM = 380;

/** 可见光谱上限（nm，含），高于该值视为近红外 */
export const VISIBLE_MAX_NM = 750;

/** 界面输入控件下限（nm），延伸至紫外侧以便演示越界提示 */
export const UI_MIN_NM = 300;

/** 界面输入控件上限（nm），延伸至红外侧以便演示越界提示 */
export const UI_MAX_NM = 850;

/** 默认 gamma 校正指数（与经典算法参考实现一致，固定写死） */
export const DEFAULT_GAMMA = 0.8;

/** 渐变色带离散采样步长（nm） */
export const GRADIENT_STEP_NM = 10;

/** 近紫外区间名 */
export const BAND_NEAR_UV = '近紫外';

/** 近红外区间名 */
export const BAND_NEAR_IR = '近红外';

/** 光谱区间定义（边界归属高频段，与六段插值条件一致） */
export interface SpectralBandDef {
  /** 区间标识 */
  key: string;
  /** 中文区间名 */
  label: string;
  /** 下限波长（nm，含） */
  min: number;
  /** 上限波长（nm，展示按含端点；匹配时除红光段外按左闭右开） */
  max: number;
  /** antd Tag 配色 */
  tagColor: string;
}

/**
 * 可见光谱区间常量表
 *
 * 分界点（440 / 490 / 510 / 580 / 645nm）归属高频一侧，
 * 与 spectrum.ts 六段线性插值的分段条件保持一致。
 */
export const SPECTRAL_BANDS: SpectralBandDef[] = [
  { key: 'violet', label: '紫', min: 380, max: 440, tagColor: 'purple' },
  { key: 'blue', label: '蓝', min: 440, max: 490, tagColor: 'blue' },
  { key: 'cyan', label: '青', min: 490, max: 510, tagColor: 'cyan' },
  { key: 'green', label: '绿', min: 510, max: 580, tagColor: 'green' },
  { key: 'yellow', label: '黄', min: 580, max: 600, tagColor: 'gold' },
  { key: 'orange', label: '橙', min: 600, max: 645, tagColor: 'orange' },
  { key: 'red', label: '红', min: 645, max: 750, tagColor: 'red' },
];

/** 波长快捷预设 */
export interface WavelengthPreset {
  /** 预设名称 */
  label: string;
  /** 波长值（nm） */
  value: number;
}

/** 常见激光 / LED 波长与越界演示预设 */
export const WAVELENGTH_PRESETS: WavelengthPreset[] = [
  { label: '405nm 紫激光', value: 405 },
  { label: '450nm 蓝光', value: 450 },
  { label: '532nm 绿激光', value: 532 },
  { label: '589nm 钠黄光', value: 589 },
  { label: '650nm 红激光', value: 650 },
  { label: '350nm 近紫外（越界）', value: 350 },
  { label: '800nm 近红外（越界）', value: 800 },
];

/** 批量模式示例输入 */
export const BATCH_SAMPLE_INPUT = '532\n450\n\n700，589,abc\n800';
