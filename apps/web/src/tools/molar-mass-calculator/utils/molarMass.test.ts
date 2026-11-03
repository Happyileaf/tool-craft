import { describe, expect, it } from 'vitest';
import {
  calculateBatch,
  calculateMolarMass,
  formatMass,
  parseFormula,
  parseSegment,
} from './molarMass';
import { FORMULA_SPLIT_PATTERN } from '../constants';

describe('parseSegment', () => {
  it('解析简单元素与下标', () => {
    expect(Object.fromEntries(parseSegment('H2O'))).toEqual({ H: 2, O: 1 });
    expect(Object.fromEntries(parseSegment('CO2'))).toEqual({ C: 1, O: 2 });
    expect(Object.fromEntries(parseSegment('NaCl'))).toEqual({ Na: 1, Cl: 1 });
  });

  it('解析双字母元素与连续大写', () => {
    expect(Object.fromEntries(parseSegment('He'))).toEqual({ He: 1 });
    expect(Object.fromEntries(parseSegment('C2H5OH'))).toEqual({ C: 2, H: 6, O: 1 });
  });

  it('解析嵌套/普通括号', () => {
    expect(Object.fromEntries(parseSegment('Ca(OH)2'))).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(Object.fromEntries(parseSegment('Fe2(SO4)3'))).toEqual({ Fe: 2, S: 3, O: 12 });
    expect(Object.fromEntries(parseSegment('Ca3(PO4)2'))).toEqual({ Ca: 3, P: 2, O: 8 });
  });

  it('解析方括号与深层嵌套', () => {
    expect(Object.fromEntries(parseSegment('K4[Fe(CN)6]'))).toEqual({
      K: 4,
      Fe: 1,
      C: 6,
      N: 6,
    });
  });

  it('报错：未知元素', () => {
    expect(() => parseSegment('X2')).toThrow('未知元素符号');
    expect(() => parseSegment('h2o')).toThrow('无法识别');
  });

  it('报错：括号不匹配', () => {
    expect(() => parseSegment('(H2O')).toThrow('未闭合');
    expect(() => parseSegment('H2O)')).toThrow('多余的');
  });

  it('报错：零下标与游离数字', () => {
    expect(() => parseSegment('H0')).toThrow('不能为 0');
    expect(() => parseSegment('H2O0')).toThrow('不能为 0');
    expect(() => parseSegment('(H2O)0')).toThrow('不能为 0');
    expect(() => parseSegment('12H')).toThrow('缺少元素');
  });
});

