import {
  BBCODE_SIZE_TO_PX,
  NAMED_COLORS,
  PX_TO_BBCODE_SIZE,
} from '../constants';

/** 转换结果 */
export interface ConvertResult {
  /** 转换后的标记文本 */
  output: string;
  /** 识别并处理的标签数量（开标签计数） */
  tagsHandled: number;
  /** 无法映射而被降级处理的标签数量 */
  tagsDropped: number;
}

/** HTML 特殊字符转义（仅作用于文本节点与属性值） */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** HTML 实体还原为字面字符 */
export function unescapeHtml(text: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const codePoint =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (Number.isFinite(codePoint)) {
        return String.fromCodePoint(codePoint);
      }
      return entity;
    }
    return named[body.toLowerCase()] ?? entity;
  });
}

/** 仅允许 http/https/ftp 与相对协议，阻断 javascript: 等危险 URL */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?|ftp):\/\//i.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '';
}

/** 校验颜色值：命名白名单或 #rgb / #rrggbb / #rrggbbaa */
function sanitizeColor(color: string): string {
  const value = color.trim().toLowerCase();
  if (NAMED_COLORS.has(value)) {
    return value;
  }
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return value;
  }
  return '';
}

/** 校验字号档位 1–7 并返回像素值 */
function sizeToPx(sizeRaw: string): number | null {
  const size = Number(sizeRaw.trim());
  if (Number.isInteger(size) && size >= 1 && size <= 7) {
    return BBCODE_SIZE_TO_PX[size] ?? null;
  }
  return null;
}

interface OpenTag {
  name: string;
  param?: string;
}

interface Token {
  type: 'open' | 'close' | 'text' | 'star';
  name?: string;
  param?: string;
  text?: string;
}

/** 将 BBCode 切分为标签与文本 token；[code] 内容整体视为文本，不解析内部标记 */
function tokenizeBbcode(input: string): { tokens: Token[]; dropped: number } {
  const tokens: Token[] = [];
  let dropped = 0;
  let i = 0;
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      tokens.push({ type: 'text', text: textBuffer });
      textBuffer = '';
    }
  };

  while (i < input.length) {
    if (input[i] === '[') {
      const closeIndex = input.indexOf(']', i);
      if (closeIndex === -1) {
        textBuffer += input.slice(i);
        break;
      }
      const inner = input.slice(i + 1, closeIndex);
      const lower = inner.toLowerCase();

      // [code]...[/code] 内容原样保留
      if (lower === 'code') {
        const endMatch = input.slice(closeIndex + 1).match(/\[\/code\]/i);
        flushText();
        tokens.push({ type: 'open', name: 'code' });
        if (endMatch) {
          const codeStart = closeIndex + 1;
          const codeEnd = codeStart + endMatch.index!;
          tokens.push({ type: 'text', text: input.slice(codeStart, codeEnd) });
          tokens.push({ type: 'close', name: 'code' });
          i = codeEnd + '[/code]'.length;
        } else {
          // 未闭合：剩余全部作为代码文本
          tokens.push({ type: 'text', text: input.slice(closeIndex + 1) });
          tokens.push({ type: 'close', name: 'code' });
          break;
        }
        continue;
      }

      const tagMatch = inner.match(/^\/?([a-z0-9*]+)(?:=(.*))?$/i);
      if (!tagMatch) {
        textBuffer += input.slice(i, closeIndex + 1);
        i = closeIndex + 1;
        continue;
      }
      const isClose = inner.startsWith('/');
      const name = (tagMatch[1] ?? '').toLowerCase();
      const param = tagMatch[2] !== undefined ? stripQuotes(tagMatch[2]) : undefined;
      const known = isKnownTag(name);

      if (!known) {
        dropped += 1;
        textBuffer += input.slice(i, closeIndex + 1);
        i = closeIndex + 1;
        continue;
      }

      flushText();
      if (name === '*') {
        tokens.push({ type: 'star' });
      } else if (isClose) {
        tokens.push({ type: 'close', name });
      } else {
        tokens.push({ type: 'open', name, param });
      }
      i = closeIndex + 1;
    } else {
      textBuffer += input[i];
      i += 1;
    }
  }
  flushText();
  return { tokens, dropped };
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function isKnownTag(name: string): boolean {
  return [
    'b',
    'i',
    'u',
    's',
    'url',
    'img',
    'quote',
    'list',
    'code',
    'color',
    'size',
    '*',
  ].includes(name);
}

