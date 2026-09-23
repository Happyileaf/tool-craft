import { describe, it, expect } from 'vitest';
import { beautifyCss } from './beautify';

describe('beautifyCss', () => {
  it('should beautify minified CSS with 2-space indent', () => {
    const input = 'body{margin:0;padding:0}h1{color:red}';
    const result = beautifyCss(input, { indentSize: 2 });
    expect(result).toBe(`body {
  margin: 0;
  padding: 0
}

h1 {
  color: red
}`);
  });

  it('should beautify with 4-space indent', () => {
    const input = 'body{margin:0}';
    const result = beautifyCss(input, { indentSize: 4 });
    expect(result).toBe(`body {
    margin: 0
}`);
  });

  it('should handle empty input', () => {
    const result = beautifyCss('', { indentSize: 2 });
    expect(result).toBe('');
  });
});
