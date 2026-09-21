import type { CapabilityDefinition } from '@tool-craft/core';
import {
  imageResizeCapabilityId,
  imageResizeInputSchema,
  imageResizeOutputSchema,
  imageResizeParamsSchema,
  imageResizeTransport,
  type ImageResizeParams,
} from './contract';

/** 输出格式到 MIME 类型的映射，用于 canvas.toBlob 与结果类型校验 */
const FORMAT_MIME_TYPE_MAP: Record<ImageResizeParams['format'], string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * 计算目标尺寸：双边给定时直接使用，仅给单边时按原图宽高比推算另一边
 *
 * @param sourceWidth - 原图宽度
 * @param sourceHeight - 原图高度
 * @param params - 缩放参数（width 与 height 至少提供一个）
 * @returns [目标宽度, 目标高度]，推算边经 Math.round 取整
 */
function resolveTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  params: Pick<ImageResizeParams, 'width' | 'height'>,
): [number, number] {
  const { width, height } = params;
  if (width !== undefined && height !== undefined) {
    return [width, height];
  }
  if (width !== undefined) {
    return [width, Math.round((width * sourceHeight) / sourceWidth)];
  }
  if (height !== undefined) {
    return [Math.round((height * sourceWidth) / sourceHeight), height];
  }
  throw new Error('width 与 height 至少提供一个');
}

/**
 * 按指定 fit 语义将位图绘制到画布：cover 等比覆盖后居中裁剪（用 drawImage 源矩形实现），
 * contain 等比完整放入并居中，fill 直接拉伸至目标尺寸
 *
 * @param context - 画布 2D 绘图上下文
 * @param bitmap - 解码后的位图
 * @param targetWidth - 目标宽度
 * @param targetHeight - 目标高度
 * @param params - 缩放参数
 */
function drawBitmapToFit(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  params: ImageResizeParams,
): void {
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  if (params.fit === 'fill') {
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    return;
  }
  if (params.fit === 'contain') {
    /** jpeg 不支持透明通道，先铺白底，避免留白区域被渲染成黑色 */
    if (params.format === 'jpeg') {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, targetWidth, targetHeight);
    }
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    context.drawImage(
      bitmap,
      (targetWidth - drawWidth) / 2,
      (targetHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
    return;
  }
  /** cover：按目标宽高比从原图裁出居中源矩形，再绘制铺满整个画布 */
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const cropWidth = sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth;
  const cropHeight = sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio;
  context.drawImage(
    bitmap,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );
}

/**
 * 将画布内容编码为指定 MIME 类型的 Blob
 *
 * @param canvas - 画布元素
 * @param mimeType - 目标 MIME 类型
 * @param quality - 压缩质量 0-1（canvas.toBlob 的取值范围），仅对 jpeg / webp 生效
 * @returns 编码后的 Blob；浏览器无法编码时为 null
 */
function encodeCanvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * image.resize 的浏览器实现：createImageBitmap 解码 → Canvas 按 fit 语义绘制 → toBlob 编码
 *
 * 输入输出共用 contract 契约；非法图片字节会使 createImageBitmap reject，
 * 由 executor 统一包装为 EXECUTION_ERROR
 */
const imageResizeBrowserCapability: CapabilityDefinition<
  Uint8Array,
  ImageResizeParams,
  Uint8Array
> = {
  id: imageResizeCapabilityId,
  name: '图片缩放',
  description: '缩放图片尺寸并转换输出格式（浏览器 Canvas 实现）',
  inputSchema: imageResizeInputSchema,
  paramsSchema: imageResizeParamsSchema,
  outputSchema: imageResizeOutputSchema,
  transport: imageResizeTransport,
  execute: async (input, params) => {
    /** input 经 zod 校验后的类型是 Uint8Array<ArrayBufferLike>，slice() 复制出 ArrayBuffer 背书的副本以满足 BlobPart 约束 */
    const imageBytes = input.slice();
    const bitmap = await createImageBitmap(new Blob([imageBytes]));
    const [targetWidth, targetHeight] = resolveTargetSize(bitmap.width, bitmap.height, params);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('当前浏览器无法创建 2D 绘图上下文');
    }
    drawBitmapToFit(context, bitmap, targetWidth, targetHeight, params);
    bitmap.close();
    const mimeType = FORMAT_MIME_TYPE_MAP[params.format];
    /** toBlob 的 quality 取值 0-1，契约中的 1-100 需换算 */
    const blob = await encodeCanvasToBlob(canvas, mimeType, params.quality / 100);
    if (!blob || blob.type !== mimeType) {
      throw new Error(`当前浏览器不支持输出 ${params.format} 格式`);
    }
    return new Uint8Array(await blob.arrayBuffer());
  },
};

export { imageResizeBrowserCapability };
