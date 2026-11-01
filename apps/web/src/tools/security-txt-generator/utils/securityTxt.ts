/**
 * security.txt 生成与解析校验纯函数（零依赖，不触碰 DOM / React）
 *
 * 依据 RFC 9116（A File Format to Aid in Security Vulnerability Disclosure）：
 * - 字段名区分大小写，规范顺序为 Contact、Expires、Encryption、Acknowledgments、
 *   Preferred-Languages、Canonical、Policy、CSAF；
 * - 行格式为 `Field: value`，换行必须是 CRLF（\r\n），文件以 CRLF 结尾；
 * - Contact 与 Expires 必填；Expires 使用 RFC 3339 / ISO 8601 日期时间；
 * - 可选 PGP clearsign 签名块，本工具不实际签名，仅在生成结果末尾保留注释占位。
 *
 * 错误不抛异常：生成失败时 error 非空、output 为空字符串；
 * 解析时错误（缺必填、Expires 非法等）与警告（过期、临期、未知字段等）分别收集。
 */

/** RFC 9116 已知字段名（精确大小写） */
export type SecurityTxtFieldName =
  | 'Contact'
  | 'Expires'
  | 'Encryption'
  | 'Acknowledgments'
  | 'Preferred-Languages'
  | 'Canonical'
  | 'Policy'
  | 'CSAF';

/** 字段规范顺序，生成与单测均引用此常量 */
export const FIELD_ORDER: SecurityTxtFieldName[] = [
  'Contact',
  'Expires',
  'Encryption',
  'Acknowledgments',
  'Preferred-Languages',
  'Canonical',
  'Policy',
  'CSAF',
];

/** 生成器输入字段（多值字段为字符串数组） */
export interface SecurityTxtFields {
  /** 安全联系人 URI（mailto: / https: / tel: 等），至少一条 */
  contacts: string[];
  /** 过期时间，RFC 3339 / ISO 8601 日期时间 */
  expires: string;
  /** 加密公钥地址（可选多条） */
  encryption?: string[];
  /** 致谢页面地址（可选多条） */
  acknowledgments?: string[];
  /** 偏好语言标签（可选一条，如 en, zh-CN） */
  preferredLanguages?: string;
  /** 本文件规范地址（可选多条） */
  canonical?: string[];
  /** 安全策略页面地址（可选多条） */
  policy?: string[];
  /** CSAF 提供者元数据地址（可选多条） */
  csaf?: string[];
}

/** 生成结果 */
export interface GenerateResult {
  /** 生成的 security.txt 文本（全 CRLF）；存在致命错误时为空字符串 */
  output: string;
  /** 不阻止生成的提示信息（如 Contact 形态可疑、已过期、临期） */
  warnings: string[];
  /** 致命错误（缺 Contact / 缺 Expires / Expires 无法解析），非空时 output 为空 */
  error: string | null;
}

/** 解析得到的单行字段（按文件中出现顺序保留，包含重复行与未知字段） */
export interface ParsedField {
  /** 行号（从 1 开始，空行与注释行不计数行号从物理行计起） */
  line: number;
  /** 字段名（原文保留大小写） */
  name: string;
  /** trim 后的字段值 */
  value: string;
}

/** 解析结果 */
export interface ParseResult {
  /** 逐行解析出的全部字段（含未知字段） */
  fields: ParsedField[];
  /** 聚合后的 Contact 值（按出现顺序） */
  contacts: string[];
  /** 第一条 Expires 值；缺失时为 null */
  expires: string | null;
  /** 非致命提示：过期、30 天内临期、未知字段、Expires 重复等 */
  warnings: string[];
  /** 致命问题：缺 Contact、缺 Expires、Expires 无法解析、行格式错误 */
  errors: string[];
  /** 是否检测到 PGP clearsign 签名块 */
  hasSignature: boolean;
}

/** PGP clearsign 签名块标记 */
const PGP_BEGIN = '-----BEGIN PGP SIGNED MESSAGE-----';
const PGP_SIGNATURE_BEGIN = '-----BEGIN PGP SIGNATURE-----';

/**
 * 将多行文本拆分为值数组：按行拆分，逐行 trim，丢弃空行
 *
 * @param text - 原始多行文本
 * @returns 字符串数组
 */
export function splitEntries(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** 30 天的毫秒数，用于临期判断 */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 校验 Expires 值并生成时效提示
 *
 * @param value - trim 后的 Expires 值
 * @param now - 当前时间（注入便于测试固定）
 * @returns fatal 为致命错误（无法解析），warning 为过期 / 临期提示
 */
function checkExpires(
  value: string,
  now: Date,
): { fatal: string | null; warning: string | null } {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) {
    return { fatal: `Expires 值「${value}」不是合法的 RFC 3339 / ISO 8601 日期时间`, warning: null };
  }
  const diff = time.getTime() - now.getTime();
  if (diff < 0) {
    return { fatal: null, warning: 'Expires 已过期，请尽快更新安全策略文件' };
  }
  if (diff <= THIRTY_DAYS_MS) {
    return { fatal: null, warning: 'Expires 将在 30 天内到期，建议提前续期' };
  }
  return { fatal: null, warning: null };
}

/**
 * 生成 security.txt 文本。
 * 按规范顺序输出字段，多值字段每个值独占一行；空值字段跳过；
 * 全部行以 CRLF 结尾（包括最后一行）。
 *
 * @param fields - 安全策略字段
 * @param now - 当前时间（默认取系统时间，测试可固定）
 * @returns 生成结果；缺少必填或 Expires 非法时 error 非空、output 为空
 */
