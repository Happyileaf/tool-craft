import { describe, it, expect } from 'vitest';
import {
  rectangleSection,
  circleSection,
  maxBendingMoment,
  bendingStress,
  maxDeflection,
  checkStress,
  calculateBeam,
  type BeamCaseInputs,
} from './beam';

const L = 4; // 梁长 4 m
const E = 206e9; // 结构钢 206 GPa

describe('截面几何性质', () => {
  it('矩形 b×h：I=bh³/12，W=bh²/6', () => {
    const section = rectangleSection(0.1, 0.2);
    expect(section.inertia).toBeCloseTo((0.1 * 0.2 ** 3) / 12, 15);
    expect(section.inertia).toBeCloseTo(6.6666666667e-5, 12);
    expect(section.sectionModulus).toBeCloseTo((0.1 * 0.2 ** 2) / 6, 15);
    expect(section.sectionModulus).toBeCloseTo(6.6666666667e-4, 12);
  });

  it('实心圆 d：I=πd⁴/64，W=πd³/32', () => {
    const d = 0.12;
    const section = circleSection(d);
    expect(section.inertia).toBeCloseTo((Math.PI * d ** 4) / 64, 15);
    expect(section.sectionModulus).toBeCloseTo((Math.PI * d ** 3) / 32, 15);
  });

  it('非正尺寸抛错', () => {
    expect(() => rectangleSection(0, 0.2)).toThrow('宽度');
    expect(() => rectangleSection(0.1, -1)).toThrow('高度');
    expect(() => circleSection(0)).toThrow('直径');
  });
});

describe('简支梁弯矩与挠度（标准梁表）', () => {
  it('跨中集中力：Mmax=PL/4，δmax=PL³/(48EI)', () => {
    const P = 10e3;
    const section = rectangleSection(0.1, 0.2);
    const inputs: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'central-point',
      length: L,
      pointLoad: P,
    };
    const moment = maxBendingMoment(inputs);
    expect(moment.maxMoment).toBeCloseTo((P * L) / 4, 10);
    expect(moment.location).toBeCloseTo(L / 2, 12);

    const deflection = maxDeflection(inputs, E, section.inertia);
    expect(deflection.maxDeflection).toBeCloseTo(
      (P * L ** 3) / (48 * E * section.inertia),
      14,
    );
    expect(deflection.location).toBeCloseTo(L / 2, 12);
  });

  it('满跨均布：Mmax=qL²/8，δmax=5qL⁴/(384EI)', () => {
    const q = 2e3;
    const section = rectangleSection(0.1, 0.2);
    const inputs: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'uniform',
      length: L,
      uniformLoad: q,
    };
    const moment = maxBendingMoment(inputs);
    expect(moment.maxMoment).toBeCloseTo((q * L ** 2) / 8, 10);
    const deflection = maxDeflection(inputs, E, section.inertia);
    expect(deflection.maxDeflection).toBeCloseTo(
      (5 * q * L ** 4) / (384 * E * section.inertia),
      14,
    );
  });

  it('任意点载 a=L/2 时与跨中公式一致', () => {
    const P = 8e3;
    const section = rectangleSection(0.1, 0.2);
    const arbitrary: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'arbitrary-point',
      length: L,
      pointLoad: P,
      loadPosition: L / 2,
    };
    const central: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'central-point',
      length: L,
      pointLoad: P,
    };
    expect(maxBendingMoment(arbitrary).maxMoment).toBeCloseTo(
      maxBendingMoment(central).maxMoment,
      12,
    );
    expect(maxDeflection(arbitrary, E, section.inertia).maxDeflection).toBeCloseTo(
      maxDeflection(central, E, section.inertia).maxDeflection,
      14,
    );
  });

  it('任意点载一般位置：Mmax=Pab/L', () => {
    const P = 5e3;
    const a = 1.5;
    const inputs: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'arbitrary-point',
      length: L,
      pointLoad: P,
      loadPosition: a,
    };
    const b = L - a;
    expect(maxBendingMoment(inputs).maxMoment).toBeCloseTo((P * a * b) / L, 10);
    // a<b 时内部交换保证公式对称
    const mirrored: BeamCaseInputs = { ...inputs, loadPosition: b };
    expect(maxDeflection(mirrored, E, rectangleSection(0.1, 0.2).inertia).maxDeflection).toBeCloseTo(
      maxDeflection(inputs, E, rectangleSection(0.1, 0.2).inertia).maxDeflection,
      14,
    );
  });

  it('点载位置越界抛错', () => {
    const base: BeamCaseInputs = {
      beamType: 'simply-supported',
      loadType: 'arbitrary-point',
      length: L,
      pointLoad: 1e3,
      loadPosition: L,
    };
    expect(() => maxBendingMoment(base)).toThrow('荷载位置');
    expect(() => maxBendingMoment({ ...base, loadPosition: 0 })).toThrow('荷载位置');
  });
});

