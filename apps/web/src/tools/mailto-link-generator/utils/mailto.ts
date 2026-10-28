/**
 * RFC 6068 mailto URI 生成与解析纯函数，不依赖 DOM 与 React。
 * 主题 / 正文按 application/x-www-form-urlencoded 风格百分号编码：
 * 空格为 %20、换行规范化为 CRLF 后编码为 %0D%0A，多收件人用逗号连接。
 */

/** mailto 表单数据 */
export interface MailtoData {
  /** 收件人（原始逗号分隔文本） */
  to: string;
  /** 抄送（原始逗号分隔文本） */
  cc: string;
  /** 密送（原始逗号分隔文本） */
  bcc: string;
  /** 主题 */
  subject: string;
  /** 正文 */
  body: string;
}

/** 解析结果 */
export interface ParseMailtoResult {
  /** 解析出的表单数据 */
  data: MailtoData;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 空表单 */
export function createEmptyMailtoData(): MailtoData {
  return { to: '', cc: '', bcc: '', subject: '', body: '' };
}

/**
 * 按 RFC 3986 百分号编码。
 * 不编码非保留字符（字母数字及 -._~）与部分合法可见符号；
 * 空格编码为 %20，换行先规范化为 CRLF（%0D%0A）。
 *
 * @param value - 原始值
 * @param encodeAt - 是否将 @ 编码为 %40（hfield 值需要，to 地址列表保留）
 * @returns 编码后的字符串
 */
export function encodeMailtoValue(value: string, encodeAt = false): string {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
  const encoded = normalized.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@/?[\]]/g, (char) => {
    if (char === ' ') {
      return '%20';
    }
    const bytes = new TextEncoder().encode(char);
    return Array.from(bytes, (byte) => `%${byte.toString(16).toUpperCase().padStart(2, '0')}`).join('');
  });
  return encodeAt ? encoded.replace(/@/g, '%40') : encoded;
}

/**
 * 百分号解码（容忍 + 保留为字面量，mailto hfield 中 + 不是空格）
 *
 * @param value - 编码字符串
 * @returns 解码后的字符串
 */
export function decodeMailtoValue(value: string): string {
  try {
    const bytes = value
      .replace(/%([0-9A-Fa-f]{2})/g, (_match, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
    const utf8Bytes = Uint8Array.from(bytes, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: false }).decode(utf8Bytes);
  } catch {
    return value;
  }
}

/**
 * 将逗号 / 分号 / 换行分隔的收件人文本拆分为地址数组并去除空白
 *
 * @param text - 原始文本
 * @returns 地址数组
 */
export function splitRecipients(text: string): string[] {
  return text
    .split(/[,;，；\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/**
 * 生成 mailto 链接
 *
 * @param data - 表单数据
 * @returns mailto URI
 */
export function buildMailto(data: MailtoData): string {
  const recipients = splitRecipients(data.to).map((address) => encodeMailtoValue(address)).join(',');
  const hfields: string[] = [];
  const pushField = (key: string, raw: string): void => {
    if (raw !== '') {
      hfields.push(`${key}=${encodeMailtoValue(raw, true)}`);
    }
  };
  pushField('cc', splitRecipients(data.cc).join(','));
  pushField('bcc', splitRecipients(data.bcc).join(','));
  pushField('subject', data.subject);
  pushField('body', data.body);
  const query = hfields.length > 0 ? `?${hfields.join('&')}` : '';
  return `mailto:${recipients}${query}`;
}

/**
 * 解析 mailto 链接并回填表单字段
 *
 * @param input - mailto URI 文本
 * @returns 解析结果
 */
export function parseMailto(input: string): ParseMailtoResult {
  const trimmed = input.trim();
  if (!/^mailto:/i.test(trimmed)) {
    return { data: createEmptyMailtoData(), error: '链接必须以 mailto: 开头' };
  }
  const rest = trimmed.slice('mailto:'.length);
  const queryIndex = rest.indexOf('?');
  const toPart = queryIndex === -1 ? rest : rest.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? '' : rest.slice(queryIndex + 1);

  const data = createEmptyMailtoData();
  data.to = decodeMailtoValue(toPart);

  if (queryPart !== '') {
    for (const pair of queryPart.split('&')) {
      if (pair === '') {
        continue;
      }
      const equalIndex = pair.indexOf('=');
      const rawKey = equalIndex === -1 ? pair : pair.slice(0, equalIndex);
      const rawValue = equalIndex === -1 ? '' : pair.slice(equalIndex + 1);
      const key = rawKey.toLowerCase();
      const value = decodeMailtoValue(rawValue);
      if (key === 'cc') {
        data.cc = value;
      } else if (key === 'bcc') {
        data.bcc = value;
      } else if (key === 'subject') {
        data.subject = value;
      } else if (key === 'body') {
        data.body = value;
      }
    }
  }

  return { data, error: null };
}

/** 邮箱地址的基础格式校验（非严格 RFC，仅拦截明显错误） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 校验全部收件人字段
 *
 * @param data - 表单数据
 * @returns 错误信息；无收件人或全部合法为 null
 */
export function validateMailto(data: MailtoData): string | null {
  const fields: [string, string][] = [
    ['收件人', data.to],
    ['抄送', data.cc],
    ['密送', data.bcc],
  ];
  for (const [label, text] of fields) {
    for (const address of splitRecipients(text)) {
      if (!EMAIL_PATTERN.test(address)) {
        return `${label}地址「${address}」格式不正确`;
      }
    }
  }
  return null;
}
