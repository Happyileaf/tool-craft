import { describe, expect, it } from 'vitest';
import {
  compileCustomPattern,
  findPii,
  isValidIPv6,
  maskPii,
  maskValue,
  type PiiCategory,
} from './mask';

describe('isValidIPv6', () => {
  it('接受合法的完整与压缩写法', () => {
    expect(isValidIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true);
    expect(isValidIPv6('2001:db8::1')).toBe(true);
    expect(isValidIPv6('fe80::1')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('::')).toBe(true);
  });

  it('拒绝非法或歧义写法', () => {
    expect(isValidIPv6('2001:db8::1::2')).toBe(false);
    expect(isValidIPv6('gggg::1')).toBe(false);
    expect(isValidIPv6('2001:db8:1')).toBe(false);
    expect(isValidIPv6('1.2.3.4')).toBe(false);
    expect(isValidIPv6('12345::1')).toBe(false);
  });
});

describe('findPii', () => {
  it('识别邮箱', () => {
    const matches = findPii('联系 alice@example.com 谢谢');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.category).toBe('email');
    expect(matches[0]?.text).toBe('alice@example.com');
    expect(matches[0]?.start).toBe(3);
  });

  it('识别手机号、身份证、银行卡', () => {
    expect(findPii('电话 13812345678')[0]?.category).toBe('phone');
    const idMatches = findPii('身份证 11010119900307123X');
    expect(idMatches[0]?.category).toBe('idCard');
    expect(idMatches[0]?.text).toBe('11010119900307123X');
    expect(findPii('卡号 6222021234567890123')[0]?.category).toBe('bankCard');
  });

  it('识别 IPv4 与 IPv6', () => {
    expect(findPii('IP 192.168.1.1')[0]?.category).toBe('ipv4');
    const v6 = findPii('地址 2001:db8::1 结束');
    expect(v6[0]?.category).toBe('ipv6');
    expect(v6[0]?.text).toBe('2001:db8::1');
  });

  it('识别 key=secret、Bearer 与 JWT，且只覆盖密钥段', () => {
    const kv = findPii('api_key=sk-1234567890abcdef');
    expect(kv[0]?.category).toBe('apiKey');
    expect(kv[0]?.text).toBe('sk-1234567890abcdef');
    expect(kv[0]?.start).toBe(8);

    const bearer = findPii('Authorization: Bearer abcdefghijklmnopqrs');
    expect(bearer[0]?.category).toBe('apiKey');
    expect(bearer[0]?.text).toBe('abcdefghijklmnopqrs');

    const jwtToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8';
    expect(findPii(`token ${jwtToken}`)[0]?.text).toBe(jwtToken);
  });

  it('URL 与普通文本不误报', () => {
    expect(findPii('访问 https://example.com/path 查看')).toHaveLength(0);
    expect(findPii('端口为 example.com:8080')).toHaveLength(0);
    expect(findPii('普通文本，没有敏感信息')).toHaveLength(0);
  });

  it('同一段数字按规则优先级占位且按下标排序', () => {
    const matches = findPii('a@x.com 13812345678');
    expect(matches.map((item) => item.category)).toEqual(['email', 'phone']);
  });
});

describe('maskValue', () => {
  it('full 策略等长替换', () => {
    expect(maskValue('alice@example.com', 'full')).toBe('*****************');
  });

  it('partial 邮箱保留本地名首字符与域名', () => {
    expect(maskValue('alice@example.com', 'partial', '*', 'email')).toBe(
      'a****@example.com',
    );
    expect(maskValue('a@x.com', 'partial', '*', 'email')).toBe('*@x.com');
  });

  it('partial 非邮箱类别即使包含 @ 也按普通串处理', () => {
    expect(maskValue('a@b.com', 'partial', '*', 'custom')).toBe('a*****m');
  });

  it('partial 非邮箱串保留首尾，支持自定义掩码字符', () => {
    expect(maskValue('13812345678', 'partial')).toBe('13*******78');
    expect(maskValue('ab', 'partial')).toBe('**');
    expect(maskValue('abcd', 'partial')).toBe('a**d');
    expect(maskValue('13812345678', 'partial', '#')).toBe('13#######78');
  });
});

describe('maskPii', () => {
  it('对整段文本脱敏并统计计数与明细', () => {
    const result = maskPii('邮箱 alice@example.com，手机 13812345678');
    expect(result.output).toBe('邮箱 a****@example.com，手机 13*******78');
    expect(result.total).toBe(2);
    expect(result.counts.email).toBe(1);
    expect(result.counts.phone).toBe(1);
    expect(result.hits).toEqual([
      { category: 'email', original: 'alice@example.com', masked: 'a****@example.com' },
      { category: 'phone', original: '13812345678', masked: '13*******78' },
    ]);
  });

  it('空输入返回空结果', () => {
    const result = maskPii('');
    expect(result).toEqual({
      output: '',
      counts: {
        email: 0,
        phone: 0,
        idCard: 0,
        bankCard: 0,
        ipv4: 0,
        ipv6: 0,
        apiKey: 0,
        custom: 0,
      },
      total: 0,
      hits: [],
    });
  });

  it('enabled 可按类别关闭，且 key= 前缀不被掩码', () => {
    const result = maskPii('api_key=sk-1234567890abcdef 13812345678', 'full', '*', {
      apiKey: true,
      phone: false,
    } satisfies Partial<Record<PiiCategory, boolean>>);
    expect(result.output).toBe('api_key=******************* 13812345678');
    expect(result.counts.apiKey).toBe(1);
    expect(result.counts.phone).toBe(0);
  });

  it('关闭全部类别时原文不变', () => {
    const text = 'alice@example.com 192.168.1.1';
    const result = maskPii(text, 'partial', '*', {
      email: false,
      phone: false,
      idCard: false,
      bankCard: false,
      ipv4: false,
      ipv6: false,
      apiKey: false,
    });
    expect(result.output).toBe(text);
    expect(result.total).toBe(0);
  });

  it('支持用户自定义正则命中项', () => {
    const patterns = [compileCustomPattern('订单号\\s*：\\s*\\d{6}')];
    const result = maskPii('订单号：123456 已发货', 'full', '#', undefined, patterns);
    expect(result.output).toBe('########## 已发货');
    expect(result.counts.custom).toBe(1);
    expect(result.hits[0]?.category).toBe('custom');
  });

  it('自定义正则支持 /pattern/flags 写法且内置规则优先占位', () => {
    const patterns = [compileCustomPattern('/\\d{11}/g')];
    const result = maskPii('手机 13812345678', 'full', '*', undefined, patterns);
    expect(result.output).toBe('手机 ***********');
    expect(result.counts.phone).toBe(1);
    expect(result.counts.custom).toBe(0);
  });

  it('非法自定义正则源抛出错误', () => {
    expect(() => compileCustomPattern('([a-z')).toThrow(SyntaxError);
  });
});
