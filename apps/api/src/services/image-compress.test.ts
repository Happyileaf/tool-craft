import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ImageFormatEnum } from '../lib/constants.js';
import { AppError } from '../lib/errors.js';
import { compressImage } from './image-compress.js';

/** 测试图片宽度，单位像素 */
const TEST_IMAGE_WIDTH = 32;

/** 测试图片高度，单位像素 */
const TEST_IMAGE_HEIGHT = 24;

/**
 * 生成合法的 PNG 测试图片
 *
 * @returns PNG 图片的二进制数据
 */
async function createValidPng(): Promise<Buffer> {
  return sharp({
    create: {
      width: TEST_IMAGE_WIDTH,
      height: TEST_IMAGE_HEIGHT,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();
}

describe('compressImage', () => {
  it('将合法 PNG 压缩为 JPEG 并返回宽高与非空数据', async () => {
    const input = await createValidPng();

    const result = await compressImage(input, {
      quality: 80,
      format: ImageFormatEnum.JPEG,
    });

    expect(result.format).toBe(ImageFormatEnum.JPEG);
    expect(result.width).toBe(TEST_IMAGE_WIDTH);
    expect(result.height).toBe(TEST_IMAGE_HEIGHT);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('损坏图片拒绝并返回 422 PROCESSING_ERROR', async () => {
    const corruptedInput = Buffer.from('not-an-image');

    await expect(compressImage(corruptedInput)).rejects.toMatchObject({
      name: AppError.name,
      code: 'PROCESSING_ERROR',
      status: 422,
    } satisfies Partial<AppError>);
  });

  it('缺省 format 时保持原 PNG 格式', async () => {
    const input = await createValidPng();

    const result = await compressImage(input, { quality: 70 });

    expect(result.format).toBe(ImageFormatEnum.PNG);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
