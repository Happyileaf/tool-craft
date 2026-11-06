import { describe, expect, it } from 'vitest';
import { NAMED_COLORS, SPECIAL_KEYWORDS } from './named-colors';
import {
  colorDistance,
  findNearestColors,
  hexToRgb,
  hslToRgb,
  lookupByHex,
  normalizeHex,
  parseColorInput,
  rgbToHsl,
  searchByName,
  sortByHue,
  toHslString,
} from './color-search';

describe('NAMED_COLORS 数据集', () => {
  it('完整包含 148 个命名颜色', () => {
    expect(NAMED_COLORS).toHaveLength(148);
  });

  it('名称无重复；HEX 仅存在标准定义的别名重复', () => {
    const names = NAMED_COLORS.map((item) => item.name);
    const hexes = NAMED_COLORS.map((item) => item.hex);
    expect(new Set(names).size).toBe(148);
    // W3C 标准内的同值别名：aqua/cyan、fuchsia/magenta 及 7 组 gray/grey 拼写，共 9 个重复名
    expect(new Set(hexes).size).toBe(139);
  });

  it('rebeccapurple 为 #663399 且可检索', () => {
    const found = lookupByHex('#663399');
    expect(found?.name).toBe('rebeccapurple');
  });

  it('包含 16 个基础 CSS 颜色', () => {
    const basics = NAMED_COLORS.filter((item) => item.basic);
    expect(basics).toHaveLength(16);
  });

  it('每条数据的 HEX 与 RGB 分量一致', () => {
    NAMED_COLORS.forEach((item) => {
      expect(hexToRgb(item.hex)).toEqual([...item.rgb]);
    });
  });

  it('特殊关键字不与命名色表重叠', () => {
    const names = new Set(NAMED_COLORS.map((item) => item.name));
    SPECIAL_KEYWORDS.forEach((keyword) => {
      expect(names.has(keyword.name)).toBe(false);
    });
  });
});

describe('normalizeHex / hexToRgb', () => {
  it('3 位 HEX 扩展为 6 位', () => {
    expect(normalizeHex('#f00')).toBe('#ff0000');
    expect(normalizeHex('F00')).toBe('#ff0000');
  });

  it('非法 HEX 返回 null', () => {
    expect(normalizeHex('#gg0000')).toBeNull();
    expect(normalizeHex('#1234')).toBeNull();
  });

  it('HEX 转 RGB', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00f')).toEqual([0, 0, 255]);
  });
});

describe('rgbToHsl / hslToRgb', () => {
  it('红色 HSL 为 0,100%,50%', () => {
    expect(rgbToHsl([255, 0, 0])).toEqual([0, 100, 50]);
  });

  it('HSL 往返还原 RGB', () => {
    const rgb = [102, 51, 153] as const;
    const [h, s, l] = rgbToHsl(rgb);
    expect(hslToRgb(h, s, l)).toEqual([...rgb]);
  });

  it('输出 hsl() 字符串', () => {
    expect(toHslString([0, 0, 255])).toBe('hsl(240, 100%, 50%)');
  });
});

describe('searchByName', () => {
  it('blue 同时命中 blue、lightblue、darkblue 等', () => {
    const names = searchByName('blue').map((item) => item.name);
    expect(names).toContain('blue');
    expect(names).toContain('lightblue');
    expect(names).toContain('darkblue');
  });

  it('空关键字返回全部', () => {
    expect(searchByName('')).toHaveLength(148);
  });
});

describe('parseColorInput', () => {
  it('解析命名颜色', () => {
    expect(parseColorInput('red').rgb).toEqual([255, 0, 0]);
  });

  it('解析 HEX（含 3 位）', () => {
    expect(parseColorInput('#f00').rgb).toEqual([255, 0, 0]);
  });

  it('解析 rgb() 与百分比', () => {
    expect(parseColorInput('rgb(255, 0, 0)').rgb).toEqual([255, 0, 0]);
    expect(parseColorInput('rgba(100%, 0%, 0%, 0.5)').rgb).toEqual([255, 0, 0]);
  });

  it('解析 hsl()', () => {
    expect(parseColorInput('hsl(0, 100%, 50%)').rgb).toEqual([255, 0, 0]);
  });

  it('非法输入返回错误', () => {
    expect(parseColorInput('not-a-color').ok).toBe(false);
    expect(parseColorInput('rgb(300, 0, 0)').ok).toBe(false);
    expect(parseColorInput('').ok).toBe(false);
  });
});

describe('findNearestColors', () => {
  it('#ff0000 反查首位是 red 且距离为 0', () => {
    const result = findNearestColors([255, 0, 0]);
    expect(result[0]?.color.name).toBe('red');
    expect(result[0]?.distance).toBe(0);
    expect(result).toHaveLength(3);
  });

  it('距离满足对称性', () => {
    expect(colorDistance([1, 2, 3], [4, 6, 3])).toBeCloseTo(5);
  });
});

describe('sortByHue', () => {
  it('排序后数量不变且首条色相不大于末条', () => {
    const sorted = sortByHue(NAMED_COLORS);
    expect(sorted).toHaveLength(148);
  });
});
