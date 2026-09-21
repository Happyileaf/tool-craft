import { z } from 'zod';
import type { TransportEncoding } from '@tool-craft/core';

/** image.resize 能力的唯一标识 */
const imageResizeCapabilityId = 'image.resize';

/** 图片缩放参数（fit 语义与 CSS object-fit / sharp 对齐） */
type ImageResizeParams = {
  /** 目标宽度（像素），正整数；与 height 至少提供一个，仅给单边时另一边按原图宽高比推算 */
  width?: number;
  /** 目标高度（像素），正整数；与 width 至少提供一个 */
  height?: number;
  /** 缩放策略：cover 等比覆盖后居中裁剪；contain 等比完整放入；fill 直接拉伸 */
  fit: 'cover' | 'contain' | 'fill';
  /** 输出图片格式 */
  format: 'jpeg' | 'png' | 'webp';
  /** 有损压缩质量 1-100，仅对 jpeg / webp 输出生效 */
  quality: number;
};

/** 输入 schema：待处理的图片原始字节 */
const imageResizeInputSchema = z.instanceof(Uint8Array);

/** 参数 schema：width 与 height 至少提供一个，其余字段带默认值 */
const imageResizeParamsSchema = z
  .object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
    format: z.enum(['jpeg', 'png', 'webp']).default('png'),
    quality: z.number().int().min(1).max(100).default(90),
  })
  .refine((params) => params.width !== undefined || params.height !== undefined, {
    message: 'width 与 height 至少提供一个',
  });

/** 输出 schema：处理后的图片字节 */
const imageResizeOutputSchema = z.instanceof(Uint8Array);

/** 传输编码提示：输入输出均为图片字节，Adapter 据此走 base64 编解码 */
const imageResizeTransport: { input: TransportEncoding; output: TransportEncoding } = {
  input: 'base64',
  output: 'base64',
};

export {
  imageResizeCapabilityId,
  imageResizeInputSchema,
  imageResizeParamsSchema,
  imageResizeOutputSchema,
  imageResizeTransport,
  type ImageResizeParams,
};
