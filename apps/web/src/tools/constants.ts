/**
 * 工具分类枚举，覆盖站点提供的全部工具类别；ALL 仅用于聚合筛选，不对应具体工具分类
 */
export enum ToolCategoryEnum {
  /** 全部工具聚合视图 */
  ALL = 'all',
  /** 数据处理与 JSON 类工具 */
  DATA_JSON = 'data-json',
  /** 文本加工与内容排版类工具 */
  TEXT_CONTENT = 'text-content',
  /** 图像处理与媒体类工具 */
  IMAGE_MEDIA = 'image-media',
  /** 面向研发人员的编码与调试类工具 */
  DEV_CODE = 'dev-code',
  /** 编解码与密码学类工具 */
  CRYPTO_ENCODING = 'crypto-encoding',
  /** 设计创意与颜色类工具 */
  DESIGN_COLOR = 'design-color',
  /** 时间与计算类工具 */
  TIME_MATH = 'time-math',
}

/**
 * 工具分类中文名称 Map，键为分类枚举值，值为面向用户展示的中文分类名
 */
export const ToolCategoryLabelMap: Record<ToolCategoryEnum, string> = {
  /** 聚合视图 */
  [ToolCategoryEnum.ALL]: '全部工具',
  /** 数据与 JSON 类目 */
  [ToolCategoryEnum.DATA_JSON]: '数据与 JSON',
  /** 文本与排版类目 */
  [ToolCategoryEnum.TEXT_CONTENT]: '文本与排版',
  /** 图像与媒体类目 */
  [ToolCategoryEnum.IMAGE_MEDIA]: '图像与媒体',
  /** 开发与调试类目 */
  [ToolCategoryEnum.DEV_CODE]: '开发与调试',
  /** 编码与加密类目 */
  [ToolCategoryEnum.CRYPTO_ENCODING]: '编码与加密',
  /** 设计与颜色类目 */
  [ToolCategoryEnum.DESIGN_COLOR]: '设计与颜色',
  /** 时间与计算类目 */
  [ToolCategoryEnum.TIME_MATH]: '时间与计算',
};

/**
 * 工具分类英文名称 Map，键为分类枚举值，值为面向用户展示的英文分类名
 */
export const ToolCategoryEnLabelMap: Record<ToolCategoryEnum, string> = {
  /** 聚合视图 */
  [ToolCategoryEnum.ALL]: 'All Tools',
  /** 数据与 JSON 类目 */
  [ToolCategoryEnum.DATA_JSON]: 'Data & JSON',
  /** 文本与排版类目 */
  [ToolCategoryEnum.TEXT_CONTENT]: 'Text & Content',
  /** 图像与媒体类目 */
  [ToolCategoryEnum.IMAGE_MEDIA]: 'Image & Media',
  /** 开发与调试类目 */
  [ToolCategoryEnum.DEV_CODE]: 'Dev & Coding',
  /** 编码与加密类目 */
  [ToolCategoryEnum.CRYPTO_ENCODING]: 'Encoding & Crypto',
  /** 设计与颜色类目 */
  [ToolCategoryEnum.DESIGN_COLOR]: 'Design & Color',
  /** 时间与计算类目 */
  [ToolCategoryEnum.TIME_MATH]: 'Time & Calc',
};

/**
 * 工具分类图标名 Map，键为分类枚举值，值为图标体系中的具体图标标识
 */
export const ToolCategoryIconMap: Record<ToolCategoryEnum, string> = {
  /** 聚合视图 */
  [ToolCategoryEnum.ALL]: 'LayoutGrid',
  /** 数据与 JSON 类目 */
  [ToolCategoryEnum.DATA_JSON]: 'Braces',
  /** 文本与排版类目 */
  [ToolCategoryEnum.TEXT_CONTENT]: 'FileText',
  /** 图像与媒体类目 */
  [ToolCategoryEnum.IMAGE_MEDIA]: 'Image',
  /** 开发与调试类目 */
  [ToolCategoryEnum.DEV_CODE]: 'Code',
  /** 编码与加密类目 */
  [ToolCategoryEnum.CRYPTO_ENCODING]: 'ShieldCheck',
  /** 设计与颜色类目 */
  [ToolCategoryEnum.DESIGN_COLOR]: 'Palette',
  /** 时间与计算类目 */
  [ToolCategoryEnum.TIME_MATH]: 'Clock',
};

/**
 * 工具分类中文描述 Map，键为分类枚举值，值为一句话说明该分类能力的中文文案
 */
export const ToolCategoryDescriptionMap: Record<ToolCategoryEnum, string> = {
  /** 聚合视图 */
  [ToolCategoryEnum.ALL]: '浏览全站所有在线效率与转换工具',
  /** 数据与 JSON 类目 */
  [ToolCategoryEnum.DATA_JSON]: 'JSON 校验、树状查看、格式化与数据结构转换',
  /** 文本与排版类目 */
  [ToolCategoryEnum.TEXT_CONTENT]: '文本差异对比、Markdown 预览、字数统计与清洗',
  /** 图像与媒体类目 */
  [ToolCategoryEnum.IMAGE_MEDIA]: '在线图片压缩、格式转换、比例裁剪与尺寸调整',
  /** 开发与调试类目 */
  [ToolCategoryEnum.DEV_CODE]: '正则表达式测试、代码美化与开发调试常用辅助',
  /** 编码与加密类目 */
  [ToolCategoryEnum.CRYPTO_ENCODING]: 'Base64、URL 编解码、散列哈希与安全校验',
  /** 设计与颜色类目 */
  [ToolCategoryEnum.DESIGN_COLOR]: '调色板生成、WCAG 无障碍对比度与色彩空间转换',
  /** 时间与计算类目 */
  [ToolCategoryEnum.TIME_MATH]: 'Unix 时间戳互转、多时区对照与日常度量转换',
};

/**
 * 工具分类英文描述 Map，键为分类枚举值，值为一句话说明该分类能力的英文文案
 */
export const ToolCategoryEnDescriptionMap: Record<ToolCategoryEnum, string> = {
  /** 聚合视图 */
  [ToolCategoryEnum.ALL]: 'Browse every online productivity and conversion tool on the site',
  /** 数据与 JSON 类目 */
  [ToolCategoryEnum.DATA_JSON]: 'JSON validation, tree view, formatting, and data structure conversion',
  /** 文本与排版类目 */
  [ToolCategoryEnum.TEXT_CONTENT]: 'Text diff, Markdown preview, word count, and text cleaning',
  /** 图像与媒体类目 */
  [ToolCategoryEnum.IMAGE_MEDIA]: 'In-browser image compression, format conversion, cropping, and resizing',
  /** 开发与调试类目 */
  [ToolCategoryEnum.DEV_CODE]: 'Regex testing, code beautifying, and everyday debugging helpers',
  /** 编码与加密类目 */
  [ToolCategoryEnum.CRYPTO_ENCODING]: 'Base64, URL codec, hash digests, and security checks',
  /** 设计与颜色类目 */
  [ToolCategoryEnum.DESIGN_COLOR]: 'Palette generation, WCAG contrast checks, and color space conversion',
  /** 时间与计算类目 */
  [ToolCategoryEnum.TIME_MATH]: 'Unix timestamp conversion, multi-timezone reference, and everyday calc',
};

/**
 * 工具分类选项数据源，顺序与分类枚举定义顺序保持一致，供分类导航与筛选场景使用
 */
export const ToolCategoryOptions = Object.values(ToolCategoryEnum).map((value) => ({
  label: ToolCategoryLabelMap[value],
  value,
}));

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
