import {
  COEP_OPTIONS,
  COOP_OPTIONS,
  CORP_OPTIONS,
  KNOWN_PERMISSION_FEATURES,
  REFERRER_POLICY_OPTIONS,
  type CspDirective,
  type HeaderFormat,
  type PermissionRule,
  type SecurityHeadersConfig,
} from './utils/headers';

/** 输出格式选项 */
export const FORMAT_OPTIONS: { value: HeaderFormat; label: string; hint: string }[] = [
  { value: 'raw', label: '原始响应头', hint: 'Name: value，按行排列' },
  { value: 'nginx', label: 'Nginx', hint: 'add_header ... always;' },
  { value: 'apache', label: 'Apache (.htaccess / httpd.conf)', hint: 'Header always set ...' },
  { value: 'meta', label: 'HTML <meta>', hint: '仅 CSP / Referrer-Policy 等支持 http-equiv 的头' },
];

/** X-Frame-Options 选项 */
export const FRAME_OPTIONS = [
  { value: 'DENY', label: 'DENY（页面不允许被任何 iframe 嵌入）' },
  { value: 'SAMEORIGIN', label: 'SAMEORIGIN（仅同源可嵌入）' },
] as const;

/** Referrer-Policy 下拉选项 */
export const REFERRER_OPTIONS = REFERRER_POLICY_OPTIONS.map((value) => ({ value, label: value }));

/** COOP 下拉选项 */
export const COOP_SELECT_OPTIONS = COOP_OPTIONS.map((value) => ({ value, label: value }));
/** COEP 下拉选项 */
export const COEP_SELECT_OPTIONS = COEP_OPTIONS.map((value) => ({ value, label: value }));
/** CORP 下拉选项 */
export const CORP_SELECT_OPTIONS = CORP_OPTIONS.map((value) => ({ value, label: value }));

/** 可快捷添加的 CSP 指令（名称 + 占位提示） */
export const CSP_PRESET_DIRECTIVES: { name: string; hint: string }[] = [
  { name: 'default-src', hint: "'self'" },
  { name: 'script-src', hint: "'self' 'nonce-...' 或 'sha256-...'" },
  { name: 'style-src', hint: "'self'" },
  { name: 'img-src', hint: "'self' data: https:" },
  { name: 'font-src', hint: "'self' https://fonts.gstatic.com" },
  { name: 'connect-src', hint: "'self' https://api.example.com" },
  { name: 'frame-src', hint: "'self' https://www.youtube.com" },
  { name: 'object-src', hint: "'none'" },
  { name: 'base-uri', hint: "'self'" },
  { name: 'form-action', hint: "'self'" },
  { name: 'frame-ancestors', hint: "'self'" },
  { name: 'upgrade-insecure-requests', hint: '（无值指令，留空即可）' },
];

/** 可快捷添加的 Permissions-Policy 特性 */
export const PERMISSION_FEATURE_OPTIONS = KNOWN_PERMISSION_FEATURES.map((feature) => ({
  value: feature,
  label: feature,
}));

/** 新建一行空的 CSP 指令 */
export function emptyDirective(): CspDirective {
  return { name: '', value: '' };
}

/** 新建一行空的权限规则 */
export function emptyPermission(): PermissionRule {
  return { feature: '', allowlist: '' };
}

/** 空白配置 */
export function createEmptyConfig(): SecurityHeadersConfig {
  return {
    cspEnabled: false,
    cspReportOnly: false,
    cspDirectives: [],
    hsts: { enabled: false, maxAge: '31536000', includeSubDomains: true, preload: false },
    frameOptions: '',
    contentTypeNosniff: false,
    referrerPolicy: '',
    permissionsPolicy: [],
    coop: '',
    coep: '',
    corp: '',
  };
}

/** 示例：较严格的通用站点安全配置 */
export function createSampleConfig(): SecurityHeadersConfig {
  return {
    cspEnabled: true,
    cspReportOnly: false,
    cspDirectives: [
      { name: 'default-src', value: "'self'" },
      { name: 'img-src', value: "'self' data: https:" },
      { name: 'font-src', value: "'self' https://fonts.gstatic.com" },
      { name: 'style-src', value: "'self' 'unsafe-inline' https://fonts.googleapis.com" },
      { name: 'script-src', value: "'self'" },
      { name: 'connect-src', value: "'self' https://api.example.com" },
      { name: 'object-src', value: "'none'" },
      { name: 'base-uri', value: "'self'" },
      { name: 'form-action', value: "'self'" },
      { name: 'frame-ancestors', value: "'self'" },
      { name: 'upgrade-insecure-requests', value: '' },
    ],
    hsts: { enabled: true, maxAge: '63072000', includeSubDomains: true, preload: false },
    frameOptions: 'SAMEORIGIN',
    contentTypeNosniff: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      { feature: 'camera', allowlist: '' },
      { feature: 'microphone', allowlist: '' },
      { feature: 'geolocation', allowlist: 'self' },
    ],
    coop: 'same-origin',
    coep: '',
    corp: 'same-origin',
  };
}
