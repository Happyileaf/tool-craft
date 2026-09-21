import {
  AspectRatioEnum,
  ImageFormatEnum,
  MAX_FILE_SIZE,
  MAX_DIMENSION,
  MIN_DIMENSION,
} from '../constants';

/**
 * 图片基础信息
 */
export interface ImageInfo {
  /** 图片原始宽度（像素） */
  width: number;
  /** 图片原始高度（像素） */
  height: number;
  /** 图片文件体积（字节） */
  size: number;
}

/**
 * 将字节数格式化为人类可读的体积文案
 *
 * @param bytes - 文件体积（字节）
 * @returns B / KB / MB 为单位的体积字符串，KB 保留 1 位小数，MB 保留 2 位小数
 */
export function formatFileSize(bytes: number): string {
  const KILOBYTE = 1024;
  const MEGABYTE = KILOBYTE * 1024;
  if (bytes >= MEGABYTE) {
    return `${(bytes / MEGABYTE).toFixed(2)} MB`;
  }
  if (bytes >= KILOBYTE) {
    return `${(bytes / KILOBYTE).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/**
 * 读取本地文件并解码为图片元素，同时回传 DataURL 与基础信息
 *
 * @param file - 用户选择或拖入的图片文件
 * @returns 图片元素、DataURL 与原始宽高、体积信息
 * @throws 当文件类型不是图片时抛出错误
 * @throws 当文件体积超过 10MB 时抛出错误
 * @throws 当文件读取或图片解码失败时抛出错误
 */
export async function loadImageFile(file: File): Promise<{
  element: HTMLImageElement;
  dataUrl: string;
  info: ImageInfo;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('不支持的文件类型，请选择图片文件');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('图片体积不能超过 10MB');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('文件读取失败，请重试'));
    reader.readAsDataURL(file);
  });

  const element = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片解码失败，请重试'));
    image.src = dataUrl;
  });

  return {
    element,
    dataUrl,
    info: { width: element.naturalWidth, height: element.naturalHeight, size: file.size },
  };
}

/**
 * 以匿名跨域方式加载远程图片，使 Canvas 重绘后的导出不被跨域污染拦截
 *
 * @param url - 远程图片地址
 * @returns 加载完成的图片元素
 * @throws 当远程地址不可达、缺少 CORS 头或解码失败时抛出错误
 */
export async function loadRemoteImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('样图加载失败，请检查网络后重试'));
    image.src = url;
  });
}

/**
 * 原图上的裁切区域
 */
export interface CropRect {
  /** 裁切起点距原图左边的距离（像素） */
  x: number;
  /** 裁切起点距原图顶边的距离（像素） */
  y: number;
  /** 裁切区域宽度（像素） */
  width: number;
  /** 裁切区域高度（像素） */
  height: number;
}

/**
 * 依据目标宽高比计算居中裁切矩形，取尽可能大的同比例区域；
 * 保持原比时返回覆盖整张原图的矩形
 *
 * @param sourceWidth - 原图宽度（像素）
 * @param sourceHeight - 原图高度（像素）
 * @param ratio - 宽高比裁切预设
 * @returns 居中裁切区域
 */
export function getCropRect(
  sourceWidth: number,
  sourceHeight: number,
  ratio: AspectRatioEnum,
): CropRect {
  if (ratio === AspectRatioEnum.Original) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  const [widthPart, heightPart] = ratio.split(':').map(Number);
  const targetRatio = (widthPart ?? 1) / (heightPart ?? 1);
  const sourceRatio = sourceWidth / sourceHeight;

  if (sourceRatio > targetRatio) {
    const cropWidth = Math.round(sourceHeight * targetRatio);
    return {
      x: Math.round((sourceWidth - cropWidth) / 2),
      y: 0,
      width: cropWidth,
      height: sourceHeight,
    };
  }

  const cropHeight = Math.round(sourceWidth / targetRatio);
  return {
    x: 0,
    y: Math.round((sourceHeight - cropHeight) / 2),
    width: sourceWidth,
    height: cropHeight,
  };
}

/**
 * 按目标宽高与输出格式对图片进行 Canvas 压缩重绘，传入裁切区域时先裁切再缩放
 *
 * @param options - 压缩参数
 * @param options.source - 原始图片元素
 * @param options.width - 目标宽度（像素）
 * @param options.height - 目标高度（像素）
 * @param options.format - 输出 MIME 格式
 * @param options.quality - 压缩质量，取值 0 到 1
 * @param options.crop - 原图上的裁切区域，缺省时按整张原图缩放
 * @returns 压缩后的 Blob 与对应 DataURL
 * @throws 当目标宽高非法或浏览器不支持输出格式时抛出错误
 */
export async function resizeImage(options: {
  source: HTMLImageElement;
  width: number;
  height: number;
  format: ImageFormatEnum;
  quality: number;
  crop?: CropRect;
}): Promise<{ blob: Blob; dataUrl: string }> {
  const { source, width, height, format, quality, crop } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('当前浏览器不支持 Canvas 绘图');
  }
  if (crop) {
    context.drawImage(
      source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      width,
      height,
    );
  } else {
    context.drawImage(source, 0, 0, width, height);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('图片编码失败，请更换输出格式'));
        }
      },
      format,
      format === ImageFormatEnum.PNG ? undefined : quality,
    );
  });

  return { blob, dataUrl: URL.createObjectURL(blob) };
}

/**
 * 根据目标宽高与锁比例设置计算最终输出尺寸
 *
 * @param originalWidth - 原始宽度（像素）
 * @param originalHeight - 原始高度（像素）
 * @param targetWidth - 期望宽度，为空表示不指定
 * @param targetHeight - 期望高度，为空表示不指定
 * @param lockRatio - 是否锁定原始宽高比
 * @returns 最终输出的宽高（像素）
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number | null,
  targetHeight: number | null,
  lockRatio: boolean,
): { width: number; height: number } {
  const clamp = (value: number) =>
    Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)));

  if (targetWidth === null && targetHeight === null) {
    return { width: clamp(originalWidth), height: clamp(originalHeight) };
  }

  if (!lockRatio) {
    return {
      width: clamp(targetWidth ?? originalWidth),
      height: clamp(targetHeight ?? originalHeight),
    };
  }

  const ratio = originalHeight / originalWidth;
  if (targetWidth !== null) {
    return { width: clamp(targetWidth), height: clamp(targetWidth * ratio) };
  }
  const inverseRatio = originalWidth / originalHeight;
  return {
    width: clamp((targetHeight ?? originalHeight) * inverseRatio),
    height: clamp(targetHeight ?? originalHeight),
  };
}
