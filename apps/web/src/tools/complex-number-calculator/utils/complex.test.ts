import { describe, expect, it } from 'vitest';
import {
  add,
  argument,
  complex,
  conjugate,
  div,
  formatComplex,
  fromPolar,
  modulus,
  mul,
  sub,
  toDegrees,
  toPolar,
  toRadians,
} from './complex';

const z1 = complex(1, 2);
const z2 = complex(3, 4);

describe('四则运算', () => {
  it('加法按实部虚部分别相加', () => {
    expect(add(z1, z2)).toEqual({ re: 4, im: 6 });
  });

  it('减法按实部虚部分别相减', () => {
    expect(sub(z1, z2)).toEqual({ re: -2, im: -2 });
  });

  it('乘法 (1+2i)(3+4i) = -5+10i', () => {
    expect(mul(z1, z2)).toEqual({ re: -5, im: 10 });
  });

  it('除法 (1+2i)÷(3+4i) = 0.44+0.08i', () => {
    const result = div(z1, z2);
    expect(result.re).toBeCloseTo(0.44, 10);
    expect(result.im).toBeCloseTo(0.08, 10);
  });

  it('除以零复数抛出错误', () => {
    expect(() => div(z1, complex(0, 0))).toThrow('除数不能为零');
  });

  it('零复数参与加减乘不报错', () => {
    expect(add(complex(0, 0), z1)).toEqual({ re: 1, im: 2 });
    expect(mul(complex(0, 0), z2)).toEqual({ re: 0, im: 0 });
  });
});

describe('模、辐角与共轭', () => {
  it('|3+4i| = 5', () => {
    expect(modulus(complex(3, 4))).toBe(5);
  });

  it('1+i 辐角为 π/4（45°）', () => {
    expect(argument(complex(1, 1))).toBeCloseTo(Math.PI / 4, 10);
    expect(toDegrees(argument(complex(1, 1)))).toBeCloseTo(45, 10);
  });

  it('象限决定辐角符号：-1-i 在第三象限为 -135°', () => {
    expect(toDegrees(argument(complex(-1, -1)))).toBeCloseTo(-135, 10);
  });

  it('零复数辐角约定为 0', () => {
    expect(argument(complex(0, 0))).toBe(0);
  });

  it('共轭只翻转虚部符号', () => {
    expect(conjugate(complex(3, -4))).toEqual({ re: 3, im: 4 });
    expect(conjugate(complex(0, 5))).toEqual({ re: 0, im: -5 });
  });
});

describe('直角 / 极坐标互转', () => {
  it('3+4i → r=5, θ≈0.9273rad', () => {
    const polar = toPolar(complex(3, 4));
    expect(polar.r).toBe(5);
    expect(polar.theta).toBeCloseTo(0.9272952, 6);
  });

  it('r=2, θ=60° → 1+√3 i ≈ 1+1.732i', () => {
    const result = fromPolar(2, toRadians(60));
    expect(result.re).toBeCloseTo(1, 10);
    expect(result.im).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('互转后回到原值', () => {
    const original = complex(-3, 4);
    const polar = toPolar(original);
    const back = fromPolar(polar.r, polar.theta);
    expect(back.re).toBeCloseTo(original.re, 10);
    expect(back.im).toBeCloseTo(original.im, 10);
  });

  it('r=0 时直角坐标为 0+0i', () => {
    expect(fromPolar(0, 1.5)).toEqual({ re: 0, im: 0 });
  });
});

describe('formatComplex', () => {
  it('纯实数、纯虚数与完整形式', () => {
    expect(formatComplex(complex(3, 0))).toBe('3');
    expect(formatComplex(complex(0, 5))).toBe('5i');
    expect(formatComplex(complex(0, 1))).toBe('i');
    expect(formatComplex(complex(0, -1))).toBe('-i');
    expect(formatComplex(complex(0, -2))).toBe('-2i');
    expect(formatComplex(complex(1, 2))).toBe('1 + 2i');
    expect(formatComplex(complex(1, -2))).toBe('1 - 2i');
  });

  it('浮点尾零被去除', () => {
    expect(formatComplex(div(complex(11), complex(10)))).toBe('1.1');
  });
});
