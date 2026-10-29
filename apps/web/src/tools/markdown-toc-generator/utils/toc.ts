/**
 * Markdown 目录（TOC）生成纯函数，不依赖 DOM 与 React。
 * 仅识别 ATX 风格（#）标题，跳过围栏代码块，生成 GitHub 风格锚点目录。
 */

/** 提取到的标题 */
export interface Heading {
  /** 标题层级 1–6 */
  level: number;
  /** 去除首尾 # 与空白后的标题文本（保留行内代码反引号等原始标记） */
  text: string;
  /** 在原文中的行号（从 1 开始） */
  line: number;
}

/** 目录生成选项 */
export interface TocOptions {
  /** true 输出有序列表，false 输出无序列表 */
  ordered: boolean;
  /** 最小标题层级（含），1–6 */
  minLevel: number;
  /** 最大标题层级（含），1–6 */
  maxLevel: number;
  /** 是否生成 GitHub 风格锚点链接 */
  withLinks: boolean;
}

/** 默认选项：无序列表、1–6 级、带锚点 */
export const DEFAULT_TOC_OPTIONS: TocOptions = {
  ordered: false,
  minLevel: 1,
  maxLevel: 6,
  withLinks: true,
};

/**
 * 判断一行是否为围栏代码块边界（``` 或 ~~~，允许行首最多 3 个空格）
 *
 * @param line - 单行文本
 * @returns 围栏字符（` 或 ~）；不是围栏返回 null
 */
function matchFence(line: string): '`' | '~' | null {
  const match = /^ {0,3}(`{3,}|~{3,})/.exec(line);
  if (!match || match[1] === undefined) {
    return null;
  }
  return match[1][0] === '~' ? '~' : '`';
}

/**
 * 去除 ATX 标题行尾的闭合 # 序列：末个 # 序列前须有空格或位于行首
 *
 * @param text - 已去掉开头 # 的文本
 * @returns 去除闭合序列后的文本
 */
function stripClosingSequence(text: string): string {
  return text.replace(/\s+#+\s*$/, '').replace(/^#+\s*$/, '').trim();
}

/**
 * 从 Markdown 文本提取全部 ATX 标题。
 * 规则：行首最多 3 个空格后接 1–6 个 #，# 后须有空格（或标题为空，本期要求空格）；
 * 围栏代码块（``` / ~~~）内的 # 忽略；行首反斜杠转义（\\#）识别为非标题。
 *
 * @param markdown - Markdown 原文
 * @returns 标题列表（按出现顺序）
 */
export function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split(/\r?\n/);
  const headings: Heading[] = [];
  let fenceChar: '`' | '~' | null = null;

  lines.forEach((rawLine, index) => {
    const fence = matchFence(rawLine);
    if (fenceChar === null) {
      if (fence) {
        fenceChar = fence;
        return;
      }
    } else if (fence === fenceChar) {
      fenceChar = null;
      return;
    } else {
      return;
    }

    const line = rawLine.replace(/^ {0,3}/, '');
    if (line.startsWith('\\#')) {
      return;
    }

    const match = /^(#{1,6})(?:[ \t]+(.*))?$/.exec(line);
    if (!match || match[1] === undefined) {
      return;
    }
    // # 后既无空格也无内容时不视为标题（要求 # 后须有空格）
    if (match[2] === undefined && !/[ \t]/.test(line.slice(match[1].length, match[1].length + 1))) {
      return;
    }

    const level = match[1].length;
    const text = stripClosingSequence(match[2] ?? '');
    headings.push({ level, text, line: index + 1 });
  });

  return headings;
}

/**
 * 生成 GitHub 风格锚点：转小写、空格转连字符、删除标点（保留中英文数字与连字符）。
 * 行内代码反引号会被移除。
 *
 * @param text - 标题文本
 * @returns 锚点字符串
 */
export function slugifyHeading(text: string): string {
  return text
    .replace(/`/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\-\s]/gu, '')
    .replace(/\s+/g, '-');
}

/**
 * 由标题列表生成嵌套缩进的目录文本。
 * 同级重复锚点自动追加 -1、-2 后缀；过滤掉层级范围外的标题；无标题返回空字符串。
 *
 * @param headings - 标题列表
 * @param options - 目录选项
 * @returns TOC 文本（行之间以 \\n 连接，无尾换行）；无内容为空字符串
 */
export function generateToc(headings: Heading[], options: TocOptions = DEFAULT_TOC_OPTIONS): string {
  const minLevel = Math.min(Math.max(options.minLevel, 1), 6);
  const maxLevel = Math.max(Math.min(options.maxLevel, 6), minLevel);

  const filtered = headings.filter(
    (heading) => heading.level >= minLevel && heading.level <= maxLevel,
  );
  if (filtered.length === 0) {
    return '';
  }

  const slugCount = new Map<string, number>();
  const orderedCounters = new Map<number, number>();

  const lines = filtered.map((heading) => {
    const indent = '  '.repeat(heading.level - minLevel);
    if (options.ordered) {
      for (const deeperLevel of orderedCounters.keys()) {
        if (deeperLevel > heading.level) {
          orderedCounters.delete(deeperLevel);
        }
      }
    }
    const nextNumber = (orderedCounters.get(heading.level) ?? 0) + 1;
    const bullet = options.ordered ? `${nextNumber}.` : '-';
    if (options.ordered) {
      orderedCounters.set(heading.level, nextNumber);
    }

    const label = heading.text.trim();
    let content = label;
    if (options.withLinks) {
      const slug = slugifyHeading(label);
      const seen = slugCount.get(slug) ?? 0;
      slugCount.set(slug, seen + 1);
      const uniqueSlug = seen === 0 ? slug : `${slug}-${seen}`;
      content = `[${label}](#${uniqueSlug})`;
    }
    return `${indent}${bullet} ${content}`;
  });

  return lines.join('\n');
}

/**
 * 将目录插入原文：存在 &lt;!-- TOC --&gt;…&lt;!-- /TOC --&gt; 标记块时替换其内容，
 * 否则前置到原文开头。
 *
 * @param markdown - Markdown 原文
 * @param toc - 目录文本
 * @returns 插入目录后的全文
 */
export function insertToc(markdown: string, toc: string): string {
  const markerBlock = /<!--\s*TOC\s*-->[\s\S]*?<!--\s*\/TOC\s*-->/;
  const block = `<!-- TOC -->\n${toc}\n<!-- /TOC -->`;
  if (markerBlock.test(markdown)) {
    return markdown.replace(markerBlock, block);
  }
  if (toc === '') {
    return markdown;
  }
  return `${toc}\n\n${markdown}`;
}
