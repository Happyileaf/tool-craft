/**
 * JSON 缩进模式枚举
 */
export enum JsonIndentEnum {
  /** 每层缩进两个空格 */
  TwoSpace = 'TwoSpace',
  /** 每层缩进四个空格 */
  FourSpace = 'FourSpace',
  /** 去除全部空白压缩为单行 */
  Minify = 'Minify',
}

/**
 * JSON 缩进模式名称 Map
 */
export const JsonIndentLabelMap = {
  /** 每层缩进两个空格 */
  [JsonIndentEnum.TwoSpace]: '2 格空格',
  /** 每层缩进四个空格 */
  [JsonIndentEnum.FourSpace]: '4 格空格',
  /** 去除全部空白压缩为单行 */
  [JsonIndentEnum.Minify]: '单行压缩 (Minify)',
};

/**
 * JSON 缩进模式选项数据源
 */
export const JsonIndentOptions = [
  {
    label: JsonIndentLabelMap[JsonIndentEnum.TwoSpace],
    value: JsonIndentEnum.TwoSpace,
  },
  {
    label: JsonIndentLabelMap[JsonIndentEnum.FourSpace],
    value: JsonIndentEnum.FourSpace,
  },
  {
    label: JsonIndentLabelMap[JsonIndentEnum.Minify],
    value: JsonIndentEnum.Minify,
  },
];

/**
 * 缩进模式到实际空格数的映射，Minify 对应 0 表示单行压缩
 */
export const JsonIndentSpaceMap: Record<JsonIndentEnum, number> = {
  [JsonIndentEnum.TwoSpace]: 2,
  [JsonIndentEnum.FourSpace]: 4,
  [JsonIndentEnum.Minify]: 0,
};

/**
 * 载入示例时回填的示例对象，覆盖对象、数组、嵌套对象与布尔值等常见结构
 */
export const JSON_SAMPLE_VALUE = {
  project: 'ToolCraft Web Tools',
  version: '2.4.0',
  description: '现代化极简在线工具箱',
  features: [
    '纯浏览器本地运算，保护隐私',
    '无网络延迟，毫秒级响应',
    '支持全量工具搜索与快捷键',
  ],
  metrics: {
    totalTools: 48,
    activeCategories: 8,
    memoryUsage: '12MB',
    isProductionReady: true,
  },
  tags: ['tool', 'utility', 'developer', 'design'],
};

/** 示例对象序列化后的两空格缩进文本，点击「载入示例」时直接填入输入区 */
export const JSON_SAMPLE_TEXT = JSON.stringify(JSON_SAMPLE_VALUE, null, 2);
