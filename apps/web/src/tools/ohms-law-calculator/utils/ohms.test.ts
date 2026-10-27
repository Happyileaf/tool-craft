import { describe, it, expect } from 'vitest';
import {
  solveOhmsLaw,
  formatQuantity,
  labelOf,
  baseUnitOf,
  UNIT_OPTIONS,
  type OhmsInputs,
  type QuantityKey,
} from './ohms';

/** 以基准单位构造输入 */
function base(entries: Partial<Record<QuantityKey, number>>): OhmsInputs {
  const result: OhmsInputs = {};
  for (const [key, value] of Object.entries(entries) as [QuantityKey, number][]) {
    result[key] = { value, factor: 1 };
  }
  return result;
}

/** 断言解出的值近似相等（基准单位） */
function expectSolved(
  solved: Partial<Record<QuantityKey, { value: number; formula: string }>>,
  expected: Partial<Record<QuantityKey, number>>,
) {
  for (const [key, value] of Object.entries(expected) as [QuantityKey, number][]) {
    expect(solved[key]).toBeDefined();
    expect(solved[key]?.value).toBeCloseTo(value, 10);
    expect(solved[key]?.formula).toBeTruthy();
  }
}

describe('欧姆定律与功率方程求解', () => {
  it('V、I 已知时求 R 与 P', () => {
    const { solved } = solveOhmsLaw(base({ V: 5, I: 0.005 }));
    expectSolved(solved, { R: 1000, P: 0.025 });
  });

  it('V、R 已知时求 I 与 P（5V / 1kΩ → 5mA / 25mW）', () => {
    const { solved } = solveOhmsLaw(base({ V: 5, R: 1000 }));
    expectSolved(solved, { I: 0.005, P: 0.025 });
  });

  it('V、P 已知时求 I 与 R（开方不出现于此组合，唯一解）', () => {
    const { solved, negative } = solveOhmsLaw(base({ V: 5, P: 0.025 }));
    expectSolved(solved, { I: 0.005, R: 1000 });
    expect(negative).toBeUndefined();
  });

  it('I、R 已知时求 V 与 P', () => {
    const { solved } = solveOhmsLaw(base({ I: 0.005, R: 1000 }));
    expectSolved(solved, { V: 5, P: 0.025 });
  });

  it('I、P 已知时求 V 与 R', () => {
    const { solved } = solveOhmsLaw(base({ I: 0.005, P: 0.025 }));
    expectSolved(solved, { V: 5, R: 1000 });
  });

  it('R、P 已知时给出正负极性双解', () => {
    const { solved, negative, dualNote } = solveOhmsLaw(base({ R: 1000, P: 0.025 }));
    expectSolved(solved, { V: 5, I: 0.005 });
    expectSolved(negative ?? {}, { V: -5, I: -0.005 });
    expect(dualNote).toBeTruthy();
  });

  it('R、P 且 P = 0 时为唯一的零解，不产生负解', () => {
    const { solved, negative } = solveOhmsLaw(base({ R: 1000, P: 0 }));
    expectSolved(solved, { V: 0, I: 0 });
    expect(negative).toBeUndefined();
  });

  it('四种组合的公式标注各不相同且非空', () => {
    const cases: { input: OhmsInputs; keys: QuantityKey[] }[] = [
      { input: base({ V: 12, I: 2 }), keys: ['R', 'P'] },
      { input: base({ V: 12, R: 6 }), keys: ['I', 'P'] },
      { input: base({ I: 2, R: 6 }), keys: ['V', 'P'] },
      { input: base({ I: 2, P: 24 }), keys: ['V', 'R'] },
    ];
    for (const item of cases) {
      const { solved } = solveOhmsLaw(item.input);
      for (const key of item.keys) {
        expect(solved[key]?.formula).toMatch(/[VIRP]/);
      }
    }
  });

  it('单位换算：5V + 1kΩ 以非基准单位输入仍得 5mA / 25mW', () => {
    const { solved } = solveOhmsLaw({
      V: { value: 5000, factor: 0.001 },
      R: { value: 1, factor: 1000 },
    });
    expectSolved(solved, { I: 0.005, P: 0.025 });
  });

  it('更大功率场景：12V / 4Ω → 3A / 36W', () => {
    const { solved } = solveOhmsLaw(base({ V: 12, R: 4 }));
    expectSolved(solved, { I: 3, P: 36 });
  });

  it('市电场景：220V / 1100W → 5A / 44Ω', () => {
    const { solved } = solveOhmsLaw(base({ V: 220, P: 1100 }));
    expectSolved(solved, { I: 5, R: 44 });
  });
});

