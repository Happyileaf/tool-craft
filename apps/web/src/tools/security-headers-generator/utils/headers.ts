/**
 * 零依赖 HTTP 安全响应头生成纯函数。
 * 支持 Content-Security-Policy（含 Report-Only）、HSTS、
 * X-Frame-Options、X-Content-Type-Options、Referrer-Policy、
 * Permissions-Policy 与跨源隔离三件套（COOP/COEP/CORP），
 * 可输出原始响应头、Nginx、Apache 与 HTML <meta> 四种形式。
 * 全部本地运行，不发起网络请求。
 */

/** 输出格式 */
export type HeaderFormat = 'raw' | 'nginx' | 'apache' | 'meta';

/** 单条 CSP 指令 */
export interface CspDirective {
  /** 指令名，如 default-src */
  name: string;
  /** 原始 source 列表，如 'self' https://example.com */
  value: string;
}

/** HSTS 配置 */
export interface HstsConfig {
  enabled: boolean;
  /** max-age 秒数（字符串表单值） */
  maxAge: string;
  includeSubDomains: boolean;
  preload: boolean;
}

/** 单条 Permissions-Policy 规则 */
export interface PermissionRule {
  /** 特性名，如 camera */
  feature: string;
  /** allowlist 原始文本，空格分隔，如：self https://a.com */
  allowlist: string;
}

/** 全部安全头表单配置 */
export interface SecurityHeadersConfig {
  cspEnabled: boolean;
  /** 仅报告模式：头名切换为 Content-Security-Policy-Report-Only */
  cspReportOnly: boolean;
  cspDirectives: CspDirective[];
  hsts: HstsConfig;
  /** X-Frame-Options；空串表示不输出 */
  frameOptions: '' | 'DENY' | 'SAMEORIGIN';
  contentTypeNosniff: boolean;
  /** Referrer-Policy；空串表示不输出 */
  referrerPolicy: string;
  permissionsPolicy: PermissionRule[];
  /** Cross-Origin-Opener-Policy；空串不输出 */
  coop: string;
  /** Cross-Origin-Embedder-Policy；空串不输出 */
  coep: string;
  /** Cross-Origin-Resource-Policy；空串不输出 */
  corp: string;
}

/** 校验问题 */
export interface HeaderIssue {
  level: 'error' | 'warning';
  message: string;
}

/** 已组装的响应头 */
export interface BuiltHeader {
  name: string;
  value: string;
  /** 是否能通过 HTML <meta http-equiv> 生效 */
  metaSupported: boolean;
}

/** CSP3 常见指令白名单（用于未知指令警告，非强制） */
export const KNOWN_CSP_DIRECTIVES = new Set<string>([
  'default-src',
  'script-src',
  'script-src-elem',
  'script-src-attr',
  'style-src',
  'style-src-elem',
  'style-src-attr',
  'img-src',
  'font-src',
  'connect-src',
  'media-src',
  'object-src',
  'prefetch-src',
  'child-src',
  'frame-src',
  'worker-src',
  'manifest-src',
  'frame-ancestors',
  'form-action',
  'base-uri',
  'navigate-to',
  'sandbox',
  'report-uri',
  'report-to',
  'require-trusted-types-for',
  'trusted-types',
  'upgrade-insecure-requests',
  'block-all-mixed-content',
]);

/** 本身不带值的 CSP 指令 */
export const VALUELESS_CSP_DIRECTIVES = new Set<string>([
  'upgrade-insecure-requests',
  'block-all-mixed-content',
]);

/** Permissions-Policy 常见特性 */
export const KNOWN_PERMISSION_FEATURES = [
  'accelerometer',
  'autoplay',
  'camera',
  'display-capture',
  'encrypted-media',
  'fullscreen',
  'geolocation',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'sync-xhr',
  'usb',
  'web-share',
  'xr-spatial-tracking',
];

/** Referrer-Policy 合法枚举 */
export const REFERRER_POLICY_OPTIONS = [
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
];

