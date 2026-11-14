/** RSS / Atom Feed 生成器的常量与样例 */

import type { FeedFormat } from './utils/feed';

export interface FeedItemForm {
  key: number;
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export const FEED_FORMAT_OPTIONS: Array<{ label: string; value: FeedFormat }> = [
  { label: 'RSS 2.0', value: 'rss' },
  { label: 'Atom 1.0', value: 'atom' },
];

export const SAMPLE_FEED_ITEMS: FeedItemForm[] = [
  {
    key: 1,
    title: '工具站新增 RSS 生成器',
    link: 'https://example.com/blog/rss-generator',
    pubDate: '2026-11-15',
    description: '在浏览器本地填写元数据与条目，即可生成符合规范的 RSS 2.0 / Atom 1.0 文档。',
  },
  {
    key: 2,
    title: '本周更新：文本行号与景深计算',
    link: 'https://example.com/blog/weekly-update',
    pubDate: '2026-11-14',
    description: '新增文本行号添加 / 剥离与摄影景深计算器，全部零依赖、本地运行。',
  },
];

export const DEFAULT_FEED_META = {
  title: '示例技术博客',
  siteLink: 'https://example.com',
  description: '记录工具开发、前端实践与效率技巧。',
  language: 'zh-CN',
};
