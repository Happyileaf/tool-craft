/**
 * 敏感信息（PII）脱敏纯函数，不依赖 DOM 与 React。
 * 通过一组确定性规则在文本中识别邮箱、手机号、身份证号、银行卡号、IPv4 / IPv6、
 * 通用 API Key / Token 与用户自定义正则命中项，并按「保留首尾、中部掩码」或
 * 「整体替换」策略脱敏。
 *
 * 为兼容 ES2017 编译目标，本文件不使用命名捕获组与 ES2018 正则标志；
 * 数字边界通过对匹配区间外相邻字符的手动检查实现。
 */

/** 脱敏类别标识 */
export type PiiCategory =
  | 'email'
  | 'phone'
  | 'idCard'
  | 'bankCard'
  | 'ipv4'
  | 'ipv6'
  | 'apiKey'
  | 'custom';

/** 脱敏策略 */
export type MaskStrategy = 'partial' | 'full';

/** 单条规则的识别结果区间 */
interface Match {
  /** 类别 */
  category: PiiCategory;
  /** 命中起始下标（含） */
  start: number;
  /** 命中结束下标（不含） */
  end: number;
  /** 命中原文 */
  text: string;
}

/** 脱敏后的单条命中统计 */
export interface MaskHit {
  /** 类别 */
  category: PiiCategory;
  /** 命中原文 */
  original: string;
  /** 脱敏结果 */
  masked: string;
}

/** 脱敏结果 */
export interface MaskResult {
  /** 脱敏后的文本 */
  output: string;
  /** 各类别命中数量 */
  counts: Record<PiiCategory, number>;
  /** 总命中数量 */
  total: number;
  /** 逐条命中明细 */
  hits: MaskHit[];
}

/** 类别中文标签 */
export const CATEGORY_LABELS: Record<PiiCategory, string> = {
  email: '邮箱',
  phone: '手机号',
  idCard: '身份证号',
  bankCard: '银行卡号',
  ipv4: 'IPv4 地址',
  ipv6: 'IPv6 地址',
  apiKey: 'API Key / Token',
  custom: '自定义正则',
};

/** 空计数表 */
function createEmptyCounts(): Record<PiiCategory, number> {
  return {
    email: 0,
    phone: 0,
    idCard: 0,
    bankCard: 0,
    ipv4: 0,
    ipv6: 0,
    apiKey: 0,
    custom: 0,
  };
}

/** 十六进制段 */
const HEX_GROUP = /^[0-9A-Fa-f]{1,4}$/;

/**
 * 校验标准 IPv6（含 :: 压缩，不支持尾嵌 IPv4 与 zone id）。
 *
 * @param value - 候选字符串
 * @returns 是否为合法 IPv6
 */
export function isValidIPv6(value: string): boolean {
  if (!value.includes(':') || value.includes('.')) {
    return false;
  }
  const halves = value.split('::');
  if (halves.length > 2) {
    return false;
  }
  const splitGroups = (part: string): string[] => (part === '' ? [] : part.split(':'));

  if (halves.length === 2) {
    const head = splitGroups(halves[0] ?? '');
    const tail = splitGroups(halves[1] ?? '');
    if (head.length + tail.length > 7) {
      return false;
    }
    return [...head, ...tail].every((group) => HEX_GROUP.test(group));
  }

  const groups = value.split(':');
  return groups.length === 8 && groups.every((group) => HEX_GROUP.test(group));
}

/**
 * 规则定义。match 返回该规则在文本中的全部候选区间；
 * 对 apiKey 仅返回密钥本身的区间（不含 key= 前缀）。
 */
interface Rule {
  category: PiiCategory;
  match: (input: string) => Match[];
}

/** 收集带 g 标志正则的全部匹配 */
function collect(
  input: string,
  regex: RegExp,
  category: PiiCategory,
  resolveRange?: (result: RegExpExecArray) => [number, number],
): Match[] {
  const results: Match[] = [];
  regex.lastIndex = 0;
  let result: RegExpExecArray | null;
  while ((result = regex.exec(input)) !== null) {
    const nextIndex = regex.lastIndex;
    if (result.index === nextIndex) {
      regex.lastIndex += 1;
      continue;
    }
    const [start, end] = resolveRange
      ? resolveRange(result)
      : [result.index, result.index + result[0].length];
    results.push({ category, start, end, text: input.slice(start, end) });
  }
  return results;
}

