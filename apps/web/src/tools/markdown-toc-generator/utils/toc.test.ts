import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOC_OPTIONS,
  extractHeadings,
  generateToc,
  insertToc,
  slugifyHeading,
} from './toc';

describe('extractHeadings', () => {
  it('提取 1–6 级 ATX 标题及层级与文本', () => {
    const markdown = ['# Title', '## Section', '### Subsection', '###### Deep'].join('\n');
    expect(extractHeadings(markdown)).toEqual([
      { level: 1, text: 'Title', line: 1 },
      { level: 2, text: 'Section', line: 2 },
      { level: 3, text: 'Subsection', line: 3 },
      { level: 6, text: 'Deep', line: 4 },
    ]);
  });

  it('忽略围栏代码块（``` 与 ~~~）内的 #', () => {
    const markdown = [
      '# Real',
      '```',
      '# not a heading',
      '## also not',
      '```',
      '~~~',
      '### nope',
      '~~~',
      '## After',
    ].join('\n');
    const headings = extractHeadings(markdown);
    expect(headings.map((heading) => heading.text)).toEqual(['Real', 'After']);
  });

  it('要求 # 后有空格，并识别行首转义与闭合 # 序列', () => {
    const markdown = ['#NoSpace', '\\# Escaped', '## Closed ##', ' # Indented'].join('\n');
    const headings = extractHeadings(markdown);
    expect(headings.map((heading) => heading.text)).toEqual(['Closed', 'Indented']);
  });

  it('保留行内代码反引号等原始标记并给出正确行号', () => {
    const markdown = '\n\n## Use `npm run` now';
    const headings = extractHeadings(markdown);
    expect(headings).toEqual([{ level: 2, text: 'Use `npm run` now', line: 3 }]);
  });
});

describe('slugifyHeading', () => {
  it('生成 GitHub 风格锚点：小写、空格转连字符、去标点与反引号', () => {
    expect(slugifyHeading('Hello World')).toBe('hello-world');
    expect(slugifyHeading('Use `npm run`!')).toBe('use-npm-run');
    expect(slugifyHeading('A & B, C?')).toBe('a-b-c');
  });
});

describe('generateToc', () => {
  const headings = extractHeadings(
    ['# Project', '## Install', '## Usage', '### CLI', '### API', '## FAQ'].join('\n'),
  );

  it('默认输出带 GitHub 锚点的无序列表并按层级缩进', () => {
    const toc = generateToc(headings, DEFAULT_TOC_OPTIONS);
    expect(toc).toBe(
      [
        '- [Project](#project)',
        '  - [Install](#install)',
        '  - [Usage](#usage)',
        '    - [CLI](#cli)',
        '    - [API](#api)',
        '  - [FAQ](#faq)',
      ].join('\n'),
    );
  });

  it('支持有序列表且父级切换时重置深层编号', () => {
    const toc = generateToc(headings, {
      ordered: true,
      minLevel: 1,
      maxLevel: 6,
      withLinks: false,
    });
    expect(toc).toBe(
      [
        '1. Project',
        '  1. Install',
        '  2. Usage',
        '    1. CLI',
        '    2. API',
        '  3. FAQ',
      ].join('\n'),
    );
  });

  it('按最小/最大层级过滤并重新计算缩进基准', () => {
    const toc = generateToc(headings, {
      ordered: false,
      minLevel: 2,
      maxLevel: 3,
      withLinks: true,
    });
    expect(toc).toBe(
      [
        '- [Install](#install)',
        '- [Usage](#usage)',
        '  - [CLI](#cli)',
        '  - [API](#api)',
        '- [FAQ](#faq)',
      ].join('\n'),
    );
  });

  it('重复锚点追加 -1 / -2 后缀', () => {
    const duplicate = extractHeadings(['# Tips', '## Tips', '# Tips'].join('\n'));
    const toc = generateToc(duplicate, DEFAULT_TOC_OPTIONS);
    expect(toc).toBe(
      ['- [Tips](#tips)', '  - [Tips](#tips-1)', '- [Tips](#tips-2)'].join('\n'),
    );
  });

  it('无标题或过滤后为空时返回空字符串', () => {
    expect(generateToc([], DEFAULT_TOC_OPTIONS)).toBe('');
    expect(
      generateToc(extractHeadings('# Only H1'), {
        ordered: false,
        minLevel: 2,
        maxLevel: 3,
        withLinks: true,
      }),
    ).toBe('');
  });
});

describe('insertToc', () => {
  it('存在 TOC 标记块时替换其内容', () => {
    const markdown = ['# Doc', '<!-- TOC -->', 'old', '<!-- /TOC -->', 'body'].join('\n');
    const result = insertToc(markdown, '- [Doc](#doc)');
    expect(result).toBe(
      ['# Doc', '<!-- TOC -->', '- [Doc](#doc)', '<!-- /TOC -->', 'body'].join('\n'),
    );
  });

  it('无标记块时前置到原文开头', () => {
    const result = insertToc('# Hello', '- [Hello](#hello)');
    expect(result).toBe('- [Hello](#hello)\n\n# Hello');
  });

  it('目录为空且无标记块时原样返回', () => {
    expect(insertToc('# Hello', '')).toBe('# Hello');
  });
});
