/**
 * Ascii85（Base85）文本编解码纯函数实现，不依赖 DOM 与 React。
 * 支持标准 Ascii85（Adobe/PostScript：`!`–`u` 字母表、`z` 四零字节压缩、`<~ ~>` 定界符）
 * 与 btoa v4.2 变体（相同字母表，额外支持 `y` 代表 4 个空格，使用 `xbtoa Begin/End` 定界）。
 */

/** Ascii85 变体 */
export type Ascii85Variant = 'standard' | 'btoa';

/** 编码选项 */
export interface EncodeOptions {
  /** 字母表变体，默认标准 Ascii85 */
  variant?: Ascii85Variant;
  /** 是否输出 `<~ ~>`（标准）或 `xbtoa Begin/End`（btoa）定界符，默认 false */
  delimiters?: boolean;
  /** 是否允许压缩简写（标准：z=4 零字节；btoa：z=4 零字节、y=4 空格），默认 true */
  compressZ?: boolean;
}

/** 解码结果 */
export interface DecodeResult {
  /** 解码成功时的文本，失败为 null */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

const STANDARD_OFFSET = 33;

/**
 * 把单个 Ascii85 字符映射为对应的数字（0–84，字母表 !–u）
 *
 * @param char - 待映射的字符
 * @returns 数字值；非法字符返回 null
 */
function charToCode(char: string): number | null {
  const code = char.charCodeAt(0) - STANDARD_OFFSET;
  return code >= 0 && code <= 84 ? code : null;
}

/**
 * 把一个 32 位无符号整数编码为 5 个 Ascii85 字符
 *
 * @param value - 32 位无符号整数
 * @returns 长度恒为 5 的 Ascii85 字符组
 */
function encodeQuintet(value: number): string {
  let encoded = '';
  let remainder = value >>> 0;
  for (let index = 0; index < 5; index += 1) {
    encoded = String.fromCharCode(STANDARD_OFFSET + (remainder % 85)) + encoded;
    remainder = Math.floor(remainder / 85);
  }
  return encoded;
}

/**
 * 将文本编码为 Ascii85（Base85）字符串，输入按 UTF-8 处理
 *
 * @param text - 待编码文本
 * @param options - 编码选项
 * @returns Ascii85 字符串
 */
export function encodeAscii85(text: string, options: EncodeOptions = {}): string {
  const { variant = 'standard', delimiters = false, compressZ = true } = options;
  const bytes = new TextEncoder().encode(text);
  const tail = bytes.length % 4;

  let body = '';

  for (let offset = 0; offset < bytes.length - tail; offset += 4) {
    const value =
      ((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0);

    if (compressZ && value === 0) {
      body += 'z';
      continue;
    }
    // btoa v4.2：4 个空格（0x20202020）压缩为 y
    if (variant === 'btoa' && compressZ && value === 0x20202020) {
      body += 'y';
      continue;
    }

    body += encodeQuintet(value);
  }

  if (tail > 0) {
    const tailBytes: [number, number, number, number] = [0, 0, 0, 0];
    for (let index = 0; index < tail; index += 1) {
      tailBytes[index] = bytes[bytes.length - tail + index] ?? 0;
    }
    const value =
      (tailBytes[0] << 24) | (tailBytes[1] << 16) | (tailBytes[2] << 8) | tailBytes[3];

    // 尾组只保留 tail + 1 个编码字符
    body += encodeQuintet(value).slice(0, tail + 1);
  }

  if (delimiters) {
    return variant === 'btoa' ? `xbtoa Begin\n${body}\nxbtoa End` : `<~${body}~>`;
  }
  return body;
}

/**
 * 解码 Ascii85 字符串为文本
 *
 * @param input - Ascii85 字符串，可含定界符与任意空白
 * @param variant - 字母表变体；auto 时按定界符或 `y` 简写自动判断 btoa
 * @returns 解码结果或错误信息
 */
export function decodeAscii85(
  input: string,
  variant: Ascii85Variant | 'auto' = 'auto',
): DecodeResult {
  let payload = input.trim();
  let detectedVariant: Ascii85Variant = variant === 'auto' ? 'standard' : variant;
  let hasDelimiter = false;

  if (payload.startsWith('<~')) {
    if (!payload.endsWith('~>')) {
      return { text: null, error: '检测到起始定界符 <~，但缺少结束定界符 ~>' };
    }
    payload = payload.slice(2, -2);
    hasDelimiter = true;
  } else if (/^xbtoa Begin\b/i.test(payload)) {
    const match = payload.match(/^xbtoa Begin\s*([\s\S]*?)\s*xbtoa End\s*$/i);
    if (!match) {
      return { text: null, error: '检测到 xbtoa Begin 起始标记，但缺少 xbtoa End 结束标记' };
    }
    payload = match[1] ?? '';
    detectedVariant = 'btoa';
    hasDelimiter = true;
  }

  // 去除全部空白字符
  const cleaned = payload.replace(/\s+/g, '');
  if (cleaned === '') {
    return { text: '', error: null };
  }

  // 无定界符且自动识别时：y 在标准字母表中是普通字符，仅 btoa 才把它当作 4 空格简写
  if (variant === 'auto' && !hasDelimiter && cleaned.includes('y')) {
    detectedVariant = 'btoa';
  }

  const bytes: number[] = [];
  const acc: number[] = [];
  let sum = 0;

  const flush = (position: number): string | null => {
    const groupLength = acc.length;
    if (groupLength === 0) {
      return null;
    }
    // 尾组按高位补 u 还原 32 位值：位置和 × 85^(5-k)，
    // 再加偏置 85^(5-k)-1（与 CPython base64.a85decode 一致），把被丢弃低位导致的缺口补回半档
    const missingPower = 85 ** (5 - groupLength);
    const value = sum * missingPower + (missingPower - 1);
    if (value > 0xffffffff) {
      return `Ascii85 尾组解码值超出 32 位无符号整数范围，输入可能已损坏（位置 ${position}）`;
    }
    const outputBytes = groupLength - 1;
    const fullBytes = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ];
    for (let byteIndex = 0; byteIndex < outputBytes; byteIndex += 1) {
      bytes.push(fullBytes[byteIndex] ?? 0);
    }
    return null;
  };

  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index] ?? '';
    const position = index + 1;

