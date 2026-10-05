import type { ComponentType } from 'react';

/**
 * 工具实现组件的统一属性，defaultInput 为可选的默认样例输入
 */
export interface ToolComponentProps {
  /** 工具首次载入时填入的样例内容 */
  defaultInput?: string;
}

/**
 * 工具实现的懒加载映射，键为工具 slug，值为返回工具组件模块的动态导入函数；
 * 未登记的工具视为尚未提供页面实现
 */
export const toolLoaders: Record<
  string,
  () => Promise<{ default: ComponentType<ToolComponentProps> }>
> = {
  'json-formatter': () => import('./json-formatter'),
  'image-resizer': () => import('./image-resizer'),
  'text-diff': () => import('./text-diff'),
  'regex-tester': () => import('./regex-tester'),
  'base64-codec': () => import('./base64-codec'),
  'color-palette': () => import('./color-palette'),
  'timestamp-converter': () => import('./timestamp-converter'),
  'markdown-preview': () => import('./markdown-preview'),
  'hash-generator': () => import('./hash-generator'),
  'qr-generator': () => import('./qr-generator'),
  'word-count': () => import('./word-count'),
  'yaml-to-json': () => import('./yaml-to-json'),
  'uuid-generator': () => import('./uuid-generator'),
  'strong-password-generator': () => import('./strong-password-generator'),
  'password-strength-checker': () => import('./password-strength-checker'),
  'jwt-parser': () => import('./jwt-parser'),
  'crc32-checksum': () => import('./crc32-checksum'),
  'bcrypt-hash': () => import('./bcrypt-hash'),
  'symmetric-crypto': () => import('./symmetric-crypto'),
  'image-color-extractor': () => import('./image-color-extractor'),
  'gradient-generator': () => import('./gradient-generator'),
  'oklch-workbench': () => import('./oklch-workbench'),
  'color-harmony': () => import('./color-harmony'),
  'dark-mode-converter': () => import('./dark-mode-converter'),
  'color-mixer': () => import('./color-mixer'),
  'box-shadow-generator': () => import('./box-shadow-generator'),
  'color-naming-token': () => import('./color-naming-token'),
  'color-blind-simulator': () => import('./color-blind-simulator'),
  'css-filter-generator': () => import('./css-filter-generator'),
  'csv-json-converter': () => import('./csv-json-converter'),
  'css-prefixer': () => import('./css-prefixer'),
  'regex-generator': () => import('./regex-generator'),
  'url-codec': () => import('./url-codec'),
};
