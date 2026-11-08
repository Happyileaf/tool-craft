import { describe, expect, it } from 'vitest';
import {
  calculateLineCurrent,
  calculatePowerFactor,
  calculateThreePhasePower,
  calculateTorque,
  resolvePhaseQuantities,
  toKilo,
} from './power';

describe('resolvePhaseQuantities', () => {
  it('星形：相电压 = 线电压/√3，相电流 = 线电流', () => {
    const result = resolvePhaseQuantities(400, 10, 'star');
    expect(result.phaseVoltage).toBeCloseTo(230.94, 2);
    expect(result.phaseCurrent).toBe(10);
  });

  it('三角形：相电压 = 线电压，相电流 = 线电流/√3', () => {
    const result = resolvePhaseQuantities(400, 10, 'delta');
    expect(result.phaseVoltage).toBe(400);
    expect(result.phaseCurrent).toBeCloseTo(5.7735, 4);
  });
});

describe('calculateThreePhasePower', () => {
  it('400V/10A/cosφ=1 → S≈6928VA、P≈6928W、Q=0', () => {
    const result = calculateThreePhasePower({
      lineVoltage: 400,
      lineCurrent: 10,
      powerFactor: 1,
      connection: 'star',
    });
    expect(result.apparentPower).toBeCloseTo(6928.2, 1);
    expect(result.activePower).toBeCloseTo(6928.2, 1);
    expect(result.reactivePower).toBeCloseTo(0, 6);
    expect(result.phaseAngle).toBeCloseTo(0, 6);
  });

  it('400V/10A/cosφ=0.8 → P≈5543W、Q≈4157var、φ≈36.87°', () => {
    const result = calculateThreePhasePower({
      lineVoltage: 400,
      lineCurrent: 10,
      powerFactor: 0.8,
      connection: 'delta',
    });
    expect(result.activePower).toBeCloseTo(5542.56, 1);
    expect(result.reactivePower).toBeCloseTo(4156.92, 1);
    expect(result.phaseAngle).toBeCloseTo(36.87, 2);
    expect(result.phaseVoltage).toBe(400);
  });

  it('拒绝非法电压、电流与功率因数', () => {
    expect(() =>
      calculateThreePhasePower({ lineVoltage: 0, lineCurrent: 10, powerFactor: 0.9, connection: 'star' }),
    ).toThrow();
    expect(() =>
      calculateThreePhasePower({ lineVoltage: 400, lineCurrent: -1, powerFactor: 0.9, connection: 'star' }),
    ).toThrow();
    expect(() =>
      calculateThreePhasePower({ lineVoltage: 400, lineCurrent: 10, powerFactor: 0, connection: 'star' }),
    ).toThrow();
    expect(() =>
      calculateThreePhasePower({ lineVoltage: 400, lineCurrent: 10, powerFactor: 1.2, connection: 'star' }),
    ).toThrow();
  });
});

describe('calculateLineCurrent', () => {
  it('与正向计算互逆：5543W/400V/0.8 → 约 10A', () => {
    const current = calculateLineCurrent({
      activePower: 5542.56,
      lineVoltage: 400,
      powerFactor: 0.8,
    });
    expect(current).toBeCloseTo(10, 3);
  });

  it('拒绝非法入参', () => {
    expect(() => calculateLineCurrent({ activePower: 0, lineVoltage: 400, powerFactor: 0.9 })).toThrow();
  });
});

describe('calculatePowerFactor', () => {
  it('cosφ = P/S', () => {
    expect(calculatePowerFactor(5542.56, 6928.2)).toBeCloseTo(0.8, 3);
  });

  it('P > S 时报错', () => {
    expect(() => calculatePowerFactor(110, 100)).toThrow();
  });
});

describe('calculateTorque', () => {
  it('11kW / 1460rpm → 约 71.95 N·m', () => {
    const torque = calculateTorque(11000, 1460);
    expect(torque).toBeCloseTo(71.95, 1);
  });

  it('考虑效率 90% 时轴功率折算', () => {
    const ideal = calculateTorque(11000, 1460);
    const withEfficiency = calculateTorque(11000, 1460, 0.9);
    expect(withEfficiency).toBeCloseTo(ideal * 0.9, 6);
  });

  it('拒绝非法效率', () => {
    expect(() => calculateTorque(1000, 1500, 0)).toThrow();
    expect(() => calculateTorque(1000, 1500, 1.1)).toThrow();
  });
});

describe('toKilo', () => {
  it('瓦转千瓦', () => {
    expect(toKilo(5542.56)).toBeCloseTo(5.54256, 5);
  });
});
