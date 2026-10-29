/**
 * sitemap.xml 生成与校验纯函数，不依赖 DOM 与 React。
 * 由 URL 清单与全局 lastmod / changefreq / priority 默认值生成
 * 符合 sitemaps.org 协议的 urlset XML，文本节点做 XML 转义。
 */

/** 单文件 sitemap URL 数量上限（sitemaps.org 协议） */
export const MAX_URLS = 50000;

/** 合法的 changefreq 取值 */
export const CHANGEFREQ_VALUES = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
] as const;

/** 全局默认选项 */
export interface SitemapOptions {
  /** 最后修改日期（YYYY-MM-DD 或完整日期时间），空字符串表示省略 */
  lastmod: string;
  /** 更新频率，空字符串表示省略 */
  changefreq: string;
  /** 优先级（0.0–1.0），空字符串表示省略 */
  priority: string;
}

/** 非法 URL 条目 */
export interface InvalidUrl {
  /** 基于原始输入的行号（从 1 开始，空行不计入） */
  line: number;
  /** 原始 URL 文本 */
  url: string;
  /** 错误原因 */
  reason: string;
}

/** 生成结果 */
export interface SitemapResult {
  /** 生成的 XML 文本；无有效 URL 时为空字符串 */
  xml: string;
  /** 非法 URL 列表 */
  invalid: InvalidUrl[];
  /** 实际写入的 URL 数量 */
  count: number;
  /** URL 总数是否超出单文件 50000 上限 */
  exceedsLimit: boolean;
}

/**
 * XML 文本节点转义：& < > 以及 " '
 *
 * @param value - 原始文本
 * @returns 转义后的文本
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 将 URL 多行文本拆分为数组：逐行 trim、丢弃空行
 *
 * @param text - 原始多行文本
 * @returns URL 原始文本数组
 */
export function parseUrlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/**
 * 校验单个 URL：必须是 http(s) 协议的合法 URL
 *
 * @param raw - 原始 URL 文本
 * @returns 错误原因；合法为 null
 */
export function validateUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return '不是合法的 URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return '必须以 http:// 或 https:// 开头';
  }
  return null;
}

/**
 * 校验 priority：空字符串合法（省略），否则须为 0.0–1.0 的数字
 *
 * @param value - priority 文本
 * @returns 错误原因；合法为 null
 */
export function validatePriority(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    return 'priority 必须是 0.0 到 1.0 之间的数字';
  }
  return null;
}

/**
 * 校验 changefreq：空字符串合法（省略），否则须为协议枚举值
 *
 * @param value - changefreq 文本
 * @returns 错误原因；合法为 null
 */
export function validateChangefreq(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  if (!(CHANGEFREQ_VALUES as readonly string[]).includes(trimmed)) {
    return `changefreq 必须是 ${CHANGEFREQ_VALUES.join(' / ')} 之一`;
  }
  return null;
}

/**
 * 由 URL 清单与全局选项生成 sitemap.xml。
 * 非法 URL 计入 invalid 并跳过；超过 50000 的部分不写入且 exceedsLimit 为 true。
 *
 * @param urlText - URL 多行文本
 * @param options - 全局 lastmod / changefreq / priority
 * @returns 生成结果
 */
export function generateSitemap(urlText: string, options: SitemapOptions): SitemapResult {
  const lines = parseUrlLines(urlText);
  const invalid: InvalidUrl[] = [];
  const valid: string[] = [];

  lines.forEach((raw, index) => {
    const reason = validateUrl(raw);
    if (reason) {
      invalid.push({ line: index + 1, url: raw, reason });
    } else {
      valid.push(raw);
    }
  });

  const exceedsLimit = valid.length > MAX_URLS;
  const included = exceedsLimit ? valid.slice(0, MAX_URLS) : valid;

  const priorityError = validatePriority(options.priority);
  const priority = priorityError ? '' : options.priority.trim();
  const changefreqError = validateChangefreq(options.changefreq);
  const changefreq = changefreqError ? '' : options.changefreq.trim();
  const lastmod = options.lastmod.trim();

  const entries = included.map((url) => {
    const body: string[] = [`  <url>`, `    <loc>${escapeXml(url)}</loc>`];
    if (lastmod !== '') {
      body.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
    }
    if (changefreq !== '') {
      body.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
    }
    if (priority !== '') {
      body.push(`    <priority>${escapeXml(priority)}</priority>`);
    }
    body.push(`  </url>`);
    return body.join('\n');
  });

  const xml =
    entries.length === 0
      ? ''
      : [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          entries.join('\n'),
          '</urlset>',
        ].join('\n');

  return { xml, invalid, count: entries.length, exceedsLimit };
}
