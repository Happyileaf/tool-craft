import type { FontFaceConfig, FontSource } from './utils/fontFace';

/** font-display 可选值及说明 */
export const FONT_DISPLAY_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'auto', label: 'auto', hint: '使用浏览器默认策略（通常类似 block）' },
  { value: 'block', label: 'block', hint: '短暂阻塞期后进入交换期，给字体更多加载时间' },
  { value: 'swap', label: 'swap', hint: '立即用回退字体显示，字体加载后交换（最常用）' },
  { value: 'fallback', label: 'fallback', hint: '极短阻塞期，加载失败则长期使用回退字体' },
  { value: 'optional', label: 'optional', hint: '由浏览器决定是否使用，适合非关键字体' },
];

/** font-style 可选值 */
export const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'normal（常规）' },
  { value: 'italic', label: 'italic（斜体）' },
  { value: 'oblique', label: 'oblique（倾斜）' },
];

/** 常见字体格式及对应 CSS format 提示 */
export const FONT_FORMAT_OPTIONS = [
  { value: 'woff2', label: 'woff2（推荐，压缩率最高）' },
  { value: 'woff', label: 'woff（兼容性好）' },
  { value: 'truetype', label: 'truetype（.ttf）' },
  { value: 'opentype', label: 'opentype（.otf）' },
  { value: 'embedded-opentype', label: 'embedded-opentype（.eot）' },
  { value: 'svg', label: 'svg（遗留方案）' },
];

/** 常用字重 */
export const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: '100 Thin' },
  { value: '300', label: '300 Light' },
  { value: '400', label: '400 Regular' },
  { value: '500', label: '500 Medium' },
  { value: '700', label: '700 Bold' },
  { value: '900', label: '900 Black' },
  { value: 'normal', label: 'normal' },
  { value: 'bold', label: 'bold' },
];

const defaultSources: FontSource[] = [
  { url: '/fonts/MyFont-Regular.woff2', format: 'woff2' },
  { url: '/fonts/MyFont-Regular.woff', format: 'woff' },
  { url: '/fonts/MyFont-Regular.ttf', format: 'truetype' },
];

/** 初始示例：常规 + 粗体两个字重 */
export const DEFAULT_FONT_FACES: FontFaceConfig[] = [
  {
    family: 'MyFont',
    weight: '400',
    style: 'normal',
    display: 'swap',
    sources: defaultSources,
    unicodeRange: '',
  },
  {
    family: 'MyFont',
    weight: '700',
    style: 'normal',
    display: 'swap',
    sources: [
      { url: '/fonts/MyFont-Bold.woff2', format: 'woff2' },
      { url: '/fonts/MyFont-Bold.woff', format: 'woff' },
      { url: '/fonts/MyFont-Bold.ttf', format: 'truetype' },
    ],
    unicodeRange: '',
  },
];

/** 新增一条空白字重时的默认值 */
export const createEmptyFace = (family: string): FontFaceConfig => ({
  family,
  weight: '400',
  style: 'normal',
  display: 'swap',
  sources: [{ url: '', format: 'woff2' }],
  unicodeRange: '',
});
