import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { executeCapability } from '@tool-craft/core';
import { imageResizeNodeCapability } from './node';

/**
 * 生成指定尺寸的纯色 PNG 测试图
 *
 * @param width - 宽度（像素）
 * @param height - 高度（像素）
 * @returns PNG 图片字节
 */
async function createPngFixture(width: number, height: number): Promise<Uint8Array> {
  const buffer = await sharp({
    create: { width, height, channels: 4, background: '#336699' },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buffer);
}

describe('imageResizeNodeCapability', () => {
  it('双边缩放：width=50, height=50 输出 50x50', async () => {
    const fixture = await createPngFixture(100, 100);
    const output = await executeCapability(imageResizeNodeCapability, fixture, {
      width: 50,
      height: 50,
    });
    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(50);
    expect(metadata.height).toBe(50);
  });

  it('仅给 width 时按原图宽高比推算高度：1:1 原图 height=50，2:1 原图 height=25', async () => {
    const squareOutput = await executeCapability(
      imageResizeNodeCapability,
      await createPngFixture(100, 100),
      { width: 50 },
    );
    const squareMetadata = await sharp(squareOutput).metadata();
    expect(squareMetadata.width).toBe(50);
    expect(squareMetadata.height).toBe(50);

    const wideOutput = await executeCapability(
      imageResizeNodeCapability,
      await createPngFixture(200, 100),
      { width: 50 },
    );
    const wideMetadata = await sharp(wideOutput).metadata();
    expect(wideMetadata.width).toBe(50);
    expect(wideMetadata.height).toBe(25);
  });

  it('fit 三模式（cover / contain / fill）均正常执行且输出尺寸正确', async () => {
    const fixture = await createPngFixture(200, 100);
    for (const fit of ['cover', 'contain', 'fill'] as const) {
      const output = await executeCapability(imageResizeNodeCapability, fixture, {
        width: 60,
        height: 40,
        fit,
      });
      const metadata = await sharp(output).metadata();
      expect(metadata.width).toBe(60);
      expect(metadata.height).toBe(40);
    }
  });

  it('格式转换：PNG 输入 + format=jpeg 输出 jpeg', async () => {
    const fixture = await createPngFixture(50, 50);
    const output = await executeCapability(imageResizeNodeCapability, fixture, {
      width: 30,
      format: 'jpeg',
    });
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe('jpeg');
  });

  it('非法图片字节包装为 EXECUTION_ERROR', async () => {
    const error = await executeCapability(
      imageResizeNodeCapability,
      new Uint8Array([1, 2, 3]),
      { width: 50 },
    ).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'EXECUTION_ERROR' });
  });

  it('width 与 height 均缺失时触发 VALIDATION_ERROR（refine 生效）', async () => {
    const fixture = await createPngFixture(50, 50);
    const error = await executeCapability(imageResizeNodeCapability, fixture, {}).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect((error as Error).message).toContain('width 与 height 至少提供一个');
  });
});
