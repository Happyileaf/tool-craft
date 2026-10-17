/**
 * RFC 4648 Base32 文本编解码与合法性校验的纯函数实现，不依赖 DOM 与 React。
 */

/** RFC 4648 标准 Base32 字母表 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 编码选项 */
export interface EncodeOptions {
  /** 是否输出填充字符 =，默认 true */
  padding?: boolean;
}

/** 解码结果 */
export interface DecodeResult {
  /** 解码成功时的文本，失败为 null */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 校验结果 */
export interface ValidateResult {
  /** 是否合法 */
  valid: boolean;
  /** 错误信息，合法时为 null */
  error: string | null;
}

/**
 * 计算带填充的 Base32 长度对应的填充字符个数
 *
 * @param unpaddedLength - 去填充后的长度
 * @returns 应补的填充字符个数（0 表示无需填充）
 */
function expectedPadding(unpaddedLength: number): number {
  return (8 - (unpaddedLength % 8)) % 8;
}

/**
 * 将文本按 RFC 4648 标准字母表编码为 Base32 字符串
 *
 * @param text - 待编码文本，按 UTF-8 处理
 * @param options - 编码选项
 * @returns Base32 字符串
 */
export function encodeBase32(text: string, options: EncodeOptions = {}): string {
  const { padding = true } = options;
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 0) {
    return '';
  }

  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += ALPHABET[(buffer >> bits) & 31] ?? '';
    }
    // 仅保留尚未输出的低位，避免长输入下 buffer 溢出
    buffer &= (1 << bits) - 1;
  }

  if (bits > 0) {
    output += ALPHABET[(buffer << (5 - bits)) & 31] ?? '';
  }

  if (padding) {
    const padCount = expectedPadding(output.length);
    if (padCount > 0) {
      output += '='.repeat(padCount);
    }
  }

  return output;
}

/**
 * 解码 Base32 字符串为文本，大小写不敏感，兼容带填充与去填充输入
 *
 * @param input - Base32 字符串
 * @returns 解码结果或错误信息
 */
export function decodeBase32(input: string): DecodeResult {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') {
    return { text: '', error: null };
  }

  const withoutPadding = cleaned.replace(/=+$/, '');
  const paddingPart = cleaned.slice(withoutPadding.length);

  if (withoutPadding.includes('=')) {
    return { text: null, error: '填充字符 = 只能出现在末尾' };
  }

  const upper = withoutPadding.toUpperCase();
  const remainder = upper.length % 8;
  if (remainder === 1 || remainder === 3 || remainder === 6) {
    return { text: null, error: `Base32 长度非法：${upper.length} 个字符无法构成完整数据` };
  }

  if (paddingPart.length > 0) {
    const expected = expectedPadding(upper.length);
    if (paddingPart.length !== expected) {
      return {
        text: null,
        error: `填充字符数量不正确，应为 ${expected} 个，实际 ${paddingPart.length} 个`,
      };
    }
  }

  let buffer = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (let index = 0; index < upper.length; index += 1) {
    const char = upper[index] ?? '';
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      return { text: null, error: `非法 Base32 字符 “${char}”（位置 ${index + 1}）` };
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }

  if (bits > 0 && buffer !== 0) {
    return { text: null, error: 'Base32 尾随位非零，可能是非法输入' };
  }

  const text = new TextDecoder().decode(new Uint8Array(bytes));
  return { text, error: null };
}

/**
 * 校验 Base32 字符串是否合法，并报告具体问题
 *
 * @param input - Base32 字符串
 * @returns 校验结果
 */
export function validateBase32(input: string): ValidateResult {
  const result = decodeBase32(input);
  return { valid: result.error === null, error: result.error };
}

/**
 * 规范化 Base32 字符串：去空白并转为大写
 *
 * @param input - Base32 字符串
 * @returns 规范化后的字符串
 */
export function normalizeBase32(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}
