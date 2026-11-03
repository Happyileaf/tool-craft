import { describe, expect, it } from 'vitest';
import {
  analyzeSpfRecord,
  buildSpfRecord,
  isValidIPv4,
  isValidIPv6,
  isValidDomain,
  type SpfMechanismInput,
} from './spf';

describe('isValidIPv4', () => {
  it('接受合法地址与 CIDR', () => {
    expect(isValidIPv4('192.0.2.1')).toBe(true);
    expect(isValidIPv4('10.0.0.0/8')).toBe(true);
    expect(isValidIPv4('0.0.0.0/0')).toBe(true);
  });

  it('拒绝非法地址与前缀', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('1.2.3')).toBe(false);
    expect(isValidIPv4('1.2.3.4/33')).toBe(false);
    expect(isValidIPv4('1.2.3.4/-1')).toBe(false);
    expect(isValidIPv4('01.2.3.4')).toBe(false);
  });
});

describe('isValidIPv6', () => {
  it('接受合法压缩与完整形式', () => {
    expect(isValidIPv6('2001:db8::1')).toBe(true);
    expect(isValidIPv6('::')).toBe(true);
    expect(isValidIPv6('2001:db8::/32')).toBe(true);
    expect(isValidIPv6('fe80::1%zone')).toBe(false);
  });

  it('拒绝非法形式', () => {
    expect(isValidIPv6('2001::db8::1')).toBe(false);
    expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    expect(isValidIPv6('gggg::1')).toBe(false);
    expect(isValidIPv6('2001:db8::/129')).toBe(false);
  });
});

describe('isValidDomain', () => {
  it('接受合法域名（含下划线标签与尾点）', () => {
    // SPF include 目标常见 _spf 前缀，下划线在实际 SPF 目标域中合法
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('_spf.google.com')).toBe(true);
    expect(isValidDomain('a-b.example.org.')).toBe(true);
  });

  it('拒绝非法域名', () => {
    expect(isValidDomain('localhost')).toBe(false);
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('exa mple.com')).toBe(false);
  });
});

describe('buildSpfRecord', () => {
  it('拼装标准记录并省略默认 + 限定符', () => {
    const mechanisms: SpfMechanismInput[] = [
      { mechanism: 'ip4', qualifier: '+', value: '192.0.2.0/24' },
      { mechanism: 'include', qualifier: '+', value: '_spf.google.com' },
      { mechanism: 'all', qualifier: '~', value: '' },
    ];
    expect(buildSpfRecord(mechanisms)).toBe(
      'v=spf1 ip4:192.0.2.0/24 include:_spf.google.com ~all',
    );
  });

  it('无值 a/mx 作用于当前域，redirect 追加末尾', () => {
    const mechanisms: SpfMechanismInput[] = [
      { mechanism: 'a', qualifier: '+', value: '' },
      { mechanism: 'mx', qualifier: '?', value: '' },
      { mechanism: 'redirect', qualifier: '+', value: 'example.com' },
    ];
    expect(buildSpfRecord(mechanisms)).toBe('v=spf1 a ?mx redirect=example.com');
  });
});

describe('analyzeSpfRecord 正常路径', () => {
  it('合法记录无错误', () => {
    const result = analyzeSpfRecord('v=spf1 ip4:192.0.2.0/24 -all');
    expect(result.dnsLookupCount).toBe(0);
    expect(result.terms).toHaveLength(2);
    expect(result.issues.some((i) => i.level === 'error')).toBe(false);
  });

  it('规范化多余空白', () => {
    const result = analyzeSpfRecord('  v=spf1   ip4:10.0.0.1   -all  ');
    expect(result.normalized).toBe('v=spf1 ip4:10.0.0.1 -all');
  });

  it('统计 DNS 查询计数', () => {
    const result = analyzeSpfRecord(
      'v=spf1 include:a.com include:b.com mx ptr exists:c.com ip4:1.2.3.4 -all',
    );
    expect(result.dnsLookupCount).toBe(5); // include×2 + mx + ptr + exists
  });
});

describe('analyzeSpfRecord 错误与警告', () => {
  it('缺少 v=spf1 开头报错', () => {
    const result = analyzeSpfRecord('ip4:1.2.3.4 -all');
    expect(result.issues.some((i) => i.level === 'error' && i.message.includes('v=spf1'))).toBe(true);
  });

  it('无法识别的机制报错', () => {
    const result = analyzeSpfRecord('v=spf1 bogus:x.com -all');
    expect(result.issues.some((i) => i.message.includes('无法识别'))).toBe(true);
  });

  it('非法 ip4/ip4 域名报错', () => {
    expect(analyzeSpfRecord('v=spf1 ip4:999.1.1.1 -all').issues.some((i) => i.level === 'error')).toBe(true);
    expect(analyzeSpfRecord('v=spf1 ip6:zzzz -all').issues.some((i) => i.level === 'error')).toBe(true);
    expect(analyzeSpfRecord('v=spf1 include:not-a-domain -all').issues.some((i) => i.level === 'error')).toBe(true);
  });

  it('超过 10 次 DNS 查询报错，恰好 10 次警告', () => {
    const includes = Array.from({ length: 11 }, (_, i) => `include:d${i}.com`).join(' ');
    const over = analyzeSpfRecord(`v=spf1 ${includes} -all`);
    expect(over.issues.some((i) => i.level === 'error' && i.message.includes('10'))).toBe(true);

    const ten = analyzeSpfRecord(`v=spf1 ${Array.from({ length: 10 }, (_, i) => `include:d${i}.com`).join(' ')} -all`);
    expect(ten.issues.some((i) => i.level === 'warning' && i.message.includes('上限'))).toBe(true);
    expect(ten.issues.some((i) => i.level === 'error')).toBe(false);
  });

  it('+all 给出高危警告', () => {
    const result = analyzeSpfRecord('v=spf1 +all');
    expect(result.issues.some((i) => i.message.includes('+all'))).toBe(true);
  });

  it('all 不在末尾给出警告', () => {
    const result = analyzeSpfRecord('v=spf1 -all ip4:1.2.3.4');
    expect(result.issues.some((i) => i.message.includes('all'))).toBe(true);
  });

  it('all 与 redirect 共存时警告 redirect 被忽略', () => {
    const result = analyzeSpfRecord('v=spf1 -all redirect=example.com');
    expect(result.issues.some((i) => i.message.includes('redirect'))).toBe(true);
  });

  it('缺少 all/redirect 时提示策略不明确', () => {
    const result = analyzeSpfRecord('v=spf1 ip4:1.2.3.4');
    expect(result.issues.some((i) => i.message.includes('Neutral') || i.message.includes('all'))).toBe(true);
  });

  it('空记录报错', () => {
    const result = analyzeSpfRecord('   ');
    expect(result.issues.some((i) => i.level === 'error' && i.message.includes('为空'))).toBe(true);
  });

  it('解析限定符与无值机制', () => {
    const result = analyzeSpfRecord('v=spf1 a mx ~all');
    expect(result.terms.map((t) => [t.mechanism, t.qualifier])).toEqual([
      ['a', '+'],
      ['mx', '+'],
      ['all', '~'],
    ]);
  });
});