    if (char === 'z' || (char === 'y' && detectedVariant === 'btoa')) {
      if (acc.length > 0) {
        return {
          text: null,
          error: `“${char}” 压缩简写只能出现在完整数据组边界，不能夹在数据组中（位置 ${position}）`,
        };
      }
      if (char === 'z') {
        bytes.push(0, 0, 0, 0);
      } else {
        bytes.push(0x20, 0x20, 0x20, 0x20);
      }
      continue;
    }

    const code = charToCode(char);
    if (code === null) {
      return { text: null, error: `非法 Ascii85 字符 “${char}”（位置 ${position}）` };
    }

    acc.push(code);
    sum = sum * 85 + code;

    if (acc.length === 5) {
      if (sum > 0xffffffff) {
        return {
          text: null,
          error: `Ascii85 编码组超出 32 位无符号整数范围，输入可能已损坏（位置 ${position}）`,
        };
      }
      bytes.push((sum >>> 24) & 0xff, (sum >>> 16) & 0xff, (sum >>> 8) & 0xff, sum & 0xff);
      acc.length = 0;
      sum = 0;
    }
  }

  const tailError = flush(cleaned.length);
  if (tailError !== null) {
    return { text: null, error: tailError };
  }

  const text = new TextDecoder().decode(new Uint8Array(bytes));
  return { text, error: null };
}

/**
 * 校验 Ascii85 字符串是否可解码
 *
 * @param input - Ascii85 字符串
 * @returns 是否合法与错误信息
 */
export function validateAscii85(input: string): { valid: boolean; error: string | null } {
  const result = decodeAscii85(input);
  return { valid: result.error === null, error: result.error };
}