describe('parseFormula 结晶水', () => {
  it('解析中点结晶水', () => {
    const { counts, parts, normalized } = parseFormula('CuSO4·5H2O');
    expect(Object.fromEntries(counts)).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(parts).toEqual([
      { coefficient: 1, segment: 'CuSO4' },
      { coefficient: 5, segment: 'H2O' },
    ]);
    expect(normalized).toBe('CuSO4·5H2O');
  });

  it('兼容粗中点与星号分隔符', () => {
    expect(Object.fromEntries(parseFormula('CuSO4•5H2O').counts)).toEqual({
      Cu: 1,
      S: 1,
      O: 9,
      H: 10,
    });
    expect(Object.fromEntries(parseFormula('CuSO4*5H2O').counts)).toEqual({
      Cu: 1,
      S: 1,
      O: 9,
      H: 10,
    });
  });

  it('去除空白', () => {
    const r = parseFormula('CuSO4 · 5 H2O');
    expect(Object.fromEntries(r.counts)).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it('空输入与分隔符旁空缺报错', () => {
    expect(() => parseFormula('   ')).toThrow('请输入');
    expect(() => parseFormula('CuSO4·')).toThrow();
    expect(() => parseFormula('·5H2O')).toThrow();
  });

  it('剥离电荷后缀（不影响质量）', () => {
    expect(Object.fromEntries(parseFormula('SO4^2-').counts)).toEqual({ S: 1, O: 4 });
    expect(Object.fromEntries(parseFormula('SO4{2-}').counts)).toEqual({ S: 1, O: 4 });
    expect(Object.fromEntries(parseFormula('Na+').counts)).toEqual({ Na: 1 });
  });
});

describe('calculateMolarMass', () => {
  it('H2O = 18.015 g/mol（IUPAC 2021 固定向量）', () => {
    const r = calculateMolarMass('H2O');
    expect(r.molarMass).toBeCloseTo(18.015, 10);
    expect(r.totalAtoms).toBe(3);
    expect(r.breakdown.map((b) => b.symbol)).toEqual(['H', 'O']);
    expect(r.breakdown[0]?.count).toBe(2);
    expect(r.breakdown[0]?.massPercent).toBeCloseTo((2.016 / 18.015) * 100, 6);
    expect(r.breakdown[1]?.massPercent).toBeCloseTo((15.999 / 18.015) * 100, 6);
  });

  it('NaCl ≈ 58.4398 g/mol', () => {
    expect(calculateMolarMass('NaCl').molarMass).toBeCloseTo(58.43976928, 6);
  });

  it('Ca(OH)2 = 74.092 g/mol', () => {
    const r = calculateMolarMass('Ca(OH)2');
    expect(r.molarMass).toBeCloseTo(74.092, 6);
  });

  it('H2SO4 = 98.072 g/mol', () => {
    expect(calculateMolarMass('H2SO4').molarMass).toBeCloseTo(98.072, 6);
  });

  it('C2H5OH = 46.069 g/mol', () => {
    expect(calculateMolarMass('C2H5OH').molarMass).toBeCloseTo(46.069, 6);
  });

  it('C6H12O6 葡萄糖 = 180.156 g/mol', () => {
    expect(calculateMolarMass('C6H12O6').molarMass).toBeCloseTo(180.156, 6);
  });

  it('Fe2(SO4)3 = 399.858 g/mol', () => {
    expect(calculateMolarMass('Fe2(SO4)3').molarMass).toBeCloseTo(399.858, 6);
  });

  it('CuSO4·5H2O 五水硫酸铜 = 249.677 g/mol', () => {
    const r = calculateMolarMass('CuSO4·5H2O');
    expect(r.molarMass).toBeCloseTo(249.677, 6);
    expect(r.normalized).toBe('CuSO4·5H2O');
  });

  it('质量百分比之和为 100', () => {
    const r = calculateMolarMass('Fe2(SO4)3');
    const sum = r.breakdown.reduce((acc, b) => acc + b.massPercent, 0);
    expect(sum).toBeCloseTo(100, 9);
  });

  it('放射性元素使用方括号近似值并标记', () => {
    const r = calculateMolarMass('Tc2O7');
    expect(r.molarMass).toBeCloseTo(2 * 98 + 7 * 15.999, 6);
    expect(r.bracketedSymbols).toContain('Tc');
    expect(r.breakdown.find((b) => b.symbol === 'Tc')?.bracketed).toBe(true);
  });

  it('formula 字段去除空白', () => {
    expect(calculateMolarMass('  H2 O ').formula).toBe('H2O');
  });
});

describe('calculateBatch', () => {
  it('多化学式独立成功/失败', () => {
    const results = calculateBatch('H2O, NaCl\nXz; H2O', FORMULA_SPLIT_PATTERN);
    expect(results).toHaveLength(4);
    expect(results[0]?.result?.molarMass).toBeCloseTo(18.015, 6);
    expect(results[1]?.result?.molarMass).toBeCloseTo(58.43976928, 6);
    expect(results[2]?.result).toBeNull();
    expect(results[2]?.error).toContain('未知元素');
    expect(results[3]?.result?.molarMass).toBeCloseTo(18.015, 6);
  });

  it('空文本返回空数组', () => {
    expect(calculateBatch('  \n ', FORMULA_SPLIT_PATTERN)).toEqual([]);
  });
});

describe('formatMass', () => {
  it('去除多余尾零', () => {
    expect(formatMass(18.015)).toBe('18.015');
    expect(formatMass(58.43976928, 4)).toBe('58.4398');
    expect(formatMass(249.681, 4)).toBe('249.681');
    expect(formatMass(40)).toBe('40');
  });
});
