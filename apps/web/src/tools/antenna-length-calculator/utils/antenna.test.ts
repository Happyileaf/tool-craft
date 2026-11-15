import { describe, expect, it } from 'vitest';
import {
  calculateAntennaLengths,
  formatLength,
  frequencyFromLength,
} from './antenna';

describe('calculateAntennaLengths', () => {
  it('145 MHz 自由空间下的波长与各类天线长度', () => {
    const result = calculateAntennaLengths(145, 1);
    expect(result.wavelengthMeters).toBeCloseTo(2.068966, 6);
    expect(result.wavelengthFeet).toBeCloseTo(6.787944, 5);
    const dipole = result.antennas.find((antenna) => antenna.type === 'dipole');
    expect(dipole?.lengthMeters).toBeCloseTo(0.986207, 6);
    expect(dipole?.lengthFeet).toBeCloseTo(3.235590, 5);
    const quarter = result.antennas.find((antenna) => antenna.type === 'quarterWave');
    expect(quarter?.lengthMeters).toBeCloseTo(0.493103, 6);
  });

  it('433.92 MHz 半波偶极子长度', () => {
    const result = calculateAntennaLengths(433.92, 1);
    const dipole = result.antennas.find((antenna) => antenna.type === 'dipole');
    expect(dipole?.lengthMeters).toBeCloseTo(0.329554, 6);
  });

  it('速度因子按比例缩短物理长度', () => {
    const full = calculateAntennaLengths(145, 1);
    const coax = calculateAntennaLengths(145, 0.85);
    expect(coax.wavelengthMeters).toBeCloseTo(full.wavelengthMeters * 0.85, 6);
    expect(coax.antennas[0]?.lengthMeters).toBeCloseTo((full.antennas[0]?.lengthMeters ?? 0) * 0.85, 6);
  });

  it('拒绝非法频率与速度因子', () => {
    expect(() => calculateAntennaLengths(0, 1)).toThrow();
    expect(() => calculateAntennaLengths(-1, 1)).toThrow();
    expect(() => calculateAntennaLengths(6001, 1)).toThrow();
    expect(() => calculateAntennaLengths(145, 1.2)).toThrow();
    expect(() => calculateAntennaLengths(145, 0.4)).toThrow();
  });
});

describe('frequencyFromLength', () => {
  it('1 米半波偶极子谐振频率约为 143 MHz', () => {
    expect(frequencyFromLength(1, 'dipole', 1)).toBeCloseTo(143, 6);
  });

  it('长度与速度因子影响反推频率', () => {
    expect(frequencyFromLength(0.5, 'dipole', 1)).toBeCloseTo(286, 6);
    expect(frequencyFromLength(1, 'dipole', 0.9)).toBeCloseTo(128.7, 6);
  });

  it('拒绝非法长度', () => {
    expect(() => frequencyFromLength(0, 'dipole', 1)).toThrow();
    expect(() => frequencyFromLength(-1, 'dipole', 1)).toThrow();
    expect(() => frequencyFromLength(1, 'dipole', 1.3)).toThrow();
  });
});

describe('formatLength', () => {
  it('按数量级保留合适精度', () => {
    expect(formatLength(2.068966)).toBe('2.069');
    expect(formatLength(0.3296)).toBe('0.32960');
    expect(formatLength(12.3456)).toBe('12.35');
  });
});