/** 把 BBCode 开标签渲染为 HTML 起始片段 */
function renderOpenTag(tag: OpenTag): string {
  const { name, param } = tag;
  switch (name) {
    case 'b':
      return '<strong>';
    case 'i':
      return '<em>';
    case 'u':
      return '<u>';
    case 's':
      return '<del>';
    case 'url': {
      const href = param ? sanitizeUrl(param) : '';
      return href ? `<a href="${escapeHtml(href)}">` : '';
    }
    case 'img':
      return '<img src="';
    case 'quote':
      return param
        ? `<blockquote><p>${escapeHtml(param)} 写道：</p>`
        : '<blockquote>';
    case 'list':
      return param && /^1$/i.test(param.trim()) ? '<ol>' : '<ul>';
    case 'code':
      return '<pre><code>';
    case 'color': {
      const color = param ? sanitizeColor(param) : '';
      return color ? `<span style="color:${color}">` : '<span>';
    }
    case 'size': {
      const px = param ? sizeToPx(param) : null;
      return px ? `<span style="font-size:${px}px">` : '<span>';
    }
    default:
      return '';
  }
}

/** 把 BBCode 闭标签渲染为 HTML 结束片段 */
function renderCloseTag(tag: OpenTag): string {
  switch (tag.name) {
    case 'b':
      return '</strong>';
    case 'i':
      return '</em>';
    case 'u':
      return '</u>';
    case 's':
      return '</del>';
    case 'url':
      // 无有效 href 的开标签未输出 <a>，闭合时同样不输出
      return tag.param && sanitizeUrl(tag.param) ? '</a>' : '';
    case 'img':
      return '" alt="" />';
    case 'quote':
      return '</blockquote>';
    case 'list':
      // list 闭合在主循环中按当前列表类型处理，不会走到这里
      return '';
    case 'code':
      return '</code></pre>';
    case 'color':
    case 'size':
      return '</span>';
    default:
      return '';
  }
}

/** BBCode → HTML 主入口 */
export function bbcodeToHtml(input: string): ConvertResult {
  const tokenized = tokenizeBbcode(input);
  const tokens = tokenized.tokens;
  let dropped = tokenized.dropped;
  const stack: OpenTag[] = [];
  /** 无参 [url] 的输出起始位置，闭合时提取内部文本作为 href */
  const pendingUrls: number[] = [];
  let output = '';
  let tagsHandled = 0;
  let listType: 'ul' | 'ol' | null = null;
  let itemOpen = false;

  const closeItem = () => {
    if (itemOpen) {
      output = output.replace(/\s+$/, '');
      output += '</li>';
      itemOpen = false;
    }
  };

  /** 闭合一个标签；无参 [url] 在此刻用内部文本回填 href */
  const closeTag = (tag: OpenTag) => {
    if (tag.name === 'url' && !tag.param) {
      const start = pendingUrls.pop();
      const innerHtml = start !== undefined ? output.slice(start) : '';
      const href = sanitizeUrl(unescapeHtml(innerHtml));
      output = start !== undefined ? output.slice(0, start) : output;
      output += href
        ? `<a href="${escapeHtml(href)}">${innerHtml}</a>`
        : innerHtml;
      return;
    }
    if (tag.name === 'list') {
      closeItem();
      output += listType === 'ol' ? '</ol>' : '</ul>';
      return;
    }
    output += renderCloseTag(tag);
  };

  for (const token of tokens) {
    if (token.type === 'text') {
      const insideImg = stack.some((t) => t.name === 'img');
      const insideCode = stack.some((t) => t.name === 'code');
      const insideList = stack.some((t) => t.name === 'list');
      if (insideImg) {
        const safe = sanitizeUrl(token.text ?? '');
        output += escapeHtml(safe);
      } else if (insideCode) {
        output += escapeHtml(token.text ?? '');
      } else if (insideList && (token.text ?? '').trim() === '') {
        // 列表标签之间的换行 / 空白不输出，避免污染 <li> 结构
        continue;
      } else {
        output += escapeHtml(token.text ?? '');
      }
      continue;
    }

    if (token.type === 'star') {
      if (listType) {
        closeItem();
        output += '<li>';
        itemOpen = true;
      }
      continue;
    }

    if (token.type === 'open') {
      const tag: OpenTag = { name: token.name!, param: token.param };
      if (tag.name === 'list') {
        closeItem();
        listType = tag.param && /^1$/i.test(tag.param.trim()) ? 'ol' : 'ul';
      }
      if (tag.name === 'url' && !tag.param) {
        // 无参 [url]：记录输出起点，闭合时提取内部文本作为 href
        pendingUrls.push(output.length);
      }
      output += renderOpenTag(tag);
      stack.push(tag);
      tagsHandled += 1;
      continue;
    }

    // close
    const idx = [...stack].reverse().findIndex((t) => t.name === token.name);
    if (idx === -1) {
      dropped += 1;
      continue;
    }
    const absoluteIdx = stack.length - 1 - idx;
    // 自动闭合内部未关闭的标签（不匹配的嵌套）
    while (stack.length > absoluteIdx + 1) {
      const inner = stack.pop()!;
      if (inner.name === 'list') {
        listType = null;
      }
      closeTag(inner);
    }
    const current = stack.pop()!;
    if (current.name === 'list') {
      const outerList = [...stack].reverse().find((t) => t.name === 'list');
      closeTag(current);
      listType = outerList
        ? outerList.param && /^1$/i.test(outerList.param.trim())
          ? 'ol'
          : 'ul'
        : null;
    } else {
      closeTag(current);
    }
  }

  // 闭合输入中未关闭的标签
  while (stack.length > 0) {
    const tag = stack.pop()!;
    if (tag.name === 'list') {
      listType = null;
    }
    closeTag(tag);
  }

  return { output: output.trim(), tagsHandled, tagsDropped: dropped };
}

