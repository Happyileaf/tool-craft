/**
 * 零依赖 SEO / Open Graph / Twitter Card 元标签生成纯函数。
 * 依据表单字段拼装可直接粘贴到 <head> 的 HTML 片段，
 * 并对必填项、URL、长度建议等做本地校验。全部本地运行。
 */

/** Twitter 卡片类型 */
export type TwitterCardType = 'summary' | 'summary_large_image' | 'app' | 'player';

/** og:type 类型 */
export type OgType =
  | 'website'
  | 'article'
  | 'profile'
  | 'book'
  | 'music.song'
  | 'video.movie';

/** 元标签表单输入 */
export interface MetaInput {
  /** 页面标题（<title> 与 og:title / twitter:title） */
  title: string;
  /** meta description / og:description / twitter:description */
  description: string;
  /** 规范链接 canonical，同时作为 og:url 与分享链接 */
  url: string;
  /** 站点名称 og:site_name */
  siteName: string;
  /** og:type */
  ogType: OgType;
  /** og:locale，如 zh_CN */
  locale: string;
  /** 分享图 URL（og:image / twitter:image） */
  imageUrl: string;
  /** 分享图替代文字 og:image:alt */
  imageAlt: string;
  /** 分享图宽（像素，可空） */
  imageWidth: string;
  /** 分享图高（像素，可空） */
  imageHeight: string;
  /** Twitter Card 类型 */
  twitterCard: TwitterCardType;
  /** Twitter @site 账号（可含或不含 @） */
  twitterSite: string;
  /** Twitter @creator 账号 */
  twitterCreator: string;
  /** meta keywords，逗号分隔 */
  keywords: string;
  /** meta author */
  author: string;
  /** meta robots 指令，逗号分隔；为空则不输出 */
  robots: string;
}

/** 校验问题级别 */
export type IssueLevel = 'error' | 'warning';

/** 单条校验问题 */
export interface MetaIssue {
  level: IssueLevel;
  message: string;
}

/** 生成结果 */
export interface MetaResult {
  /** 可粘贴的 HTML 片段 */
  html: string;
  /** 校验问题 */
  issues: MetaIssue[];
}

/** title 建议长度上限（Google 通常 ~60 字符） */
export const TITLE_RECOMMENDED_MAX = 60;
/** description 建议长度上限 */
export const DESCRIPTION_RECOMMENDED_MAX = 160;

/**
 * 去掉输入两端空白
 */
function clean(value: string): string {
  return value.trim();
}

/**
 * 粗略校验 http(s) 绝对 URL
 *
 * @param value - 待校验文本
 * @returns 是否为 http(s) URL
 */
export function isHttpUrl(value: string): boolean {
  if (value.length === 0) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * HTML 属性值转义（属性均使用双引号包裹）
 *
 * @param value - 原始文本
 * @returns 可安全放入双引号属性的文本
 */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 生成一个 <meta name=... content=...> 行 */
function metaName(name: string, content: string): string {
  return `<meta name="${name}" content="${escapeHtmlAttribute(content)}">`;
}

/** 生成一个 <meta property=... content=...> 行 */
function metaProperty(property: string, content: string): string {
  return `<meta property="${property}" content="${escapeHtmlAttribute(content)}">`;
}

/**
 * 归一化 Twitter 账号：去掉前导 @ 与空白
 *
 * @param value - 原始输入
 * @returns 形如 @name 的账号；空串返回空串
 */
export function normalizeTwitterHandle(value: string): string {
  const trimmed = clean(value).replace(/^@+/, '');
  return trimmed === '' ? '' : `@${trimmed}`;
}

/**
 * 校验表单输入
 *
 * @param input - 表单字段
 * @returns 错误与警告列表
 */
export function validateMetaInput(input: MetaInput): MetaIssue[] {
  const issues: MetaIssue[] = [];
  const title = clean(input.title);
  const description = clean(input.description);
  const url = clean(input.url);

  if (title === '') {
    issues.push({ level: 'error', message: '标题（title）不能为空' });
  } else if (title.length > TITLE_RECOMMENDED_MAX) {
    issues.push({
      level: 'warning',
      message: `标题长度 ${title.length} 字符，超过建议的 ${TITLE_RECOMMENDED_MAX} 字符，搜索结果可能被截断`,
    });
  }

  if (description === '') {
    issues.push({ level: 'error', message: '描述（description）不能为空' });
  } else if (description.length > DESCRIPTION_RECOMMENDED_MAX) {
    issues.push({
      level: 'warning',
      message: `描述长度 ${description.length} 字符，超过建议的 ${DESCRIPTION_RECOMMENDED_MAX} 字符`,
    });
  }

  if (url === '') {
    issues.push({ level: 'error', message: '页面 URL（canonical / og:url）不能为空' });
  } else if (!isHttpUrl(url)) {
    issues.push({ level: 'error', message: `页面 URL 不是合法的 http(s) 绝对地址：${url}` });
  }

  const imageUrl = clean(input.imageUrl);
  if (imageUrl !== '' && !isHttpUrl(imageUrl)) {
    issues.push({ level: 'error', message: `分享图 URL 不是合法的 http(s) 绝对地址：${imageUrl}` });
  }

  const imageAlt = clean(input.imageAlt);
  if (imageUrl !== '' && imageAlt === '') {
    issues.push({ level: 'warning', message: '建议为分享图填写 og:image:alt 替代文字，便于无障碍与加载失败场景' });
  }

  for (const [label, raw] of [
    ['图片宽度', input.imageWidth],
    ['图片高度', input.imageHeight],
  ] as const) {
    const value = clean(raw);
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) <= 0)) {
      issues.push({ level: 'error', message: `${label}必须是正整数像素值，当前为「${value}」` });
    }
  }

  // 大图卡片却没有图时提示
  if (input.twitterCard === 'summary_large_image' && imageUrl === '') {
    issues.push({ level: 'warning', message: 'Twitter 大图卡片（summary_large_image）需要填写分享图 URL 才能正常呈现' });
  }

  return issues;
}

