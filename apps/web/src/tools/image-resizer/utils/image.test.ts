import { describe, expect, it } from 'vitest';
import { AspectRatioEnum, MAX_FILE_SIZE } from '../constants';
import {
  calculateDimensions,
  formatFileSize,
  getCropRect,
  loadImageFile,
} from './image';

describe('formatFileSize', () => {
  it('不足 1KB 时以 B 为单位且不带小数', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('1KB 到 1MB 之间以 KB 为单位并保留 1 位小数', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10240)).toBe('10.0 KB');
  });

  it('达到 1MB 时以 MB 为单位并保留 2 位小数', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });
});

describe('calculateDimensions', () => {
  it('宽高都为空时返回原始尺寸', () => {
    expect(calculateDimensions(800, 600, null, null, true)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('锁定比例时只给宽度，高度按原始比例自动计算', () => {
    expect(calculateDimensions(800, 600, 400, null, true)).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('锁定比例时只给高度，宽度按原始比例自动计算', () => {
    expect(calculateDimensions(800, 600, null, 300, true)).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('锁定比例时放大尺寸同样按比例计算', () => {
    expect(calculateDimensions(1920, 1080, 3840, null, true)).toEqual({
      width: 3840,
      height: 2160,
    });
  });

  it('不锁比例时宽高独立取值，互不影响', () => {
    expect(calculateDimensions(800, 600, 200, 100, false)).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('不锁比例且只给一边时，另一边回退为原始尺寸', () => {
    expect(calculateDimensions(800, 600, 200, null, false)).toEqual({
      width: 200,
      height: 600,
    });
  });

  it('计算结果被限制在 1 到 10000 像素之间', () => {
    expect(calculateDimensions(800, 600, 0, null, false).width).toBe(1);
    expect(calculateDimensions(800, 600, 20000, null, false).width).toBe(10000);
  });
});

describe('getCropRect', () => {
  it('保持原比时返回整张原图区域', () => {
    expect(getCropRect(1920, 1080, AspectRatioEnum.Original)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });

  it('原图宽于目标比例时按高度裁切两侧', () => {
    expect(getCropRect(1920, 1080, AspectRatioEnum.OneToOne)).toEqual({
      x: 420,
      y: 0,
      width: 1080,
      height: 1080,
    });
  });

  it('原图高于目标比例时按宽度裁切上下', () => {
    expect(getCropRect(1600, 2000, AspectRatioEnum.OneToOne)).toEqual({
      x: 0,
      y: 200,
      width: 1600,
      height: 1600,
    });
  });

  it('16:9 比例下计算区域宽高比与目标一致', () => {
    const rect = getCropRect(800, 800, AspectRatioEnum.SixteenToNine);
    expect(rect.width / rect.height).toBeCloseTo(16 / 9, 2);
  });

  it('4:3 比例下计算区域宽高比与目标一致', () => {
    const rect = getCropRect(1600, 2000, AspectRatioEnum.FourToThree);
    expect(rect.width / rect.height).toBeCloseTo(4 / 3, 2);
  });
});

describe('loadImageFile', () => {
  it('非图片文件应被拒绝', async () => {
    const file = new File(['plain text content'], 'note.txt', { type: 'text/plain' });
    await expect(loadImageFile(file)).rejects.toThrow(/图片/);
  });

  it('体积超过 10MB 时应被拒绝', async () => {
    const chunks = new Array(11).fill('a'.repeat(1024 * 1024));
    const file = new File(chunks, 'huge.jpg', { type: 'image/jpeg' });
    expect(file.size).toBeGreaterThan(MAX_FILE_SIZE);
    await expect(loadImageFile(file)).rejects.toThrow(/10MB/);
  });
});
