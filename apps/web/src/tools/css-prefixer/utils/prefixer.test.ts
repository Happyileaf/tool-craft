import { describe, it, expect } from 'vitest';
import { addVendorPrefixes } from './prefixer';

describe('addVendorPrefixes', () => {
  it('should add prefixes to properties that need them', () => {
    const css = `.container {
  appearance: none;
  transform: translate(0, 0);
  user-select: none;
}`;
    const result = addVendorPrefixes(css);
    expect(result).toContain('-webkit-appearance: none;');
    expect(result).toContain('-moz-appearance: none;');
    expect(result).toContain('-ms-appearance: none;');
    expect(result).toContain('-o-appearance: none;');
    expect(result).toContain('-webkit-transform: translate(0, 0);');
    expect(result).toContain('-webkit-user-select: none;');
    expect(result).toContain('appearance: none;');
  });

  it('should add prefixes to gradient values', () => {
    const css = `div {
  background: linear-gradient(to bottom, red, blue);
}`;
    const result = addVendorPrefixes(css);
    expect(result).toContain('background: -webkit-linear-gradient(to bottom, red, blue);');
    expect(result).toContain('background: -moz-linear-gradient(to bottom, red, blue);');
    expect(result).toContain('background: -o-linear-gradient(to bottom, red, blue);');
    expect(result).toContain('background: linear-gradient(to bottom, red, blue);');
  });

  it('should handle multiple properties in one block', () => {
    const css = `.box {
  display: flex;
  transition: all 0.3s;
  user-select: none;
}`;
    const result = addVendorPrefixes(css);
    expect(result).toContain('display: -webkit-flex;');
    expect(result).toContain('display: -ms-flex;');
    expect(result).toContain('-webkit-transition: all 0.3s;');
    expect(result).toContain('-webkit-user-select: none;');
    expect(result).toContain('display: flex;');
  });
});