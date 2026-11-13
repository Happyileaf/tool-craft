import { describe, it, expect } from 'vitest';
import {
  apcaContrast,
  getReadabilityLevel,
  parseHexColor,
  toHex,
  validateColorPair,
} from './apca';

describe('parseHexColor', () => {
  it('解析 #RRGGBB 与 #RGB 简写', () => {
    expect(parseHexColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHexColor('1a2b3c')).toEqual({ r: 26, g: 43, b: 60 });
  });

  it('解析带 alpha 的 #RRGGBBAA', () => {
    expect(parseHexColor('#000000ff')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor('#ffffff80')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('低透明度与非法格式报错', () => {
    expect(() => parseHexColor('#00000001')).toThrow('透明度');
    expect(() => parseHexColor('#xyz')).toThrow('非法');
    expect(() => parseHexColor('#12345')).toThrow('非法');
    expect(() => parseHexColor('#gggggg')).toThrow('非法');
  });
});

describe('toHex', () => {
  it('输出大写两位补齐的十六进制', () => {
    expect(toHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(toHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
    expect(toHex({ r: 26, g: 43, b: 60 })).toBe('#1A2B3C');
  });
});

describe('apcaContrast', () => {
  it('黑字白底输出高正值（约 Lc 106）', () => {
    const lc = apcaContrast(parseHexColor('#000000'), parseHexColor('#FFFFFF'));
    expect(lc).toBeGreaterThan(100);
    expect(lc).toBeLessThanOrEqual(108);
  });

  it('白字黑底输出高负值，且与黑字白底绝对值接近', () => {
    const normal = apcaContrast(parseHexColor('#000000'), parseHexColor('#FFFFFF'));
    const reverse = apcaContrast(parseHexColor('#FFFFFF'), parseHexColor('#000000'));
    expect(reverse).toBeLessThan(-100);
    // APCA 极性不对称，两者量级接近但不要求完全相等
    expect(Math.abs(reverse)).toBeGreaterThan(95);
    expect(Math.abs(normal - Math.abs(reverse))).toBeLessThan(15);
  });

  it('同色对比为 0', () => {
    expect(apcaContrast(parseHexColor('#777777'), parseHexColor('#777777'))).toBe(0);
  });

  it('结果保留一位小数', () => {
    const lc = apcaContrast(parseHexColor('#123456'), parseHexColor('#abcdef'));
    expect(Math.abs(lc * 10 - Math.round(lc * 10))).toBeLessThan(Number.EPSILON * 100);
  });

  it('深色文字浅底为正、浅色文字深底为负', () => {
    const darkOnLight = apcaContrast(parseHexColor('#333333'), parseHexColor('#f5f5f5'));
    const lightOnDark = apcaContrast(parseHexColor('#f5f5f5'), parseHexColor('#333333'));
    expect(darkOnLight).toBeGreaterThan(0);
    expect(lightOnDark).toBeLessThan(0);
  });

  it('对比度随亮度差增大而单调增强（同一浅底上）', () => {
    const bg = parseHexColor('#FFFFFF');
    const weak = Math.abs(apcaContrast(parseHexColor('#999999'), bg));
    const medium = Math.abs(apcaContrast(parseHexColor('#555555'), bg));
    const strong = Math.abs(apcaContrast(parseHexColor('#000000'), bg));
    expect(weak).toBeLessThan(medium);
    expect(medium).toBeLessThan(strong);
  });
});

describe('getReadabilityLevel', () => {
  it('按 |Lc| 落入对应分级', () => {
    expect(getReadabilityLevel(95).grade).toBe('Lc 90+');
    expect(getReadabilityLevel(-95).grade).toBe('Lc 90+');
    expect(getReadabilityLevel(80).grade).toBe('Lc 75+');
    expect(getReadabilityLevel(60).grade).toBe('Lc 60+');
    expect(getReadabilityLevel(45).grade).toBe('Lc 45+');
    expect(getReadabilityLevel(30).grade).toBe('Lc 30+');
    expect(getReadabilityLevel(15).grade).toBe('Lc 15+');
    expect(getReadabilityLevel(5).grade).toBe('Lc < 15');
  });
});

describe('validateColorPair', () => {
  it('合法颜色对返回 null', () => {
    expect(validateColorPair('#000', '#fff')).toBeNull();
  });

  it('返回带字段名的中文错误', () => {
    expect(validateColorPair('#ggg', '#fff')).toContain('文字颜色');
    expect(validateColorPair('#000', '#zzz')).toContain('背景颜色');
  });
});
