import { describe, it, expect } from 'vitest';
import {
  createDefaultInput,
  generateCaaRecords,
  splitQuotedChunks,
  validateCaaRecords,
  type CaaGenerateInput,
} from './caa';

describe('generateCaaRecords 生成', () => {
  it('最小 issue 记录输出标准区域文件行', () => {
    const input: CaaGenerateInput = {
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'issue',
          caDomain: 'letsencrypt.org',
          accountUri: '',
          validationMethods: '',
          iodefUrl: '',
          disable: false,
        },
      ],
    };
    const result = generateCaaRecords(input);
    expect(result.errors).toEqual([]);
    expect(result.zoneText).toBe('example.com. CAA 0 issue "letsencrypt.org"');
  });

  it('带 TTL 与 critical 标志输出 128', () => {
    const input: CaaGenerateInput = {
      domain: 'example.com',
      ttl: 3600,
      entries: [
        {
          critical: true,
          tag: 'issuewild',
          caDomain: 'ca.example.net',
          accountUri: '',
          validationMethods: '',
          iodefUrl: '',
          disable: false,
        },
      ],
    };
    const result = generateCaaRecords(input);
    expect(result.errors).toEqual([]);
    expect(result.zoneText).toBe('example.com. 3600 CAA 128 issuewild "ca.example.net"');
    expect(result.warnings.some((each) => each.includes('critical'))).toBe(true);
  });

  it('RFC 8658 accounturi 与 validationmethods 参数按分号拼装', () => {
    const input: CaaGenerateInput = {
      domain: 'example.org',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'issue',
          caDomain: 'ca.example.org',
          accountUri: 'https://acme.example.org/acct/1',
          validationMethods: 'dns-01;http-01',
          iodefUrl: '',
          disable: false,
        },
      ],
    };
    const result = generateCaaRecords(input);
    expect(result.errors).toEqual([]);
    expect(result.records[0]).toBe(
      '0 issue "ca.example.org; accounturi=https://acme.example.org/acct/1; validationmethods=dns-01;http-01"',
    );
  });

  it('禁用记录输出空 value（0 issue ";"）', () => {
    const input: CaaGenerateInput = {
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'issue',
          caDomain: '',
          accountUri: '',
          validationMethods: '',
          iodefUrl: '',
          disable: true,
        },
      ],
    };
    const result = generateCaaRecords(input);
    expect(result.errors).toEqual([]);
    expect(result.records[0]).toBe('0 issue ";"');
  });

  it('iodef 支持 mailto 与 https 两种 URI', () => {
    const mailto = generateCaaRecords({
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'iodef',
          caDomain: '',
          accountUri: '',
          validationMethods: '',
          iodefUrl: 'mailto:security@example.com',
          disable: false,
        },
      ],
    });
    expect(mailto.errors).toEqual([]);
    expect(mailto.records[0]).toBe('0 iodef "mailto:security@example.com"');

    const https = generateCaaRecords({
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'iodef',
          caDomain: '',
          accountUri: '',
          validationMethods: '',
          iodefUrl: 'https://iodef.example.com/report',
          disable: false,
        },
      ],
    });
    expect(https.errors).toEqual([]);
    expect(https.records[0]).toBe('0 iodef "https://iodef.example.com/report"');
  });

  it('多记录同时生成 issue/issuewild/iodef', () => {
    const result = generateCaaRecords(createDefaultInput());
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toBe('0 issue "letsencrypt.org"');
    expect(result.records[1]).toBe('0 iodef "mailto:security@example.com"');
    expect(result.zoneText.split('\n')).toHaveLength(2);
  });

  it('非法域名、TTL 越界与空条目收集错误且不产出文本', () => {
    const bad = generateCaaRecords({
      domain: 'not a domain',
      ttl: 0,
      entries: [],
    });
    expect(bad.zoneText).toBe('');
    expect(bad.records).toEqual([]);
    expect(bad.errors.some((each) => each.includes('合法域名'))).toBe(true);
    expect(bad.errors.some((each) => each.includes('TTL'))).toBe(true);
    expect(bad.errors.some((each) => each.includes('至少需要一条'))).toBe(true);
  });

  it('非法 accounturi、validationmethods 与 iodef 地址报错', () => {
    const badParams = generateCaaRecords({
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'issue',
          caDomain: 'ca.example.net',
          accountUri: 'ftp://x',
          validationMethods: 'ssh-01',
          iodefUrl: '',
          disable: false,
        },
      ],
    });
    expect(badParams.errors.some((each) => each.includes('accounturi'))).toBe(true);
    expect(badParams.errors.some((each) => each.includes('validationmethods'))).toBe(true);

    const badIodef = generateCaaRecords({
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'iodef',
          caDomain: '',
          accountUri: '',
          validationMethods: '',
          iodefUrl: 'not-a-uri',
          disable: false,
        },
      ],
    });
    expect(badIodef.errors.some((each) => each.includes('iodef'))).toBe(true);
  });

  it('仅有 issuewild 时给出补充 issue 的警告', () => {
    const result = generateCaaRecords({
      domain: 'example.com',
      ttl: null,
      entries: [
        {
          critical: false,
          tag: 'issuewild',
          caDomain: 'ca.example.net',
          accountUri: '',
          validationMethods: '',
          iodefUrl: '',
          disable: false,
        },
      ],
    });
    expect(result.warnings.some((each) => each.includes('issuewild'))).toBe(true);
  });
});

