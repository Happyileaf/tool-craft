/**
 * 编解码方案枚举
 */
export enum CodecModeEnum {
  /** 标准 Base64 */
  BASE64 = 'base64',
  /** URL 百分号编码 */
  URL = 'url',
  /** 十六进制字节编码 */
  HEX = 'hex',
}

/**
 * 转换方向枚举
 */
export enum CodecDirectionEnum {
  /** 原文编码为密串 */
  ENCODE = 'encode',
  /** 密串解码为原文 */
  DECODE = 'decode',
}

/**
 * 编解码方案对应的国际化文案键，键为方案枚举值，值为点分文案路径
 */
export const CodecModeLabelKeyMap: Record<CodecModeEnum, string> = {
  /** 标准 Base64 文案键 */
  [CodecModeEnum.BASE64]: 'tools.base64.modeBase64',
  /** URL 编码文案键 */
  [CodecModeEnum.URL]: 'tools.base64.modeUrl',
  /** 十六进制文案键 */
  [CodecModeEnum.HEX]: 'tools.base64.modeHex',
};

/**
 * 转换方向对应的国际化文案键，键为方向枚举值，值为点分文案路径
 */
export const CodecDirectionLabelKeyMap: Record<
  CodecModeEnum,
  Record<CodecDirectionEnum, string>
> = {
  /** Base64 方案下的方向文案键 */
  [CodecModeEnum.BASE64]: {
    [CodecDirectionEnum.ENCODE]: 'tools.base64.modeEncode',
    [CodecDirectionEnum.DECODE]: 'tools.base64.modeDecode',
  },
  /** URL 方案下的方向文案键 */
  [CodecModeEnum.URL]: {
    [CodecDirectionEnum.ENCODE]: 'tools.base64.modeUrlEncode',
    [CodecDirectionEnum.DECODE]: 'tools.base64.modeUrlDecode',
  },
  /** HEX 方案下的方向文案键 */
  [CodecModeEnum.HEX]: {
    [CodecDirectionEnum.ENCODE]: 'tools.base64.modeHexEncode',
    [CodecDirectionEnum.DECODE]: 'tools.base64.modeHexDecode',
  },
};

/**
 * 工具首次载入时填入的样例原文
 */
export const DEFAULT_INPUT = 'ToolCraft 在线工具箱 - 简单、高效、直接！';

/**
 * 文件转 DataURI 允许的最大体积（字节），超出时拒绝读取
 */
export const MAX_FILE_SIZE = 2 * 1024 * 1024;
