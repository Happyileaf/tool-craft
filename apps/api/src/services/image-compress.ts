import sharp from 'sharp';
import {
  DEFAULT_IMAGE_QUALITY,
  ImageFormatEnum,
} from '../lib/constants.js';
import { AppError, createProcessingError } from '../lib/errors.js';

/**
 * sharp 内部格式标识到业务格式枚举的映射
 * 仅包含契约支持的三种格式，其余格式视为不可处理
 */
const SHARP_FORMAT_MAP: Readonly<Record<string, ImageFormatEnum>> = {
  /** sharp 的 JPEG 标识 */
  jpeg: ImageFormatEnum.JPEG,
  /** sharp 的 PNG 标识 */
  png: ImageFormatEnum.PNG,
  /** sharp 的 WebP 标识 */
  webp: ImageFormatEnum.WEBP,
};

/**
 * 图片压缩结果
 */
export interface CompressImageResult {
  /** 处理后图片的二进制数据 */
  data: Buffer;
  /** 处理后图片宽度，单位像素 */
  width: number;
  /** 处理后图片高度，单位像素 */
  height: number;
  /** 处理后图片的输出格式 */
  format: ImageFormatEnum;
}

/**
 * 压缩图片入参选项
 */
export interface CompressImageOptions {
  /** 压缩质量，1–100 的整数，缺省为 80 */
  quality?: number;
  /** 输出格式，缺省保持图片原格式 */
  format?: ImageFormatEnum;
}

/**
 * 将 sharp 的格式标识映射为业务格式枚举
 *
 * @param sharpFormat - sharp metadata 或输出信息中的格式标识
 * @returns 对应的业务格式枚举
 * @throws 当原格式不在契约支持范围内时抛出 422 处理错误
 */
function resolveImageFormat(sharpFormat: string | undefined): ImageFormatEnum {
  if (sharpFormat && Object.hasOwn(SHARP_FORMAT_MAP, sharpFormat)) {
    return SHARP_FORMAT_MAP[sharpFormat] as ImageFormatEnum;
  }
  throw createProcessingError('不支持的图片原格式，仅支持 jpeg、png、webp');
}

/** sharp 处理管线的实例类型 */
type SharpPipeline = ReturnType<typeof sharp>;

/**
 * 按目标格式在处理管线中挂载对应编码器
 *
 * @param pipeline - sharp 处理管线实例
 * @param format - 目标输出格式
 * @param quality - 压缩质量，1–100 的整数
 * @returns 挂载编码器后的处理管线
 */
function encodeImage(
  pipeline: SharpPipeline,
  format: ImageFormatEnum,
  quality: number,
): SharpPipeline {
  if (format === ImageFormatEnum.JPEG) {
    return pipeline.jpeg({ quality });
  }
  if (format === ImageFormatEnum.PNG) {
    return pipeline.png({ quality });
  }
  return pipeline.webp({ quality });
}

/**
 * 压缩图片
 *
 * 纯函数计算，不读取 Hono 请求上下文；相同输入、质量与格式产出相同结果，
 * 可安全重试。图片损坏或无法编码时统一转换为 422 处理错误。
 *
 * @param input - 原始图片的二进制数据
 * @param options - 压缩选项
 * @param options.quality - 压缩质量，1–100 的整数，缺省为 80
 * @param options.format - 输出格式，缺省保持图片原格式
 * @returns 包含压缩后二进制、宽高与输出格式的结果
 * @throws 当图片损坏或原格式不受支持时抛出 AppError，错误码 PROCESSING_ERROR、状态码 422
 */
export async function compressImage(
  input: Buffer,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const quality = options.quality ?? DEFAULT_IMAGE_QUALITY;

  try {
    const pipeline = sharp(input, { failOn: 'error' });
    const metadata = await pipeline.metadata();
    const sourceFormat = resolveImageFormat(metadata.format);
    const outputFormat = options.format ?? sourceFormat;

    const output = await encodeImage(pipeline, outputFormat, quality).toBuffer({
      resolveWithObject: true,
    });

    return {
      data: Buffer.from(output.data),
      width: output.info.width,
      height: output.info.height,
      format: resolveImageFormat(output.info.format),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : '未知图片处理错误';
    throw createProcessingError(`图片处理失败：${message}`);
  }
}