describe('splitQuotedChunks 分段', () => {
  it('短字符串单段带引号', () => {
    expect(splitQuotedChunks('letsencrypt.org')).toEqual(['"letsencrypt.org"']);
  });

  it('超长 value 按 255 字符拆分', () => {
    const longValue = 'a'.repeat(300);
    const chunks = splitQuotedChunks(longValue);
    expect(chunks.length).toBe(2);
    expect(chunks[0]!.length).toBe(257);
  });

  it('空字符串产出一对空引号', () => {
    expect(splitQuotedChunks('')).toEqual(['""']);
  });
});

describe('validateCaaRecords 校验', () => {
  it('解析标准区域文件行并还原 flags/tag/value', () => {
    const result = validateCaaRecords('example.com. 3600 CAA 0 issue "letsencrypt.org"');
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.flags).toBe(0);
    expect(result.records[0]!.tag).toBe('issue');
    expect(result.records[0]!.value).toBe('letsencrypt.org');
  });

  it('解析裸 flags tag value 形式与 RFC 8658 参数', () => {
    const result = validateCaaRecords(
      '128 issue "ca.example.net; accounturi=https://acme.example/a; validationmethods=dns-01"',
    );
    expect(result.errors).toEqual([]);
    expect(result.records[0]!.flags).toBe(128);
    expect(result.records[0]!.parameters.get('accounturi')).toBe('https://acme.example/a');
    expect(result.records[0]!.parameters.get('validationmethods')).toBe('dns-01');
  });

  it('多行记录逐行解析并跳过注释与空行', () => {
    const raw = [
      '; comment line',
      'example.com. CAA 0 issue "ca.example.net"',
      '',
      '# hash comment',
      'example.com. CAA 0 iodef "mailto:a@b.com"',
    ].join('\n');
    const result = validateCaaRecords(raw);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[1]!.line).toBe(5);
  });

  it('非法 flags、未知标签与结构错误按行号报错', () => {
    const raw = ['64 issue "ca.example.net"', '0 bounce "x"', 'garbage line without structure'].join('\n');
    const result = validateCaaRecords(raw);
    expect(result.errors.some((each) => each.includes('flags=64'))).toBe(true);
    expect(result.errors.some((each) => each.includes('标签'))).toBe(true);
    expect(result.errors.some((each) => each.includes('结构'))).toBe(true);
  });

  it('非法 iodef URI、accounturi 与未知 validationmethods 报错', () => {
    const result = validateCaaRecords(
      [
        '0 iodef "ftp://x"',
        '0 issue "ca.example.net; accounturi=mailto:x@y.com"',
        '0 issue "ca.example.net; validationmethods=ssh-01"',
      ].join('\n'),
    );
    expect(result.errors.some((each) => each.includes('iodef'))).toBe(true);
    expect(result.errors.some((each) => each.includes('accounturi'))).toBe(true);
    expect(result.errors.some((each) => each.includes('validationmethods'))).toBe(true);
  });

  it('未知参数仅警告不报错', () => {
    const result = validateCaaRecords('0 issue "ca.example.net; customparam=1"');
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((each) => each.includes('未知参数 customparam'))).toBe(true);
  });

  it('空输入与仅注释输入报错', () => {
    expect(validateCaaRecords('   ').errors.some((each) => each.includes('未解析到'))).toBe(true);
    expect(validateCaaRecords('; only comment').errors.some((each) => each.includes('未解析到'))).toBe(true);
  });

  it('生成 → 校验往返一致', () => {
    const generated = generateCaaRecords({
      domain: 'example.com',
      ttl: 300,
      entries: [
        {
          critical: true,
          tag: 'issue',
          caDomain: 'ca.example.net',
          accountUri: 'https://acme.example/a',
          validationMethods: 'dns-01',
          iodefUrl: '',
          disable: false,
        },
        {
          critical: false,
          tag: 'iodef',
          caDomain: '',
          accountUri: '',
          validationMethods: '',
          iodefUrl: 'mailto:sec@example.com',
          disable: false,
        },
      ],
    });
    const validation = validateCaaRecords(generated.zoneText);
    expect(validation.errors).toEqual([]);
    expect(validation.records).toHaveLength(2);
    expect(validation.records[0]!.tag).toBe('issue');
    expect(validation.records[1]!.tag).toBe('iodef');
  });
});
