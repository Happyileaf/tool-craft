import { describe, it, expect } from 'vitest';
import {
  generateStsArtifacts,
  validateMxHost,
  validatePolicyFile,
  validateRuaEndpoint,
  validateTxtRecord,
  type StsInput,
} from './mtaSts';

const baseInput: StsInput = {
  domain: 'example.com',
  mode: 'enforce',
  mxHostsText: 'mail.example.com',
  maxAge: 86400,
  policyId: '20261118000000',
  ruaText: 'mailto:sts-reports@example.com',
};

describe('generateStsArtifacts RFC 8461 策略文件', () => {
  it('标准 enforce 输入生成规范字段顺序与 CRLF 策略文件', () => {
    const out = generateStsArtifacts(baseInput);
    expect(out.errors).toEqual([]);
    expect(out.policyFile).toBe(
      ['version: STSv1', 'mode: enforce', 'mx: mail.example.com', 'max_age: 86400'].join('\r\n'),
    );
    expect(out.policyUrl).toBe('https://mta-sts.example.com/.well-known/mta-sts.txt');
  });

  it('多个 mx 主机逐行输出，大小写与尾点被规范化', () => {
    const out = generateStsArtifacts({
      ...baseInput,
      mxHostsText: 'MAIL.Example.com.\n*.mail.example.com',
    });
    expect(out.errors).toEqual([]);
    expect(out.policyFile).toContain('mx: mail.example.com');
    expect(out.policyFile).toContain('mx: *.mail.example.com');
  });

  it('testing 模式合法', () => {
    const out = generateStsArtifacts({ ...baseInput, mode: 'testing' });
    expect(out.errors).toEqual([]);
    expect(out.policyFile).toContain('mode: testing');
  });

  it('none 模式不输出 mx 行', () => {
    const out = generateStsArtifacts({ ...baseInput, mode: 'none', mxHostsText: '' });
    expect(out.errors).toEqual([]);
    expect(out.policyFile).not.toContain('mx:');
    expect(out.policyFile).toContain('mode: none');
  });
});

describe('generateStsArtifacts DNS TXT 记录', () => {
  it('MTA-STS 启用记录格式（RFC 8461 §3.1）', () => {
    const out = generateStsArtifacts(baseInput);
    expect(out.stsTxtRecord).toBe('_mta-sts.example.com  TXT  "v=STSv1; id=20261118000000"');
  });

  it('TLS-RPT 单端点记录（RFC 8460 §3.2）', () => {
    const out = generateStsArtifacts(baseInput);
    expect(out.tlsrptTxtRecord).toBe(
      '_smtp._tls.example.com  TXT  "v=TLSRPTv1; rua=mailto:sts-reports@example.com"',
    );
  });

  it('TLS-RPT 多端点按逗号拼接', () => {
    const out = generateStsArtifacts({
      ...baseInput,
      ruaText: 'mailto:a@example.com\nhttps://report.example.com/tls',
    });
    expect(out.errors).toEqual([]);
    expect(out.tlsrptTxtRecord).toContain(
      'rua=mailto:a@example.com,https://report.example.com/tls',
    );
  });
});

describe('输入校验错误分支', () => {
  it('非法域名报错', () => {
    const out = generateStsArtifacts({ ...baseInput, domain: 'not a domain' });
    expect(out.errors.some((e) => e.includes('邮件域'))).toBe(true);
  });

  it('enforce 模式缺少 mx 报错', () => {
    const out = generateStsArtifacts({ ...baseInput, mxHostsText: '  ' });
    expect(out.errors.some((e) => e.includes('mx'))).toBe(true);
  });

  it('max_age 超上限与负数报错', () => {
    expect(generateStsArtifacts({ ...baseInput, maxAge: 999999999 }).errors.some((e) => e.includes('上限'))).toBe(true);
    expect(generateStsArtifacts({ ...baseInput, maxAge: -1 }).errors.length).toBeGreaterThan(0);
  });

  it('id 非法字符报错', () => {
    expect(generateStsArtifacts({ ...baseInput, policyId: 'bad id!' }).errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rua 仅允许 mailto/https', () => {
    const out = generateStsArtifacts({ ...baseInput, ruaText: 'ftp://example.com/x' });
    expect(out.errors.some((e) => e.includes('mailto'))).toBe(true);
  });
});

describe('validateMxHost 通配符规则', () => {
  it('合法主机名与两级以上通配符', () => {
    expect(validateMxHost('mail.example.com')).toBeNull();
    expect(validateMxHost('*.mail.example.com')).toBeNull();
  });

  it('*.com 这类单级通配符被拒', () => {
    expect(validateMxHost('*.com')).not.toBeNull();
  });

  it('空主机名被拒', () => {
    expect(validateMxHost('   ')).not.toBeNull();
  });
});

describe('validateRuaEndpoint', () => {
  it('合法 mailto 与 https', () => {
    expect(validateRuaEndpoint('mailto:ops@example.com')).toBeNull();
    expect(validateRuaEndpoint('https://report.example.com/tls')).toBeNull();
  });

  it('非法邮箱与错误 scheme 被拒', () => {
    expect(validateRuaEndpoint('mailto:not-an-email')).not.toBeNull();
    expect(validateRuaEndpoint('http://insecure.example.com')).not.toBeNull();
  });
});

describe('validatePolicyFile 反向校验', () => {
  const validFile = [
    'version: STSv1',
    'mode: enforce',
    'mx: mail.example.com',
    'mx: *.example.com',
    'max_age: 86400',
  ].join('\r\n');

  it('RFC 示例策略文件零错误', () => {
    const result = validatePolicyFile(validFile);
    expect(result.errors).toEqual([]);
  });

  it('错误版本与非法 mode 被识别', () => {
    const result = validatePolicyFile(validFile.replace('STSv1', 'STSv2').replace('enforce', 'block'));
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
    expect(result.errors.some((e) => e.includes('mode'))).toBe(true);
  });

  it('max_age 超限与缺失报错', () => {
    const tooLarge = validatePolicyFile(validFile.replace('86400', '999999999'));
    expect(tooLarge.errors.some((e) => e.includes('max_age'))).toBe(true);
    const missing = validatePolicyFile('version: STSv1\nmode: none');
    expect(missing.errors.some((e) => e.includes('max_age'))).toBe(true);
  });

  it('字段乱序给 warning 而非 error', () => {
    const shuffled = ['mode: enforce', 'version: STSv1', 'mx: mail.example.com', 'max_age: 86400'].join('\n');
    const result = validatePolicyFile(shuffled);
    expect(result.warnings.some((w) => w.includes('顺序'))).toBe(true);
  });
});

describe('validateTxtRecord 反向校验', () => {
  it('合法 STS TXT（含区域文件前缀与引号）', () => {
    const result = validateTxtRecord('_mta-sts.example.com TXT "v=STSv1; id=abc123"', 'sts');
    expect(result.errors).toEqual([]);
    expect(result.parsed.id).toBe('abc123');
  });

  it('合法 TLS-RPT TXT 多端点', () => {
    const result = validateTxtRecord(
      'v=TLSRPTv1; rua=mailto:a@example.com,https://r.example.com/x',
      'tlsrpt',
    );
    expect(result.errors).toEqual([]);
  });

  it('版本错误与缺字段报错', () => {
    expect(validateTxtRecord('v=STSv2; id=abc123', 'sts').errors.length).toBeGreaterThan(0);
    expect(validateTxtRecord('v=TLSRPTv1', 'tlsrpt').errors.some((e) => e.includes('rua'))).toBe(true);
  });
});