describe('悬臂梁弯矩与挠度（固定端 x=0）', () => {
  it('自由端点载：Mmax=PL，δmax=PL³/(3EI)', () => {
    const P = 3e3;
    const section = rectangleSection(0.08, 0.16);
    const inputs: BeamCaseInputs = {
      beamType: 'cantilever',
      loadType: 'central-point',
      length: L,
      pointLoad: P,
    };
    const moment = maxBendingMoment(inputs);
    expect(moment.maxMoment).toBeCloseTo(P * L, 10);
    expect(moment.location).toBe(0);
    const deflection = maxDeflection(inputs, E, section.inertia);
    expect(deflection.maxDeflection).toBeCloseTo(
      (P * L ** 3) / (3 * E * section.inertia),
      14,
    );
    expect(deflection.location).toBe(L);
  });

  it('满跨均布：Mmax=qL²/2，δmax=qL⁴/(8EI)', () => {
    const q = 1.5e3;
    const section = rectangleSection(0.08, 0.16);
    const inputs: BeamCaseInputs = {
      beamType: 'cantilever',
      loadType: 'uniform',
      length: L,
      uniformLoad: q,
    };
    expect(maxBendingMoment(inputs).maxMoment).toBeCloseTo((q * L ** 2) / 2, 10);
    expect(maxDeflection(inputs, E, section.inertia).maxDeflection).toBeCloseTo(
      (q * L ** 4) / (8 * E * section.inertia),
      14,
    );
  });

  it('任意位置点载 a=L 时退化为自由端点载', () => {
    const P = 2e3;
    const section = rectangleSection(0.08, 0.16);
    const arbitrary: BeamCaseInputs = {
      beamType: 'cantilever',
      loadType: 'arbitrary-point',
      length: L,
      pointLoad: P,
      loadPosition: L,
    };
    const tip: BeamCaseInputs = {
      beamType: 'cantilever',
      loadType: 'central-point',
      length: L,
      pointLoad: P,
    };
    expect(maxBendingMoment(arbitrary).maxMoment).toBeCloseTo(maxBendingMoment(tip).maxMoment, 10);
    expect(maxDeflection(arbitrary, E, section.inertia).maxDeflection).toBeCloseTo(
      maxDeflection(tip, E, section.inertia).maxDeflection,
      14,
    );
  });
});

describe('弯曲应力与强度校核', () => {
  it('σ = M/W', () => {
    const section = rectangleSection(0.1, 0.2);
    const stress = bendingStress(10e3, section.sectionModulus);
    expect(stress).toBeCloseTo(10e3 / section.sectionModulus, 8);
  });

  it('利用率与通过判定；恰好等于许用值判通过', () => {
    const allowable = 235e6;
    expect(checkStress(200e6, allowable)).toEqual({
      pass: true,
      utilizationPercent: (200e6 / allowable) * 100,
    });
    const boundary = checkStress(allowable, allowable);
    expect(boundary.pass).toBe(true);
    expect(boundary.utilizationPercent).toBeCloseTo(100, 10);
    expect(checkStress(240e6, allowable).pass).toBe(false);
  });

  it('非法应力输入抛错', () => {
    expect(() => bendingStress(-1, 1e-4)).toThrow('弯矩');
    expect(() => bendingStress(1, 0)).toThrow('截面模量');
    expect(() => checkStress(1, -5)).toThrow('许用应力');
  });
});

describe('端到端 calculateBeam', () => {
  it('简支均布完整链路（含 L/δ 与校核）', () => {
    const section = rectangleSection(0.12, 0.24);
    const result = calculateBeam({
      beamType: 'simply-supported',
      loadType: 'uniform',
      length: 5,
      uniformLoad: 3e3,
      modulus: E,
      section,
      allowableStress: 215e6,
    });
    expect(result.moment.maxMoment).toBeCloseTo((3e3 * 25) / 8, 8);
    expect(result.maxStress).toBeCloseTo(result.moment.maxMoment / section.sectionModulus, 8);
    expect(result.spanDeflectionRatio).toBeGreaterThan(0);
    expect(result.check).not.toBeNull();
    expect(typeof result.check?.pass).toBe('boolean');
  });

  it('未给许用应力时校核为 null 且不报错', () => {
    const result = calculateBeam({
      beamType: 'cantilever',
      loadType: 'central-point',
      length: 2,
      pointLoad: 1e3,
      modulus: E,
      section: circleSection(0.1),
    });
    expect(result.check).toBeNull();
    expect(result.maxStress).toBeGreaterThan(0);
  });

  it('非正 E / I / W 抛错', () => {
    const section = rectangleSection(0.1, 0.2);
    expect(() =>
      calculateBeam({
        beamType: 'simply-supported',
        loadType: 'central-point',
        length: 4,
        pointLoad: 1e3,
        modulus: 0,
        section,
      }),
    ).toThrow('弹性模量');
    expect(() =>
      calculateBeam({
        beamType: 'simply-supported',
        loadType: 'central-point',
        length: 4,
        pointLoad: 1e3,
        modulus: E,
        section: { inertia: -1, sectionModulus: 1 },
      }),
    ).toThrow('惯性矩');
  });
});
