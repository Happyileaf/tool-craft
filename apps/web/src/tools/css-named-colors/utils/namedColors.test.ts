import { describe, expect, it } from 'vitest';
import {
  NAMED_COLOR_BY_NAME,
  NAMED_COLORS,
  SPECIAL_KEYWORDS,
} from './namedColorsData';
import {
  colorDistance,
  filterByName,
  findNearestNamedColors,
  formatHsl,
  formatRgb,
  parseColorInput,
  sortColors,
} from './namedColors';

describe('命名颜色数据表', () => {
  it('完整包含 148 个标准命名颜色', () => {
    expect(NAMED_COLORS).toHaveLength(148);
    expect(new Set(NAMED_COLORS.map((color) => color.name)).size).toBe(148);
  });

  it('rebeccapurple 为 #663399 且可检索', () => {
    const color = NAMED_COLOR_BY_NAME.rebeccapurple!;
    expect(color).toBeDefined();
    expect(color.hex).toBe('#663399');
    expect(color.rgb).toEqual({ r: 102, g: 51, b: 153 });
  });

  it('基础 16 色标记正确', () => {
    expect(NAMED_COLORS.filter((color) => color.basic)).toHaveLength(16);
    expect(NAMED_COLOR_BY_NAME.black!.basic).toBe(true);
    expect(NAMED_COLOR_BY_NAME.rebeccapurple!.basic).toBe(false);
  });

  it('gray 与 grey 别名 HEX 一致', () => {
    expect(NAMED_COLOR_BY_NAME.gray!.hex).toBe(NAMED_COLOR_BY_NAME.grey!.hex);
    expect(NAMED_COLOR_BY_NAME.aqua!.hex).toBe(NAMED_COLOR_BY_NAME.cyan!.hex);
  });

  it('特殊关键字单独列出且不计入命名色', () => {
    expect(SPECIAL_KEYWORDS.map((item) => item.name)).toEqual([
      'transparent',
      'currentcolor',
    ]);
    expect(NAMED_COLOR_BY_NAME.transparent).toBeUndefined();
  });
});

describe('filterByName 名称搜索', () => {
  it('blue 同时匹配 blue、lightblue、darkblue 等', () => {
    const hits = filterByName('blue').map((color) => color.name);
    expect(hits).toContain('blue');
    expect(hits).toContain('lightblue');
    expect(hits).toContain('darkblue');
    expect(hits).toContain('cornflowerblue');
  });

  it('不区分大小写且空关键字返回全部', () => {
    expect(filterByName('RED').map((color) => color.name)).toContain('red');
    expect(filterByName('')).toHaveLength(148);
    expect(filterByName('   ')).toHaveLength(148);
  });
});

describe('parseColorInput 颜色解析', () => {
  it('解析 6 位 HEX', () => {
    expect(parseColorInput('#ff0000').rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorInput('ff0000').rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('3 位 HEX 自动扩展为 6 位', () => {
    expect(parseColorInput('#f00').rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorInput('#0f0').rgb).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseColorInput('#fff').rgb).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('解析 rgb() 与 rgba()', () => {
    expect(parseColorInput('rgb(255, 0, 0)').rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorInput('rgba(0, 128, 0, 0.5)').rgb).toEqual({ r: 0, g: 128, b: 0 });
  });

  it('解析 hsl()', () => {
    const result = parseColorInput('hsl(0, 100%, 50%)');
    expect(result.ok).toBe(true);
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('解析命名颜色名称', () => {
    expect(parseColorInput('red').rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorInput('RebeccaPurple').ok).toBe(true);
  });

  it('非法输入返回错误且不抛异常', () => {
    expect(parseColorInput('').ok).toBe(false);
    expect(parseColorInput('not-a-color').ok).toBe(false);
    expect(parseColorInput('#12').ok).toBe(false);
    expect(parseColorInput('rgb(256, 0, 0)').ok).toBe(false);
    expect(parseColorInput(null as unknown as string).ok).toBe(false);
  });
});

describe('findNearestNamedColors 反查', () => {
  it('#ff0000 反查首位为 red', () => {
    const nearest = findNearestNamedColors({ r: 255, g: 0, b: 0 });
    expect(nearest[0]!.color.name).toBe('red');
    expect(nearest[0]!.distance).toBe(0);
  });

  it('返回 3 个且按距离升序', () => {
    const nearest = findNearestNamedColors({ r: 100, g: 50, b: 150 });
    expect(nearest).toHaveLength(3);
    expect(nearest[0]!.distance).toBeLessThanOrEqual(nearest[1]!.distance);
    expect(nearest[1]!.distance).toBeLessThanOrEqual(nearest[2]!.distance);
  });

  it('完全匹配命名色时距离为 0', () => {
    const target = NAMED_COLOR_BY_NAME.teal!.rgb;
    expect(findNearestNamedColors(target)[0]!.color.name).toBe('teal');
  });

  it('colorDistance 满足对称性与自距离为 0', () => {
    const a = { r: 1, g: 2, b: 3 };
    const b = { r: 10, g: 20, b: 30 };
    expect(colorDistance(a, a)).toBe(0);
    expect(colorDistance(a, b)).toBe(colorDistance(b, a));
  });
});

describe('排序与格式化', () => {
  it('字母序与色相序输出不同顺序且均稳定', () => {
    const alpha = sortColors(NAMED_COLORS, 'alphabetical');
    const hue = sortColors(NAMED_COLORS, 'hue');
    expect(alpha[0]!.name).toBe('aliceblue');
    expect(hue).toHaveLength(148);
    // 色相序第一项色相应为最小（0）
    expect(hue[0]!.hsl.h).toBe(0);
  });

  it('格式化 rgb() 与 hsl()', () => {
    const red = NAMED_COLOR_BY_NAME.red!;
    expect(formatRgb(red)).toBe('rgb(255, 0, 0)');
    expect(formatHsl(red)).toBe('hsl(0, 100%, 50%)');
  });
});
