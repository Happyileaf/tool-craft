import { describe, expect, test } from 'vitest';
import { convert } from './convert';
import { UNIT_CATEGORIES } from '../constants';

describe('convert length', () => {
  const category = 'length';
  const km = UNIT_CATEGORIES[0].units.find(u => u.key === 'km')!;
  const m = UNIT_CATEGORIES[0].units.find(u => u.key === 'm')!;
  const cm = UNIT_CATEGORIES[0].units.find(u => u.key === 'cm')!;
  const inUnit = UNIT_CATEGORIES[0].units.find(u => u.key === 'in')!;

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
  const c = UNIT_CATEGORIES[4].units.find(u => u.key === 'c')!;
  const f = UNIT_CATEGORIES[4].units.find(u => u.key === 'f')!;
  const k = UNIT_CATEGORIES[4].units.find(u => u.key === 'k')!;

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
  const category = 'area';
  const km2 = UNIT_CATEGORIES[1].units.find(u => u.key === 'km2')!;
  const m2 = UNIT_CATEGORIES[1].units.find(u => u.key === 'm2')!;
  expect(convert(1, km2, m2, category)).toBe(1000000);
});
