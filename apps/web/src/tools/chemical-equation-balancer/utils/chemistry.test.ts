import { describe, expect, it } from 'vitest';
import {
  balanceEquation,
  molesFromMass,
  parseEquation,
  parseFormula,
  renderEquation,
  stoichiometryFromMoles,
  STP_GAS_MOLAR_VOLUME,
} from './chemistry';

describe('parseFormula', () => {
  it('解析简单分子式与下标', () => {
    const result = parseFormula('H2O');
    expect(result.ok).toBe(true);
    expect(result.composition).toEqual({ H: 2, O: 1 });
    expect(result.molarMass).toBeCloseTo(18.015, 2);
  });

  it('解析嵌套括号 Ca(OH)2', () => {
    const result = parseFormula('Ca(OH)2');
    expect(result.ok).toBe(true);
    expect(result.composition).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it('解析多层括号 Ca3(PO4)2', () => {
    const result = parseFormula('Ca3(PO4)2');
    expect(result.composition).toEqual({ Ca: 3, P: 2, O: 8 });
  });

  it('解析水合点 CuSO4·5H2O', () => {
    const result = parseFormula('CuSO4·5H2O');
    expect(result.ok).toBe(true);
    expect(result.composition).toEqual({
      Cu: 1,
      S: 1,
      O: 9,
      H: 10,
    });
  });

  it('容忍星号写法的水合点', () => {
    expect(parseFormula('CuSO4*5H2O').composition).toEqual({
      Cu: 1,
      S: 1,
      O: 9,
      H: 10,
    });
  });

  it('非法化学式报错', () => {
    expect(parseFormula('H2!').ok).toBe(false);
    expect(parseFormula('(OH2').ok).toBe(false);
    expect(parseFormula('OH2)').ok).toBe(false);
    expect(parseFormula('Xx2').ok).toBe(false);
  });
});

describe('parseEquation', () => {
  it('按箭头与加号拆分物种', () => {
    const result = parseEquation('Fe + O2 -> Fe2O3');
    expect(result.ok).toBe(true);
    expect(result.reactants).toEqual(['Fe', 'O2']);
    expect(result.products).toEqual(['Fe2O3']);
  });

  it('支持 Unicode 箭头与等号', () => {
    expect(parseEquation('H2 + O2 → H2O').ok).toBe(true);
    expect(parseEquation('H2 + O2 = H2O').ok).toBe(true);
  });

  it('缺少箭头报错', () => {
    expect(parseEquation('H2 + O2').ok).toBe(false);
  });

  it('重复物种报错', () => {
    expect(parseEquation('H2 + H2 -> H2O').ok).toBe(false);
  });
});

describe('balanceEquation 经典配平向量', () => {
  const CASES: Array<[string, number[]]> = [
    ['Fe + O2 -> Fe2O3', [4, 3, 2]],
    ['C2H6 + O2 -> CO2 + H2O', [2, 7, 4, 6]],
    ['H2 + O2 -> H2O', [2, 1, 2]],
    ['CH4 + O2 -> CO2 + H2O', [1, 2, 1, 2]],
    ['N2 + H2 -> NH3', [1, 3, 2]],
    ['Al + HCl -> AlCl3 + H2', [2, 6, 2, 3]],
    ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', [3, 2, 1, 6]],
    ['KClO3 -> KCl + O2', [2, 2, 3]],
    ['C3H8 + O2 -> CO2 + H2O', [1, 5, 3, 4]],
  ];

  CASES.forEach(([equation, expected]) => {
    it(`${equation} → 系数 ${expected.join(',')}`, () => {
      const result = balanceEquation(equation);
      expect(result.ok).toBe(true);
      expect(result.coefficients).toEqual(expected);
    });
  });

  it('配平结果满足元素守恒（Fe + O2 -> Fe2O3）', () => {
    const result = balanceEquation('Fe + O2 -> Fe2O3');
    expect(result.ok).toBe(true);
    const reactants = result.species!.slice(0, result.reactantCount);
    const products = result.species!.slice(result.reactantCount);
    const tally = (side: string[], sign: number): Record<string, number> => {
      const counts: Record<string, number> = {};
      side.forEach((formula) => {
        const index = result.species!.indexOf(formula);
        const coefficient = result.coefficients![index]!;
        const parsed = parseFormula(formula);
        for (const [element, atoms] of Object.entries(parsed.composition!)) {
          counts[element] = (counts[element] ?? 0) + coefficient * atoms * sign;
        }
      });
      return counts;
    };
    const left = tally(reactants, 1);
    const right = tally(products, -1);
    for (const element of new Set([...Object.keys(left), ...Object.keys(right)])) {
      expect((left[element] ?? 0) + (right[element] ?? 0)).toBe(0);
    }
  });

  it('渲染可读配平方程式（系数 1 省略）', () => {
    const result = balanceEquation('CH4 + O2 -> CO2 + H2O');
    expect(result.balancedEquation).toBe('CH4 + 2O2 -> CO2 + 2H2O');
  });

  it('renderEquation 直接调用', () => {
    expect(renderEquation(['H2', 'O2', 'H2O'], [2, 1, 2], 2)).toBe(
      '2H2 + O2 -> 2H2O',
    );
  });

  it('元素只出现在一侧时报错', () => {
    const result = balanceEquation('H2 + O2 -> NaCl');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('守恒');
  });

  it('零空间维数不为 1（自由度过多）时报错', () => {
    // 完全燃烧 C+O2->CO2 可唯一配平
    expect(balanceEquation('C + O2 -> CO2').ok).toBe(true);
    // 同时生成 CO 与 CO2 且缺少其他约束：4 个未知系数、2 条守恒方程，欠定
    const underDetermined = balanceEquation('C + O2 -> CO + CO2');
    expect(underDetermined.ok).toBe(false);
  });
});

describe('化学计量换算', () => {
  const result = balanceEquation('2H2 + O2 -> 2H2O');

  it('按系数比换算物质的量', () => {
    expect(result.ok).toBe(true);
    // 以 O2 = 1 mol 为基准
    const rows = stoichiometryFromMoles(result, 1, 1);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.moles).toBeCloseTo(2, 6);
    expect(rows[1]!.moles).toBeCloseTo(1, 6);
    expect(rows[2]!.moles).toBeCloseTo(2, 6);
  });

  it('质量与标况气体体积正确', () => {
    const rows = stoichiometryFromMoles(result, 1, 1);
    // H2O 摩尔质量约 18.015，2 mol 质量约 36.03
    expect(rows[2]!.mass).toBeCloseTo(2 * 18.015, 1);
    // H2 为 2 mol，标况体积 44.8 L
    expect(rows[0]!.gasVolume).toBeCloseTo(2 * STP_GAS_MOLAR_VOLUME, 5);
  });

  it('molesFromMass 由质量求物质的量', () => {
    expect(molesFromMass(36.03, 18.015)).toBeCloseTo(2, 2);
    expect(molesFromMass(10, 0)).toBe(0);
  });
});
