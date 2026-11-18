import { describe, it, expect } from 'vitest';
import { generate, generatePolicyId, MAX_AGE_LIMIT, type MtaStsInput } from './mtaSts';

const base: MtaStsInput = {
  domain: 'example.com',
  mode: 'testing',
  mxHosts: ['mail.example.com', '*.example.com'],
  maxAge: 86400,
  reportScheme: 'mailto',
  reportTarget: 'tls-reports@example.com',
  policyId: '20261119T080000',
};

describe('generatePolicyId 版本 id', () => {
  it('按 UTC 生成 15 位紧凑时间戳', () => {
    const id = generatePolicyId(new Date('2026-11-19T08:30:45Z'));
    expect(id).toBe('20261119T083045');
    expect(id).toMatch(/^\d{8}T\d{6}$/);
  });
});

describe('generate 合法输入', () => {
  it('生成 testing 策略文件与两条 DNS 记录', () => {
    const result = generate(base);
    expect(result.errors).toEqual([]);
    expect(result.policyFile).toBe(
      'version: STSv1\nmode: testing\nmax_age: 86400\nmx: mail.example.com\nmx: *.example.com\n',
    );
    expect(result.stsDns).toEqual({
      name: '_mta-sts.example.com',
      value: 'v=STSv1; id=20261119T080000',
    });
    expect(result.tlsRptDns).toEqual({
      name: '_smtp._tls.example.com',
      value: 'v=TLSRPTv1; rua=mailto:tls-reports@example.com',
    });
    expect(result.policyUrl).toBe('https://mta-sts.example.com/.well-known/mta-sts.txt');
  });

  it('支持 https 形式 rua', () => {
    const result = generate({
      ...base,
      reportScheme: 'https',
      reportTarget: 'https://reports.example.com/tls',
    });
    expect(result.errors).toEqual([]);
    expect(result.tlsRptDns?.value).toContain('rua=https://reports.example.com/tls');
  });

  it('域名自动小写并裁剪空白', () => {
    const result = generate({ ...base, domain: '  Example.COM  ' });
    expect(result.errors).toEqual([]);
    expect(result.stsDns?.name).toBe('_mta-sts.example.com');
  });

  it('enforce 模式给出完整键序', () => {
    const result = generate({ ...base, mode: 'enforce', maxAge: MAX_AGE_LIMIT });
    expect(result.policyFile).toContain('mode: enforce');
    expect(result.policyFile.indexOf('version:')).toBe(0);
    expect(result.policyFile).toContain(`max_age: ${MAX_AGE_LIMIT}`);
  });
});

describe('generate 校验与告警', () => {
  it('非法域名报错且不产出记录', () => {
    const result = generate({ ...base, domain: 'not a domain' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.stsDns).toBeNull();
    expect(result.policyFile).toBe('');
  });

  it('enforce 缺少 MX 报错', () => {
    const result = generate({ ...base, mode: 'enforce', mxHosts: [] });
    expect(result.errors.some((e) => e.includes('MX'))).toBe(true);
  });

  it('非法 MX 主机名报错', () => {
    const result = generate({ ...base, mxHosts: ['bad host!'] });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('重复 MX 报错', () => {
    const result = generate({ ...base, mxHosts: ['mail.example.com', 'mail.example.com'] });
    expect(result.errors.some((e) => e.includes('重复'))).toBe(true);
  });

  it('越界 max_age 报错', () => {
    expect(generate({ ...base, maxAge: -1 }).errors.length).toBeGreaterThan(0);
    expect(generate({ ...base, maxAge: MAX_AGE_LIMIT + 1 }).errors.length).toBeGreaterThan(0);
  });

  it('第三方网关 MX 给出跨域告警', () => {
    const result = generate({ ...base, mxHosts: ['mx.thirdparty.net'] });
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('thirdparty'))).toBe(true);
  });

  it('testing 模式给出观察告警', () => {
    const result = generate(base);
    expect(result.warnings.some((w) => w.includes('testing'))).toBe(true);
  });

  it('enforce 且 max_age 过短告警', () => {
    const result = generate({ ...base, mode: 'enforce', maxAge: 60 });
    expect(result.warnings.some((w) => w.includes('max_age'))).toBe(true);
  });

  it('非法邮箱与非法 https URI 报错', () => {
    expect(generate({ ...base, reportTarget: 'bad-email' }).errors.length).toBeGreaterThan(0);
    expect(
      generate({ ...base, reportScheme: 'https', reportTarget: 'http://insecure.example.com' })
        .errors.length,
    ).toBeGreaterThan(0);
  });

  it('非法 policy id 报错', () => {
    expect(generate({ ...base, policyId: 'has space!' }).errors.length).toBeGreaterThan(0);
    expect(generate({ ...base, policyId: '' }).errors.length).toBeGreaterThan(0);
  });

  it('none 模式允许空 MX 并提示忽略', () => {
    const result = generate({ ...base, mode: 'none', mxHosts: [] });
    expect(result.errors).toEqual([]);
    expect(result.policyFile).toContain('mode: none');
  });
});
