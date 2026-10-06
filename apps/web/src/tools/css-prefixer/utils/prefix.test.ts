import { describe, expect, test } from 'vitest';
import { prefixCss } from './prefix';

const defaultOptions = {
  browsers: '> 0.5%, last 2 versions, not dead',
};

describe('prefixCss', () => {
  test('should add prefix to user-select', async () => {
    const css = '.text { user-select: none; }';
    const result = await prefixCss(css, defaultOptions);
    expect(result).toContain('-webkit-user-select: none;');
    expect(result).toContain('-moz-user-select: none;');
    expect(result).toContain('user-select: none;');
  });
});
