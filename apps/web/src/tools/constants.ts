/**
 * 工具分类枚举，覆盖站点提供的全部工具类别
 */
export enum ToolCategoryEnum {
  /** 图像生成与图像处理类工具 */
  IMAGE = 'image',
  /** 文本生成与文本加工类工具 */
  TEXT = 'text',
  /** 面向研发人员的编码与调试类工具 */
  DEVELOPER = 'developer',
  /** 设计创意与视觉制作类工具 */
  DESIGN = 'design',
  /** 文件转换与文件处理类工具 */
  FILE = 'file',
  /** 数据分析与数据处理类工具 */
  DATA = 'data',
  /** 无法归入上述类目的其他工具 */
  OTHER = 'other',
}

/**
 * 工具分类名称 Map，键为分类枚举值，值为面向用户展示的中文分类名
 */
export const ToolCategoryLabelMap: Record<ToolCategoryEnum, string> = {
  /** 图像类目 */
  [ToolCategoryEnum.IMAGE]: '图片',
  /** 文本类目 */
  [ToolCategoryEnum.TEXT]: '文本',
  /** 开发者类目 */
  [ToolCategoryEnum.DEVELOPER]: '开发者',
  /** 设计类目 */
  [ToolCategoryEnum.DESIGN]: '设计',
  /** 文件类目 */
  [ToolCategoryEnum.FILE]: '文件',
  /** 数据类目 */
  [ToolCategoryEnum.DATA]: '数据',
  /** 其他类目 */
  [ToolCategoryEnum.OTHER]: '其他',
};

/**
 * 工具分类选项数据源，顺序与分类枚举定义顺序保持一致，供分类导航与筛选场景使用
 */
export const ToolCategoryOptions = [
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.IMAGE],
    value: ToolCategoryEnum.IMAGE,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.TEXT],
    value: ToolCategoryEnum.TEXT,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.DEVELOPER],
    value: ToolCategoryEnum.DEVELOPER,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.DESIGN],
    value: ToolCategoryEnum.DESIGN,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.FILE],
    value: ToolCategoryEnum.FILE,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.DATA],
    value: ToolCategoryEnum.DATA,
  },
  {
    label: ToolCategoryLabelMap[ToolCategoryEnum.OTHER],
    value: ToolCategoryEnum.OTHER,
  },
];

/**
 * 工具处理方式枚举，描述工具核心逻辑的运行载体
 */
export enum ToolProcessingEnum {
  /** 在浏览器主线程中直接执行 */
  MAINTHREAD = 'mainthread',
  /** 通过 Web Worker 在独立线程中执行 */
  WORKER = 'worker',
  /** 通过 WebAssembly 执行编译后的字节码 */
  WASM = 'wasm',
}

/**
 * 工具处理方式名称 Map，键为处理方式枚举值，值为面向用户展示的中文说明
 */
export const ToolProcessingLabelMap: Record<ToolProcessingEnum, string> = {
  /** 主线程执行 */
  [ToolProcessingEnum.MAINTHREAD]: '主线程',
  /** Worker 线程执行 */
  [ToolProcessingEnum.WORKER]: 'Web Worker',
  /** WebAssembly 执行 */
  [ToolProcessingEnum.WASM]: 'WebAssembly',
};

/**
 * 工具处理方式选项数据源，顺序与处理方式枚举定义顺序保持一致
 */
export const ToolProcessingOptions = [
  {
    label: ToolProcessingLabelMap[ToolProcessingEnum.MAINTHREAD],
    value: ToolProcessingEnum.MAINTHREAD,
  },
  {
    label: ToolProcessingLabelMap[ToolProcessingEnum.WORKER],
    value: ToolProcessingEnum.WORKER,
  },
  {
    label: ToolProcessingLabelMap[ToolProcessingEnum.WASM],
    value: ToolProcessingEnum.WASM,
  },
];