interface HtmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: Array<HtmlNode | string>;
}

const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);

/** 极简 HTML 解析器：返回节点树，不依赖 DOM */
function parseHtml(input: string): { roots: Array<HtmlNode | string>; dropped: number } {
  const roots: Array<HtmlNode | string> = [];
  const stack: HtmlNode[] = [];
  let dropped = 0;
  let i = 0;
  let textBuffer = '';

  const currentContainer = (): Array<HtmlNode | string> =>
    stack.length === 0 ? roots : stack[stack.length - 1]!.children;

  const flushText = () => {
    if (textBuffer) {
      currentContainer().push(textBuffer);
      textBuffer = '';
    }
  };

  while (i < input.length) {
    if (input[i] === '<') {
      // 注释 / doctype：整体丢弃
      if (input.startsWith('<!--', i)) {
        const end = input.indexOf('-->', i + 4);
        i = end === -1 ? input.length : end + 3;
        continue;
      }
      if (input[i + 1] === '!') {
        const end = input.indexOf('>', i);
        i = end === -1 ? input.length : end + 1;
        continue;
      }
      const closeIndex = input.indexOf('>', i);
      if (closeIndex === -1) {
        textBuffer += input.slice(i);
        break;
      }
      const raw = input.slice(i + 1, closeIndex);
      const selfClosing = raw.endsWith('/');
      const inner = selfClosing ? raw.slice(0, -1) : raw;
      const match = inner.match(/^\/?([a-zA-Z][a-zA-Z0-9]*)([\s\S]*)$/);
      if (!match) {
        textBuffer += input.slice(i, closeIndex + 1);
        i = closeIndex + 1;
        continue;
      }
      const tagName = (match[1] ?? '').toLowerCase();
      const isClose = inner.startsWith('/');

      flushText();

      if (isClose) {
        const idx = [...stack].reverse().findIndex((n) => n.tag === tagName);
        if (idx === -1) {
          dropped += 1;
        } else {
          const absoluteIdx = stack.length - 1 - idx;
          while (stack.length > absoluteIdx + 1) {
            stack.pop();
            dropped += 1;
          }
          stack.pop();
        }
        i = closeIndex + 1;
        continue;
      }

      const node: HtmlNode = {
        tag: tagName,
        attrs: parseAttrs(match[2] ?? ''),
        children: [],
      };
      currentContainer().push(node);
      if (!selfClosing && !VOID_TAGS.has(tagName)) {
        stack.push(node);
      }
      i = closeIndex + 1;
    } else {
      textBuffer += input[i];
      i += 1;
    }
  }
  flushText();
  dropped += stack.length;
  return { roots, dropped };
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (!m[1]) {
      continue;
    }
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    attrs[m[1].toLowerCase()] = unescapeHtml(value);
  }
  return attrs;
}

/** 从 style 属性中提取指定 CSS 属性（小写） */
function readStyle(style: string, property: string): string {
  const declarations = style.split(';');
  for (const declaration of declarations) {
    const idx = declaration.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const key = declaration.slice(0, idx).trim().toLowerCase();
    const value = declaration.slice(idx + 1).trim();
    if (key === property) {
      return value;
    }
  }
  return '';
}

