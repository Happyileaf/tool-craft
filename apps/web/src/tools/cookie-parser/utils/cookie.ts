/**
 * Cookie 请求头与 Set-Cookie 响应头的解析 / 序列化纯函数
 *
 * 遵循 RFC 6265 的常见书写习惯：名值对以 `; ` 分隔，
 * Set-Cookie 属性大小写不敏感，Expires 使用 GMT 日期串。
 */

/** Cookie 请求头中的一条名值对（允许重复名称） */
export interface CookiePair {
  /** Cookie 名称 */
  name: string;
  /** Cookie 值（解码前的原始值） */
  value: string;
}

/** 解析过程中产生的提示信息（不阻断解析） */
export interface ParseNotice {
  /** 提示级别 */
  level: 'warning' | 'info';
  /** 提示内容 */
  message: string;
}

/** Cookie 请求头解析结果 */
export interface ParsedCookieHeader {
  /** 按出现顺序解析出的名值对 */
  pairs: CookiePair[];
  /** 解析过程中的提示 */
  notices: ParseNotice[];
}

/**
 * 解析 Cookie 请求头字符串
 *
 * 按 `;` 分段、每段以首个 `=` 切分名称与值；名称 trim，
 * 值按 RFC 6265 默认原样保留，可选 URL 解码。空段忽略，
 * 缺少 `=` 或名称为空的段记为 warning 但不抛出。
 *
 * @param input - 原始 Cookie 头字符串
 * @param decode - 是否对值做 decodeURIComponent（默认 false）
 * @returns 有序名值对与提示信息
 */
export function parseCookieHeader(input: string, decode = false): ParsedCookieHeader {
  const pairs: CookiePair[] = [];
  const notices: ParseNotice[] = [];
  const segments = input.split(';');

  segments.forEach((segment, index) => {
    const trimmed = segment.trim();
    if (trimmed === '') {
      return;
    }
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      notices.push({
        level: 'warning',
        message: `第 ${index + 1} 段「${trimmed}」缺少 =，已忽略`,
      });
      return;
    }
    const name = trimmed.slice(0, equalIndex).trim();
    const rawValue = trimmed.slice(equalIndex + 1).trim();
    if (name === '') {
      notices.push({
        level: 'warning',
        message: `第 ${index + 1} 段名称为空，已忽略`,
      });
      return;
    }
    if (!decode) {
      pairs.push({ name, value: rawValue });
      return;
    }
    try {
      pairs.push({ name, value: decodeURIComponent(rawValue) });
    } catch {
      notices.push({
        level: 'warning',
        message: `Cookie「${name}」的值不是合法的 URL 编码，已按原文保留`,
      });
      pairs.push({ name, value: rawValue });
    }
  });

  return { pairs, notices };
}

/**
 * 把名值对序列化为 Cookie 请求头字符串
 *
 * 以 `; ` 连接，值原样输出；可选 URL 编码，
 * 名称为空的条目跳过并可在调用方提示。
 *
 * @param pairs - 名值对集合
 * @param encode - 是否对值做 encodeURIComponent（默认 false）
 * @returns `a=1; b=2` 形式的字符串
 */
export function serializeCookieHeader(pairs: CookiePair[], encode = false): string {
  return pairs
    .filter((pair) => pair.name.trim() !== '')
    .map((pair) => {
      const name = pair.name.trim();
      const value = encode ? encodeURIComponent(pair.value) : pair.value;
      return `${name}=${value}`;
    })
    .join('; ');
}

/** SameSite 属性取值 */
export type SameSiteValue = 'Lax' | 'Strict' | 'None';

/** Set-Cookie 的结构化属性 */
export interface SetCookieFields {
  /** Cookie 名称 */
  name: string;
  /** Cookie 值 */
  value: string;
  /** Expires 属性的 GMT 字符串（如 Wed, 21 Oct 2026 07:28:00 GMT） */
  expires?: string;
  /** Max-Age 秒数（非负整数） */
  maxAge?: number;
  /** Domain 属性 */
  domain?: string;
  /** Path 属性 */
  path?: string;
  /** 是否带 Secure */
  secure?: boolean;
  /** 是否带 HttpOnly */
  httpOnly?: boolean;
  /** SameSite 属性 */
  sameSite?: SameSiteValue;
  /** 未被结构化识别的其他属性，按原始 token 保留 */
  extensions?: string[];
}

/** 已知的 Set-Cookie 属性名（小写） */
const KNOWN_ATTRIBUTES = new Set([
  'expires',
  'max-age',
  'domain',
  'path',
  'secure',
  'httponly',
  'samesite',
]);

/**
 * 解析单行 Set-Cookie 响应头
 *
 * 首段为 name=value，其余段为属性；属性名大小写不敏感，
 * Expires 的日期片段自动与属性名重新拼回。
 *
 * @param input - Set-Cookie 头字符串（可含 `Set-Cookie:` 前缀）
 * @returns 结构化字段
 * @throws 当首段不含 `=` 或名称为空时抛出错误
 */
