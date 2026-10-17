/**
 * 语义化版本（SemVer 2.0.0）解析、比较与 npm 风格范围匹配的纯函数实现，
 * 不依赖 DOM 与 React
 */

/** 版本号比较结果 */
export enum CompareResultEnum {
  /** 左侧版本更小 */
  LESS = 'less',
  /** 两侧版本相等 */
  EQUAL = 'equal',
  /** 左侧版本更大 */
  GREATER = 'greater',
}

/** 解析后的语义化版本 */
export interface SemVer {
  /** 主版本号 */
  major: number;
  /** 次版本号 */
  minor: number;
  /** 修订号 */
  patch: number;
  /** 预发布标识集合 */
  prerelease: string[];
  /** 构建元数据集合 */
  build: string[];
  /** 规范化后的版本字符串 */
  version: string;
}

/** SemVer 2.0.0 官方校验正则，允许可选的前导 v */
const NUMERIC_IDENTIFIER = '0|[1-9]\\d*';
const PRERELEASE_IDENTIFIER = `${NUMERIC_IDENTIFIER}|\\d*[a-zA-Z-][0-9a-zA-Z-]*`;
const VERSION_PATTERN = new RegExp(
  `^v?(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})` +
    `(?:-((?:${PRERELEASE_IDENTIFIER})(?:\\.(?:${PRERELEASE_IDENTIFIER}))*))?` +
    `(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$`,
);

/** 范围表达式中单个比较符 */
type ComparatorOperator = '^' | '~' | '>=' | '<=' | '>' | '<' | '=';

/** 范围表达式中的一个比较项 */
interface Comparator {
  /** 比较运算符，空字符串表示精确匹配 */
  operator: ComparatorOperator | '';
  /** 主版本号，null 表示未指定或通配 */
  major: number | null;
  /** 次版本号，null 表示未指定或通配 */
  minor: number | null;
  /** 修订号，null 表示未指定或通配 */
  patch: number | null;
  /** 预发布标识集合 */
  prerelease: string[];
}

/** 范围匹配结果 */
export interface RangeCheckResult {
  /** 是否命中范围 */
  matched: boolean;
  /** 解析失败时的错误信息 */
  error: string | null;
}

/**
 * 解析版本字符串为 SemVer 结构
 *
 * @param input - 版本字符串，允许首尾空白与前导 v
 * @returns 解析结果；非法时返回 null
 */
export function parseVersion(input: string): SemVer | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const matched = VERSION_PATTERN.exec(trimmed);
  if (!matched) {
    return null;
  }
  const [, major, minor, patch, prerelease, build] = matched;
  const prereleaseParts = prerelease ? prerelease.split('.') : [];
  const buildParts = build ? build.split('.') : [];
  return {
    major: Number.parseInt(major ?? '0', 10),
    minor: Number.parseInt(minor ?? '0', 10),
    patch: Number.parseInt(patch ?? '0', 10),
    prerelease: prereleaseParts,
    build: buildParts,
    version: `${major}.${minor}.${patch}${
      prereleaseParts.length > 0 ? `-${prereleaseParts.join('.')}` : ''
    }`,
  };
}

/**
 * 校验版本字符串是否为合法的语义化版本
 *
 * @param input - 版本字符串
 * @returns 是否合法
 */
export function isValidVersion(input: string): boolean {
  return parseVersion(input) !== null;
}

/**
 * 比较两个预发布标识集合的优先级
 *
 * @param a - 左侧预发布标识集合
 * @param b - 右侧预发布标识集合
 * @returns 负数表示左侧更小，正数表示更大，0 表示相等
 */
function comparePrerelease(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) {
    return 0;
  }
  if (a.length === 0) {
    return 1;
  }
  if (b.length === 0) {
    return -1;
  }
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? '';
    const right = b[index] ?? '';
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) {
      const leftValue = Number(left);
      const rightValue = Number(right);
      if (leftValue !== rightValue) {
        return leftValue < rightValue ? -1 : 1;
      }
    } else if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    } else if (left !== right) {
      return left < right ? -1 : 1;
    }
  }
  return a.length - b.length;
}

/**
 * 比较两个已解析版本的优先级
 *
 * @param a - 左侧版本
 * @param b - 右侧版本
 * @returns 负数表示 a 更小，正数表示更大，0 表示相等
 */
