import { describe, expect, it } from 'vitest';
import {
  analyzeProjectile,
  toFeetPerSecond,
  toKmh,
  toMetersPerSecond,
  type ProjectileInput,
} from './projectile';

const baseInput = (overrides: Partial<ProjectileInput>): ProjectileInput => ({
  mode: 'oblique',
  initialSpeed: 20,
  angleDeg: 45,
  initialHeight: 0,
  gravity: 9.8,
  speedUnit: 'ms',
  ...overrides,
});

describe('速度单位换算', () => {
  it('km/h 与 m/s 互转', () => {
    expect(toMetersPerSecond(36, 'kmh')).toBeCloseTo(10, 10);
    expect(toKmh(10)).toBeCloseTo(36, 10);
    expect(toMetersPerSecond(72, 'kmh')).toBeCloseTo(20, 10);
  });

  it('ft/s 与 m/s 互转', () => {
    expect(toMetersPerSecond(32.80839895, 'fts')).toBeCloseTo(10, 8);
    expect(toFeetPerSecond(10)).toBeCloseTo(32.80839895, 8);
  });

  it('m/s 透传', () => {
    expect(toMetersPerSecond(15, 'ms')).toBe(15);
  });
});

describe('真空解析解', () => {
  it('斜抛 45°、v=20 m/s、h0=0 的经典向量', () => {
    const result = analyzeProjectile(baseInput({}));
    expect(result.ok).toBe(true);
    const { vacuum } = result;
    // R = v²sin(2θ)/g = 400/9.8
    expect(vacuum.range).toBeCloseTo(40.8163, 3);
    // T = 2v sinθ/g
    expect(vacuum.flightTime).toBeCloseTo(2.8861, 3);
    // H = (v sinθ)²/(2g) = 200/19.6
    expect(vacuum.maxHeight).toBeCloseTo(10.2041, 3);
    expect(vacuum.timeToApex).toBeCloseTo(1.4430, 3);
    expect(vacuum.apexx).toBeCloseTo(20.4082, 3);
    // 同高度落地速率等于初速率
    expect(vacuum.landingSpeed).toBeCloseTo(20, 6);
  });

  it('自由落体：h=20 m，t=sqrt(2h/g)，射程为 0', () => {
    const result = analyzeProjectile(
      baseInput({ mode: 'free-fall', initialSpeed: 0, initialHeight: 20 }),
    );
    expect(result.ok).toBe(true);
    const { vacuum } = result;
    expect(vacuum.flightTime).toBeCloseTo(Math.sqrt((2 * 20) / 9.8), 6);
    expect(vacuum.range).toBe(0);
    expect(vacuum.maxHeight).toBe(20);
    expect(vacuum.timeToApex).toBe(0);
    expect(vacuum.landingSpeed).toBeCloseTo(9.8 * vacuum.flightTime, 6);
    expect(vacuum.points.every((p) => p.x === 0)).toBe(true);
  });

  it('平抛：vx=10 m/s、h0=20 m，水平射程 = vx·t', () => {
    const result = analyzeProjectile(
      baseInput({
        mode: 'horizontal',
        initialSpeed: 10,
        initialHeight: 20,
      }),
    );
    expect(result.ok).toBe(true);
    const { vacuum } = result;
    const t = Math.sqrt((2 * 20) / 9.8);
    expect(vacuum.flightTime).toBeCloseTo(t, 6);
    expect(vacuum.range).toBeCloseTo(10 * t, 6);
    expect(vacuum.maxHeight).toBe(20);
    // 落地速度 sqrt(vx² + (gt)²)
    expect(vacuum.landingSpeed).toBeCloseTo(Math.hypot(10, 9.8 * t), 6);
  });

  it('斜抛带初始高度：v=20、30°、h0=10 m', () => {
    const result = analyzeProjectile(
      baseInput({ angleDeg: 30, initialHeight: 10 }),
    );
    expect(result.ok).toBe(true);
    const { vacuum } = result;
    const vy0 = 10;
    const vx0 = 20 * Math.cos(Math.PI / 6);
    const t = (vy0 + Math.sqrt(vy0 * vy0 + 2 * 9.8 * 10)) / 9.8;
    expect(vacuum.flightTime).toBeCloseTo(t, 6);
    expect(vacuum.range).toBeCloseTo(vx0 * t, 6);
    expect(vacuum.maxHeight).toBeCloseTo(10 + (vy0 * vy0) / (2 * 9.8), 6);
  });

  it('km/h 输入与等价 m/s 输入结果一致', () => {
    const a = analyzeProjectile(baseInput({ initialSpeed: 72, speedUnit: 'kmh' }));
    const b = analyzeProjectile(baseInput({ initialSpeed: 20, speedUnit: 'ms' }));
    expect(a.vacuum.range).toBeCloseTo(b.vacuum.range, 8);
    expect(a.vacuum.flightTime).toBeCloseTo(b.vacuum.flightTime, 8);
  });

  it('轨迹点等时间隔、起点在发射位置、终点落地', () => {
    const { vacuum } = analyzeProjectile(baseInput({ initialHeight: 5 }));
    const points = vacuum.points;
    expect(points[0]?.t).toBe(0);
    expect(points[0]?.x).toBe(0);
    expect(points[0]?.y).toBe(5);
    const last = points[points.length - 1];
    expect(last?.y).toBeCloseTo(0, 9);
    expect(last?.t).toBeCloseTo(vacuum.flightTime, 9);
    const dt = points[1]!.t - points[0]!.t;
    for (let i = 1; i < points.length - 1; i += 1) {
      expect(points[i + 1]!.t - points[i]!.t).toBeCloseTo(dt, 10);
    }
  });

  it('g=9.81 与 g=9.8 结果不同且 9.81 飞行时间更短（同高度下落）', () => {
    const a = analyzeProjectile(
      baseInput({ mode: 'free-fall', initialHeight: 40, gravity: 9.8 }),
    );
    const b = analyzeProjectile(
      baseInput({ mode: 'free-fall', initialHeight: 40, gravity: 9.81 }),
    );
    expect(b.vacuum.flightTime).toBeLessThan(a.vacuum.flightTime);
  });
});

