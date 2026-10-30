import { describe, expect, it } from 'vitest';
import { parseChineseNumber } from './parse-chinese';
import { numberToChinese } from './chinese';

describe('parseChineseNumber - 基本整数', () => {
  it('单字与零', () => {
    expect(parseChineseNumber('零').value).toBe('0');
    expect(parseChineseNumber('五').value).toBe('5');
    expect(parseChineseNumber('十').value).toBe('10');
    expect(parseChineseNumber('一十').value).toBe('10');
    expect(parseChineseNumber('十一').value).toBe('11');
    expect(parseChineseNumber('二十三').value).toBe('23');
    expect(parseChineseNumber('两').value).toBe('2');
  });

  it('节内单位与零占位', () => {
    expect(parseChineseNumber('一百').value).toBe('100');
    expect(parseChineseNumber('一百零一').value).toBe('101');
    expect(parseChineseNumber('一千零一').value).toBe('1001');
    expect(parseChineseNumber('一千零一十').value).toBe('1010');
    expect(parseChineseNumber('一千一百零一').value).toBe('1101');
  });

  it('万 / 亿 / 万亿', () => {
    expect(parseChineseNumber('一万').value).toBe('10000');
    expect(parseChineseNumber('一万零一').value).toBe('10001');
    expect(parseChineseNumber('一万二千三百四十五').value).toBe('12345');
    expect(parseChineseNumber('十万').value).toBe('100000');
    expect(parseChineseNumber('十万零一').value).toBe('100001');
    expect(parseChineseNumber('一亿').value).toBe('100000000');
    expect(parseChineseNumber('一亿零一').value).toBe('100000001');
    expect(parseChineseNumber('一亿零一万').value).toBe('100010000');
    expect(parseChineseNumber('一万亿').value).toBe('1000000000000');
  });

  it('负数', () => {
    expect(parseChineseNumber('负五').value).toBe('-5');
    expect(parseChineseNumber('负一万零一').value).toBe('-10001');
  });
});

describe('parseChineseNumber - 财务大写', () => {
  it('字形与萬億拾佰仟', () => {
    expect(parseChineseNumber('壹萬贰仟').value).toBe('12000');
    expect(parseChineseNumber('壹佰贰拾叁').value).toBe('123');
    expect(parseChineseNumber('壹萬贰仟叁佰肆拾伍元整').value).toBe('12345');
    expect(parseChineseNumber('壹佰贰拾叁元肆角伍分').value).toBe('123.45');
    expect(parseChineseNumber('壹佰贰拾叁元肆角').value).toBe('123.4');
    expect(parseChineseNumber('壹佰贰拾叁元零伍分').value).toBe('123.05');
    expect(parseChineseNumber('肆角伍分').value).toBe('0.45');
    expect(parseChineseNumber('伍分').value).toBe('0.05');
    expect(parseChineseNumber('肆角').value).toBe('0.4');
    expect(parseChineseNumber('负壹佰贰拾叁元肆角伍分').value).toBe('-123.45');
  });
});

describe('parseChineseNumber - 口语简式与小数', () => {
  it('点小数', () => {
    expect(parseChineseNumber('零点五').value).toBe('0.5');
    expect(parseChineseNumber('三点一四').value).toBe('3.14');
    expect(parseChineseNumber('负零点零五').value).toBe('-0.05');
  });

  it('口语省略末位单位并给出说明', () => {
    const r1 = parseChineseNumber('两千三');
    expect(r1.value).toBe('2300');
    expect(r1.notes.length).toBeGreaterThan(0);

    const r2 = parseChineseNumber('一万两千三');
    expect(r2.value).toBe('12300');
    expect(r2.notes.length).toBeGreaterThan(0);

    expect(parseChineseNumber('一万二').value).toBe('12000');
    expect(parseChineseNumber('两百三').value).toBe('230');
    // 明确写零则按字面
    expect(parseChineseNumber('两千零三').value).toBe('2003');
    expect(parseChineseNumber('两千三百').value).toBe('2300');
  });

  it('空白忽略', () => {
    expect(parseChineseNumber(' 一万 二千三百 ').value).toBe('12300');
  });
});

describe('parseChineseNumber - 往返一致性', () => {
  const vectors = [
    '0',
    '5',
    '10',
    '101',
    '1001',
    '12345',
    '10001',
    '100000001',
    '1000000000000',
    '-3.14',
  ];
  for (const v of vectors) {
    it(`「${v}」小写往返`, () => {
      expect(parseChineseNumber(numberToChinese(v)).value).toBe(v);
    });
  }

  it('财务往返', () => {
    const financialVectors = ['12345', '123.45', '123.05', '0.45', '0.05', '-123.4'];
    for (const v of financialVectors) {
      const text = numberToChinese(v, { variant: 'financial' });
      expect(parseChineseNumber(text).value).toBe(v);
    }
  });
});

describe('parseChineseNumber - 异常', () => {
  it('空与非法字符', () => {
    expect(() => parseChineseNumber('')).toThrow('不能为空');
    expect(() => parseChineseNumber('负')).toThrow('缺少数字');
    expect(() => parseChineseNumber('abc')).toThrow('无法识别');
  });

  it('结构错误', () => {
    expect(() => parseChineseNumber('一万万')).toThrow();
    expect(() => parseChineseNumber('一百十')).toThrow();
    // 连续两个裸数字
    expect(() => parseChineseNumber('一二三')).toThrow('数位单位');
  });

  it('数字模式拒绝金额用字', () => {
    expect(() => parseChineseNumber('壹佰元整', { mode: 'number' })).toThrow('金额用字');
  });

  it('范围边界与非法量级', () => {
    // 16 位上限：9999 万亿 = 9,999,000,000,000,000 可解析
    expect(parseChineseNumber('九千九百九十九万亿').value).toBe(
      '9999000000000000',
    );
    expect(parseChineseNumber('九千九百九十九万亿零一万').value).toBe(
      '9999000000010000',
    );
    // 超过万亿节的量级不合法
    expect(() => parseChineseNumber('一万亿亿')).toThrow();
    expect(() => parseChineseNumber('十万万亿')).toThrow();
  });
});
