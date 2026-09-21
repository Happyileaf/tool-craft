import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  IMAGE_CONTENT_TYPE_PREFIX,
  MULTIPART_FORM_DATA_CONTENT_TYPE,
  PROCESSING_ERROR_CODE,
  VALIDATION_ERROR_CODE,
  ImageFormatEnum,
} from '../lib/constants.js';
import { AppError } from '../lib/errors.js';
import {
  imageCompressFormSchema,
  imageCompressRequestSchema,
} from '../schemas/image-compress.js';
import { compressImage } from '../services/image-compress.js';

/** 字段级校验明细的文档结构，与处理器生成的 details 项一致 */
const errorDetailSchema = z
  .object({
    /** 校验失败的字段路径，如 image、quality */
    field: z.string(),
    /** 面向调用方的字段级错误描述 */
    message: z.string(),
  })
  .openapi('ErrorDetail');

/** 统一错误响应体外层结构的文档 Schema */
const errorResponseSchema = z.object({
  /** 错误对象 */
  error: z.object({
    /** 稳定的机器可读错误码 */
    code: z.string(),
    /** 面向调用方的错误描述 */
    message: z.string(),
    /** 错误明细列表，无字段级明细时为空数组 */
    details: z.array(errorDetailSchema),
  }),
});

/** 400 校验失败响应的 OpenAPI 描述 */
const validationErrorResponse = {
  description: '请求参数缺失、类型不符或超出取值范围',
  content: {
    'application/json': {
      schema: errorResponseSchema.extend({
        error: errorResponseSchema.shape.error.extend({
          code: z.literal(VALIDATION_ERROR_CODE),
        }),
      }).openapi('ValidationErrorResponse'),
    },
  },
};

/** 422 处理失败响应的 OpenAPI 描述 */
const processingErrorResponse = {
  description: '输入通过校验但无法完成处理，如图片文件损坏',
  content: {
    'application/json': {
      schema: errorResponseSchema.extend({
        error: errorResponseSchema.shape.error.extend({
          code: z.literal(PROCESSING_ERROR_CODE),
        }),
      }).openapi('ProcessingErrorResponse'),
    },
  },
};

/** 图片二进制响应的 OpenAPI Schema 片段 */
const binaryImageContent = {
  schema: {
    type: 'string' as const,
    format: 'binary' as const,
  },
};

/**
 * 图片压缩路由定义
 * 请求为 multipart/form-data，成功返回压缩后图片二进制，
 * 响应头附带输出图片宽高与处理前后字节数
 */
export const imageCompressRoute = createRoute({
  method: 'post',
  path: '/v1/image/compress',
  tags: ['图片'],
  summary: '压缩图片',
  description:
    '对上传的 JPEG、PNG、WebP 图片按目标质量与格式压缩，返回处理后的图片二进制及宽高、体积信息；相同输入产出相同结果，可安全重试',
  request: {
    body: {
      content: {
        [MULTIPART_FORM_DATA_CONTENT_TYPE]: {
          schema: imageCompressRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '压缩后的图片二进制，Content-Type 与输出格式一致',
      headers: {
        'X-Image-Width': {
          description: '处理后图片宽度，单位像素，十进制整数字符串',
          schema: { type: 'integer' as const },
        },
        'X-Image-Height': {
          description: '处理后图片高度，单位像素，十进制整数字符串',
          schema: { type: 'integer' as const },
        },
        'X-Original-Size': {
          description: '原始图片字节数，十进制整数字符串',
          schema: { type: 'integer' as const },
        },
        'X-Processed-Size': {
          description: '处理后图片字节数，十进制整数字符串',
          schema: { type: 'integer' as const },
        },
      },
      content: {
        [`${IMAGE_CONTENT_TYPE_PREFIX}${ImageFormatEnum.JPEG}`]: binaryImageContent,
        [`${IMAGE_CONTENT_TYPE_PREFIX}${ImageFormatEnum.PNG}`]: binaryImageContent,
        [`${IMAGE_CONTENT_TYPE_PREFIX}${ImageFormatEnum.WEBP}`]: binaryImageContent,
      },
    },
    400: validationErrorResponse,
    422: processingErrorResponse,
  },
});

/**
 * 注册图片压缩路由
 *
 * @param app - OpenAPI Hono 应用实例
 * @returns 注册后的应用实例，便于链式调用
 */
export function registerImageCompressRoute(app: OpenAPIHono): OpenAPIHono {
  return app.openapi(imageCompressRoute, async (c) => {
    let formBody: Record<string, string | File>;

    try {
      formBody = (await c.req.parseBody()) as Record<string, string | File>;
    } catch {
      throw new AppError(
        VALIDATION_ERROR_CODE,
        'multipart/form-data 请求体解析失败',
        400,
      );
    }

    const parsed = imageCompressFormSchema.safeParse(formBody);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.map((segment) => String(segment)).join('.'),
        message: issue.message,
      }));

      throw new AppError(
        VALIDATION_ERROR_CODE,
        '请求参数校验失败',
        400,
        details,
      );
    }

    const { image, quality, format } = parsed.data;
    const input = Buffer.from(await image.arrayBuffer());
    const result = await compressImage(input, { quality, format });
    const responseBytes = new Uint8Array(result.data.length);
    responseBytes.set(result.data);

    return c.body(responseBytes, 200, {
      'Content-Type': `${IMAGE_CONTENT_TYPE_PREFIX}${result.format}`,
      'X-Image-Width': String(result.width),
      'X-Image-Height': String(result.height),
      'X-Original-Size': String(input.byteLength),
      'X-Processed-Size': String(responseBytes.byteLength),
    });
  });
}
