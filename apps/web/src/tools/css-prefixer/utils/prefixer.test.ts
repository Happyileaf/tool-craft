import { describe, it, expect } from 'vitest';
import { prefixCss } from './prefixer';

describe('prefixCss', () => {
  it('should return empty string for empty input', () => {
    expect(prefixCss('')).toBe('');
  });

  it('should add prefixes to known properties', () => {
    const css = `.container {
  appearance: none;
  border-radius: 4px;
  transition: all 0.3s;
}`;
    const result = prefixCss(css);
    expect(result).toContain('-webkit-appearance: none;');
    expect(result).toContain('-moz-appearance: none;');
    expect(result).toContain('appearance: none;');
    expect(result).toContain('-webkit-border-radius: 4px;');
    expect(result).toContain('-moz-border-radius: 4px;');
    expect(result).toContain('-webkit-transition: all 0.3s;');
    expect(result).toContain('-o-transition: all 0.3s;');
  });

  it('should not add prefixes to unknown properties', () => {
    const css = `.container {
  margin: 0 auto;
  color: red;
}`;
    const result = prefixCss(css);
    expect(result).toContain('margin: 0 auto;');
    expect(result).toContain('color: red;');
  });

  it('should handle nested selectors', () => {
    const css = `@media screen {
  .container {
    display: flex;
  }
}`;
    const result = prefixCss(css);
    expect(result).toContain('-webkit-display: flex;');
    expect(result).toContain('-ms-display: flex;');
    expect(result).toContain('display: flex;');
  });

  it('should handle comments', () => {
    const css = `/* this is a comment */
.container {
  /* another comment */
  appearance: none;
}`;
    const result = prefixCss(css);
    expect(result).not.toContain('/*');
    expect(result).toContain('appearance: none;');
  });
});
