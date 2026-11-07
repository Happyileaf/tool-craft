/**
 * ITU-T E.123 电话号码可视分隔与分组排版纯函数。
 *
 * 与 phone-e164-normalizer 的分工：本模块不做号段真实性 / 国家码合法性校验，
 * 只负责剥离可视分隔符、在 E.164 无分隔表示与 E.123 人类可读形式之间重组，
 * 并对清洗后仍残留的非法字符做标记。
 */

/** E.123 支持的可视分隔符样式 */
export type SeparatorStyle = 'space' | 'dot' | 'hyphen';

export const SEPARATOR_LABEL: Record<SeparatorStyle, string> = {
  space: '空格（E.123 推荐）',
  dot: '点号',
  hyphen: '连字符',
};

const SEPARATOR_CHAR: Record<SeparatorStyle, string> = {
  space: ' ',
  dot: '.',
  hyphen: '-',
};

/** 输入清洗结果 */
export interface CleanedPhone {
  /** 去掉可视分隔符后的数字串（可能保留前导 +） */
  digits: string;
  /** 是否为国际号码（以 + 或 00 开头） */
  isInternational: boolean;
  /** 清洗后仍残留的非法字符（既非数字也非 +），按出现顺序去重 */
  invalidChars: string[];
}

/** 剥离输入中的空格、连字符、括号、点、斜杠等可视分隔符 */
const VISUAL_SEPARATOR = /[\s\-()./]/g;

/**
 * 常用国家 / 地区呼叫前缀（不含 +），仅用于把国家码单独成组的可视排版，
 * 不做号段真实性校验。按长度降序排列以保证最长前缀优先匹配。
 */
const COUNTRY_CALLING_CODES: readonly string[] = [
  '852', '853', '886', '855', '856', '880', '972', '971', '966', '673',
  '86', '81', '82', '84', '60', '61', '62', '63', '65', '66', '90', '91',
  '92', '93', '94', '95', '98',
  '44', '49', '33', '39', '34', '31', '46', '41', '47', '45', '48', '30',
  '351', '352', '353', '358', '359', '380', '385', '420', '421', '423',
  '1', '7', '20', '27', '55', '52', '56', '57', '51', '58', '64', '965',
  '974', '973', '968', '962', '961', '963', '964', '967', '212', '213',
  '216', '218', '220', '221', '225', '234', '254', '256', '260', '263',
].sort((a, b) => b.length - a.length);

/**
 * 在数字串中按最长前缀匹配国家呼叫码；未命中返回 null。
 */
function matchCountryCode(digits: string): string | null {
  return COUNTRY_CALLING_CODES.find((code) => digits.startsWith(code) && digits.length > code.length) ?? null;
}

/**
 * 清洗任意电话号码文本：剥离 E.123 允许的可视分隔符，识别国际前缀，
 * 并收集残留非法字符。
 *
 * @param raw - 原始号码
 * @returns 清洗结果
 */
export function cleanPhone(raw: string): CleanedPhone {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  let work = trimmed.replace(VISUAL_SEPARATOR, '');
  let isInternational = hasPlus;
  if (hasPlus) {
    work = work.slice(1);
  } else if (work.startsWith('00')) {
    isInternational = true;
    work = work.slice(2);
  }
  const invalidChars: string[] = [];
  for (const char of work) {
    if (!/^\d$/.test(char) && !invalidChars.includes(char)) {
      invalidChars.push(char);
    }
  }
  return { digits: work.replace(/\D/g, ''), isInternational, invalidChars };
}

/**
 * 把数字串按给定分组长度序列从左到右切分；最后一组吸收全部剩余数字，
 * 避免在末尾产生不足一组的碎片（如 11 位按 3-3-4 得到 3/3/5 而非 3/3/4/1）。
 *
 * @param digits - 纯数字串
 * @param groups - 每组长度，如 [3, 3, 4]
 * @returns 分组后的数字段
 */
export function groupDigits(digits: string, groups: number[]): string[] {
  if (!digits) {
    return [];
  }
  const sizes = groups.length > 0 ? groups : [digits.length];
  // 最后一个分组边界吸收余数：若总长度超过预设边界之和，末组取到结尾
  const boundaries: number[] = [];
  let accumulated = 0;
  for (let index = 0; index < sizes.length - 1; index += 1) {
    accumulated += sizes[index] ?? 0;
    if (accumulated < digits.length) {
      boundaries.push(accumulated);
    }
  }
  const parts: string[] = [];
  let cursor = 0;
  for (const boundary of boundaries) {
    parts.push(digits.slice(cursor, boundary));
    cursor = boundary;
  }
  parts.push(digits.slice(cursor));
  return parts.filter(Boolean);
}

