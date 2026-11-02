import { describe, it, expect } from 'vitest';
import {
  apparentTemperature,
  heatDangerLevel,
  heatIndexF,
  windChillF,
  windDangerLevel,
} from './apparent-temperature';

describe('heatIndexF', () => {
  it('matches the canonical NWS vector 96F / 65% RH ≈ 121F', () => {
    // NWS 热指数对照表经典向量：96°F、65% 对应约 121°F
    const { value } = heatIndexF(96, 65);
    expect(value).toBeGreaterThan(120.5);
    expect(value).toBeLessThan(121.6);
  });

  it('matches other NWS chart vectors within 1F', () => {
    expect(heatIndexF(90, 60).value).toBeCloseTo(100, 0);
    expect(heatIndexF(100, 40).value).toBeCloseTo(109, 0);
    expect(heatIndexF(85, 40).value).toBeCloseTo(84, 0);
  });

  it('uses the simple formula in cool conditions', () => {
    // 70°F / 50%：简单公式与气温平均 = (69.05 + 70) / 2
    const result = heatIndexF(70, 50);
    expect(result.method).toBe('simple');
    expect(result.value).toBeCloseTo(69.525, 2);
    expect(result.value).toBeLessThan(80);
  });

  it('applies the dry-air adjustment when RH < 13', () => {
    // 95°F / 10%：ADJ1 = (3/4) * sqrt((17-0)/17) = 0.75
    const result = heatIndexF(95, 10);
    expect(result.method).toBe('regression-dry');
    expect(result.value).toBeCloseTo(89.4495873, 1);
  });

  it('applies the humid adjustment when RH > 85 and T in 80-87', () => {
    // 82°F / 90%：ADJ2 = (5/10) * (5/5) = 0.5
    const result = heatIndexF(82, 90);
    expect(result.method).toBe('regression-humid');
    expect(result.value).toBeCloseTo(91.99167784, 1);
  });
});

describe('windChillF', () => {
  it('matches the 2001 NWS formula vectors', () => {
    // 0°F / 15 mph ≈ -19°F（NWS 官方对照表示 -19）
    expect(windChillF(0, 15)).toBeCloseTo(-19.4, 1);
    // 35°F / 10 mph ≈ 27°F
    expect(windChillF(35, 10)).toBeCloseTo(27.4, 1);
    // -10°F / 20 mph ≈ -35°F
    expect(windChillF(-10, 20)).toBeCloseTo(-35.1, 1);
    // -20°F / 60 mph ≈ -62°F
    expect(windChillF(-20, 60)).toBeCloseTo(-62.0, 1);
  });

  it('returns null outside the valid range', () => {
    expect(windChillF(60, 15)).toBeNull();
    expect(windChillF(0, 2)).toBeNull();
  });
});

describe('heatDangerLevel', () => {
  it('classifies NWS heat bands', () => {
    expect(heatDangerLevel(75).key).toBe('safe');
    expect(heatDangerLevel(85).key).toBe('caution');
    expect(heatDangerLevel(95).key).toBe('extreme-caution');
    expect(heatDangerLevel(110).key).toBe('danger');
    expect(heatDangerLevel(130).key).toBe('extreme-danger');
  });
});

describe('windDangerLevel', () => {
  it('classifies NWS wind chill bands by Fahrenheit threshold', () => {
    expect(windDangerLevel(10).key).toBe('safe');
    expect(windDangerLevel(-10).key).toBe('caution');
    expect(windDangerLevel(-30).key).toBe('danger');
    expect(windDangerLevel(-55).key).toBe('extreme-danger');
  });
});

describe('apparentTemperature', () => {
  it('converts Celsius input and returns Celsius output', () => {
    // 35.556°C = 96°F，65% RH ≈ 121°F ≈ 49.4°C
    const result = apparentTemperature('heat-index', {
      temperature: 35.5555556,
      humidity: 65,
      windSpeed: 0,
      unit: 'C',
    });
    expect(result.error).toBeNull();
    expect(result.apparentF).toBeCloseTo(121.0, 0);
    expect(result.apparent).toBeCloseTo(49.46, 1);
  });

  it('accepts km/h wind speed in Celsius mode', () => {
    // -17.778°C = 0°F；24.14 km/h = 15 mph → ≈ -19.4°F ≈ -28.6°C
    const result = apparentTemperature('wind-chill', {
      temperature: -17.7777778,
      humidity: 0,
      windSpeed: 15 * 1.609344,
      unit: 'C',
    });
    expect(result.error).toBeNull();
    expect(result.apparentF).toBeCloseTo(-19.4, 1);
    expect(result.apparent).toBeCloseTo(-28.55, 1);
  });

  it('rejects out-of-range humidity', () => {
    const result = apparentTemperature('heat-index', {
      temperature: 30,
      humidity: 120,
      windSpeed: 0,
      unit: 'C',
    });
    expect(result.error).toContain('湿度');
  });

  it('rejects wind chill when it is too warm or calm', () => {
    const warm = apparentTemperature('wind-chill', {
      temperature: 20,
      humidity: 0,
      windSpeed: 20,
      unit: 'C',
    });
    expect(warm.error).toContain('50');

    const calm = apparentTemperature('wind-chill', {
      temperature: 0,
      humidity: 0,
      windSpeed: 2,
      unit: 'C',
    });
    expect(calm.error).toContain('3 mph');
  });
});
