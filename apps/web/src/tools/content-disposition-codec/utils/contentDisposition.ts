// Content-Disposition header parsing and construction (RFC 6266),
// including the RFC 8187 ext-value encoding used by filename*.

export interface DispositionParam {
  name: string;
  value: string;
  /** True when the value came from an ext-value (name*), already percent-decoded. */
  extended: boolean;
}

export interface ParsedDisposition {
  ok: boolean;
  type: string;
  params: DispositionParam[];
  /** Effective filename per RFC 6266 §4.2: filename* wins over filename. */
  filename?: string;
  filenameSource?: 'filename*' | 'filename' | 'none';
  error?: string;
}

interface Tokenizer {
  source: string;
  index: number;
}

function skipWhitespace(tokenizer: Tokenizer): void {
  while (tokenizer.index < tokenizer.source.length) {
    const code = tokenizer.source.charCodeAt(tokenizer.index);
    if (code !== 0x20 && code !== 0x09) {
      break;
    }
    tokenizer.index += 1;
  }
}

function readToken(tokenizer: Tokenizer): string {
  const start = tokenizer.index;
  while (tokenizer.index < tokenizer.source.length) {
    const code = tokenizer.source.charCodeAt(tokenizer.index);
    // token = 1*tchar (RFC 9110): visible chars excluding separators.
    if (isSeparator(code) || code === 0x20 || code === 0x09) {
      break;
    }
    tokenizer.index += 1;
  }
  return tokenizer.source.slice(start, tokenizer.index);
}

function isSeparator(code: number): boolean {
  switch (code) {
    case 0x22: // "
    case 0x28: // (
    case 0x29: // )
    case 0x2c: // ,
    case 0x2f: // /
    case 0x3b: // ;
    case 0x3c: // <
    case 0x3d: // =
    case 0x3e: // >
    case 0x3f: // ?
    case 0x40: // @
    case 0x5b: // [
    case 0x5c: // backslash
    case 0x5d: // ]
    case 0x7b: // {
    case 0x7d: // }
      return true;
    default:
      return false;
  }
}

function readQuotedString(tokenizer: Tokenizer): string {
  // Assumes current char is the opening double quote.
  tokenizer.index += 1;
  let result = '';
  while (tokenizer.index < tokenizer.source.length) {
    const char = tokenizer.source[tokenizer.index];
    if (char === undefined) {
      break;
    }
    if (char === '"') {
      tokenizer.index += 1;
      return result;
    }
    if (char === '\\') {
      // quoted-pair: backslash escapes the next character.
      const next = tokenizer.source[tokenizer.index + 1];
      if (next !== undefined) {
        result += next;
        tokenizer.index += 2;
        continue;
      }
    }
    result += char;
    tokenizer.index += 1;
  }
  throw new Error('引号字符串未闭合（缺少结束的双引号）');
}

/** Decode an RFC 8187 ext-value: charset'language'percent-encoded-value. */
export function decodeExtValue(raw: string): { value: string; charset: string; language: string } {
  const firstQuote = raw.indexOf("'");
  const secondQuote = raw.indexOf("'", firstQuote + 1);
  if (firstQuote === -1 || secondQuote === -1) {
    throw new Error("ext-value 必须为 charset'language'pct-encoded 三段结构");
  }
  const charset = raw.slice(0, firstQuote).toLowerCase();
  const language = raw.slice(firstQuote + 1, secondQuote);
  const pctEncoded = raw.slice(secondQuote + 1);

  if (charset !== 'utf-8' && charset !== 'iso-8859-1') {
    throw new Error(`不支持的字符集：${charset}（仅支持 UTF-8 / ISO-8859-1）`);
  }

  const bytes = percentDecodeToBytes(pctEncoded);
  const decoder = new TextDecoder(charset === 'iso-8859-1' ? 'iso-8859-1' : 'utf-8');
  return { value: decoder.decode(bytes), charset, language };
}

function percentDecodeToBytes(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === undefined) {
      throw new Error('百分号编码区出现越界字符');
    }
    if (char === '%') {
      const hex = input.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        throw new Error(`非法百分号编码：%${hex}`);
      }
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      const code = char.charCodeAt(0);
      if (code > 0xff) {
        throw new Error('百分号编码区出现非 latin-1 原始字符，请先编码为字节序列');
      }
      bytes.push(code);
    }
  }
  return new Uint8Array(bytes);
}

