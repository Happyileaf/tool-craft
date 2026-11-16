import { describe, it, expect } from 'vitest';
import {
  getOverview,
  voltageToCode,
  codeToVoltage,
  sinadToEnob,
  toHexPadded,
} from './quantizer';

describe('getOverview 参数总览', () => {
  it('单极性 12 位 Vref=3.3V：4096 码、满幅码 4095、LSB≈0.80566mV、满幅≈3.29919V', () => {
    const o = getOverview({ bits: 12, vref: 3.3, polarity: 'unipolar' });
    expect(o.codeCount).toBe('4096');
    expect(o.maxCode).toBe('4095');
    expect(o.lsb).toBeCloseTo(3.3 / 4096, 12);
    expect(o.lsb * 1000).toBeCloseTo(0.8056640625, 6);
    expect(o.fullScaleOutput).toBeCloseTo(3.3 - 3.3 / 4096, 10);
    expect(o.fullScaleOutput).toBeCloseTo(3.2991943359375, 6);
  });

  it('双极性 12 位 ±2.048V：LSB=0.001V、量程 4.096V', () => {
    const o = getOverview({ bits: 12, vref: 2.048, polarity: 'bipolar' });
    expect(o.lsb).toBeCloseTo(0.001, 12);
    expect(o.span).toBeCloseTo(4.096, 12);
    expect(o.fullScaleOutput).toBeCloseTo(2.048 - 0.001, 10);
  });

  it('SNR：12 位 74.0 dB、16 位 98.08 dB；噪声 RMS = LSB/√12', () => {
    const o12 = getOverview({ bits: 12, vref: 3.3, polarity: 'unipolar' });
    expect(o12.snrDb).toBeCloseTo(74.0, 6);
    expect(o12.quantizationNoiseRms).toBeCloseTo(o12.lsb / Math.sqrt(12), 12);
    expect(o12.quantizationNoiseRms).toBeCloseTo(0.00023258, 5);
    const o16 = getOverview({ bits: 16, vref: 3.3, polarity: 'unipolar' });
    expect(o16.snrDb).toBeCloseTo(98.08, 6);
  });

  it('24 位满幅码 16777215 用 BigInt 精确输出，32 位码值总数为 4294967296', () => {
    const o24 = getOverview({ bits: 24, vref: 3.3, polarity: 'unipolar' });
    expect(o24.maxCode).toBe('16777215');
    expect(o24.codeCount).toBe('16777216');
    const o32 = getOverview({ bits: 32, vref: 3.3, polarity: 'unipolar' });
    expect(o32.codeCount).toBe('4294967296');
    expect(o32.maxCode).toBe('4294967295');
  });

  it('非法 N 与 Vref 抛明确错误', () => {
    expect(() => getOverview({ bits: 0, vref: 3.3, polarity: 'unipolar' })).toThrow('1–32');
    expect(() => getOverview({ bits: 33, vref: 3.3, polarity: 'unipolar' })).toThrow('1–32');
    expect(() => getOverview({ bits: 12.5, vref: 3.3, polarity: 'unipolar' })).toThrow('整数');
    expect(() => getOverview({ bits: 12, vref: 0, polarity: 'unipolar' })).toThrow('Vref');
    expect(() => getOverview({ bits: 12, vref: -1, polarity: 'unipolar' })).toThrow('Vref');
  });
});

