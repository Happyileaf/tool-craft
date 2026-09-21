import { describe, expect, it } from 'vitest';
import { MarkdownSnippetEnum } from '../constants';
import { buildSnippet, renderMarkdown } from './markdown';

describe('renderMarkdown 标题转换', () => {
  it('一级到三级标题分别渲染为对应层级标签', () => {
    const source = '# 一级标题\n\n## 二级标题\n\n### 三级标题';
    const html = renderMarkdown(source);
    expect(html).toContain('<h1>一级标题</h1>');
    expect(html).toContain('<h2>二级标题</h2>');
    expect(html).toContain('<h3>三级标题</h3>');
  });

  it('六级标题可正常渲染', () => {
    expect(renderMarkdown('###### 六级标题')).toBe('<h6>六级标题</h6>');
  });
});

describe('renderMarkdown 列表合并', () => {
  it('多个无序列表项只被一个 ul 包裹', () => {
    const html = renderMarkdown('- 苹果\n- 香蕉\n- 橙子');
    expect(html).toBe('<ul><li>苹果</li><li>香蕉</li><li>橙子</li></ul>');
    expect(html.match(/<ul>/g)).toHaveLength(1);
    expect(html.match(/<\/ul>/g)).toHaveLength(1);
    expect(html.match(/<li>/g)).toHaveLength(3);
  });

  it('星号与加号开头的条目同样合并进 ul', () => {
    const html = renderMarkdown('* 第一项\n+ 第二项');
    expect(html).toBe('<ul><li>第一项</li><li>第二项</li></ul>');
  });

  it('多个有序列表项只被一个 ol 包裹', () => {
    const html = renderMarkdown('1. 第一步\n2. 第二步\n3. 第三步');
    expect(html).toBe('<ol><li>第一步</li><li>第二步</li><li>第三步</li></ol>');
    expect(html.match(/<ol>/g)).toHaveLength(1);
    expect(html.match(/<\/ol>/g)).toHaveLength(1);
  });
});

describe('renderMarkdown 代码块转义', () => {
  it('围栏代码块中的脚本标签被转义为实体', () => {
    const html = renderMarkdown('```html\n<script>alert(1)</script>\n```');
    expect(html).toBe(
      '<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>',
    );
    expect(html).not.toContain('<script>');
  });

  it('行内代码内容同样被转义', () => {
    const html = renderMarkdown('使用 `<div>` 标签');
    expect(html).toBe('<p>使用 <code>&lt;div&gt;</code> 标签</p>');
  });
});

describe('renderMarkdown 行级语法', () => {
  it('粗体、斜体、行内代码在同一段落内正确转换', () => {
    const html = renderMarkdown('**粗体** 与 *斜体* 以及 `代码`');
    expect(html).toBe(
      '<p><strong>粗体</strong> 与 <em>斜体</em> 以及 <code>代码</code></p>',
    );
  });

  it('方括号链接语法转换为带安全属性的超链接', () => {
    const html = renderMarkdown('[官网](https://example.com)');
    expect(html).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">官网</a></p>',
    );
  });

  it('裸 https 链接被自动识别为超链接', () => {
    const html = renderMarkdown('访问 https://example.com 了解更多');
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>',
    );
  });

  it('javascript 协议链接被拦截', () => {
    const html = renderMarkdown('[恶意](javascript:alert(1))');
    expect(html).not.toContain('href="javascript:');
  });

  it('分割线渲染为 hr', () => {
    expect(renderMarkdown('---')).toBe('<hr />');
  });
});

describe('renderMarkdown 引用块', () => {
  it('连续引用行合并进同一个 blockquote', () => {
    const html = renderMarkdown('> 第一行引用\n> 第二行引用');
    expect(html).toBe('<blockquote><p>第一行引用 第二行引用</p></blockquote>');
    expect(html.match(/<blockquote>/g)).toHaveLength(1);
  });
});

describe('renderMarkdown 边界与安全', () => {
  it('空字符串返回空串且不抛错', () => {
    expect(() => renderMarkdown('')).not.toThrow();
    expect(renderMarkdown('')).toBe('');
  });

  it('普通段落中的 HTML 标签被转义以防 XSS', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('buildSnippet 快捷插入', () => {
  it('H2 片段包裹标题语法', () => {
    expect(buildSnippet(MarkdownSnippetEnum.H2, '示范内容', '示例代码')).toBe(
      '\n## 示范内容\n',
    );
  });

  it('粗体片段包裹双星号', () => {
    expect(
      buildSnippet(MarkdownSnippetEnum.Bold, '示范内容', '示例代码'),
    ).toBe('\n**示范内容**\n');
  });

  it('无序列表片段包裹短横线', () => {
    expect(
      buildSnippet(MarkdownSnippetEnum.List, '示范内容', '示例代码'),
    ).toBe('\n- 示范内容\n');
  });

  it('引用块片段包裹大于号', () => {
    expect(
      buildSnippet(MarkdownSnippetEnum.Quote, '示范内容', '示例代码'),
    ).toBe('\n> 示范内容\n');
  });

  it('代码块片段包裹 typescript 围栏与代码示例', () => {
    expect(
      buildSnippet(MarkdownSnippetEnum.CodeBlock, '示范内容', '示例代码'),
    ).toBe('\n```typescript\n示例代码\n```\n');
  });
});
