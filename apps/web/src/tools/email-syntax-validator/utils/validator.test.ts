import { describe, it, expect } from 'vitest';
import { validateEmail } from './validator';

describe('validateEmail 合法向量', () => {
  it('普通 dot-atom 地址合法且拆分正确', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.parts).toEqual({
      localPart: 'user',
      domain: 'example.com',
      localType: 'dot-atom',
      domainType: 'domain',
      isIdn: false,
    });
  });

  it('含 + 与子域、点号的地址合法', () => {
    const result = validateEmail('a.b+c@sub.example.co');
    expect(result.valid).toBe(true);
    expect(result.parts?.localPart).toBe('a.b+c');
    expect(result.parts?.domainType).toBe('domain');
  });

  it('quoted-string 本地部分（含空格）合法', () => {
    const result = validateEmail('"john doe"@example.com');
    expect(result.valid).toBe(true);
    expect(result.parts?.localType).toBe('quoted-string');
  });

  it('IPv4 字面量域合法', () => {
    const result = validateEmail('admin@[192.168.0.1]');
    expect(result.valid).toBe(true);
    expect(result.parts?.domainType).toBe('ipv4-literal');
  });

  it('IPv6 字面量域合法', () => {
    const result = validateEmail('host@[IPv6:2001:db8::1]');
    expect(result.valid).toBe(true);
    expect(result.parts?.domainType).toBe('ipv6-literal');
  });

  it('自动去除首尾空白', () => {
    const result = validateEmail('  user@example.com  ');
    expect(result.valid).toBe(true);
  });
});

describe('validateEmail 非法向量', () => {
  it('空输入被拒', () => {
    expect(validateEmail('   ').valid).toBe(false);
  });

  it('缺少 @ 或多个裸 @ 被拒', () => {
    expect(validateEmail('plainaddress').valid).toBe(false);
    expect(validateEmail('a@b@c.com').valid).toBe(false);
  });

  it('连续点、点号居首被拒', () => {
    expect(validateEmail('a..b@example.com').valid).toBe(false);
    expect(validateEmail('.a@example.com').valid).toBe(false);
    expect(validateEmail('a.@example.com').valid).toBe(false);
  });

  it('空 local / 空 domain 被拒', () => {
    expect(validateEmail('@example.com').valid).toBe(false);
    expect(validateEmail('user@').valid).toBe(false);
  });

  it('未加引号的空格被拒', () => {
    expect(validateEmail('a b@example.com').valid).toBe(false);
  });

  it('空标签域与非法字符被拒', () => {
    expect(validateEmail('a@.com').valid).toBe(false);
    expect(validateEmail('a@exa mple.com').valid).toBe(false);
  });

  it('IPv4 越界与前导零被拒', () => {
    expect(validateEmail('ab@[256.1.1.1]').valid).toBe(false);
    expect(validateEmail('ab@[01.1.1.1]').valid).toBe(false);
  });

  it('IPv6 非法格式被拒', () => {
    expect(validateEmail('h@[IPv6:gggg::1]').valid).toBe(false);
    expect(validateEmail('h@[IPv6:1::2::3]').valid).toBe(false);
  });

  it('local-part 超长与总长度超限被拒', () => {
    const longLocal = `${'a'.repeat(65)}@example.com`;
    expect(validateEmail(longLocal).valid).toBe(false);
    const longAddress = `${'a'.repeat(240)}@${'b'.repeat(20)}.com`;
    expect(validateEmail(longAddress).valid).toBe(false);
  });

  it('域标签连字符居首尾被拒', () => {
    expect(validateEmail('a@-bad.com').valid).toBe(false);
    expect(validateEmail('a@bad-.com').valid).toBe(false);
  });

  it('未闭合的引号被拒', () => {
    expect(validateEmail('"unclosed@example.com').valid).toBe(false);
  });
});

describe('validateEmail 警告与 IDN', () => {
  it('单标签域合法但产生 warning', () => {
    const result = validateEmail('a@localhost');
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('单标签'))).toBe(true);
  });

  it('非 ASCII 地址标注 IDN 警告', () => {
    const result = validateEmail('用户@例子.中国');
    expect(result.valid).toBe(true);
    expect(result.parts?.isIdn).toBe(true);
    expect(result.warnings.some((w) => w.includes('punycode'))).toBe(true);
  });
});