describe('线性空气阻力 RK4 数值解', () => {
  it('k=0 时不返回阻力解', () => {
    const result = analyzeProjectile(baseInput({}));
    expect(result.drag).toBeUndefined();
  });

  it('阻力下射程与飞行时间均小于真空解，落地高度为 0', () => {
    const result = analyzeProjectile(baseInput({ dragCoefficient: 0.2 }));
    expect(result.ok).toBe(true);
    expect(result.drag).toBeDefined();
    const drag = result.drag!;
    expect(drag.range).toBeLessThan(result.vacuum.range);
    expect(drag.flightTime).toBeLessThan(result.vacuum.flightTime);
    expect(drag.points[drag.points.length - 1]?.y).toBeCloseTo(0, 9);
    expect(drag.landingSpeed).toBeLessThan(result.vacuum.landingSpeed);
  });

  it('阻力下单位质量机械能沿轨迹单调不增', () => {
    const { drag } = analyzeProjectile(baseInput({ dragCoefficient: 0.3 }));
    expect(drag).toBeDefined();
    const energy = (p: { vx: number; vy: number; y: number }) =>
      0.5 * (p.vx * p.vx + p.vy * p.vy) + 9.8 * p.y;
    const points = drag!.points;
    for (let i = 1; i < points.length; i += 1) {
      expect(energy(points[i]!)).toBeLessThanOrEqual(energy(points[i - 1]!) + 1e-9);
    }
  });

  it('极小阻力系数的数值解逼近真空解析解（相对误差 < 0.5%）', () => {
    const result = analyzeProjectile(baseInput({ dragCoefficient: 0.001 }));
    const drag = result.drag!;
    const relativeError = (a: number, b: number) => Math.abs(a - b) / b;
    expect(relativeError(drag.range, result.vacuum.range)).toBeLessThan(0.005);
    expect(relativeError(drag.flightTime, result.vacuum.flightTime)).toBeLessThan(0.005);
    expect(relativeError(drag.maxHeight, result.vacuum.maxHeight)).toBeLessThan(0.005);
  });

  it('阻力轨迹标记点等时间隔且时间戳单调递增', () => {
    const { drag } = analyzeProjectile(
      baseInput({ dragCoefficient: 0.15, initialHeight: 8 }),
    );
    const points = drag!.points;
    expect(points[0]?.t).toBe(0);
    for (let i = 1; i < points.length - 1; i += 1) {
      expect(points[i]!.t).toBeGreaterThan(points[i - 1]!.t);
    }
    const interval = points[1]!.t - points[0]!.t;
    for (let i = 1; i < points.length - 2; i += 1) {
      expect(points[i + 1]!.t - points[i]!.t).toBeCloseTo(interval, 9);
    }
  });

  it('自由落体加阻力：存在终端速度趋势，落地速度小于真空值', () => {
    const result = analyzeProjectile(
      baseInput({
        mode: 'free-fall',
        initialSpeed: 0,
        initialHeight: 60,
        dragCoefficient: 0.4,
      }),
    );
    expect(result.drag!.range).toBe(0);
    expect(result.drag!.landingSpeed).toBeLessThan(result.vacuum.landingSpeed);
    // 终端速度 g/k = 24.5 m/s，落地速度不应超过终端速度
    expect(result.drag!.landingSpeed).toBeLessThan(9.8 / 0.4);
  });
});

describe('输入校验', () => {
  it('重力非正数报错', () => {
    expect(analyzeProjectile(baseInput({ gravity: 0 })).ok).toBe(false);
    expect(analyzeProjectile(baseInput({ gravity: -9.8 })).ok).toBe(false);
  });

  it('负初始高度与负初速度报错', () => {
    expect(analyzeProjectile(baseInput({ initialHeight: -1 })).ok).toBe(false);
    expect(analyzeProjectile(baseInput({ initialSpeed: -5 })).ok).toBe(false);
  });

  it('斜抛角度越界报错', () => {
    expect(analyzeProjectile(baseInput({ angleDeg: -10 })).ok).toBe(false);
    expect(analyzeProjectile(baseInput({ angleDeg: 95 })).ok).toBe(false);
  });

  it('负阻力系数报错', () => {
    expect(analyzeProjectile(baseInput({ dragCoefficient: -0.1 })).ok).toBe(false);
  });
});