/** COOP 合法值 */
export const COOP_OPTIONS = ['unsafe-none', 'same-origin-allow-popups', 'same-origin'];
/** COEP 合法值 */
export const COEP_OPTIONS = [
  'unsafe-none',
  'credentialless',
  'require-corp',
];
/** CORP 合法值 */
export const CORP_OPTIONS = ['same-site', 'same-origin', 'cross-origin'];

/** HSTS preload 要求的最小 max-age（hstspreload.org） */
export const HSTS_PRELOAD_MIN_AGE = 31536000;

/** 指令名 / 特性名合法字符 */
const TOKEN_PATTERN = /^[a-z][a-z0-9-]*$/;
/** 头部值中禁止出现的控制字符与注入用换行 */
const INVALID_VALUE_PATTERN = /[\r\n;]/;

/**
 * 组装单条 CSP 策略字符串（不含头名）
 *
 * @param directives - 指令列表
 * @returns 策略值与组装阶段错误
 */
export function buildCspValue(directives: CspDirective[]): { value: string; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const rawDirective of directives) {
    const name = rawDirective.name.trim().toLowerCase();
    const value = rawDirective.value.trim();
    if (name === '' && value === '') {
      continue; // 整行留空，跳过
    }
    if (name === '') {
      errors.push('存在未填写指令名但填写了值的 CSP 行');
      continue;
    }
    if (!TOKEN_PATTERN.test(name)) {
      errors.push(`CSP 指令名「${rawDirective.name}」只能包含小写字母、数字与连字符`);
      continue;
    }
    if (seen.has(name)) {
      errors.push(`CSP 指令「${name}」重复，浏览器只接受一条策略中的首个同名指令`);
      continue;
    }
    seen.add(name);
    if (VALUELESS_CSP_DIRECTIVES.has(name)) {
      parts.push(name);
      continue;
    }
    if (value === '') {
      errors.push(`CSP 指令「${name}」缺少 source 列表（无值指令仅 upgrade-insecure-requests 等少数几个）`);
      continue;
    }
    if (INVALID_VALUE_PATTERN.test(value)) {
      errors.push(`CSP 指令「${name}」的值包含换行或分号等非法字符`);
      continue;
    }
    parts.push(`${name} ${value}`);
  }

  return { value: parts.join('; ') + (parts.length > 0 ? ';' : ''), errors };
}

/**
 * 组装 HSTS 头值
 *
 * @param config - HSTS 配置
 * @returns 头值；未启用时为 null
 */
export function buildHstsValue(config: HstsConfig): string | null {
  if (!config.enabled) {
    return null;
  }
  const parts = [`max-age=${config.maxAge.trim()}`];
  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }
  if (config.preload) {
    parts.push('preload');
  }
  return parts.join('; ');
}

/**
 * 把单条 Permissions-Policy 规则归一为 feature=(allowlist)
 *
 * @param rule - 特性规则
 * @returns 序列化片段与错误信息
 */
export function formatPermissionRule(
  rule: PermissionRule,
): { text: string | null; errors: string[] } {
  const errors: string[] = [];
  const feature = rule.feature.trim().toLowerCase();
  if (feature === '') {
    return { text: null, errors };
  }
  if (!TOKEN_PATTERN.test(feature)) {
    return { text: null, errors: [`特性名「${rule.feature}」只能包含小写字母、数字与连字符`] };
  }
  const tokens = rule.allowlist.trim().split(/\s+/).filter(Boolean);
  const rendered: string[] = [];
  for (const token of tokens) {
    if (token === '*' || token === 'self' || token === 'src') {
      rendered.push(token);
    } else if (/^https?:\/\//.test(token)) {
      rendered.push(`"${token}"`);
    } else {
      errors.push(`特性「${feature}」的 allowlist 含非法标记「${token}」（仅支持 *、self、src 或 https(s) 源）`);
    }
  }
  return { text: `${feature}=(${rendered.join(' ')})`, errors };
}

/**
 * 汇总所有启用的响应头
 *
 * @param config - 表单配置
 * @returns 响应头列表（按推荐顺序）与组装错误
 */
