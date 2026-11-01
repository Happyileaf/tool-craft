import { describe, expect, it } from 'vitest';
import {
  FIELD_ORDER,
  generateSecurityTxt,
  parseSecurityTxt,
  type SecurityTxtFields,
} from './securityTxt';

/** 固定当前时间，过期 / 临期分支可复现 */
const NOW = new Date('2026-11-01T00:00:00.000Z');

const FULL_FIELDS: SecurityTxtFields = {
  contacts: ['mailto:security@example.com', 'https://example.com/security'],
  expires: '2027-12-31T23:59:59.000Z',
  encryption: ['https://example.com/pgp-key.txt'],
  acknowledgments: ['https://example.com/hall-of-fame'],
  preferredLanguages: 'en, zh-CN',
  canonical: ['https://example.com/.well-known/security.txt'],
  policy: ['https://example.com/reporting-policy'],
  csaf: ['https://example.com/.well-known/csaf/provider-metadata.json'],
};

describe('generateSecurityTxt - 字段顺序与行格式', () => {
  it('字段严格按 RFC 9116 规范顺序输出，多 Contact 各占一行', () => {
    const { output, error, warnings } = generateSecurityTxt(FULL_FIELDS, NOW);
    expect(error).toBeNull();
    expect(warnings).toEqual([]);

    // 去掉行尾 \r 后逐行断言
    const lines = output.split('\r\n').filter((line) => line !== '');
    const directiveLines = lines.filter((line) => !line.startsWith('#'));
    const fieldNames = directiveLines.map((line) => line.split(':')[0]);

    const expectedOrder = [
      'Contact',
      'Contact',
      'Expires',
      'Encryption',
      'Acknowledgments',
      'Preferred-Languages',
      'Canonical',
      'Policy',
      'CSAF',
    ];
    expect(fieldNames).toEqual(expectedOrder);
    // FIELD_ORDER 常量本身符合规范顺序
    expect(FIELD_ORDER).toEqual([
      'Contact',
      'Expires',
      'Encryption',
      'Acknowledgments',
      'Preferred-Languages',
      'Canonical',
      'Policy',
      'CSAF',
    ]);
  });

  it('全部行以 CRLF 结尾且文件以 CRLF 结束', () => {
    const { output } = generateSecurityTxt(FULL_FIELDS, NOW);
    expect(output.endsWith('\r\n')).toBe(true);
    // 不存在裸 LF（CRLF 之外不应出现单独的 \n）
    expect(output.replace(/\r\n/g, '')).not.toContain('\n');
    // 每条指令恰好出现一次 CRLF 结尾（行数 = CRLF 数）
    expect(output.match(/\r\n/g)?.length).toBe(output.split('\r\n').length - 1);
  });

  it('空可选字段跳过，Contact 值原样输出', () => {
    const { output } = generateSecurityTxt(
      { contacts: ['mailto:sec@example.com'], expires: '2027-01-01T00:00:00.000Z' },
      NOW,
    );
    const lines = output.split('\r\n').filter((line) => line !== '');
    expect(lines).toContain('Contact: mailto:sec@example.com');
    expect(lines).toContain('Expires: 2027-01-01T00:00:00.000Z');
    expect(lines.some((line) => line.startsWith('Encryption:'))).toBe(false);
    expect(lines.some((line) => line.startsWith('CSAF:'))).toBe(false);
    // 首尾各有一条注释
    expect(lines[0]).toMatch(/^# /);
    expect(lines[lines.length - 1]).toMatch(/^# /);
  });
});

describe('generateSecurityTxt - 校验', () => {
  it('缺 Contact 时返回 error 且 output 为空', () => {
    const result = generateSecurityTxt({ contacts: [], expires: '2027-12-31T23:59:59.000Z' }, NOW);
    expect(result.error).toContain('Contact');
    expect(result.output).toBe('');
  });

  it('缺 Expires 时返回 error 且 output 为空', () => {
    const result = generateSecurityTxt({ contacts: ['mailto:a@b.com'], expires: '   ' }, NOW);
    expect(result.error).toContain('Expires');
    expect(result.output).toBe('');
  });

  it('Expires 无法解析时返回 error', () => {
    const result = generateSecurityTxt({ contacts: ['mailto:a@b.com'], expires: 'not-a-date' }, NOW);
    expect(result.error).toContain('Expires');
    expect(result.output).toBe('');
  });

  it('Contact 不含冒号时仅 warning，不阻止生成', () => {
    const result = generateSecurityTxt({ contacts: ['security@example.com'], expires: '2027-01-01T00:00:00Z' }, NOW);
    expect(result.error).toBeNull();
    expect(result.warnings.some((w) => w.includes('URI'))).toBe(true);
    expect(result.output).toContain('Contact: security@example.com');
  });

  it('Expires 已过期 / 30 天内临期 / 未来有效 三分支', () => {
    const expired = generateSecurityTxt(
      { contacts: ['mailto:a@b.com'], expires: '2026-10-01T00:00:00.000Z' },
      NOW,
    );
    expect(expired.warnings.some((w) => w.includes('已过期'))).toBe(true);

    const expiringSoon = generateSecurityTxt(
      { contacts: ['mailto:a@b.com'], expires: '2026-11-20T00:00:00.000Z' },
      NOW,
    );
    expect(expiringSoon.warnings.some((w) => w.includes('30 天内到期'))).toBe(true);

    const valid = generateSecurityTxt(
      { contacts: ['mailto:a@b.com'], expires: '2027-12-31T23:59:59.000Z' },
      NOW,
    );
    expect(valid.warnings).toEqual([]);
  });
});

describe('parseSecurityTxt - 正常解析', () => {
  const text = [
    '# 注释行应被忽略',
    'Contact: mailto:security@example.com',
    'Contact: https://example.com/security',
    'Expires: 2027-12-31T23:59:59.000Z',
    'Encryption: https://example.com/pgp-key.txt',
    'Acknowledgments: https://example.com/hall-of-fame',
    'Preferred-Languages: en, zh-CN',
    'Canonical: https://example.com/.well-known/security.txt',
    'Policy: https://example.com/reporting-policy',
    'CSAF: https://example.com/.well-known/csaf/provider-metadata.json',
  ].join('\r\n');

  it.each([
    ['CRLF', text],
    ['LF', text.replace(/\r\n/g, '\n')],
  ])('%s 版本解析出全部字段且无错误', (_label, input) => {
    const result = parseSecurityTxt(input, NOW);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.contacts).toEqual([
      'mailto:security@example.com',
      'https://example.com/security',
    ]);
    expect(result.expires).toBe('2027-12-31T23:59:59.000Z');
    expect(result.fields.map((f) => f.name)).toEqual([
      'Contact',
      'Contact',
      'Expires',
      'Encryption',
      'Acknowledgments',
      'Preferred-Languages',
      'Canonical',
      'Policy',
      'CSAF',
    ]);
    expect(result.hasSignature).toBe(false);
  });

  it('字段值 trim，空行与注释跳过', () => {
    const result = parseSecurityTxt(
      '\n# 仅注释\nContact:   mailto:a@b.com  \n\nExpires: 2027-01-01T00:00:00Z\n',
      NOW,
    );
    expect(result.contacts).toEqual(['mailto:a@b.com']);
    expect(result.fields).toHaveLength(2);
  });
});

describe('parseSecurityTxt - 错误与警告', () => {
  it('缺 Contact 与缺 Expires 都进 errors', () => {
    const result = parseSecurityTxt('Policy: https://example.com/policy', NOW);
    expect(result.errors.some((e) => e.includes('Contact'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Expires'))).toBe(true);
  });

  it('Expires 无法解析进 errors', () => {
    const result = parseSecurityTxt(
      'Contact: mailto:a@b.com\nExpires: tomorrow',
      NOW,
    );
    expect(result.errors.some((e) => e.includes('日期时间'))).toBe(true);
  });

  it('未知字段 X-Header 作为 warning 提示且不致命', () => {
    const result = parseSecurityTxt(
      'Contact: mailto:a@b.com\nExpires: 2027-01-01T00:00:00Z\nX-Header: hello',
      NOW,
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('未知字段 X-Header'))).toBe(true);
  });

  it('Expires 出现多条时 warning 并取第一条', () => {
    const result = parseSecurityTxt(
      'Contact: mailto:a@b.com\nExpires: 2027-01-01T00:00:00Z\nExpires: 2028-01-01T00:00:00Z',
      NOW,
    );
    expect(result.expires).toBe('2027-01-01T00:00:00Z');
    expect(result.warnings.some((w) => w.includes('Expires 出现 2 次'))).toBe(true);
  });

  it('注入固定 now 验证过期 / 临期 / 未来有效', () => {
    const mk = (expires: string) =>
      parseSecurityTxt(`Contact: mailto:a@b.com\nExpires: ${expires}`, NOW);
    expect(mk('2026-10-01T00:00:00.000Z').warnings.some((w) => w.includes('已过期'))).toBe(true);
    expect(mk('2026-11-25T00:00:00.000Z').warnings.some((w) => w.includes('30 天内到期'))).toBe(true);
    expect(mk('2027-12-31T23:59:59.000Z').warnings).toEqual([]);
  });

  it('不含冒号的行报格式错误', () => {
    const result = parseSecurityTxt('Contact: mailto:a@b.com\nExpires: 2027-01-01T00:00:00Z\nthis-is-broken', NOW);
    expect(result.errors.some((e) => e.includes('格式错误'))).toBe(true);
  });
});

describe('parseSecurityTxt - PGP 签名', () => {
  it('含 PGP clearsign 签名块时 hasSignature=true，签名字段不混入解析结果', () => {
    const signed = [
      '-----BEGIN PGP SIGNED MESSAGE-----',
      'Hash: SHA512',
      '',
      'Contact: mailto:security@example.com',
      'Expires: 2027-12-31T23:59:59.000Z',
      '-----BEGIN PGP SIGNATURE-----',
      '',
      'iQIzBAEBCgAdFiEExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=',
      'abcdef=',
      '-----END PGP SIGNATURE-----',
    ].join('\r\n');
    const result = parseSecurityTxt(signed, NOW);
    expect(result.hasSignature).toBe(true);
    expect(result.contacts).toEqual(['mailto:security@example.com']);
    expect(result.expires).toBe('2027-12-31T23:59:59.000Z');
    expect(result.fields.some((f) => f.name === 'Hash')).toBe(false);
    expect(result.errors).toEqual([]);
  });
});

describe('generate → parse 往返', () => {
  it('生成结果再解析，字段一致且无 errors', () => {
    const { output } = generateSecurityTxt(FULL_FIELDS, NOW);
    const result = parseSecurityTxt(output, NOW);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.contacts).toEqual(FULL_FIELDS.contacts);
    expect(result.expires).toBe(FULL_FIELDS.expires);
    expect(result.fields.map((f) => `${f.name}: ${f.value}`)).toContain(
      'Preferred-Languages: en, zh-CN',
    );
    expect(result.fields.map((f) => f.name)).toEqual([
      'Contact',
      'Contact',
      'Expires',
      'Encryption',
      'Acknowledgments',
      'Preferred-Languages',
      'Canonical',
      'Policy',
      'CSAF',
    ]);
  });
});
