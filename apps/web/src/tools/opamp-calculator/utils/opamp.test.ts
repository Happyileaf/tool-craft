import { describe, expect, it } from 'vitest';
import {
  calcDifferential,
  calcInverting,
  calcNonInverting,
  calcSumming,
  formatEngineering,
  nearestE24,
  parseResistance,
  parseVoltage,
  recommendResistors,
} from './opamp';

describe('parseResistance', () => {
  it('解析多种单位写法为欧姆', () => {
    expect(parseResistance('10k')).toBe(10000);
    expect(parseResistance('10kΩ')).toBe(10000);
    expect(parseResistance('10K')).toBe(10000);
    expect(parseResistance('0.01M')).toBe(10000);
    expect(parseResistance('220')).toBe(220);
    expect(parseResistance('2.2M')).toBe(2.2e6);
  });

  it('拒绝空、零、负与非法输入', () => {
    expect(() => parseResistance('')).toThrow('不能为空');
    expect(() => parseResistance('0')).toThrow('大于 0');
    expect(() => parseResistance('-10k')).toThrow('大于 0');
    expect(() => parseResistance('abc')).toThrow('不是合法电阻');
  });
});

describe('parseVoltage', () => {
  it('解析 V / mV / kV 与纯数字', () => {
    expect(parseVoltage('200mV')).toBeCloseTo(0.2, 10);
    expect(parseVoltage('0.5')).toBeCloseTo(0.5, 10);
    expect(parseVoltage('1.5V')).toBeCloseTo(1.5, 10);
    expect(parseVoltage('1k V'.replace(' ', ''))).toBe(1000);
  });

  it('拒绝非法输入', () => {
    expect(() => parseVoltage('')).toThrow('不能为空');
    expect(() => parseVoltage('xx')).toThrow('不是合法电压');
  });
});

describe('calcInverting 反相放大器', () => {
  it('Rin=10k Rf=100k Vin=0.5V 时 Av=-10、Vout=-5V、输入阻抗=10k', () => {
    const result = calcInverting('0.5V', '10k', '100k');
    expect(result.gain).toBeCloseTo(-10, 10);
    expect(result.vOut).toBeCloseTo(-5, 10);
    expect(result.inputImpedance).toBe(10000);
    expect(result.feedbackCurrent).toBeCloseTo(5e-5, 12);
  });
});

describe('calcNonInverting 同相放大器', () => {
  it('Rg=10k Rf=90k Vin=0.2V 时 Av=10、Vout=2V', () => {
    const result = calcNonInverting('0.2V', '10k', '90k');
    expect(result.gain).toBeCloseTo(10, 10);
    expect(result.vOut).toBeCloseTo(2, 10);
    expect(result.feedbackCurrent).toBeCloseTo((2 - 0.2) / 90000, 12);
  });
});

describe('calcSumming 反相加法器', () => {
  it('两通道 Rf=100k 时 Vout=-3V', () => {
    const result = calcSumming(
      [
        { voltage: '0.1V', resistance: '10k' },
        { voltage: '0.2V', resistance: '10k' },
      ],
      '100k',
    );
    expect(result.vOut).toBeCloseTo(-3, 10);
    expect(result.channelCount).toBe(2);
    expect(result.channelCurrents).toHaveLength(2);
  });

  it('无有效通道时报错', () => {
    expect(() => calcSumming([{ voltage: '', resistance: '' }], '100k')).toThrow('至少填写一个');
  });
});

describe('calcDifferential 差分放大器', () => {
  it('匹配电阻网络 Vout=2V 且 matched=true', () => {
    const result = calcDifferential('0.1V', '0.3V', '10k', '100k', '10k', '100k');
    expect(result.matched).toBe(true);
    expect(result.mismatchPercent).toBeCloseTo(0, 9);
    expect(result.vOut).toBeCloseTo(2, 10);
    expect(result.gain).toBeCloseTo(10, 10);
  });

  it('电阻不匹配时 matched=false 且给出偏差百分比', () => {
    const result = calcDifferential('0.1V', '0.3V', '10k', '100k', '10k', '80k');
    expect(result.matched).toBe(false);
    expect(result.mismatchPercent).toBeGreaterThan(0);
  });
});

describe('recommendResistors 增益反推', () => {
  it('同相目标增益 10 给出 Rf/Rg=9', () => {
    const result = recommendResistors(10, 'nonInverting');
    expect(result.ratio).toBeCloseTo(9, 10);
    expect(result.baseResistance).toBe(10000);
    expect(result.feedbackTarget).toBe(90000);
  });

  it('反相目标增益 -10 给出 Rf/Rin=10', () => {
    const result = recommendResistors(-10, 'inverting');
    expect(result.ratio).toBeCloseTo(10, 10);
    expect(result.feedbackTarget).toBe(100000);
    expect(result.achievedGain).toBeLessThan(0);
  });

  it('非法目标增益报错', () => {
    expect(() => recommendResistors(1, 'nonInverting')).toThrow('大于 1');
    expect(() => recommendResistors(5, 'inverting')).toThrow('负数');
  });
});

describe('nearestE24', () => {
  it('返回 E24 序列内最接近的标称值', () => {
    expect(nearestE24(91000)).toBe(91000);
    expect(nearestE24(10200)).toBe(10000);
    expect(nearestE24(11400)).toBe(11000);
    expect(nearestE24(47000)).toBe(47000);
  });

  it('拒绝非正数', () => {
    expect(() => nearestE24(0)).toThrow('大于 0');
  });
});

describe('formatEngineering', () => {
  it('按有效数字格式化并处理极大值', () => {
    expect(formatEngineering(10.00001)).toBe('10');
    expect(formatEngineering(0.00001)).toMatch(/e/);
    expect(formatEngineering(Number.NaN)).toBe('—');
  });
});
