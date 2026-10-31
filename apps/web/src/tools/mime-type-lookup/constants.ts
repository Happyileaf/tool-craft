/**
 * MIME 类型速查工具常量
 */
import type { MimePrimaryType } from './utils/mime';

/** 主类型筛选项 */
export const PRIMARY_OPTIONS: { label: string; value: MimePrimaryType | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: 'text 文本', value: 'text' },
  { label: 'image 图像', value: 'image' },
  { label: 'audio 音频', value: 'audio' },
  { label: 'video 视频', value: 'video' },
  { label: 'font 字体', value: 'font' },
  { label: 'model 模型', value: 'model' },
  { label: 'application 应用', value: 'application' },
  { label: 'multipart 多部分', value: 'multipart' },
];

/** 主类型展示顺序 */
export const PRIMARY_ORDER: MimePrimaryType[] = [
  'text',
  'image',
  'audio',
  'video',
  'font',
  'model',
  'application',
  'multipart',
];

/** 主类型中文标题 */
export const PRIMARY_TITLE: Record<MimePrimaryType, string> = {
  text: 'text 文本',
  image: 'image 图像',
  audio: 'audio 音频',
  video: 'video 视频',
  font: 'font 字体',
  model: 'model 模型',
  application: 'application 应用数据',
  multipart: 'multipart 多部分',
};

/** 主类型标签颜色（antd Tag 内置色板） */
export const PRIMARY_TAG_COLOR: Record<MimePrimaryType, string> = {
  text: 'blue',
  image: 'green',
  audio: 'orange',
  video: 'volcano',
  font: 'purple',
  model: 'geekblue',
  application: 'gold',
  multipart: 'cyan',
};

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER =
  '输入扩展名（.jpg、json）或 MIME（image/webp），也可搜 图片、pdf、字体';