/** 左侧相邻字符是否为数字（用于数字类规则的边界检查） */
function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9';
}

/** 左侧相邻字符是否为字母或数字 */
function isAlnum(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z0-9]/.test(char);
}

/** 仅保留两侧不紧邻数字的纯数字匹配（start/end 为数字串区间） */
function filterDigitBoundaries(
  input: string,
  candidates: Match[],
): Match[] {
  return candidates.filter(
    (candidate) =>
      !isDigit(input[candidate.start - 1]) && !isDigit(input[candidate.end]),
  );
}

/** 仅保留左侧不紧邻字母数字的匹配 */
function filterLeftAlnumBoundary(input: string, candidates: Match[]): Match[] {
  return candidates.filter((candidate) => !isAlnum(input[candidate.start - 1]));
}

/**
 * 内置规则集（顺序即优先级）：
 * email → idCard → bankCard → phone → apiKey → ipv6 → ipv4。
 */
const RULES: Rule[] = [
  {
    category: 'email',
    match: (input) =>
      collect(input, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, 'email'),
  },
  {
    // 18 位身份证：地址码 + 出生年月日 + 顺序码 + 校验位（X）
    category: 'idCard',
    match: (input) =>
      filterLeftAlnumBoundary(
        input,
        collect(
          input,
          /[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[0-9Xx](?![0-9A-Za-z])/g,
          'idCard',
        ),
      ),
  },
  {
    // 13–19 位连续数字（银行卡长度区间）
    category: 'bankCard',
    match: (input) =>
      filterDigitBoundaries(input, collect(input, /\d{13,19}/g, 'bankCard')),
  },
  {
    // 中国大陆 11 位手机号
    category: 'phone',
    match: (input) =>
      filterDigitBoundaries(input, collect(input, /1[3-9]\d{9}/g, 'phone')),
  },
  {
    // key=secret / Bearer secret / JWT（三段以 . 分隔的 base64url）
    category: 'apiKey',
    match: (input) =>
      collect(
        input,
        /(?:[A-Za-z0-9_-]*(?:key|token|secret|password|passwd|authorization)[A-Za-z0-9_-]*\s*[:=]\s*)([A-Za-z0-9._-]{16,})|Bearer\s+([A-Za-z0-9._-]{16,})|(eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/gi,
        'apiKey',
        (result) => {
          const secret = result[1] ?? result[2] ?? result[3] ?? result[0];
          const start = result.index + result[0].indexOf(secret);
          return [start, start + secret.length];
        },
      ),
  },
  {
    category: 'ipv6',
    match: (input) =>
      collect(
        input,
        /(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|[0-9A-Fa-f:]*::[0-9A-Fa-f:]*)(?![0-9A-Za-z:/.])/g,
        'ipv6',
      )
        // 左侧边界排除字母数字与冒号，避免从更长地址中段截取
        .filter((candidate) => !/[0-9A-Za-z:]/.test(input[candidate.start - 1] ?? ''))
        .filter((candidate) => isValidIPv6(candidate.text)),
  },
  {
    category: 'ipv4',
    match: (input) =>
      collect(
        input,
        /(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?!\d)/g,
        'ipv4',
      ).filter((candidate) => !isDigit(input[candidate.start - 1])),
  },
];

/**
 * 将用户提供的自定义正则源编译为全局正则；非法源抛出错误由调用方捕获。
 *
 * @param source - 正则源文本（可带 /pattern/flags 包裹，也可仅给 pattern）
 * @returns 带 g 标志的 RegExp
 */
export function compileCustomPattern(source: string): RegExp {
  const trimmed = source.trim();
  const match = /^\/(.+)\/([a-z]*)$/i.exec(trimmed);
  if (match) {
    const rawFlags = match[2] ?? '';
    const flags = rawFlags.includes('g') ? rawFlags : `${rawFlags}g`;
    return new RegExp(match[1] ?? '', flags);
  }
  return new RegExp(trimmed, 'g');
}

/**
 * 在文本中找出全部命中，规则按优先级占位，已被覆盖的区间不再重复匹配。
 * 内置规则优先于用户自定义正则；自定义规则之间按传入顺序占位。
 *
 * @param input - 原始文本
 * @param customPatterns - 用户自定义正则集合（优先级最低）
 * @returns 按下标升序排列的命中区间
 */
export function findPii(input: string, customPatterns: RegExp[] = []): Match[] {
  const occupied: Array<[number, number]> = [];
  const matches: Match[] = [];

  const isFree = (start: number, end: number): boolean =>
    occupied.every(([s, e]) => end <= s || start >= e);

  const addCandidates = (candidates: Match[]): void => {
    for (const candidate of candidates) {
      if (isFree(candidate.start, candidate.end)) {
        occupied.push([candidate.start, candidate.end]);
        matches.push(candidate);
      }
    }
  };

  for (const rule of RULES) {
    addCandidates(rule.match(input));
  }
  for (const pattern of customPatterns) {
    addCandidates(collect(input, pattern, 'custom'));
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  return matches;
}

/**
 * 对单个命中片段应用掩码策略。
 * partial：邮箱保留本地名首字符与域名；其他串保留首尾字符，中间掩码。
 * full：全部替换为等长掩码字符。
 *
 * @param text - 命中原文
 * @param strategy - 掩码策略
 * @param maskChar - 掩码字符（取首字符）
 * @param category - 命中类别（仅 email 使用邮箱专用保留规则）
 * @returns 脱敏文本
 */
export function maskValue(
  text: string,
  strategy: MaskStrategy,
  maskChar = '*',
  category: PiiCategory = 'custom',
): string {
  const ch = maskChar.length > 0 ? maskChar.charAt(0) : '*';
  if (strategy === 'full') {
    return ch.repeat(text.length);
  }

  const atIndex = category === 'email' ? text.indexOf('@') : -1;
  if (atIndex > 0) {
    const local = text.slice(0, atIndex);
    const domain = text.slice(atIndex);
    if (local.length <= 1) {
      return `${ch}${domain}`;
    }
    return `${local.charAt(0)}${ch.repeat(local.length - 1)}${domain}`;
  }

  if (text.length <= 2) {
    return ch.repeat(text.length);
  }
  if (text.length <= 4) {
    return `${text.charAt(0)}${ch.repeat(text.length - 2)}${text.charAt(text.length - 1)}`;
  }
  const keepHead = Math.min(3, Math.floor(text.length / 4));
  const keepTail = Math.min(4, Math.floor(text.length / 4));
  const head = text.slice(0, keepHead);
  const tail = text.slice(text.length - keepTail);
  const middleLength = text.length - keepHead - keepTail;
  return `${head}${ch.repeat(Math.max(middleLength, 1))}${tail}`;
}

/**
 * 对整段文本执行脱敏。
 *
 * @param input - 原始文本
 * @param strategy - 掩码策略，partial 保留首尾 / full 整体替换
 * @param maskChar - 掩码字符
 * @param enabled - 启用的类别集合，缺省全部启用
 * @param customPatterns - 用户自定义正则集合
 * @returns 脱敏结果（输出文本、计数、明细）
 */
export function maskPii(
  input: string,
  strategy: MaskStrategy = 'partial',
  maskChar = '*',
  enabled?: Partial<Record<PiiCategory, boolean>>,
  customPatterns: RegExp[] = [],
): MaskResult {
  const counts = createEmptyCounts();
  const hits: MaskHit[] = [];

  if (input.length === 0) {
    return { output: '', counts, total: 0, hits: [] };
  }

  const matches = findPii(input, customPatterns).filter(
    (match) => enabled?.[match.category] !== false,
  );

  let output = '';
  let cursor = 0;
  for (const match of matches) {
    output += input.slice(cursor, match.start);
    const masked = maskValue(match.text, strategy, maskChar, match.category);
    output += masked;
    cursor = match.end;
    counts[match.category] += 1;
    hits.push({ category: match.category, original: match.text, masked });
  }
  output += input.slice(cursor);

  return { output, counts, total: hits.length, hits };
}
