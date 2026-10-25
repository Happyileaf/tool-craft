/**
 * ISBN-10 / ISBN-13 校验与互转的纯函数实现，全部运算不依赖 DOM 与第三方库。
 * 规则依据 ISO 2108：ISBN-10 采用 10..2 加权模 11（校验位 10 记为 X），
 * ISBN-13 采用 1/3 交替加权模 10；仅 978 前缀的 ISBN-13 可映射回 ISBN-10。
 */

export type IsbnKind = 'isbn10' | 'isbn13';

export interface IsbnResult {
  /** 原始输入片段 */
  input: string;
  /** 是否通过完整校验 */
  valid: boolean;
  /** 识别出的 ISBN 类型 */
  kind: IsbnKind | null;
  /** 去除连字符与空白后的紧凑大写形式 */
  compact: string | null;
  /** 紧凑 ISBN-13（ISBN-10 输入会自动换算），非法时为 null */
  isbn13: string | null;
  /** 紧凑 ISBN-10，仅 978 前缀可转换；979 前缀为 null */
  isbn10: string | null;
  /** 带 GS1/组区分隔的 ISBN-13 展示形式；组区未知时回退紧凑形式 */
  formatted13: string | null;
  /** 带组区分隔的 ISBN-10 展示形式；组区未知或不可转换时回退紧凑形式/null */
  formatted10: string | null;
  /** 校验失败时的中文错误说明 */
  error: string | null;
  /** 错误所在的紧凑形式下标（从 0 开始），无法定位时为 null */
  errorPosition: number | null;
  /** 是否为批次内重复条目（按换算后的 ISBN-13 去重） */
  isDuplicate: boolean;
}

export interface IsbnBatchSummary {
  /** 片段总数 */
  total: number;
  /** 合法数量 */
  valid: number;
  /** 非法数量 */
  invalid: number;
  /** 去重后数量 */
  unique: number;
  /** 重复出现次数（第二次起计） */
  duplicate: number;
}

export interface IsbnBatchResult {
  items: IsbnResult[];
  summary: IsbnBatchSummary;
}

interface NormalizedToken {
  compact: string;
  /** 紧凑形式下标到原始字符串下标的映射 */
  positions: number[];
}

interface RangeRule {
  min: number;
  max: number;
}

interface GroupRule {
  length: number;
  ranges: RangeRule[];
}

/** 978 前缀的组区号规则（按组号长度组织，区间依据 ISBN International 范围表） */
const GROUPS_978: GroupRule[] = [
  { length: 1, ranges: [{ min: 0, max: 7 }] },
  { length: 2, ranges: [{ min: 80, max: 94 }] },
  { length: 3, ranges: [
    { min: 600, max: 649 },
    { min: 950, max: 989 },
  ] },
  { length: 4, ranges: [{ min: 9900, max: 9989 }] },
  { length: 5, ranges: [{ min: 99900, max: 99999 }] },
];

/** 979 前缀当前已分配的组区号（8、9 为美国英语区，10–12 为法语区） */
const GROUPS_979: GroupRule[] = [
  { length: 1, ranges: [
    { min: 8, max: 9 },
  ] },
  { length: 2, ranges: [
    { min: 10, max: 12 },
  ] },
];

/**
 * 去除连字符、空白等分隔符并把 x 统一为大写 X，同时保留位置映射
 *
 * @param raw - 原始输入
 * @returns 紧凑形式与位置映射
 */
function normalizeToken(raw: string): NormalizedToken {
  const compactChars: string[] = [];
  const positions: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === undefined) {
      continue;
    }
    if (/\s/.test(ch) || ch === '-' || ch === '–' || ch === '—') {
      continue;
    }
    compactChars.push(ch.toUpperCase());
    positions.push(i);
  }
  return { compact: compactChars.join(''), positions };
}

