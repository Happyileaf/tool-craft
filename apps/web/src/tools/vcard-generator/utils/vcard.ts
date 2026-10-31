/**
 * vCard（VCF）名片生成纯函数核心。
 *
 * 遵循 RFC 2426（vCard 3.0）/ RFC 6350（vCard 4.0）的常用子集：
 * - 文本值转义反斜杠、逗号、分号与换行
 * - N / ADR 等结构化字段按分号拼段
 * - 逻辑行按 75 字符折叠，续行以单个空格开头
 * - 组装输出统一使用 CRLF 行尾
 */

/** vCard 版本 */
export type VCardVersion = '3.0' | '4.0';

/** 电话 / 邮箱的类型标记 */
export type ContactKind = 'home' | 'work' | 'cell' | 'other';

/** 电话条目 */
export interface PhoneEntry {
  /** 电话号码原始文本 */
  value: string;
  /** 类型：home 住宅 / work 工作 / cell 手机 / other 未标记 */
  kind: ContactKind;
}

/** 邮箱条目 */
export interface EmailEntry {
  /** 邮箱地址 */
  value: string;
  /** 类型：home 个人 / work 工作 / other 未标记 */
  kind: ContactKind;
}

/** 结构化姓名（对应 N 属性的 5 段） */
export interface StructuredName {
  /** 姓（Family Name） */
  family: string;
  /** 名（Given Name） */
  given: string;
  /** 中间名 / 附加名（Additional Names） */
  additional: string;
  /** 尊称前缀，如 Dr.（Honorific Prefixes） */
  prefix: string;
  /** 尊称后缀，如 Jr.（Honorific Suffixes） */
  suffix: string;
}

/** 结构化地址（对应 ADR 属性的 7 段） */
export interface StructuredAddress {
  /** 邮政信箱（Post Office Box） */
  box: string;
  /** 扩展地址（Extended Address） */
  extended: string;
  /** 街道（Street） */
  street: string;
  /** 城区 / 市镇（Locality） */
  locality: string;
  /** 省 / 州 / 区域（Region） */
  region: string;
  /** 邮政编码（Postal Code） */
  postalCode: string;
  /** 国家（Country） */
  country: string;
}

/** vCard 表单数据 */
export interface VCardData {
  /** 全名 FN（必填） */
  fullName: string;
  /** 结构化姓名各段（可选） */
  name?: Partial<StructuredName>;
  /** 职务 TITLE */
  title?: string;
  /** 组织 ORG */
  organization?: string;
  /** 部门（ORG 的第二段） */
  department?: string;
  /** 电话列表 */
  phones?: PhoneEntry[];
  /** 邮箱列表 */
  emails?: EmailEntry[];
  /** 网址 URL */
  url?: string;
  /** 结构化地址（可选） */
  address?: Partial<StructuredAddress>;
  /** 生日，YYYY-MM-DD */
  birthday?: string;
  /** 备注 NOTE */
  note?: string;
}

/** 生成结果 */
export type VCardResult =
  | { ok: true; vcf: string }
  | { ok: false; error: string };

/** RFC 6350 逻辑行最大字符数 */
export const MAX_LINE_LENGTH = 75;

/**
 * 转义单个文本值：反斜杠 → \\，逗号 → \,，分号 → \;，
 * 换行（\r\n / \r / \n）→ \n。
 *
 * @param value - 原始文本
 * @returns 转义后的安全文本
 */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * 拼接结构化字段：未提供的段以空串补齐，各段转义后用分号连接。
 *
 * @param parts - 字段各段（按规范顺序）
 * @returns 如 `Doe;John;Q;;Dr\\.` 的结构化值
 */
export function joinStructured(parts: string[]): string {
  return parts.map((part) => escapeText(part.trim())).join(';');
}

/**
 * 按 RFC 6350 折叠逻辑行：首行最多 75 个字符，
 * 超出部分每 74 个字符折为以单个空格起始的续行。
 *
 * @param line - 不含行尾的逻辑行
 * @param maxLength - 首行长度上限，默认 75
 * @returns 折叠后的物理行（以 CRLF 连接，不含末尾行尾）
 */
