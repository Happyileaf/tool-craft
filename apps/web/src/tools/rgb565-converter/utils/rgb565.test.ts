import { describe, expect, it } from 'vitest';
import {
  colorDistance,
  convertBatch,
  decodeColor,
  encodeColor,
  parseHexColor,
  parsePixelValue,
  pixelToBytes,
  pixelToRgb,
  rgbToPixel,
  toByteHex,
  toHexColor,
  toHexLiteral,
} from './rgb565';
import { EndianEnum, PixelFormatEnum } from '../constants';

describe('parseHexColor', () => {
  it('解析带 # 的六位颜色', () => {
    expect(parseHexColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHexColor('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('解析不带 # 且大小写混合的颜色', () => {
    expect(parseHexColor('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseHexColor('AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
  });

  it('非法格式抛错', () => {
    expect(() => parseHexColor('#FFF')).toThrow();
    expect(() => parseHexColor('#GG0011')).toThrow();
    expect(() => parseHexColor('red')).toThrow();
    expect(() => parseHexColor('')).toThrow();
  });
});

describe('parsePixelValue', () => {
  it('解析 0x 前缀与无前缀值', () => {
    expect(parsePixelValue('0xF800')).toBe(0xf800);
    expect(parsePixelValue('f800')).toBe(0xf800);
    expect(parsePixelValue('0X001f')).toBe(0x1f);
  });

  it('非法或越界值抛错', () => {
    expect(() => parsePixelValue('0x10000')).toThrow();
    expect(() => parsePixelValue('xyz')).toThrow();
  });
});

describe('rgbToPixel RGB565 固定向量', () => {
  const f = PixelFormatEnum.RGB565;
  it('白黑红绿蓝打包正确', () => {
    expect(rgbToPixel(255, 255, 255, f)).toBe(0xffff);
    expect(rgbToPixel(0, 0, 0, f)).toBe(0x0000);
    expect(rgbToPixel(255, 0, 0, f)).toBe(0xf800);
    expect(rgbToPixel(0, 255, 0, f)).toBe(0x07e0);
    expect(rgbToPixel(0, 0, 255, f)).toBe(0x001f);
  });

  it('中间色量化到最近位域', () => {
    expect(rgbToPixel(59, 130, 246, f)).toBe(0x3c1e);
  });
});

describe('rgbToPixel RGB555 固定向量', () => {
  const f = PixelFormatEnum.RGB555;
  it('白黑红绿蓝打包正确', () => {
    expect(rgbToPixel(255, 255, 255, f)).toBe(0x7fff);
    expect(rgbToPixel(0, 0, 0, f)).toBe(0x0000);
    expect(rgbToPixel(255, 0, 0, f)).toBe(0x7c00);
    expect(rgbToPixel(0, 255, 0, f)).toBe(0x03e0);
    expect(rgbToPixel(0, 0, 255, f)).toBe(0x001f);
  });
});

describe('pixelToBytes', () => {
  it('大端高位在前、小端低位在前', () => {
    expect(pixelToBytes(0xf800, EndianEnum.BIG)).toEqual([0xf8, 0x00]);
    expect(pixelToBytes(0xf800, EndianEnum.LITTLE)).toEqual([0x00, 0xf8]);
    expect(pixelToBytes(0x07e0, EndianEnum.BIG)).toEqual([0x07, 0xe0]);
  });
});

describe('pixelToRgb 反向还原', () => {
  it('RGB565 红色低位补 1 扩展为 255', () => {
    expect(pixelToRgb(0xf800, PixelFormatEnum.RGB565)).toEqual({ r: 255, g: 3, b: 7 });
  });

  it('RGB565 绿色通道还原', () => {
    expect(pixelToRgb(0x07e0, PixelFormatEnum.RGB565)).toEqual({ r: 7, g: 255, b: 7 });
  });

  it('RGB555 白色还原为 255', () => {
    expect(pixelToRgb(0x7fff, PixelFormatEnum.RGB555)).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('encodeColor 往返与色差', () => {
  it('红：原色 0xF800、大端 F8 00、还原色差非负', () => {
    const result = encodeColor('#FF0000', PixelFormatEnum.RGB565, EndianEnum.BIG);
    expect(result.value).toBe(0xf800);
    expect(result.highByte).toBe(0xf8);
    expect(result.lowByte).toBe(0x00);
    expect(result.bytes).toEqual([0xf8, 0x00]);
    expect(result.restored.r).toBe(255);
    expect(result.distance).toBeGreaterThanOrEqual(0);
  });

  it('小端字节序逆序', () => {
    const result = encodeColor('#FF0000', PixelFormatEnum.RGB565, EndianEnum.LITTLE);
    expect(result.bytes).toEqual([0x00, 0xf8]);
  });

  it('白色 565 往返无色差', () => {
    const result = encodeColor('#FFFFFF', PixelFormatEnum.RGB565, EndianEnum.BIG);
    expect(result.distance).toBe(0);
  });
});

describe('decodeColor', () => {
  it('0xF800 还原近似纯红', () => {
    const result = decodeColor('0xF800', PixelFormatEnum.RGB565, EndianEnum.BIG);
    expect(result.color.r).toBe(255);
    expect(result.hex).toBe('#FF0307');
  });

  it('无 0x 前缀亦可解析', () => {
    const result = decodeColor('07E0', PixelFormatEnum.RGB565, EndianEnum.BIG);
    expect(result.color.g).toBe(255);
  });
});

describe('格式化辅助', () => {
  it('toHexLiteral / toByteHex / toHexColor', () => {
    expect(toHexLiteral(0xf800)).toBe('0xF800');
    expect(toHexLiteral(0x1f)).toBe('0x001F');
    expect(toByteHex(7)).toBe('07');
    expect(toHexColor(59, 130, 246)).toBe('#3B82F6');
  });

  it('colorDistance 相同颜色为 0', () => {
    expect(colorDistance({ r: 1, g: 2, b: 3 }, { r: 1, g: 2, b: 3 })).toBe(0);
    expect(
      colorDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }),
    ).toBeCloseTo(255, 5);
  });
});

describe('convertBatch', () => {
  it('正向五行示例输出五行、顺序一致', () => {
    const rows = convertBatch(
      '#FFFFFF\n#000000\n#FF0000\n#00FF00\n#0000FF',
      PixelFormatEnum.RGB565,
      EndianEnum.BIG,
      'encode',
    );
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.literal)).toEqual([
      '0xFFFF',
      '0x0000',
      '0xF800',
      '0x07E0',
      '0x001F',
    ]);
    expect(rows.every((row) => row.ok)).toBe(true);
  });

  it('空行跳过、非法行仅该行报错', () => {
    const rows = convertBatch(
      '#FF0000\n\n#GG0011\n#00FF00',
      PixelFormatEnum.RGB565,
      EndianEnum.BIG,
      'encode',
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]?.ok).toBe(true);
    expect(rows[1]?.ok).toBe(false);
    expect(rows[1]?.error).toBeTruthy();
    expect(rows[2]?.ok).toBe(true);
  });

  it('反向批量越界值仅该行报错', () => {
    const rows = convertBatch(
      '0xF800\n0x10000\n0x07E0',
      PixelFormatEnum.RGB565,
      EndianEnum.BIG,
      'decode',
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]?.ok).toBe(true);
    expect(rows[1]?.ok).toBe(false);
    expect(rows[2]?.ok).toBe(true);
  });

  it('正向→反向往返对任意输入不报错', () => {
    const samples = ['#3B82F6', '#123456', '#ABCDEF', '#000000', '#FFFFFF'];
    samples.forEach((sample) => {
      const encoded = encodeColor(sample, PixelFormatEnum.RGB565, EndianEnum.BIG);
      const decoded = decodeColor(
        toHexLiteral(encoded.value),
        PixelFormatEnum.RGB565,
        EndianEnum.BIG,
      );
      expect(decoded.value).toBe(encoded.value);
    });
  });
});
