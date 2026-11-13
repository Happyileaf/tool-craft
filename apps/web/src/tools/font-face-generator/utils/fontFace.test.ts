import { describe, expect, it } from 'vitest';
import {
  buildFontFaceBundle,
  buildFontFaceRule,
  validateFontFace,
  type FontFaceConfig,
  type FontSource,
} from './fontFace';

const sources: FontSource[] = [
  { url: '/fonts/Inter-Regular.woff2', format: 'woff2' },
  { url: '/fonts/Inter-Regular.woff', format: 'woff' },
  { url: '/fonts/Inter-Regular.ttf', format: 'truetype' },
];

const baseConfig: FontFaceConfig = {
  family: 'Inter',
  weight: '400',
  style: 'normal',
  display: 'swap',
  sources,
};

describe('validateFontFace', () => {
  it('accepts a complete valid config', () => {
    expect(validateFontFace(baseConfig)).toBeNull();
  });

  it('rejects empty family', () => {
    expect(validateFontFace({ ...baseConfig, family: '   ' })).toMatch(/font-family/);
  });

  it('rejects empty weight', () => {
    expect(validateFontFace({ ...baseConfig, weight: '' })).toMatch(/font-weight/);
  });

  it('rejects unsupported style and display', () => {
    expect(validateFontFace({ ...baseConfig, style: 'slant' })).toMatch(/font-style/);
    expect(validateFontFace({ ...baseConfig, display: 'lazy' })).toMatch(/font-display/);
  });

  it('rejects when every src url is blank', () => {
    const noSrc: FontFaceConfig = {
      ...baseConfig,
      sources: [{ url: '  ', format: 'woff2' }],
    };
    expect(validateFontFace(noSrc)).toMatch(/src/);
  });

  it('accepts blank optional unicode-range', () => {
    expect(validateFontFace({ ...baseConfig, unicodeRange: '   ' })).toBeNull();
  });
});

describe('buildFontFaceRule', () => {
  it('quotes the family and emits ordered descriptors', () => {
    const css = buildFontFaceRule(baseConfig);
    expect(css).toContain('font-family: "Inter";');
    expect(css).toContain('font-style: normal;');
    expect(css).toContain('font-weight: 400;');
    expect(css).toContain('font-display: swap;');
  });

  it('joins multiple sources with format hints in given order', () => {
    const css = buildFontFaceRule(baseConfig);
    expect(css).toContain(
      'src: url("/fonts/Inter-Regular.woff2") format("woff2"), url("/fonts/Inter-Regular.woff") format("woff"), url("/fonts/Inter-Regular.ttf") format("truetype");',
    );
  });

  it('omits format() when format hint is empty', () => {
    const css = buildFontFaceRule({
      ...baseConfig,
      sources: [{ url: '/fonts/inter.otf', format: '' }],
    });
    expect(css).toContain('src: url("/fonts/inter.otf");');
    expect(css).not.toContain('format(');
  });

  it('does not double-quote an already quoted family', () => {
    const css = buildFontFaceRule({ ...baseConfig, family: "'Inter'" });
    expect(css).toContain("font-family: 'Inter';");
  });

  it('emits unicode-range only when provided', () => {
    const without = buildFontFaceRule(baseConfig);
    expect(without).not.toContain('unicode-range');
    const withRange = buildFontFaceRule({
      ...baseConfig,
      unicodeRange: 'U+0000-00FF, U+0131',
    });
    expect(withRange).toContain('unicode-range: U+0000-00FF, U+0131;');
  });

  it('filters out blank-url sources', () => {
    const css = buildFontFaceRule({
      ...baseConfig,
      sources: [{ url: ' ', format: 'woff2' }, { url: '/a.woff2', format: 'woff2' }],
    });
    expect(css).toContain('src: url("/a.woff2") format("woff2");');
  });
});

describe('buildFontFaceBundle', () => {
  it('separates multiple weights with a blank line', () => {
    const bold: FontFaceConfig = { ...baseConfig, weight: '700' };
    const bundle = buildFontFaceBundle([baseConfig, bold]);
    expect(bundle.split('\n\n')).toHaveLength(2);
    expect(bundle).toContain('font-weight: 400;');
    expect(bundle).toContain('font-weight: 700;');
  });

  it('drops invalid configs and returns empty string when none valid', () => {
    const invalid: FontFaceConfig = { ...baseConfig, family: '' };
    expect(buildFontFaceBundle([invalid])).toBe('');
    const mixed = buildFontFaceBundle([invalid, baseConfig]);
    expect(mixed).toContain('font-family: "Inter";');
    expect(mixed.split('\n\n')).toHaveLength(1);
  });
});
