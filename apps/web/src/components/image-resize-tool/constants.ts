/**
 * 图片缩放策略枚举
 * 枚举值与 image.resize 能力 params.fit 的取值对齐，可直接作为参数传递
 */
enum ImageFitEnum {
  /** 等比覆盖：等比缩放铺满目标尺寸后居中裁剪超出部分 */
  Cover = 'cover',
  /** 等比放入：等比缩放完整放入目标尺寸内并居中，可能留白 */
  Contain = 'contain',
  /** 拉伸：直接拉伸至目标尺寸，不保持宽高比 */
  Fill = 'fill',
}

/**
 * 图片缩放策略名称Map
 */
const ImageFitLabelMap = {
  /** 等比覆盖策略的展示文案 */
  [ImageFitEnum.Cover]: '等比覆盖裁剪',
  /** 等比放入策略的展示文案 */
  [ImageFitEnum.Contain]: '等比完整放入',
  /** 拉伸策略的展示文案 */
  [ImageFitEnum.Fill]: '拉伸填充',
};

/**
 * 图片缩放策略选项数据源
 */
const ImageFitOptions = [
  {
    label: ImageFitLabelMap[ImageFitEnum.Cover],
    value: ImageFitEnum.Cover,
  },
  {
    label: ImageFitLabelMap[ImageFitEnum.Contain],
    value: ImageFitEnum.Contain,
  },
  {
    label: ImageFitLabelMap[ImageFitEnum.Fill],
    value: ImageFitEnum.Fill,
  },
];

/**
 * 图片输出格式枚举
 * 枚举值与 image.resize 能力 params.format 的取值对齐，可直接作为参数传递
 */
enum ImageFormatEnum {
  /** JPEG 有损压缩格式，不支持透明 */
  Jpeg = 'jpeg',
  /** PNG 无损压缩格式，支持透明 */
  Png = 'png',
  /** WebP 现代压缩格式，压缩率更高 */
  Webp = 'webp',
}

/**
 * 图片输出格式名称Map
 */
const ImageFormatLabelMap = {
  /** JPEG 格式的展示文案 */
  [ImageFormatEnum.Jpeg]: 'JPEG',
  /** PNG 格式的展示文案 */
  [ImageFormatEnum.Png]: 'PNG',
  /** WebP 格式的展示文案 */
  [ImageFormatEnum.Webp]: 'WebP',
};

/**
 * 图片输出格式选项数据源
 */
const ImageFormatOptions = [
  {
    label: ImageFormatLabelMap[ImageFormatEnum.Jpeg],
    value: ImageFormatEnum.Jpeg,
  },
  {
    label: ImageFormatLabelMap[ImageFormatEnum.Png],
    value: ImageFormatEnum.Png,
  },
  {
    label: ImageFormatLabelMap[ImageFormatEnum.Webp],
    value: ImageFormatEnum.Webp,
  },
];

/**
 * 输出格式到下载文件扩展名的映射
 * jpeg 沿用更通用的 jpg 扩展名
 */
const IMAGE_FORMAT_EXTENSION_MAP: Record<ImageFormatEnum, string> = {
  [ImageFormatEnum.Jpeg]: 'jpg',
  [ImageFormatEnum.Png]: 'png',
  [ImageFormatEnum.Webp]: 'webp',
};

/**
 * 默认压缩质量
 * 与 image.resize 能力 paramsSchema 中 quality 的默认值保持一致
 */
const DEFAULT_IMAGE_QUALITY = 90;

/**
 * 压缩质量上限
 * 与 image.resize 能力 paramsSchema 中 quality 的 max 约束保持一致
 */
const MAX_IMAGE_QUALITY = 100;

export {
  ImageFitEnum,
  ImageFitLabelMap,
  ImageFitOptions,
  ImageFormatEnum,
  ImageFormatLabelMap,
  ImageFormatOptions,
  IMAGE_FORMAT_EXTENSION_MAP,
  DEFAULT_IMAGE_QUALITY,
  MAX_IMAGE_QUALITY,
};
