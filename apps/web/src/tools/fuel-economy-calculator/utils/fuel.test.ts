import { describe, expect, it } from 'vitest';
import { FuelEconomyUnitEnum, convertFuelEconomy, estimateTripCost } from './fuel';

describe('convertFuelEconomy', () => {
  it('8 L/100km 换算为 12.5 km/L 与约 29.40 MPG（美制）', () => {
    const values = convertFuelEconomy(8, FuelEconomyUnitEnum.L_PER_100KM);
    expect(values.lPer100Km).toBeCloseTo(8, 10);
    expect(values.kmPerL).toBeCloseTo(12.5, 10);
    expect(values.mpgUs).toBeCloseTo(29.4, 1);
    expect(values.mpgUk).toBeCloseTo(35.31, 1);
  });

  it('30 MPG（美制）换算为约 7.84 L/100km', () => {
    const values = convertFuelEconomy(30, FuelEconomyUnitEnum.MPG_US);
    expect(values.lPer100Km).toBeCloseTo(7.84, 1);
    expect(values.kmPerL).toBeCloseTo(12.75, 1);
  });

  it('36 MPG（英制）约等于 29.98 MPG（美制）', () => {
    const values = convertFuelEconomy(36, FuelEconomyUnitEnum.MPG_UK);
    expect(values.mpgUs).toBeCloseTo(29.98, 1);
  });

  it('100 km/L 等于 1 L/100km', () => {
    const values = convertFuelEconomy(100, FuelEconomyUnitEnum.KM_PER_L);
    expect(values.lPer100Km).toBeCloseTo(1, 10);
    expect(values.mpgUs).toBeCloseTo(235.21, 1);
  });

  it('往返换算可还原原始数值', () => {
    const roundTrip = convertFuelEconomy(
      convertFuelEconomy(8, FuelEconomyUnitEnum.L_PER_100KM).mpgUs,
      FuelEconomyUnitEnum.MPG_US,
    );
    expect(roundTrip.lPer100Km).toBeCloseTo(8, 10);
  });

  it('拒绝非正与非法数值', () => {
    expect(() => convertFuelEconomy(0, FuelEconomyUnitEnum.L_PER_100KM)).toThrow();
    expect(() => convertFuelEconomy(-1, FuelEconomyUnitEnum.KM_PER_L)).toThrow();
    expect(() => convertFuelEconomy(Number.NaN, FuelEconomyUnitEnum.MPG_US)).toThrow();
  });
});

describe('estimateTripCost', () => {
  it('300 km 行程按 8 L/100km 消耗 24 L，油费 180 元', () => {
    const result = estimateTripCost({
      distanceKm: 300,
      litersPer100Km: 8,
      pricePerLiter: 7.5,
      tankLiters: 50,
      travelers: 2,
    });
    expect(result.fuelLiters).toBeCloseTo(24, 10);
    expect(result.totalCost).toBeCloseTo(180, 10);
    expect(result.refuels).toBe(0);
    expect(result.perPersonCost).toBeCloseTo(90, 10);
  });

  it('800 km 行程需要中途加油 1 次', () => {
    const result = estimateTripCost({
      distanceKm: 800,
      litersPer100Km: 8,
      pricePerLiter: 7.5,
      tankLiters: 50,
      travelers: 1,
    });
    expect(result.fuelLiters).toBeCloseTo(64, 10);
    expect(result.refuels).toBe(1);
  });

  it('未提供油箱容量时不估算加油次数', () => {
    const result = estimateTripCost({
      distanceKm: 200,
      litersPer100Km: 8,
      pricePerLiter: 7.5,
      travelers: 4,
    });
    expect(result.refuels).toBeNull();
    expect(result.perPersonCost).toBeCloseTo(30, 10);
  });

  it('拒绝非法输入', () => {
    expect(() =>
      estimateTripCost({ distanceKm: 0, litersPer100Km: 8, pricePerLiter: 7.5, travelers: 1 }),
    ).toThrow();
    expect(() =>
      estimateTripCost({ distanceKm: 100, litersPer100Km: 0, pricePerLiter: 7.5, travelers: 1 }),
    ).toThrow();
    expect(() =>
      estimateTripCost({ distanceKm: 100, litersPer100Km: 8, pricePerLiter: -1, travelers: 1 }),
    ).toThrow();
    expect(() =>
      estimateTripCost({ distanceKm: 100, litersPer100Km: 8, pricePerLiter: 7.5, travelers: 0 }),
    ).toThrow();
    expect(() =>
      estimateTripCost({ distanceKm: 100, litersPer100Km: 8, pricePerLiter: 7.5, travelers: 1.5 }),
    ).toThrow();
  });
});
