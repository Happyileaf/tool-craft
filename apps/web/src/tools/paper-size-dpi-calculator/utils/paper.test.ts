import { describe, it, expect } from 'vitest';
import {
  paperToPixels,
  pixelsToPaper,
  mmToPixels,
  pixelsToMm,
  applyOrientation,
  findClosestPaper,
  getPresetById,
  mmToUnit,
} from './paper';

describe('正向换算：标准纸张 + DPI → 像素（验收向量）', () => {
  it('A4（210×297mm）@300 DPI = 2480×3508', () => {
    const result = paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 300, orientation: 'portrait' });
    expect(result.error).toBeNull();
    expect(result.pixels).toEqual({ widthPx: 2480, heightPx: 3508 });
  });

  it('A4 @72 DPI = 595×842；@96 = 794×1123；@150 = 1240×1754', () => {
    const base = { width: 210, height: 297, unit: 'mm' as const, orientation: 'portrait' as const };
    expect(paperToPixels({ ...base, dpi: 72 }).pixels).toEqual({ widthPx: 595, heightPx: 842 });
    expect(paperToPixels({ ...base, dpi: 96 }).pixels).toEqual({ widthPx: 794, heightPx: 1123 });
    expect(paperToPixels({ ...base, dpi: 150 }).pixels).toEqual({ widthPx: 1240, heightPx: 1754 });
  });

  it('A3 @150 DPI = 1754×2480；A5 @300 DPI = 1748×2480', () => {
    const a3 = paperToPixels({ width: 297, height: 420, unit: 'mm', dpi: 150, orientation: 'portrait' });
    expect(a3.pixels).toEqual({ widthPx: 1754, heightPx: 2480 });
    const a5 = paperToPixels({ width: 148, height: 210, unit: 'mm', dpi: 300, orientation: 'portrait' });
    expect(a5.pixels).toEqual({ widthPx: 1748, heightPx: 2480 });
  });

  it('Letter（8.5×11in）@300 DPI = 2550×3300', () => {
    const result = paperToPixels({ width: 8.5, height: 11, unit: 'in', dpi: 300, orientation: 'portrait' });
    expect(result.error).toBeNull();
    expect(result.pixels).toEqual({ widthPx: 2550, heightPx: 3300 });
  });

  it('A4 横向 @300 DPI = 3508×2480（宽高交换、面积不变）', () => {
    const portrait = paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 300, orientation: 'portrait' });
    const landscape = paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 300, orientation: 'landscape' });
    expect(landscape.pixels).toEqual({ widthPx: 3508, heightPx: 2480 });
    expect(landscape.totalPixels).toBe(portrait.totalPixels);
  });

  it('自定义 100×100mm @300 DPI = 1181×1181；1in×1in @300 DPI = 300×300', () => {
    expect(paperToPixels({ width: 100, height: 100, unit: 'mm', dpi: 300, orientation: 'portrait' }).pixels)
      .toEqual({ widthPx: 1181, heightPx: 1181 });
    expect(paperToPixels({ width: 1, height: 1, unit: 'in', dpi: 300, orientation: 'portrait' }).pixels)
      .toEqual({ widthPx: 300, heightPx: 300 });
  });

  it('cm 单位与 mm 等价（21×29.7cm = A4）', () => {
    const fromCm = paperToPixels({ width: 21, height: 29.7, unit: 'cm', dpi: 300, orientation: 'portrait' });
    expect(fromCm.pixels).toEqual({ widthPx: 2480, heightPx: 3508 });
  });

  it('输出总像素与百万像素', () => {
    const result = paperToPixels({ width: 1, height: 1, unit: 'in', dpi: 300, orientation: 'portrait' });
    expect(result.totalPixels).toBe(90000);
    expect(result.megapixels).toBeCloseTo(0.09, 6);
  });
});

describe('反向换算：像素 + DPI → 物理尺寸与纸张匹配', () => {
  it('2480×3508 @300 DPI 还原为 209.97×297.01mm 并匹配 A4（误差 ≤2%）', () => {
    const result = pixelsToPaper({ widthPx: 2480, heightPx: 3508, dpi: 300 });
    expect(result.error).toBeNull();
    expect(result.physical.widthMm).toBeCloseTo(209.97, 1);
    expect(result.physical.heightMm).toBeCloseTo(297.01, 1);
    expect(result.match?.preset.id).toBe('A4');
    expect(result.match?.withinTolerance).toBe(true);
    expect(result.match?.relativeError).toBeLessThanOrEqual(0.02);
  });

  it('横向像素匹配到横向纸张形态', () => {
    const result = pixelsToPaper({ widthPx: 3508, heightPx: 2480, dpi: 300 });
    expect(result.match?.preset.id).toBe('A4');
    expect(result.match?.orientation).toBe('landscape');
    expect(result.match?.withinTolerance).toBe(true);
  });

  it('总像素与百万像素正确', () => {
    const result = pixelsToPaper({ widthPx: 300, heightPx: 300, dpi: 300 });
    expect(result.totalPixels).toBe(90000);
    expect(result.megapixels).toBeCloseTo(0.09, 6);
  });
});

