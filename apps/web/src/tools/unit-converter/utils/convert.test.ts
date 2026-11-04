import { describe, expect, it } from 'vitest';
import { UnitCategoryEnum, UNIT_CATEGORIES } from '../constants';
import {
  convertBetweenUnits,
  convertValue,
  findCategory,
  findUnit,
  fromBaseUnit,
  roundResult,
  toBaseUnit,
} from './convert';

/**
 * 浮点近似比较辅助：换算结果在 1e-9 相对误差内视为正确
 */
function expectCloseTo(actual: number, expected: number): void {
  const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-9);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe('findCategory / findUnit', () => {
  it('能查到全部已定义分类', () => {
    UNIT_CATEGORIES.forEach((category) => {
      expect(findCategory(category.id)?.id).toBe(category.id);
    });
  });

  it('未知分类返回 undefined', () => {
    expect(findCategory('not-exist')).toBeUndefined();
  });

  it('在分类内按 id 查找单位', () => {
    const length = findCategory(UnitCategoryEnum.Length);
    expect(length).toBeDefined();
    expect(findUnit(length!, 'km')?.symbol).toBe('km');
    expect(findUnit(length!, 'nope')).toBeUndefined();
  });
});

describe('长度换算', () => {
  it('1 千米 = 1000 米', () => {
    const result = convertValue(UnitCategoryEnum.Length, 'km', 'm', 1);
    expect(result).toBe(1000);
  });

  it('1 英寸 = 2.54 厘米（精确值）', () => {
    const result = convertValue(UnitCategoryEnum.Length, 'in', 'cm', 1);
    expect(result).toBe(2.54);
  });

  it('1 英里 ≈ 1609.344 米', () => {
    const result = convertValue(UnitCategoryEnum.Length, 'mi', 'm', 1);
    expectCloseTo(result!, 1609.344);
  });

  it('1 海里 = 1852 米', () => {
    expect(convertValue(UnitCategoryEnum.Length, 'nmi', 'm', 1)).toBe(1852);
  });
});

describe('质量换算', () => {
  it('1 磅 ≈ 0.45359237 千克', () => {
    const result = convertValue(UnitCategoryEnum.Mass, 'lb', 'kg', 1);
    expectCloseTo(result!, 0.45359237);
  });

  it('1000 克 = 1 千克', () => {
    expect(convertValue(UnitCategoryEnum.Mass, 'g', 'kg', 1000)).toBe(1);
  });
});

describe('温度换算（含 offset）', () => {
  it('0°C = 32°F', () => {
    expect(convertValue(UnitCategoryEnum.Temperature, 'c', 'f', 0)).toBe(32);
  });

  it('100°C = 212°F', () => {
    expect(convertValue(UnitCategoryEnum.Temperature, 'c', 'f', 100)).toBe(212);
  });

  it('0°C = 273.15 K', () => {
    expect(convertValue(UnitCategoryEnum.Temperature, 'c', 'k', 0)).toBe(273.15);
  });

  it('华氏转开尔文：32°F = 273.15 K', () => {
    expect(convertValue(UnitCategoryEnum.Temperature, 'f', 'k', 32)).toBe(273.15);
  });

  it('-40°C = -40°F 温标交点', () => {
    expect(convertValue(UnitCategoryEnum.Temperature, 'c', 'f', -40)).toBe(-40);
  });

  it('温度往返换算还原原值', () => {
    const category = findCategory(UnitCategoryEnum.Temperature)!;
    const celsius = findUnit(category, 'c')!;
    const fahrenheit = findUnit(category, 'f')!;
    const base = toBaseUnit(25, celsius);
    const back = fromBaseUnit(base, fahrenheit);
    const roundtrip = fromBaseUnit(toBaseUnit(back, fahrenheit), celsius);
    expectCloseTo(roundtrip, 25);
  });
});

