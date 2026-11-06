/**
 * 邮箱地址语法校验与结构解析纯函数；
 * 基于 RFC 5321/5322 主流实践做确定性字符级检查，不依赖 DOM、不发起网络请求
 */

/** local-part 形态 */
export type LocalPartType = 'dot-atom' | 'quoted-string';

/** domain 形态 */
export type DomainType = 'domain' | 'ipv4-literal' | 'ipv6-literal';

/** 结构化解析结果 */
export interface EmailParts {
  /** @ 左侧本地部分（含引号时保留外层引号） */
  localPart: string;
  /** @ 右侧域部分（IP 字面量保留方括号） */
  domain: string;
  /** 本地部分形态 */
  localType: LocalPartType;
  /** 域部分形态 */
  domainType: DomainType;
  /** 是否包含非 ASCII 字符（IDN / 国际化本地部分） */
  isIdn: boolean;
}

/** 校验结果 */
export interface ValidationResult {
  /** 整体是否合法 */
  valid: boolean;
  /** 非法原因 / 警告信息（合法时可能含 warning） */
  reasons: string[];
  /** 警告信息（不影响合法性，如单标签域、IDN 需 punycode） */
  warnings: string[];
  /** 结构化拆解，无法拆解时为 null */
  parts: EmailParts | null;
}

/** dot-atom 允许的特殊字符（RFC 5322 atext 扩展） */
const ATEXT_SPECIAL = new Set("!#$%&'*+-/=?^_`{|}~".split(''));

/** 普通域标签允许的字符：字母、数字、连字符 */
function isLabelChar(char: string): boolean {
  return /[a-zA-Z0-9-]/.test(char);
}

/** 是否为非 ASCII 字符 */
function isNonAscii(char: string): boolean {
  return char.charCodeAt(0) > 127;
}

/**
 * 找到分隔 local 与 domain 的、未被引号包裹的 @ 下标；
 * 存在多个裸 @ 时返回 -1
 *
 * @param value - 去空白后的完整输入
 * @returns 合法唯一 @ 的下标，否则 -1
 */
function findAtSign(value: string): number {
  let inQuotes = false;
  let atIndex = -1;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]!;
    if (char === '\\' && inQuotes) {
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '@' && !inQuotes) {
      if (atIndex !== -1) {
        return -1;
      }
      atIndex = i;
    }
  }
  return atIndex;
}

/**
 * 校验 dot-atom 形态的 local-part
 *
 * @param local - 本地部分
 * @returns 错误信息数组（空数组合法）
 */
function validateDotAtom(local: string): string[] {
  const errors: string[] = [];
  if (local.length > 64) {
    errors.push(`local-part 长度 ${local.length} 超过 64 字符上限`);
  }
  if (local.startsWith('.')) {
    errors.push('dot-atom 形态下点号不能位于 local-part 开头');
  }
  if (local.endsWith('.')) {
    errors.push('dot-atom 形态下点号不能位于 local-part 结尾');
  }
  if (local.includes('..')) {
    errors.push('dot-atom 形态下不允许出现连续点号');
  }
  for (const char of local) {
    if (char === '.') {
      continue;
    }
    if (isNonAscii(char)) {
      continue; // 非 ASCII 交由 IDN 警告统一提示，不直接判非法
    }
    if (!/[a-zA-Z0-9]/.test(char) && !ATEXT_SPECIAL.has(char)) {
      errors.push(`local-part 含非法字符 "${char}"（含空格的内容需用双引号包裹）`);
      break;
    }
  }
  return errors;
}

/**
 * 校验 quoted-string 形态的 local-part（含外层双引号）
 *
 * @param local - 带引号的本地部分
 * @returns 错误信息数组
 */
function validateQuotedString(local: string): string[] {
  const errors: string[] = [];
  if (local.length < 2 || !local.startsWith('"') || !local.endsWith('"')) {
    errors.push('quoted-string 必须以成对双引号包裹');
    return errors;
  }
  if (local.length > 66) {
    errors.push('quoted-string 形态 local-part 长度超过 64 字符上限（含引号）');
  }
  const inner = local.slice(1, -1);
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i]!;
    if (char === '\\') {
      // 转义对：反斜杠后必须还有一个被转义字符
      if (i + 1 >= inner.length) {
        errors.push('quoted-string 末尾的反斜杠缺少被转义字符');
        break;
      }
      i += 1;
      continue;
    }
    if (char === '"') {
      errors.push('quoted-string 内部的双引号必须用反斜杠转义');
      break;
    }
    if (!isNonAscii(char) && /[\x00-\x1f\x7f]/.test(char)) {
      errors.push('quoted-string 不允许未转义的控制字符');
      break;
    }
  }
  return errors;
}

/**
 * 校验 IPv4 字面量（去掉方括号后的内容）
 *
 * @param content - 方括号内文本
 * @returns 错误信息数组
 */
function validateIpv4(content: string): string[] {
  const parts = content.split('.');
  if (parts.length !== 4) {
    return ['IPv4 字面量必须包含 4 个以点分隔的段'];
  }
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return [`IPv4 段 "${part}" 不是 1–3 位数字`];
    }
    const value = Number(part);
    if (value > 255) {
      return [`IPv4 段 "${part}" 超出 0–255 范围`];
    }
    if (part.length > 1 && part.startsWith('0')) {
      return [`IPv4 段 "${part}" 不允许前导零`];
    }
  }
  return [];
}

