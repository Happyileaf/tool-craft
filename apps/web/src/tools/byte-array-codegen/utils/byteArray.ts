/**
 * 字节数组代码生成与反向解析纯函数。
 * 零依赖：Base64 使用本地字母表实现，文本使用 TextEncoder/TextDecoder（浏览器内置）。
 */
import type { InputType, Language } from '../constants';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP: number[] = (() => {
  const table = new Array<number>(128).fill(-1);
  for (let i = 0; i < BASE64_ALPHABET.length; i += 1) {
    table[BASE64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

/** 字节数组转连续/带空格的小写 Hex */
export function bytesToHex(bytes: Uint8Array, spaced = false): string {
  const parts = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
  return parts.join(spaced ? ' ' : '');
}

/**
 * 解析 Hex 字符串为字节数组；允许空白、0x 前缀、逗号分隔。
 * 奇数个 hex 数字或含非 hex 字符时报错。
 */
export function hexToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,;]+/g, '');
  if (cleaned === '') return new Uint8Array(0);
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    const bad = cleaned.match(/[^0-9a-fA-F]/);
    throw new Error(`Hex 中存在非法字符："${bad ? bad[0] : ''}"。`);
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error(`Hex 数字个数必须为偶数，当前为 ${cleaned.length} 个（半字节无法组成字节）。`);
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节数组转标准 Base64（含填充） */
export function bytesToBase64(bytes: Uint8Array): string {
  let output = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    output += BASE64_ALPHABET.charAt(b0 >> 2);
    output += BASE64_ALPHABET.charAt(((b0 & 0x03) << 4) | (b1 ?? 0) >> 4);
    if (b1 === undefined) {
      output += '==';
    } else {
      output += BASE64_ALPHABET.charAt((((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)));
      output += b2 === undefined ? '=' : BASE64_ALPHABET.charAt(b2 & 0x3f);
    }
  }
  return output;
}

/** 解析标准 Base64 为字节数组；容忍空白与 URL-safe 字母（-/_），校验填充与字符 */
export function base64ToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (cleaned === '') return new Uint8Array(0);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    throw new Error('Base64 格式不合法（字符集错误或长度不是 4 的倍数）。');
  }
  const padIndex = cleaned.indexOf('=');
  if (padIndex !== -1 && !/^=+$/.test(cleaned.slice(padIndex))) {
    throw new Error('Base64 的填充符 "=" 只能出现在末尾。');
  }
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  const outLen = (cleaned.length / 4) * 3 - padding;
  const bytes = new Uint8Array(outLen);
  let p = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const c0 = BASE64_LOOKUP[cleaned.charCodeAt(i)];
    const c1 = BASE64_LOOKUP[cleaned.charCodeAt(i + 1)];
    const c2Raw = cleaned.charAt(i + 2);
    const c3Raw = cleaned.charAt(i + 3);
    const c2 = c2Raw === '=' ? 0 : BASE64_LOOKUP[cleaned.charCodeAt(i + 2)];
    const c3 = c3Raw === '=' ? 0 : BASE64_LOOKUP[cleaned.charCodeAt(i + 3)];
    if (c0 === undefined || c1 === undefined || c2 === undefined || c3 === undefined
      || c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) {
      throw new Error('Base64 中存在非法字符。');
    }
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (p < outLen) bytes[p] = (triple >> 16) & 0xff;
    if (p + 1 < outLen) bytes[p + 1] = (triple >> 8) & 0xff;
    if (p + 2 < outLen) bytes[p + 2] = triple & 0xff;
    p += 3;
  }
  return bytes;
}

/** 文本转 UTF-8 字节 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** UTF-8 字节转文本（非法序列替换为 U+FFFD） */
export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/** 按输入类型解析为字节 */
export function decodeInput(type: InputType, raw: string): Uint8Array {
  if (type === 'hex') return hexToBytes(raw);
  if (type === 'base64') return base64ToBytes(raw);
  return textToBytes(raw);
}

/** C 标识符合法性校验（数组变量名） */
export function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

function chunkLines(bytes: Uint8Array, perLine: number, formatter: (b: number) => string): string[] {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += perLine) {
    const slice = bytes.slice(i, Math.min(i + perLine, bytes.length));
    lines.push(`  ${Array.from(slice).map(formatter).join(', ')}`);
  }
  return lines;
}

export interface GenerateOptions {
  /** 变量名（需符合各语言标识符规则） */
  variableName: string;
  /** 每行字节数（1-64） */
  bytesPerLine: number;
}

export interface GenerateResult {
  /** 生成的代码 */
  code: string;
  /** 语言对应的文件扩展名 */
  extension: string;
}