export function collectHeaders(
  config: SecurityHeadersConfig,
): { headers: BuiltHeader[]; errors: string[] } {
  const errors: string[] = [];
  const headers: BuiltHeader[] = [];

  if (config.cspEnabled) {
    const csp = buildCspValue(config.cspDirectives);
    errors.push(...csp.errors);
    if (csp.value !== '') {
      headers.push({
        name: config.cspReportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy',
        value: csp.value,
        metaSupported: !config.cspReportOnly,
      });
    }
  }

  const hsts = buildHstsValue(config.hsts);
  if (hsts !== null) {
    headers.push({
      name: 'Strict-Transport-Security',
      value: hsts,
      metaSupported: false,
    });
  }

  if (config.frameOptions !== '') {
    headers.push({ name: 'X-Frame-Options', value: config.frameOptions, metaSupported: false });
  }

  if (config.contentTypeNosniff) {
    headers.push({ name: 'X-Content-Type-Options', value: 'nosniff', metaSupported: false });
  }

  if (config.referrerPolicy.trim() !== '') {
    headers.push({
      name: 'Referrer-Policy',
      value: config.referrerPolicy.trim(),
      metaSupported: true,
    });
  }

  const permissionParts: string[] = [];
  for (const rule of config.permissionsPolicy) {
    const formatted = formatPermissionRule(rule);
    errors.push(...formatted.errors);
    if (formatted.text !== null) {
      permissionParts.push(formatted.text);
    }
  }
  if (permissionParts.length > 0) {
    headers.push({
      name: 'Permissions-Policy',
      value: permissionParts.join(', '),
      metaSupported: false,
    });
  }

  if (config.coop.trim() !== '') {
    headers.push({ name: 'Cross-Origin-Opener-Policy', value: config.coop.trim(), metaSupported: false });
  }
  if (config.coep.trim() !== '') {
    headers.push({ name: 'Cross-Origin-Embedder-Policy', value: config.coep.trim(), metaSupported: false });
  }
  if (config.corp.trim() !== '') {
    headers.push({ name: 'Cross-Origin-Resource-Policy', value: config.corp.trim(), metaSupported: false });
  }

  return { headers, errors };
}

/**
 * 校验整个配置（错误 + 警告）
 *
 * @param config - 表单配置
 * @returns 问题列表
 */
