import { z } from '@hono/zod-openapi';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_IMAGE_QUALITY,
  MAX_IMAGE_QUALITY,
  MIN_IMAGE_QUALITY,
  ImageFormatEnum,
} from '../lib/constants.js';

/**
 * multipart 表单中图片文件字段的运行时校验规则
 * 必须为 File 实例且 MIME 类型属于契约允许的三种图片类型
 */
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => Object.hasOwn(ALLOWED_IMAGE_MIME_TYPES, file.type), {
    message: 'image 仅支持 image/jpeg、image/png、image/webp 类型',
  });

/**
 * 压缩质量字段的运行时校验规则
 * 表单值经 number 强转换后须为 1–100 的整数，缺省为 80
 */
export const imageQualitySchema = z
  .coerce
  .number()
  .int()
  .min(MIN_IMAGE_QUALITY)
  .max(MAX_IMAGE_QUALITY)
  .default(DEFAULT_IMAGE_QUALITY);

/**
 * 输出格式字段的运行时校验规则
 * 仅接受契约枚举值，缺省时由服务层保持原格式
 */
export const imageFormatSchema = z.nativeEnum(ImageFormatEnum).optional();

/**
 * POST /v1/image/compress multipart 表单的运行时校验 Schema
 * 路由处理器以此为唯一事实来源完成入参校验
 */
export const imageCompressFormSchema = z.object({
  /** 待压缩的图片文件 */
  image: imageFileSchema,
  /** 压缩质量，缺省 80 */
  quality: imageQualitySchema,
  /** 输出格式，缺省保持原格式 */
  format: imageFormatSchema,
});

/** 图片压缩表单解析后的结构化类型 */
export type ImageCompressFormValues = z.infer<typeof imageCompressFormSchema>;

/**
 * 用于 OpenAPI 文档的 multipart 请求体 Schema
 *
 * 使用普通 OpenAPI 对象而非 Zod 实例，避免 zod-openapi 对 multipart 的 File
 * 做自动校验；运行时校验以 imageCompressFormSchema 为唯一事实来源。
 */
export const imageCompressRequestSchema = {
  type: 'object' as const,
  required: ['image'],
  properties: {
    image: {
      type: 'string' as const,
      format: 'binary' as const,
      description: '待压缩的图片文件，仅支持 image/jpeg、image/png、image/webp',
    },
    quality: {
      type: 'string' as const,
      description: '压缩质量，1–100 的整数，缺省为 80',
      example: '80',
    },
    format: {
      type: 'string' as const,
      enum: [
        ImageFormatEnum.JPEG,
        ImageFormatEnum.PNG,
        ImageFormatEnum.WEBP,
      ],
      description: '输出格式，缺省保持图片原格式',
    },
  },
};
