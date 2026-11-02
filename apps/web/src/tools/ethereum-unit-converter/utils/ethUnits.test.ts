import { describe, expect, it } from 'vitest';
import {
  ETH_UNITS,
  convertUnit,
  eip1559GasFee,
  formatFixed,
  fromWei,
  groupThousands,
  legacyGasFee,
  parseDecimal,
  parsePositiveInt,
  toWei,
} from './ethUnits';

const unit = (name: string) => ETH_UNITS.find((u) => u.name === name)!;

describe('parseDecimal', () => {
  it('解析整数', () => {
    expect(parseDecimal('1')).toEqual({ value: BigInt(1), decimals: 0 });
    expect(parseDecimal('21000')).toEqual({ value: BigInt(21000), decimals: 0 });
  });

  it('解析小数并保留尾数信息', () => {
    expect(parseDecimal('1.23')).toEqual({ value: BigInt(123), decimals: 2 });
    expect(parseDecimal('0.00042')).toEqual({ value: BigInt(42), decimals: 5 });
    expect(parseDecimal('20.5')).toEqual({ value: BigInt(205), decimals: 1 });
  });

  it('容忍空白、前导零与下划线分隔', () => {
    expect(parseDecimal('  42 ')).toEqual({ value: BigInt(42), decimals: 0 });
    expect(parseDecimal('00.50')).toEqual({ value: BigInt(50), decimals: 2 });
    expect(parseDecimal('1_000.25')).toEqual({ value: BigInt(100025), decimals: 2 });
    expect(parseDecimal('000')).toEqual({ value: BigInt(0), decimals: 0 });
  });

  it('拒绝非法输入', () => {
    expect(() => parseDecimal('')).toThrow();
    expect(() => parseDecimal('1e18')).toThrow();
    expect(() => parseDecimal('-1')).toThrow();
    expect(() => parseDecimal('1.2.3')).toThrow();
    expect(() => parseDecimal('abc')).toThrow();
  });
});

describe('toWei / fromWei', () => {
  it('1 ETH = 10^18 Wei', () => {
    expect(toWei('1', unit('ETH'))).toBe(BigInt('1000000000000000000'));
  });

  it('固定验收向量：20 Gwei 与小数 ETH', () => {
    expect(toWei('20', unit('Gwei'))).toBe(BigInt('20000000000'));
    expect(toWei('0.00042', unit('ETH'))).toBe(BigInt('420000000000000'));
  });

  it('各单位指数正确', () => {
    expect(toWei('1', unit('Wei'))).toBe(BigInt(1));
    expect(toWei('1', unit('Kwei'))).toBe(BigInt(1000));
    expect(toWei('1', unit('Mwei'))).toBe(BigInt(1000000));
    expect(toWei('1', unit('Gwei'))).toBe(BigInt('1000000000'));
    expect(toWei('1', unit('Szabo'))).toBe(BigInt('1000000000000'));
    expect(toWei('1', unit('Finney'))).toBe(BigInt('1000000000000000'));
    expect(toWei('1', unit('Kether'))).toBe(BigInt('1000000000000000000000'));
    expect(toWei('1', unit('Tether'))).toBe(
      BigInt('1000000000000000000000000000000'),
    );
  });

  it('小数位超过单位精度时拒绝而非静默丢精度', () => {
    expect(() => toWei('1.5', unit('Wei'))).toThrow();
    expect(() => toWei('0.1234567890', unit('Gwei'))).toThrow();
  });

  it('fromWei 精确转回并去尾零', () => {
    expect(fromWei(BigInt('1000000000000000000'), unit('ETH'))).toBe('1');
    expect(fromWei(BigInt('420000000000000'), unit('ETH'))).toBe('0.00042');
    expect(fromWei(BigInt('20000000000'), unit('Gwei'))).toBe('20');
    expect(fromWei(BigInt('1500000000'), unit('Gwei'))).toBe('1.5');
    expect(fromWei(BigInt(1), unit('Gwei'))).toBe('0.000000001');
    expect(fromWei(BigInt(0), unit('ETH'))).toBe('0');
  });

  it('Wei → 更大单位换算正确', () => {
    expect(fromWei(BigInt('1000000000000000000000'), unit('Kether'))).toBe('1');
    expect(fromWei(BigInt(1), unit('ETH'))).toBe('0.000000000000000001');
  });
});

