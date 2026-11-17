import { describe, it, expect } from 'vitest';
import {
  RE_LOWER,
  RE_UPPER,
  GRAVITY,
  velocityFromFlowRate,
  flowRateFromVelocity,
  reynoldsNumber,
  flowRegime,
  frictionFactor,
  headLossPerLength,
  pressureDropPerLength,
  calculatePipeFlow,
  normalizeInputs,
  FLOW_RATE_UNITS,
  KINEMATIC_VISCOSITY_UNITS,
} from './pipe-flow';

/** 20 °C 清水物性 */
const WATER_20C = { nu: 1.004e-6, rho: 998.2 };

describe('雷诺数与流态判定', () => {
  it('20°C 水、d=0.05m、v=1m/s → Re≈4.98e4 且判定湍流', () => {
    const re = reynoldsNumber(1, 0.05, WATER_20C.nu);
    expect(re).toBeCloseTo(49800.8, 0);
    expect(re).toBeGreaterThan(4.9e4);
    expect(re).toBeLessThan(5.0e4);
    expect(flowRegime(re)).toBe('turbulent');
  });

  it('层流 / 临界 / 湍流分界正确（含边界 2300 与 4000）', () => {
    expect(flowRegime(RE_LOWER - 1)).toBe('laminar');
    expect(flowRegime(RE_LOWER)).toBe('critical');
    expect(flowRegime((RE_LOWER + RE_UPPER) / 2)).toBe('critical');
    expect(flowRegime(RE_UPPER)).toBe('critical');
    expect(flowRegime(RE_UPPER + 1)).toBe('turbulent');
  });

  it('非正输入抛出明确错误', () => {
    expect(() => reynoldsNumber(0, 0.05, 1e-6)).toThrow('流速');
    expect(() => reynoldsNumber(1, -0.05, 1e-6)).toThrow('内径');
    expect(() => reynoldsNumber(1, 0.05, 0)).toThrow('黏度');
    expect(() => flowRegime(NaN)).toThrow();
  });
});

describe('Darcy 摩擦系数', () => {
  it('层流 f = 64/Re 精确成立', () => {
    const re = 1000;
    expect(frictionFactor(re)).toBeCloseTo(64 / re, 12);
    expect(frictionFactor(1500, 0.001)).toBeCloseTo(64 / 1500, 12);
  });

  it('临界区返回 null 而非强行给值', () => {
    expect(frictionFactor(3000)).toBeNull();
    expect(frictionFactor(RE_LOWER)).toBeNull();
    expect(frictionFactor(RE_UPPER)).toBeNull();
  });

  it('湍流 Swamee–Jain 与 Colebrook 参考值偏差 <2%', () => {
    // Colebrook 参考解（高保真数值解，Darcy f）：
    // 1/sqrt(f) = -2 log10( eps/(3.7d) + 2.51/(Re sqrt(f)) )
    const colebrook = (re: number, rr: number): number => {
      let f = 0.02;
      for (let i = 0; i < 100; i += 1) {
        const x = 1 / Math.sqrt(f);
        const next = -2 * Math.log10(rr / 3.7 + 2.51 / (re * Math.sqrt(f)));
        f = 1 / (next * next);
        if (Math.abs(x - 1 / Math.sqrt(f)) < 1e-12) break;
      }
      return f;
    };
    const cases: Array<[number, number]> = [
      [1e4, 0],
      [1e5, 0],
      [1e6, 0],
      [1e4, 0.001],
      [1e5, 0.001],
      [1e6, 0.01],
      [5e4, 0.0005],
    ];
    for (const [re, rr] of cases) {
      const sj = frictionFactor(re, rr) as number;
      const ref = colebrook(re, rr);
      expect(Math.abs(sj - ref) / ref).toBeLessThan(0.02);
    }
  });

  it('负粗糙度抛错', () => {
    expect(() => frictionFactor(1e5, -0.01)).toThrow('粗糙度');
  });
});

describe('Darcy–Weisbach 水头损失与压降', () => {
  it('层流解析级联：hf/L = f·v²/(2gd)，ΔP/L = ρg·hf/L', () => {
    const v = 0.02;
    const d = 0.05;
    const re = reynoldsNumber(v, d, WATER_20C.nu); // ≈ 996，层流
    expect(flowRegime(re)).toBe('laminar');
    const f = frictionFactor(re) as number;
    const hf = headLossPerLength(f, v, d);
    expect(hf).toBeCloseTo((f * v * v) / (2 * GRAVITY * d), 12);
    const dp = pressureDropPerLength(hf, WATER_20C.rho);
    expect(dp).toBeCloseTo(WATER_20C.rho * GRAVITY * hf, 8);
  });

  it('水头损失非正摩擦系数抛错', () => {
    expect(() => headLossPerLength(0, 1, 0.05)).toThrow('摩擦系数');
    expect(() => pressureDropPerLength(0.01, 0)).toThrow('密度');
  });
});

