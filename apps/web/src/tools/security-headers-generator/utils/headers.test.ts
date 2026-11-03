import { describe, expect, it } from 'vitest';
import {
  HSTS_PRELOAD_MIN_AGE,
  buildCspValue,
  buildHstsValue,
  collectHeaders,
  escapeConfigQuoted,
  formatHeaders,
  formatPermissionRule,
  validateConfig,
  type CspDirective,
  type SecurityHeadersConfig,
} from './headers';

/** 空白配置 */
function createEmptyConfig(): SecurityHeadersConfig {
  return {
    cspEnabled: false,
    cspReportOnly: false,
    cspDirectives: [],
    hsts: { enabled: false, maxAge: '31536000', includeSubDomains: false, preload: false },
    frameOptions: '',
    contentTypeNosniff: false,
    referrerPolicy: '',
    permissionsPolicy: [],
    coop: '',
    coep: '',
    corp: '',
  };
}

/** 一份常用安全配置 */
function createSampleConfig(): SecurityHeadersConfig {
  return {
    ...createEmptyConfig(),
    cspEnabled: true,
    cspDirectives: [
      { name: 'default-src', value: "'self'" },
      { name: 'img-src', value: "'self' https: data:" },
      { name: 'style-src', value: "'self' 'unsafe-inline'" },
      { name: 'upgrade-insecure-requests', value: '' },
    ],
    hsts: { enabled: true, maxAge: '31536000', includeSubDomains: true, preload: false },
    frameOptions: 'SAMEORIGIN',
    contentTypeNosniff: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      { feature: 'camera', allowlist: '' },
      { feature: 'geolocation', allowlist: 'self https://maps.example.com' },
    ],
    coop: 'same-origin',
    coep: '',
    corp: 'same-origin',
  };
}