describe('输入校验与物理无意义情形', () => {
  it('填写字段数少于 2 个时报错', () => {
    expect(() => solveOhmsLaw(base({ V: 5 }))).toThrow(/恰好填写两个/);
  });

  it('一个字段都不填时报错', () => {
    expect(() => solveOhmsLaw({})).toThrow(/恰好填写两个/);
  });

  it('填写超过 2 个字段时报错，避免过定方程组', () => {
    expect(() => solveOhmsLaw(base({ V: 5, I: 1, R: 5 }))).toThrow(/恰好填写两个/);
  });

  it('电阻为负数时报错', () => {
    expect(() => solveOhmsLaw(base({ V: 5, R: -100 }))).toThrow(/电阻不能为负/);
  });

  it('功率为负数时报错', () => {
    expect(() => solveOhmsLaw(base({ I: 1, P: -5 }))).toThrow(/功率不能为负/);
  });

  it('V、I 组合中 I = 0 时报零除错误', () => {
    expect(() => solveOhmsLaw(base({ V: 5, I: 0 }))).toThrow(/零除/);
  });

  it('V、R 组合中 R = 0（短路）时报错', () => {
    expect(() => solveOhmsLaw(base({ V: 5, R: 0 }))).toThrow(/零除|短路/);
  });

  it('V、P 组合中 V = 0 时报错', () => {
    expect(() => solveOhmsLaw(base({ V: 0, P: 10 }))).toThrow(/零除/);
  });

  it('非零电压配零功率属物理矛盾，报错', () => {
    expect(() => solveOhmsLaw(base({ V: 5, P: 0 }))).toThrow(/矛盾/);
  });

  it('I、P 组合中 I = 0 时报错', () => {
    expect(() => solveOhmsLaw(base({ I: 0, P: 10 }))).toThrow(/零除/);
  });

  it('R = 0 且 P > 0 物理不可能，报错', () => {
    expect(() => solveOhmsLaw(base({ R: 0, P: 5 }))).toThrow(/不可能/);
  });

  it('R = 0、P = 0 为退化情形，返回零解与说明', () => {
    const { solved, dualNote } = solveOhmsLaw(base({ R: 0, P: 0 }));
    expect(solved.V?.value).toBe(0);
    expect(solved.I?.value).toBe(0);
    expect(dualNote).toBeTruthy();
  });

  it('I = 0、R 有限时 V 与 P 均为 0（合法零解）', () => {
    const { solved } = solveOhmsLaw(base({ I: 0, R: 1000 }));
    expectSolved(solved, { V: 0, P: 0 });
  });

  it('非有限数值报错', () => {
    expect(() =>
      solveOhmsLaw({ V: { value: Number.NaN, factor: 1 }, I: { value: 1, factor: 1 } }),
    ).toThrow(/数值无效/);
    expect(() =>
      solveOhmsLaw({ V: { value: 5, factor: 0 }, I: { value: 1, factor: 1 } }),
    ).toThrow(/单位倍率无效/);
  });
});

describe('单位与展示', () => {
  it('labelOf / baseUnitOf 返回中文名与基准单位', () => {
    expect(labelOf('V')).toBe('电压');
    expect(labelOf('I')).toBe('电流');
    expect(labelOf('R')).toBe('电阻');
    expect(labelOf('P')).toBe('功率');
    expect(baseUnitOf('R')).toBe('Ω');
  });

  it('UNIT_OPTIONS 覆盖毫 / 千倍率', () => {
    expect(UNIT_OPTIONS.R.map((option) => option.label)).toEqual(['Ω', 'kΩ', 'MΩ']);
    expect(UNIT_OPTIONS.P.map((option) => option.factor)).toEqual([1, 0.001, 1000]);
  });

  it('5mA 在电流单位下自动展示为 mA', () => {
    const formatted = formatQuantity('I', 0.005);
    expect(formatted.value).toBeCloseTo(5, 10);
    expect(formatted.unit).toBe('mA');
  });

  it('25mW 在功率单位下自动展示为 mW', () => {
    const formatted = formatQuantity('P', 0.025);
    expect(formatted.value).toBeCloseTo(25, 10);
    expect(formatted.unit).toBe('mW');
  });

  it('1500Ω 自动展示为 1.5 kΩ', () => {
    const formatted = formatQuantity('R', 1500);
    expect(formatted.value).toBeCloseTo(1.5, 10);
    expect(formatted.unit).toBe('kΩ');
  });

  it('2.2MΩ 自动展示为 MΩ', () => {
    const formatted = formatQuantity('R', 2_200_000);
    expect(formatted.value).toBeCloseTo(2.2, 10);
    expect(formatted.unit).toBe('MΩ');
  });

  it('1100W 自动展示为 1.1 kW', () => {
    const formatted = formatQuantity('P', 1100);
    expect(formatted.value).toBeCloseTo(1.1, 10);
    expect(formatted.unit).toBe('kW');
  });

  it('0 值使用基准单位展示，不切换到毫单位', () => {
    expect(formatQuantity('V', 0).unit).toBe('V');
    expect(formatQuantity('R', 0).unit).toBe('Ω');
  });

  it('负极性解按绝对值规则选择单位，数值保留负号', () => {
    const formatted = formatQuantity('I', -0.005);
    expect(formatted.value).toBeCloseTo(-5, 10);
    expect(formatted.unit).toBe('mA');
  });
});
