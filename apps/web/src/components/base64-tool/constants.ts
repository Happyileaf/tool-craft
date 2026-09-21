/**
 * Base64 工具模式枚举
 * 枚举值仅作为页面内部状态标识，能力调用经 BASE64_MODE_CAPABILITY_ID_MAP 换取能力 id
 */
enum Base64ModeEnum {
  /** 编码：将文本转换为 Base64 字符串 */
  Encode = 'encode',
  /** 解码：将 Base64 字符串还原为文本 */
  Decode = 'decode',
}

/**
 * Base64 工具模式名称Map
 */
const Base64ModeLabelMap = {
  /** 编码模式的展示文案 */
  [Base64ModeEnum.Encode]: '编码（文本 → Base64）',
  /** 解码模式的展示文案 */
  [Base64ModeEnum.Decode]: '解码（Base64 → 文本）',
};

/**
 * Base64 工具模式选项数据源
 */
const Base64ModeOptions = [
  {
    label: Base64ModeLabelMap[Base64ModeEnum.Encode],
    value: Base64ModeEnum.Encode,
  },
  {
    label: Base64ModeLabelMap[Base64ModeEnum.Decode],
    value: Base64ModeEnum.Decode,
  },
];

/**
 * 模式到能力 id 的映射
 * 编码与解码是两个独立能力，由本页面按当前模式切换调用
 */
const BASE64_MODE_CAPABILITY_ID_MAP: Record<Base64ModeEnum, string> = {
  [Base64ModeEnum.Encode]: 'text.base64-encode',
  [Base64ModeEnum.Decode]: 'text.base64-decode',
};

export { Base64ModeEnum, Base64ModeLabelMap, Base64ModeOptions, BASE64_MODE_CAPABILITY_ID_MAP };
