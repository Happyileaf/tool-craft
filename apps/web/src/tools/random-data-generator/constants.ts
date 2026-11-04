/**
 * 随机数据生成器支持的数据类型枚举
 */
export enum RandomTypeEnum {
  /** 整数 */
  Integer = 'integer',
  /** 浮点数 */
  Float = 'float',
  /** 布尔值 */
  Boolean = 'boolean',
  /** 十六进制颜色 */
  HexColor = 'hex-color',
  /** RGB 颜色 */
  RgbColor = 'rgb-color',
  /** UUID v4 */
  Uuid = 'uuid',
  /** 英文姓名 */
  Name = 'name',
  /** 电子邮箱 */
  Email = 'email',
  /** 手机号（中国大陆） */
  Phone = 'phone',
  /** 英文单词 */
  Word = 'word',
  /** 英文段落（Lorem ipsum） */
  Paragraph = 'paragraph',
  /** 日期时间（ISO） */
  DateTime = 'datetime',
}

/**
 * 单次生成结果的最大条数，避免一次生成过多内容拖慢主线程
 */
export const MAX_COUNT = 500;

/**
 * 默认生成条数
 */
export const DEFAULT_COUNT = 10;

/**
 * 整数范围的默认下限
 */
export const DEFAULT_INT_MIN = 0;

/**
 * 整数范围的默认上限
 */
export const DEFAULT_INT_MAX = 100;

/**
 * 浮点小数位上限
 */
export const MAX_DECIMALS = 10;
