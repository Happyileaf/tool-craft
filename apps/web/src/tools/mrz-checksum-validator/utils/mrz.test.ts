import { describe, it, expect } from 'vitest';
import { computeCheckDigit, isValidDate, parseMrz } from './mrz';

/** ICAO 9303 官方 TD3 示例护照 */
const TD3 = [
  'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
  'L898902C36UTO7408122F1204159ZE184226B<<<<<10',
].join('\n');

/** ICAO 9303 官方 TD1 示例 */
const TD1 = [
  'I<UTOD231458907<<<<<<<<<<<<<<<',
  '7408122F1204159UTO<<<<<<<<<<<6',
  'ERIKSSON<<ANNA<MARIA<<<<<<<<<<',
].join('\n');

/** ICAO 9303 官方 TD2 示例 */
const TD2 = [
  'I<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<',
  'D231458907UTO7408122F1204159<<<<<<<6',
].join('\n');

describe('ICAO 模 10 校验位', () => {
  it('TD3 证件号 L898902C3 → 6', () => {
    expect(computeCheckDigit('L898902C3')).toBe(6);
  });

  it('出生日期 740812 → 2，有效期 120415 → 9', () => {
    expect(computeCheckDigit('740812')).toBe(2);
    expect(computeCheckDigit('120415')).toBe(9);
  });

  it('填充符 < 按 0 参与计算', () => {
    expect(computeCheckDigit('ZE184226B<<<<<')).toBe(1);
  });
});

describe('TD3 护照解析', () => {
  const parsed = parseMrz(TD3);

  it('识别为 TD3 且全部校验位通过', () => {
    expect(parsed.format).toBe('TD3');
    expect(parsed.checks.every((check) => check.pass)).toBe(true);
    expect(parsed.compositePass).toBe(true);
  });

  it('解析证件号、国籍、日期、姓名', () => {
    expect(parsed.documentNumber).toBe('L898902C3');
    expect(parsed.nationality).toBe('UTO');
    expect(parsed.issuingCountry).toBe('UTO');
    expect(parsed.birthDate).toBe('740812');
    expect(parsed.expiryDate).toBe('120415');
    expect(parsed.sex).toBe('F');
    expect(parsed.fullName).toBe('ANNA MARIA ERIKSSON');
  });

  it('各校验项期望位与官方一致', () => {
    const byName = Object.fromEntries(parsed.checks.map((check) => [check.name, check]));
    expect(byName['证件号码校验位']!.expected).toBe(6);
    expect(byName['出生日期校验位']!.expected).toBe(2);
    expect(byName['有效期校验位']!.expected).toBe(9);
    expect(byName['复合校验位']!.expected).toBe(0);
  });
});

describe('TD1 与 TD2 解析', () => {
  it('TD1 格式自动识别且全部校验位通过', () => {
    const parsed = parseMrz(TD1);
    expect(parsed.format).toBe('TD1');
    expect(parsed.checks.every((check) => check.pass)).toBe(true);
    expect(parsed.documentNumber).toBe('D23145890');
    expect(parsed.compositePass).toBe(true);
  });

  it('TD2 格式自动识别且全部校验位通过', () => {
    const parsed = parseMrz(TD2);
    expect(parsed.format).toBe('TD2');
    expect(parsed.checks.every((check) => check.pass)).toBe(true);
    expect(parsed.documentNumber).toBe('D23145890');
    expect(parsed.fullName).toBe('ANNA MARIA ERIKSSON');
  });

  it('容忍小写输入与多余空白', () => {
    const parsed = parseMrz(`  ${TD3.toLowerCase()}\n `);
    expect(parsed.format).toBe('TD3');
    expect(parsed.checks.every((check) => check.pass)).toBe(true);
  });
});

describe('错误与篡改检测', () => {
  it('篡改校验位后对应项与复合校验位同时失败', () => {
    const lines = TD3.split('\n');
    lines[1] = lines[1]!.slice(0, 9) + '7' + lines[1]!.slice(10);
    const parsed = parseMrz(lines.join('\n'));
    const docCheck = parsed.checks.find((check) => check.name === '证件号码校验位')!;
    expect(docCheck.pass).toBe(false);
    expect(docCheck.actual).toBe(7);
    expect(parsed.compositePass).toBe(false);
  });

  it('行宽不符抛出形状错误', () => {
    expect(() => parseMrz('P<UTO\nL898902')).toThrow('无法识别');
  });

  it('非法字符给出行列定位', () => {
    const bad = 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<!'.padEnd(44, '<');
    const line2 = 'L898902C36UTO7408122F1204159ZE184226B<<<<<10';
    expect(() => parseMrz(`${bad}\n${line2}`)).toThrow('不属于 MRZ 合法字符集');
  });

  it('空输入抛错', () => {
    expect(() => parseMrz('   ')).toThrow('请粘贴');
  });

  it('日期合法性判定', () => {
    expect(isValidDate('740812')).toBe(true);
    expect(isValidDate('741301')).toBe(false);
    expect(isValidDate('abcdef')).toBe(false);
  });
});
