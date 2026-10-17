import { describe, it, expect } from 'vitest';
import {
  BitwiseOpEnum,
  ShiftDirectionEnum,
  applyBitwise,
  applyBitwiseNot,
  applyShift,
  convertBase,
  formatBitGroups,
  parseInteger,
  popcount,
  toBaseString,
} from './base';

describe('parseInteger', () => {
  it('解析各进制整数并支持前缀', () => {
    expect(parseInteger('255', 10).value).toBe(BigInt(255));
    expect(parseInteger('ff', 16).value).toBe(BigInt(255));
    expect(parseInteger('0xFF', 16).value).toBe(BigInt(255));
    expect(parseInteger('0b1111', 2).value).toBe(BigInt(15));
    expect(parseInteger('0o17', 8).value).toBe(BigInt(15));
  });

  it('支持正负号与下划线分隔', () => {
    expect(parseInteger('-255', 10).value).toBe(BigInt(-255));
    expect(parseInteger('+42', 10).value).toBe(BigInt(42));
    expect(parseInteger('1111_0000', 2).value).toBe(BigInt(240));
  });

  it('支持超出 32 位的大整数而不丢精度', () => {
    const big = parseInteger('18446744073709551615', 10);
    expect(big.value).toBe(BigInt('18446744073709551615'));
    expect(parseInteger('ffffffffffffffff', 16).value).toBe(
      BigInt('18446744073709551615'),
    );
  });

  it('非法字符与空输入返回明确错误', () => {
    expect(parseInteger('12g', 16).error).toContain('不是合法');
    expect(parseInteger('2', 2).error).toContain('不是合法');
    expect(parseInteger('', 10).error).toBe('请输入数值');
    expect(parseInteger('   ', 10).error).toBe('请输入数值');
    expect(parseInteger('-', 10).error).toBe('请输入数值');
  });
});

describe('toBaseString', () => {
  it('转换并支持大小写与负号', () => {
    expect(toBaseString(BigInt(255), 16)).toBe('ff');
    expect(toBaseString(BigInt(255), 16, true)).toBe('FF');
    expect(toBaseString(BigInt(-10), 2)).toBe('-1010');
  });
});

describe('convertBase', () => {
  it('输出 2 / 8 / 10 / 16 进制一览', () => {
    const result = convertBase('255', 10);
    expect(result.valid).toBe(true);
    expect(result.binary).toBe('11111111');
    expect(result.octal).toBe('377');
    expect(result.decimal).toBe('255');
    expect(result.hex).toBe('ff');
  });

  it('负数保持符号一致', () => {
    const result = convertBase('-ff', 16);
    expect(result.valid).toBe(true);
    expect(result.decimal).toBe('-255');
    expect(result.binary).toBe('-11111111');
  });

  it('非法输入返回错误且不抛异常', () => {
    const result = convertBase('xyz', 16);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.value).toBeNull();
  });
});

describe('formatBitGroups', () => {
  it('按位宽补齐并分组', () => {
    expect(formatBitGroups(BigInt(255), 8)).toBe('1111 1111');
    expect(formatBitGroups(BigInt(1), 8)).toBe('0000 0001');
    expect(formatBitGroups(BigInt(1), 16)).toBe('0000 0000 0000 0001');
  });

  it('负数按指定位宽的补码展示', () => {
    expect(formatBitGroups(BigInt(-1), 8)).toBe('1111 1111');
    expect(formatBitGroups(BigInt(-2), 8)).toBe('1111 1110');
  });
});

describe('popcount', () => {
  it('统计置位个数', () => {
    expect(popcount(BigInt(255), 8)).toBe(8);
    expect(popcount(BigInt(0), 8)).toBe(0);
    expect(popcount(BigInt(240), 8)).toBe(4);
    expect(popcount(BigInt(-1), 8)).toBe(8);
  });
});

describe('applyBitwise', () => {
  it('AND / OR / XOR 结果正确', () => {
    expect(applyBitwise(BigInt(0b1100), BigInt(0b1010), BitwiseOpEnum.AND)).toBe(
      BigInt(0b1000),
    );
    expect(applyBitwise(BigInt(0b1100), BigInt(0b1010), BitwiseOpEnum.OR)).toBe(
      BigInt(0b1110),
    );
    expect(applyBitwise(BigInt(0b1100), BigInt(0b1010), BitwiseOpEnum.XOR)).toBe(
      BigInt(0b0110),
    );
  });
});

describe('applyBitwiseNot', () => {
  it('按位宽取反', () => {
    expect(applyBitwiseNot(BigInt(0), 8)).toBe(BigInt(255));
    expect(applyBitwiseNot(BigInt(255), 8)).toBe(BigInt(0));
    expect(applyBitwiseNot(BigInt(0b0000_1111), 8)).toBe(BigInt(0b1111_0000));
  });
});

describe('applyShift', () => {
  it('左移在指定位宽内截断', () => {
    expect(applyShift(BigInt(1), 3, 8, ShiftDirectionEnum.LEFT)).toBe(BigInt(8));
    expect(applyShift(BigInt(0b1000_0000), 1, 8, ShiftDirectionEnum.LEFT)).toBe(
      BigInt(0),
    );
  });

  it('右移按无符号处理', () => {
    expect(applyShift(BigInt(0b1000_0000), 4, 8, ShiftDirectionEnum.RIGHT)).toBe(
      BigInt(0b1000),
    );
  });
});
