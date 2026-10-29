/**
 * sitemap.xml 生成器内常量：changefreq 选项与默认示例数据
 */

/** changefreq 下拉选项（含空值「不输出」） */
export const CHANGEFREQ_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '不输出 changefreq' },
  { value: 'always', label: 'always（始终变化）' },
  { value: 'hourly', label: 'hourly（每小时）' },
  { value: 'daily', label: 'daily（每天）' },
  { value: 'weekly', label: 'weekly（每周）' },
  { value: 'monthly', label: 'monthly（每月）' },
  { value: 'yearly', label: 'yearly（每年）' },
  { value: 'never', label: 'never（归档页）' },
];

/** 默认示例 URL 清单（每行一条） */
export const DEFAULT_URLS = [
  'https://example.com/',
  'https://example.com/about',
  'https://example.com/products',
  'https://example.com/blog',
  'https://example.com/contact',
].join('\n');

/** 默认全局选项 */
export const DEFAULT_OPTIONS = {
  lastmod: '2026-10-30',
  changefreq: 'weekly',
  priority: '0.8',
};
