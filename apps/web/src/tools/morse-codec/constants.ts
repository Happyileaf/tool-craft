/**
 * 摩尔斯电码编解码工具内常量
 */
import {
  DEFAULT_CHAR_GAP_UNITS,
  DEFAULT_WORD_GAP_UNITS,
  encodeMorse,
} from './utils/morse';

/** 转换方向 */
export enum CodecModeEnum {
  /** 普通文本编码为摩尔斯电码 */
  ENCODE = 'encode',
  /** 摩尔斯电码解码为普通文本 */
  DECODE = 'decode',
}

/** 转换方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本 → 摩尔斯）', value: CodecModeEnum.ENCODE },
  { label: '解码（摩尔斯 → 文本）', value: CodecModeEnum.DECODE },
];

/** 编码方向的默认示例文本 */
export const DEFAULT_TEXT = 'SOS MORSE CODE 1844';

/** 解码方向的默认示例电码（由示例文本按标准间隔编码生成，保证向量合法） */
export const DEFAULT_MORSE =
  encodeMorse(DEFAULT_TEXT, {
    charGapUnits: DEFAULT_CHAR_GAP_UNITS,
    wordGapUnits: DEFAULT_WORD_GAP_UNITS,
  }).output ?? '';

/** 播放速度预设：点长（毫秒） */
export const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: '慢速 120ms/点', value: 120 },
  { label: '标准 80ms/点', value: 80 },
  { label: '快速 50ms/点', value: 50 },
];

/** 默认点长（毫秒） */
export const DEFAULT_DOT_MS = 80;

/** 默认音调频率（赫兹） */
export const DEFAULT_TONE_HZ = 600;
