// RFC 8288 HTTP Link header parsing and construction.
// A Link field value is a comma-separated list of link-values, each starting
// with a URI-Reference wrapped in angle brackets followed by semicolon-
// separated link-params. Top-level "," and ";" splitting must ignore the same
// characters appearing inside <...> or quoted-string "..." sections.

import { resolveReference } from '../../relative-url-resolver/utils/urlResolve';

export interface LinkParam {
  name: string;
  value: string;
  /** True when the value came from an extended parameter (name*). */
  extended: boolean;
}

export interface ParsedLink {
  /** Raw URI-Reference exactly as written inside the angle brackets. */
  uriReference: string;
  /** Relation types from the rel parameter, whitespace-split and lowercased. */
  rel: string[];
  anchor?: string;
  hreflang?: string;
  type?: string;
  media?: string;
  title?: string;
  /** Absolute URI resolved against the optional base; undefined without a base. */
  resolvedUri?: string;
  /** Every parameter in source order, including the well-known ones above. */
  params: LinkParam[];
}

export interface ParseLinkResult {
  ok: boolean;
  links: ParsedLink[];
  error?: string;
}

interface Cursor {
  source: string;
  index: number;
}

function skipOptionalSpace(cursor: Cursor): void {
  // OWS = *( SP / HTAB )
  while (cursor.index < cursor.source.length) {
    const code = cursor.source.charCodeAt(cursor.index);
    if (code !== 0x20 && code !== 0x09) {
      break;
    }
    cursor.index += 1;
  }
}

function readQuotedString(cursor: Cursor): string {
  // Assumes the current character is the opening double quote.
  cursor.index += 1;
  let result = '';
  while (cursor.index < cursor.source.length) {
    const char = cursor.source[cursor.index];
    if (char === undefined) {
      break;
    }
    if (char === '"') {
      cursor.index += 1;
      return result;
    }
    if (char === '\\') {
      // quoted-pair: backslash escapes the next character.
      const next = cursor.source[cursor.index + 1];
      if (next !== undefined) {
        result += next;
        cursor.index += 2;
        continue;
      }
    }
    result += char;
    cursor.index += 1;
  }
  throw new Error('引号字符串未闭合（缺少结束的双引号）');
}

function readToken(cursor: Cursor): string {
  const start = cursor.index;
  while (cursor.index < cursor.source.length) {
    const code = cursor.source.charCodeAt(cursor.index);
    // Parameter values run until the next delimiter or whitespace.
    if (code === 0x3b || code === 0x2c || code === 0x20 || code === 0x09) {
      break;
    }
    cursor.index += 1;
  }
  return cursor.source.slice(start, cursor.index);
}

/** Split the field value on top-level commas that sit outside <> and "". */
function splitLinkValues(header: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let start = 0;
  for (let i = 0; i < header.length; i += 1) {
    const char = header[i];
    if (char === undefined) {
      continue;
    }
    if (inQuotes) {
      if (char === '\\') {
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === '<') {
      depth += 1;
    } else if (char === '>') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      values.push(header.slice(start, i));
      start = i + 1;
    }
  }
  values.push(header.slice(start));
  return values;
}