export function compareParsed(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) {
    return a.major < b.major ? -1 : 1;
  }
  if (a.minor !== b.minor) {
    return a.minor < b.minor ? -1 : 1;
  }
  if (a.patch !== b.patch) {
    return a.patch < b.patch ? -1 : 1;
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

/**
 * 比较两个版本字符串
 *
 * @param a - 左侧版本字符串
 * @param b - 右侧版本字符串
 * @returns 比较结果；任一版本非法时返回 null
 */
export function compareVersions(a: string, b: string): CompareResultEnum | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) {
    return null;
  }
  const diff = compareParsed(left, right);
  if (diff < 0) {
    return CompareResultEnum.LESS;
  }
  if (diff > 0) {
    return CompareResultEnum.GREATER;
  }
  return CompareResultEnum.EQUAL;
}

/**
 * 将单个比较项解析为 Comparator
 *
 * @param token - 范围表达式中的单个比较项，如 `^1.2.3`、`>=1.0.0`、`1.x`
 * @returns 解析结果；非法时返回 null
 */
function parseComparator(token: string): Comparator | null {
  const trimmed = token.trim();
  if (trimmed === '' || trimmed === '*' || trimmed === 'x' || trimmed === 'X') {
    return {
      operator: '',
      major: null,
      minor: null,
      patch: null,
      prerelease: [],
    };
  }

  const matched = /^(>=|<=|>|<|=|\^|~)?\s*v?(.+)$/.exec(trimmed);
  if (!matched) {
    return null;
  }
  const operator = (matched[1] ?? '') as ComparatorOperator | '';
  const rest = (matched[2] ?? '').trim();

  const [corePart, prereleasePart] = rest.split('-');
  const parts = (corePart ?? '').split('.');
  if (parts.length > 3) {
    return null;
  }

  const numericParts: (number | null)[] = [];
  for (const part of parts) {
    const value = part.trim();
    if (value === '' || value === '*' || value === 'x' || value === 'X') {
      numericParts.push(null);
      continue;
    }
    if (!/^(0|[1-9]\d*)$/.test(value)) {
      return null;
    }
    numericParts.push(Number.parseInt(value, 10));
  }
  while (numericParts.length < 3) {
    numericParts.push(null);
  }

  return {
    operator,
    major: numericParts[0] ?? null,
    minor: numericParts[1] ?? null,
    patch: numericParts[2] ?? null,
    prerelease: prereleasePart ? prereleasePart.split('.') : [],
  };
}

/**
 * 判断某个版本是否命中单个比较项
 *
 * @param version - 已解析的目标版本
 * @param comparator - 比较项
 * @returns 是否命中
 */
function matchComparator(version: SemVer, comparator: Comparator): boolean {
  const hasPrerelease = version.prerelease.length > 0;

  // 未指定主版本号视为通配，任意版本命中
  if (comparator.major === null) {
    return true;
  }

  const lower: SemVer = {
    major: comparator.major,
    minor: comparator.minor ?? 0,
    patch: comparator.patch ?? 0,
    prerelease: comparator.prerelease,
    build: [],
    version: '',
  };

  const compareWithLower = compareParsed(version, lower);

  if (comparator.operator === '^' || comparator.operator === '~') {
    const upper = comparator.operator === '^' ? caretUpperBound(comparator) : tildeUpperBound(comparator);
    if (hasPrerelease && comparator.prerelease.length === 0) {
      return false;
    }
    if (compareWithLower < 0) {
      return false;
    }
    return compareParsed(version, upper) < 0;
  }

  if (comparator.operator === '') {
    // 精确或部分匹配：缺省段按范围处理
    if (comparator.minor === null) {
      const upper: SemVer = {
        major: comparator.major + 1,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
        version: '',
      };
      if (hasPrerelease) {
        return false;
      }
      return compareWithLower >= 0 && compareParsed(version, upper) < 0;
    }
    if (comparator.patch === null) {
      const upper: SemVer = {
        major: comparator.major,
        minor: (comparator.minor ?? 0) + 1,
        patch: 0,
        prerelease: [],
        build: [],
        version: '',
      };
      if (hasPrerelease) {
        return false;
      }
      return compareWithLower >= 0 && compareParsed(version, upper) < 0;
    }
    if (hasPrerelease && comparator.prerelease.length === 0) {
      return false;
    }
    return compareWithLower === 0;
  }

  if (hasPrerelease && comparator.prerelease.length === 0) {
    return false;
  }

  switch (comparator.operator) {
    case '>':
      return compareWithLower > 0;
    case '>=':
      return compareWithLower >= 0;
    case '<':
      return compareWithLower < 0;
    case '<=':
      return compareWithLower <= 0;
    case '=':
      return compareWithLower === 0;
    default:
      return false;
  }
}

