import { describe, expect, it } from 'vitest';
import {
  fixedAdd,
  fixedMul,
  fixedToFloat,
  floatToFixed,
  formatInfo,
  rawRange,
  toComplementStrings,
  validateFormat,
} from './fixedPoint';

describe('validateFormat', () => {
  it('接受 8/16/32 位与合法 n', () => {
    expect(() => validateFormat(16, 15)).not.toThrow();
    expect(() => validateFormat(8, 0)).not.toThrow();
    expect(() => validateFormat(32, 31)).not.toThrow();
  });

  it('拒绝非法位宽', () => {
    expect(() => validateFormat(12, 8)).toThrow(/位宽/);
  });

  it('拒绝越界或非整数 n', () => {
    expect(() => validateFormat(16, 16)).toThrow(/小数位数/);
    expect(() => validateFormat(16, -1)).toThrow(/小数位数/);
    expect(() => validateFormat(16, 1.5)).toThrow(/小数位数/);
  });
});

describe('Q15 官方/已知向量（16 位、15 小数位）', () => {
  const BITS = 16;
  const N = 15;

  it('0.5 → 0x4000（16384）', () => {
    const r = floatToFixed(0.5, BITS, N);
    expect(r.raw).toBe(BigInt(16384));
    expect(toComplementStrings(r.raw, BITS).hex).toBe('0x4000');
    expect(r.saturated).toBe(false);
  });

  it('-1 → 0x8000（raw -32768）', () => {
    const r = floatToFixed(-1, BITS, N);
    expect(r.raw).toBe(BigInt(-32768));
    expect(toComplementStrings(r.raw, BITS).hex).toBe('0x8000');
    expect(toComplementStrings(r.raw, BITS).binary).toBe('1000000000000000');
  });

  it('最大正值 0x7FFF 反解为 0.999969482421875', () => {
    const { max } = rawRange(BITS);
    expect(max).toBe(BigInt(32767));
    const back = fixedToFloat(max, BITS, N);
    expect(back).toBeCloseTo(0.999969482421875, 15);
    const r = floatToFixed(0.999969482421875, BITS, N);
    expect(r.raw).toBe(BigInt(0x7fff));
  });

  it('逐值往返一致', () => {
    for (const v of [0, 0.25, -0.25, 0.123456, -0.875, 1 / 3, -0.000030517578125]) {
      const r = floatToFixed(v, BITS, N);
      expect(fixedToFloat(r.raw, BITS, N)).toBeCloseTo(v, 4);
    }
  });
});

describe('精度与范围公式', () => {
  it('Q15 精度 2^-15、范围 [-1, 1-2^-15]', () => {
    const info = formatInfo(16, 15);
    expect(info.m).toBe(0);
    expect(info.precision).toBeCloseTo(Math.pow(2, -15), 18);
    expect(info.minRepresentable).toBe(-1);
    expect(info.maxRepresentable).toBeCloseTo(1 - Math.pow(2, -15), 15);
  });

  it('Q7（8 位 7 小数位）与 Q31 元信息', () => {
    const q7 = formatInfo(8, 7);
    expect(q7.m).toBe(0);
    expect(q7.precision).toBeCloseTo(1 / 128, 10);
    const q31 = formatInfo(32, 31);
    expect(q31.minRepresentable).toBe(-1);
    expect(q31.maxRepresentable).toBeCloseTo(1 - Math.pow(2, -31), 12);
  });

  it('Q1.15 之外的整数位格式：16 位 8 小数位 m=7', () => {
    const info = formatInfo(16, 8);
    expect(info.m).toBe(7);
    expect(info.minRepresentable).toBe(-128);
    expect(info.maxRepresentable).toBeCloseTo(127.99609375, 7);
  });
});

describe('饱和处理', () => {
  it('超过最大正值饱和到 0x7FFF 并标记', () => {
    const r = floatToFixed(1.5, 16, 15);
    expect(r.saturated).toBe(true);
    expect(r.raw).toBe(BigInt(32767));
    expect(r.value).toBeCloseTo(0.999969482421875, 10);
  });

  it('小于最小值饱和到 0x8000 并标记', () => {
    const r = floatToFixed(-2, 16, 15);
    expect(r.saturated).toBe(true);
    expect(r.raw).toBe(BigInt(-32768));
    expect(r.value).toBe(-1);
  });

  it('NaN/Infinity 抛错', () => {
    expect(() => floatToFixed(Number.NaN, 16, 15)).toThrow(/有限/);
    expect(() => floatToFixed(Number.POSITIVE_INFINITY, 16, 15)).toThrow(/有限/);
  });
});

