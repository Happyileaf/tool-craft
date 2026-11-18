import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_DFT,
  ALGORITHM_FFT,
  MAX_SAMPLE_COUNT,
} from '../constants';
import {
  analyzeForward,
  analyzeInverse,
  binsToCsv,
  buildBins,
  isPowerOfTwo,
  maxAbsoluteError,
  naiveDft,
  parseComplexSequence,
  radix2Fft,
  toSingleSidedBins,
  transform,
  type Complex,
} from './fft';

const TOLERANCE = 1e-10;

function approxEqual(actual: number, expected: number, epsilon = TOLERANCE): boolean {
  return Math.abs(actual - expected) <= epsilon;
}

describe('isPowerOfTwo', () => {
  it('正确识别 2 的幂（含 N=1）', () => {
    expect(isPowerOfTwo(1)).toBe(true);
    expect(isPowerOfTwo(2)).toBe(true);
    expect(isPowerOfTwo(1024)).toBe(true);
    expect(isPowerOfTwo(6)).toBe(false);
    expect(isPowerOfTwo(0)).toBe(false);
    expect(isPowerOfTwo(-4)).toBe(false);
    expect(isPowerOfTwo(1.5)).toBe(false);
  });
});

describe('parseComplexSequence', () => {
  it('解析逗号与空白分隔的实数序列', () => {
    expect(parseComplexSequence('1, 0, -1, 0')).toEqual([
      { re: 1, im: 0 },
      { re: 0, im: 0 },
      { re: -1, im: 0 },
      { re: 0, im: 0 },
    ]);
  });

  it('支持换行与多空格分隔', () => {
    const result = parseComplexSequence('1\n  2  3\n4');
    expect(result).toHaveLength(4);
    expect(result[3]).toEqual({ re: 4, im: 0 });
  });

  it('解析多种复数写法', () => {
    const result = parseComplexSequence('1+2i, 3-4j, i, -i, 5j, -2.5+0.5i');
    expect(result[0]).toEqual({ re: 1, im: 2 });
    expect(result[1]).toEqual({ re: 3, im: -4 });
    expect(result[2]).toEqual({ re: 0, im: 1 });
    expect(result[3]).toEqual({ re: 0, im: -1 });
    expect(result[4]).toEqual({ re: 0, im: 5 });
    expect(result[5]).toEqual({ re: -2.5, im: 0.5 });
  });

  it('空序列与非法 token 抛错', () => {
    expect(() => parseComplexSequence('   ')).toThrow('序列为空');
    expect(() => parseComplexSequence('1, abc, 3')).toThrow('不是合法');
    expect(() => parseComplexSequence('1, 2..3')).toThrow('不是合法');
  });
});