/**
 * 计算 `^` 范围的上界（不含）
 *
 * @param comparator - `^` 比较项
 * @returns 上界版本
 */
function caretUpperBound(comparator: Comparator): SemVer {
  const major = comparator.major ?? 0;
  const minor = comparator.minor;
  const patch = comparator.patch;

  if (major > 0 || minor === null) {
    return {
      major: major + 1,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: [],
      version: '',
    };
  }
  if (minor > 0) {
    return {
      major,
      minor: minor + 1,
      patch: 0,
      prerelease: [],
      build: [],
      version: '',
    };
  }
  return {
    major,
    minor: 0,
    patch: (patch ?? 0) + 1,
    prerelease: [],
    build: [],
    version: '',
  };
}

/**
 * 计算 `~` 范围的上界（不含）
 *
 * @param comparator - `~` 比较项
 * @returns 上界版本
 */
function tildeUpperBound(comparator: Comparator): SemVer {
  const major = comparator.major ?? 0;
  const minor = comparator.minor;
  if (minor === null) {
    return {
      major: major + 1,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: [],
      version: '',
    };
  }
  return {
    major,
    minor: minor + 1,
    patch: 0,
    prerelease: [],
    build: [],
    version: '',
  };
}

/**
 * 解析范围表达式为若干「与」组合的「或」集合
 *
 * @param range - npm 风格范围表达式
 * @returns 比较项二维数组；非法时返回 null
 */
function parseRange(range: string): Comparator[][] | null {
  const trimmed = range.trim();
  if (trimmed === '') {
    return [[{ operator: '', major: null, minor: null, patch: null, prerelease: [] }]];
  }

  const orSets = trimmed.split('||');
  const result: Comparator[][] = [];

  for (const rawSet of orSets) {
    const set = rawSet.trim();
    if (set === '') {
      return null;
    }

    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(set);
    if (hyphen) {
      const lower = parseComparator(`>=${hyphen[1] ?? ''}`);
      const upperToken = hyphen[2] ?? '';
      const upperComparator = parseComparator(upperToken);
      if (!lower || !upperComparator) {
        return null;
      }
      const upperAdjusted = hyphenUpperComparator(upperComparator);
      if (!upperAdjusted) {
        return null;
      }
      result.push([lower, upperAdjusted]);
      continue;
    }

    const tokens = set.split(/\s+/);
    const comparators: Comparator[] = [];
    for (const token of tokens) {
      const parsed = parseComparator(token);
      if (!parsed) {
        return null;
      }
      comparators.push(parsed);
    }
    result.push(comparators);
  }

  return result;
}

/**
 * 将连字符区间的上界部分转换为比较项
 *
 * @param comparator - 连字符区间上界解析结果
 * @returns 归一化后的比较项；无法处理时返回 null
 */
function hyphenUpperComparator(comparator: Comparator): Comparator | null {
  if (comparator.major === null) {
    return null;
  }
  if (comparator.patch !== null) {
    return { ...comparator, operator: '<=' };
  }
  if (comparator.minor === null) {
    return { ...comparator, operator: '<', minor: 0, patch: 0, major: comparator.major + 1 };
  }
  return { ...comparator, operator: '<', patch: 0, minor: comparator.minor + 1 };
}

/**
 * 判断给定版本是否被范围表达式命中
 *
 * @param version - 目标版本字符串
 * @param range - npm 风格范围表达式
 * @returns 匹配结果与错误信息
 */
export function checkRange(version: string, range: string): RangeCheckResult {
  const parsedVersion = parseVersion(version);
  if (!parsedVersion) {
    return { matched: false, error: `版本号无效：${version}` };
  }
  const parsedRange = parseRange(range);
  if (!parsedRange) {
    return { matched: false, error: `范围表达式无效：${range}` };
  }

  const matched = parsedRange.some((comparators) =>
    comparators.every((comparator) => matchComparator(parsedVersion, comparator)),
  );
  return { matched, error: null };
}
