import { describe, expect, it } from 'vitest';
import { ImageFormatEnum } from '../lib/constants.js';
import { imageCompressFormSchema } from './image-compress.js';

/**
 * 构造测试用图片文件
 *
 * @param type - 文件 MIME 类型
 * @returns 最小内容的 File 实例
 */
function createImageFile(type: string): File {
  return new File([new Uint8Array([1, 2, 3])], 'image.png', { type });
}

describe('imageCompressFormSchema', () => {
  it('缺少 image 字段时校验失败', () => {
    const result = imageCompressFormSchema.safeParse({
      quality: '80',
    });

    expect(result.success).toBe(false);
  });

  it('quality 为 0 时校验失败', () => {
    const result = imageCompressFormSchema.safeParse({
      image: createImageFile('image/png'),
      quality: '0',
    });

    expect(result.success).toBe(false);
  });

  it('quality 为 101 时校验失败', () => {
    const result = imageCompressFormSchema.safeParse({
      image: createImageFile('image/png'),
      quality: '101',
    });

    expect(result.success).toBe(false);
  });

  it('format 为非法枚举值时校验失败', () => {
    const result = imageCompressFormSchema.safeParse({
      image: createImageFile('image/png'),
      format: 'gif',
    });

    expect(result.success).toBe(false);
  });

  it('合法输入通过校验并补齐 quality 缺省值', () => {
    const result = imageCompressFormSchema.safeParse({
      image: createImageFile('image/png'),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality).toBe(80);
      expect(result.data.format).toBeUndefined();
    }
  });

  it('合法 format 通过校验', () => {
    const result = imageCompressFormSchema.safeParse({
      image: createImageFile('image/jpeg'),
      quality: '60',
      format: ImageFormatEnum.WEBP,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality).toBe(60);
      expect(result.data.format).toBe(ImageFormatEnum.WEBP);
    }
  });
});
