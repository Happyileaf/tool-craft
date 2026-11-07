/**
 * Conventional Commits → Keep a Changelog 1.1.0 片段生成的纯函数实现。
 *
 * 规范参考：
 * - Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
 * - Keep a Changelog 1.1.0: https://keepachangelog.com/en/1.1.0/
 *
 * 本模块只做字符串解析与模板拼接，不触碰 DOM / React，零运行时依赖。
 */

/** Keep a Changelog 标准分组（输出顺序固定） */
export type ChangelogSection =
  | 'added'
  | 'changed'
  | 'deprecated'
  | 'removed'
  | 'fixed'
  | 'security';

/** 单条提交解析结果 */
export interface ParsedCommit {
  /** 原始行（已去首尾空白） */
  raw: string;
  /** 提交类型，未知类型为 null */
  type: string | null;
  /** 作用域，缺省为 null */
  scope: string | null;
  /** 是否带 ! 破坏性标记 */
  breaking: boolean;
  /** 主题（subject） */
  subject: string;
}

/** 生成器选项 */
export interface ChangelogOptions {
  /** 版本号标题，留空则输出 Unreleased */
  version: string;
  /** 发布日期 YYYY-MM-DD，留空则不输出日期 */
  date: string;
  /** 条目是否带作用域前缀 */
  includeScope: boolean;
  /** 是否收录内部类型（style/test/build/ci/chore）到 Changed */
  includeInternal: boolean;
  /** 是否输出 Keep a Changelog 文档头（标题与链接说明） */
  includeHeader: boolean;
}

/** 分组解析统计 */
export interface ChangelogStats {
  /** 输入的非空行数 */
  totalLines: number;
  /** 成功解析的提交条数 */
  parsedCount: number;
  /** 无法识别的行数 */
  unrecognizedCount: number;
  /** 被合并/回滚等跳过的提交数 */
  skippedCount: number;
  /** 破坏性变更条数 */
  breakingCount: number;
}

/** 生成结果 */
export interface ChangelogResult {
  /** 渲染后的 Markdown 文本 */
  markdown: string;
  /** 解析出的全部提交（按输入顺序） */
  commits: ParsedCommit[];
  /** 无法识别或被跳过的原始行 */
  unrecognizedLines: string[];
  /** 统计信息 */
  stats: ChangelogStats;
}

/** Conventional Commits 常用类型 */
export const KNOWN_TYPES = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'docs',
  'style',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'security',
] as const;

/** Keep a Changelog 分组的输出标题 */
export const SECTION_TITLES: Record<ChangelogSection, string> = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
  security: 'Security',
};

/** 分组输出顺序（Keep a Changelog 1.1.0 推荐顺序） */
export const SECTION_ORDER: ChangelogSection[] = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
];

/** 安全相关主题关键词（小写匹配） */
const SECURITY_KEYWORDS = [
  'security',
  'vulnerability',
  'cve-',
  'xss',
  'csrf',
  'sqli',
  'injection',
  'auth bypass',
  'privilege escalation',
  '安全',
  '漏洞',
];

/** 弃用相关主题关键词 */
const DEPRECATED_KEYWORDS = ['deprecate', 'deprecated', 'deprecation', '弃用', '废弃'];

/** 移除相关主题关键词 */
const REMOVED_KEYWORDS = ['remove ', 'removal', 'delete ', 'drop support', '移除', '删除'];

const HEADER_PATTERN = /^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/;

const MERGE_PATTERN = /^(merge\b|revert\s+merge\b)/i;

/**
 * 解析单行提交信息。支持可选的短哈希前缀（如 `a1b2c3d feat: ...`，
 * 即 git log --oneline 输出），合并提交返回 null。
 *
 * @param line - 原始一行文本
 * @returns 解析结果；无法识别或应跳过时返回 null
 */
export function parseCommitLine(line: string): ParsedCommit | null {
  const raw = line.trim();
  if (!raw) {
    return null;
  }
  if (MERGE_PATTERN.test(raw)) {
    return null;
  }
  const withoutHash = raw.replace(/^[0-9a-f]{4,40}\s+/i, '');
  const match = HEADER_PATTERN.exec(withoutHash);
  if (!match) {
    return null;
  }
  const type = (match[1] ?? '').toLowerCase();
  const scope = (match[2] ?? '').trim() || null;
  const subject = (match[4] ?? '').trim();
  if (!subject) {
    return null;
  }
  return {
    raw,
    type,
    scope,
    breaking: match[3] === '!',
    subject,
  };
}

/**
 * 判断主题是否命中任一关键词集合。
 *
 * @param subject - 提交主题
 * @param keywords - 关键词集合
 * @returns 是否命中
 */