export function validateConfig(config: SecurityHeadersConfig): HeaderIssue[] {
  const issues: HeaderIssue[] = [];
  const { headers, errors } = collectHeaders(config);
  errors.forEach((message) => issues.push({ level: 'error', message }));

  if (config.cspEnabled) {
    const names = config.cspDirectives.map((d) => d.name.trim().toLowerCase());
    if (!names.includes('default-src')) {
      issues.push({ level: 'warning', message: 'CSP 未设置 default-src 回退指令，其他资源类型将不受默认限制' });
    }
    for (const directive of config.cspDirectives) {
      const name = directive.name.trim().toLowerCase();
      if (name !== '' && !KNOWN_CSP_DIRECTIVES.has(name) && TOKEN_PATTERN.test(name)) {
        issues.push({ level: 'warning', message: `CSP 指令「${name}」不在常见 CSP3 指令列表中，请确认拼写` });
      }
      if (
        (name === 'script-src' || name === 'style-src') &&
        /'unsafe-inline'/.test(directive.value) &&
        !/'nonce-|'sha(256|384|512)-/.test(directive.value)
      ) {
        issues.push({
          level: 'warning',
          message: `${name} 使用了 'unsafe-inline'，建议改用 nonce 或 hash 以获得更强的 XSS 防护`,
        });
      }
      if (name === 'script-src' && /'unsafe-eval'/.test(directive.value)) {
        issues.push({ level: 'warning', message: "script-src 允许 'unsafe-eval'，会显著放宽 XSS 攻击面" });
      }
    }
    if (config.cspReportOnly) {
      issues.push({
        level: 'warning',
        message: '当前为仅报告模式（Report-Only），浏览器只上报不拦截；验证无误后请切换为强制模式',
      });
    }
  }

  if (config.hsts.enabled) {
    const maxAge = config.hsts.maxAge.trim();
    if (!/^\d+$/.test(maxAge)) {
      issues.push({ level: 'error', message: `HSTS max-age 必须是非负整数秒，当前为「${config.hsts.maxAge}」` });
    } else {
      const seconds = Number(maxAge);
      if (config.hsts.preload && seconds < HSTS_PRELOAD_MIN_AGE) {
        issues.push({
          level: 'error',
          message: `HSTS preload 要求 max-age 至少 ${HSTS_PRELOAD_MIN_AGE} 秒（1 年），当前为 ${seconds} 秒`,
        });
      }
      if (config.hsts.preload && !config.hsts.includeSubDomains) {
        issues.push({ level: 'error', message: 'HSTS preload 要求同时勾选 includeSubDomains' });
      }
      if (seconds > 0 && seconds < 15552000) {
        issues.push({ level: 'warning', message: 'HSTS max-age 小于 180 天（15552000 秒），生产环境建议至少半年' });
      }
    }
  }

  if (config.referrerPolicy.trim() !== '' && !REFERRER_POLICY_OPTIONS.includes(config.referrerPolicy.trim())) {
    issues.push({ level: 'error', message: `Referrer-Policy 值「${config.referrerPolicy}」不是合法枚举` });
  }
  for (const [label, value, options] of [
    ['Cross-Origin-Opener-Policy', config.coop, COOP_OPTIONS],
    ['Cross-Origin-Embedder-Policy', config.coep, COEP_OPTIONS],
    ['Cross-Origin-Resource-Policy', config.corp, CORP_OPTIONS],
  ] as const) {
    const trimmed = value.trim();
    if (trimmed !== '' && !options.includes(trimmed)) {
      issues.push({ level: 'error', message: `${label} 值「${trimmed}」不合法，可选：${options.join(' / ')}` });
    }
  }

  for (const rule of config.permissionsPolicy) {
    const feature = rule.feature.trim().toLowerCase();
    if (
      feature !== '' &&
      TOKEN_PATTERN.test(feature) &&
      !KNOWN_PERMISSION_FEATURES.includes(feature)
    ) {
      issues.push({ level: 'warning', message: `Permissions-Policy 特性「${feature}」不在常见特性列表中，请确认拼写` });
    }
  }

  if (headers.length === 0 && errors.length === 0) {
    issues.push({ level: 'warning', message: '尚未启用任何响应头，输出为空' });
  }

  return issues;
}

/**
 * 转义 Nginx / Apache 配置中双引号字符串内的特殊字符
 *
 * @param value - 原始头值
 * @returns 可放入 "..." 的文本
 */
export function escapeConfigQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 将响应头格式化为目标形式
 *
 * @param config - 表单配置
 * @param format - 输出格式
 * @returns 文本结果
 */
export function formatHeaders(config: SecurityHeadersConfig, format: HeaderFormat): string {
  const { headers } = collectHeaders(config);

  if (format === 'raw') {
    return headers.map((header) => `${header.name}: ${header.value}`).join('\n');
  }

  if (format === 'nginx') {
    return headers
      .map((header) => `add_header ${header.name} "${escapeConfigQuoted(header.value)}" always;`)
      .join('\n');
  }

  if (format === 'apache') {
    return headers
      .map((header) => `Header always set ${header.name} "${escapeConfigQuoted(header.value)}"`)
      .join('\n');
  }

  // HTML <meta>：仅 CSP 与 Referrer-Policy 等支持 http-equiv 的头可输出
  const supported = headers.filter((header) => header.metaSupported);
  const unsupported = headers.filter((header) => !header.metaSupported);
  const lines: string[] = supported.map(
    (header) =>
      `<meta http-equiv="${header.name}" content="${escapeConfigQuoted(header.value)}">`,
  );
  if (unsupported.length > 0) {
    lines.push(
      `<!-- 以下响应头无法通过 <meta> 设置，必须在服务器层配置：${unsupported
        .map((header) => header.name)
        .join('、')} -->`,
    );
  }
  return lines.join('\n');
}