describe('buildCspValue', () => {
  it('拼接指令并以分号结尾', () => {
    const result = buildCspValue([
      { name: 'default-src', value: "'self'" },
      { name: 'img-src', value: "'self' https:" },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.value).toBe("default-src 'self'; img-src 'self' https:;");
  });

  it('无值指令单独输出指令名', () => {
    const result = buildCspValue([{ name: 'upgrade-insecure-requests', value: '' }]);
    expect(result.value).toBe('upgrade-insecure-requests;');
  });

  it('跳过整行留空，忽略大小写归一指令名', () => {
    const result = buildCspValue([{ name: '', value: '' }, { name: 'Default-SRC', value: "'self'" }]);
    expect(result.errors).toEqual([]);
    expect(result.value).toBe("default-src 'self';");
  });

  it('重复指令报错且只保留首个', () => {
    const result = buildCspValue([
      { name: 'default-src', value: "'self'" },
      { name: 'default-src', value: "'none'" },
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('重复');
    expect(result.value).toBe("default-src 'self';");
  });

  it('非法指令名、缺值、非法字符均报错', () => {
    const result = buildCspValue([
      { name: 'bad_src', value: "'self'" },
      { name: 'script-src', value: '' },
      { name: 'img-src', value: "'self'; evil" },
    ]);
    expect(result.errors).toHaveLength(3);
  });
});

describe('buildHstsValue', () => {
  it('未启用返回 null', () => {
    expect(buildHstsValue({ enabled: false, maxAge: '1', includeSubDomains: true, preload: true })).toBeNull();
  });

  it('按开关拼接 includeSubDomains 与 preload', () => {
    expect(buildHstsValue({ enabled: true, maxAge: '63072000', includeSubDomains: true, preload: true })).toBe(
      'max-age=63072000; includeSubDomains; preload',
    );
    expect(buildHstsValue({ enabled: true, maxAge: '300', includeSubDomains: false, preload: false })).toBe(
      'max-age=300',
    );
  });
});

describe('formatPermissionRule', () => {
  it('空特性跳过；self/* 不引用，源加双引号', () => {
    expect(formatPermissionRule({ feature: '  ', allowlist: '' }).text).toBeNull();
    expect(formatPermissionRule({ feature: 'camera', allowlist: '' }).text).toBe('camera=()');
    expect(
      formatPermissionRule({ feature: 'geolocation', allowlist: 'self https://a.com *' }).text,
    ).toBe('geolocation=(self "https://a.com" *)');
  });

  it('非法特性名与非法 allowlist 标记报错', () => {
    expect(formatPermissionRule({ feature: 'bad name', allowlist: '' }).errors[0]).toContain('只能包含');
    const httpOrigin = formatPermissionRule({ feature: 'camera', allowlist: 'self http://nope' });
    expect(httpOrigin.text).toBe('camera=(self "http://nope")');
    expect(httpOrigin.errors).toEqual([]);
    const invalid = formatPermissionRule({ feature: 'camera', allowlist: 'example.com' });
    expect(invalid.errors[0]).toContain('非法标记');
  });
});

describe('collectHeaders', () => {
  it('按推荐顺序收集启用的响应头', () => {
    const { headers, errors } = collectHeaders(createSampleConfig());
    expect(errors).toEqual([]);
    expect(headers.map((h) => h.name)).toEqual([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ]);
  });

  it('Report-Only 切换头名并标记 meta 不支持', () => {
    const config = createSampleConfig();
    config.cspReportOnly = true;
    const { headers } = collectHeaders(config);
    const csp = headers[0];
    expect(csp.name).toBe('Content-Security-Policy-Report-Only');
    expect(csp.metaSupported).toBe(false);
  });

  it('未启用的头不出现', () => {
    const { headers } = collectHeaders(createEmptyConfig());
    expect(headers).toEqual([]);
  });
});

describe('validateConfig', () => {
  it('样例配置仅产生预期警告（style unsafe-inline / 空 allowlist 不报错）', () => {
    const issues = validateConfig(createSampleConfig());
    const errors = issues.filter((i) => i.level === 'error');
    expect(errors).toEqual([]);
    expect(issues.some((i) => i.message.includes('unsafe-inline'))).toBe(true);
  });

  it('缺少 default-src 给警告', () => {
    const config = createEmptyConfig();
    config.cspEnabled = true;
    config.cspDirectives = [{ name: 'img-src', value: 'https:' }];
    expect(validateConfig(config).some((i) => i.message.includes('default-src'))).toBe(true);
  });

  it('未知指令名与未知特性给拼写警告', () => {
    const config = createEmptyConfig();
    config.cspEnabled = true;
    config.cspDirectives = [
      { name: 'default-src', value: "'self'" },
      { name: 'scirpt-src', value: "'self'" },
    ];
    config.permissionsPolicy = [{ feature: 'made-up-feature', allowlist: 'self' }];
    const issues = validateConfig(config);
    expect(issues.some((i) => i.message.includes('scirpt-src'))).toBe(true);
    expect(issues.some((i) => i.message.includes('made-up-feature'))).toBe(true);
  });

  it('script-src unsafe-eval 与仅报告模式给警告', () => {
    const config = createEmptyConfig();
    config.cspEnabled = true;
    config.cspReportOnly = true;
    config.cspDirectives = [
      { name: 'default-src', value: "'self'" },
      { name: 'script-src', value: "'self' 'unsafe-eval'" },
    ];
    const messages = validateConfig(config).map((i) => i.message);
    expect(messages.some((m) => m.includes('unsafe-eval'))).toBe(true);
    expect(messages.some((m) => m.includes('仅报告模式'))).toBe(true);
  });

  it('HSTS max-age 非整数、preload 不足 1 年或缺 includeSubDomains 报错', () => {
    const badAge = createEmptyConfig();
    badAge.hsts = { enabled: true, maxAge: 'abc', includeSubDomains: true, preload: true };
    expect(validateConfig(badAge).some((i) => i.message.includes('非负整数'))).toBe(true);

    const tooShort = createEmptyConfig();
    tooShort.hsts = { enabled: true, maxAge: '100', includeSubDomains: true, preload: true };
    expect(
      validateConfig(tooShort).some((i) => i.level === 'error' && i.message.includes(String(HSTS_PRELOAD_MIN_AGE))),
    ).toBe(true);

    const noSub = createEmptyConfig();
    noSub.hsts = { enabled: true, maxAge: '31536000', includeSubDomains: false, preload: true };
    expect(validateConfig(noSub).some((i) => i.message.includes('includeSubDomains'))).toBe(true);
  });

  it('低 max-age 给生产建议警告', () => {
    const config = createEmptyConfig();
    config.hsts = { enabled: true, maxAge: '3600', includeSubDomains: false, preload: false };
    expect(validateConfig(config).some((i) => i.message.includes('180 天'))).toBe(true);
  });

  it('非法枚举值报错', () => {
    const config = createEmptyConfig();
    config.referrerPolicy = 'always';
    config.coop = 'same-site';
    config.coep = 'require-corp';
    config.corp = 'none';
    const errors = validateConfig(config).filter((i) => i.level === 'error');
    expect(errors).toHaveLength(3);
    expect(errors.map((e) => e.message).join('|')).toContain('Referrer-Policy');
    expect(errors.map((e) => e.message).join('|')).toContain('Cross-Origin-Opener-Policy');
    expect(errors.map((e) => e.message).join('|')).toContain('Cross-Origin-Resource-Policy');
  });

  it('全空配置给空输出警告', () => {
    expect(validateConfig(createEmptyConfig()).some((i) => i.message.includes('尚未启用'))).toBe(true);
  });
});

describe('formatHeaders', () => {
  it('raw 输出为 Name: value 行', () => {
    const output = formatHeaders(createSampleConfig(), 'raw');
    expect(output.startsWith('Content-Security-Policy: default-src')).toBe(true);
    expect(output).toContain('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    expect(output).toContain('X-Content-Type-Options: nosniff');
  });

  it('nginx 输出 add_header 且 always', () => {
    const output = formatHeaders(createSampleConfig(), 'nginx');
    expect(output).toContain(
      'add_header X-Frame-Options "SAMEORIGIN" always;',
    );
    expect(output.split('\n').every((line) => line.includes('add_header'))).toBe(true);
  });

  it('apache 输出 Header always set', () => {
    const output = formatHeaders(createSampleConfig(), 'apache');
    expect(output).toContain('Header always set Referrer-Policy "strict-origin-when-cross-origin"');
  });

  it('meta 只输出支持 http-equiv 的头，并注释其余头', () => {
    const output = formatHeaders(createSampleConfig(), 'meta');
    expect(output).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(output).toContain('<meta http-equiv="Referrer-Policy"');
    expect(output).not.toContain('http-equiv="Strict-Transport-Security"');
    expect(output).toContain('无法通过 <meta> 设置');
  });

  it('Report-Only CSP 不进入 meta 标签，只在注释中列出', () => {
    const config = createSampleConfig();
    config.cspReportOnly = true;
    const output = formatHeaders(config, 'meta');
    expect(output).not.toContain('http-equiv="Content-Security-Policy');
  });

  it('空配置四种格式均输出空串', () => {
    for (const format of ['raw', 'nginx', 'apache', 'meta'] as const) {
      expect(formatHeaders(createEmptyConfig(), format)).toBe('');
    }
  });
});

describe('escapeConfigQuoted', () => {
  it('转义反斜杠与双引号', () => {
    expect(escapeConfigQuoted('a"b\\c')).toBe('a\\"b\\\\c');
  });
});