/**
 * 计算 ISBN-10 校验位（前 9 位必须全部为数字）
 *
 * @param digits9 - 不含校验位的 9 位数字
 * @returns 校验位字符（10 记为 X）
 */
export function isbn10CheckDigit(digits9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits9[i]) * (10 - i);
  }
  const remainder = sum % 11;
  const check = (11 - remainder) % 11;
  return check === 10 ? 'X' : String(check);
}

/**
 * 计算 ISBN-13 校验位（前 12 位必须全部为数字）
 *
 * @param digits12 - 不含校验位的 12 位数字
 * @returns 校验位字符
 */
export function isbn13CheckDigit(digits12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * 将合法 ISBN-10 转换为 ISBN-13（统一加 978 前缀后重算校验位）
 *
 * @param compact10 - 紧凑 ISBN-10
 * @returns 紧凑 ISBN-13
 */
function convert10to13(compact10: string): string {
  const body = `978${compact10.slice(0, 9)}`;
  return body + isbn13CheckDigit(body);
}

/**
 * 将 978 前缀的合法 ISBN-13 转换为 ISBN-10
 *
 * @param compact13 - 紧凑 ISBN-13
 * @returns 紧凑 ISBN-10；非 978 前缀返回 null
 */
function convert13to10(compact13: string): string | null {
  if (!compact13.startsWith('978')) {
    return null;
  }
  const body = compact13.slice(3, 12);
  return body + isbn10CheckDigit(body);
}

/**
 * 依据前缀与组区号规则确定组号长度
 *
 * @param compact13 - 紧凑 ISBN-13
 * @returns 组号长度；未命中已知范围返回 null
 */
function detectGroupLength(compact13: string): number | null {
  const prefix = compact13.slice(0, 3);
  const rules = prefix === '978' ? GROUPS_978 : prefix === '979' ? GROUPS_979 : null;
  if (!rules) {
    return null;
  }
  for (const rule of rules) {
    const groupValue = Number(compact13.slice(3, 3 + rule.length));
    if (rule.ranges.some((range) => groupValue >= range.min && groupValue <= range.max)) {
      return rule.length;
    }
  }
  return null;
}

/**
 * 生成带分隔的 ISBN-13：GS1 前缀-组区号-出版者/书名段-校验位
 *
 * @param compact13 - 紧凑 ISBN-13
 * @returns 分隔形式；组区号未知时回退紧凑形式
 */
function formatIsbn13(compact13: string): string {
  const groupLength = detectGroupLength(compact13);
  if (groupLength === null) {
    return compact13;
  }
  const prefix = compact13.slice(0, 3);
  const group = compact13.slice(3, 3 + groupLength);
  const publication = compact13.slice(3 + groupLength, 12);
  const check = compact13.slice(12);
  return `${prefix}-${group}-${publication}-${check}`;
}

/**
 * 生成带分隔的 ISBN-10：组区号-出版者/书名段-校验位
 *
 * @param compact10 - 紧凑 ISBN-10
 * @param compact13 - 对应的 ISBN-13（用于复用组区规则）
 * @returns 分隔形式；组区号未知时回退紧凑形式
 */
function formatIsbn10(compact10: string, compact13: string): string {
  const groupLength = detectGroupLength(compact13);
  if (groupLength === null) {
    return compact10;
  }
  const group = compact10.slice(0, groupLength);
  const publication = compact10.slice(groupLength, 9);
  const check = compact10.slice(9);
  return `${group}-${publication}-${check}`;
}

/**
 * 校验并转换单个 ISBN 片段
 *
 * @param raw - 原始输入片段
 * @returns 校验与转换结果
 */
export function inspectIsbn(raw: string): IsbnResult {
  const base: IsbnResult = {
    input: raw,
    valid: false,
    kind: null,
    compact: null,
    isbn13: null,
    isbn10: null,
    formatted13: null,
    formatted10: null,
    error: null,
    errorPosition: null,
    isDuplicate: false,
  };

  const { compact, positions } = normalizeToken(raw);

  if (compact.length !== 10 && compact.length !== 13) {
    return {
      ...base,
      compact: compact || null,
      error: `去除分隔符后应为 10 位（ISBN-10）或 13 位（ISBN-13），当前为 ${compact.length} 位`,
    };
  }

  const inferredKind: IsbnKind = compact.length === 10 ? 'isbn10' : 'isbn13';

  for (let i = 0; i < compact.length; i += 1) {
    const ch = compact[i] as string;
    if (/[0-9]/.test(ch)) {
      continue;
    }
    if (ch === 'X') {
      if (inferredKind === 'isbn13' || i !== compact.length - 1) {
        return {
          ...base,
          kind: inferredKind,
          compact,
          errorPosition: positions[i] ?? null,
          error:
            inferredKind === 'isbn13'
              ? 'ISBN-13 只能包含数字，不能出现 X'
              : 'ISBN-10 中 X 仅允许作为末位校验位（表示 10）',
        };
      }
      continue;
    }
    return {
      ...base,
      kind: inferredKind,
      compact,
      errorPosition: positions[i] ?? null,
      error: `包含非法字符「${ch}」，ISBN 只能由数字与可选的末位 X 组成`,
    };
  }

  if (compact.length === 10) {
    const body = compact.slice(0, 9);
    const expected = isbn10CheckDigit(body);
    if (compact[9] !== expected) {
      return {
        ...base,
        kind: 'isbn10',
        compact,
        errorPosition: positions[9] ?? null,
        error: `校验位不正确：应为 ${expected}，实际为 ${compact[9]}`,
      };
    }
    const isbn13 = convert10to13(compact);
    return {
      ...base,
      valid: true,
      kind: 'isbn10',
      compact,
      isbn13,
      isbn10: compact,
      formatted13: formatIsbn13(isbn13),
      formatted10: formatIsbn10(compact, isbn13),
    };
  }

  if (!compact.startsWith('978') && !compact.startsWith('979')) {
    return {
      ...base,
      kind: 'isbn13',
      compact,
      error: 'ISBN-13 必须以 978 或 979（Bookland）前缀开头',
    };
  }

  const body13 = compact.slice(0, 12);
  const expected13 = isbn13CheckDigit(body13);
  if (compact[12] !== expected13) {
    return {
      ...base,
      kind: 'isbn13',
      compact,
      errorPosition: positions[12] ?? null,
      error: `校验位不正确：应为 ${expected13}，实际为 ${compact[12]}`,
    };
  }

  const isbn10 = convert13to10(compact);
  return {
    ...base,
    valid: true,
    kind: 'isbn13',
    compact,
    isbn13: compact,
    isbn10,
    formatted13: formatIsbn13(compact),
    formatted10: isbn10 ? formatIsbn10(isbn10, compact) : null,
  };
}

/**
 * 批量校验：按空白、逗号、分号分隔，按换算后的 ISBN-13 去重并标记重复；
 * ISBN-10 与其对应的 ISBN-13 视为同一条
 *
 * @param input - 多行文本
 * @returns 逐条结果与汇总统计
 */
export function inspectIsbnBatch(input: string): IsbnBatchResult {
  const tokens = input.split(/[\s,;，；]+/).filter((token) => token.length > 0);
  const items = tokens.map((token) => inspectIsbn(token));
  const seen = new Map<string, number>();
  let valid = 0;
  let invalid = 0;
  let duplicate = 0;

  for (const item of items) {
    if (item.valid) {
      valid += 1;
      const key = item.isbn13 ?? item.compact ?? '';
      const count = seen.get(key) ?? 0;
      if (count > 0) {
        item.isDuplicate = true;
        duplicate += 1;
      }
      seen.set(key, count + 1);
    } else {
      invalid += 1;
    }
  }

  return {
    items,
    summary: {
      total: items.length,
      valid,
      invalid,
      unique: seen.size,
      duplicate,
    },
  };
}