/** Parse a full Content-Disposition header field value. */
export function parseContentDisposition(header: string): ParsedDisposition {
  const tokenizer: Tokenizer = { source: header, index: 0 };
  skipWhitespace(tokenizer);
  const type = readToken(tokenizer).toLowerCase();
  if (!type) {
    return { ok: false, type: '', params: [], error: '缺少 disposition-type（如 attachment / inline）' };
  }

  const params: DispositionParam[] = [];
  try {
    while (true) {
      skipWhitespace(tokenizer);
      if (tokenizer.index >= tokenizer.source.length) {
        break;
      }
      if (tokenizer.source[tokenizer.index] !== ';') {
        return {
          ok: false,
          type,
          params,
          error: `参数前应为分号，实际遇到：${tokenizer.source[tokenizer.index] ?? '末尾'}`,
        };
      }
      tokenizer.index += 1;
      skipWhitespace(tokenizer);

      const name = readToken(tokenizer).toLowerCase();
      if (!name) {
        return { ok: false, type, params, error: '缺少参数名' };
      }
      const extended = name.endsWith('*');
      skipWhitespace(tokenizer);
      if (tokenizer.source[tokenizer.index] !== '=') {
        return { ok: false, type, params, error: `参数 ${name} 后缺少 =` };
      }
      tokenizer.index += 1;
      skipWhitespace(tokenizer);

      let value: string;
      if (tokenizer.source[tokenizer.index] === '"' && !extended) {
        value = readQuotedString(tokenizer);
      } else {
        value = readToken(tokenizer);
      }

      if (extended) {
        const decoded = decodeExtValue(value);
        value = decoded.value;
      }
      params.push({ name, value, extended });
    }
  } catch (error) {
    return { ok: false, type, params, error: (error as Error).message };
  }

  const filenameStar = params.find((param) => param.name === 'filename*');
  const filename = params.find((param) => param.name === 'filename');
  let effective: string | undefined;
  let source: ParsedDisposition['filenameSource'] = 'none';
  if (filenameStar) {
    effective = filenameStar.value;
    source = 'filename*';
  } else if (filename) {
    effective = filename.value;
    source = 'filename';
  }

  return { ok: true, type, params, filename: effective, filenameSource: source };
}

function percentEncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let result = '';
  for (const byte of bytes) {
    // attr-char set (RFC 8187) left unescaped; everything else percent-encoded.
    if (isAttrChar(byte)) {
      result += String.fromCharCode(byte);
    } else {
      result += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return result;
}

function isAttrChar(byte: number): boolean {
  if (byte >= 0x30 && byte <= 0x39) {
    return true; // digits
  }
  if (byte >= 0x41 && byte <= 0x5a) {
    return true; // A-Z
  }
  if (byte >= 0x61 && byte <= 0x7a) {
    return true; // a-z
  }
  return '!#$&+-.^_`|~'.includes(String.fromCharCode(byte));
}

/** Build an RFC 8187 ext-value for a Unicode filename. */
export function encodeExtValue(filename: string, language = ''): string {
  return `UTF-8'${language}'${percentEncodeUtf8(filename)}`;
}

/** ASCII fallback for filename: strip non-ASCII and quote if it contains separators. */
function asciiFallback(filename: string): string {
  return filename.replace(/[^\x20-\x7e]/g, '_');
}

export interface BuildOptions {
  type: string;
  filename: string;
  language?: string;
}

/** Construct a Content-Disposition header carrying both filename* and an ASCII filename. */
export function buildContentDisposition(options: BuildOptions): string {
  const type = options.type.trim().toLowerCase() || 'attachment';
  const fallback = asciiFallback(options.filename);
  const needsQuote = /[\s;,"\\()<>@?\[\]{}=]/.test(fallback) || fallback === '';
  const quotedFallback = needsQuote ? `"${fallback.replace(/["\\]/g, '\\$&')}"` : fallback;
  return `${type}; filename=${quotedFallback}; filename*=${encodeExtValue(
    options.filename,
    options.language ?? '',
  )}`;
}
