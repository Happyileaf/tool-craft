import { describe, it, expect } from 'vitest';
import {
  batchConvert,
  buildSpectrumGradient,
  getSpectralBand,
  getSpectralBandMeta,
  rgbToHex,
  wavelengthToRgb,
} from './spectrum';
import { BATCH_SAMPLE_INPUT, VISIBLE_MAX_NM, VISIBLE_MIN_NM } from '../constants';

describe('wavelengthToRgb 固定向量（gamma=0.8，四舍五入取整）', () => {
  it('532nm：G 为三通道最大，具体 RGB 写死为 [101,255,0]', () => {
    const result = wavelengthToRgb(532);
    expect(result.outOfRange).toBe(false);
    expect(result.rgb).toEqual([101, 255, 0]);
    expect(result.hex).toBe('#65FF00');
    const [r, g, b] = result.rgb as [number, number, number];
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    expect(b).toBe(0);
  });

  it('510nm（青/绿分界，归属绿）：R 严格为 0 且 G 为三通道最大', () => {
    // 说明：按任务给定的固定六段公式，532nm 落在 510–580 段，R 非零；
    // R===0 的绿段边界点为 510nm，此处对该不变量单独断言。
    const result = wavelengthToRgb(510);
    expect(result.rgb).toEqual([0, 255, 0]);
    const [r, g, b] = result.rgb as [number, number, number];
    expect(r).toBe(0);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('700nm：R 明显大于 G/B 且 B 为 0，RGB 写死为 [255,0,0]', () => {
    const result = wavelengthToRgb(700);
    expect(result.rgb).toEqual([255, 0, 0]);
    const [r, g, b] = result.rgb as [number, number, number];
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
    expect(b).toBe(0);
  });

  it('450nm：B 通道最大，RGB 写死为 [0,70,255]', () => {
    const result = wavelengthToRgb(450);
    expect(result.rgb).toEqual([0, 70, 255]);
    const [r, g, b] = result.rgb as [number, number, number];
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('其余关键波长向量写死，锁定分段插值结果', () => {
    expect(wavelengthToRgb(380).rgb).toEqual([77, 0, 77]);
    expect(wavelengthToRgb(420).rgb).toEqual([106, 0, 255]);
    expect(wavelengthToRgb(440).rgb).toEqual([0, 0, 255]);
    expect(wavelengthToRgb(490).rgb).toEqual([0, 255, 255]);
    expect(wavelengthToRgb(550).rgb).toEqual([163, 255, 0]);
    expect(wavelengthToRgb(580).rgb).toEqual([255, 255, 0]);
    expect(wavelengthToRgb(645).rgb).toEqual([255, 0, 0]);
    expect(wavelengthToRgb(750).rgb).toEqual([77, 0, 0]);
  });
});

describe('边缘衰减因子 factor', () => {
  it('380nm 与 750nm 的 factor 均为 0.3', () => {
    expect(wavelengthToRgb(VISIBLE_MIN_NM).factor).toBeCloseTo(0.3, 10);
    expect(wavelengthToRgb(VISIBLE_MAX_NM).factor).toBeCloseTo(0.3, 10);
  });

  it('420–700nm 之间 factor 恒为 1（抽 420 / 550 / 700 断言）', () => {
    expect(wavelengthToRgb(420).factor).toBe(1);
    expect(wavelengthToRgb(550).factor).toBe(1);
    expect(wavelengthToRgb(700).factor).toBe(1);
  });

  it('两端衰减段内 factor 介于 0.3 与 1 之间', () => {
    const low = wavelengthToRgb(400).factor as number;
    const high = wavelengthToRgb(725).factor as number;
    expect(low).toBeGreaterThan(0.3);
    expect(low).toBeLessThan(1);
    expect(high).toBeGreaterThan(0.3);
    expect(high).toBeLessThan(1);
  });
});

describe('越界判定不伪造颜色', () => {
  it('350nm：outOfRange=true、近紫外、rgb/hex/factor 均为 null', () => {
    const result = wavelengthToRgb(350);
    expect(result).toEqual({
      outOfRange: true,
      band: '近紫外',
      rgb: null,
      hex: null,
      factor: null,
    });
  });

  it('800nm：outOfRange=true、近红外、rgb 为 null', () => {
    const result = wavelengthToRgb(800);
    expect(result.outOfRange).toBe(true);
    expect(result.band).toBe('近红外');
    expect(result.rgb).toBeNull();
    expect(result.hex).toBeNull();
  });
});

describe('rgbToHex 大写补零', () => {
  it('[255,0,16] → #FF0010', () => {
    expect(rgbToHex([255, 0, 16])).toBe('#FF0010');
  });

  it('[0,0,0] → #000000', () => {
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
  });

  it('[255,255,255] → #FFFFFF', () => {
    expect(rgbToHex([255, 255, 255])).toBe('#FFFFFF');
  });
});

describe('getSpectralBand 区间边界逐档断言（分界点归属高频段）', () => {
  it('紫段 380–439，440 归属蓝', () => {
    expect(getSpectralBand(380)).toBe('紫');
    expect(getSpectralBand(439)).toBe('紫');
    expect(getSpectralBand(440)).toBe('蓝');
  });

  it('蓝段 440–489，490 归属青', () => {
    expect(getSpectralBand(489)).toBe('蓝');
    expect(getSpectralBand(490)).toBe('青');
  });

  it('青段 490–509，510 归属绿', () => {
    expect(getSpectralBand(509)).toBe('青');
    expect(getSpectralBand(510)).toBe('绿');
  });

  it('绿段 510–579，580 归属黄', () => {
    expect(getSpectralBand(532)).toBe('绿');
    expect(getSpectralBand(579)).toBe('绿');
    expect(getSpectralBand(580)).toBe('黄');
  });

  it('黄段 580–599，600 归属橙', () => {
    expect(getSpectralBand(599)).toBe('黄');
    expect(getSpectralBand(600)).toBe('橙');
  });

  it('橙段 600–644，645 归属红', () => {
    expect(getSpectralBand(644)).toBe('橙');
    expect(getSpectralBand(645)).toBe('红');
  });

  it('红段 645–750（含两端）', () => {
    expect(getSpectralBand(700)).toBe('红');
    expect(getSpectralBand(750)).toBe('红');
  });

  it('越界返回近紫外 / 近红外，且越界 Tag 配色为 null', () => {
    expect(getSpectralBand(379)).toBe('近紫外');
    expect(getSpectralBand(751)).toBe('近红外');
    expect(getSpectralBandMeta(350).tagColor).toBeNull();
    expect(getSpectralBandMeta(532).tagColor).toBe('green');
  });
});

describe('batchConvert 批量转换容错', () => {
  it('混合合法行 / 空行 / 非法行 / 越界行时分别收集且不整体抛出', () => {
    const { validRows, invalidRows } = batchConvert(BATCH_SAMPLE_INPUT);
    expect(validRows).toHaveLength(5);
    expect(invalidRows).toEqual([{ line: 6, raw: 'abc', error: '无法解析为数字波长' }]);
  });

  it('合法行保留行号与原始文本，越界波长进入合法行并标记 outOfRange', () => {
    const { validRows } = batchConvert(BATCH_SAMPLE_INPUT);
    expect(validRows[0]?.line).toBe(1);
    expect(validRows[0]?.raw).toBe('532');
    const last = validRows[validRows.length - 1];
    expect(last?.line).toBe(7);
    expect(last?.wavelength).toBe(800);
    expect(last?.result.outOfRange).toBe(true);
    expect(last?.result.band).toBe('近红外');
  });

  it('空字符串与纯空白输入不产生任何行', () => {
    const result = batchConvert('\n  \n，,');
    expect(result.validRows).toHaveLength(0);
    expect(result.invalidRows).toHaveLength(0);
  });

  it('多个非法行逐行收集行号', () => {
    const result = batchConvert('foo\n500\nbar');
    expect(result.validRows).toHaveLength(1);
    expect(result.invalidRows.map((row) => row.line)).toEqual([1, 3]);
  });
});

describe('buildSpectrumGradient 渐变色带', () => {
  it('生成以 linear-gradient 开头且包含光谱两端颜色的 CSS 字符串', () => {
    const gradient = buildSpectrumGradient();
    expect(gradient.startsWith('linear-gradient(to right,')).toBe(true);
    expect(gradient).toContain('#4D004D');
    expect(gradient).toContain('#4D0000');
  });
});
