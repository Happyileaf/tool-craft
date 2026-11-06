/**
 * E.164 电话号码规范化纯函数集合。
 * 仅做结构层面的字符清洗、国家码前缀匹配与长度区间校验，
 * 不依赖实时号段数据库，因此不保证号码真实存在。
 */

/** 单个国家 / 地区的码表配置 */
export interface CountryRule {
  /** ISO 3166-1 alpha-2 地区代码 */
  iso: string;
  /** 中文名称 */
  name: string;
  /** 国家码（不含加号），如 "86"、"1" */
  countryCode: string;
  /** 去掉国家码后订阅号的最小长度 */
  minNationalLength: number;
  /** 去掉国家码后订阅号的最大长度 */
  maxNationalLength: number;
  /** 国际分组展示函数：把订阅号按本地习惯分组，默认不分组 */
  group?: (national: string) => string;
}

/**
 * 内置常用国家 / 地区码表。按国家码长度降序排列，
 * 以便前缀匹配时优先命中更长的国家码（如 +1 与 +1-xxx 不会混淆）。
 */
export const COUNTRY_RULES: CountryRule[] = [
  {
    iso: 'CN',
    name: '中国',
    countryCode: '86',
    minNationalLength: 11,
    maxNationalLength: 11,
    group: (n) => (n.length === 11 ? `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}` : n),
  },
  {
    iso: 'HK',
    name: '中国香港',
    countryCode: '852',
    minNationalLength: 8,
    maxNationalLength: 8,
    group: (n) => (n.length === 8 ? `${n.slice(0, 4)} ${n.slice(4)}` : n),
  },
  {
    iso: 'TW',
    name: '中国台湾',
    countryCode: '886',
    minNationalLength: 9,
    maxNationalLength: 9,
    group: (n) => (n.length === 9 ? `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}` : n),
  },
  {
    iso: 'JP',
    name: '日本',
    countryCode: '81',
    minNationalLength: 10,
    maxNationalLength: 10,
    group: (n) =>
      n.length === 10 ? `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}` : n,
  },
  {
    iso: 'GB',
    name: '英国',
    countryCode: '44',
    minNationalLength: 9,
    maxNationalLength: 10,
  },
  {
    iso: 'US',
    name: '美国 / 加拿大',
    countryCode: '1',
    minNationalLength: 10,
    maxNationalLength: 10,
    group: (n) =>
      n.length === 10 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n,
  },
];

/** 默认国家码（中国 +86）对应的 ISO 代码 */
export const DEFAULT_COUNTRY_ISO = 'CN';

/** 单条号码规范化结果 */
export interface PhoneResult {
  /** 原始输入行 */
  raw: string;
  /** 是否成功 */
  ok: boolean;
  /** 标准 E.164（+ 开头纯数字），失败时为 null */
  e164: string | null;
  /** 命中的国家码（不含加号），失败时为 null */
  countryCode: string | null;
  /** 国家 / 地区名称，失败时为 null */
  countryName: string | null;
  /** 去掉国家码后的订阅号，失败时为 null */
  nationalNumber: string | null;
  /** 国际分组展示，失败时为 null */
  internationalDisplay: string | null;
  /** 失败原因，成功时为 null */
  error: string | null;
}

/** 需要从号码中剥离的分隔符（空格、连字符、括号、点、斜杠等） */
const SEPARATOR_PATTERN = /[\s\-()./]/g;

/** 清洗后仍残留的非数字字符（字母、特殊符号等） */
const NON_DIGIT_PATTERN = /\D/;

/**
 * 清洗原始号码文本：
 * 1. 去除常见分隔符；
 * 2. 识别并保留前导的国际前缀（+ 或 00）标记；
 * 3. 返回是否为国际格式以及剩余数字串。
 */
export function cleanPhoneInput(input: string): {
  digits: string;
  hasInternationalPrefix: boolean;
  hasInvalidChar: boolean;
} {
  const trimmed = input.trim();
  // 在剥离分隔符前先判断是否以 + 或 00 开头
  const hasPlusPrefix = trimmed.startsWith('+');
  let work = trimmed.replace(SEPARATOR_PATTERN, '');
  const hasDoubleZeroPrefix = !hasPlusPrefix && work.startsWith('00');
  if (hasPlusPrefix) {
    work = work.slice(1);
  } else if (hasDoubleZeroPrefix) {
    work = work.slice(2);
  }
  return {
    digits: work,
    hasInternationalPrefix: hasPlusPrefix || hasDoubleZeroPrefix,
    hasInvalidChar: NON_DIGIT_PATTERN.test(work),
  };
}