function matchesKeyword(subject: string, keywords: string[]): boolean {
  const lower = subject.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

/**
 * 按 Conventional Commits 类型与主题语义决定 Keep a Changelog 分组。
 *
 * @param commit - 已解析提交
 * @returns 分组；内部类型且不收录时返回 null
 */
export function classifyCommit(
  commit: ParsedCommit,
  includeInternal: boolean,
): ChangelogSection | null {
  if (matchesKeyword(commit.subject, SECURITY_KEYWORDS) || commit.type === 'security') {
    return 'security';
  }
  if (matchesKeyword(commit.subject, DEPRECATED_KEYWORDS)) {
    return 'deprecated';
  }
  if (matchesKeyword(commit.subject, REMOVED_KEYWORDS)) {
    return 'removed';
  }
  switch (commit.type) {
    case 'feat':
      return 'added';
    case 'fix':
      return 'fixed';
    case 'perf':
    case 'refactor':
    case 'docs':
    case 'revert':
      return 'changed';
    case 'style':
    case 'test':
    case 'build':
    case 'ci':
    case 'chore':
      return includeInternal ? 'changed' : null;
    default:
      return null;
  }
}

/**
 * 把单条提交渲染为 Markdown 条目文本。
 *
 * @param commit - 已解析提交
 * @param includeScope - 是否输出作用域前缀
 * @returns `- ` 开头的条目行
 */
export function renderEntry(commit: ParsedCommit, includeScope: boolean): string {
  const scopePart =
    includeScope && commit.scope ? `**${commit.scope}:** ` : '';
  const breakingPart = commit.breaking ? 'BREAKING CHANGE: ' : '';
  return `- ${scopePart}${breakingPart}${commit.subject}`;
}

/**
 * 校验日期字符串是否为合法 YYYY-MM-DD 且为真实日历日期。
 *
 * @param value - 待校验文本
 * @returns 合法返回 true
 */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * 渲染版本标题行。
 *
 * @param options - 生成器选项
 * @returns `## [1.2.0] - 2026-11-08` 形式的标题
 */
function renderVersionHeading(options: ChangelogOptions): string {
  const version = options.version.trim();
  const title = version ? `[${version}]` : 'Unreleased';
  const date = options.date.trim();
  return date ? `## ${title} - ${date}` : `## ${title}`;
}

/**
 * 解析整段提交文本。
 *
 * @param input - 多行提交信息
 * @returns 提交列表、未识别行与统计
 */
export function parseCommitInput(input: string): {
  commits: ParsedCommit[];
  unrecognizedLines: string[];
  stats: ChangelogStats;
} {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const commits: ParsedCommit[] = [];
  const unrecognizedLines: string[] = [];
  let skippedCount = 0;

  for (const line of lines) {
    const parsed = parseCommitLine(line);
    if (parsed) {
      commits.push(parsed);
    } else if (MERGE_PATTERN.test(line)) {
      skippedCount += 1;
    } else {
      unrecognizedLines.push(line);
    }
  }

  const stats: ChangelogStats = {
    totalLines: lines.length,
    parsedCount: commits.length,
    unrecognizedCount: unrecognizedLines.length,
    skippedCount,
    breakingCount: commits.filter((commit) => commit.breaking).length,
  };
  return { commits, unrecognizedLines, stats };
}

/**
 * 主入口：把一批 Conventional Commits 提交信息渲染为 Keep a Changelog 片段。
 *
 * @param input - 多行提交信息（可含 git oneline 短哈希）
 * @param options - 版本、日期与收录选项
 * @returns Markdown 文本、解析明细与统计
 */
export function generateChangelog(
  input: string,
  options: ChangelogOptions,
): ChangelogResult {
  const { commits, unrecognizedLines, stats } = parseCommitInput(input);
  const groups = new Map<ChangelogSection, ParsedCommit[]>();
  const breakingCommits: ParsedCommit[] = [];

  for (const commit of commits) {
    if (commit.breaking) {
      breakingCommits.push(commit);
    }
    const section = classifyCommit(commit, options.includeInternal);
    if (!section) {
      continue;
    }
    const bucket = groups.get(section);
    if (bucket) {
      bucket.push(commit);
    } else {
      groups.set(section, [commit]);
    }
  }

  const blocks: string[] = [];
  if (options.includeHeader) {
    blocks.push('# Changelog', '', 'All notable changes to this project are documented in this file.');
    blocks.push('');
    blocks.push(
      'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),',
    );
    blocks.push(
      'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
    );
    blocks.push('');
  }

  blocks.push(renderVersionHeading(options), '');

  if (breakingCommits.length > 0) {
    blocks.push('### BREAKING CHANGES', '');
    for (const commit of breakingCommits) {
      blocks.push(renderEntry(commit, options.includeScope));
    }
    blocks.push('');
  }

  for (const section of SECTION_ORDER) {
    const bucket = groups.get(section);
    if (!bucket || bucket.length === 0) {
      continue;
    }
    blocks.push(`### ${SECTION_TITLES[section]}`, '');
    for (const commit of bucket) {
      blocks.push(renderEntry(commit, options.includeScope));
    }
    blocks.push('');
  }

  return {
    markdown: blocks.join('\n').trimEnd() + '\n',
    commits,
    unrecognizedLines,
    stats,
  };
}
