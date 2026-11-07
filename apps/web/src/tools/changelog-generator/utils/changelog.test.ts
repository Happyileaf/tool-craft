import { describe, expect, it } from 'vitest';
import {
  SECTION_TITLES,
  classifyCommit,
  generateChangelog,
  isValidDate,
  parseCommitInput,
  parseCommitLine,
  renderEntry,
  type ChangelogOptions,
} from './changelog';

const DEFAULT_OPTIONS: ChangelogOptions = {
  version: '1.2.0',
  date: '2026-11-08',
  includeScope: true,
  includeInternal: false,
  includeHeader: false,
};

describe('parseCommitLine 单行解析', () => {
  it('解析标准 type: subject', () => {
    const commit = parseCommitLine('feat: add dark mode toggle');
    expect(commit).toEqual({
      raw: 'feat: add dark mode toggle',
      type: 'feat',
      scope: null,
      breaking: false,
      subject: 'add dark mode toggle',
    });
  });

  it('解析带作用域与破坏性标记的 header', () => {
    const commit = parseCommitLine('feat(api)!: drop legacy v1 endpoints');
    expect(commit?.type).toBe('feat');
    expect(commit?.scope).toBe('api');
    expect(commit?.breaking).toBe(true);
    expect(commit?.subject).toBe('drop legacy v1 endpoints');
  });

  it('剥离 git oneline 短哈希前缀', () => {
    const commit = parseCommitLine('a1b2c3d fix(web): repair login redirect');
    expect(commit?.type).toBe('fix');
    expect(commit?.scope).toBe('web');
    expect(commit?.subject).toBe('repair login redirect');
  });

  it('剥离完整 40 位哈希前缀', () => {
    const commit = parseCommitLine(
      '0123456789abcdef0123456789abcdef01234567 docs: update README',
    );
    expect(commit?.type).toBe('docs');
  });

  it('类型统一转小写', () => {
    expect(parseCommitLine('FEAT: Add X')?.type).toBe('feat');
  });

  it('空行与纯空白返回 null', () => {
    expect(parseCommitLine('')).toBeNull();
    expect(parseCommitLine('   ')).toBeNull();
  });

  it('不符合 header 语法的行返回 null', () => {
    expect(parseCommitLine('just some random text')).toBeNull();
    expect(parseCommitLine('12345 update changelog')).toBeNull();
  });

  it('合并提交返回 null', () => {
    expect(parseCommitLine('Merge branch "main" into feature')).toBeNull();
    expect(parseCommitLine('Revert merge pull request #12')).toBeNull();
  });

  it('主题为空返回 null', () => {
    expect(parseCommitLine('feat:')).toBeNull();
    expect(parseCommitLine('feat:   ')).toBeNull();
  });

  it('未知类型仍可解析，类型字段保留原值', () => {
    const commit = parseCommitLine('wip: half-done experiment');
    expect(commit?.type).toBe('wip');
  });
});

describe('classifyCommit 分组映射', () => {
  const make = (partial: Partial<ReturnType<typeof parseCommitLine>>) => ({
    raw: 'x: y',
    type: 'feat',
    scope: null,
    breaking: false,
    subject: 'subject',
    ...partial,
  });

  it('feat → added，fix → fixed', () => {
    expect(classifyCommit(make({ type: 'feat' }), false)).toBe('added');
    expect(classifyCommit(make({ type: 'fix' }), false)).toBe('fixed');
  });

  it('perf/refactor/docs/revert → changed', () => {
    for (const type of ['perf', 'refactor', 'docs', 'revert']) {
      expect(classifyCommit(make({ type }), false)).toBe('changed');
    }
  });

  it('内部类型默认丢弃，开启收录后归入 changed', () => {
    for (const type of ['style', 'test', 'build', 'ci', 'chore']) {
      expect(classifyCommit(make({ type }), false)).toBeNull();
      expect(classifyCommit(make({ type }), true)).toBe('changed');
    }
  });

  it('安全关键词与 security 类型优先归入 security', () => {
    expect(
      classifyCommit(make({ type: 'fix', subject: 'patch XSS in profile page' }), false),
    ).toBe('security');
    expect(
      classifyCommit(make({ type: 'chore', subject: 'bump dep for CVE-2026-1234' }), false),
    ).toBe('security');
    expect(classifyCommit(make({ type: 'security', subject: 'harden session' }), false)).toBe(
      'security',
    );
  });

  it('弃用关键词归入 deprecated', () => {
    expect(
      classifyCommit(make({ type: 'feat', subject: 'deprecate legacy export API' }), false),
    ).toBe('deprecated');
  });

  it('移除关键词归入 removed', () => {
    expect(
      classifyCommit(make({ type: 'chore', subject: 'remove unused feature flag' }), true),
    ).toBe('removed');
  });

  it('未知类型返回 null', () => {
    expect(classifyCommit(make({ type: 'wip' }), false)).toBeNull();
    expect(classifyCommit(make({ type: 'wip' }), true)).toBeNull();
  });
});

