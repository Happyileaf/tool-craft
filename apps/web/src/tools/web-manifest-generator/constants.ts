/**
 * Web App Manifest 生成器内常量：枚举选项、图标建议尺寸与示例数据
 */

import {
  DIR_VALUES,
  DISPLAY_VALUES,
  ORIENTATION_VALUES,
  PURPOSE_VALUES,
  type ManifestForm,
  type ManifestIcon,
  type ManifestShortcut,
} from './utils/manifest';

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

/** display 下拉选项（含空值） */
export const DISPLAY_OPTIONS = [
  { value: '', label: '不设置' },
  ...toOptions(DISPLAY_VALUES),
];

/** orientation 下拉选项（含空值） */
export const ORIENTATION_OPTIONS = [
  { value: '', label: '不设置' },
  ...toOptions(ORIENTATION_VALUES),
];

/** dir 下拉选项（含空值） */
export const DIR_OPTIONS = [
  { value: '', label: '不设置' },
  ...toOptions(DIR_VALUES),
];

/** purpose 复选选项 */
export const PURPOSE_OPTIONS = toOptions(PURPOSE_VALUES);

/** 推荐图标尺寸快捷填充 */
export const ICON_SIZE_PRESETS = ['192x192', '512x512', 'any'];

/** 新建空白图标行 */
export function createEmptyIcon(): ManifestIcon {
  return { src: '', sizes: '', type: '', purposes: [] };
}

/** 新建空白快捷方式 */
export function createEmptyShortcut(): ManifestShortcut {
  return { name: '', shortName: '', url: '', iconSrc: '', iconSizes: '' };
}

/** 默认示例表单 */
export const DEFAULT_FORM: ManifestForm = {
  name: 'ToolCraft 工具集',
  shortName: 'ToolCraft',
  description: '纯浏览器本地运行的开发者工具集合',
  startUrl: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  themeColor: '#0f172a',
  backgroundColor: '#ffffff',
  lang: 'zh-CN',
  dir: 'auto',
  id: '/',
  categories: 'productivity,developer',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purposes: ['any'] },
    {
      src: '/icons/icon-512-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purposes: ['maskable'],
    },
  ],
  shortcuts: [
    { name: 'JSON 格式化', shortName: 'JSON', url: '/tools/json-formatter', iconSrc: '', iconSizes: '' },
  ],
};