export function generateSecurityTxt(
  fields: SecurityTxtFields,
  now: Date = new Date(),
): GenerateResult {
  const contacts = splitEntries(fields.contacts.join('\n'));
  const expires = fields.expires.trim();
  const warnings: string[] = [];

  if (contacts.length === 0) {
    return { output: '', warnings, error: '缺少必填字段 Contact：至少提供一条安全联系人 URI' };
  }
  if (expires === '') {
    return { output: '', warnings, error: '缺少必填字段 Expires：请填写策略过期时间（RFC 3339 日期时间）' };
  }

  const expiresCheck = checkExpires(expires, now);
  if (expiresCheck.fatal) {
    return { output: '', warnings, error: expiresCheck.fatal };
  }
  if (expiresCheck.warning) {
    warnings.push(expiresCheck.warning);
  }

  for (const contact of contacts) {
    // 宽松校验：Contact 应为 URI（含冒号），不规范仅告警不阻止生成
    if (!contact.includes(':')) {
      warnings.push(`Contact「${contact}」不像合法 URI（建议使用 mailto: / https: / tel: 等形式）`);
    }
  }

  const multiValue: Partial<Record<SecurityTxtFieldName, string[]>> = {
    Contact: contacts,
    Encryption: splitEntries(fields.encryption?.join('\n')),
    Acknowledgments: splitEntries(fields.acknowledgments?.join('\n')),
    Canonical: splitEntries(fields.canonical?.join('\n')),
    Policy: splitEntries(fields.policy?.join('\n')),
    CSAF: splitEntries(fields.csaf?.join('\n')),
  };

  const lines: string[] = ['# Generated by ToolCraft security.txt generator (RFC 9116)'];
  for (const name of FIELD_ORDER) {
    if (name === 'Expires') {
      lines.push(`Expires: ${expires}`);
      continue;
    }
    if (name === 'Preferred-Languages') {
      const languages = fields.preferredLanguages?.trim() ?? '';
      if (languages !== '') {
        lines.push(`Preferred-Languages: ${languages}`);
      }
      continue;
    }
    for (const value of multiValue[name] ?? []) {
      lines.push(`${name}: ${value}`);
    }
  }
  lines.push('# 可在此行之后对本文件附加 PGP clearsign 签名（gpg --clearsign）');

  return { output: lines.join('\r\n') + '\r\n', warnings, error: null };
}

/**
 * 解析并校验 security.txt 文本，兼容 CRLF / LF 输入。
 * 跳过空行与注释行；检测 PGP clearsign 签名块（签名块内容整体忽略）；
 * 未知字段不致命（仍可被解析器理解其他内容），作为 warning 提示。
 *
 * @param input - 原始 security.txt 文本
 * @param now - 当前时间（默认取系统时间，测试可固定）
 * @returns 解析结果（字段集合、错误与警告、签名状态）
 */
export function parseSecurityTxt(input: string, now: Date = new Date()): ParseResult {
  const fields: ParsedField[] = [];
  const contacts: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let hasSignature = false;
  let expires: string | null = null;
  let expiresCount = 0;
  let inSignature = false;
  let inSignedBody = false;
  let inArmorHeaders = false;

  const physicalLines = input.split(/\r\n|\r|\n/);

  physicalLines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (line === PGP_BEGIN) {
      hasSignature = true;
      inArmorHeaders = true;
      return;
    }
    if (line === PGP_SIGNATURE_BEGIN) {
      inSignature = true;
      inArmorHeaders = false;
      return;
    }
    if (inSignature) {
      // 签名块 base64 内容与结尾 armor 行整体忽略
      return;
    }
    if (line === '') {
      // clearsign armor 头（如 Hash: SHA512）到第一个空行为止，之后才是明文正文
      if (inArmorHeaders) {
        inArmorHeaders = false;
        inSignedBody = true;
      }
      return;
    }
    if (inArmorHeaders) {
      return;
    }
    if (line.startsWith('#')) {
      return;
    }

    // clearsign 明文中以 "- " 开头的行是 dash-escaped（RFC 4880）：原始行首字符为 "-"
    // 时会被追加 "- " 前缀，解析时去掉该两字符前缀即可
    const content = inSignedBody && line.startsWith('- ') ? line.slice(2) : line;

    const colon = content.indexOf(':');
    if (colon === -1) {
      errors.push(`第 ${lineNumber} 行格式错误：应为「Field: value」`);
      return;
    }

    const name = content.slice(0, colon).trim();
    const value = content.slice(colon + 1).trim();

    if (name === '') {
      errors.push(`第 ${lineNumber} 行格式错误：字段名为空`);
      return;
    }

    fields.push({ line: lineNumber, name, value });

    if (!(FIELD_ORDER as string[]).includes(name)) {
      // 未知字段不致命：解析器仍可读取其余已知字段，仅提示该字段不会被标准实现识别
      warnings.push(`未知字段 ${name}（第 ${lineNumber} 行），RFC 9116 未定义此字段`);
      return;
    }

    if (name === 'Contact') {
      contacts.push(value);
      return;
    }

    if (name === 'Expires') {
      expiresCount += 1;
      if (expiresCount > 1) {
        warnings.push(`Expires 出现 ${expiresCount} 次，RFC 9116 规定只能有一条，已取第一条`);
        return;
      }
      expires = value;
      const check = checkExpires(value, now);
      if (check.fatal) {
        errors.push(check.fatal);
      } else if (check.warning) {
        warnings.push(check.warning);
      }
    }
  });

  if (contacts.length === 0) {
    errors.push('缺少必填字段 Contact：至少需要一条安全联系人 URI');
  }
  if (expires === null) {
    errors.push('缺少必填字段 Expires：请指定策略过期时间');
  }

  return { fields, contacts, expires, warnings, errors, hasSignature };
}
