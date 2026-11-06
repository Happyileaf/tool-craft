import { describe, expect, it } from 'vitest';
import {
  cleanMain,
  normalizeBatch,
  normalizePhoneNumber,
  splitExtension,
  vanityCharToDigit,
  visualGroup,
} from './e164';

describe('vanityCharToDigit', () => {
  it('字母按电话键盘映射且大小写不敏感', () => {
    expect(vanityCharToDigit('F')).toBe('3');
    expect(vanityCharToDigit('l')).toBe('5');
    expect(vanityCharToDigit('S')).toBe('7');
    expect(vanityCharToDigit('Z')).toBe('9');
    expect(vanityCharToDigit('1')).toBe('1');
  });

  it('1-800-FLOWERS 完整转换', () => {
    const digits = '1800FLOWERS'.split('').map(vanityCharToDigit).join('');
    expect(digits).toBe('18003569377');
  });
});

describe('splitExtension', () => {
  it('识别多种分机写法', () => {
    expect(splitExtension('+86 138 0000 0000;ext=801')).toEqual({
      main: '+86 138 0000 0000',
      extension: '801',
    });
    expect(splitExtension('021-12345678 转 666')).toEqual({
      main: '021-12345678',
      extension: '666',
    });
    expect(splitExtension('+1 202 555 0100 x 12')).toEqual({
      main: '+1 202 555 0100',
      extension: '12',
    });
    expect(splitExtension('+8613800000000')).toEqual({
      main: '+8613800000000',
      extension: null,
    });
  });
});

describe('cleanMain', () => {
  it('剥离分隔符并转换 vanity 字母', () => {
    expect(cleanMain('(021) 1234-5678').cleaned).toBe('02112345678');
    expect(cleanMain('1-800-FLOWERS').cleaned).toBe('18003569377');
    expect(cleanMain('+86.138/0000').cleaned).toBe('+861380000');
  });

  it('报告非法字符', () => {
    const result = cleanMain('138@0000!');
    expect(result.invalidChars).toEqual(expect.arrayContaining(['@', '!']));
  });
});

describe('visualGroup', () => {
  it('启发式分组：尾组 4 位，头部残余并入头部末组', () => {
    // 10 位：头 6 位恰分两组
    expect(visualGroup('2025550100')).toBe('202 555 0100');
    // 11 位：头 7 位，余 1 位并入头部末组 → 3/4/4
    expect(visualGroup('13800000000')).toBe('138 0000 0000');
    expect(visualGroup('123')).toBe('123');
    expect(visualGroup('12345')).toBe('1 2345');
  });
});

describe('normalizePhoneNumber - 国际格式', () => {
  it('+86 带分隔符规范化', () => {
    const result = normalizePhoneNumber('+86 138 0000 0000');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+8613800000000');
    expect(result.countryCode).toBe('86');
    expect(result.nationalNumber).toBe('13800000000');
    expect(result.telUri).toBe('tel:+8613800000000');
  });

  it('00 国际前缀等价于 +', () => {
    const result = normalizePhoneNumber('008613800000000');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+8613800000000');
  });

  it('北美 1 位国家码', () => {
    const result = normalizePhoneNumber('+1 (202) 555-0100');
    expect(result.ok).toBe(true);
    expect(result.countryCode).toBe('1');
    expect(result.e164).toBe('+12025550100');
  });

  it('vanity 号码规范化', () => {
    const result = normalizePhoneNumber('1-800-FLOWERS', '1');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+18003569377');
  });

  it('分机号保留在 tel URI', () => {
    const result = normalizePhoneNumber('+86 138 0000 0000;ext=801');
    expect(result.ok).toBe(true);
    expect(result.extension).toBe('801');
    expect(result.telUri).toBe('tel:+8613800000000;ext=801');
  });
});

describe('normalizePhoneNumber - 本地格式 + 默认国家码', () => {
  it('无 + 号码用默认国家码补全并去除国内长途前缀 0', () => {
    const result = normalizePhoneNumber('(021) 1234-5678', '86');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+862112345678');
    expect(result.nationalNumber).toBe('2112345678');
  });

  it('手机号无长途前缀直接拼接', () => {
    const result = normalizePhoneNumber('13800000000', '86');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+8613800000000');
  });

  it('缺少默认国家码时报错', () => {
    const result = normalizePhoneNumber('13800000000');
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('默认国家码');
  });
});

describe('normalizePhoneNumber - 错误路径', () => {
  it('非法字符报错', () => {
    const result = normalizePhoneNumber('+86 138@0000!');
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('非法字符');
  });

  it('数字超 15 位报错', () => {
    const result = normalizePhoneNumber('+86123456789012345');
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('15');
  });

  it('多个 + 报错', () => {
    const result = normalizePhoneNumber('+86+13800000000');
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('多个');
  });

  it('+ 不在开头报错', () => {
    const result = normalizePhoneNumber('86+13800000000');
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('开头');
  });

  it('空输入报错', () => {
    const result = normalizePhoneNumber('   ', '86');
    expect(result.ok).toBe(false);
  });
});

describe('normalizeBatch', () => {
  it('逐行处理且失败不中断，空行跳过', () => {
    const results = normalizeBatch(
      '+86 138 0000 0000\n\nbad@number\n021-12345678',
      '86',
    );
    expect(results).toHaveLength(3);
    expect(results[0]!.line).toBe(1);
    expect(results[0]!.ok).toBe(true);
    expect(results[1]!.line).toBe(3);
    expect(results[1]!.ok).toBe(false);
    expect(results[2]!.line).toBe(4);
    expect(results[2]!.ok).toBe(true);
    expect(results[2]!.e164).toBe('+862112345678');
  });
});
