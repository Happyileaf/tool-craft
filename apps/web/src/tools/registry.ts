import { ToolCategoryEnum, ToolProcessingEnum } from './constants';
import type { ToolMeta } from './types';

/**
 * 已注册工具的元数据集合，工具条目在后续任务中逐步补充
 */
export const tools: ToolMeta[] = [
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    description: '在浏览器本地格式化、校验 JSON 数据',
    category: ToolCategoryEnum.DEVELOPER,
    path: '/tools/json-formatter',
    processing: ToolProcessingEnum.MAINTHREAD,
    tags: ['json', '格式化', '校验'],
  },
];

/**
 * 根据工具短标识查找对应的工具元数据
 *
 * @param slug - 工具的唯一短标识
 * @returns 匹配的工具元数据；不存在时返回 undefined
 */
export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * 获取指定分类下的全部工具
 *
 * @param category - 工具分类
 * @returns 属于该分类的工具元数据集合
 */
export function getToolsByCategory(category: ToolMeta['category']) {
  return tools.filter((tool) => tool.category === category);
}