export function foldLine(line: string, maxLength = MAX_LINE_LENGTH): string {
  if (line.length <= maxLength) {
    return line;
  }
  const chunks: string[] = [line.slice(0, maxLength)];
  let rest = line.slice(maxLength);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, maxLength - 1)}`);
    rest = rest.slice(maxLength - 1);
  }
  return chunks.join('\r\n');
}

/**
 * 将类型标记映射为 vCard TEL TYPE 词。
 * cell 同时带 voice；other 不输出 TYPE 参数。
 *
 * @param kind - 类型标记
 * @returns 大写（3.0）或小写（4.0）类型词列表
 */
function phoneTypeWords(kind: ContactKind): string[] {
  switch (kind) {
    case 'home':
      return ['HOME', 'VOICE'];
    case 'work':
      return ['WORK', 'VOICE'];
    case 'cell':
      return ['CELL', 'VOICE'];
    default:
      return [];
  }
}

/**
 * 生成单条 TEL 逻辑行。
 *
 * @param phone - 电话条目
 * @param version - vCard 版本
 * @returns TEL 逻辑行
 */
export function formatTelLine(phone: PhoneEntry, version: VCardVersion): string {
  const number = phone.value.trim();
  const words = phoneTypeWords(phone.kind);
  if (version === '4.0') {
    const types = words.map((word) => word.toLowerCase()).join(',');
    const params = types.length > 0 ? `;TYPE=${types}` : '';
    return `TEL${params};VALUE=uri:tel:${encodeTelUri(number)}`;
  }
  const params = words.length > 0 ? `;TYPE=${words.join(',')}` : '';
  return `TEL${params}:${number}`;
}

/**
 * 按 RFC 3966 生成 tel: URI 的本地部分：
 * 数字、*、# 保留，其余视觉分隔符（空格、连字符、括号等）去除。
 *
 * @param number - 原始号码
 * @returns 可放入 tel: 的号码文本
 */
export function encodeTelUri(number: string): string {
  const digits = number.replace(/[^0-9*#]/g, '');
  return number.trim().startsWith('+') ? `+${digits}` : digits;
}

/**
 * 生成单条 EMAIL 逻辑行。
 *
 * @param email - 邮箱条目
 * @param version - vCard 版本
 * @returns EMAIL 逻辑行
 */
export function formatEmailLine(email: EmailEntry, version: VCardVersion): string {
  const address = email.value.trim();
  let words: string[] = [];
  if (email.kind === 'home') {
    words = ['HOME'];
  } else if (email.kind === 'work') {
    words = ['WORK'];
  }
  const first = words[0];
  if (version === '4.0') {
    const params = first ? `;TYPE=${first.toLowerCase()}` : '';
    return `EMAIL${params}:${address}`;
  }
  const params = first ? `;TYPE=INTERNET,${first},PREF` : ';TYPE=INTERNET';
  return `EMAIL${params}:${address}`;
}

/** 生成 N 属性值（5 段） */
function buildNameValue(name: Partial<StructuredName>): string {
  return joinStructured([
    name.family ?? '',
    name.given ?? '',
    name.additional ?? '',
    name.prefix ?? '',
    name.suffix ?? '',
  ]);
}

/** 生成 ADR 属性值（7 段） */
function buildAddressValue(address: Partial<StructuredAddress>): string {
  return joinStructured([
    address.box ?? '',
    address.extended ?? '',
    address.street ?? '',
    address.locality ?? '',
    address.region ?? '',
    address.postalCode ?? '',
    address.country ?? '',
  ]);
}

/** 判断结构化对象是否至少有一个非空字段 */
function hasContent(parts: Array<string | undefined>): boolean {
  return parts.some((part) => (part ?? '').trim().length > 0);
}

/** 校验生日格式为 YYYY-MM-DD */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const segments = value.split('-').map(Number);
  const month = segments[1];
  const day = segments[2];
  if (month === undefined || day === undefined || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  return true;
}

/**
 * 组装完整 vCard 文本。
 *
 * @param data - 表单数据
 * @param version - vCard 版本，默认 3.0
 * @returns 成功时返回 CRLF 行尾、按 75 字符折叠的 .vcf 文本；FN 缺失等返回校验错误
 */
export function buildVCard(data: VCardData, version: VCardVersion = '3.0'): VCardResult {
  const fullName = data.fullName.trim();
  if (fullName.length === 0) {
    return { ok: false, error: '全名 FN 为必填项，请先填写姓名' };
  }

  if (data.birthday && data.birthday.trim().length > 0 && !isValidDate(data.birthday.trim())) {
    return { ok: false, error: '生日格式必须为 YYYY-MM-DD（如 1990-01-31）' };
  }

  const logicalLines: string[] = ['BEGIN:VCARD', `VERSION:${version}`];

  logicalLines.push(`FN:${escapeText(fullName)}`);

  if (data.name && hasContent(Object.values(data.name))) {
    logicalLines.push(`N:${buildNameValue(data.name)}`);
  }

  if (data.title && data.title.trim().length > 0) {
    logicalLines.push(`TITLE:${escapeText(data.title)}`);
  }

  const orgParts = [data.organization ?? '', data.department ?? ''].map((part) => part.trim());
  if (orgParts.some((part) => part.length > 0)) {
    logicalLines.push(`ORG:${joinStructured(orgParts)}`);
  }

  for (const phone of data.phones ?? []) {
    if (phone.value.trim().length > 0) {
      logicalLines.push(formatTelLine(phone, version));
    }
  }

  for (const email of data.emails ?? []) {
    if (email.value.trim().length > 0) {
      logicalLines.push(formatEmailLine(email, version));
    }
  }

  if (data.url && data.url.trim().length > 0) {
    logicalLines.push(`URL:${data.url.trim()}`);
  }

  if (data.address && hasContent(Object.values(data.address))) {
    logicalLines.push(
      `ADR;TYPE=${version === '4.0' ? 'home' : 'HOME,POSTAL'}:${buildAddressValue(data.address)}`,
    );
  }

  if (data.birthday && data.birthday.trim().length > 0) {
    logicalLines.push(`BDAY:${data.birthday.trim()}`);
  }

  if (data.note && data.note.trim().length > 0) {
    logicalLines.push(`NOTE:${escapeText(data.note)}`);
  }

  logicalLines.push('END:VCARD');

  const vcf = logicalLines.map((line) => foldLine(line)).join('\r\n').concat('\r\n');
  return { ok: true, vcf };
}
