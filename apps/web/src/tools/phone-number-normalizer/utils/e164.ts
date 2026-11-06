/**
 * E.164 电话号码规范化与校验纯函数集合（ITU-T E.164）。
 * 不依赖外部号段数据库：只做字符清洗、国际/国内前缀处理、长度与结构校验，
 * 国家码按 E.164「1–3 位、首位 1–9」规则切分，不做运营商归属地真实性核验。
 */

/** E.164 号码数字位上限（不含 + 号） */
export const E164_MAX_DIGITS = 15;

/** E.164 号码数字位下限（含国家码，实际有效号码最短 3 位） */
export const E164_MIN_DIGITS = 3;

/** 国家码最大位数 */
export const COUNTRY_CODE_MAX_LENGTH = 3;

/**
 * 电话键盘字母 → 数字映射（vanity 号码，如 1-800-FLOWERS）。
 */
const VANITY_MAP: Record<string, string> = {
  A: '2', B: '2', C: '2',
  D: '3', E: '3', F: '3',
  G: '4', H: '4', I: '4',
  J: '5', K: '5', L: '5',
  M: '6', N: '6', O: '6',
  P: '7', Q: '7', R: '7', S: '7',
  T: '8', U: '8', V: '8',
  W: '9', X: '9', Y: '9', Z: '9',
};

/**
 * 规范化结果
 */
export interface NormalizeResult {
  /** 是否成功 */
  ok: boolean;
  /** 成功时的 E.164 规范形式（+ 开头） */
  e164: string | null;
  /** 国家码（不含 +） */
  countryCode: string | null;
  /** 国内有效号码部分 */
  nationalNumber: string | null;
  /** RFC 3966 tel URI */
  telUri: string | null;
  /** 可视分组（国家码 + 剩余号码按 3-3-4 启发式分组） */
  formatted: string | null;
  /** 分机号（原始输入携带 ext/x/转 时保留），无则为 null */
  extension: string | null;
  /** 失败或告警信息（ok=false 时为错误，ok=true 时可能为告警） */
  errors: string[];
}

/**
 * 把 vanity 字母（大小写不敏感）转换为电话键盘数字，数字与其他字符原样返回。
 *
 * @param ch - 单个字符
 * @returns 转换后的字符
 */
export function vanityCharToDigit(ch: string): string {
  return VANITY_MAP[ch.toUpperCase()] ?? ch;
}

/**
 * 从输入中分离分机号。支持 `;ext=123`、` ext 123`、` x123`、`转 123`、`#123` 写法。
 *
 * @param raw - 原始输入
 * @returns 主干号码与分机号
 */
