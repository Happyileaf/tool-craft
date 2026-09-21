/**
 * 图片输出格式枚举
 */
export enum ImageFormatEnum {
  /** JPEG 有损格式，通用性最高 */
  JPEG = 'image/jpeg',
  /** PNG 无损格式，支持透明通道 */
  PNG = 'image/png',
  /** WebP 有损格式，同画质下体积更小 */
  WEBP = 'image/webp',
}

/**
 * 图片输出格式对应的国际化文案键，键为格式枚举值，值为点分文案路径
 */
export const ImageFormatLabelKeyMap: Record<ImageFormatEnum, string> = {
  /** JPEG 文案键 */
  [ImageFormatEnum.JPEG]: 'tools.image.formatJpeg',
  /** PNG 文案键 */
  [ImageFormatEnum.PNG]: 'tools.image.formatPng',
  /** WebP 文案键 */
  [ImageFormatEnum.WEBP]: 'tools.image.formatWebp',
};

/**
 * 图片输出格式选项数据源，供格式分段控件渲染
 */
export const ImageFormatOptions: Array<{ label: string; value: ImageFormatEnum }> = [
  { label: ImageFormatLabelKeyMap[ImageFormatEnum.JPEG], value: ImageFormatEnum.JPEG },
  { label: ImageFormatLabelKeyMap[ImageFormatEnum.PNG], value: ImageFormatEnum.PNG },
  { label: ImageFormatLabelKeyMap[ImageFormatEnum.WEBP], value: ImageFormatEnum.WEBP },
];

/**
 * 允许上传的最大图片体积（字节），依据浏览器内存与 Canvas 处理上限取 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 默认压缩质量（百分制），依据体积与画质的平衡点取 80
 */
export const DEFAULT_QUALITY = 80;

/**
 * 质量滑块最小值（百分制），低于该值画质损失通常不可接受
 */
export const MIN_QUALITY = 10;

/**
 * 质量滑块最大值（百分制），对应接近原图画质
 */
export const MAX_QUALITY = 100;

/**
 * 输出尺寸最小边长（像素），避免出现 0 或负数导致 Canvas 报错
 */
export const MIN_DIMENSION = 1;

/**
 * 输出尺寸最大边长（像素），超出主流浏览器 Canvas 面积上限时绘制会失败
 */
export const MAX_DIMENSION = 10000;

/**
 * 宽高比裁切预设枚举
 */
export enum AspectRatioEnum {
  /** 不裁切，保持图片原始比例 */
  Original = 'original',
  /** 宽屏 16:9 比例 */
  SixteenToNine = '16:9',
  /** 传统 4:3 比例 */
  FourToThree = '4:3',
  /** 正方形 1:1 比例 */
  OneToOne = '1:1',
}

/**
 * 宽高比裁切预设对应的国际化文案键，键为比例枚举值，值为点分文案路径
 */
export const AspectRatioLabelKeyMap: Record<AspectRatioEnum, string> = {
  /** 保持原比文案键 */
  [AspectRatioEnum.Original]: 'tools.image.ratioOriginal',
  /** 16:9 文案键 */
  [AspectRatioEnum.SixteenToNine]: 'tools.image.ratio169',
  /** 4:3 文案键 */
  [AspectRatioEnum.FourToThree]: 'tools.image.ratio43',
  /** 1:1 文案键 */
  [AspectRatioEnum.OneToOne]: 'tools.image.ratio11',
};

/**
 * 宽高比裁切预设选项数据源，供比例按钮组直接渲染
 */
export const AspectRatioOptions = Object.values(AspectRatioEnum).map((value) => ({
  /** 比例预设的国际化文案键 */
  label: AspectRatioLabelKeyMap[value],
  /** 比例枚举值 */
  value,
}));

/**
 * 预设体验样图枚举
 */
export enum SampleImageEnum {
  /** 湖泊风光高画质横图 */
  Landscape = 'landscape',
  /** 人物肖像竖图 */
  Portrait = 'portrait',
  /** 山林晨雾宽幅横图 */
  Forest = 'forest',
}

/**
 * 预设样图的展示信息
 */
export interface SampleImageMeta {
  /** 样图远程地址，Unsplash 支持 CORS 可供 Canvas 重绘导出 */
  url: string;
  /** 原型标注的原始体积（字节），尺寸在图片解码后以真实像素为准 */
  size: number;
}

/**
 * 预设样图数据源，体积取值与原型标注保持一致
 */
export const SAMPLE_IMAGE_MAP: Record<SampleImageEnum, SampleImageMeta> = {
  [SampleImageEnum.Landscape]: {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    size: 2450000,
  },
  [SampleImageEnum.Portrait]: {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
    size: 3120000,
  },
  [SampleImageEnum.Forest]: {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
    size: 4200000,
  },
};

/**
 * 预设样图对应的国际化文案键，键为样图枚举值，值为点分文案路径
 */
export const SampleImageLabelKeyMap: Record<SampleImageEnum, string> = {
  /** 风光样图文案键 */
  [SampleImageEnum.Landscape]: 'tools.image.sampleLandscape',
  /** 肖像样图文案键 */
  [SampleImageEnum.Portrait]: 'tools.image.samplePortrait',
  /** 森林样图文案键 */
  [SampleImageEnum.Forest]: 'tools.image.sampleForest',
};

/**
 * 预设样图选项数据源，供样图按钮组直接渲染
 */
export const SampleImageOptions = Object.values(SampleImageEnum).map((value) => ({
  /** 样图按钮的国际化文案键 */
  label: SampleImageLabelKeyMap[value],
  /** 样图枚举值 */
  value,
}));
