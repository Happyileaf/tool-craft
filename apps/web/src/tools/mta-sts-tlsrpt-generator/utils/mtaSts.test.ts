import { describe, expect, it } from 'vitest';
import {
  assertDomain,
  buildPolicyId,
  generateMtaSts,
  generateTlsRpt,
  normalizeMxPattern,
  parseMtaStsPolicy,
  parseMtaStsRecord,
  parseTlsRptRecord,
} from './mtaSts';

const fixedNow = new Date('2026-11-18T10:04:03.000Z');

describe('assertDomain', () => {
  it('lowercases, trims and strips the trailing dot', () => {
    expect(assertDomain('  Example.COM. ')).toBe('example.com');
  });

  it('rejects empty and malformed domains', () => {
    expect(() => assertDomain('   ')).toThrow('不能为空');
    expect(() => assertDomain('not a domain')).toThrow('不是合法的域名');
    expect(() => assertDomain('a-.com')).toThrow('不是合法的域名');
  });
});

describe('normalizeMxPattern', () => {
  it('accepts plain hosts and wildcard suffixes', () => {
    expect(normalizeMxPattern('mx1.example.com.')).toBe('mx1.example.com');
    expect(normalizeMxPattern('*.mail.example.org')).toBe('*.mail.example.org');
  });

  it('rejects blank or malformed patterns', () => {
    expect(() => normalizeMxPattern('  ')).toThrow('不能为空');
    expect(() => normalizeMxPattern('mx_ bad')).toThrow('不是合法的域名');
  });
});

describe('generateMtaSts', () => {
  it('builds the DNS record and policy file for an enforce policy', () => {
    const bundle = generateMtaSts(
      'example.com',
      { mode: 'enforce', maxAge: 86400, allowedMx: ['mx1.example.com', '*.example.net'] },
      fixedNow,
    );
    expect(bundle.policyId).toBe('20261118100403');
    expect(bundle.dnsRecord).toEqual({
      host: '_mta-sts.example.com',
      type: 'TXT',
      value: 'v=STSv1; id=20261118100403',
    });
    expect(bundle.policyHost).toBe('mta-sts.example.com');
    expect(bundle.policyUrl).toBe('https://mta-sts.example.com/.well-known/mta-sts.txt');
    expect(bundle.policyText).toBe(
      ['version: STSv1', 'mode: enforce', 'max_age: 86400', 'mx: mx1.example.com', 'mx: *.example.net', ''].join('\n'),
    );
  });

  it('deduplicates repeated MX patterns while preserving first-seen order', () => {
    const bundle = generateMtaSts(
      'example.com',
      { mode: 'testing', maxAge: 600, allowedMx: ['mx1.example.com', 'mx1.example.com', 'mx2.example.com'] },
      fixedNow,
    );
    expect(bundle.policyText.match(/^mx: .*$/gm)).toEqual(['mx: mx1.example.com', 'mx: mx2.example.com']);
  });

  it('rejects enforce/testing without MX or with zero max_age', () => {
    expect(() => generateMtaSts('example.com', { mode: 'enforce', maxAge: 10, allowedMx: [] })).toThrow(
      '至少需要一条 MX',
    );
    expect(() => generateMtaSts('example.com', { mode: 'testing', maxAge: 0, allowedMx: ['mx.a.com'] })).toThrow(
      'max_age 必须大于 0',
    );
  });

  it('allows none mode without MX entries', () => {
    const bundle = generateMtaSts('example.com', { mode: 'none', maxAge: 0, allowedMx: [] }, fixedNow);
    expect(bundle.policyText).toBe('version: STSv1\nmode: none\nmax_age: 0\n');
  });

  it('rejects negative or non-integer max_age and unknown modes', () => {
    expect(() =>
      generateMtaSts('example.com', { mode: 'enforce', maxAge: -1, allowedMx: ['mx.a.com'] }),
    ).toThrow('非负整数');
    expect(() =>
      generateMtaSts('example.com', { mode: 'enforce', maxAge: 1.5, allowedMx: ['mx.a.com'] }),
    ).toThrow('非负整数');
    expect(() =>
      // @ts-expect-error 运行时非法模式
      generateMtaSts('example.com', { mode: 'block', maxAge: 10, allowedMx: ['mx.a.com'] }),
    ).toThrow('未知的 MTA-STS 模式');
  });
});

