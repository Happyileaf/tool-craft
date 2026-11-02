import { describe, it, expect } from 'vitest';
import {
  buildCsp,
  buildHsts,
  buildPermissionsPolicy,
  buildSecurityHeaders,
  renderApache,
  renderNginx,
  type SecurityHeadersConfig,
} from './headers';

/** 全保守基线配置，测试按需覆盖字段 */
const baseConfig: SecurityHeadersConfig = {
  hstsMaxAge: 63072000,
  hstsIncludeSubDomains: true,
  hstsPreload: false,
  xFrameOptions: 'DENY',
  contentTypeNosniff: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  coop: 'same-origin',
  permissions: { camera: 'none', microphone: 'none', geolocation: 'none' },
  cspDirectives: [
    { name: 'default-src', sources: ["'self'"] },
    { name: 'object-src', sources: ["'none'"] },
  ],
  cspReportOnly: false,
};

describe('HSTS', () => {
  it('max-age + includeSubDomains + preload 拼接', () => {
    expect(buildHsts(31536000, true, true)).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
  });

  it('仅 max-age', () => {
    expect(buildHsts(300, false, false)).toBe('max-age=300');
  });

  it('禁用时返回 null', () => {
    expect(buildHsts(null, true, true)).toBeNull();
  });
});

describe('Permissions-Policy', () => {
  it('none / self / any 三种形态', () => {
    const value = buildPermissionsPolicy({
      camera: 'none',
      geolocation: 'self',
      payment: 'any',
    });
    expect(value).toBe('camera=(), geolocation=(self), payment=*');
  });
});

describe('CSP', () => {
  it('过滤空源指令并按分号拼接', () => {
    const value = buildCsp([
      { name: 'default-src', sources: ["'self'"] },
      { name: 'script-src', sources: [] },
      { name: 'img-src', sources: ["'self'", 'data:'] },
    ]);
    expect(value).toBe("default-src 'self'; img-src 'self' data:");
  });
});

describe('buildSecurityHeaders 综合输出', () => {
  it('基线配置输出 7 个头且无告警', () => {
    const result = buildSecurityHeaders(baseConfig);
    const names = result.headers.map((header) => header.name);
    expect(names).toEqual([
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Cross-Origin-Opener-Policy',
      'Permissions-Policy',
      'Content-Security-Policy',
    ]);
    expect(result.warnings).toHaveLength(0);
    const hsts = result.headers.find((header) => header.name === 'Strict-Transport-Security');
    expect(hsts?.value).toBe('max-age=63072000; includeSubDomains');
  });

  it('全部禁用时无输出头无告警', () => {
    const result = buildSecurityHeaders({
      ...baseConfig,
      hstsMaxAge: null,
      xFrameOptions: null,
      contentTypeNosniff: false,
      referrerPolicy: null,
      coop: null,
      permissions: {},
      cspDirectives: [],
    });
    expect(result.headers).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('preload 但 max-age 不足时告警', () => {
    const result = buildSecurityHeaders({ ...baseConfig, hstsPreload: true, hstsMaxAge: 3600 });
    expect(result.warnings.some((warning) => warning.includes('preload'))).toBe(true);
  });

  it('preload 缺少 includeSubDomains 时告警', () => {
    const result = buildSecurityHeaders({
      ...baseConfig,
      hstsPreload: true,
      hstsMaxAge: 31536000,
      hstsIncludeSubDomains: false,
    });
    expect(result.warnings.some((warning) => warning.includes('includeSubDomains'))).toBe(true);
  });

  it('max-age=0 告警为删除策略', () => {
    const result = buildSecurityHeaders({ ...baseConfig, hstsMaxAge: 0 });
    expect(result.warnings[0]).toContain('删除 HSTS');
  });

  it("script-src 含 unsafe-inline / unsafe-eval / https: 分别告警", () => {
    const result = buildSecurityHeaders({
      ...baseConfig,
      cspDirectives: [
        { name: 'default-src', sources: ["'self'"] },
        { name: 'object-src', sources: ["'none'"] },
        { name: 'script-src', sources: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'] },
      ],
    });
    expect(result.warnings.some((w) => w.includes('unsafe-inline'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('unsafe-eval'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('https:'))).toBe(true);
  });

  it('缺 default-src 告警；缺 object-src 告警', () => {
    const result = buildSecurityHeaders({
      ...baseConfig,
      cspDirectives: [{ name: 'script-src', sources: ["'self'"] }],
    });
    expect(result.warnings.some((w) => w.includes('default-src'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('object-src'))).toBe(true);
  });

  it('report-only 时头名切换', () => {
    const result = buildSecurityHeaders({ ...baseConfig, cspReportOnly: true });
    expect(result.headers.map((h) => h.name)).toContain('Content-Security-Policy-Report-Only');
  });

  it('Referrer-Policy unsafe-url 告警', () => {
    const result = buildSecurityHeaders({ ...baseConfig, referrerPolicy: 'unsafe-url' });
    expect(result.warnings.some((w) => w.includes('unsafe-url'))).toBe(true);
  });

  it('Permissions 对任意源开放时告警列出特性', () => {
    const result = buildSecurityHeaders({
      ...baseConfig,
      permissions: { camera: 'any', payment: 'any', geolocation: 'none' },
    });
    const warning = result.warnings.find((w) => w.includes('Permissions-Policy'));
    expect(warning).toContain('camera');
    expect(warning).toContain('payment');
    expect(warning).not.toContain('geolocation');
  });
});

describe('服务器配置渲染', () => {
  const headers = [
    { name: 'X-Content-Type-Options', value: 'nosniff' },
    { name: 'Content-Security-Policy', value: "default-src 'self'" },
  ];

  it('Nginx add_header 语法', () => {
    const output = renderNginx(headers);
    expect(output).toContain('add_header X-Content-Type-Options "nosniff" always;');
    expect(output).toContain("add_header Content-Security-Policy \"default-src 'self'\" always;");
  });

  it('Apache Header set 语法', () => {
    const output = renderApache(headers);
    expect(output).toContain('Header always set X-Content-Type-Options "nosniff"');
    expect(output).toContain("Header always set Content-Security-Policy \"default-src 'self'\"");
  });
});