describe('固定向量验收', () => {
  it('脉冲序列 [1,0,0,0] 四个 bin 幅度均为 1、相位均为 0', () => {
    const { result } = analyzeForward('1, 0, 0, 0');
    expect(result.bins).toHaveLength(4);
    for (const bin of result.bins) {
      expect(approxEqual(bin.magnitude, 1)).toBe(true);
      expect(bin.phase).not.toBeNull();
      expect(approxEqual(bin.phase ?? NaN, 0)).toBe(true);
    }
  });

  it('[1,0,-1,0] 仅 k=1 与 k=3 非零，幅度均为 2、相位均为 0（DFT 定义式 X[k]=Σx[n]e^(−j2πkn/N)）', () => {
    const { result } = analyzeForward('1, 0, -1, 0');
    const bins = result.bins;
    expect(approxEqual(bins[0]!.magnitude, 0)).toBe(true);
    expect(bins[0]!.phase).toBeNull();
    expect(approxEqual(bins[2]!.magnitude, 0)).toBe(true);
    expect(bins[2]!.phase).toBeNull();

    // 严格手算：X[1]=1−e^(−jπ)=2、X[3]=1−e^(−j3π)=2，均为纯实数
    expect(approxEqual(bins[1]!.magnitude, 2)).toBe(true);
    expect(approxEqual(bins[1]!.phase ?? NaN, 0)).toBe(true);
    expect(approxEqual(bins[3]!.magnitude, 2)).toBe(true);
    expect(approxEqual(bins[3]!.phase ?? NaN, 0)).toBe(true);
  });

  it('sin 序列 [0,1,0,-1] 在 k=1/k=3 幅度 2，相位分别为 −π/2 与 +π/2', () => {
    const { result } = analyzeForward('0, 1, 0, -1');
    const bins = result.bins;
    expect(approxEqual(bins[1]!.magnitude, 2)).toBe(true);
    expect(approxEqual(bins[1]!.phase ?? NaN, -Math.PI / 2)).toBe(true);
    expect(approxEqual(bins[3]!.magnitude, 2)).toBe(true);
    expect(approxEqual(bins[3]!.phase ?? NaN, Math.PI / 2)).toBe(true);
  });

  it('N=8 的 cos(2π·n/8) 能量集中在 k=1 与 k=7，单边谱 k=1 幅度为 1', () => {
    const samples = Array.from({ length: 8 }, (_, n) => Math.cos((2 * Math.PI * n) / 8));
    const { result } = analyzeForward(samples.join(','));
    const bins = result.bins;
    for (const bin of bins) {
      if (bin.k === 1 || bin.k === 7) {
        expect(approxEqual(bin.magnitude, 4)).toBe(true);
      } else {
        expect(bin.magnitude).toBeLessThan(1e-10);
      }
    }
    const single = toSingleSidedBins(bins);
    expect(single).toHaveLength(5);
    const k1 = single.find((bin) => bin.k === 1)!;
    expect(approxEqual(k1.magnitude, 1)).toBe(true);
    // DC 与 Nyquist 不翻倍
    expect(approxEqual(single[0]!.magnitude, bins[0]!.magnitude / 8)).toBe(true);
    expect(approxEqual(single[4]!.magnitude, bins[4]!.magnitude / 8)).toBe(true);
  });

  it('N=1 时 DFT 等于自身且单边/双边一致', () => {
    const { result } = analyzeForward('3.5');
    expect(result.bins).toHaveLength(1);
    expect(approxEqual(result.bins[0]!.re, 3.5)).toBe(true);
    expect(approxEqual(result.bins[0]!.im, 0)).toBe(true);
    const single = toSingleSidedBins(result.bins);
    expect(single).toHaveLength(1);
    expect(approxEqual(single[0]!.magnitude, result.bins[0]!.magnitude)).toBe(true);
  });
});

describe('FFT 与 naive DFT 一致性', () => {
  it('N=16 固定向量两种算法最大误差 < 1e-9', () => {
    const input: Complex[] = Array.from({ length: 16 }, (_, i) => ({
      re: Math.sin(0.7 * i) + 0.5 * Math.cos(1.3 * i),
      im: 0.3 * Math.sin(0.3 * i + 1),
    }));
    const fftResult = radix2Fft(input, false);
    const dftResult = naiveDft(input, false);
    expect(maxAbsoluteError(fftResult, dftResult)).toBeLessThan(1e-9);
  });

  it('2 的幂长度自动选择 radix-2 FFT，非 2 的幂回退 naive DFT', () => {
    const powerOfTwo = transform([{ re: 1, im: 0 }, { re: 2, im: 0 }, { re: 3, im: 0 }, { re: 4, im: 0 }], false);
    expect(powerOfTwo.algorithm).toBe(ALGORITHM_FFT);

    const nonPower = transform(
      Array.from({ length: 6 }, (_, i) => ({ re: i + 1, im: 0 })),
      false,
    );
    expect(nonPower.algorithm).toBe(ALGORITHM_DFT);
  });

  it('N=6 naive DFT 与定义式结果一致', () => {
    const input: Complex[] = [1, -1, 2, 0.5, -2, 3].map((re) => ({ re, im: 0 }));
    const { output, result } = (() => {
      const direct = analyzeForward(input.map((v) => String(v.re)).join(','));
      return { output: direct.output, result: direct.result };
    })();
    const expected = naiveDft(input, false);
    expect(maxAbsoluteError(output, expected)).toBeLessThan(1e-10);
    expect(result.algorithm).toBe(ALGORITHM_DFT);
    expect(result.complexity).toBe('O(N²)');
  });

  it('N 超过 4096 被拒绝', () => {
    const longInput = Array.from({ length: MAX_SAMPLE_COUNT + 1 }, (_, i) => i).join(',');
    expect(() => analyzeForward(longInput)).toThrow('超过上限');
  });
});