/**
 * 校验 IPv6 字面量（去掉 [IPv6: 前缀与方括号后的内容），做基础格式检查
 *
 * @param content - IPv6 地址文本
 * @returns 错误信息数组
 */
function validateIpv6(content: string): string[] {
  if (content.length === 0) {
    return ['IPv6 字面量内容为空'];
  }
  if (/[^0-9a-fA-F:]/.test(content)) {
    return ['IPv6 地址只允许十六进制字符与冒号'];
  }
  const doubleColonCount = (content.match(/::/g) ?? []).length;
  if (doubleColonCount > 1) {
    return ['IPv6 地址最多只能出现一次双冒号 ::'];
  }
  const groups = content.split(':').filter((group) => group !== '');
  if (groups.length > 8) {
    return ['IPv6 地址分组数不能超过 8 组'];
  }
  if (doubleColonCount === 0 && groups.length !== 8) {
    return ['未使用 :: 压缩时 IPv6 地址必须恰好包含 8 组'];
  }
  for (const group of groups) {
    if (group.length > 4) {
      return [`IPv6 分组 "${group}" 超过 4 个十六进制字符`];
    }
  }
  return [];
}

/**
 * 校验普通域名（dot-atom 风格的域标签序列）
 *
 * @param domain - 域文本
 * @returns errors 与 warnings
 */
function validateDomain(domain: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (domain.length > 255) {
    errors.push(`domain 总长度 ${domain.length} 超过 255 字符上限`);
  }
  if (domain.startsWith('.') || domain.endsWith('.')) {
    errors.push('域名不能以点号开头或结尾');
  }
  if (domain.includes('..')) {
    errors.push('域名不允许出现连续点号');
  }
  const labels = domain.split('.');
  for (const label of labels) {
    if (label.length === 0) {
      errors.push('域名包含空标签（连续或首尾点号）');
      continue;
    }
    if (label.length > 63) {
      errors.push(`域标签 "${label}" 超过 63 字符上限`);
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      errors.push(`域标签 "${label}" 的连字符不能位于开头或结尾`);
    }
    for (const char of label) {
      if (!isLabelChar(char) && !isNonAscii(char)) {
        errors.push(`域标签含非法字符 "${char}"`);
        break;
      }
    }
  }
  if (labels.length === 1 && errors.length === 0) {
    warnings.push('单标签域名（无点号）在公共邮件系统中通常无法投递，仅适用于内网/测试场景');
  }
  return { errors, warnings };
}

/**
 * 校验单个邮箱地址并结构化拆解；输入会先去除首尾空白
 *
 * @param input - 原始输入
 * @returns 校验结论、原因、警告与结构化部件
 */
export function validateEmail(input: string): ValidationResult {
  const value = input.trim();
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (value.length === 0) {
    return { valid: false, reasons: ['输入为空'], warnings, parts: null };
  }

  const atIndex = findAtSign(value);
  if (atIndex === -1) {
    return {
      valid: false,
      reasons: ['邮箱必须包含恰好 1 个未被引号包裹的 @ 分隔符'],
      warnings,
      parts: null,
    };
  }

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (localPart.length === 0) {
    reasons.push('local-part（@ 左侧）不能为空');
  }
  if (domain.length === 0) {
    reasons.push('domain（@ 右侧）不能为空');
  }
  if (reasons.length > 0) {
    return { valid: false, reasons, warnings, parts: null };
  }

  const isIdn = /[^\x00-\x7f]/.test(value);
  if (isIdn) {
    warnings.push('地址含非 ASCII 字符，实际投递前需将国际化域名转换为 punycode（xn-- 形式）');
  }

  // local-part 校验与形态判定
  const localType: LocalPartType = localPart.startsWith('"') ? 'quoted-string' : 'dot-atom';
  if (localType === 'quoted-string') {
    reasons.push(...validateQuotedString(localPart));
  } else {
    reasons.push(...validateDotAtom(localPart));
  }

  // domain 校验与形态判定
  let domainType: DomainType = 'domain';
  if (domain.startsWith('[')) {
    if (!domain.endsWith(']')) {
      reasons.push('IP 字面量域缺少闭合方括号 ]');
    } else {
      const content = domain.slice(1, -1);
      if (content.startsWith('IPv6:')) {
        domainType = 'ipv6-literal';
        reasons.push(...validateIpv6(content.slice(5)));
      } else {
        domainType = 'ipv4-literal';
        reasons.push(...validateIpv4(content));
      }
    }
  } else {
    const domainResult = validateDomain(domain);
    reasons.push(...domainResult.errors);
    warnings.push(...domainResult.warnings);
  }

  if (value.length > 254) {
    reasons.push(`地址总长度 ${value.length} 超过 RFC 5321 的 254 字符实际上限`);
  }

  const parts: EmailParts = { localPart, domain, localType, domainType, isIdn };
  return { valid: reasons.length === 0, reasons, warnings, parts };
}