/** 像素字号反查最近的 BBCode 档位 */
function pxToClosestSize(px: number): number | null {
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of PX_TO_BBCODE_SIZE) {
    const distance = Math.abs(entry.px - px);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry.size;
    }
  }
  return bestDistance <= 3 ? best : null;
}

interface HtmlContext {
  inList: boolean;
  inCode: boolean;
}

/** 节点树 → BBCode */
function nodeToBbcode(node: HtmlNode | string, context: HtmlContext): string {
  if (typeof node === 'string') {
    return context.inCode ? node : unescapeHtml(node);
  }

  const childContext: HtmlContext = {
    inList: context.inList || node.tag === 'ul' || node.tag === 'ol',
    inCode: context.inCode || node.tag === 'pre',
  };
  const inner = node.children.map((child) => nodeToBbcode(child, childContext)).join('');

  switch (node.tag) {
    case 'strong':
    case 'b':
      return `[b]${inner}[/b]`;
    case 'em':
    case 'i':
      return `[i]${inner}[/i]`;
    case 'u':
      return `[u]${inner}[/u]`;
    case 'del':
    case 's':
    case 'strike':
      return `[s]${inner}[/s]`;
    case 'a': {
      const href = sanitizeUrl(node.attrs.href ?? '');
      if (!href) {
        return inner;
      }
      const label = inner.trim();
      return label === href ? `[url]${href}[/url]` : `[url=${href}]${inner}[/url]`;
    }
    case 'img': {
      const src = sanitizeUrl(node.attrs.src ?? '');
      return src ? `[img]${src}[/img]` : '';
    }
    case 'blockquote':
      return `[quote]${inner}[/quote]`;
    case 'pre':
      // <pre><code> 嵌套时 code 节点只透传文本
      if (node.children.length === 1 && typeof node.children[0] !== 'string') {
        const only = node.children[0] as HtmlNode;
        if (only.tag === 'code') {
          const codeText = only.children
            .map((child) => (typeof child === 'string' ? child : nodeToBbcode(child, { inList: false, inCode: true })))
            .join('');
          return `[code]${codeText}[/code]`;
        }
      }
      return `[code]${inner}[/code]`;
    case 'code':
      return context.inCode ? inner : `[code]${inner}[/code]`;
    case 'ul':
      return `[list]${inner}[/list]`;
    case 'ol':
      return `[list=1]${inner}[/list]`;
    case 'li':
      return `[*]${inner}`;
    case 'br':
      return '\n';
    case 'p':
    case 'div':
      return `${inner}\n\n`;
    case 'span': {
      const style = node.attrs.style ?? '';
      const color = sanitizeColor(readStyle(style, 'color'));
      const fontSize = readStyle(style, 'font-size');
      const pxMatch = fontSize.match(/^(\d+(?:\.\d+)?)px$/);
      const size = pxMatch ? pxToClosestSize(Number(pxMatch[1])) : null;
      let wrapped = inner;
      if (size !== null) {
        wrapped = `[size=${size}]${wrapped}[/size]`;
      }
      if (color) {
        wrapped = `[color=${color}]${wrapped}[/color]`;
      }
      return wrapped;
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return `[b]${inner}[/b]\n\n`;
    default:
      return inner;
  }
}

/** HTML → BBCode 主入口 */
export function htmlToBbcode(input: string): ConvertResult {
  const { roots, dropped } = parseHtml(input);
  const raw = roots
    .map((node) => nodeToBbcode(node, { inList: false, inCode: false }))
    .join('');
  // 折叠 3 个以上换行为两个，去掉行尾空白
  const output = raw
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

  const tagsHandled = countHtmlTags(roots);
  return { output, tagsHandled, tagsDropped: dropped };
}

function countHtmlTags(nodes: Array<HtmlNode | string>): number {
  let count = 0;
  for (const node of nodes) {
    if (typeof node === 'string') {
      continue;
    }
    count += 1;
    count += countHtmlTags(node.children);
  }
  return count;
}

/** 统一入口：按方向执行转换 */
export function convertBbcodeHtml(
  input: string,
  direction: 'bbcode2html' | 'html2bbcode',
): ConvertResult {
  return direction === 'bbcode2html' ? bbcodeToHtml(input) : htmlToBbcode(input);
}
