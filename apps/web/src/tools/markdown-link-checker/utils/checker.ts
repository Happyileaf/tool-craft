/**
 * Markdown 静态链接体检纯函数；
 * 仅做文本静态分析，不发起任何网络请求（不探测外链可达性）
 */

/** 链接类型 */
export type MarkdownLinkType =
  | 'inline' // 行内链接 [text](url)
  | 'reference' // 引用式 [text][ref] / [ref][] / [ref]
  | 'definition' // 引用定义 [ref]: url
  | 'autolink' // 自动链接 <http://...> / <mail@x.com>
  | 'bare'; // 裸 URL

/** 链接分类 */
export type LinkCategory = 'external' | 'relative' | 'anchor' | 'mail' | 'other';

/** 问题级别 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/** 提取到的单条链接 */
export interface MarkdownLink {
  /** 行号（从 1 开始） */
  line: number;
  /** 链接类型 */
  type: MarkdownLinkType;
  /** 链接文本（裸链/自动链为 URL 本身） */
  text: string;
  /** 目标地址（引用式链接此处为标签名，见 ref 字段） */
  url: string;
  /** 引用标签（折叠为小写）；仅引用式链接存在 */
  ref?: string;
  /** 是否为图片链接 */
  isImage: boolean;
}

/** 引用定义 */
export interface ReferenceDefinition {
  /** 折叠后的标签名 */
  label: string;
  /** 原始标签 */
  rawLabel: string;
  /** 目标 URL */
  url: string;
  /** 定义所在行 */
  line: number;
}

/** 标题锚点 */
export interface HeadingAnchor {
  /** 行号 */
  line: number;
  /** GitHub 风格 slug */
  slug: string;
  /** 标题原文 */
  text: string;
}

/** 单条问题 */
export interface LinkIssue {
  /** 行号 */
  line: number;
  /** 级别 */
  severity: IssueSeverity;
  /** 问题代码 */
  code:
    | 'undefined-reference'
    | 'unused-definition'
    | 'duplicate-definition'
    | 'broken-anchor';
  /** 人类可读说明 */
  message: string;
}

/** 分类计数 */
export interface LinkCounts {
  external: number;
  relative: number;
  anchor: number;
  mail: number;
  other: number;
}

/** 完整检查结果 */
export interface MarkdownCheckResult {
  links: MarkdownLink[];
  definitions: ReferenceDefinition[];
  headings: HeadingAnchor[];
  issues: LinkIssue[];
  counts: LinkCounts;
}

/** 围栏代码块边界正则（``` 或 ~~~，可选语言标识） */
const FENCE_PATTERN = /^(\s{0,3})(`{3,}|~{3,})/;
/** 引用定义：[label]: url，可选标题 */
const DEFINITION_PATTERN = /^\s{0,3}\[([^\]]+)]:\s*(\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/;
/** ATX 标题 */
const ATX_HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
/** Setext 标题下划线 */
const SETEXT_PATTERN = /^\s{0,3}(=+|-+)\s*$/;
/** 行内/图片链接 [text](url "title") */
const INLINE_LINK_PATTERN = /(!?)\[([^\]]*)]\(\s*([^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
/** 完整引用 [text][ref] 与紧凑引用 [ref][] */
const FULL_REFERENCE_PATTERN = /(!?)\[([^\]]*)]\[([^\]]*)]/g;
/** 简写引用 [ref]（需存在同名定义才算链接） */
const SHORT_REFERENCE_PATTERN = /(!?)\[([^\]]+)]/g;
/** 自动链接 <http://...> 或 <mail@x.com> */
const AUTOLINK_PATTERN = /<((?:https?|mailto):[^>\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;
/** 裸 URL */
const BARE_URL_PATTERN = /(^|[\s(])(https?:\/\/[^\s<>)\]]+)/g;
/** 行内代码片段（含转义反引号情形由重复反引号组处理） */
const INLINE_CODE_PATTERN = /`+[^`]*`+/g;

/**
 * 按 GitHub 规则生成标题 slug：
 * 转小写、去除字母数字/连字符/下划线/空白/中文等之外的字符、空白转连字符
 *
 * @param heading - 标题原文
 * @returns GitHub 风格锚点 slug
 */
export function githubSlug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*~]/g, '') // 去除常见行内标记符号（保留下划线，GitHub slug 允许 _）
    // 保留 Unicode 字母数字（含中文）、下划线、空白与连字符
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * 折叠引用标签：CommonMark 规则为小写并压缩连续空白
 *
 * @param label - 原始标签
 * @returns 折叠后的标签
 */
