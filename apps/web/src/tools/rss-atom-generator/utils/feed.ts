/** RSS 2.0 / Atom 1.0 文档生成的核心纯函数 */

export type FeedFormat = 'rss' | 'atom';

export interface FeedItemInput {
  /** 条目标题 */
  title: string;
  /** 条目链接，需为绝对 URL */
  link: string;
  /** 发布时间，支持 ISO 8601、YYYY-MM-DD 或 RFC 822 */
  pubDate: string;
  /** 条目摘要 */
  description: string;
}

export interface FeedOptions {
  format: FeedFormat;
  /** 站点标题 */
  title: string;
  /** 站点链接 */
  siteLink: string;
  /** 站点描述 */
  description: string;
  /** 语言代码 */
  language?: string;
  /** Feed 更新时间，Atom 必填；缺省时取最新条目时间 */
  updatedAt?: string;
  items: FeedItemInput[];
}

/** 转义 XML 文本与属性中的保留字符 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 解析宽松日期输入，支持 YYYY-MM-DD、ISO 8601 与 RFC 822
 */
export function parseFeedDate(input: string): Date | null {
  const value = input.trim();
  if (value === '') {
    return null;
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    const roundTrip =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    return roundTrip && !Number.isNaN(date.getTime()) ? date : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function assertAbsoluteUrl(value: string, field: string): void {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`${field}需为 http/https 绝对链接`);
    }
  } catch {
    throw new Error(`${field}需为合法的 http/https 绝对链接`);
  }
}

function validate(options: FeedOptions): void {
  if (options.title.trim() === '') {
    throw new Error('站点标题不能为空');
  }
  assertAbsoluteUrl(options.siteLink.trim(), '站点链接');
  options.items.forEach((item, index) => {
    const position = `第 ${index + 1} 个条目`;
    if (item.title.trim() === '') {
      throw new Error(`${position}标题不能为空`);
    }
    assertAbsoluteUrl(item.link.trim(), `${position}链接`);
    if (parseFeedDate(item.pubDate) === null) {
      throw new Error(`${position}发布时间无法解析，请使用 ISO 8601、YYYY-MM-DD 或 RFC 822`);
    }
  });
}

/** 计算 feed 级更新时间：显式值优先，否则取最新条目时间 */
function resolveUpdatedAt(options: FeedOptions): Date | null {
  if (options.updatedAt && options.updatedAt.trim() !== '') {
    const parsed = parseFeedDate(options.updatedAt);
    if (parsed === null) {
      throw new Error('Feed 更新时间无法解析');
    }
    return parsed;
  }
  const timestamps = options.items
    .map((item) => parseFeedDate(item.pubDate)?.getTime() ?? 0)
    .filter((value) => value > 0);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
}

/**
 * 生成 RSS 2.0 或 Atom 1.0 XML 文档
 */
export function buildFeed(options: FeedOptions): string {
  validate(options);
  return options.format === 'atom' ? buildAtom(options) : buildRss(options);
}

function buildRss(options: FeedOptions): string {
  const updatedAt = resolveUpdatedAt(options);
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(options.title.trim())}</title>`,
    `    <link>${escapeXml(options.siteLink.trim())}</link>`,
    `    <description>${escapeXml(options.description.trim())}</description>`,
  ];
  if (options.language && options.language.trim() !== '') {
    lines.push(`    <language>${escapeXml(options.language.trim())}</language>`);
  }
  lines.push(
    `    <atom:link href="${escapeXml(options.siteLink.trim())}" rel="self" type="application/rss+xml"/>`,
  );
  if (updatedAt) {
    lines.push(`    <lastBuildDate>${updatedAt.toUTCString()}</lastBuildDate>`);
  }
  options.items.forEach((item) => {
    const pubDate = parseFeedDate(item.pubDate) as Date;
    const link = item.link.trim();
    lines.push(
      '    <item>',
      `      <title>${escapeXml(item.title.trim())}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${pubDate.toUTCString()}</pubDate>`,
      `      <description>${escapeXml(item.description.trim())}</description>`,
      '    </item>',
    );
  });
  lines.push('  </channel>', '</rss>');
  return lines.join('\n');
}

function buildAtom(options: FeedOptions): string {
  const updatedAt = resolveUpdatedAt(options);
  if (updatedAt === null) {
    throw new Error('Atom 输出需要填写 Feed 更新时间或至少一个条目');
  }
  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(options.title.trim())}</title>`,
    `  <subtitle>${escapeXml(options.description.trim())}</subtitle>`,
    `  <link href="${escapeXml(options.siteLink.trim())}"/>`,
    `  <id>${escapeXml(options.siteLink.trim())}</id>`,
    `  <updated>${updatedAt.toISOString()}</updated>`,
  ];
  if (options.language && options.language.trim() !== '') {
    lines.push(`  <language>${escapeXml(options.language.trim())}</language>`);
  }
  options.items.forEach((item) => {
    const updated = parseFeedDate(item.pubDate) as Date;
    const link = item.link.trim();
    lines.push(
      '  <entry>',
      `    <title>${escapeXml(item.title.trim())}</title>`,
      `    <link href="${escapeXml(link)}"/>`,
      `    <id>${escapeXml(link)}</id>`,
      `    <updated>${updated.toISOString()}</updated>`,
      `    <summary>${escapeXml(item.description.trim())}</summary>`,
      '  </entry>',
    );
  });
  lines.push('</feed>');
  return lines.join('\n');
}
