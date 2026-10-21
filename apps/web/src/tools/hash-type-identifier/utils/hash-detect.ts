/**
 * 哈希类型识别纯函数集合，不依赖 DOM 与 React；
 * 依据 crypt(3) 前缀结构与十六进制长度推断候选算法，
 * 输出候选数组（含置信度与说明），而非单一武断结论
 */

/** 候选置信度 */
export enum HashConfidenceEnum {
  /** 高：结构或长度特征明确 */
  HIGH = 'high',
  /** 中：结构匹配但参数异常 */
  MEDIUM = 'medium',
  /** 低：长度重合，仅凭摘要无法区分 */
  LOW = 'low',
}

/** 单个候选算法 */
export interface HashCandidate {
  /** 算法名称 */
  name: string;
  /** 置信度 */
  confidence: HashConfidenceEnum;
  /** 判定依据或歧义说明 */
  note: string;
}

/** bcrypt 合法 cost 范围 */
export const BCRYPT_MIN_COST = 4;
export const BCRYPT_MAX_COST = 31;

const CRYPT_B64 = '[./A-Za-z0-9]';

/** crypt(3) 前缀识别规则，按优先级排列 */
const CRYPT_RULES: Array<{
  name: string;
  pattern: RegExp;
  describe: (match: RegExpMatchArray) => { confidence: HashConfidenceEnum; note: string };
}> = [
  {
    name: 'Apache MD5 crypt（apr1）',
    pattern: new RegExp(`^\\$apr1\\$[./A-Za-z0-9]{1,8}\\$${CRYPT_B64}{22}$`),
    describe: () => ({
      confidence: HashConfidenceEnum.HIGH,
      note: '以 $apr1$ 开头，是 Apache apr1 变体的 MD5 crypt 格式。',
    }),
  },
  {
    name: 'MD5 crypt',
    pattern: new RegExp(`^\\$1\\$[./A-Za-z0-9]{1,8}\\$${CRYPT_B64}{22}$`),
    describe: () => ({
      confidence: HashConfidenceEnum.HIGH,
      note: '以 $1$ 开头，符合 crypt(3) MD5 加盐哈希结构。',
    }),
  },
  {
    name: 'SHA-256 crypt',
    pattern: new RegExp(`^\\$5\\$(rounds=\\d+\\$)?[./A-Za-z0-9]{1,16}\\$${CRYPT_B64}{43}$`),
    describe: (match) => ({
      confidence: HashConfidenceEnum.HIGH,
      note: match[1]
        ? `以 $5$ 开头并带 ${match[1].slice(0, -1)} 参数，是带迭代轮数的 SHA-256 crypt。`
        : '以 $5$ 开头，符合 SHA-256 crypt 加盐结构。',
    }),
  },
  {
    name: 'SHA-512 crypt',
    pattern: new RegExp(`^\\$6\\$(rounds=\\d+\\$)?[./A-Za-z0-9]{1,16}\\$${CRYPT_B64}{86}$`),
    describe: (match) => ({
      confidence: HashConfidenceEnum.HIGH,
      note: match[1]
        ? `以 $6$ 开头并带 ${match[1].slice(0, -1)} 参数，是带迭代轮数的 SHA-512 crypt。`
        : '以 $6$ 开头，符合 SHA-512 crypt 加盐结构。',
    }),
  },
  {
    name: 'bcrypt',
    pattern: new RegExp(`^\\$2[aby]\\$(\\d{2})\\$${CRYPT_B64}{53}$`),
    describe: (match) => {
      const cost = Number(match[1]);
      if (cost >= BCRYPT_MIN_COST && cost <= BCRYPT_MAX_COST) {
        return {
          confidence: HashConfidenceEnum.HIGH,
          note: `以 $2${match[0][2]}$ 开头，cost=${cost}，符合标准 bcrypt 结构。`,
        };
      }
      return {
        confidence: HashConfidenceEnum.MEDIUM,
        note: `以 $2 变体开头但 cost=${cost} 超出常见范围（${BCRYPT_MIN_COST}–${BCRYPT_MAX_COST}），疑似非标准 bcrypt。`,
      };
    },
  },
];

/** 纯十六进制长度识别规则 */
const HEX_LENGTH_RULES: Record<
  number,
  Array<{ name: string; confidence: HashConfidenceEnum; note: string }>
> = {
  8: [
    {
      name: 'CRC32',
      confidence: HashConfidenceEnum.LOW,
      note: '8 位十六进制常见于 CRC32 校验值，但也可能是更长哈希的截断片段，无法仅凭长度确认。',
    },
  ],
  32: [
    {
      name: 'MD5',
      confidence: HashConfidenceEnum.HIGH,
      note: '32 位十六进制是 MD5 摘要的标准长度。',
    },
    {
      name: 'NTLM',
      confidence: HashConfidenceEnum.LOW,
      note: 'NTLM（MD4）摘要同为 32 位，仅凭长度无法与 MD5 区分。',
    },
    {
      name: 'MD4',
      confidence: HashConfidenceEnum.LOW,
      note: 'MD4 摘要同为 32 位，仅凭长度无法与 MD5 区分。',
    },
  ],
  40: [
    {
      name: 'SHA-1',
      confidence: HashConfidenceEnum.HIGH,
      note: '40 位十六进制是 SHA-1 摘要的标准长度。',
    },
  ],
  56: [
    {
      name: 'SHA-224',
      confidence: HashConfidenceEnum.HIGH,
      note: '56 位十六进制是 SHA-224 摘要的标准长度。',
    },
  ],
  64: [
    {
      name: 'SHA-256',
      confidence: HashConfidenceEnum.HIGH,
      note: '64 位十六进制是 SHA-256 摘要的标准长度。',
    },
  ],
  96: [
    {
      name: 'SHA-384',
      confidence: HashConfidenceEnum.HIGH,
      note: '96 位十六进制是 SHA-384 摘要的标准长度。',
    },
  ],
  128: [
    {
      name: 'SHA-512',
      confidence: HashConfidenceEnum.HIGH,
      note: '128 位十六进制是 SHA-512 摘要的标准长度。',
    },
  ],
};

const CONFIDENCE_ORDER: Record<HashConfidenceEnum, number> = {
  [HashConfidenceEnum.HIGH]: 0,
  [HashConfidenceEnum.MEDIUM]: 1,
  [HashConfidenceEnum.LOW]: 2,
};

/**
 * 识别输入散列值可能对应的算法；
 * crypt(3) 前缀优先判定，其次按纯十六进制长度匹配，均不命中时返回空数组
 *
 * @param input - 原始散列文本（自动去除首尾空白、不区分大小写）
 * @returns 按置信度降序排列的候选算法列表
 */
export function detectHash(input: string): HashCandidate[] {
  if (input == null) {
    return [];
  }
  const normalized = input.trim();
  if (normalized === '') {
    return [];
  }

  for (const rule of CRYPT_RULES) {
    const match = normalized.match(rule.pattern);
    if (match) {
      const detail = rule.describe(match);
      return [{ name: rule.name, ...detail }];
    }
  }

  const lower = normalized.toLowerCase();
  if (/^[0-9a-f]+$/.test(lower)) {
    const rules = HEX_LENGTH_RULES[lower.length];
    if (rules) {
      return rules
        .map((rule) => ({ ...rule }))
        .sort(
          (a, b) =>
            CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence],
        );
    }
  }

  return [];
}
