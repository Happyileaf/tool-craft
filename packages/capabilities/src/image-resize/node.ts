import sharp from 'sharp';
import type { CapabilityDefinition } from '@tool-craft/core';
import {
  imageResizeCapabilityId,
  imageResizeInputSchema,
  imageResizeOutputSchema,
  imageResizeParamsSchema,
  imageResizeTransport,
  type ImageResizeParams,
} from './contract';

/**
 * image.resize 的 Node 实现：sharp 解码 → resize（fit 语义与浏览器 Canvas 对齐）→ toFormat → toBuffer
 *
 * sharp 声明为 optional peerDependency，运行时由消费方（apps/api、apps/mcp）显式安装，
 * 仅 Node 入口链路引用本文件；非法图片字节由 sharp 解码抛错，executor 统一包装为 EXECUTION_ERROR
 */
const imageResizeNodeCapability: CapabilityDefinition<
  Uint8Array,
  ImageResizeParams,
  Uint8Array
> = {
  id: imageResizeCapabilityId,
  name: '图片缩放',
  description: '缩放图片尺寸并转换输出格式（Node sharp 实现）',
  inputSchema: imageResizeInputSchema,
  paramsSchema: imageResizeParamsSchema,
  outputSchema: imageResizeOutputSchema,
  transport: imageResizeTransport,
  execute: async (input, params) => {
    let pipeline = sharp(input).resize({
      width: params.width,
      height: params.height,
      fit: params.fit,
      withoutEnlargement: false,
    });
    /** jpeg 不支持透明通道，输出前铺白底，避免透明区域被压成黑色 */
    if (params.format === 'jpeg') {
      pipeline = pipeline.flatten({ background: '#FFFFFF' });
    }
    const buffer = await pipeline
      .toFormat(params.format, { quality: params.quality })
      .toBuffer();
    return new Uint8Array(buffer);
  },
};

export { imageResizeNodeCapability };
