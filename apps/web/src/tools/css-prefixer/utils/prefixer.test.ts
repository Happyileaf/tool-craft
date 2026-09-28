import { describe, expect, it } from 'vitest';
import { addCssPrefixes } from './prefixer';

describe('addCssPrefixes', () => {
  it('should add prefixes to flex properties', () => {
    const input = `.container {
  display: flex;
  justify-content: center;
  align-items: center;
}`;
    const result = addCssPrefixes(input);
    expect(result).toContain('-webkit-justify-content');
    expect(result).toContain('-moz-justify-content');
    expect(result).toContain('-ms-justify-content');
    expect(result).toContain('-webkit-align-items');
    expect(result).toContain('-moz-align-items');
    expect(result).toContain('-ms-align-items');
  });

  it('should process inline css without braces', () => {
    const input = 'display: flex; justify-content: center;';
    const result = addCssPrefixes(input);
    expect(result).toContain('display: flex;');
    expect(result).toContain('-webkit-justify-content: center;');
  });

  it('should leave properties that need no prefixes unchanged', () => {
    const input = 'color: red; margin: 10px;';
    const result = addCssPrefixes(input);
    expect(result).toBe('  color: red;\n  margin: 10px;');
  });

  it('adds prefixes to transform', () => {
    const input = 'transform: translate(10px, 20px);';
    const result = addCssPrefixes(input);
    expect(result).toContain('transform: translate(10px, 20px);');
    expect(result).toContain('-webkit-transform: translate(10px, 20px);');
    expect(result).toContain('-moz-transform: translate(10px, 20px);');
    expect(result).toContain('-ms-transform: translate(10px, 20px);');
    expect(result).toContain('-o-transform: translate(10px, 20px);');
  });
});
