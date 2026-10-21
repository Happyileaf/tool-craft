import { describe, it, expect } from 'vitest';
import {
  buildScaleTable,
  convertUnit,
  CssUnitEnum,
  DEFAULT_FONT_SIZE,
  formatUnit,
  isValidContext,
  SCALE_BASE_PX,
  type UnitContext,
} from './css-unit';

const defaultCtx: UnitContext = {
  rootFontSize: DEFAULT_FONT_SIZE,
  parentFontSize: DEFAULT_FONT_SIZE,
};

describe('convertUnit 默认 16px 基准', () => {
  it('16px = 1rem = 1em = 12pt', () => {
    expect(convertUnit(16, CssUnitEnum.PX, CssUnitEnum.REM, defaultCtx)).toBeCloseTo(1, 12);
    expect(convertUnit(16, CssUnitEnum.PX, CssUnitEnum.EM, defaultCtx)).toBeCloseTo(1, 12);
    expect(convertUnit(16, CssUnitEnum.PX, CssUnitEnum.PT, defaultCtx)).toBeCloseTo(12, 12);
  });

  it('12pt = 16px，32px = 2rem = 24pt', () => {
    expect(convertUnit(12, CssUnitEnum.PT, CssUnitEnum.PX, defaultCtx)).toBeCloseTo(16, 12);
    expect(convertUnit(32, CssUnitEnum.PX, CssUnitEnum.REM, defaultCtx)).toBeCloseTo(2, 12);
    expect(convertUnit(32, CssUnitEnum.PX, CssUnitEnum.PT, defaultCtx)).toBeCloseTo(24, 12);
  });

  it('rem 与 em 互转在相同基准下相等', () => {
    expect(convertUnit(1.5, CssUnitEnum.REM, CssUnitEnum.EM, defaultCtx)).toBeCloseTo(1.5, 12);
    expect(convertUnit(1.5, CssUnitEnum.EM, CssUnitEnum.REM, defaultCtx)).toBeCloseTo(1.5, 12);
  });
});

describe('convertUnit 自定义基准', () => {
  it('根字号改为 10px 后 rem 按新基准，em 仍随父级字号，pt 不受影响', () => {
    const ctx: UnitContext = { rootFontSize: 10, parentFontSize: 16 };
    expect(convertUnit(20, CssUnitEnum.PX, CssUnitEnum.REM, ctx)).toBeCloseTo(2, 12);
    expect(convertUnit(20, CssUnitEnum.PX, CssUnitEnum.EM, ctx)).toBeCloseTo(1.25, 12);
    expect(convertUnit(20, CssUnitEnum.PX, CssUnitEnum.PT, ctx)).toBeCloseTo(15, 12);
  });

  it('父级字号改为 20px 后 em 按新基准，rem 不随之变化', () => {
    const ctx: UnitContext = { rootFontSize: 16, parentFontSize: 20 };
    expect(convertUnit(40, CssUnitEnum.PX, CssUnitEnum.EM, ctx)).toBeCloseTo(2, 12);
    expect(convertUnit(40, CssUnitEnum.PX, CssUnitEnum.REM, ctx)).toBeCloseTo(2.5, 12);
  });
});

describe('convertUnit 可逆与一致性', () => {
  it('四个单位任取为源时换算可逆', () => {
    const units = [CssUnitEnum.PX, CssUnitEnum.REM, CssUnitEnum.EM, CssUnitEnum.PT];
    for (const from of units) {
      for (const to of units) {
        const forward = convertUnit(10, from, to, defaultCtx);
        expect(forward).not.toBeNull();
        const backward = convertUnit(forward as number, to, from, defaultCtx);
        expect(backward).toBeCloseTo(10, 9);
      }
    }
  });
});

describe('convertUnit 非法输入', () => {
  it('非有限数值返回 null', () => {
    expect(convertUnit(NaN, CssUnitEnum.PX, CssUnitEnum.REM, defaultCtx)).toBeNull();
    expect(convertUnit(Infinity, CssUnitEnum.PX, CssUnitEnum.PT, defaultCtx)).toBeNull();
  });

  it('非正或非法基准返回 null', () => {
    expect(isValidContext({ rootFontSize: 0, parentFontSize: 16 })).toBe(false);
    expect(isValidContext({ rootFontSize: 16, parentFontSize: -2 })).toBe(false);
    expect(isValidContext({ rootFontSize: NaN, parentFontSize: 16 })).toBe(false);
    expect(convertUnit(16, CssUnitEnum.PX, CssUnitEnum.REM, {
      rootFontSize: 0,
      parentFontSize: 16,
    })).toBeNull();
  });
});

describe('buildScaleTable', () => {
  it('按默认基准生成常用数值对照表', () => {
    const table = buildScaleTable(defaultCtx);
    expect(table).not.toBeNull();
    expect(table).toHaveLength(SCALE_BASE_PX.length);
    const row16 = (table as NonNullable<typeof table>).find((row) => row.px === 16);
    expect(row16?.rem).toBeCloseTo(1, 12);
    expect(row16?.em).toBeCloseTo(1, 12);
    expect(row16?.pt).toBeCloseTo(12, 12);
  });

  it('随自定义基准刷新', () => {
    const table = buildScaleTable({ rootFontSize: 10, parentFontSize: 16 });
    const row20 = (table as NonNullable<typeof table>).find((row) => row.px === 20);
    expect(row20?.rem).toBeCloseTo(2, 12);
    expect(row20?.em).toBeCloseTo(1.25, 12);
  });

  it('非法上下文返回 null', () => {
    expect(buildScaleTable({ rootFontSize: 0, parentFontSize: 16 })).toBeNull();
  });
});

describe('formatUnit', () => {
  it('去除尾随零并控制小数位', () => {
    expect(formatUnit(1)).toBe('1');
    expect(formatUnit(12)).toBe('12');
    expect(formatUnit(1.3333333333)).toBe('1.333333');
    expect(formatUnit(0.1 + 0.2)).toBe('0.3');
  });
});
