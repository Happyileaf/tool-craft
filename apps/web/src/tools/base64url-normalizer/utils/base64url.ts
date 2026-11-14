/**
 * RFC 4648 Base64 标准变体与 Base64URL 变体的规范化互转（零依赖纯函数）
 *
 * - 标准 Base64（§4）：字母表 A-Z a-z 0-9 + /，以 = 填充至 4 的倍数
 * - Base64URL（§5）：字母表 A-Z a-z 0-9 - _，不带填充
 * 解码字节用 TextEncoder/TextDecoder 完成 UTF-8 往返，字符替换与校验均为确定性操作。
 */

export type Base64Variant = 'standard' | 'url';

export interface NormalizeResult {
  /** 是否处理成功 */
  ok: boolean;
  /** 规范化后的输出行（失败时原样保留输入） */
  output: string;
  /** 识别到的变体（失败时为 null） */
  variant: Base64Variant | null;
  /** 输入是否携带 = 填充 */
  padded: boolean;
  /** 失败原因（成功时为 null），行号由批量层补充 */
  error: string | null;
}

const STD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const STD_CHAR_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const URL_CHAR_RE = /^[A-Za-z0-9_-]*$/;
const ILLEGAL_CHAR_RE = /[^A-Za-z0-9+/=_-]/;

/** 把字符串按 UTF-8 编码为字节，再做标准 Base64 编码（零依赖） */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += STD_ALPHABET[b0 >> 2];
    out += STD_ALPHABET[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    out += b1 === undefined ? '=' : STD_ALPHABET[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    out += b2 === undefined ? '=' : STD_ALPHABET[b2 & 0x3f];
  }
  return out;
}

/** 解码一个已规范化（标准字母表、带正确填充）的 Base64 字符串为 UTF-8 文本 */
export function decodeBase64(standard: string): string {
  const table: Record<string, number> = {};
  for (let i = 0; i < STD_ALPHABET.length; i += 1) {
    table[STD_ALPHABET[i] as string] = i;
  }
  const clean = standard.replace(/=+$/, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = table[clean[i] as string] ?? 0;
    const c1 = table[clean[i + 1] as string] ?? 0;
    const c2 = clean[i + 2] === undefined ? -1 : table[clean[i + 2] as string] ?? 0;
    const c3 = clean[i + 3] === undefined ? -1 : table[clean[i + 3] as string] ?? 0;
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) bytes.push(((c1 & 0x0f) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 0x03) << 6) | c3);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** 标准 Base64 → Base64URL：+/- 字符替换并去除填充 */
export function toBase64Url(standard: string): string {
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64URL → 标准 Base64：字符替换并按 RFC 4648 补齐 = 填充 */
export function toStandardBase64(urlSafe: string): string {
  const replaced = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (replaced.length % 4)) % 4;
  return replaced + '='.repeat(pad);
}

/**
 * 自动识别输入变体：
 * - 含 - 或 _ 视为 URL 变体；含 + 或 / 视为标准变体
 * - 仅含通用字符时，有填充视为标准，无填充视为 URL（JWT 风格）
 */
export function detectVariant(token: string): Base64Variant | null {
  if (token.includes('-') || token.includes('_')) return 'url';
  if (token.includes('+') || token.includes('/') || token.includes('=')) return 'standard';
  return token.length % 4 === 0 ? 'standard' : 'url';
}

/** 校验 token 的字符集与长度，返回错误信息（合法时返回 null） */
function validate(token: string, variant: Base64Variant): string | null {
  if (token === '') return '空令牌';
  const illegal = ILLEGAL_CHAR_RE.exec(token);
  if (illegal) {
    return `含非法字符 “${illegal[0]}”（位置 ${illegal.index}），Base64 仅允许 A-Z a-z 0-9 + / = 或 - _`;
  }
  if (variant === 'url') {
    if (!URL_CHAR_RE.test(token)) return 'URL 变体中不允许出现 + / 或 = 填充字符';
    // 无填充长度仅禁止余数为 1（无法对应任何字节数）
    if (token.length % 4 === 1) return `长度 ${token.length} 非法：无填充 Base64URL 长度余数不能为 1`;
    return null;
  }
  if (!STD_CHAR_RE.test(token)) return '标准变体中不允许出现 - 或 _ 字符';
  if (token.length % 4 !== 0) {
    return `长度 ${token.length} 非法：带填充的标准 Base64 长度必须是 4 的倍数`;
  }
  // 填充只能出现在末尾且最多两个 =
  const body = token.replace(/=+$/, '');
  if (token.length - body.length > 2) return '填充 = 最多为 2 个且只能位于末尾';
  return null;
}

/**
 * 单行规范化：mode 为 auto 时自动识别变体，否则强制按指定方向处理。
 * 失败时 ok=false 且 output 原样保留输入。
 */
export function normalizeToken(
  token: string,
  mode: 'auto' | 'to-url' | 'to-standard',
): NormalizeResult {
  const trimmed = token.trim();
  const variant = detectVariant(trimmed);
  const padded = trimmed.includes('=');

  // auto 模式统一规范化为 URL 形式（JWT/PASETO 风格），显式模式按指定方向
  const target: Base64Variant = mode === 'to-standard' ? 'standard' : 'url';

  const error = validate(trimmed, variant ?? target);
  if (error || !variant) {
    return { ok: false, output: token, variant, padded, error: error ?? '无法识别输入变体' };
  }

  const standard = variant === 'url' ? toStandardBase64(trimmed) : trimmed;
  const output = target === 'url' ? toBase64Url(standard) : standard;
  return { ok: true, output, variant, padded, error: null };
}

export interface BatchLine {
  /** 1 起始的行号 */
  line: number;
  ok: boolean;
  output: string;
  variant: Base64Variant | null;
  padded: boolean;
  error: string | null;
}

export interface BatchResult {
  lines: BatchLine[];
  /** 与输入等行数的输出文本，空行保留，失败行原样保留 */
  output: string;
  successCount: number;
  failureCount: number;
}

/** 多行批量处理：空行保留，每行独立校验并逐行报告错误 */
export function normalizeBatch(
  text: string,
  mode: 'auto' | 'to-url' | 'to-standard',
): BatchResult {
  const sourceLines = text.replace(/\r\n?/g, '\n').split('\n');
  const lines: BatchLine[] = sourceLines.map((raw, index) => {
    if (raw.trim() === '') {
      return { line: index + 1, ok: true, output: raw, variant: null, padded: false, error: null };
    }
    const result = normalizeToken(raw, mode);
    return { line: index + 1, ...result };
  });
  const processed = lines.filter((l) => l.variant !== null);
  return {
    lines,
    output: lines.map((l) => l.output).join('\n'),
    successCount: processed.filter((l) => l.ok).length,
    failureCount: processed.filter((l) => !l.ok).length,
  };
}
