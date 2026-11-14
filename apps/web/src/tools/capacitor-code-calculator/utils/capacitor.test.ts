import { describe, expect, it } from 'vitest';
import { encodeCapacitance, formatCapacitance, parseCapacitorCode } from './capacitor';

describe('parseCapacitorCode', () => {
  it('解析三位数字码 104 为 100 nF', () => {
    const result = parseCapacitorCode('104');
    expect(result.picofarads).toBe(100000);
    expect(result.nanofarads).toBeCloseTo(100);
    expect(result.microfarads).toBeCloseTo(0.1);
    expect(result.tolerance).toBeNull();
  });

  it('解析两位小容值码 47 为 47 pF', () => {
    expect(parseCapacitorCode('47').picofarads).toBe(47);
  });

  it('解析 R 记法 4R7 与 R47', () => {
    expect(parseCapacitorCode('4R7').picofarads).toBeCloseTo(4.7e6);
    expect(parseCapacitorCode('R47').picofarads).toBeCloseTo(4.7e5);
  });

  it('解析 n 记法 2N2 与单位后缀 100N', () => {
    expect(parseCapacitorCode('2N2').picofarads).toBeCloseTo(2200);
    expect(parseCapacitorCode('100N').picofarads).toBeCloseTo(100000);
  });

  it('解析 p 记法 4P7 与前置单位 P47', () => {
    expect(parseCapacitorCode('4P7').picofarads).toBeCloseTo(4.7);
    expect(parseCapacitorCode('P47').picofarads).toBeCloseTo(0.47);
  });

  it('解析容差字母并给出上下限', () => {
    const result = parseCapacitorCode('104K');
    expect(result.tolerance?.code).toBe('K');
    expect(result.minPf).toBeCloseTo(90000);
    expect(result.maxPf).toBeCloseTo(110000);
  });

  it('解析非对称容差 Z', () => {
    const result = parseCapacitorCode('104Z');
    expect(result.minPf).toBeCloseTo(80000);
    expect(result.maxPf).toBeCloseTo(180000);
  });

  it('解析尾随额定电压码', () => {
    const result = parseCapacitorCode('104K1H');
    expect(result.voltage?.code).toBe('1H');
    expect(result.voltage?.volts).toBe(50);
    expect(result.picofarads).toBe(100000);
    expect(result.tolerance?.code).toBe('K');
  });

  it('拒绝空输入与无法识别的标码', () => {
    expect(() => parseCapacitorCode('')).toThrow();
    expect(() => parseCapacitorCode('XYZ')).toThrow();
    expect(() => parseCapacitorCode('10X')).toThrow();
  });
});

describe('encodeCapacitance', () => {
  it('100 nF 反查为 104', () => {
    const result = encodeCapacitance(100000);
    expect(result.code).toBe('104');
    expect(result.errorPercent).toBe(0);
  });

  it('4.7 µF 反查为 475', () => {
    const result = encodeCapacitance(4.7e6);
    expect(result.code).toBe('475');
    expect(result.actualPf).toBeCloseTo(4.7e6);
  });

  it('4.7 pF 反查为 4P7', () => {
    const result = encodeCapacitance(4.7);
    expect(result.code).toBe('4P7');
    expect(result.errorPercent).toBeCloseTo(0);
  });

  it('拒绝非正数容值', () => {
    expect(() => encodeCapacitance(0)).toThrow();
    expect(() => encodeCapacitance(-1)).toThrow();
  });
});

describe('formatCapacitance', () => {
  it('按三种单位格式化 4.7 µF', () => {
    const formatted = formatCapacitance(4.7e6);
    expect(formatted.pf).toBe('4700000');
    expect(formatted.nf).toBe('4700');
    expect(formatted.uf).toBe('4.7');
  });
});
