import type { ToolCategoryEnum, ToolProcessingEnum } from './constants';

/**
 * 工具常见问题条目
 */
export interface ToolFaq {
  /** 面向用户展示的问题 */
  question: string;
  /** 面向用户展示的解答 */
  answer: string;
}

/**
 * 工具文档信息，承载说明、特性、步骤、场景、隐私声明与常见问题等双语内容
 */
export interface ToolDocInfo {
  /** 工具定位与能力概述 */
  whatIsIt: string;
  /** 核心特性条目集合 */
  coreFeatures: string[];
  /** 标准使用步骤集合 */
  howToUse: string[];
  /** 典型使用场景集合 */
  useCases: string[];
  /** 隐私保护说明 */
  privacyNote: string;
  /** 常见问题条目集合 */
  faqs: ToolFaq[];
}

/**
 * 工具双语文档信息，按语言提供完整文档内容
 */
export interface ToolBilingualDoc {
  /** 中文文档内容 */
  zh: ToolDocInfo;
  /** 英文文档内容 */
  en: ToolDocInfo;
}

/**
 * 工具元数据接口，描述站点中每个工具的注册信息
 */
export interface ToolMeta {
  /** 工具的唯一短标识，用于路由地址与按标识检索 */
  slug: string;
  /** 中文工具名称 */
  name: string;
  /** 英文工具名称 */
  nameEn: string;
  /** 中文一句话说明工具的用途与能力 */
  description: string;
  /** 英文一句话说明工具的用途与能力 */
  descriptionEn: string;
  /** 工具所属的内容分类，取值范围以分类枚举为准，不使用聚合枚举 ALL */
  category: Exclude<ToolCategoryEnum, ToolCategoryEnum.ALL>;
  /** 工具页面在应用内的访问路径 */
  path: string;
  /** 图标标识，对应前端图标体系中的具体图标 */
  iconName: string;
  /** 中文检索与筛选使用的关键词标签集合 */
  tags: string[];
  /** 英文检索与筛选使用的关键词标签集合 */
  tagsEn: string[];
  /** 是否为热门工具 */
  isPopular: boolean;
  /** 是否为新上线工具 */
  isNew: boolean;
  /** 处理逻辑的运行载体，取值范围以处理方式枚举为准：主线程、Web Worker 或 WebAssembly */
  processing: ToolProcessingEnum;
  /** 双语文档信息 */
  doc: ToolBilingualDoc;
  /** 默认载入的样例输入 */
  defaultSampleInput?: string;
}
