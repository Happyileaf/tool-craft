import { describe, expect, it } from 'vitest';
import {
  buildTextShadow,
  buildTextShadowDeclaration,
  formatLayer,
  isValidShadowColor,
  validateLayer,
  type TextShadowLayer,
} from './textShadow';

const layer = (overrides: Partial<TextShadowLayer> = {}): TextShadowLayer => ({
  offsetX: 2,
  offsetY: 4,
  blur: 6,
  color: '#00000080',
  enabled: true,
  ...overrides,
});

describe('isValidShadowColor', () => {
  it('accepts hex and functional notation', () => {
    expect(isValidShadowColor('#fff')).toBe(true);
    expect(isValidShadowColor('#3366ff')).toBe(true);
    expect(isValidShadowColor('rgba(0, 0, 0, 0.5)')).toBe(true);
    expect(isValidShadowColor('hsl(210, 50%, 50%)')).toBe(true);
  });

  it('rejects blank, named keywords or malformed values', () => {
    expect(isValidShadowColor('')).toBe(false);
    expect(isValidShadowColor('   ')).toBe(false);
    expect(isValidShadowColor('red')).toBe(false);
    expect(isValidShadowColor('#12')).toBe(false);
  });
});

describe('validateLayer', () => {
  it('accepts a valid layer', () => {
    expect(validateLayer(layer())).toBeNull();
  });

  it('rejects non-finite offsets', () => {
    expect(validateLayer(layer({ offsetX: Number.NaN }))).toMatch(/偏移/);
  });

  it('rejects negative or invalid blur', () => {
    expect(validateLayer(layer({ blur: -1 }))).toMatch(/模糊/);
    expect(validateLayer(layer({ blur: Number.NaN }))).toMatch(/模糊/);
  });

  it('rejects bad color', () => {
    expect(validateLayer(layer({ color: 'nope!' }))).toMatch(/颜色/);
  });
});

describe('formatLayer', () => {
  it('renders offset, blur in px and color', () => {
    expect(formatLayer(layer())).toBe('2px 4px 6px #00000080');
  });

  it('supports negative offsets and zero blur', () => {
    expect(formatLayer(layer({ offsetX: -2, offsetY: 0, blur: 0, color: 'rgb(255,0,0)' }))).toBe(
      '-2px 0px 0px rgb(255,0,0)',
    );
  });

  it('normalizes negative zero and rounds decimals', () => {
    expect(formatLayer(layer({ offsetX: -0, offsetY: 1.235, blur: 2.0001 }))).toBe(
      '0px 1.24px 2px #00000080',
    );
  });
});

describe('buildTextShadow', () => {
  it('joins enabled valid layers with comma', () => {
    const css = buildTextShadow([
      layer({ offsetX: 1, color: '#ff0000' }),
      layer({ offsetX: 3, color: '#00ff00' }),
    ]);
    expect(css).toBe('1px 4px 6px #ff0000, 3px 4px 6px #00ff00');
  });

  it('skips disabled and invalid layers', () => {
    const css = buildTextShadow([
      layer({ enabled: false }),
      layer({ color: 'bad' }),
      layer({ offsetX: 5, color: '#0000ff' }),
    ]);
    expect(css).toBe('5px 4px 6px #0000ff');
  });

  it('returns empty string when nothing valid', () => {
    expect(buildTextShadow([layer({ enabled: false })])).toBe('');
    expect(buildTextShadow([])).toBe('');
  });
});

describe('buildTextShadowDeclaration', () => {
  it('wraps value in a full declaration', () => {
    expect(buildTextShadowDeclaration([layer()])).toBe('text-shadow: 2px 4px 6px #00000080;');
  });

  it('returns empty string without valid layers', () => {
    expect(buildTextShadowDeclaration([])).toBe('');
  });
});