describe('单位与基础换算', () => {
  it('1in = 25.4mm 精确换算', () => {
    expect(mmToPixels(25.4, 300)).toBe(300);
    expect(pixelsToMm(300, 300)).toBeCloseTo(25.4, 10);
  });

  it('applyOrientation 仅交换宽高，面积不变', () => {
    const swapped = applyOrientation({ widthMm: 210, heightMm: 297 }, 'landscape');
    expect(swapped).toEqual({ widthMm: 297, heightMm: 210 });
    const kept = applyOrientation({ widthMm: 210, heightMm: 297 }, 'portrait');
    expect(kept).toEqual({ widthMm: 210, heightMm: 297 });
  });

  it('mmToUnit 正确换算 cm 与 in', () => {
    expect(mmToUnit(210, 'cm')).toBeCloseTo(21, 10);
    expect(mmToUnit(25.4, 'in')).toBeCloseTo(1, 10);
    expect(mmToUnit(210, 'mm')).toBe(210);
  });

  it('getPresetById 命中标准表', () => {
    expect(getPresetById('A4')).toMatchObject({ widthMm: 210, heightMm: 297 });
    expect(getPresetById('letter')).toMatchObject({ widthMm: 215.9, heightMm: 279.4 });
    expect(getPresetById('not-exist')).toBeUndefined();
  });
});

describe('findClosestPaper 匹配逻辑', () => {
  it('完全匹配误差为 0', () => {
    const match = findClosestPaper({ widthMm: 210, heightMm: 297 });
    expect(match.preset.id).toBe('A4');
    expect(match.relativeError).toBe(0);
    expect(match.withinTolerance).toBe(true);
  });

  it('偏差超过 2% 时不标注近似匹配', () => {
    // 100×100mm 正方形与任何标准纸张差异都较大
    const match = findClosestPaper({ widthMm: 100, heightMm: 100 });
    expect(match).not.toBeNull();
    expect(match.relativeError).toBeGreaterThan(0.02);
    expect(match.withinTolerance).toBe(false);
  });
});

describe('非法输入返回明确错误', () => {
  it('DPI 为 0、负数、非数字、超范围报错', () => {
    expect(paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 0, orientation: 'portrait' }).error).toMatch(/DPI/);
    expect(paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: -96, orientation: 'portrait' }).error).toMatch(/DPI/);
    expect(paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 'abc', orientation: 'portrait' }).error).toMatch(/DPI/);
    expect(paperToPixels({ width: 210, height: 297, unit: 'mm', dpi: 3000, orientation: 'portrait' }).error).toMatch(/DPI/);
  });

  it('边长为 0 或负数报错', () => {
    expect(paperToPixels({ width: 0, height: 297, unit: 'mm', dpi: 300, orientation: 'portrait' }).error).toMatch(/宽度/);
    expect(paperToPixels({ width: 210, height: -5, unit: 'mm', dpi: 300, orientation: 'portrait' }).error).toMatch(/高度/);
  });

  it('像素边长超过 100000 报错', () => {
    expect(pixelsToPaper({ widthPx: 100001, heightPx: 3508, dpi: 300 }).error).toMatch(/像素边长/);
  });

  it('边长上限 100000 可用，其乘积 1e10 恰为总像素上限', () => {
    const max = pixelsToPaper({ widthPx: 100000, heightPx: 100000, dpi: 300 });
    expect(max.error).toBeNull();
    expect(max.totalPixels).toBe(1e10);
  });

  it('像素非整数报错', () => {
    expect(pixelsToPaper({ widthPx: 2480.5, heightPx: 3508, dpi: 300 }).error).toMatch(/整数/);
  });

  it('反向 DPI 非法报错', () => {
    expect(pixelsToPaper({ widthPx: 2480, heightPx: 3508, dpi: 0 }).error).toMatch(/DPI/);
  });
});
