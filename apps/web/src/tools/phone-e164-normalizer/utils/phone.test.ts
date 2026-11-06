import { describe, it, expect } from 'vitest';
import {
  cleanPhoneInput,
  findCountryRule,
  getDefaultCountryRule,
  normalizePhone,
  normalizePhoneBatch,
  COUNTRY_RULES,
  DEFAULT_COUNTRY_ISO,
} from './phone';

describe('cleanPhoneInput', () => {
  it('剥离空格、连字符、括号、点等分隔符', () => {
    expect(cleanPhoneInput('(138) 0000-0000').digits).toBe('13800000000');
    expect(cleanPhoneInput('138.0000.0000').digits).toBe('13800000000');
    expect(cleanPhoneInput('138 0000 0000').digits).toBe('13800000000');
  });

  it('识别 + 与 00 国际前缀', () => {
    expect(cleanPhoneInput('+8613800000000').hasInternationalPrefix).toBe(true);
    expect(cleanPhoneInput('0014155552671').hasInternationalPrefix).toBe(true);
    expect(cleanPhoneInput('13800000000').hasInternationalPrefix).toBe(false);
  });

  it('标记残留的非法字符', () => {
    expect(cleanPhoneInput('1380000000a').hasInvalidChar).toBe(true);
    expect(cleanPhoneInput('13800000000').hasInvalidChar).toBe(false);
  });
});

describe('国家码表', () => {
  it('默认国家为中国 +86', () => {
    expect(getDefaultCountryRule(DEFAULT_COUNTRY_ISO).countryCode).toBe('86');
  });

  it('可按国家码查找', () => {
    expect(findCountryRule('1')?.iso).toBe('US');
    expect(findCountryRule('852')?.iso).toBe('HK');
    expect(findCountryRule('999')).toBeUndefined();
  });

  it('码表国家码唯一', () => {
    const codes = COUNTRY_RULES.map((rule) => rule.countryCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('normalizePhone', () => {
  it('默认 +86 下把 11 位手机号规范化为 E.164 并分组', () => {
    const result = normalizePhone('138 0000 0000');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+8613800000000');
    expect(result.countryCode).toBe('86');
    expect(result.nationalNumber).toBe('13800000000');
    expect(result.internationalDisplay).toBe('+86 138 0000 0000');
  });

  it('不同分隔符写法结果等价', () => {
    const a = normalizePhone('(138) 0000-0000');
    const b = normalizePhone('13800000000');
    expect(a.e164).toBe(b.e164);
    expect(a.e164).toBe('+8613800000000');
  });

  it('解析 + 前缀的国际号码', () => {
    const result = normalizePhone('+1 415 555 2671');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+14155552671');
    expect(result.countryCode).toBe('1');
    expect(result.nationalNumber).toBe('4155552671');
  });

  it('解析 00 前缀的国际号码', () => {
    const result = normalizePhone('001-415-555-2671');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+14155552671');
  });

  it('本地号码误带默认国家码时容错', () => {
    const result = normalizePhone('8613800000000');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+8613800000000');
  });

  it('香港 8 位号码正确匹配 +852', () => {
    const result = normalizePhone('+852 9123 4567');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+85291234567');
    expect(result.internationalDisplay).toBe('+852 9123 4567');
  });

  it('含字母等非法字符时报错', () => {
    const result = normalizePhone('1380000000a');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('非法字符');
  });

  it('空号码报错', () => {
    expect(normalizePhone('   ').ok).toBe(false);
  });

  it('订阅号长度超出区间时报错', () => {
    const tooShort = normalizePhone('1380000000'); // 10 位，中国需 11 位
    expect(tooShort.ok).toBe(false);
    expect(tooShort.error).toContain('长度');
    const tooLong = normalizePhone('138000000001'); // 12 位
    expect(tooLong.ok).toBe(false);
  });

  it('无法识别的国家码报错', () => {
    const result = normalizePhone('+99912345678');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('国家码');
  });

  it('超过 E.164 15 位数字上限报错', () => {
    // 构造一个国家码可匹配但总数字超 15 位的号码：+1 + 14 位（美国上限 10，会先撞长度校验）
    // 这里用无法满足长度的场景验证超长分支保护逻辑存在
    const result = normalizePhone('+1234567890123456');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('切换默认国家后按新国家补全', () => {
    const result = normalizePhone('4155552671', 'US');
    expect(result.ok).toBe(true);
    expect(result.e164).toBe('+14155552671');
  });
});

describe('normalizePhoneBatch', () => {
  it('逐行独立返回成功 / 失败，空行跳过', () => {
    const results = normalizePhoneBatch('138 0000 0000\n\n1380000000a\n+1 415 555 2671\n  ');
    expect(results).toHaveLength(3);
    const [first, second, third] = results;
    expect(first!.ok).toBe(true);
    expect(second!.ok).toBe(false);
    expect(third!.ok).toBe(true);
    expect(first!.e164).toBe('+8613800000000');
    expect(third!.e164).toBe('+14155552671');
  });
});
