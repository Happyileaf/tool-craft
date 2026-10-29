/**
 * robots.txt 生成器内常量：常见爬虫预设与示例数据
 */

import type { RobotsGroup } from './utils/robots';

/** 常见爬虫 User-agent 标识 */
export const COMMON_CRAWLERS: { key: string; label: string; agent: string }[] = [
  { key: 'googlebot', label: 'Googlebot', agent: 'Googlebot' },
  { key: 'googlebot-image', label: 'Googlebot-Image', agent: 'Googlebot-Image' },
  { key: 'bingbot', label: 'Bingbot', agent: 'Bingbot' },
  { key: 'slurp', label: 'Yahoo Slurp', agent: 'Slurp' },
  { key: 'duckduckbot', label: 'DuckDuckBot', agent: 'DuckDuckBot' },
  { key: 'baiduspider', label: '百度爬虫', agent: 'Baiduspider' },
  { key: 'yandex', label: 'Yandex Bot', agent: 'YandexBot' },
  { key: 'gptbot', label: 'GPTBot', agent: 'GPTBot' },
];

/** 规则组自增 id 前缀之外的起始计数由组件维护，这里只提供空白组工厂 */
export function createEmptyGroup(id: number): RobotsGroup {
  return { id, agents: '', allow: '', disallow: '', crawlDelay: '' };
}

/** 预设：全部允许 */
export const PRESET_ALLOW_ALL: RobotsGroup[] = [
  { id: 1, agents: '*', allow: '/', disallow: '', crawlDelay: '' },
];

/** 预设：全部禁止 */
export const PRESET_DISALLOW_ALL: RobotsGroup[] = [
  { id: 1, agents: '*', allow: '', disallow: '/', crawlDelay: '' },
];

/** 预设：禁止 AI 爬虫抓取私有目录 */
export const PRESET_BLOCK_AI: RobotsGroup[] = [
  { id: 1, agents: '*', allow: '/', disallow: '/private/\n/admin', crawlDelay: '' },
  { id: 2, agents: 'GPTBot\nClaudeBot', allow: '', disallow: '/', crawlDelay: '' },
];

/** 默认示例数据 */
export function createDefaultGroups(): RobotsGroup[] {
  return [
    {
      id: 1,
      agents: '*',
      allow: '',
      disallow: '/admin\n/private/\n/*.json$',
      crawlDelay: '10',
    },
    {
      id: 2,
      agents: 'Googlebot',
      allow: '/',
      disallow: '',
      crawlDelay: '',
    },
  ];
}

/** 默认 Sitemap 示例（每行一条） */
export const DEFAULT_SITEMAPS = 'https://example.com/sitemap.xml';
