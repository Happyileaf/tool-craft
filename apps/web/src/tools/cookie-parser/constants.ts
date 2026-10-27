/**
 * Cookie 工具常量
 */

/** 默认 Cookie 请求头样例 */
export const DEFAULT_COOKIE_HEADER = [
  'sessionId=3f8a9c2e-7b41',
  'theme=dark',
  'lang=zh-CN',
  'returnUrl=https%3A%2F%2Fexample.com%2Fdashboard',
].join('; ');

/** 默认 Set-Cookie 样例 */
export const DEFAULT_SET_COOKIE =
  'sessionId=3f8a9c2e-7b41; Path=/; HttpOnly; Secure; SameSite=Lax';

/** SameSite 选项（含「不设置」） */
export const SAME_SITE_OPTIONS: { label: string; value: '' | 'Lax' | 'Strict' | 'None' }[] = [
  { label: '不设置', value: '' },
  { label: 'Lax', value: 'Lax' },
  { label: 'Strict', value: 'Strict' },
  { label: 'None', value: 'None' },
];