export function parseSetCookie(input: string): SetCookieFields {
  let text = input.trim();
  if (/^set-cookie\s*:/i.test(text)) {
    text = text.replace(/^set-cookie\s*:/i, '').trim();
  }

  const segments = text.split(';').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Set-Cookie 内容为空');
  }

  const first = segments[0] as string;
  const equalIndex = first.indexOf('=');
  if (equalIndex <= 0) {
    throw new Error('Set-Cookie 首段必须是 name=value 形式且名称非空');
  }
  const fields: SetCookieFields = {
    name: first.slice(0, equalIndex).trim(),
    value: first.slice(equalIndex + 1).trim(),
    extensions: [],
  };

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index] as string;
    // Expires=Wed, 21 Oct 2026 ... GMT 含逗号，split(';') 不会拆开它，
    // 但历史上也兼容把 Expires 日期内逗号后片段重新拼回的情况。
    const attrEqual = segment.indexOf('=');
    if (attrEqual === -1) {
      // 无值属性（Secure / HttpOnly）
      const attrName = segment.trim().toLowerCase();
      if (attrName === 'secure') {
        fields.secure = true;
      } else if (attrName === 'httponly') {
        fields.httpOnly = true;
      } else if (!KNOWN_ATTRIBUTES.has(attrName)) {
        fields.extensions?.push(segment);
      }
      continue;
    }
    const attrName = segment.slice(0, attrEqual).trim().toLowerCase();
    const attrValue = segment.slice(attrEqual + 1).trim();
    switch (attrName) {
      case 'expires':
        fields.expires = attrValue;
        break;
      case 'max-age': {
        const seconds = Number(attrValue);
        fields.maxAge = Number.isFinite(seconds) ? seconds : undefined;
        break;
      }
      case 'domain':
        fields.domain = attrValue;
        break;
      case 'path':
        fields.path = attrValue;
        break;
      case 'samesite': {
        const normalized = attrValue.toLowerCase();
        if (normalized === 'lax') fields.sameSite = 'Lax';
        else if (normalized === 'strict') fields.sameSite = 'Strict';
        else if (normalized === 'none') fields.sameSite = 'None';
        break;
      }
      case 'secure':
        fields.secure = true;
        break;
      case 'httponly':
        fields.httpOnly = true;
        break;
      default:
        fields.extensions?.push(segment);
    }
  }

  if (fields.extensions && fields.extensions.length === 0) {
    delete fields.extensions;
  }
  return fields;
}

/**
 * 把 Date 格式化为 RFC 6265 使用的 GMT 字符串
 *
 * @param date - 日期对象
 * @returns 如 `Wed, 21 Oct 2026 07:28:00 GMT`
 */
export function formatCookieDate(date: Date): string {
  return date.toUTCString();
}

/**
 * 构造 Set-Cookie 响应头字符串
 *
 * 属性顺序遵循常见习惯：Expires、Max-Age、Domain、Path、
 * Secure、HttpOnly、SameSite，其余扩展属性附在末尾。
 *
 * @param fields - 结构化 Cookie 字段
 * @returns `name=value; Path=/; Secure; ...` 形式的字符串
 * @throws 当名称为空或含非法字符时抛出错误
 */
export function buildSetCookie(fields: SetCookieFields): string {
  const name = fields.name.trim();
  if (name === '') {
    throw new Error('Cookie 名称不能为空');
  }
  if (/[\s;=]/.test(name)) {
    throw new Error('Cookie 名称不能包含空白、分号或等号');
  }
  const parts = [`${name}=${fields.value}`];
  if (fields.expires) {
    parts.push(`Expires=${fields.expires}`);
  }
  if (typeof fields.maxAge === 'number' && Number.isFinite(fields.maxAge)) {
    parts.push(`Max-Age=${Math.trunc(fields.maxAge)}`);
  }
  if (fields.domain) {
    parts.push(`Domain=${fields.domain}`);
  }
  if (fields.path) {
    parts.push(`Path=${fields.path}`);
  }
  if (fields.secure) {
    parts.push('Secure');
  }
  if (fields.httpOnly) {
    parts.push('HttpOnly');
  }
  if (fields.sameSite) {
    parts.push(`SameSite=${fields.sameSite}`);
  }
  for (const extension of fields.extensions ?? []) {
    if (extension.trim()) {
      parts.push(extension.trim());
    }
  }
  return parts.join('; ');
}

/**
 * 校验 Set-Cookie 字段的安全性提示
 *
 * 目前覆盖 RFC 6265bis 的要求：SameSite=None 必须同时带 Secure。
 *
 * @param fields - 结构化 Cookie 字段
 * @returns 提示信息数组；为空表示没有需要提示的问题
 */
export function validateSetCookie(fields: SetCookieFields): ParseNotice[] {
  const notices: ParseNotice[] = [];
  if (fields.sameSite === 'None' && !fields.secure) {
    notices.push({
      level: 'warning',
      message: 'SameSite=None 时必须同时设置 Secure，否则现代浏览器会拒绝该 Cookie',
    });
  }
  if (fields.sameSite === 'None' && fields.secure) {
    notices.push({
      level: 'info',
      message: 'SameSite=None 已搭配 Secure，符合跨站 Cookie 的现代要求',
    });
  }
  if (fields.expires && typeof fields.maxAge === 'number') {
    notices.push({
      level: 'info',
      message: '同时设置了 Expires 与 Max-Age；按 RFC 6265，Max-Age 优先并会忽略 Expires',
    });
  }
  return notices;
}