/** Parse one link-value chunk (no top-level commas). */
function parseLinkValue(chunk: string): ParsedLink {
  const cursor: Cursor = { source: chunk, index: 0 };
  skipOptionalSpace(cursor);

  if (cursor.source[cursor.index] !== '<') {
    throw new Error('link-value 必须以 <URI-Reference> 尖括号引用开头');
  }
  const closeAngle = cursor.source.indexOf('>', cursor.index + 1);
  if (closeAngle === -1) {
    throw new Error('URI-Reference 缺少闭合尖括号 >');
  }
  const uriReference = cursor.source.slice(cursor.index + 1, closeAngle);
  if (!uriReference) {
    throw new Error('尖括号内的 URI-Reference 不能为空');
  }
  cursor.index = closeAngle + 1;

  const params: LinkParam[] = [];
  while (true) {
    skipOptionalSpace(cursor);
    if (cursor.index >= cursor.source.length) {
      break;
    }
    if (cursor.source[cursor.index] !== ';') {
      const unexpected = cursor.source[cursor.index] ?? '末尾';
      throw new Error(`参数前应为分号，实际遇到：${unexpected}`);
    }
    cursor.index += 1;
    skipOptionalSpace(cursor);

    const nameStart = cursor.index;
    while (cursor.index < cursor.source.length) {
      const code = cursor.source.charCodeAt(cursor.index);
      if (code === 0x3d || code === 0x20 || code === 0x09 || code === 0x3b) {
        break;
      }
      cursor.index += 1;
    }
    const rawName = cursor.source.slice(nameStart, cursor.index);
    if (!rawName) {
      throw new Error('缺少 link-param 参数名');
    }
    const extended = rawName.endsWith('*');
    const name = rawName.toLowerCase();

    skipOptionalSpace(cursor);
    if (cursor.source[cursor.index] !== '=') {
      throw new Error(`参数 ${name} 后缺少 =`);
    }
    cursor.index += 1;
    skipOptionalSpace(cursor);

    let value: string;
    if (cursor.source[cursor.index] === '"' && !extended) {
      value = readQuotedString(cursor);
    } else {
      value = readToken(cursor);
    }
    params.push({ name, value, extended });
  }

  const link: ParsedLink = { uriReference, rel: [], params };
  for (const param of params) {
    switch (param.name) {
      case 'rel':
        link.rel = param.value
          .split(/[ \t]+/)
          .map((token) => token.trim().toLowerCase())
          .filter((token) => token.length > 0);
        break;
      case 'anchor':
        link.anchor = param.value;
        break;
      case 'hreflang':
        link.hreflang = param.value;
        break;
      case 'type':
        link.type = param.value;
        break;
      case 'media':
        link.media = param.value;
        break;
      case 'title':
        link.title = param.value;
        break;
      default:
        break;
    }
  }
  return link;
}

/** Parse a complete Link header field value into structured link entries. */
export function parseLinkHeader(header: string, baseUri?: string): ParseLinkResult {
  if (!header.trim()) {
    return { ok: true, links: [] };
  }

  let links: ParsedLink[];
  try {
    links = splitLinkValues(header)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => parseLinkValue(chunk));
  } catch (error) {
    return { ok: false, links: [], error: (error as Error).message };
  }

  if (baseUri && baseUri.trim()) {
    for (const link of links) {
      const resolved = resolveReference(baseUri.trim(), link.uriReference);
      if (resolved.ok) {
        link.resolvedUri = resolved.target;
      }
    }
  }

  return { ok: true, links };
}

/** Whether a parameter value can be emitted as a bare token (RFC 9110 token). */
function isBareToken(value: string): boolean {
  if (!value) {
    return false;
  }
  return /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(value);
}

function quoteParamValue(value: string): string {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`;
}

export interface LinkBuildEntry {
  uriReference: string;
  rel?: string[];
  anchor?: string;
  hreflang?: string;
  type?: string;
  media?: string;
  title?: string;
  /** Additional extension parameters rendered after the well-known ones. */
  extParams?: LinkParam[];
}

/** Construct an RFC 8288 Link header from structured link entries. */
export function buildLinkHeader(entries: LinkBuildEntry[]): string {
  return entries
    .filter((entry) => entry.uriReference.trim().length > 0)
    .map((entry) => {
      const parts = [`<${entry.uriReference.trim()}>`];
      if (entry.rel && entry.rel.length > 0) {
        parts.push(`rel="${entry.rel.join(' ')}"`);
      }
      if (entry.anchor) {
        parts.push(`anchor=${isBareToken(entry.anchor) ? entry.anchor : quoteParamValue(entry.anchor)}`);
      }
      if (entry.hreflang) {
        parts.push(`hreflang=${isBareToken(entry.hreflang) ? entry.hreflang : quoteParamValue(entry.hreflang)}`);
      }
      if (entry.type) {
        parts.push(`type=${isBareToken(entry.type) ? entry.type : quoteParamValue(entry.type)}`);
      }
      if (entry.media) {
        parts.push(`media=${quoteParamValue(entry.media)}`);
      }
      if (entry.title) {
        parts.push(`title=${isBareToken(entry.title) ? entry.title : quoteParamValue(entry.title)}`);
      }
      for (const param of entry.extParams ?? []) {
        const rendered = param.extended || isBareToken(param.value) ? param.value : quoteParamValue(param.value);
        parts.push(`${param.name}=${rendered}`);
      }
      return parts.join('; ');
    })
    .join(', ');
}