/** 生成目标语言的字节数组声明代码 */
export function generateCode(bytes: Uint8Array, language: Language, options: GenerateOptions): GenerateResult {
  const name = options.variableName.trim();
  if (!isValidIdentifier(name)) {
    throw new Error(`变量名 "${name}" 不合法：需以字母或下划线开头，仅含字母、数字、下划线。`);
  }
  const perLine = Math.max(1, Math.min(64, Math.floor(options.bytesPerLine) || 1));
  const len = bytes.length;

  if (language === 'c') {
    const body =
      len === 0
        ? '  // empty'
        : chunkLines(bytes, perLine, (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(',\n');
    const trailing = len > 0 ? ',\n' : '';
    const code =
      `const unsigned char ${name}[${len}] = {\n${body}${trailing}};\n` +
      `const unsigned int ${name}_len = ${len};`;
    return { code, extension: 'c' };
  }

  if (language === 'java') {
    // Java byte 为有符号：> 127 的字节写为 (byte) 0xXX，保证跨工具链一致
    const body =
      len === 0
        ? ''
        : chunkLines(bytes, perLine, (b) =>
            b > 127
              ? `(byte) 0x${b.toString(16).padStart(2, '0').toUpperCase()}`
              : `0x${b.toString(16).padStart(2, '0').toUpperCase()}`,
          ).join(',\n');
    const code = `byte[] ${name} = {${len > 0 ? `\n${body}\n` : ''}}; // ${len} bytes`;
    return { code, extension: 'java' };
  }

  if (language === 'python') {
    if (len === 0) return { code: `${name} = b""  # 0 bytes`, extension: 'py' };
    const body = chunkLines(
      bytes,
      perLine,
      (b) => `\\x${b.toString(16).padStart(2, '0')}`,
    )
      .map((line) => line.replace(/, /g, ''))
      .map((line) => `  b"${line.trim()}"`)
      .join('\n');
    const code = `${name} = (\n${body}\n)  # ${len} bytes`;
    return { code, extension: 'py' };
  }

  // go
  const body =
    len === 0
      ? ''
      : chunkLines(bytes, perLine, (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(',\n');
  const code = `${name} := []byte{${len > 0 ? `\n${body}\n` : ''}} // ${len} bytes`;
  return { code, extension: 'go' };
}

/** 单个引号字符串内的转义序列解码为字节（\xHH、\nnn 八进制、常见字符转义） */
export function decodeEscapes(literal: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < literal.length; i += 1) {
    const ch = literal.charAt(i);
    if (ch !== '\\') {
      const code = ch.charCodeAt(0);
      if (code > 0x7f) {
        // 字符串内的非 ASCII 字符按 UTF-8 解释（Python b'€' 等情况）
        out.push(...new TextEncoder().encode(ch));
      } else {
        out.push(code);
      }
      continue;
    }
    const next = literal.charAt(i + 1);
    if (next === 'x' || next === 'X') {
      const hex = literal.slice(i + 2, i + 4);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error(`非法的 \\x 转义："\\x${hex}"。`);
      out.push(parseInt(hex, 16));
      i += 3;
    } else if (next >= '0' && next <= '7') {
      // \0 是 NUL；\1-\7 开头视为 1-3 位八进制（与 C/Python 一致）
      const m = /^[0-7]{1,3}/.exec(literal.slice(i + 1));
      const oct = m ? m[0] : next;
      if (!oct) throw new Error('非法的八进制转义。');
      out.push(parseInt(oct, 8) & 0xff);
      i += oct.length;
    } else {
      const simple: Record<string, number> = {
        n: 0x0a, r: 0x0d, t: 0x09, b: 0x08, f: 0x0c, v: 0x0b, a: 0x07, '0': 0x00,
        '\\': 0x5c, "'": 0x27, '"': 0x22, '?': 0x3f,
      };
      if (!(next in simple)) throw new Error(`不支持的转义序列："\\${next}"。`);
      out.push(simple[next] ?? 0);
      i += 1;
    }
  }
  return out;
}

/**
 * 反向解析粘贴的数组字面量（C/Java/Go/Python 风格均可）。
 * 提取花括号/方括号内的 0xHH、十进制数（含 Java 的 (byte) 0xHH 与负数字面量），
 * 以及 Python b"..." / b'...' 中的转义字符串。
 */
export function parseArrayLiteral(input: string): Uint8Array {
  if (input.trim() === '') throw new Error('请粘贴数组字面量代码。');

  const bytes: number[] = [];

  // 1) Python bytes 字符串：b"..." / b'...'，可能跨行由相邻字面量拼接
  const stringRe = /\bb(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let hasString = false;
  let sm: RegExpExecArray | null;
  while ((sm = stringRe.exec(input)) !== null) {
    hasString = true;
    bytes.push(...decodeEscapes(sm[2] ?? ''));
  }

  // 2) 数值数组：C/Java/Go 的数组体用花括号（如 data[] = {...}、[]byte{...}），
  //    Python 用方括号。优先选花括号，避免被声明处的空 [] 干扰。
  let open = input.indexOf('{');
  let closeCh = '}';
  if (open === -1) {
    open = input.indexOf('[');
    closeCh = ']';
  }
  if (open !== -1) {
    const close = input.indexOf(closeCh, open + 1);
    let body = close === -1 ? input.slice(open + 1) : input.slice(open + 1, close);
    // 去除数组体内的 b"..." / b'...' 字符串（其内容已在上面的字符串阶段提取，避免重复计数）
    body = body.replace(/\bb(['"])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
    const tokens = body.match(/(?:\(byte\)\s*)?(?:0[xX][0-9a-fA-F]+|-?\d+)/g);
    if (tokens) {
      for (const tok of tokens) {
        const isHex = /0[xX]/.test(tok);
        let v = Number(tok.replace(/\(byte\)\s*/, '').trim());
        if (!Number.isFinite(v)) throw new Error(`无法解析的数值："${tok}"。`);
        if (isHex && v < 0) throw new Error(`十六进制数值不能为负："${tok}"。`);
        if (v < 0) v = 256 + (v % 256); // Java 负数字面量（-1 → 255）
        if (v > 255) throw new Error(`字节值超出 0-255 范围："${tok}"（${v}）。`);
        bytes.push(v & 0xff);
      }
    }
  }

  if (!hasString && bytes.length === 0) {
    throw new Error('未在粘贴内容中识别到字节（需要 { 0x.. } 数组或 b"..." 字面量）。');
  }
  return Uint8Array.from(bytes);
}