describe('generateTlsRpt', () => {
  it('builds a mailto rua record', () => {
    const bundle = generateTlsRpt('example.com', {
      endpoints: [{ kind: 'mailto', address: 'tls-reports@example.com' }],
    });
    expect(bundle.dnsRecord).toEqual({
      host: '_smtp._tls.example.com',
      type: 'TXT',
      value: 'v=TLSRPTv1; rua=mailto:tls-reports@example.com',
    });
  });

  it('supports https endpoints and combined rua lists', () => {
    const bundle = generateTlsRpt('example.com', {
      endpoints: [
        { kind: 'mailto', address: 'a@example.com' },
        { kind: 'https', url: 'https://report.example.com/tls' },
      ],
    });
    expect(bundle.recordValue).toBe('v=TLSRPTv1; rua=mailto:a@example.com,https://report.example.com/tls');
  });

  it('rejects non-https URLs, bad emails and more than two endpoints', () => {
    expect(() =>
      generateTlsRpt('example.com', { endpoints: [{ kind: 'https', url: 'http://insecure.example.com' }] }),
    ).toThrow('https://');
    expect(() =>
      generateTlsRpt('example.com', { endpoints: [{ kind: 'mailto', address: 'not-an-email' }] }),
    ).toThrow('不是合法的邮箱');
    expect(() =>
      generateTlsRpt('example.com', {
        endpoints: [
          { kind: 'mailto', address: 'a@example.com' },
          { kind: 'mailto', address: 'b@example.com' },
          { kind: 'mailto', address: 'c@example.com' },
        ],
      }),
    ).toThrow('最多声明 2 个');
  });
});

describe('record parsers round-trip', () => {
  it('parses a generated MTA-STS TXT record', () => {
    const bundle = generateMtaSts('example.com', { mode: 'enforce', maxAge: 100, allowedMx: ['mx.a.com'] }, fixedNow);
    expect(parseMtaStsRecord(bundle.dnsRecord.value)).toEqual({ version: 'STSv1', id: '20261118100403' });
  });

  it('parses a generated TLS-RPT TXT record', () => {
    const bundle = generateTlsRpt('example.com', {
      endpoints: [
        { kind: 'mailto', address: 'a@example.com' },
        { kind: 'https', url: 'https://r.example.com/' },
      ],
    });
    expect(parseTlsRptRecord(bundle.recordValue)).toEqual({
      version: 'TLSRPTv1',
      rua: ['mailto:a@example.com', 'https://r.example.com/'],
    });
  });

  it('rejects wrong versions and missing ids', () => {
    expect(() => parseMtaStsRecord('v=STSv2; id=1')).toThrow('STSv1');
    expect(() => parseMtaStsRecord('v=STSv1')).toThrow('缺少 id');
    expect(() => parseTlsRptRecord('v=TLSRPTv2')).toThrow('TLSRPTv1');
    expect(() => parseMtaStsRecord('garbage')).toThrow('key=value');
  });
});

describe('parseMtaStsPolicy', () => {
  it('parses a generated policy file including multiple mx lines', () => {
    const bundle = generateMtaSts(
      'example.com',
      { mode: 'enforce', maxAge: 86400, allowedMx: ['mx1.a.com', '*.b.com'] },
      fixedNow,
    );
    expect(parseMtaStsPolicy(bundle.policyText)).toEqual({
      version: 'STSv1',
      mode: 'enforce',
      maxAge: 86400,
      mx: ['mx1.a.com', '*.b.com'],
    });
  });

  it('ignores blank lines and comments and rejects malformed content', () => {
    const parsed = parseMtaStsPolicy('# comment\n\nversion: STSv1\nmode: none\nmax_age: 0\n');
    expect(parsed.mx).toEqual([]);
    expect(() => parseMtaStsPolicy('version: STSv1\nmode: weird\nmax_age: 10\n')).toThrow('mode 必须');
    expect(() => parseMtaStsPolicy('version: STSv1\nmode: enforce\nmax_age: abc\n')).toThrow('max_age');
    expect(() => parseMtaStsPolicy('no-colon-line\n')).toThrow('key: value');
  });
});

describe('buildPolicyId', () => {
  it('renders a UTC yyyyMMddHHmmss token', () => {
    expect(buildPolicyId(fixedNow)).toBe('20261118100403');
    expect(buildPolicyId(new Date('2026-01-02T03:04:05.000Z'))).toBe('20260102030405');
  });
});