describe('Q15 加法', () => {
  const BITS = 16;
  const N = 15;

  it('0.5 + 0.25 = 0.75（raw 24576 = 0x6000）', () => {
    const a = floatToFixed(0.5, BITS, N).raw;
    const b = floatToFixed(0.25, BITS, N).raw;
    const r = fixedAdd(a, b, BITS, N);
    expect(r.raw).toBe(BigInt(24576));
    expect(toComplementStrings(r.raw, BITS).hex).toBe('0x6000');
    expect(r.value).toBeCloseTo(0.75, 10);
    expect(r.overflow).toBe(false);
  });

  it('正数相加溢出返回饱和值并标记 overflow', () => {
    const a = floatToFixed(0.8, BITS, N).raw;
    const b = floatToFixed(0.8, BITS, N).raw;
    const r = fixedAdd(a, b, BITS, N);
    expect(r.overflow).toBe(true);
    expect(r.raw).toBe(BigInt(32767));
  });

  it('负数相加下溢饱和到最小值', () => {
    const a = floatToFixed(-0.9, BITS, N).raw;
    const b = floatToFixed(-0.9, BITS, N).raw;
    const r = fixedAdd(a, b, BITS, N);
    expect(r.overflow).toBe(true);
    expect(r.raw).toBe(BigInt(-32768));
  });
});

describe('Q15 乘法', () => {
  const BITS = 16;
  const N = 15;

  it('0.5 × 0.5 右移 15 定标得 0.25（raw 0x2000）', () => {
    const a = floatToFixed(0.5, BITS, N).raw;
    const r = fixedMul(a, a, BITS, N);
    expect(r.raw).toBe(BigInt(0x2000));
    expect(r.value).toBeCloseTo(0.25, 10);
    expect(r.overflow).toBe(false);
    expect(r.roundingError).toBe(0);
  });

  it('截断与最近舍入对不可整除乘积给出不同结果且误差可断言', () => {
    // 0.1 在 Q15 下 raw=3277，平方后定标：3277²=10738729，/32768≈327.72
    const a = floatToFixed(0.1, BITS, N, 'truncate').raw;
    const trunc = fixedMul(a, a, BITS, N, 'truncate');
    const near = fixedMul(a, a, BITS, N, 'nearest');
    expect(trunc.raw).toBe(BigInt(327));
    expect(near.raw).toBe(BigInt(328));
    expect(near.roundingError).toBeGreaterThanOrEqual(0);
  });

  it('负数乘法符号正确：(-0.5) × 0.5 = -0.25', () => {
    const a = floatToFixed(-0.5, BITS, N).raw;
    const b = floatToFixed(0.5, BITS, N).raw;
    const r = fixedMul(a, b, BITS, N);
    expect(r.raw).toBe(BigInt(-0x2000));
    expect(r.value).toBeCloseTo(-0.25, 10);
  });

  it('乘积定标后溢出被饱和标记', () => {
    const a = floatToFixed(0.9, BITS, N).raw;
    // 0.9×0.9=0.81 不溢出；改用 16 位 8 小数位让整数部分放大触发溢出
    const big = floatToFixed(100, 16, 8).raw;
    const r = fixedMul(big, big, 16, 8);
    expect(r.overflow).toBe(true);
  });
});

describe('多位宽与补码', () => {
  it('8/16/32 位负数补码双向转换', () => {
    for (const bits of [8, 16, 32] as const) {
      const n = bits - 1;
      const r = floatToFixed(-0.5, bits, n);
      expect(toComplementStrings(r.raw, bits).binary).toHaveLength(bits);
      expect(fixedToFloat(r.raw, bits, n)).toBeCloseTo(-0.5, 6);
    }
  });

  it('32 位 Q31 向量 0.5 → 0x40000000', () => {
    const r = floatToFixed(0.5, 32, 31);
    expect(toComplementStrings(r.raw, 32).hex).toBe('0x40000000');
  });

  it('fixedToFloat 拒绝超出位宽范围的 raw', () => {
    expect(() => fixedToFloat(BigInt(32768), 16, 15)).toThrow(/超出/);
  });

  it('n=0 时退化为纯整数格式', () => {
    const r = floatToFixed(42, 8, 0);
    expect(r.raw).toBe(BigInt(42));
    expect(r.value).toBe(42);
    expect(toComplementStrings(r.raw, 8).hex).toBe('0x2A');
  });
});