describe('renderEntry 条目渲染', () => {
  it('无作用域时只输出主题', () => {
    expect(
      renderEntry(
        { raw: '', type: 'feat', scope: null, breaking: false, subject: 'add x' },
        true,
      ),
    ).toBe('- add x');
  });

  it('带作用域前缀', () => {
    expect(
      renderEntry(
        { raw: '', type: 'feat', scope: 'api', breaking: false, subject: 'add x' },
        true,
      ),
    ).toBe('- **api:** add x');
  });

  it('关闭作用域时省略前缀', () => {
    expect(
      renderEntry(
        { raw: '', type: 'feat', scope: 'api', breaking: false, subject: 'add x' },
        false,
      ),
    ).toBe('- add x');
  });

  it('破坏性变更带 BREAKING CHANGE 前缀', () => {
    expect(
      renderEntry(
        { raw: '', type: 'feat', scope: null, breaking: true, subject: 'drop v1' },
        false,
      ),
    ).toBe('- BREAKING CHANGE: drop v1');
  });
});

describe('isValidDate 日期校验', () => {
  it('合法日期', () => {
    expect(isValidDate('2026-11-08')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true);
  });

  it('非法格式与不存在的日期', () => {
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2023-02-29')).toBe(false);
    expect(isValidDate('2026/11/08')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
  });
});

describe('parseCommitInput 批量解析与统计', () => {
  it('统计解析、未识别与跳过行数', () => {
    const input = [
      'feat: add a',
      'random line without header',
      'Merge branch main',
      'fix(web): repair b',
      '',
      '   ',
    ].join('\n');
    const { commits, unrecognizedLines, stats } = parseCommitInput(input);
    expect(commits).toHaveLength(2);
    expect(unrecognizedLines).toEqual(['random line without header']);
    expect(stats.totalLines).toBe(4);
    expect(stats.parsedCount).toBe(2);
    expect(stats.unrecognizedCount).toBe(1);
    expect(stats.skippedCount).toBe(1);
    expect(stats.breakingCount).toBe(0);
  });

  it('统计破坏性变更数量', () => {
    const { stats } = parseCommitInput('feat!: a\nfix!: b\nchore: c');
    expect(stats.breakingCount).toBe(2);
  });
});

describe('generateChangelog 完整渲染', () => {
  const SAMPLE = [
    'a1b2c3d feat(api): add rate limiting middleware',
    'd4e5f60 feat(web): add dark mode toggle',
    '7a8b90c fix(auth): repair token refresh race',
    'abc123f perf(db): speed up hot-path queries',
    'def456a docs: rewrite integration guide',
    '123abcd chore: bump dev dependencies',
    'fedcba0 feat!: drop support for Node 14',
    '13579bd fix: patch XSS in comment renderer',
    '2468ace feat: deprecate legacy CSV export',
    '9e0f1a2 chore: remove obsolete webhook',
    'this line cannot be parsed',
  ].join('\n');

  it('默认选项：分组、排序、BREAKING CHANGES 置顶且内部类型被过滤', () => {
    const result = generateChangelog(SAMPLE, DEFAULT_OPTIONS);
    const lines = result.markdown.split('\n');
    expect(lines[0]).toBe('## [1.2.0] - 2026-11-08');

    const breakingIndex = lines.indexOf('### BREAKING CHANGES');
    const addedIndex = lines.indexOf(`### ${SECTION_TITLES.added}`);
    const fixedIndex = lines.indexOf(`### ${SECTION_TITLES.fixed}`);
    const changedIndex = lines.indexOf(`### ${SECTION_TITLES.changed}`);
    const securityIndex = lines.indexOf(`### ${SECTION_TITLES.security}`);
    const deprecatedIndex = lines.indexOf(`### ${SECTION_TITLES.deprecated}`);
    const removedIndex = lines.indexOf(`### ${SECTION_TITLES.removed}`);

    expect(breakingIndex).toBeGreaterThan(-1);
    expect(breakingIndex).toBeLessThan(addedIndex);
    expect(addedIndex).toBeLessThan(changedIndex);
    expect(changedIndex).toBeLessThan(deprecatedIndex);
    expect(deprecatedIndex).toBeLessThan(removedIndex);
    expect(removedIndex).toBeLessThan(fixedIndex);
    expect(fixedIndex).toBeLessThan(securityIndex);
    expect(result.markdown).not.toContain('bump dev dependencies');
    expect(result.markdown).toContain('- **api:** add rate limiting middleware');
    expect(result.markdown).toContain('- BREAKING CHANGE: drop support for Node 14');
    expect(result.markdown).toContain('- patch XSS in comment renderer');
    expect(result.markdown).toContain('- remove obsolete webhook');
    expect(result.unrecognizedLines).toEqual(['this line cannot be parsed']);
    expect(result.stats.parsedCount).toBe(10);
    expect(result.stats.unrecognizedCount).toBe(1);
    expect(result.stats.breakingCount).toBe(1);
  });

  it('开启 includeInternal 后 chore 进入 Changed', () => {
    const result = generateChangelog(SAMPLE, {
      ...DEFAULT_OPTIONS,
      includeInternal: true,
    });
    expect(result.markdown).toContain('- bump dev dependencies');
  });

  it('关闭 includeScope 后条目无作用域前缀', () => {
    const result = generateChangelog('feat(api): add x', {
      ...DEFAULT_OPTIONS,
      includeScope: false,
    });
    expect(result.markdown).toContain('- add x');
    expect(result.markdown).not.toContain('**api:**');
  });

  it('版本号留空输出 Unreleased，日期留空则不拼接日期', () => {
    const noVersion = generateChangelog('feat: a', {
      ...DEFAULT_OPTIONS,
      version: '',
      date: '',
    });
    expect(noVersion.markdown.split('\n')[0]).toBe('## Unreleased');
  });

  it('includeHeader 输出 Keep a Changelog 文档头', () => {
    const result = generateChangelog('feat: a', {
      ...DEFAULT_OPTIONS,
      includeHeader: true,
    });
    expect(result.markdown.startsWith('# Changelog\n')).toBe(true);
    expect(result.markdown).toContain('keepachangelog.com/en/1.1.0');
    expect(result.markdown).toContain('semver.org');
  });

  it('空输入只输出版本标题', () => {
    const result = generateChangelog('', DEFAULT_OPTIONS);
    expect(result.markdown).toBe('## [1.2.0] - 2026-11-08\n');
    expect(result.stats.parsedCount).toBe(0);
  });

  it('全部条目被过滤时不输出任何 ### 分组', () => {
    const result = generateChangelog('chore: tidy\nci: update workflow', DEFAULT_OPTIONS);
    expect(result.markdown).not.toContain('###');
  });

  it('输出以单个换行结尾', () => {
    const result = generateChangelog('feat: a', DEFAULT_OPTIONS);
    expect(result.markdown.endsWith('\n')).toBe(true);
    expect(result.markdown.endsWith('\n\n')).toBe(false);
  });

  it('同组条目保持输入顺序', () => {
    const result = generateChangelog('feat: first\nfeat: second\nfeat: third', DEFAULT_OPTIONS);
    const addedBlock = result.markdown.split('### Added\n\n')[1] ?? '';
    const items = addedBlock.split('\n').filter((line) => line.startsWith('- '));
    expect(items).toEqual(['- first', '- second', '- third']);
  });
});
