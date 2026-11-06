import { describe, expect, it } from 'vitest';
import { checkMarkdownLinks, githubSlug } from './checker';

describe('githubSlug GitHub 风格锚点生成', () => {
  it('小写、空格转连字符、去除标点', () => {
    expect(githubSlug('Hello World!')).toBe('hello-world');
  });

  it("撇号被移除：What's New? → whats-new", () => {
    expect(githubSlug("What's New?")).toBe('whats-new');
  });

  it('保留中文字符与下划线', () => {
    expect(githubSlug('进阶_指南 Pro')).toBe('进阶_指南-pro');
  });

  it('连续空白压缩为单个连字符', () => {
    expect(githubSlug('A   B')).toBe('a-b');
  });
});

describe('引用一致性检查', () => {
  const doc = `# Title

[used][foo]
[missing][bar]
[compact][]

[foo]: https://example.com
[compact]: https://compact.example
[unused]: https://unused.example
[foo]: https://duplicate.example`;

  it('未定义引用报 undefined-reference 与正确行号', () => {
    const result = checkMarkdownLinks(doc);
    const issue = result.issues.find((item) => item.code === 'undefined-reference');
    expect(issue).toBeDefined();
    expect(issue!.line).toBe(4);
  });

  it('未使用定义报 unused-definition', () => {
    const result = checkMarkdownLinks(doc);
    const issue = result.issues.find((item) => item.code === 'unused-definition');
    expect(issue).toBeDefined();
    expect(issue!.message).toContain('unused');
  });

  it('重复定义报 duplicate-definition，行号为第二次定义处', () => {
    const result = checkMarkdownLinks(doc);
    const issue = result.issues.find((item) => item.code === 'duplicate-definition');
    expect(issue).toBeDefined();
    expect(issue!.line).toBe(10);
  });

  it('大小写不同的同标签折叠为匹配，不报未定义', () => {
    const result = checkMarkdownLinks('[Foo][]\n\n[foo]: https://x.example');
    expect(result.issues.filter((item) => item.code === 'undefined-reference')).toHaveLength(0);
  });
});

describe('页内锚点校验', () => {
  const doc = `# Hello World!

## What's New?

[greet](#hello-world)
[news](#whats-new)
[bad](#missing-anchor)`;

  it('存在的锚点判定有效，不报问题', () => {
    const result = checkMarkdownLinks(doc);
    const broken = result.issues.filter((item) => item.code === 'broken-anchor');
    expect(broken).toHaveLength(1);
    expect(broken[0]!.message).toContain('missing-anchor');
    expect(broken[0]!.line).toBe(7);
  });

  it('无标题文档中锚点全部失效，纯 # 页首合法', () => {
    const result = checkMarkdownLinks('[top](#) [x](#any)');
    const broken = result.issues.filter((item) => item.code === 'broken-anchor');
    expect(broken).toHaveLength(1);
  });
});

describe('代码块跳过与链接提取', () => {
  const doc = [
    '# Doc',
    '',
    '```',
    '[fake](https://code.example)',
    '```',
    '',
    '行内代码 `[also-fake](https://inline.example)` 不提取',
    '',
    '![pic](https://img.example/a.png)',
    '<https://auto.example>',
    '裸链 https://bare.example 与 https://punct.example.',
    '<mail@example.com>',
    '[rel](./guide/start.md)',
  ].join('\n');

  it('围栏与行内代码中的类链接不被提取', () => {
    const result = checkMarkdownLinks(doc);
    expect(result.links.some((link) => link.url.includes('code.example'))).toBe(false);
    expect(result.links.some((link) => link.url.includes('inline.example'))).toBe(false);
  });

  it('图片链接识别并标注 isImage', () => {
    const result = checkMarkdownLinks(doc);
    const image = result.links.find((link) => link.url.includes('img.example'));
    expect(image).toBeDefined();
    expect(image!.isImage).toBe(true);
  });

  it('自动链接与裸 URL 被提取，裸链尾部标点被截断', () => {
    const result = checkMarkdownLinks(doc);
    expect(result.links.some((link) => link.url === 'https://auto.example')).toBe(true);
    const bare = result.links.find((link) => link.type === 'bare');
    expect(bare).toBeDefined();
    expect(bare!.url.endsWith('.')).toBe(false);
  });

  it('四类计数与构造样本一致', () => {
    const result = checkMarkdownLinks(doc);
    // external：图片 1 + 自动链 1 + 裸链 2；mail：1；relative：1
    expect(result.counts.external).toBe(4);
    expect(result.counts.mail).toBe(1);
    expect(result.counts.relative).toBe(1);
    expect(result.counts.anchor).toBe(0);
  });
});

describe('边界情况', () => {
  it('空文档输出空结果与零计数且不报错', () => {
    const result = checkMarkdownLinks('');
    expect(result.links).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
    expect(result.counts).toEqual({ external: 0, relative: 0, anchor: 0, mail: 0, other: 0 });
  });

  it('Setext 标题同样生成可匹配 slug', () => {
    const doc = 'Hello World\n===========\n\n[x](#hello-world)';
    const result = checkMarkdownLinks(doc);
    expect(result.headings[0]!.slug).toBe('hello-world');
    expect(result.issues.filter((item) => item.code === 'broken-anchor')).toHaveLength(0);
  });

  it('带路径的锚点不做页内校验', () => {
    const result = checkMarkdownLinks('[x](./other.md#section)');
    expect(result.issues).toHaveLength(0);
    expect(result.counts.relative).toBe(1);
  });
});
