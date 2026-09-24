import { describe, expect, test } from 'vitest';
import { convert } from './convert';
import { UNIT_CATEGORIES, UnitCategory } from '../constants';

function getUnit(categoryKey: UnitCategory, unitKey: string) {
  return UNIT_CATEGORIES.find(c => c.key === categoryKey)!
    .units.find(u => u.key === unitKey)!;
}

describe('convert length', () => {
  const category = 'length';
  const km = getUnit(category, 'km');
  const m = getUnit(category, 'm');
  const cm = getUnit(category, 'cm');
  const inUnit = getUnit(category, 'in');

  test('1 km to m', () => {
    expect(convert(1, km, m, category)).toBe(1000);
  });

  test('1 m to cm', () => {
    expect(convert(1, m, cm, category)).toBe(100);
  });

  test('1 inch to cm', () => {
    expect(Math.round(convert(1, inUnit, cm, category) * 100) / 100).toBe(2.54);
  });
});

describe('convert temperature', () => {
  const category = 'temperature';
  const c = getUnit(category, 'c');
  const f = getUnit(category, 'f');
  const k = getUnit(category, 'k');

  test('0 C to F', () => {
    expect(convert(0, c, f, category)).toBe(32);
  });

  test('100 C to F', () => {
    expect(convert(100, c, f, category)).toBe(212);
  });

  test('0 C to K', () => {
    expect(convert(0, c, k, category)).toBe(273.15);
  });

  test('32 F to C', () => {
    expect(convert(32, f, c, category)).toBe(0);
  });

  test('212 F to C', () => {
    expect(convert(212, f, c, category)).toBe(100);
  });
});

describe('convert area', () => {
  test('1 km2 to m2', () => {
    const category = 'area';
    const km2 = getUnit(category, 'km2');
    const m2 = getUnit(category, 'm2');
    expect(convert(1, km2, m2, category)).toBe(1000000);
  });
});
