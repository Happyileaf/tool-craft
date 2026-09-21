/**
 * 图片输出格式枚举
 */
export enum ImageFormatEnum {
  /**
   * JPEG 格式
   */
  JPEG = 'jpeg',
  /**
   * PNG 格式
   */
  PNG = 'png',
  /**
   * WEBP 格式
   */
  WEBP = 'webp',
}

/**
 * 图片输出格式名称映射
 */
export const ImageFormatLabelMap: Record<ImageFormatEnum, string> = {
  /**
   * JPEG 格式
   */
  [ImageFormatEnum.JPEG]: 'JPEG 图片',
  /**
   * PNG 格式
   */
  [ImageFormatEnum.PNG]: 'PNG 图片',
  /**
   * WEBP 格式
   */
  [ImageFormatEnum.WEBP]: 'WebP 图片',
};

/**
 * 图片输出格式选项数据源
 */
export const ImageFormatOptions = [
  {
    label: ImageFormatLabelMap[ImageFormatEnum.JPEG],
    value: ImageFormatEnum.JPEG,
  },
  {
    label: ImageFormatLabelMap[ImageFormatEnum.PNG],
    value: ImageFormatEnum.PNG,
  },
  {
    label: ImageFormatLabelMap[ImageFormatEnum.WEBP],
    value: ImageFormatEnum.WEBP,
  },
] as const;

/**
 * 默认压缩质量
 * 80 为多数场景下体积与观感平衡的经验值
 */
export const DEFAULT_IMAGE_QUALITY = 80;

/**
 * 压缩质量下限
 * 低于 1 不构成有效质量参数
 */
export const MIN_IMAGE_QUALITY = 1;

/**
 * 压缩质量上限
 * 100 为编码器支持的最高质量档位
 */
export const MAX_IMAGE_QUALITY = 100;

/**
 * 允许上传的图片 MIME 类型与输出格式的映射
 * 键为 MIME 类型、值为对应的格式枚举，上传校验与原格式推断共用此映射
 */
export const ALLOWED_IMAGE_MIME_TYPES: Readonly<Record<string, ImageFormatEnum>> = {
  /** JPEG 文件对应的 MIME */
  'image/jpeg': ImageFormatEnum.JPEG,
  /** PNG 文件对应的 MIME */
  'image/png': ImageFormatEnum.PNG,
  /** WebP 文件对应的 MIME */
  'image/webp': ImageFormatEnum.WEBP,
};

/**
 * 依据格式枚举生成图片响应 Content-Type 的前缀
 * 响应头形如 image/jpeg，格式值由契约枚举保证合法
 */
export const IMAGE_CONTENT_TYPE_PREFIX = 'image/';

/**
 * multipart 表单请求的 Content-Type 标识
 */
export const MULTIPART_FORM_DATA_CONTENT_TYPE = 'multipart/form-data';

/**
 * 校验失败错误码
 * 请求参数缺失、类型不符或超出取值范围时使用
 */
export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

/**
 * 处理失败错误码
 * 输入通过校验但无法完成处理（如图片损坏）时使用
 */
export const PROCESSING_ERROR_CODE = 'PROCESSING_ERROR';
