/**
 * RFC 4648 标准 Base64 与 Base64URL 两种字母表变体的规范化互转（零依赖纯函数）
 *
 * 标准 Base64（§4）字母表含 `+` `/`，以 `=` 填充到 4 字节倍数；
 * Base64URL（§5）以 `-` `_` 替换 `+` `/` 且省略填充。
 * 本模块只做字符层面的确定性转换与校验，不触碰 DOM / React，错误以结果对象返回。
 */

export type Base64Variant = 'standard' | 'base64url';

/** 一行令牌的转换结果 */
export interface ConvertLineResult {
  /** 转换后的输出；出错时为空串 */
  output: string;
  /** 输入被识别出的变体；出错时为 null */
  detected: Base64Variant | null;
  /** 人类可读错误信息；无错误时为 null */
  error: string | null;
  /** 出错字符在「去除空白后的令牌」中的 0-based 偏移；无错误时为 null */
  errorOffset: number | null;
}

/** 批量转换结果 */
export interface BatchResult {
  output: string;
  warnings: string[];
}

const BASE64URL_TO_STANDARD: Record<string, string> = { '-': '+', _: '/' };
const STANDARD_TO_BASE64URL: Record<string, string> = { '+': '-', '/': '_' };

/**
 * 识别单行令牌属于哪种变体。
 * - 含 `-` / `_` 且不含 `+` / `/` / `=` → base64url
 * - 含 `+` / `/` 或 `=` 填充 → standard
 * - 仅字母数字（两种字母表交集）→ 无填充的标准 Base64，按 standard 处理
 */
export function detectVariant(token: string): Base64Variant {
  if (token.includes('-') || token.includes('_')) {
    return 'base64url';
  }
  return 'standard';
}

/** 按 RFC 4648 §4/§5 校验字符集、填充位置与长度合法性，返回首个非法字符偏移 */
function validate(token: string, variant: Base64Variant): number | null {
  if (token.length === 0) {
    return null;
  }
  const allowed =
    variant === 'base64url'
      ? /[A-Za-z0-9_-]/
      : /[A-Za-z0-9+/=]/;
  const badIndex = token.split('').findIndex((ch) => !allowed.test(ch));
  if (badIndex >= 0) {
    return badIndex;
  }
  if (variant === 'standard') {
    const padIndex = token.indexOf('=');
    if (padIndex >= 0) {
      // 填充只能连续出现在末尾，最多两个
      const padding = token.length - padIndex;
      if (padding > 2 || token.slice(padIndex).split('').some((ch) => ch !== '=')) {
        return padIndex;
      }
    }
    // 含填充时总长必须为 4 的倍数；无填充时长度不能为 1
    if (token.includes('=') && token.length % 4 !== 0) {
      return token.length - 1;
    }
  }
  // 去除填充后的有效载荷长度不能为 1（无法承载任何完整字节组）
  const payloadLength = variant === 'standard' ? token.replace(/=+$/, '').length : token.length;
  if (payloadLength === 1) {
    return 0;
  }
  return null;
}

/** Base64URL → 标准 Base64：字符替换并按 4 字节倍数补齐 `=` 填充 */
export function base64UrlToStandard(input: string): ConvertLineResult {
  const token = input.trim();
  if (token.length === 0) {
    return { output: '', detected: null, error: '内容不能为空', errorOffset: null };
  }
  const invalidOffset = validate(token, 'base64url');
  if (invalidOffset !== null) {
    return {
      output: '',
      detected: 'base64url',
      error: `非法 Base64URL 字符（位置 ${invalidOffset + 1}）：仅允许 A-Z、a-z、0-9、-、_，且不含填充`,
      errorOffset: invalidOffset,
    };
  }
  const replaced = token.replace(/[-_]/g, (ch) => BASE64URL_TO_STANDARD[ch] ?? ch);
  const padding = (4 - (replaced.length % 4)) % 4;
  return { output: replaced + '='.repeat(padding), detected: 'base64url', error: null, errorOffset: null };
}

/** 标准 Base64 → Base64URL：字符替换并去除全部 `=` 填充 */
export function standardToBase64Url(input: string): ConvertLineResult {
  const token = input.trim();
  if (token.length === 0) {
    return { output: '', detected: null, error: '内容不能为空', errorOffset: null };
  }
  const invalidOffset = validate(token, 'standard');
  if (invalidOffset !== null) {
    return {
      output: '',
      detected: 'standard',
      error: `非法标准 Base64（位置 ${invalidOffset + 1}）：仅允许 A-Z、a-z、0-9、+、/ 与末尾 = 填充`,
      errorOffset: invalidOffset,
    };
  }
  const output = token
    .replace(/[+/]/g, (ch) => STANDARD_TO_BASE64URL[ch] ?? ch)
    .replace(/=+$/, '');
  return { output, detected: 'standard', error: null, errorOffset: null };
}

/**
 * 按目标变体转换单行令牌；源变体自动识别。
 * 输入本身已是目标变体时做规范化（补齐 / 去除填充、统一字母表）并原样输出。
 */
export function convertToken(input: string, target: Base64Variant): ConvertLineResult {
  const token = input.trim();
  if (token.length === 0) {
    return { output: '', detected: null, error: '内容不能为空', errorOffset: null };
  }
  const detected = detectVariant(token);
  if (target === 'standard') {
    return base64UrlToStandard(token);
  }
  return standardToBase64Url(token);
}

/** 多行批量转换：每行一个令牌，空行保留，非法行原样保留并逐行告警 */
export function convertLines(input: string, target: Base64Variant): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = convertToken(line, target);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else {
      outputs.push(result.output);
    }
  });
  return { output: outputs.join('\n'), warnings };
}

/**
 * 字节级解码验证：按当前变体解码为 UTF-8 字节，验证字母表与填充在字节层面自洽。
 * 解码失败（含非法 UTF-8 序列）时返回错误信息；成功时返回字节数与十六进制预览。
 */
export function decodeForVerification(input: string, variant: Base64Variant): {
  bytes: number;
  hexPreview: string;
  error: string | null;
} {
  const normalized =
    variant === 'base64url'
      ? base64UrlToStandard(input).output
      : input.trim().replace(/\s/g, '');
  if (normalized === '') {
    return { bytes: 0, hexPreview: '', error: '内容不能为空' };
  }
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const hexPreview = Array.from(bytes.slice(0, 16))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join(' ');
    return {
      bytes: bytes.length,
      hexPreview: bytes.length > 16 ? `${hexPreview} …` : hexPreview,
      error: null,
    };
  } catch {
    return { bytes: 0, hexPreview: '', error: '字节级解码失败：填充或字符组合无法还原为合法字节序列' };
  }
}
