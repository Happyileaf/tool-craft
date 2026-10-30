import { describe, expect, it } from 'vitest';
import {
  generateAnsi,
  palette256ToCss,
  STANDARD_CSS,
  STANDARD_FG,
  STANDARD_BG,
  STYLE_CODES,
  type AnsiInput,
  type ColorSpec,
} from './ansi';

const none: ColorSpec = { space: 'none' };
const red: ColorSpec = { space: 'standard', name: 'red' };

function base(overrides: Partial<AnsiInput> = {}): AnsiInput {
  return {
    text: 'Hello',
    fg: { ...none },
    bg: { ...none },
    styles: [],
    ...overrides,
  };
}

describe('STANDARD maps', () => {
  it('maps the 16 standard foreground and background codes', () => {
    expect(STANDARD_FG.red).toBe(31);
    expect(STANDARD_FG.brightRed).toBe(91);
    expect(STANDARD_BG.red).toBe(41);
    expect(STANDARD_BG.brightRed).toBe(101);
  });

  it('has a css color and an SGR code for every standard name', () => {
    for (const name of Object.keys(STANDARD_FG)) {
      expect(STANDARD_BG[name]).toBe(STANDARD_FG[name]! + 10);
      expect(STANDARD_CSS[name]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('maps all style toggles to SGR attribute numbers', () => {
    expect(STYLE_CODES).toEqual({
      bold: 1,
      dim: 2,
      italic: 3,
      underline: 4,
      blink: 5,
      reverse: 7,
      hidden: 8,
      strikethrough: 9,
    });
  });
});

describe('palette256ToCss', () => {
  it('reuses the standard palette for indices 0–15', () => {
    expect(palette256ToCss(1)).toBe(STANDARD_CSS.red);
    expect(palette256ToCss(9)).toBe(STANDARD_CSS.brightRed);
  });

  it('computes the 6x6x6 color cube corners', () => {
    expect(palette256ToCss(16)).toBe('#000000');
    expect(palette256ToCss(196)).toBe('#ff0000');
    expect(palette256ToCss(231)).toBe('#ffffff');
  });

  it('computes the grayscale ramp', () => {
    expect(palette256ToCss(232)).toBe('#080808');
    expect(palette256ToCss(255)).toBe('#eeeeee');
  });

  it('returns null for out-of-range or non-integer indices', () => {
    expect(palette256ToCss(-1)).toBeNull();
    expect(palette256ToCss(256)).toBeNull();
    expect(palette256ToCss(1.5)).toBeNull();
  });
});

describe('generateAnsi standard colors', () => {
  it('emits red foreground with default background', () => {
    const result = generateAnsi(base({ text: 'error', fg: red }));
    expect(result.error).toBeNull();
    expect(result.sequence).toBe('\x1b[31merror\x1b[0m');
    expect(result.jsLiteral).toBe('\\x1b[31merror\\x1b[0m');
    expect(result.previewCss.color).toBe(STANDARD_CSS.red);
    expect(result.previewCss.background).toBeUndefined();
  });

  it('combines bold and red in a single CSI with ordered params', () => {
    const result = generateAnsi(base({ fg: red, styles: ['bold'] }));
    expect(result.error).toBeNull();
    expect(result.sequence).toBe('\x1b[1;31mHello\x1b[0m');
    // 单次 CSI：序列中只出现一次参数引导 '[', 且以 reset 收尾
    expect((result.sequence ?? '').match(/\x1b\[/g)).toHaveLength(2);
  });

  it('emits standard background codes', () => {
    const result = generateAnsi(base({ bg: { space: 'standard', name: 'blue' } }));
    expect(result.sequence).toBe('\x1b[44mHello\x1b[0m');
    expect(result.previewCss.background).toBe(STANDARD_CSS.blue);
  });

  it('rejects unknown standard color names', () => {
    const result = generateAnsi(base({ fg: { space: 'standard', name: 'pink' } }));
    expect(result.sequence).toBeNull();
    expect(result.error).toBe('标准颜色名称不合法');
  });
});

describe('generateAnsi 256-color and truecolor', () => {
  it('emits foreground palette index 196', () => {
    const result = generateAnsi(base({ fg: { space: 'palette256', index: 196 } }));
    expect(result.sequence).toBe('\x1b[38;5;196mHello\x1b[0m');
    expect(result.jsLiteral).toBe('\\x1b[38;5;196mHello\\x1b[0m');
  });

  it('emits background palette index', () => {
    const result = generateAnsi(base({ bg: { space: 'palette256', index: 240 } }));
    expect(result.sequence).toBe('\x1b[48;5;240mHello\x1b[0m');
  });

  it('emits truecolor background RGB(255,0,128)', () => {
    const result = generateAnsi(base({ bg: { space: 'rgb', r: 255, g: 0, b: 128 } }));
    expect(result.sequence).toBe('\x1b[48;2;255;0;128mHello\x1b[0m');
    expect(result.jsLiteral).toBe('\\x1b[48;2;255;0;128mHello\\x1b[0m');
    expect(result.previewCss.background).toBe('#ff0080');
  });

  it('emits truecolor foreground', () => {
    // 缺少 b 分量应报错而不是当作 0
    const missing = generateAnsi(base({ fg: { space: 'rgb', r: 18, g: 52 } }));
    expect(missing.error).toBe('RGB 分量需为 0–255 的整数');
    const ok = generateAnsi(base({ fg: { space: 'rgb', r: 18, g: 52, b: 86 } }));
    expect(ok.sequence).toBe('\x1b[38;2;18;52;86mHello\x1b[0m');
  });

  it('rejects palette index out of range and non-integer', () => {
    expect(generateAnsi(base({ fg: { space: 'palette256', index: 256 } })).error).toBe(
      '256 色编号需为 0–255 的整数',
    );
    expect(generateAnsi(base({ fg: { space: 'palette256', index: -1 } })).error).toBe(
      '256 色编号需为 0–255 的整数',
    );
    expect(generateAnsi(base({ bg: { space: 'palette256', index: 1.5 } })).error).toBe(
      '256 色编号需为 0–255 的整数',
    );
  });

  it('rejects rgb components out of range', () => {
    expect(generateAnsi(base({ fg: { space: 'rgb', r: 256, g: 0, b: 0 } })).error).toBe(
      'RGB 分量需为 0–255 的整数',
    );
    expect(generateAnsi(base({ fg: { space: 'rgb', r: -1, g: 0, b: 0 } })).error).toBe(
      'RGB 分量需为 0–255 的整数',
    );
  });
});

describe('generateAnsi styles and outputs', () => {
  it('orders params as styles then foreground then background in one CSI', () => {
    const result = generateAnsi(
      base({
        fg: { space: 'standard', name: 'green' },
        bg: { space: 'standard', name: 'black' },
        styles: ['bold', 'underline'],
      }),
    );
    expect(result.sequence).toBe('\x1b[1;4;32;40mHello\x1b[0m');
  });

  it('rejects unknown style keys', () => {
    const result = generateAnsi(base({ styles: ['rainbow'] }));
    expect(result.sequence).toBeNull();
    expect(result.error).toBe('未知样式：rainbow');
  });

  it('returns plain text without escape codes when nothing is selected', () => {
    const result = generateAnsi(base({ text: 'plain' }));
    expect(result.sequence).toBe('plain');
    expect(result.jsLiteral).toBe('plain');
    expect(result.shellCommand).toBe("echo -e 'plain'");
  });

  it('produces a pasteable echo -e shell command with \\033 escapes', () => {
    const result = generateAnsi(base({ fg: red, text: 'warn' }));
    expect(result.shellCommand).toBe("echo -e '\\033[31mwarn\\033[0m'");
  });

  it('shell-escapes single quotes in text', () => {
    const result = generateAnsi(base({ fg: red, text: "it's" }));
    expect(result.shellCommand).toBe("echo -e '\\033[31mit'\\''s\\033[0m'");
  });
});
