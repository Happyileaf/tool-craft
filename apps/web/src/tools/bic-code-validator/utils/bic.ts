/**
 * ISO 9362 BIC（Business Identifier Code，亦称 SWIFT 代码）结构校验与解析，
 * 纯字符串规则、零依赖。
 *
 * 结构（8 位主代码或 11 位完整代码）：
 *   BBBB CC LL BBB
 *   ├ 4 位银行代码（Bank Code）：A–Z
 *   ├ 2 位国家码（Country Code）：ISO 3166-1 alpha-2，A–Z
 *   ├ 2 位地区码（Location Code）：字母数字，A–Z 0–9
 *   └ 3 位分行码（Branch Code，可选）：字母数字；主代码（8 位）等价于 XXX
 *
 * 特殊语义：
 *   - 地区码第二位为 '1'：SWIFT 独立连接成员；为 '0'：测试 / 培训代码
 *   - 分行码 'XXX' 或省略：银行主办公室（primary office）
 */

/** 单个 BIC 的解析结果 */
export interface ParsedBic {
  /** 规范化后的大写 BIC */
  normalized: string;
  bankCode: string;
  countryCode: string;
  locationCode: string;
  /** 分行码；8 位输入时补为 XXX */
  branchCode: string;
  /** 是否为 11 位完整代码（false 表示 8 位主代码） */
  hasBranch: boolean;
  /** 地区码第二位的语义提示 */
  locationSemantics: string;
  /** 是否测试 / 培训代码（地区码第二位为 0） */
  isTestCode: boolean;
}

export interface BicValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parsed: ParsedBic | null;
}

/** 批量校验单行结果 */
export interface BulkBicRow extends BicValidationResult {
  /** 原始输入（去首尾空白后） */
  input: string;
  line: number;
}

/** ISO 3166-1 alpha-2 国家码集合（含 SWIFT 专用的 XK 科索沃代码） */
const ISO_3166_ALPHA2 = new Set([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
]);

const BANK_CODE_REGEX = /^[A-Z]{4}$/;
const LOCATION_CODE_REGEX = /^[A-Z0-9]{2}$/;
const BRANCH_CODE_REGEX = /^[A-Z0-9]{3}$/;

function describeLocation(locationCode: string): { semantics: string; isTest: boolean } {
  const second = locationCode[1]!;
  if (second === '0') {
    return { semantics: '地区码第二位为 0：测试 / 培训代码（test/training BIC），不用于生产报文', isTest: true };
  }
  if (second === '1') {
    return { semantics: '地区码第二位为 1：SWIFT 网络独立连接成员', isTest: false };
  }
  return { semantics: `地区码第二位为 ${second}：普通连接成员 / 国家内分区`, isTest: false };
}

/**
 * 校验并解析单个 BIC 字符串。
 *
 * @param raw - 原始输入，允许首尾空白与小写
 * @returns 合法标志、错误、警告与结构化字段
 */
export function validateBic(raw: string): BicValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const input = (raw ?? '').trim();

  if (!input) {
    return { valid: false, errors: ['BIC 代码不能为空'], warnings, parsed: null };
  }
  if (/\s/.test(input)) {
    errors.push('BIC 代码不能包含空格');
  }
  const normalized = input.toUpperCase();
  if (normalized.length !== 8 && normalized.length !== 11) {
    errors.push(`长度非法：${normalized.length} 位，BIC 必须是 8 位主代码或 11 位完整代码`);
    return { valid: false, errors, warnings, parsed: null };
  }

  const bankCode = normalized.slice(0, 4);
  const countryCode = normalized.slice(4, 6);
  const locationCode = normalized.slice(6, 8);
  const branchCode = normalized.length === 11 ? normalized.slice(8, 11) : 'XXX';

  if (!BANK_CODE_REGEX.test(bankCode)) {
    errors.push(`银行代码「${bankCode}」必须是 4 位大写字母 A–Z`);
  }
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    errors.push(`国家码「${countryCode}」必须是 2 位大写字母`);
  } else if (!ISO_3166_ALPHA2.has(countryCode)) {
    errors.push(`国家码「${countryCode}」不是 ISO 3166-1 alpha-2 国家 / 地区代码（含 SWIFT 专用 XK）`);
  }
  if (!LOCATION_CODE_REGEX.test(locationCode)) {
    errors.push(`地区码「${locationCode}」必须是 2 位字母或数字`);
  }
  if (normalized.length === 11 && !BRANCH_CODE_REGEX.test(branchCode)) {
    errors.push(`分行码「${branchCode}」必须是 3 位字母或数字`);
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, parsed: null };
  }

  const { semantics, isTest } = describeLocation(locationCode);
  if (isTest) {
    warnings.push(semantics);
  }
  if (branchCode === 'XXX') {
    warnings.push('分行码 XXX（或 8 位省略形式）表示银行主办公室（primary office）');
  }

  const parsed: ParsedBic = {
    normalized,
    bankCode,
    countryCode,
    locationCode,
    branchCode,
    hasBranch: normalized.length === 11 && branchCode !== 'XXX',
    locationSemantics: semantics,
    isTestCode: isTest,
  };
  return { valid: true, errors, warnings, parsed };
}

/**
 * 批量校验：每行一个 BIC，返回逐行结果与汇总统计。
 *
 * @param raw - 多行文本，空行自动跳过
 */
export function validateBicBatch(raw: string): {
  rows: BulkBicRow[];
  total: number;
  validCount: number;
  invalidCount: number;
} {
  const lines = raw.split(/\r?\n/);
  const rows: BulkBicRow[] = [];
  lines.forEach((original, index) => {
    const input = original.trim();
    if (!input) {
      return;
    }
    const result = validateBic(input);
    rows.push({ ...result, input, line: index + 1 });
  });
  const validCount = rows.filter((row) => row.valid).length;
  return { rows, total: rows.length, validCount, invalidCount: rows.length - validCount };
}

/** 常用演示 BIC（均为公开文档中的示例代码） */
export const SAMPLE_BICS: ReadonlyArray<{ bic: string; note: string }> = [
  { bic: 'DEUTDEFF', note: '德意志银行法兰克福（8 位主代码）' },
  { bic: 'DEUTDEFF500', note: '德意志银行汉堡分行（11 位含分行码）' },
  { bic: 'CHASUS33XXX', note: '摩根大通纽约（显式 XXX 主办公室）' },
  { bic: 'BOFAUS3N', note: '美国银行（地区码 3N）' },
];