describe('Q ↔ v 换算', () => {
  it('往返一致：Q→v→Q 还原', () => {
    const d = 0.1;
    const q = 0.00785; // m³/s
    const v = velocityFromFlowRate(q, d);
    expect(flowRateFromVelocity(v, d)).toBeCloseTo(q, 12);
  });

  it('流量单位倍率正确（m³/h 与 L/min）', () => {
    const m3h = FLOW_RATE_UNITS.find((u) => u.label === 'm³/h');
    const lmin = FLOW_RATE_UNITS.find((u) => u.label === 'L/min');
    expect(m3h?.factor).toBeCloseTo(1 / 3600, 12);
    expect(lmin?.factor).toBeCloseTo(0.001 / 60, 12);
    // 36 m³/h = 0.01 m³/s，d=0.1m → v ≈ 1.273 m/s
    const v = velocityFromFlowRate(36 * (m3h?.factor ?? 0), 0.1);
    expect(v).toBeCloseTo(1.2732, 3);
  });

  it('非正输入抛错', () => {
    expect(() => velocityFromFlowRate(0, 0.1)).toThrow('流量');
    expect(() => flowRateFromVelocity(1, 0)).toThrow('内径');
  });
});

describe('端到端 calculatePipeFlow', () => {
  it('湍流完整链路给出 Re/f/hf/ΔP 且无警告', () => {
    const result = calculatePipeFlow({
      velocity: 1,
      diameter: 0.05,
      kinematicViscosity: WATER_20C.nu,
      roughness: 0,
      density: WATER_20C.rho,
    });
    expect(result.regime).toBe('turbulent');
    expect(result.re).toBeCloseTo(49800.8, 0);
    expect(result.friction).toBeGreaterThan(0);
    expect(result.friction).toBeLessThan(0.03);
    expect(result.headLossGradient).toBeGreaterThan(0);
    expect(result.pressureGradient).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('临界区摩擦/损失为 null 并附警告', () => {
    // 取 ν 使 Re 落在 2300–4000：v=1,d=0.05 → ν=1.6e-5 给 Re≈3125
    const result = calculatePipeFlow({
      velocity: 1,
      diameter: 0.05,
      kinematicViscosity: 1.6e-5,
      density: 1.2,
    });
    expect(result.regime).toBe('critical');
    expect(result.friction).toBeNull();
    expect(result.headLossGradient).toBeNull();
    expect(result.pressureGradient).toBeNull();
    expect(result.warnings.join(' ')).toContain('临界');
  });

  it('缺密度时压降为 null 且提示', () => {
    const result = calculatePipeFlow({
      velocity: 1,
      diameter: 0.05,
      kinematicViscosity: WATER_20C.nu,
    });
    expect(result.headLossGradient).toBeGreaterThan(0);
    expect(result.pressureGradient).toBeNull();
    expect(result.warnings.join(' ')).toContain('密度');
  });

  it('相对粗糙度超 0.1 给警告但仍计算', () => {
    const result = calculatePipeFlow({
      velocity: 1,
      diameter: 0.05,
      kinematicViscosity: WATER_20C.nu,
      roughness: 0.01, // ε/d = 0.2
      density: WATER_20C.rho,
    });
    expect(result.relativeRoughness).toBeCloseTo(0.2, 10);
    expect(result.warnings.join(' ')).toContain('0.1');
    expect(result.friction).toBeGreaterThan(0);
  });

  it('负粗糙度与非正输入抛错', () => {
    expect(() =>
      calculatePipeFlow({ velocity: 1, diameter: 0.05, kinematicViscosity: 1e-6, roughness: -1 }),
    ).toThrow('粗糙度');
    expect(() =>
      calculatePipeFlow({ velocity: -1, diameter: 0.05, kinematicViscosity: 1e-6 }),
    ).toThrow('流速');
  });
});

describe('单位归一化 normalizeInputs', () => {
  it('mm 管径与 cSt 黏度正确换算到 SI', () => {
    const cSt = KINEMATIC_VISCOSITY_UNITS.find((u) => u.label === 'mm²/s (cSt)');
    const normalized = normalizeInputs({
      velocity: { value: 1, factor: 1 },
      diameter: { value: 50, factor: 0.001 },
      kinematicViscosity: { value: 1.004, factor: cSt?.factor ?? 1e-6 },
      density: { value: 998.2, factor: 1 },
    });
    expect(normalized.diameter).toBeCloseTo(0.05, 12);
    expect(normalized.kinematicViscosity).toBeCloseTo(1.004e-6, 12);
    const re = reynoldsNumber(
      normalized.velocity,
      normalized.diameter,
      normalized.kinematicViscosity,
    );
    expect(re).toBeCloseTo(49800.8, 0);
  });

  it('空粗糙度/密度回退为 0 与 undefined', () => {
    const normalized = normalizeInputs({
      velocity: { value: 1, factor: 1 },
      diameter: { value: 0.05, factor: 1 },
      kinematicViscosity: { value: 1e-6, factor: 1 },
    });
    expect(normalized.roughness).toBe(0);
    expect(normalized.density).toBeUndefined();
  });

  it('缺失字段抛错', () => {
    expect(() =>
      normalizeInputs({
        velocity: { value: NaN, factor: 1 },
        diameter: { value: 0.05, factor: 1 },
        kinematicViscosity: { value: 1e-6, factor: 1 },
      }),
    ).toThrow('流速');
  });
});
