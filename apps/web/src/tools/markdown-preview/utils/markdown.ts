import { MarkdownSnippetEnum } from '../constants';

/**
 * 将 &、<、> 等 HTML 特殊字符转义为实体，所有进入标签间的文本必须先经过此处理
 *
 * @param text - 原始文本
 * @returns 转义后的安全文本
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 判断链接地址是否安全，仅放行 http、https、mailto 协议与站内相对地址、锚点，
 * 拦截 javascript:、data: 等可执行协议
 *
 * @param url - 待校验的链接地址
 * @returns 地址可安全写入 href 时返回 true
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  if (/^[/#?]/.test(trimmed)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

/**
 * 解析单行 Markdown 行级语法，行内代码先以占位符抽取避免内部文本被二次解析，
 * 依次处理粗体、斜体、链接语法与裸链接自动识别
 *
 * @param source - 已去除块级前缀的单行文本
 * @returns 行级语法转换后的 HTML 片段
 */
function renderInline(source: string): string {
  let text = escapeHtml(source);
  const codeSpans: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(code);
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  const links: string[] = [];
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, url: string) => {
      if (!isSafeUrl(url)) return label;
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return `\u0000LINK${links.length - 1}\u0000`;
    },
  );
  text = text.replace(
    /(^|[\s(])(https?:\/\/[^\s<)\]]+)/gi,
    (_match, prefix: string, url: string) => {
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
      return `${prefix}\u0000LINK${links.length - 1}\u0000`;
    },
  );
  text = text.replace(/\u0000LINK(\d+)\u0000/g, (_match, index: string) => {
    const link = links[Number(index)];
    return link ?? '';
  });
  text = text.replace(/\u0000CODE(\d+)\u0000/g, (_match, index: string) => {
    const code = codeSpans[Number(index)];
    return code === undefined ? '' : `<code>${code}</code>`;
  });
  return text;
}

/**
 * 判断一行是否以围栏代码块、标题、分割线、引用或列表语法开头，
 * 用于在遇到这些块级元素时结束当前段落
 *
 * @param line - 待判断的文本行
 * @returns 属于独立块级元素时返回 true
 */
function isBlockStart(line: string): boolean {
  return (
    /^```/.test(line) ||
    /^#{1,6}\s/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line)
  );
}

/**
 * 将 Markdown 源码渲染为 HTML，块级元素按行扫描并将连续的同类列表项、
 * 引用行合并进同一个父容器，全部用户文本经 HTML 转义以防 XSS
 *
 * @param source - Markdown 原始文本
 * @returns 可直接插入页面的 HTML 字符串
 */
export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line === undefined) break;

    if (/^```/.test(line)) {
      const content: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index] ?? '')) {
        content.push(lines[index] ?? '');
        index += 1;
      }
      index += 1;
      blocks.push(
        `<pre><code>${escapeHtml(content.join('\n'))}</code></pre>`,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      blocks.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push('<hr />');
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
        quoted.push((lines[index] ?? '').replace(/^>\s?/, ''));
        index += 1;
      }
      const paragraphs: string[] = [];
      let buffer: string[] = [];
      for (const quotedLine of quoted) {
        if (quotedLine.trim() === '') {
          if (buffer.length > 0) {
            paragraphs.push(`<p>${renderInline(buffer.join(' '))}</p>`);
            buffer = [];
          }
        } else {
          buffer.push(quotedLine.trim());
        }
      }
      if (buffer.length > 0) {
        paragraphs.push(`<p>${renderInline(buffer.join(' '))}</p>`);
      }
      blocks.push(`<blockquote>${paragraphs.join('')}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInline((lines[index] ?? '').replace(/^\s*[-*+]\s+/, ''))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInline((lines[index] ?? '').replace(/^\s*\d+\.\s+/, ''))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() !== '' &&
      !isBlockStart(lines[index] ?? '')
    ) {
      paragraph.push((lines[index] ?? '').trim());
      index += 1;
    }
    blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return blocks.join('');
}

/**
 * 依据快捷插入类型构造对应的 Markdown 片段，片段前后各留一空行使块级语法不与原文粘连
 *
 * @param snippet - 快捷插入片段枚举
 * @param sampleText - 当前语言下的示范占位文本
 * @param codeSampleText - 当前语言下的代码块示例文本
 * @returns 待追加到源码末尾的片段字符串
 */
export function buildSnippet(
  snippet: MarkdownSnippetEnum,
  sampleText: string,
  codeSampleText: string,
): string {
  switch (snippet) {
    case MarkdownSnippetEnum.H2:
      return `\n## ${sampleText}\n`;
    case MarkdownSnippetEnum.Bold:
      return `\n**${sampleText}**\n`;
    case MarkdownSnippetEnum.List:
      return `\n- ${sampleText}\n`;
    case MarkdownSnippetEnum.Quote:
      return `\n> ${sampleText}\n`;
    case MarkdownSnippetEnum.CodeBlock:
      return `\n\`\`\`typescript\n${codeSampleText}\n\`\`\`\n`;
  }
}
