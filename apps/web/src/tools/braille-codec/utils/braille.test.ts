import { describe, expect, it } from 'vitest';
import {
  BRAILLE_BASE,
  brailleToDots,
  decodeBraille,
  describeBraille,
  dotsToBraille,
  encodeText,
  isBraillePattern,
  NUMBER_SIGN,
} from './braille';

describe('dotsToBraille / brailleToDots', () => {
  it('maps single letters to known cells', () => {
    expect(dotsToBraille([1]).codePointAt(0)).toBe(0x2801);
    expect(dotsToBraille([1, 2]).codePointAt(0)).toBe(0x2803);
    expect(dotsToBraille([1, 3, 5, 6]).codePointAt(0)).toBe(0x2835);
  });

  it('supports 8-dot patterns including dots 7 and 8', () => {
    expect(dotsToBraille([1, 8]).codePointAt(0)).toBe(BRAILLE_BASE + 0x81);
    expect(brailleToDots('⣁').sort()).toEqual([1, 7, 8]);
    expect(dotsToBraille([])).toBe('⠀');
  });

  it('rejects dot numbers outside 1-8', () => {
    expect(() => dotsToBraille([0])).toThrow(/无效/);
    expect(() => dotsToBraille([9])).toThrow(/无效/);
  });

  it('round-trips every six-dot mask', () => {
    for (let mask = 0; mask <= 0x3f; mask += 1) {
      const dots: number[] = [];
      for (let d = 1; d <= 6; d += 1) {
        if (mask & (1 << (d - 1))) dots.push(d);
      }
      expect(brailleToDots(dotsToBraille(dots))).toEqual(dots);
    }
  });

  it('rejects non-braille characters', () => {
    expect(() => brailleToDots('a')).toThrow(/不是盲文/);
    expect(isBraillePattern('a')).toBe(false);
    expect(isBraillePattern('⣿')).toBe(true);
  });
});

describe('describeBraille', () => {
  it('reports code point and dots', () => {
    const info = describeBraille(NUMBER_SIGN);
    expect(info.codePoint).toBe(0x283c);
    expect(info.hex).toBe('U+283C');
    expect(info.dots).toEqual([3, 4, 5, 6]);
  });
});

describe('encodeText', () => {
  it('encodes known letters with correct cells', () => {
    const result = encodeText('abz');
    expect(result.output).toBe('⠁⠃⠵');
    expect(result.warnings).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(encodeText('Hello').output).toBe(encodeText('hello').output);
  });

  it('inserts the number sign for digit runs', () => {
    expect(encodeText('123').output).toBe('⠼⠁⠃⠉');
  });

  it('exits number mode on spaces and re-enters for new runs', () => {
    const result = encodeText('1 a 2');
    expect(result.output).toBe(`${NUMBER_SIGN}⠁⠀⠁⠀${NUMBER_SIGN}⠃`);
  });

  it('encodes punctuation', () => {
    expect(encodeText(',').output).toBe(dotsToBraille([2]));
    expect(encodeText('?').output).toBe(dotsToBraille([2, 3, 6]));
  });

  it('warns and skips unsupported characters', () => {
    const result = encodeText('a中b');
    expect(result.output).toBe('⠁⠃');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('不支持');
  });

  it('handles empty input', () => {
    expect(encodeText('').output).toBe('');
    expect(encodeText('').warnings).toEqual([]);
  });
});

describe('decodeBraille', () => {
  it('decodes letters', () => {
    expect(decodeBraille('⠁⠃⠵').output).toBe('abz');
  });

  it('decodes digits within number mode', () => {
    expect(decodeBraille(`${NUMBER_SIGN}⠁⠃⠊`).output).toBe('129');
  });

  it('round-trips supported text', () => {
    const samples = ['hello world', 'braille', '123', 'a1 b2', 'test?', 'code.'];
    for (const sample of samples) {
      const encoded = encodeText(sample);
      expect(encoded.warnings).toEqual([]);
      const decoded = decodeBraille(encoded.output);
      expect(decoded.output).toBe(sample);
    }
  });

  it('warns on unmapped cells', () => {
    const result = decodeBraille('⠀'); // empty cell
    expect(result.output).toBe(' ');
  });

  it('warns on dot-7-only cell with no Grade-1 mapping', () => {
    const result = decodeBraille('⡀'); // dot 7 only
    expect(result.output).toBe('');
    expect(result.warnings).toHaveLength(1);
  });
});
