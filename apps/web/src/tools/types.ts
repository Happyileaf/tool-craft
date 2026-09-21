import type { ToolCategoryEnum, ToolProcessingEnum } from './constants';

/**
 * 工具元数据接口，描述站点中每个工具的注册信息
 */
export interface ToolMeta {
  /** 工具的唯一短标识，用于路由地址与按标识检索 */
  slug: string;
  /** 展示给用户的工具名称 */
  name: string;
  /** 一句话说明工具的用途与能力 */
  description: string;
  /** 工具所属的内容分类，取值范围以分类枚举为准 */
  category: ToolCategoryEnum;
  /** 工具页面在应用内的访问路径 */
  path: string;
  /** 图标标识，对应前端图标体系中的具体图标 */
  icon?: string;
  /** 检索与筛选使用的关键词标签集合 */
  tags?: string[];
  /** 处理逻辑的运行载体，取值范围以处理方式枚举为准：主线程、Web Worker 或 WebAssembly */
  processing: ToolProcessingEnum;
}