export function splitExtension(raw: string): { main: string; extension: string | null } {
  const match = raw.match(/(?:;ext=|\s+ext\.?\s+|\s+x\s*|转\s*|#\s*)(\d+)\s*$/i);
  if (!match) {
    return { main: raw, extension: null };
  }
  return {
    main: raw.slice(0, match.index ?? 0).trim(),
    extension: match[1] ?? null,
  };
}

/**
 * 清洗主干号码：剥离分隔符（空格、连字符、点、括号、斜杠）、vanity 字母转数字。
 * 非法字符（非数字、+、00 前缀字母已转换后残留的字母等）触发错误。
 *
 * @param main - 主干号码文本
 * @returns 清洗后的字符串（可能保留前导 + 或 00）与非法字符列表
 */
export function cleanMain(main: string): { cleaned: string; invalidChars: string[] } {
  const invalidChars: string[] = [];
  let cleaned = '';
  for (const ch of main) {
    if (ch >= '0' && ch <= '9') {
      cleaned += ch;
    } else if (ch === '+') {
      cleaned += '+';
    } else if (/[\s\-()./]/.test(ch)) {
      // 合法分隔符，跳过
      continue;
    } else if (/[a-zA-Z]/.test(ch)) {
      cleaned += vanityCharToDigit(ch);
    } else {
      invalidChars.push(ch);
    }
  }
  return { cleaned, invalidChars: [...new Set(invalidChars)] };
}

/**
 * 对国内号码做启发式可视分组：先 3-3-4，剩余前置归组。
 *
 * @param digits - 纯数字国内号码
 * @returns 空格分组后的字符串
 */
export function visualGroup(digits: string): string {
  if (digits.length <= 4) {
    return digits;
  }
  // 头部按 3 位分组、最后一组保留 4 位（如 202 555 0100）；
  // 头部长度不是 3 的整数倍时，残余位并入头部最末组（1380000 → 138 / 0000）
  const head = digits.slice(0, -4);
  const tail = digits.slice(-4);
  const remainder = head.length % 3;
  const headGroups: string[] = [];
  const regularLength = head.length - remainder;
  for (let i = 0; i < regularLength; i += 3) {
    headGroups.push(head.slice(i, i + 3));
  }
  if (remainder > 0) {
    const lastGroup = headGroups.pop() ?? '';
    headGroups.push(lastGroup + head.slice(regularLength));
  }
  return [...headGroups, tail].join(' ');
}

/**
 * 规范化单个电话号码为 E.164。
 *
 * @param rawInput - 原始号码文本
 * @param defaultCountryCode - 无 + / 00 国际前缀时使用的默认国家码（纯数字，1–3 位），可选
 * @returns 结构化规范化结果
 */
export function normalizePhoneNumber(
  rawInput: string,
  defaultCountryCode?: string,
): NormalizeResult {
  const errors: string[] = [];
  const { main, extension } = splitExtension(rawInput);
  const { cleaned, invalidChars } = cleanMain(main);

  if (invalidChars.length > 0) {
    errors.push(`包含非法字符：${invalidChars.map((ch) => `「${ch}」`).join('、')}`);
  }

  const plusCount = (cleaned.match(/\+/g) ?? []).length;
  if (plusCount > 1) {
    errors.push('包含多个「+」号，国际前缀只能出现一次');
  }
  if (cleaned.includes('+') && !cleaned.startsWith('+')) {
    errors.push('「+」只能出现在号码开头');
  }

  let digits = cleaned.replace(/\+/g, '');
  let isInternational = cleaned.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  let countryCode: string | null = null;
  let nationalNumber: string;

  if (isInternational) {
    if (digits.length === 0) {
      errors.push('国际前缀后缺少号码数字');
      return failure(errors, extension);
    }
    // 国家码 1–3 位，首位 1–9；按最短可行切分（1 位优先，如北美 1）
    countryCode = extractCountryCode(digits);
    if (!countryCode) {
      errors.push('无法识别国家码：E.164 国家码为 1–3 位且首位不能为 0');
      return failure(errors, extension);
    }
    nationalNumber = digits.slice(countryCode.length);
  } else {
    const cc = (defaultCountryCode ?? '').replace(/\D/g, '');
    if (!cc) {
      errors.push('号码缺少国际前缀（+ 或 00），且未提供默认国家码');
      return failure(errors, extension);
    }
    if (cc.length > COUNTRY_CODE_MAX_LENGTH || cc.startsWith('0')) {
      errors.push(`默认国家码「${cc}」非法：应为 1–3 位且首位不能为 0`);
      return failure(errors, extension);
    }
    // NANP 本地号码常把国家码 1 一并写出（如 1-800-...），识别后不再前置默认码
    if (cc === '1' && digits.startsWith('1') && digits.length === 11) {
      countryCode = '1';
      nationalNumber = digits.slice(1);
    } else {
      countryCode = cc;
      // 国内长途前缀 0（如中国 021、英国 07xxx）在 E.164 中去除
      nationalNumber = digits.startsWith('0') ? digits.slice(1) : digits;
    }
  }

  if (nationalNumber.length === 0) {
    errors.push('缺少国内有效号码部分');
    return failure(errors, extension);
  }

  const totalDigits = countryCode.length + nationalNumber.length;
  if (totalDigits < E164_MIN_DIGITS || totalDigits > E164_MAX_DIGITS) {
    errors.push(
      `E.164 号码数字位须在 ${E164_MIN_DIGITS}–${E164_MAX_DIGITS} 位之间，当前为 ${totalDigits} 位`,
    );
  }
  if (nationalNumber.startsWith('0')) {
    errors.push('国内号码部分不能以 0 开头（ trunk prefix 应在规范化时去除）');
  }

  const e164 = `+${countryCode}${nationalNumber}`;
  const telUri = extension
    ? `tel:${e164};ext=${extension}`
    : `tel:${e164}`;

  if (errors.length > 0) {
    return {
      ok: false,
      e164: null,
      countryCode: null,
      nationalNumber: null,
      telUri: null,
      formatted: null,
      extension,
      errors,
    };
  }

  return {
    ok: true,
    e164,
    countryCode,
    nationalNumber,
    telUri,
    formatted: `+${countryCode} ${visualGroup(nationalNumber)}`,
    extension,
    errors: [],
  };
}

/**
 * 批量规范化：逐行处理，空行跳过，不中断。
 *
 * @param text - 多行号码文本
 * @param defaultCountryCode - 默认国家码
 * @returns 每行一个结果（含原始行号与原文）
 */
export function normalizeBatch(
  text: string,
  defaultCountryCode?: string,
): Array<{ line: number; raw: string } & NormalizeResult> {
  return text
    .split(/\r?\n/)
    .map((raw, index) => ({ line: index + 1, raw, ...normalizePhoneNumber(raw, defaultCountryCode) }))
    .filter((item) => item.raw.trim().length > 0);
}

/**
 * 构造失败结果的内部辅助。
 */
function failure(errors: string[], extension: string | null): NormalizeResult {
  return {
    ok: false,
    e164: null,
    countryCode: null,
    nationalNumber: null,
    telUri: null,
    formatted: null,
    extension,
    errors,
  };
}

/**
 * 1 位国家码集合：E.164 中只有北美编号计划（NANP）使用国家码 1。
 * 首位为 1 时国家码即 1 位；其余首位按 2 位优先切分（86 中国、44 英国、
 * 81 日本、91 印度等均为 2 位码），2 位切分后国内部分为空才回退 3 位。
 * 不引入外部号段数据库：3 位国家码（2xx/3xx/4xx/6xx/7/9xx 段）与 2 位码
 * 在无库条件下无法完全区分，本工具按结构可行性切分并在文档中说明边界。
 */
const ONE_DIGIT_COUNTRY_CODES = new Set(['1']);

/**
 * 按 E.164 规则切分国家码：1–3 位且首位非 0。
 *
 * @param digits - 含国家码的全部数字
 * @returns 国家码字符串，无法切分时返回 null
 */
function extractCountryCode(digits: string): string | null {
  const firstDigit = digits.charAt(0);
  if (firstDigit === '0') {
    return null;
  }
  if (ONE_DIGIT_COUNTRY_CODES.has(firstDigit) && digits.length > 1) {
    return digits.slice(0, 1);
  }
  if (digits.length > 2) {
    return digits.slice(0, 2);
  }
  if (digits.length > 1) {
    return digits.slice(0, digits.length - 1);
  }
  return null;
}
