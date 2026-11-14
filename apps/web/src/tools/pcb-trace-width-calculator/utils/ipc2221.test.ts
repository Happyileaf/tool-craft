import { describe, expect, it } from 'vitest';
import {
  calculateMaxCurrent,
  calculateTraceWidth,
  LAYER_K,
  ounceToMil,
} from './ipc2221';

describe('ounceToMil', () => {
  it('converts copper weight to mil thickness', () => {
    expect(ounceToMil(1)).toBeCloseTo(1.378, 5);
    expect(ounceToMil(2)).toBeCloseTo(2.756, 5);
  });

  it('rejects non-positive copper weight', () => {
    expect(() => ounceToMil(0)).toThrow('铜厚');
    expect(() => ounceToMil(-1)).toThrow('铜厚');
  });
});

describe('calculateTraceWidth', () => {
  it('computes the external-layer width for 1 A / 10 °C / 1 oz', () => {
    const result = calculateTraceWidth({
      current: 1,
      tempRise: 10,
      copperOunce: 1,
      layer: 'external',
    });
    expect(result.widthMil).toBeCloseTo(11.826, 3);
    expect(result.widthMm).toBeCloseTo(0.3, 3);
    expect(result.areaMil2).toBeCloseTo(16.296, 3);
    expect(result.thicknessMil).toBeCloseTo(1.378, 5);
  });

  it('produces a wider trace on internal layers', () => {
    const external = calculateTraceWidth({
      current: 1,
      tempRise: 10,
      copperOunce: 1,
      layer: 'external',
    });
    const internal = calculateTraceWidth({
      current: 1,
      tempRise: 10,
      copperOunce: 1,
      layer: 'internal',
    });
    expect(internal.widthMil).toBeCloseTo(30.764, 3);
    expect(internal.widthMm).toBeCloseTo(0.781, 3);
    expect(internal.widthMil).toBeGreaterThan(external.widthMil);
  });

  it('widens with higher current and narrows with higher allowed temperature rise', () => {
    const base = calculateTraceWidth({
      current: 1,
      tempRise: 10,
      copperOunce: 1,
      layer: 'external',
    });
    const moreCurrent = calculateTraceWidth({
      current: 2,
      tempRise: 10,
      copperOunce: 1,
      layer: 'external',
    });
    const moreRise = calculateTraceWidth({
      current: 1,
      tempRise: 20,
      copperOunce: 1,
      layer: 'external',
    });
    expect(moreCurrent.widthMil).toBeGreaterThan(base.widthMil);
    expect(moreRise.widthMil).toBeLessThan(base.widthMil);
  });

  it('uses the documented IPC-2221 constants', () => {
    expect(LAYER_K.external).toBe(0.048);
    expect(LAYER_K.internal).toBe(0.024);
  });

  it('rejects non-positive current and temperature rise', () => {
    expect(() =>
      calculateTraceWidth({ current: 0, tempRise: 10, copperOunce: 1, layer: 'external' }),
    ).toThrow('电流');
    expect(() =>
      calculateTraceWidth({ current: 1, tempRise: 0, copperOunce: 1, layer: 'external' }),
    ).toThrow('温升');
  });
});

describe('calculateMaxCurrent', () => {
  it('estimates the current a 10 mil external trace can carry', () => {
    expect(
      calculateMaxCurrent({
        widthMil: 10,
        tempRise: 10,
        copperOunce: 1,
        layer: 'external',
      }),
    ).toBeCloseTo(0.886, 3);
  });

  it('round-trips with calculateTraceWidth', () => {
    const width = calculateTraceWidth({
      current: 2,
      tempRise: 15,
      copperOunce: 2,
      layer: 'internal',
    });
    expect(
      calculateMaxCurrent({
        widthMil: width.widthMil,
        tempRise: 15,
        copperOunce: 2,
        layer: 'internal',
      }),
    ).toBeCloseTo(2, 8);
  });

  it('rejects non-positive width', () => {
    expect(() =>
      calculateMaxCurrent({
        widthMil: 0,
        tempRise: 10,
        copperOunce: 1,
        layer: 'external',
      }),
    ).toThrow('导线宽度');
  });
});