describe('面积与体积', () => {
  it('1 公顷 = 10000 平方米', () => {
    expect(convertValue(UnitCategoryEnum.Area, 'ha', 'm2', 1)).toBe(10000);
  });

  it('1 英亩 ≈ 4046.8564 平方米', () => {
    const result = convertValue(UnitCategoryEnum.Area, 'ac', 'm2', 1);
    expectCloseTo(result!, 4046.8564224);
  });

  it('1 美制加仑 ≈ 3.785411784 升', () => {
    const result = convertValue(UnitCategoryEnum.Volume, 'gal', 'l', 1);
    expectCloseTo(result!, 3.785411784);
  });

  it('1000 毫升 = 1 升', () => {
    expect(convertValue(UnitCategoryEnum.Volume, 'ml', 'l', 1000)).toBe(1);
  });
});

describe('速度换算', () => {
  it('36 km/h = 10 m/s', () => {
    expect(convertValue(UnitCategoryEnum.Speed, 'kmh', 'mps', 36)).toBe(10);
  });

  it('1 节 ≈ 0.514444 m/s', () => {
    const result = convertValue(UnitCategoryEnum.Speed, 'kn', 'mps', 1);
    expectCloseTo(result!, 0.5144444444444444);
  });
});

describe('数据存储换算', () => {
  it('十进制：1 KB = 1000 字节', () => {
    expect(convertValue(UnitCategoryEnum.DataStorage, 'KB', 'B', 1)).toBe(1000);
  });

  it('二进制：1 KiB = 1024 字节', () => {
    expect(convertValue(UnitCategoryEnum.DataStorage, 'KiB', 'B', 1)).toBe(1024);
  });

  it('1 GiB = 1024 MiB', () => {
    expect(convertValue(UnitCategoryEnum.DataStorage, 'GiB', 'MiB', 1)).toBe(1024);
  });

  it('1 字节 = 8 比特', () => {
    expect(convertValue(UnitCategoryEnum.DataStorage, 'B', 'bit', 1)).toBe(8);
  });
});

describe('时间/压强/角度/能量', () => {
  it('1 小时 = 3600 秒', () => {
    expect(convertValue(UnitCategoryEnum.Time, 'h', 's', 1)).toBe(3600);
  });

  it('1 周 = 7 天', () => {
    expect(convertValue(UnitCategoryEnum.Time, 'wk', 'd', 1)).toBe(7);
  });

  it('1 标准大气压 = 101325 帕', () => {
    expect(convertValue(UnitCategoryEnum.Pressure, 'atm', 'pa', 1)).toBe(101325);
  });

  it('180 度 = π 弧度', () => {
    const result = convertValue(UnitCategoryEnum.Angle, 'deg', 'rad', 180);
    expectCloseTo(result!, Math.PI);
  });

  it('1 千卡 = 4184 焦耳', () => {
    expect(convertValue(UnitCategoryEnum.Energy, 'kcal', 'j', 1)).toBe(4184);
  });

  it('1 千瓦时 = 3600000 焦耳', () => {
    expect(convertValue(UnitCategoryEnum.Energy, 'kwh', 'j', 1)).toBe(3600000);
  });
});

describe('恒等、零值与非法输入', () => {
  it('同单位换算恒等', () => {
    const category = findCategory(UnitCategoryEnum.Length)!;
    const meter = findUnit(category, 'm')!;
    expect(convertBetweenUnits(123.456, meter, meter)).toBe(123.456);
  });

  it('零值换算结果为 0（含温度）', () => {
    expect(convertValue(UnitCategoryEnum.Mass, 'kg', 'g', 0)).toBe(0);
    const result = convertValue(UnitCategoryEnum.Temperature, 'c', 'f', 0);
    expect(typeof result).toBe('number');
  });

  it('未知分类/单位返回 null', () => {
    expect(convertValue('nope', 'm', 'km', 1)).toBeNull();
    expect(convertValue(UnitCategoryEnum.Length, 'm', 'nope', 1)).toBeNull();
  });
});

describe('roundResult', () => {
  it('消除浮点尾差', () => {
    expect(roundResult(0.1 + 0.2)).toBe(0.3);
  });

  it('零值与非有限值原样返回', () => {
    expect(roundResult(0)).toBe(0);
    expect(roundResult(Number.NaN)).toBeNaN();
    expect(roundResult(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });

  it('极端量级不强制指数化', () => {
    expect(roundResult(1e18)).toBe(1e18);
  });

  it('按指定有效位截断', () => {
    expect(roundResult(1.23456789, 4)).toBe(1.235);
  });
});
