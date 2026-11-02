/**
 * HTTP 安全响应头生成器的常量定义
 *
 * 参考：
 * - MDN: https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
 * - OWASP Secure Headers Project
 * - HSTS preload list 提交要求（max-age ≥ 31536000）
 */

/** HSTS 预加载列表要求的最小 max-age（秒） */
export const HSTS_PRELOAD_MIN_AGE = 31536000;

/** HSTS 常用档位（秒） */
export const HSTS_AGE_PRESETS = [
  { label: '5 分钟（300，测试用）', value: 300 },
  { label: '1 小时（3600）', value: 3600 },
  { label: '1 天（86400）', value: 86400 },
  { label: '6 个月（15552000，推荐下限）', value: 15552000 },
  { label: '1 年（31536000，preload 要求）', value: 31536000 },
  { label: '2 年（63072000，长期站点）', value: 63072000 },
];

/** X-Frame-Options 可选值（ALLOW-FROM 已废弃，不提供） */
export const X_FRAME_OPTIONS_VALUES = [
  { label: 'DENY（任何页面都不允许嵌入框架，最严格）', value: 'DENY' },
  { label: 'SAMEORIGIN（仅同源页面可嵌入）', value: 'SAMEORIGIN' },
] as const;

/** Referrer-Policy 可选值 */
export const REFERRER_POLICY_VALUES = [
  'no-referrer',
  'no-referrer-when-downgrade',
  'same-origin',
  'strict-origin-when-cross-origin',
  'origin-when-cross-origin',
  'unsafe-url',
] as const;

/** Cross-Origin-Opener-Policy 可选值 */
export const COOP_VALUES = [
  { label: 'same-origin（推荐：与跨源页面隔离浏览上下文组）', value: 'same-origin' },
  { label: 'same-origin-allow-popups', value: 'same-origin-allow-popups' },
  { label: 'unsafe-none（默认，不隔离）', value: 'unsafe-none' },
] as const;

/** Permissions-Policy 中可配置的常见特性 */
export const PERMISSION_FEATURES = [
  { key: 'camera', label: '摄像头 camera' },
  { key: 'microphone', label: '麦克风 microphone' },
  { key: 'geolocation', label: '地理位置 geolocation' },
  { key: 'payment', label: '支付 Payment Request' },
  { key: 'usb', label: 'WebUSB' },
  { key: 'interest-cohort', label: 'FLoC 队列 interest-cohort' },
] as const;

/** 每个特性的可选授权范围 */
export const PERMISSION_ALLOW_VALUES = [
  { label: '全部禁用 ()', value: 'none' },
  { label: '仅同源 (self)', value: 'self' },
  { label: '允许任意来源 (*)', value: 'any' },
] as const;

/** CSP 中常见的可配置指令（Fetch 指令 + 导航/框架类） */
export const CSP_DIRECTIVES = [
  { key: 'default-src', label: 'default-src（默认回退源）' },
  { key: 'script-src', label: 'script-src（脚本来源）' },
  { key: 'style-src', label: 'style-src（样式来源）' },
  { key: 'img-src', label: 'img-src（图片来源）' },
  { key: 'font-src', label: 'font-src（字体来源）' },
  { key: 'connect-src', label: 'connect-src（fetch / XHR / WebSocket 来源）' },
  { key: 'frame-src', label: 'frame-src（可嵌入的 iframe 来源）' },
  { key: 'object-src', label: 'object-src（插件对象来源）' },
  { key: 'base-uri', label: 'base-uri（<base> 标签允许值）' },
  { key: 'form-action', label: 'form-action（表单提交目标）' },
  { key: 'frame-ancestors', label: 'frame-ancestors（可嵌入本页的来源）' },
] as const;

/** CSP 源快捷选项 */
export const CSP_SOURCE_PRESETS = [
  { label: "'self'（仅同源）", value: "'self'" },
  { label: "'none'（全部禁止）", value: "'none'" },
  { label: 'https:（任意 HTTPS 源）', value: 'https:' },
  { label: 'data:（允许 data: URI）', value: 'data:' },
  { label: 'blob:（允许 blob: URI）', value: 'blob:' },
  { label: "'unsafe-inline'", value: "'unsafe-inline'" },
  { label: "'unsafe-eval'", value: "'unsafe-eval'" },
  { label: "'strict-dynamic'", value: "'strict-dynamic'" },
] as const;

/** 输出为空时的提示 */
export const EMPTY_OUTPUT_TEXT = '至少启用一个安全响应头，输出会实时显示在这里';

/** 空配置提示文案 */
export const EMPTY_TEXT = '当前未启用任何安全响应头';