/**
 * 按输入生成完整的 head 元标签 HTML 片段。
 * 空字段对应的标签不输出；存在 error 时仍尽力生成（由调用方决定是否展示）。
 *
 * @param input - 表单字段
 * @returns HTML 片段与校验问题
 */
export function generateMetaTags(input: MetaInput): MetaResult {
  const issues = validateMetaInput(input);
  const lines: string[] = [];

  const title = clean(input.title);
  const description = clean(input.description);
  const url = clean(input.url);
  const siteName = clean(input.siteName);
  const locale = clean(input.locale).replace('-', '_');
  const imageUrl = clean(input.imageUrl);
  const imageAlt = clean(input.imageAlt);
  const imageWidth = clean(input.imageWidth);
  const imageHeight = clean(input.imageHeight);
  const keywords = clean(input.keywords);
  const author = clean(input.author);
  const robots = clean(input.robots);
  const twitterSite = normalizeTwitterHandle(input.twitterSite);
  const twitterCreator = normalizeTwitterHandle(input.twitterCreator);

  if (title !== '') {
    lines.push(`<title>${escapeHtmlAttribute(title)}</title>`);
  }
  if (description !== '') {
    lines.push(metaName('description', description));
  }
  if (keywords !== '') {
    lines.push(metaName('keywords', keywords));
  }
  if (author !== '') {
    lines.push(metaName('author', author));
  }
  if (robots !== '') {
    lines.push(metaName('robots', robots));
  }
  if (isHttpUrl(url)) {
    lines.push(`<link rel="canonical" href="${escapeHtmlAttribute(url)}">`);
  }

  // Open Graph
  if (title !== '') {
    lines.push(metaProperty('og:title', title));
  }
  if (description !== '') {
    lines.push(metaProperty('og:description', description));
  }
  if (isHttpUrl(url)) {
    lines.push(metaProperty('og:url', url));
  }
  lines.push(metaProperty('og:type', input.ogType));
  if (siteName !== '') {
    lines.push(metaProperty('og:site_name', siteName));
  }
  if (locale !== '') {
    lines.push(metaProperty('og:locale', locale));
  }
  if (isHttpUrl(imageUrl)) {
    lines.push(metaProperty('og:image', imageUrl));
    if (imageAlt !== '') {
      lines.push(metaProperty('og:image:alt', imageAlt));
    }
    if (/^\d+$/.test(imageWidth) && Number(imageWidth) > 0) {
      lines.push(metaProperty('og:image:width', imageWidth));
    }
    if (/^\d+$/.test(imageHeight) && Number(imageHeight) > 0) {
      lines.push(metaProperty('og:image:height', imageHeight));
    }
  }

  // Twitter Card
  lines.push(metaName('twitter:card', input.twitterCard));
  if (title !== '') {
    lines.push(metaName('twitter:title', title));
  }
  if (description !== '') {
    lines.push(metaName('twitter:description', description));
  }
  if (isHttpUrl(imageUrl)) {
    lines.push(metaName('twitter:image', imageUrl));
  }
  if (twitterSite !== '') {
    lines.push(metaName('twitter:site', twitterSite));
  }
  if (twitterCreator !== '') {
    lines.push(metaName('twitter:creator', twitterCreator));
  }

  return { html: lines.join('\n'), issues };
}
