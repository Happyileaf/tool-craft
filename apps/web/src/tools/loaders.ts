import type { ComponentType } from 'react';

/**
 * 工具实现的懒加载映射，键为工具 slug，值为返回工具组件模块的动态导入函数；
 * 各工具在后续任务中按需补充条目，未登记的工具视为尚未提供页面实现
 */
export const toolLoaders: Record<string, () => Promise<{ default: ComponentType }>> =
  {
    'json-formatter': () => import('./json-formatter'),
  };