/** 格式化选项 */
export interface FormatOptions {
  /** 可视分隔符，默认空格 */
  separator?: SeparatorStyle;
  /** 本地写法是否使用括号包裹首位 0 开头的长途区号（如 (042) 123 4567） */
  localParentheses?: boolean;
  /** 国际号码的国家码长度（用于把国家码单独成组），默认自动按 1–3 位取 */
  countryCodeLength?: number;
}

/**
 * 将任意输入格式化为 E.123 人类可读形式。
 *
 * 国际号码：`+<国家码> <分组后的订阅号>`；
 * 本地号码：默认从左到右 3-3-4（不足时退化），可选括号风格。
 *
 * @param raw - 原始号码
 * @param options - 格式化选项
 * @returns E.123 文本
 * @throws 含非法字符或号码为空时抛错
 */
export function formatE123(raw: string, options: FormatOptions = {}): string {
  const { separator = 'space', localParentheses = false, countryCodeLength } = options;
  const sep = SEPARATOR_CHAR[separator];
  const cleaned = cleanPhone(raw);
  if (cleaned.invalidChars.length > 0) {
    throw new Error(`包含非法字符：${cleaned.invalidChars.join(' ')}`);
  }
  if (!cleaned.digits) {
    throw new Error('号码为空');
  }

  if (!cleaned.isInternational) {
    return formatLocal(cleaned.digits, sep, localParentheses);
  }

  // 国际号码：先切出国家码（码表最长前缀优先，其次显式长度，最后回退 3 位），再对订阅号分组
  const ccLen = resolveCountryCodeLength(cleaned.digits, countryCodeLength);
  const countryCode = cleaned.digits.slice(0, ccLen);
  const subscriber = cleaned.digits.slice(ccLen);
  const grouped = groupDigits(subscriber, [3, 3, 4]).join(sep);
  return `+${countryCode}${grouped ? `${sep}${grouped}` : ''}`;
}

/**
 * 本地号码排版：可选括号包裹首位 0 开头的长途前缀（取前 3 位或首个 0 段）。
 */
function formatLocal(digits: string, sep: string, localParentheses: boolean): string {
  if (localParentheses && digits.startsWith('0')) {
    // 括号风格：把开头的 0 区号（前 3 位）放入括号，其余按 3-3-4 分组
    const areaLength = Math.min(3, digits.length - 1);
    const area = digits.slice(0, areaLength);
    const rest = digits.slice(areaLength);
    const restGrouped = groupDigits(rest, [3, 4]).join(sep);
    return `(${area})${restGrouped ? ` ${restGrouped}` : ''}`;
  }
  return groupDigits(digits, [3, 3, 4]).join(sep);
}

/**
 * 解析国家码长度：显式指定优先；否则用内置呼叫码表做最长前缀匹配；
 * 都不命中时回退到最多 3 位（保证至少留 1 位订阅号）。
 */
function resolveCountryCodeLength(digits: string, explicit?: number): number {
  if (explicit !== undefined) {
    if (explicit < 1 || explicit > 3) {
      throw new Error('国家码长度必须在 1–3 位之间');
    }
    if (explicit >= digits.length) {
      throw new Error('国家码长度超过号码总长度');
    }
    return explicit;
  }
  const matched = matchCountryCode(digits);
  if (matched) {
    return matched.length;
  }
  return Math.min(3, digits.length - 1);
}

/**
 * 把 E.123 可读形式（或任意带分隔符号码）转换为 E.164 无分隔表示。
 *
 * 国际号码输出 `+` 加纯数字；本地号码（无国际前缀）输出纯数字串，
 * 并在以括号长途区号 0 开头时保留该 0（E.164 需配合国家码，此处不臆造）。
 *
 * @param raw - 原始号码
 * @returns E.164 风格字符串
 * @throws 含非法字符或号码为空时抛错
 */
export function toE164(raw: string): string {
  const cleaned = cleanPhone(raw);
  if (cleaned.invalidChars.length > 0) {
    throw new Error(`包含非法字符：${cleaned.invalidChars.join(' ')}`);
  }
  if (!cleaned.digits) {
    throw new Error('号码为空');
  }
  return cleaned.isInternational ? `+${cleaned.digits}` : cleaned.digits;
}

/**
 * 双向便捷转换：E.164 → E.123。等价于 formatE123，语义别名便于阅读。
 */
export function e164ToE123(e164: string, options: FormatOptions = {}): string {
  return formatE123(e164, options);
}

/** 批量逐行格式化，空行跳过；每行独立返回成功或错误。 */
export interface BatchLine {
  line: number;
  input: string;
  output: string | null;
  error: string | null;
}

export function formatBatch(text: string, options: FormatOptions = {}): BatchLine[] {
  return text
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim().length > 0)
    .map(({ raw, line }) => {
      try {
        return { line, input: raw.trim(), output: formatE123(raw, options), error: null };
      } catch (caught) {
        return {
          line,
          input: raw.trim(),
          output: null,
          error: caught instanceof Error ? caught.message : '格式化失败',
        };
      }
    });
}
