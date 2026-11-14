import { describe, expect, it } from 'vitest';
import {
  calculateDof,
  convertLength,
  formatLength,
  hyperfocal,
  solveApertureForDepthOfField,
  validateDofInput,
  type DofInput,
} from './dof';

const fixedCase: DofInput = {
  focalLength: 50,
  aperture: 8,
  subjectDistance: 3000,
  coc: 0.03,
};

describe('calculateDof', () => {
  it('matches the fixed 50mm f/8 3m full-frame case', () => {
    const result = calculateDof(fixedCase);
    expect(result.hyperfocalMm).toBeCloseTo(10466.67, 1);
    expect(result.nearMm).toBeCloseTo(2338, 0);
    expect(result.farMm).toBeCloseTo(4185, 0);
    expect(result.totalMm).toBeCloseTo(1847, 0);
    expect(convertLength(result.hyperfocalMm, 'm')).toBeCloseTo(10.47, 1);
    expect(convertLength(result.nearMm, 'm')).toBeCloseTo(2.34, 1);
    expect(convertLength(result.farMm as number, 'm')).toBeCloseTo(4.19, 1);
    expect(convertLength(result.totalMm as number, 'm')).toBeCloseTo(1.85, 1);
    expect(result.isInfiniteFar).toBe(false);
  });

  it('reports infinity when the focus distance reaches the hyperfocal distance', () => {
    const result = calculateDof({ ...fixedCase, subjectDistance: 20000 });
    expect(result.isInfiniteFar).toBe(true);
    expect(result.farMm).toBeNull();
    expect(result.totalMm).toBeNull();
    expect(result.rearMm).toBeNull();
    expect(formatLength(result.farMm, 'm')).toBe('∞');
  });

  it('keeps front and rear fractions consistent with the boundaries', () => {
    const result = calculateDof(fixedCase);
    expect(result.frontMm).toBeCloseTo(3000 - result.nearMm, 6);
    expect(result.rearMm).toBeCloseTo((result.farMm as number) - 3000, 6);
    expect(result.totalMm).toBeCloseTo(result.frontMm + (result.rearMm as number), 6);
  });

  it('accepts a custom circle of confusion and scales depth accordingly', () => {
    const fullFrame = calculateDof(fixedCase);
    const microFourThirds = calculateDof({ ...fixedCase, coc: 0.015 });
    expect(microFourThirds.totalMm as number).toBeLessThan(fullFrame.totalMm as number);
  });

  it('validates non-physical inputs', () => {
    expect(validateDofInput(fixedCase)).toBeNull();
    expect(validateDofInput({ ...fixedCase, focalLength: 0 })).toBe('焦距必须为正数');
    expect(validateDofInput({ ...fixedCase, aperture: -1 })).toBe('光圈必须为正数');
    expect(validateDofInput({ ...fixedCase, subjectDistance: 0 })).toBe('对焦距离必须为正数');
    expect(validateDofInput({ ...fixedCase, coc: 0 })).toBe('弥散圆直径必须为正数');
    expect(validateDofInput({ ...fixedCase, subjectDistance: 40 })).toBe(
      '对焦距离必须大于焦距（当前接近微距极限）',
    );
    expect(() => calculateDof({ ...fixedCase, aperture: 0 })).toThrow('光圈必须为正数');
  });

  it('computes hyperfocal directly', () => {
    expect(hyperfocal(fixedCase)).toBeCloseTo(10466.67, 1);
    expect(hyperfocal({ focalLength: 24, aperture: 11, coc: 0.03 })).toBeCloseTo(
      (24 ** 2) / (11 * 0.03) + 24,
      6,
    );
  });

  it('converts millimetres into metres, centimetres, and feet', () => {
    expect(convertLength(1000, 'm')).toBe(1);
    expect(convertLength(1000, 'cm')).toBe(100);
    expect(convertLength(1000, 'ft')).toBeCloseTo(3.28084, 4);
    expect(formatLength(1000, 'm')).toBe('1.00 m');
    expect(formatLength(1000, 'cm')).toBe('100.00 cm');
    expect(formatLength(1000, 'ft')).toBe('3.28 ft');
  });
});

describe('solveApertureForDepthOfField', () => {
  it('recovers the aperture that reproduces the target depth', () => {
    const target = calculateDof(fixedCase).totalMm as number;
    const aperture = solveApertureForDepthOfField({
      focalLength: fixedCase.focalLength,
      subjectDistance: fixedCase.subjectDistance,
      coc: fixedCase.coc,
      targetDepthMm: target,
    });
    expect(aperture).not.toBeNull();
    expect(aperture as number).toBeCloseTo(8, 1);
    const recomputed = calculateDof({ ...fixedCase, aperture: aperture as number });
    expect(recomputed.totalMm as number).toBeCloseTo(target, 2);
  });

  it('returns null when the target depth is unreachable', () => {
    const base = {
      focalLength: fixedCase.focalLength,
      subjectDistance: fixedCase.subjectDistance,
      coc: fixedCase.coc,
    };
    expect(solveApertureForDepthOfField({ ...base, targetDepthMm: 1 })).toBeNull();
    expect(
      solveApertureForDepthOfField({ ...base, subjectDistance: fixedCase.focalLength, targetDepthMm: 1000 }),
    ).toBeNull();
  });
});
