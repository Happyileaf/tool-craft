/**
 * RFC 2047 encoded-word 邮件头解码纯函数实现，不依赖 DOM 与 React。
 *
 * 解析形如 `=?charset?encoding?encoded-text?=` 的编码字：
 * - charset：UTF-8、GB2312、GBK、ISO-8859-1 等 TextDecoder 支持的字符集（大小写不敏感）；
 * - encoding：B（Base64，大小写不敏感）或 Q（`_` 表示空格、`=XX` 为十六进制字节）；
 * - 同一标头内多段编码字与明文混排：相邻两个编码字之间的空白按 RFC 2047 §6.2
 *   折叠（仅折叠 CRLF/CR/LF 及其两侧 WSP 组成的间隔，单个普通空格原样保留）；
 * - 不处理 RFC 2231 延续参数与编码字跨行折行（输入需先完成物理行拼接）。
 */

/** encoded-word 结构正则：=?charset?B/Q?text?=，text 中不含 ? */
const ENCODED_WORD_PATTERN = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

/** 形如编码字开头但无法解析为合法结构（截断 / 缺 ?= 等）的检测 */
const MALFORMED_PATTERN = /=\?[^?]*\??[^?]*\??[^=]*$/;

/** 解码结果 */
export interface Rfc2047Result {
  /** 解码成功时的文本，失败为 null */
  text: string | null;
  /** 识别到的编码字数量 */
  encodedWordCount: number;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 单个编码字解析结果 */
interface DecodedWord {
  /** 解码后的文本 */
  text: string;
}

/**
 * 把 Base64 文本解码为字节，容错忽略其中的空白
 *
 * @param encoded - Base64 文本
 * @returns 字节数组；输入非法时返回 null
 */
function decodeBase64Bytes(encoded: string): Uint8Array | null {
  const compact = encoded.replace(/\s+/g, '');
  if (compact.length === 0) {
    return new Uint8Array(0);
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 !== 0) {
    return null;
  }
  try {
    const binary = atob(compact);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * 把 Q 编码文本解码为字节：`_` 为空格（0x20），`=XX` 为十六进制字节，
 * 其余可打印 ASCII 字节原样保留
 *
 * @param encoded - Q 编码文本
 * @returns 字节数组；存在非法 =XX 时返回错误信息
 */
function decodeQuotedBytes(
  encoded: string,
): { bytes: Uint8Array } | { error: string } {
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 1) {
    const char = encoded[i] ?? '';
    if (char === '_') {
      bytes.push(0x20);
      continue;
    }
    if (char === '=') {
      const hex = encoded.slice(i + 1, i + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) {
        return { error: `Q 编码中转义 "=${hex}" 非法，= 后必须紧跟两位十六进制数` };
      }
      bytes.push(parseInt(hex, 16));
      i += 2;
      continue;
    }
    bytes.push(char.charCodeAt(0) & 0xff);
  }
  return { bytes: Uint8Array.from(bytes) };
}

/**
 * 解码单个编码字
 *
 * @param charset - 字符集声明
 * @param encoding - B 或 Q
 * @param encodedText - 编码文本
 * @returns 解码文本或错误信息
 */
function decodeWord(
  charset: string,
  encoding: string,
  encodedText: string,
): DecodedWord | { error: string } {
  const normalizedCharset = charset.trim().toLowerCase();
  let bytes: Uint8Array;

  if (encoding.toUpperCase() === 'B') {
    const decoded = decodeBase64Bytes(encodedText);
    if (decoded === null) {
      return { error: `Base64 编码字 "=?${charset}?B?${encodedText}?=" 的内容不是合法 Base64` };
    }
    bytes = decoded;
  } else {
    const decoded = decodeQuotedBytes(encodedText);
    if ('error' in decoded) {
      return { error: decoded.error };
    }
    bytes = decoded.bytes;
  }

  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(normalizedCharset, { fatal: true });
  } catch {
    return { error: `不支持的字符集 "${charset}"（需为运行环境 TextDecoder 支持的字符集，如 UTF-8、GBK、GB2312）` };
  }
  try {
    return { text: decoder.decode(bytes) };
  } catch {
    return { error: `编码字声明的字符集 "${charset}" 与实际字节不匹配，解码得到非法字节序列` };
  }
}

/**
 * 解码含 RFC 2047 encoded-word 的邮件头文本
 *
 * @param input - 可能含编码字的标头文本
 * @returns 解码结果：text 为还原文本，encodedWordCount 为识别到的编码字数量
 */
export function decodeRfc2047(input: string): Rfc2047Result {
  if (input.trim() === '') {
    return { text: input, encodedWordCount: 0, error: null };
  }

  let count = 0;
  let output = '';
  let cursor = 0;
  ENCODED_WORD_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ENCODED_WORD_PATTERN.exec(input)) !== null) {
    const rawBefore = input.slice(cursor, match.index);
    let before = rawBefore;

    if (count > 0 && cursor !== 0) {
      // 相邻编码字之间仅含空白（空格 / 制表 / 换行）时折叠该间隔
      if (/^[ \t\r\n]+$/.test(rawBefore)) {
        before = '';
      }
    }

    const decoded = decodeWord(match[1] ?? '', match[2] ?? '', match[3] ?? '');
    if ('error' in decoded) {
      return { text: null, encodedWordCount: count, error: decoded.error };
    }

    output += before + decoded.text;
    cursor = match.index + match[0].length;
    count += 1;
  }

  // 检测残留的编码字开头（=? 之后无法匹配完整结构）
  const tail = input.slice(cursor);
  if (tail.includes('=?')) {
    const malformed = tail.match(MALFORMED_PATTERN);
    return {
      text: null,
      encodedWordCount: count,
      error: `存在未闭合或结构非法的编码字 "${malformed?.[0] ?? '=?'}…"，完整形式应为 =?字符集?B或Q?内容?=`,
    };
  }

  output += tail;

  // 无任何编码字时原样返回（标头可能本身就是明文）
  return { text: output, encodedWordCount: count, error: null };
}

/**
 * 判断文本中是否包含至少一个 RFC 2047 编码字
 *
 * @param input - 待检测文本
 * @returns 含可识别编码字返回 true
 */
export function hasEncodedWord(input: string): boolean {
  ENCODED_WORD_PATTERN.lastIndex = 0;
  return ENCODED_WORD_PATTERN.test(input);
}