describe('voltageToCode 电压 → 码值', () => {
  const uni = { bits: 12, vref: 3.3, polarity: 'unipolar' as const };

  it('Vin=1.65V round 模式 → code=2048，量化误差 ≤ ½ LSB', () => {
    const r = voltageToCode(uni, 1.65, 'round');
    expect(r.code).toBe('2048');
    expect(r.hex).toBe('800');
    expect(Math.abs(r.error)).toBeLessThanOrEqual(getOverview(uni).lsb / 2 + 1e-15);
  });

  it('floor 模式按 Vin/LSB 精确值向下截断', () => {
    const lsb = 3.3 / 4096;
    const exactIndex = 1.65 / lsb;
    const r = voltageToCode(uni, 1.65, 'floor');
    expect(Number(r.code)).toBe(Math.floor(exactIndex));
  });

  it('Vin=0 → code 0；Vin 接近满幅 → 满幅码 4095', () => {
    expect(voltageToCode(uni, 0).code).toBe('0');
    const top = voltageToCode(uni, 3.3);
    expect(top.code).toBe('4095');
    expect(top.hex).toBe('FFF');
  });

  it('超量程夹取并标注 clipped', () => {
    const high = voltageToCode(uni, 5);
    expect(high.clipped).toBe(true);
    expect(high.code).toBe('4095');
    const low = voltageToCode(uni, -0.5);
    expect(low.clipped).toBe(true);
    expect(low.code).toBe('0');
  });

  it('双极性：负满幅 → 0、中点 → 2048（0V）、正满幅 → 4095', () => {
    const bi = { bits: 12, vref: 2.048, polarity: 'bipolar' as const };
    expect(voltageToCode(bi, -2.048).code).toBe('0');
    expect(voltageToCode(bi, 0).code).toBe('2048');
    expect(voltageToCode(bi, 2.048).code).toBe('4095');
  });
});

describe('codeToVoltage 码值 → 电压', () => {
  it('单极性：code=2048 → 1.65V（12 位 3.3V）', () => {
    const r = codeToVoltage({ bits: 12, vref: 3.3, polarity: 'unipolar' }, 2048);
    expect(r.voltage).toBeCloseTo(1.65, 10);
  });

  it('双极性：code=0 → −2.048V、code=2048 → 0V、code=4095 → +2.048−1LSB', () => {
    const bi = { bits: 12, vref: 2.048, polarity: 'bipolar' as const };
    expect(codeToVoltage(bi, 0).voltage).toBeCloseTo(-2.048, 10);
    const mid = codeToVoltage(bi, 2048);
    expect(mid.voltage).toBeCloseTo(0, 12);
    expect(mid.signedCode).toBe('0');
    expect(codeToVoltage(bi, 4095).voltage).toBeCloseTo(2.047, 10);
    expect(codeToVoltage(bi, 0).signedCode).toBe('-2048');
  });

  it('码值越界与非法字符串报错', () => {
    expect(() => codeToVoltage({ bits: 12, vref: 3.3, polarity: 'unipolar' }, 4096)).toThrow('超出范围');
    expect(() => codeToVoltage({ bits: 12, vref: 3.3, polarity: 'unipolar' }, -1)).toThrow('超出范围');
    expect(() => codeToVoltage({ bits: 12, vref: 3.3, polarity: 'unipolar' }, 'abc')).toThrow('整数');
  });

  it('往返一致：电压量化后还原误差 ≤ ½ LSB', () => {
    const uni = { bits: 12, vref: 3.3, polarity: 'unipolar' as const };
    const q = voltageToCode(uni, 1.234567);
    const back = codeToVoltage(uni, q.code);
    expect(Math.abs(back.voltage - 1.234567)).toBeLessThanOrEqual(getOverview(uni).lsb / 2 + 1e-15);
  });
});

describe('sinadToEnob / toHexPadded', () => {
  it('SINAD=72.24 dB → ENOB=(72.24−1.76)/6.02 ≈ 11.71 位', () => {
    const enob = sinadToEnob(72.24);
    expect(enob).toBeCloseTo((72.24 - 1.76) / 6.02, 10);
    expect(enob).toBeCloseTo(11.7076, 3);
  });

  it('hex 按位数补齐：12 位宽 3 字符、8 位宽 2 字符、24 位宽 6 字符', () => {
    expect(toHexPadded(BigInt(0), 12)).toBe('000');
    expect(toHexPadded(BigInt(2048), 12)).toBe('800');
    expect(toHexPadded(BigInt(255), 8)).toBe('FF');
    expect(toHexPadded(BigInt(16777215), 24)).toBe('FFFFFF');
  });
});
