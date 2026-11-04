import { describe, it, expect } from 'vitest';
import {
  dewPoint,
  wetBulbStull,
  psychrometrics,
  altitudeToPressure,
  pressureToAltitude,
  relativeHumidityFromDewPoint,
  P0_HPA,
} from './psychrometrics';

describe('dewPoint (Magnus)', () => {
  it('20 °C / 50 % RH -> ~9.27 °C', () => {
    expect(dewPoint(20, 50)).toBeCloseTo(9.27, 1);
  });

  it('30 °C / 80 % RH -> ~26.2 °C', () => {
    expect(dewPoint(30, 80)).toBeCloseTo(26.2, 1);
  });

  it('100 % RH returns the air temperature', () => {
    expect(dewPoint(25, 100)).toBeCloseTo(25, 9);
  });

  it('dry air yields dew point well below temperature', () => {
    expect(dewPoint(35, 10)).toBeLessThan(0);
  });

  it('rejects invalid humidity', () => {
    expect(() => dewPoint(20, 0)).toThrowError('露点无定义');
    expect(() => dewPoint(20, 101)).toThrowError('100%');
  });
});

describe('wetBulbStull', () => {
  it('20 °C / 50 % RH -> ~13.7 °C', () => {
    expect(wetBulbStull(20, 50)).toBeCloseTo(13.7, 0);
  });

  it('saturated air wet bulb equals dry bulb', () => {
    expect(wetBulbStull(25, 100)).toBeCloseTo(25, 0);
  });

  it('rejects out-of-range RH', () => {
    expect(() => wetBulbStull(20, -1)).toThrow();
  });
});

describe('psychrometrics aggregate', () => {
  it('computes spread and warnings', () => {
    const r = psychrometrics(20, 50);
    expect(r.dewPoint).toBeCloseTo(9.27, 1);
    expect(r.spread).toBeCloseTo(10.73, 1);
    expect(r.warnings).toHaveLength(0);
  });

  it('warns outside Stull envelope', () => {
    const r = psychrometrics(55, 3);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('ISA pressure / altitude', () => {
  it('sea level is 1013.25 hPa', () => {
    expect(altitudeToPressure(0)).toBeCloseTo(P0_HPA, 6);
  });

  it('1500 m -> ~845.6 hPa', () => {
    expect(altitudeToPressure(1500)).toBeCloseTo(845.6, 1);
  });

  it('8848 m base-camp order of magnitude (~300–340 hPa)', () => {
    const p = altitudeToPressure(8848);
    expect(p).toBeGreaterThan(290);
    expect(p).toBeLessThan(350);
  });

  it('pressure -> altitude round-trips', () => {
    for (const h of [0, 500, 1500, 3000, 5500]) {
      const p = altitudeToPressure(h);
      // 反推时以 ISA 15 °C 为基准温度，与正算一致
      expect(pressureToAltitude(p)).toBeCloseTo(h, 6);
    }
  });

  it('rejects invalid pressure and altitude', () => {
    expect(() => altitudeToPressure(-1)).toThrow();
    expect(() => altitudeToPressure(12000)).toThrow();
    expect(() => pressureToAltitude(0)).toThrow();
    expect(() => pressureToAltitude(1100)).toThrow();
  });
});

describe('relativeHumidityFromDewPoint', () => {
  it('recovers the input RH at 20 °C / 50 %', () => {
    const td = dewPoint(20, 50);
    expect(relativeHumidityFromDewPoint(20, td)).toBeCloseTo(50, 6);
  });
});
