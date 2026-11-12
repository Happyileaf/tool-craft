import { describe, expect, it } from 'vitest';
import {
  apcaContrast,
  apcaLuminance,
  parseColor,
  recommendLevel,
  wcagContrastRatio,
  wcagLuminance,
} from './apca';

/** 由 apca-w3@0.1.9 官方参考实现生成的 Lc 向量（保留 1 位小数） */
const OFFICIAL_VECTORS: Array<[string, string, number]> = [
  ['#000000', '#ffffff', 106.0],
  ['#ffffff', '#000000', -107.9],
  ['#888888', '#ffffff', 63.1],
  ['#ffffff', '#888888', -68.5],
  ['#000000', '#aaaaaa', 58.1],
  ['#aaaaaa', '#000000', -56.2],
  ['#ddeeff', '#112233', -93.1],
  ['#112233', '#ddeeff', 91.7],
  ['#444444', '#112233', -7.5],
  ['#112233', '#444444', 8.3],
  ['#777777', '#ffffff', 71.1],
  ['#edf2f7', '#1a365d', -92.1],
  ['#1a365d', '#edf2f7', 89.4],
  ['#123456', '#abcdef', 67.5],
  ['#abcdef', '#123456', -68.1],
];

describe('parseColor', () => {
  it('解析 3 位与 6 位 hex', () => {
    expect(parseColor('#f00')).toMatchObject({ r: 255, g: 0, b: 0, alpha: 1 });
    expect(parseColor('#112233')).toMatchObject({ r: 17, g: 34, b: 51, alpha: 1 });
  });

  it('解析 8 位 hex 的 alpha 通道', () => {
    expect(parseColor('#00000066')?.alpha).toBeCloseTo(0.4, 5);
  });

  it('解析 rgb() 与 rgba()', () => {
    expect(parseColor('rgb(10, 20, 30)')).toMatchObject({ r: 10, g: 20, b: 30, alpha: 1 });
    expect(parseColor('rgba(10, 20, 30, 0.5)')?.alpha).toBe(0.5);
  });

  it('非法输入返回 null', () => {
    expect(parseColor('red')).toBeNull();
    expect(parseColor('#12')).toBeNull();
    expect(parseColor('rgb(256, 0, 0)')).toBeNull();
    expect(parseColor('rgba(0, 0, 0, 1.2)')).toBeNull();
  });
});

describe('apcaContrast 官方参考向量', () => {
  OFFICIAL_VECTORS.forEach(([text, background, expectedLc]) => {
    it(`${text} on ${background} → Lc ${expectedLc}`, () => {
      const parsedText = parseColor(text);
      const parsedBg = parseColor(background);
      expect(parsedText).not.toBeNull();
      expect(parsedBg).not.toBeNull();
      if (!parsedText || !parsedBg) {
        return;
      }
      const result = apcaContrast(parsedText, parsedBg);
      expect(result.lc).toBeCloseTo(expectedLc, 1);
      expect(result.magnitude).toBeCloseTo(Math.abs(expectedLc), 1);
    });
  });

  it('同色对返回 0 且极性为 none', () => {
    const color = parseColor('#556677');
    expect(color).not.toBeNull();
    if (!color) {
      return;
    }
    const result = apcaContrast(color, color);
    expect(result.lc).toBe(0);
    expect(result.magnitude).toBe(0);
    expect(result.polarity).toBe('none');
  });

  it('极性随前景/背景翻转', () => {
    const dark = parseColor('#112233');
    const light = parseColor('#ddeeff');
    expect(dark && light).toBeTruthy();
    if (!dark || !light) {
      return;
    }
    expect(apcaContrast(dark, light).polarity).toBe('normal');
    expect(apcaContrast(light, dark).polarity).toBe('reverse');
  });

  it('alpha 前景先在背景上混合（#0006 on white → Lc 54.6）', () => {
    const text = parseColor('#00000066');
    const bg = parseColor('#ffffff');
    expect(text && bg).toBeTruthy();
    if (!text || !bg) {
      return;
    }
    const result = apcaContrast(text, bg);
    expect(result.lc).toBeCloseTo(54.6, 1);
    expect(result.polarity).toBe('normal');
  });

  it('低端裁剪：#444/#123 仍保留 8.3 而不是归零（仅 |Lc|<10 由等级表反映）', () => {
    const text = parseColor('#112233');
    const bg = parseColor('#444444');
    expect(text && bg).toBeTruthy();
    if (!text || !bg) {
      return;
    }
    expect(apcaContrast(text, bg).lc).toBeCloseTo(8.3, 1);
  });
});

describe('亮度函数', () => {
  it('纯黑 APCA 亮度为 0，纯白约为 1', () => {
    expect(apcaLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(apcaLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it('WCAG 与 APCA 亮度对中间灰取值不同（线性化路径不同）', () => {
    const gray = { r: 136, g: 136, b: 136 };
    expect(apcaLuminance(gray)).not.toBeCloseTo(wcagLuminance(gray), 4);
  });
});

describe('recommendLevel 七档', () => {
  it('按 Lc 阈值返回对应等级', () => {
    expect(recommendLevel(95).level).toBe('Lc90');
    expect(recommendLevel(90).level).toBe('Lc90');
    expect(recommendLevel(80).level).toBe('Lc75');
    expect(recommendLevel(60).level).toBe('Lc60');
    expect(recommendLevel(50).level).toBe('Lc45');
    expect(recommendLevel(30).level).toBe('Lc30');
    expect(recommendLevel(20).level).toBe('Lc15');
    expect(recommendLevel(10).level).toBe('低于 Lc15');
  });
});

describe('wcagContrastRatio 对照', () => {
  const CASES: Array<[string, string, number]> = [
    ['#000000', '#ffffff', 21],
    ['#888888', '#ffffff', 3.545],
    ['#000000', '#aaaaaa', 9.04],
    ['#1a365d', '#edf2f7', 10.78],
  ];

  CASES.forEach(([text, background, expected]) => {
    it(`${text} on ${background} → ${expected}`, () => {
      const t = parseColor(text);
      const b = parseColor(background);
      expect(t && b).toBeTruthy();
      if (!t || !b) {
        return;
      }
      expect(wcagContrastRatio(t, b)).toBeCloseTo(expected, 1);
    });
  });

  it('同色比值为 1', () => {
    const color = parseColor('#336699');
    expect(color).not.toBeNull();
    if (!color) {
      return;
    }
    expect(wcagContrastRatio(color, color)).toBeCloseTo(1, 5);
  });
});