function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * 按 URL 形态分类链接
 *
 * @param url - 目标地址
 * @returns 链接分类
 */
function classifyUrl(url: string): LinkCategory {
  if (url.startsWith('#')) {
    return 'anchor';
  }
  if (url.startsWith('mailto:') || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url)) {
    return 'mail';
  }
  if (/^https?:\/\//i.test(url)) {
    return 'external';
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    // 其他协议（ftp、tel 等）不归入四类主计数
    return 'other';
  }
  return 'relative';
}

/**
 * 去除行内代码片段，避免代码中的类链接文本被误提取
 *
 * @param line - 原始行
 * @returns 用等长空白替换行内代码后的安全文本
 */
function maskInlineCode(line: string): string {
  return line.replace(INLINE_CODE_PATTERN, (match) => ' '.repeat(match.length));
}

/**
 * 对 Markdown 文本执行静态链接体检
 *
 * @param markdown - 原始 Markdown 文档
 * @returns 链接、定义、标题、问题清单与分类计数
 */
export function checkMarkdownLinks(markdown: string): MarkdownCheckResult {
  const lines = markdown.split(/\r?\n/);
  const links: MarkdownLink[] = [];
  const definitions: ReferenceDefinition[] = [];
  const headings: HeadingAnchor[] = [];
  const issues: LinkIssue[] = [];

  let inFence = false;
  let fenceMarker = '';
  let previousTextLine = '';

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const fenceMatch = FENCE_PATTERN.exec(rawLine);
    if (fenceMatch) {
      const marker = fenceMatch[2]!;
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0]!;
      } else if (marker[0] === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      return;
    }
    if (inFence) {
      return;
    }

    // 引用定义优先识别（整行结构）
    const definitionMatch = DEFINITION_PATTERN.exec(rawLine);
    if (definitionMatch) {
      const label = normalizeLabel(definitionMatch[1]!);
      definitions.push({
        label,
        rawLabel: definitionMatch[1]!,
        url: definitionMatch[2]!,
        line: lineNo,
      });
      links.push({
        line: lineNo,
        type: 'definition',
        text: definitionMatch[1]!,
        url: definitionMatch[2]!,
        isImage: false,
      });
      previousTextLine = rawLine;
      return;
    }

    // 标题收集（ATX 与 Setext）
    const atxMatch = ATX_HEADING_PATTERN.exec(rawLine);
    if (atxMatch) {
      const text = atxMatch[2]!;
      headings.push({ line: lineNo, slug: githubSlug(text), text });
    } else if (
      SETEXT_PATTERN.test(rawLine) &&
      previousTextLine.trim() !== '' &&
      !FENCE_PATTERN.test(previousTextLine)
    ) {
      const text = previousTextLine.trim();
      headings.push({ line: index, slug: githubSlug(text), text });
    }

    const safeLine = maskInlineCode(rawLine);

    // 1. 行内链接
    let inlineMatch: RegExpExecArray | null;
    INLINE_LINK_PATTERN.lastIndex = 0;
    while ((inlineMatch = INLINE_LINK_PATTERN.exec(safeLine)) !== null) {
      links.push({
        line: lineNo,
        type: 'inline',
        text: inlineMatch[2]!,
        url: inlineMatch[3]!,
        isImage: inlineMatch[1] === '!',
      });
    }

    // 2. 完整/紧凑引用 [text][ref]、[ref][]
    let fullRefMatch: RegExpExecArray | null;
    FULL_REFERENCE_PATTERN.lastIndex = 0;
    while ((fullRefMatch = FULL_REFERENCE_PATTERN.exec(safeLine)) !== null) {
      const text = fullRefMatch[2]!;
      const refPart = fullRefMatch[3]!;
      const label = normalizeLabel(refPart === '' ? text : refPart);
      links.push({
        line: lineNo,
        type: 'reference',
        text: refPart === '' ? text : text,
        url: label,
        ref: label,
        isImage: fullRefMatch[1] === '!',
      });
    }

    // 3. 简写引用 [ref]（排除已被完整引用与行内链接消费的片段）
    const strippedForShort = safeLine
      .replace(FULL_REFERENCE_PATTERN, (match) => ' '.repeat(match.length))
      .replace(INLINE_LINK_PATTERN, (match) => ' '.repeat(match.length));
    let shortMatch: RegExpExecArray | null;
    SHORT_REFERENCE_PATTERN.lastIndex = 0;
    while ((shortMatch = SHORT_REFERENCE_PATTERN.exec(strippedForShort)) !== null) {
      const label = normalizeLabel(shortMatch[2]!);
      links.push({
        line: lineNo,
        type: 'reference',
        text: shortMatch[2]!,
        url: label,
        ref: label,
        isImage: shortMatch[1] === '!',
      });
    }

    // 4. 自动链接
    let autoMatch: RegExpExecArray | null;
    AUTOLINK_PATTERN.lastIndex = 0;
    while ((autoMatch = AUTOLINK_PATTERN.exec(safeLine)) !== null) {
      const target = autoMatch[1]!;
      links.push({
        line: lineNo,
        type: 'autolink',
        text: target,
        url: target.includes('@') && !target.startsWith('mailto:') ? `mailto:${target}` : target,
        isImage: false,
      });
    }

    // 5. 裸 URL（排除已被自动链接尖括号包裹与行内链接消费的部分）
    const strippedForBare = safeLine
      .replace(AUTOLINK_PATTERN, (match) => ' '.repeat(match.length))
      .replace(INLINE_LINK_PATTERN, (match) => ' '.repeat(match.length));
    let bareMatch: RegExpExecArray | null;
    BARE_URL_PATTERN.lastIndex = 0;
    while ((bareMatch = BARE_URL_PATTERN.exec(strippedForBare)) !== null) {
      const target = bareMatch[2]!.replace(/[.,;:!?)]+$/, '');
      links.push({
        line: lineNo,
        type: 'bare',
        text: target,
        url: target,
        isImage: false,
      });
    }

    previousTextLine = rawLine;
  });

  // 引用一致性检查
  const definitionMap = new Map<string, ReferenceDefinition[]>();
  definitions.forEach((definition) => {
    const list = definitionMap.get(definition.label) ?? [];
    list.push(definition);
    definitionMap.set(definition.label, list);
  });
  definitionMap.forEach((list) => {
    list.slice(1).forEach((dup) => {
      issues.push({
        line: dup.line,
        severity: 'error',
        code: 'duplicate-definition',
        message: `引用标签「${dup.rawLabel}」重复定义，首次定义位于第 ${list[0]!.line} 行`,
      });
    });
  });

  const referenceUsages = links.filter((link) => link.type === 'reference');
  const usedLabels = new Set<string>();
  referenceUsages.forEach((link) => {
    const label = link.ref!;
    usedLabels.add(label);
    if (!definitionMap.has(label)) {
      issues.push({
        line: link.line,
        severity: 'error',
        code: 'undefined-reference',
        message: `引用标签「${link.text}」已使用但未定义`,
      });
    }
  });
  definitions.forEach((definition) => {
    if (!usedLabels.has(definition.label)) {
      issues.push({
        line: definition.line,
        severity: 'warning',
        code: 'unused-definition',
        message: `引用标签「${definition.rawLabel}」已定义但从未使用`,
      });
    }
  });

  // 锚点校验
  const slugSet = new Set(headings.map((heading) => heading.slug));
  links
    .filter((link) => link.type === 'inline' || link.type === 'autolink' || link.type === 'bare')
    .forEach((link) => {
      const hashIndex = link.url.indexOf('#');
      if (hashIndex === -1) {
        return;
      }
      const pathPart = link.url.slice(0, hashIndex);
      const anchor = link.url.slice(hashIndex + 1);
      // 仅校验页内锚点（无路径部分或路径就是当前文档）与纯 # 锚点
      if (pathPart !== '' || anchor === '') {
        return;
      }
      if (!slugSet.has(anchor)) {
        issues.push({
          line: link.line,
          severity: 'error',
          code: 'broken-anchor',
          message: `页内锚点「#${anchor}」在文档标题中不存在`,
        });
      }
    });

  // 分类计数（定义行不计入使用计数；简写引用若未定义仍按引用处理，不计 URL 分类）
  const counts: LinkCounts = { external: 0, relative: 0, anchor: 0, mail: 0, other: 0 };
  links
    .filter((link) => link.type !== 'definition' && link.type !== 'reference')
    .forEach((link) => {
      counts[classifyUrl(link.url)] += 1;
    });

  issues.sort((a, b) => a.line - b.line);
  return { links, definitions, headings, issues, counts };
}
