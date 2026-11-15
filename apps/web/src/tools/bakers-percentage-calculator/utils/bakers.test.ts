import { describe, expect, it } from 'vitest';
import {
  analyzeRecipe,
  classifyIngredient,
  formatPercent,
  moldFactor,
  roundGrams,
  scaleRecipe,
} from './bakers';

const basicIngredients = [
  { name: '水', grams: 650 },
  { name: '盐', grams: 20 },
  { name: '细砂糖', grams: 50 },
  { name: '干酵母', grams: 10 },
];

describe('classifyIngredient', () => {
  it('识别水、盐、酵母与普通配料', () => {
    expect(classifyIngredient('水')).toBe('water');
    expect(classifyIngredient('Water')).toBe('water');
    expect(classifyIngredient('海盐')).toBe('salt');
    expect(classifyIngredient('即发干酵母')).toBe('yeast');
    expect(classifyIngredient('黄油')).toBe('other');
  });
});

describe('analyzeRecipe', () => {
  it('1000g 面粉与 650g 水等配料得到 65% 含水量与 173% 总百分比', () => {
    const analysis = analyzeRecipe(1000, basicIngredients);
    expect(analysis.hydration).toBeCloseTo(65, 6);
    expect(analysis.saltPercent).toBeCloseTo(2, 6);
    expect(analysis.rows.find((row) => row.name === '细砂糖')?.percent).toBeCloseTo(5, 6);
    expect(analysis.yeastPercent).toBeCloseTo(1, 6);
    expect(analysis.totalPercent).toBeCloseTo(173, 6);
    expect(analysis.totalWeight).toBeCloseTo(1730, 6);
  });

  it('按百分比录入时反推克数', () => {
    const analysis = analyzeRecipe(1000, [
      { name: '水', percent: 65 },
      { name: '盐', percent: 2 },
    ]);
    expect(analysis.rows.find((row) => row.name === '水')?.grams).toBeCloseTo(650, 6);
    expect(analysis.rows.find((row) => row.name === '盐')?.grams).toBeCloseTo(20, 6);
    expect(analysis.totalWeight).toBeCloseTo(1670, 6);
  });

  it('面粉重量或配料数值非法时抛错', () => {
    expect(() => analyzeRecipe(0, basicIngredients)).toThrow('面粉重量必须大于 0');
    expect(() => analyzeRecipe(1000, [{ name: '水', grams: -1 }])).toThrow(
      '配料「水」的克数必须为不小于 0 的数值',
    );
    expect(() => analyzeRecipe(1000, [{ name: '黄油' }])).toThrow(
      '请为配料「黄油」填写克数或百分比',
    );
  });
});

describe('scaleRecipe', () => {
  it('按面粉 2000g 缩放得到 2 倍与 3460g 总重', () => {
    const analysis = analyzeRecipe(1000, basicIngredients);
    const scaled = scaleRecipe(analysis, 'flour', 2000);
    expect(scaled.factor).toBeCloseTo(2, 6);
    expect(scaled.totalWeight).toBeCloseTo(3460, 6);
    expect(scaled.rows.find((row) => row.name === '水')?.grams).toBeCloseTo(1300, 6);
  });

  it('按目标总重 865g 缩放得到 0.5 倍与 500g 面粉', () => {
    const analysis = analyzeRecipe(1000, basicIngredients);
    const scaled = scaleRecipe(analysis, 'totalWeight', 865);
    expect(scaled.factor).toBeCloseTo(0.5, 6);
    expect(scaled.flourGrams).toBeCloseTo(500, 6);
    expect(scaled.rows.find((row) => row.name === '水')?.grams).toBeCloseTo(325, 6);
  });

  it('缩放倍数必须大于 0', () => {
    const analysis = analyzeRecipe(1000, basicIngredients);
    expect(() => scaleRecipe(analysis, 'factor', 0)).toThrow('缩放目标必须大于 0');
  });
});

describe('moldFactor 与格式化', () => {
  it('圆模直径 20cm 换 25cm 的倍数为 1.5625', () => {
    expect(moldFactor('round', 20, 25)).toBeCloseTo(1.5625, 6);
  });

  it('方模边长 20cm 换 24cm 的倍数为 1.44', () => {
    expect(moldFactor('square', 20, 24)).toBeCloseTo(1.44, 6);
  });

  it('同底面积改高度按高度比缩放', () => {
    expect(moldFactor('height', 6, 8)).toBeCloseTo(4 / 3, 6);
  });

  it('模具尺寸非法时抛错', () => {
    expect(() => moldFactor('round', 0, 25)).toThrow('原模具尺寸必须大于 0');
    expect(() => moldFactor('round', 20, 0)).toThrow('新模具尺寸必须大于 0');
  });

  it('克数四舍五入与百分比格式化', () => {
    expect(roundGrams(123.456)).toBe(123.5);
    expect(formatPercent(65)).toBe('65.0%');
  });
});