/** 按国家码在码表中查找规则（国家码最长优先） */
export function findCountryRule(countryCode: string): CountryRule | undefined {
  return COUNTRY_RULES.find((rule) => countryCode === rule.countryCode);
}

/** 取得默认国家规则 */
export function getDefaultCountryRule(iso: string = DEFAULT_COUNTRY_ISO): CountryRule {
  const rule = COUNTRY_RULES.find((item) => item.iso === iso);
  if (!rule) {
    throw new Error(`未知的默认国家代码：${iso}`);
  }
  return rule;
}

/**
 * 在一串数字中按最长前缀匹配国家码。
 * 国家码长度为 1~3 位，从长到短尝试。
 */
function matchCountryCode(digits: string): { rule: CountryRule; national: string } | null {
  for (let len = 3; len >= 1; len -= 1) {
    if (digits.length <= len) continue;
    const candidate = digits.slice(0, len);
    const rule = findCountryRule(candidate);
    if (rule) {
      return { rule, national: digits.slice(len) };
    }
  }
  return null;
}

/**
 * 规范化单个电话号码。
 *
 * @param rawInput 原始号码文本
 * @param defaultIso 未带国际前缀时使用的默认国家 ISO，默认 CN
 * @returns 结构化结果，失败时 ok=false 并带 error
 */
export function normalizePhone(
  rawInput: string,
  defaultIso: string = DEFAULT_COUNTRY_ISO,
): PhoneResult {
  const base: PhoneResult = {
    raw: rawInput,
    ok: false,
    e164: null,
    countryCode: null,
    countryName: null,
    nationalNumber: null,
    internationalDisplay: null,
    error: null,
  };

  const { digits, hasInternationalPrefix, hasInvalidChar } = cleanPhoneInput(rawInput);

  if (digits.length === 0) {
    return { ...base, error: '号码为空' };
  }
  if (hasInvalidChar) {
    return { ...base, error: '包含非法字符（仅允许数字与空格、连字符、括号、点等分隔符）' };
  }

  let rule: CountryRule;
  let national: string;

  if (hasInternationalPrefix) {
    const matched = matchCountryCode(digits);
    if (!matched) {
      return { ...base, error: '无法识别的国家码（内置码表未覆盖该前缀）' };
    }
    rule = matched.rule;
    national = matched.national;
  } else {
    rule = getDefaultCountryRule(defaultIso);
    // 本地号码若误带国家码（如 86138...），也能容错：识别出等于默认国家码的前缀
    if (digits.startsWith(rule.countryCode) && digits.length > rule.countryCode.length) {
      national = digits.slice(rule.countryCode.length);
    } else {
      national = digits;
    }
  }

  if (national.length < rule.minNationalLength || national.length > rule.maxNationalLength) {
    return {
      ...base,
      countryCode: rule.countryCode,
      countryName: rule.name,
      error: `订阅号长度 ${national.length} 位，超出 ${rule.name}允许的 ${rule.minNationalLength}–${rule.maxNationalLength} 位区间`,
    };
  }

  const e164 = `+${rule.countryCode}${national}`;
  if (e164.length > 16) {
    // E.164 规定含加号在内不超过 16 位，即数字部分不超过 15 位
    return { ...base, error: '号码超过 E.164 规定的 15 位数字上限' };
  }

  const grouped = rule.group ? rule.group(national) : national;
  return {
    ...base,
    ok: true,
    e164,
    countryCode: rule.countryCode,
    countryName: rule.name,
    nationalNumber: national,
    internationalDisplay: `+${rule.countryCode} ${grouped}`,
    error: null,
  };
}

/**
 * 批量规范化多行号码，逐行独立处理，空行跳过（不出现在结果中）。
 */
export function normalizePhoneBatch(
  text: string,
  defaultIso: string = DEFAULT_COUNTRY_ISO,
): PhoneResult[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => normalizePhone(line, defaultIso));
}
