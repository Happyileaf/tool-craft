import { describe, expect, it } from 'vitest';
import {
  buildScrollbarCss,
  buildStandardCss,
  buildWebkitCss,
  isValidHexColor,
  toStandardWidthKeyword,
  validateScrollbar,
  type ScrollbarConfig,
} from './scrollbar';

const baseConfig: ScrollbarConfig = {
  width: 12,
  trackColor: '#f1f5f9',
  thumbColor: '#94a3b8',
  thumbHoverColor: '#64748b',
  thumbRadius: 8,
  trackRadius: 0,
  showButtons: false,
};

describe('isValidHexColor', () => {
  it('accepts 3/6/8-digit hex', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#ffffff')).toBe(true);
    expect(isValidHexColor('#ffffffff')).toBe(true);
  });

  it('rejects non-hex and malformed values', () => {
    expect(isValidHexColor('rgb(1,2,3)')).toBe(false);
    expect(isValidHexColor('#ffff')).toBe(false);
    expect(isValidHexColor('blue')).toBe(false);
  });
});

describe('validateScrollbar', () => {
  it('accepts a valid config', () => {
    expect(validateScrollbar(baseConfig)).toBeNull();
  });

  it('rejects non-positive width', () => {
    expect(validateScrollbar({ ...baseConfig, width: 0 })).toMatch(/宽度/);
    expect(validateScrollbar({ ...baseConfig, width: Number.NaN })).toMatch(/宽度/);
  });

  it('rejects bad colors', () => {
    expect(validateScrollbar({ ...baseConfig, trackColor: 'red' })).toMatch(/轨道/);
    expect(validateScrollbar({ ...baseConfig, thumbColor: '#12' })).toMatch(/滑块颜色/);
    expect(validateScrollbar({ ...baseConfig, thumbHoverColor: '' })).toMatch(/hover/);
  });

  it('rejects negative radius', () => {
    expect(validateScrollbar({ ...baseConfig, thumbRadius: -1 })).toMatch(/圆角/);
  });
});

describe('toStandardWidthKeyword', () => {
  it('maps pixel width to standard keyword', () => {
    expect(toStandardWidthKeyword(0)).toBe('none');
    expect(toStandardWidthKeyword(6)).toBe('thin');
    expect(toStandardWidthKeyword(8)).toBe('thin');
    expect(toStandardWidthKeyword(12)).toBe('auto');
  });
});

describe('buildStandardCss', () => {
  it('emits scrollbar-width and scrollbar-color', () => {
    const css = buildStandardCss(baseConfig);
    expect(css).toContain('scrollbar-width: auto;');
    expect(css).toContain('scrollbar-color: #94a3b8 #f1f5f9;');
  });

  it('uses thin keyword for narrow width', () => {
    expect(buildStandardCss({ ...baseConfig, width: 6 })).toContain('scrollbar-width: thin;');
  });
});

describe('buildWebkitCss', () => {
  it('emits width/height, track, thumb and hover blocks', () => {
    const css = buildWebkitCss(baseConfig);
    expect(css).toContain('::-webkit-scrollbar {');
    expect(css).toContain('width: 12px;');
    expect(css).toContain('height: 12px;');
    expect(css).toContain('::-webkit-scrollbar-track {');
    expect(css).toContain('background: #f1f5f9;');
    expect(css).toContain('border-radius: 0px;');
    expect(css).toContain('::-webkit-scrollbar-thumb {');
    expect(css).toContain('border-radius: 8px;');
    expect(css).toContain('::-webkit-scrollbar-thumb:hover {');
    expect(css).toContain('background: #64748b;');
  });

  it('omits button block when showButtons is false', () => {
    expect(buildWebkitCss(baseConfig)).not.toContain('scrollbar-button');
  });

  it('includes button block when enabled', () => {
    const css = buildWebkitCss({ ...baseConfig, showButtons: true });
    expect(css).toContain('::-webkit-scrollbar-button {');
  });
});

describe('buildScrollbarCss', () => {
  it('combines both groups separated by a blank line', () => {
    const css = buildScrollbarCss(baseConfig);
    expect(css).toContain('scrollbar-color');
    expect(css).toContain('::-webkit-scrollbar-thumb:hover');
    expect(css.split('\n\n').length).toBeGreaterThanOrEqual(2);
  });
});
