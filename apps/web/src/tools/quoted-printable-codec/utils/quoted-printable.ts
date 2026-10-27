/**
 * Quoted-Printable（RFC 2045 §6.7）文本编解码纯函数实现，不依赖 DOM 与 React。
 * 输入文本按 UTF-8 编码为字节后处理：
 * - 可打印 ASCII（33–126，除 "=" 61）原样输出；
 * - 水平制表符（9）与空格（32）仅在行尾按 RFC 要求转义；
 * - 其余字节（含 "="、UTF-8 续字节、控制符、裸换行）一律输出 =XX 大写十六进制；
 * - 行长度不超过 76 字符，超出时插入 "=" 软换行。
 */

/** RFC 2045 单行最大字符数（内容 75 + 行尾软换行 "=" 共 76） */
const MAX_LINE_LENGTH = 75;

/** 解码结果 */
export interface DecodeResult {
  /** 解码成功时的文本，失败为 null */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 把单个字节表示为大写 =XX 形式
 *
 * @param byte - 0–255 的字节值
 * @returns 三位 Quoted-Printable 转义串
 */
function encodeByte(byte: number): string {
  return '=' + byte.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * 把 UTF-8 文本编码为 Quoted-Printable 字符串
 *
 * @param text - 待编码文本
 * @param lineBreak - 软换行与文本换行使用的行结束符，默认 CRLF
 * @returns Quoted-Printable 字符串
 */
export function encodeQuotedPrintable(text: string, lineBreak: 'crlf' | 'lf' = 'crlf'): string {
  const eol = lineBreak === 'lf' ? '\n' : '\r\n';
  const bytes = new TextEncoder().encode(text);

  type Token = { kind: 'literal' | 'encoded' | 'newline'; raw: string; byte: number };
  const tokens: Token[] = [];

  for (const byte of bytes) {
    if (byte === 0x0a) {
      tokens.push({ kind: 'newline', raw: eol, byte });
    } else if (
      (byte >= 33 && byte <= 126 && byte !== 0x3d) ||
      byte === 0x09 ||
      byte === 0x20
    ) {
      tokens.push({ kind: 'literal', raw: String.fromCharCode(byte), byte });
    } else {
      tokens.push({ kind: 'encoded', raw: encodeByte(byte), byte });
    }
  }
  const lines: string[] = [];
  let current = '';

  const flushHardLine = () => {
    const lastCode = current.charCodeAt(current.length - 1);
    if (lastCode === 0x09 || lastCode === 0x20) {
      const escaped = encodeByte(lastCode);
      const head = current.slice(0, -1);
      if (head.length + escaped.length > MAX_LINE_LENGTH) {
        lines.push(head + '=');
        lines.push(escaped);
      } else {
        lines.push(head + escaped);
      }
    } else {
      lines.push(current);
    }
    current = '';
  };

  for (const token of tokens) {
    if (token.kind === 'newline') {
      flushHardLine();
      continue;
    }
    if (current.length + token.raw.length > MAX_LINE_LENGTH) {
      lines.push(current + '=');
      current = '';
    }
    current += token.raw;
  }
  flushHardLine();

  return lines.join(eol);
}

/**
 * 把 Quoted-Printable 字符串解码为 UTF-8 文本，
 * 严格校验非法 =XX 转义并报告位置
 *
 * @param input - 待解码的 Quoted-Printable 字符串
 * @returns 解码结果，失败时 error 给出具体位置与原因
 */
export function decodeQuotedPrintable(input: string): DecodeResult {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const bytes: number[] = [];
  const lines = normalized.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    let line = lines[lineIndex] ?? '';
    const isSoftBreak = line.endsWith('=');
    if (isSoftBreak) {
      line = line.slice(0, -1);
    }

    for (let column = 0; column < line.length; column += 1) {
      const char = line[column] ?? '';
      if (char !== '=') {
        bytes.push(char.charCodeAt(0) & 0xff);
        continue;
      }

      const hex = line.slice(column + 1, column + 3);
      const position = `第 ${lineIndex + 1} 行第 ${column + 1} 列`;
      if (hex.length < 2) {
        return {
          text: null,
          error: `${position} 的转义序列 "=${hex}" 不完整，= 后必须紧跟两位十六进制数（或作为行尾软换行）`,
        };
      }
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) {
        return {
          text: null,
          error: `${position} 的转义序列 "=${hex}" 非法，= 后两位必须是十六进制数（0-9、A-F）`,
        };
      }
      bytes.push(parseInt(hex, 16));
      column += 2;
    }

    if (!isSoftBreak && lineIndex < lines.length - 1) {
      bytes.push(0x0a);
    }
  }

  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes)),
      error: null,
    };
  } catch {
    return { text: null, error: '解码所得字节不是合法的 UTF-8 序列，无法还原为文本' };
  }
}

/**
 * 校验字符串是否为合法 Quoted-Printable（可成功解码）
 *
 * @param input - 待校验字符串
 * @returns 合法返回 true
 */
export function validateQuotedPrintable(input: string): boolean {
  return decodeQuotedPrintable(input).error === null;
}
