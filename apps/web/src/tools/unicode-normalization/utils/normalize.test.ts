import { describe, expect, it } from 'vitest';
import {
  diffCodePoints,
  formatCodePoint,
  measureText,
  normalizeText,
  toCodePoints,
} from './normalize';
import { NormalizationFormEnum } from '../constants';

describe('normalizeText 固定向量', () => {
  it('NFC 把组合序列合成为预组合字符', () => {
    const decomposed = 'é';
    expect(normalizeText(decomposed, NormalizationFormEnum.NFC)).toBe('é');
    const points = toCodePoints(normalizeText(decomposed, NormalizationFormEnum.NFC));
    expect(points.map((point) => point.hex)).toEqual(['U+00E9']);
  });

  it('NFD 把预组合字符分解为基字符 + 组合重音', () => {
    const composed = 'é';
    const points = toCodePoints(normalizeText(composed, NormalizationFormEnum.NFD));
    expect(points.map((point) => point.hex)).toEqual(['U+0065', 'U+0301']);
  });

  it('NFKC 把全角 Ａ 兼容分解为 A', () => {
    const points = toCodePoints(normalizeText('Ａ', NormalizationFormEnum.NFKC));
    expect(points.map((point) => point.hex)).toEqual(['U+0041']);
  });

  it('NFKD 把序号 ① 分解为数字 1', () => {
    const points = toCodePoints(normalizeText('①', NormalizationFormEnum.NFKD));
    expect(points.map((point) => point.hex)).toEqual(['U+0031']);
  });

  it('NFKC 把连字 ﬁ 兼容合成为 fi', () => {
    const points = toCodePoints(normalizeText('ﬁ', NormalizationFormEnum.NFKC));
    expect(points.map((point) => point.char).join('')).toBe('fi');
  });

  it('结果与原生 String.prototype.normalize 一致', () => {
    const sample = 'Café é ① Ａ ｶ ﬁ';
    (['NFC', 'NFD', 'NFKC', 'NFKD'] as const).forEach((form) => {
      expect(normalizeText(sample, form as NormalizationFormEnum)).toBe(sample.normalize(form));
    });
  });

  it('空字符串输入返回空字符串', () => {
    expect(normalizeText('', NormalizationFormEnum.NFC)).toBe('');
  });
});

describe('toCodePoints 代理对处理', () => {
  it('BMP 字符按单码点拆分', () => {
    expect(toCodePoints('abc').map((point) => point.hex)).toEqual([
      'U+0061',
      'U+0062',
      'U+0063',
    ]);
  });

  it('emoji 与增补平面字符不被拆成孤立代理', () => {
    const points = toCodePoints('😀');
    expect(points).toHaveLength(1);
    expect(points[0]?.codePoint).toBe(0x1f600);
    expect(points[0]?.hex).toBe('U+1F600');
  });

  it('ZWJ emoji 序列保留各码点（ZWJ 不被规范化消除）', () => {
    const family = '👨‍👩‍👧';
    const normalized = normalizeText(family, NormalizationFormEnum.NFC);
    expect(normalized).toBe(family);
    const hexes = toCodePoints(normalized).map((point) => point.hex);
    expect(hexes).toContain('U+200D');
  });
});

describe('measureText 长度度量', () => {
  it('ASCII 三项长度一致', () => {
    expect(measureText('hello')).toEqual({
      codePointCount: 5,
      utf16Length: 5,
      utf8Bytes: 5,
    });
  });

  it('增补平面字符 UTF-16 占 2 码元、UTF-8 占 4 字节', () => {
    expect(measureText('😀')).toEqual({
      codePointCount: 1,
      utf16Length: 2,
      utf8Bytes: 4,
    });
  });

  it('é 的 NFD 比 NFC 多 1 个码点、多 1 个 UTF-8 字节', () => {
    const nfc = measureText(normalizeText('é', NormalizationFormEnum.NFC));
    const nfd = measureText(normalizeText('é', NormalizationFormEnum.NFD));
    expect(nfc).toEqual({ codePointCount: 1, utf16Length: 1, utf8Bytes: 2 });
    expect(nfd).toEqual({ codePointCount: 2, utf16Length: 2, utf8Bytes: 3 });
    expect(nfd.codePointCount - nfc.codePointCount).toBe(1);
    expect(nfd.utf8Bytes - nfc.utf8Bytes).toBe(1);
  });
});

describe('diffCodePoints LCS 对齐', () => {
  it('Café 的 NFC→NFD 保留公共前缀并标注 1 删 2 增', () => {
    const before = toCodePoints(normalizeText('Café', NormalizationFormEnum.NFC));
    const after = toCodePoints(normalizeText('Café', NormalizationFormEnum.NFD));
    const tokens = diffCodePoints(before, after);
    expect(tokens.filter((token) => token.type === 'equal').map((token) => token.char)).toEqual([
      'C',
      'a',
      'f',
    ]);
    const removedHexes = tokens
      .filter((token) => token.type === 'removed')
      .map((token) => token.hex);
    const addedHexes = tokens.filter((token) => token.type === 'added').map((token) => token.hex);
    expect(removedHexes).toEqual(['U+00E9']);
    expect(addedHexes).toEqual(['U+0065', 'U+0301']);
  });

  it('单字符 é 的 NFC→NFD 为 1 删 2 增（码点层面无公共子序列）', () => {
    const before = toCodePoints(normalizeText('é', NormalizationFormEnum.NFC));
    const after = toCodePoints(normalizeText('é', NormalizationFormEnum.NFD));
    const tokens = diffCodePoints(before, after);
    expect(tokens.filter((token) => token.type === 'removed')).toHaveLength(1);
    expect(tokens.filter((token) => token.type === 'added')).toHaveLength(2);
  });

  it('完全相同的序列全部为 equal', () => {
    const points = toCodePoints('abc');
    const tokens = diffCodePoints(points, points);
    expect(tokens.every((token) => token.type === 'equal')).toBe(true);
  });

  it('全角 Ａ→A 为一删一增', () => {
    const before = toCodePoints('Ａ');
    const after = toCodePoints('A');
    const tokens = diffCodePoints(before, after);
    expect(tokens).toHaveLength(2);
    expect(tokens.map((token) => token.type).sort()).toEqual(['added', 'removed']);
  });
});

describe('formatCodePoint', () => {
  it('BMP 补零到 4 位、增补平面为 5 位', () => {
    expect(formatCodePoint(0x41)).toBe('U+0041');
    expect(formatCodePoint(0x1f600)).toBe('U+1F600');
  });
});