describe('IFFT 往返与逆变换', () => {
  it('任意合法输入 FFT → IFFT 往返最大绝对误差 < 1e-9', () => {
    const cases: Complex[][] = [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: -1, im: 0 }, { re: 0, im: 0 }],
      Array.from({ length: 16 }, (_, i) => ({ re: i * 0.1 - 0.8, im: Math.sin(i) })),
      [{ re: 2.5, im: -1.25 }],
    ];
    for (const input of cases) {
      const spectrum = radix2Fft(input, false);
      const reconstructed = radix2Fft(spectrum, true);
      expect(maxAbsoluteError(input, reconstructed)).toBeLessThan(1e-9);
    }
  });

  it('analyzeForward 输出的 reconstructionError < 1e-9', () => {
    const { result } = analyzeForward('1, 0, -1, 0');
    expect(result.reconstructionError).toBeLessThan(1e-9);
  });

  it('IDFT：频域向量 [0,-2j,0,2j] 逆变换还原为时域 sin 序列 [0,1,0,-1]', () => {
    const inverse = analyzeInverse('0, -2i, 0, 2i');
    const expected = [0, 1, 0, -1];
    inverse.output.forEach((value, i) => {
      expect(approxEqual(value.re, expected[i]!)).toBe(true);
      expect(approxEqual(value.im, 0)).toBe(true);
    });
  });

  it('实数输入逆变换虚部残差低于阈值时自动取实', () => {
    const forward = analyzeForward('1, 2, 3, 4, 5');
    const freqText = forward.output.map((v) => `${v.re}${v.im >= 0 ? '+' : ''}${v.im}i`).join(', ');
    const inverse = analyzeInverse(freqText);
    expect(inverse.output.every((v) => v.im === 0)).toBe(true);
    inverse.output.forEach((v, i) => {
      expect(approxEqual(v.re, i + 1)).toBe(true);
    });
  });

  it('真正的复数逆变换保留虚部', () => {
    const inverse = analyzeInverse('1+1i, 2+2i');
    // N=2 IDFT: x[0]=(X0+X1)/2=1.5+1.5i, x[1]=(X0-X1)/2=-0.5-0.5i
    expect(approxEqual(inverse.output[0]!.re, 1.5)).toBe(true);
    expect(approxEqual(inverse.output[0]!.im, 1.5)).toBe(true);
    expect(approxEqual(inverse.output[1]!.re, -0.5)).toBe(true);
    expect(approxEqual(inverse.output[1]!.im, -0.5)).toBe(true);
  });
});

describe('bin 字段与导出', () => {
  it('bin 包含 k/re/im/magnitude/phase/normalizedFreq', () => {
    const { result } = analyzeForward('1, 0, 0, 0');
    const bin = result.bins[2]!;
    expect(bin.k).toBe(2);
    expect(bin.normalizedFreq).toBe(0.5);
    expect(typeof bin.re).toBe('number');
    expect(typeof bin.im).toBe('number');
    expect(typeof bin.magnitude).toBe('number');
  });

  it('buildBins 对零幅度 bin 标记相位为 null', () => {
    const bins = buildBins([{ re: 0, im: 0 }]);
    expect(bins[0]!.phase).toBeNull();
    expect(bins[0]!.magnitude).toBe(0);
  });

  it('binsToCsv 输出表头与每行字段，角度制正确换算', () => {
    const { result } = analyzeForward('1, 0, -1, 0');
    const csvRad = binsToCsv(result.bins, 'radian');
    const lines = csvRad.split('\n');
    expect(lines[0]).toBe('k,normalized_freq,re,im,magnitude,phase');
    expect(lines).toHaveLength(5);
    // cos 序列 X[1]=2+0j，相位为 0
    const csvDeg = binsToCsv(result.bins, 'degree');
    const k1Row = csvDeg.split('\n')[2]!;
    const phaseDeg = Number(k1Row.split(',')[5]);
    expect(approxEqual(phaseDeg, 0)).toBe(true);
    // 零幅度 bin 的相位字段为空
    const k0Row = csvDeg.split('\n')[1]!;
    expect(k0Row.endsWith(',')).toBe(true);
  });
});