describe('convertUnit', () => {
  it('1 ETH = 10^9 Gwei = 10^18 Wei', () => {
    expect(convertUnit('1', unit('ETH'), unit('Gwei'))).toBe('1000000000');
    expect(convertUnit('1', unit('ETH'), unit('Wei'))).toBe('1000000000000000000');
  });

  it('1 Gwei = 0.000000001 ETH', () => {
    expect(convertUnit('1', unit('Gwei'), unit('ETH'))).toBe('0.000000001');
  });

  it('20 Gwei = 0.00000002 ETH', () => {
    expect(convertUnit('20', unit('Gwei'), unit('ETH'))).toBe('0.00000002');
  });

  it('往返一致', () => {
    const wei = toWei('12.345678', unit('Gwei'));
    expect(fromWei(wei, unit('Gwei'))).toBe('12.345678');
  });
});

describe('groupThousands / formatFixed', () => {
  it('千分位分组只作用于整数部分', () => {
    expect(groupThousands('1234567.89')).toBe('1,234,567.89');
    expect(groupThousands('1000000000000000000')).toBe('1,000,000,000,000,000,000');
    expect(groupThousands('42')).toBe('42');
    expect(groupThousands('0.00042')).toBe('0.00042');
  });

  it('固定小数位四舍五入', () => {
    expect(formatFixed('1.234', 2)).toBe('1.23');
    expect(formatFixed('1.235', 2)).toBe('1.24');
    expect(formatFixed('42', 2)).toBe('42.00');
    expect(formatFixed('0.00042', 2)).toBe('0.00');
  });
});

describe('parsePositiveInt', () => {
  it('解析非负整数（含下划线）', () => {
    expect(parsePositiveInt('21000', 'Gas 用量')).toBe(BigInt(21000));
    expect(parsePositiveInt('21_000', 'Gas 用量')).toBe(BigInt(21000));
  });

  it('拒绝空值、负数与小数', () => {
    expect(() => parsePositiveInt('', 'Gas 用量')).toThrow();
    expect(() => parsePositiveInt('-1', 'Gas 用量')).toThrow();
    expect(() => parsePositiveInt('1.5', 'Gas 用量')).toThrow();
  });
});

describe('legacyGasFee', () => {
  it('固定验收向量：21000 gas × 20 Gwei = 420000 Gwei = 0.00042 ETH', () => {
    const r = legacyGasFee('21000', '20');
    expect(r.gwei).toBe('420000');
    expect(r.eth).toBe('0.00042');
    expect(r.wei).toBe(BigInt('420000000000000'));
  });

  it('支持小数 gas price', () => {
    const r = legacyGasFee('21000', '20.5');
    // 21000 × 20.5 = 430500 Gwei = 0.0004305 ETH
    expect(r.gwei).toBe('430500');
    expect(r.eth).toBe('0.0004305');
  });
});

describe('eip1559GasFee', () => {
  it('计算 base 燃烧、tip、实际费用与授权上限', () => {
    const r = eip1559GasFee({
      baseFeeGwei: '20',
      priorityFeeGwei: '2',
      maxFeeGwei: '40',
      gasUsedText: '21000',
      gasLimitText: '21000',
    });
    // tip: 21000 × 2 = 42000 Gwei = 0.000042 ETH
    expect(r.priorityEth).toBe('0.000042');
    // base 燃烧: 21000 × 20 = 420000 Gwei = 0.00042 ETH
    expect(r.baseEth).toBe('0.00042');
    // 实际总费: 21000 × 22 = 462000 Gwei = 0.000462 ETH
    expect(r.totalEth).toBe('0.000462');
    expect(r.totalWei).toBe(r.priorityWei + r.baseWei);
    // 授权上限: 21000 × 40 = 840000 Gwei = 0.00084 ETH
    expect(r.maxEth).toBe('0.00084');
    expect(r.warning).toBeNull();
  });

  it('maxFee 低于 base + priority 时给出警告', () => {
    const r = eip1559GasFee({
      baseFeeGwei: '30',
      priorityFeeGwei: '5',
      maxFeeGwei: '32',
      gasUsedText: '21000',
      gasLimitText: '21000',
    });
    expect(r.warning).toContain('Max fee');
  });

  it('gasUsed 超过 gasLimit 时给出警告', () => {
    const r = eip1559GasFee({
      baseFeeGwei: '10',
      priorityFeeGwei: '1',
      maxFeeGwei: '20',
      gasUsedText: '30000',
      gasLimitText: '21000',
    });
    expect(r.warning).toContain('超过');
  });
});
