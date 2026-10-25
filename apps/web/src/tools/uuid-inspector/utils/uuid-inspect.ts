/**
 * UUID（RFC 4122 / RFC 9562）解析与校验纯函数实现，不依赖 DOM 与 React。
 * 支持版本（v1–v8、nil、max）、变体识别，并对时间型 UUID（v1/v2/v6/v7）提取时间戳与节点信息。
 */

/** UUID 变体类型 */
export type UuidVariant = 'rfc4122' | 'ncs' | 'microsoft' | 'reserved';

/** 单个 UUID 的解析结果 */
export interface UuidInfo {
  /** 原始输入片段 */
  input: string;
  /** 规范化（小写、带连字符）形式；格式非法时为 null */
  canonical: string | null;
  /** 是否为格式合法的 UUID */
  valid: boolean;
  /** 不合法时的错误说明 */
  error: string | null;
  /** 版本号（1–8），nil/max 为对应字符串，无法解析为 null */
  version: number | 'nil' | 'max' | null;
  /** 面向用户的版本标签 */
  versionLabel: string;
  /** 变体；无法解析为 null */
  variant: UuidVariant | null;
  /** 面向用户的变体标签 */
  variantLabel: string;
  /** 时间型 UUID 的时间戳（ISO 8601 字符串）；不适用时为 null */
  timestamp: string | null;
  /** 时间戳附加说明（如 v2 为近似值） */
  timestampNote: string | null;
  /** v1/v2 节点（MAC 风格 aa:bb:cc:dd:ee:ff）；不适用时为 null */
  node: string | null;
  /** v1/v2 时钟序列（十进制）；不适用时为 null */
  clockSeq: number | null;
  /** 非致命问题（如变体位与 RFC 4122 不符） */
  warnings: string[];
  /** 在批量输入中是否重复出现（按规范化形式去重） */
  isDuplicate: boolean;
}

/** 批量解析汇总 */
export interface BatchSummary {
  /** 识别到的片段总数 */
  total: number;
  /** 合法 UUID 数 */
  valid: number;
  /** 非法片段数 */
  invalid: number;
  /** 去重后合法 UUID 数 */
  unique: number;
  /** 重复的合法 UUID 数（超出首次出现的次数） */
  duplicate: number;
}

/** 批量解析结果 */
export interface BatchResult {
  /** 逐片段解析结果（保留输入顺序） */
  items: UuidInfo[];
  /** 汇总统计 */
  summary: BatchSummary;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** UUID 纪元（1582-10-15 00:00:00 UTC）与 Unix 纪元之间的毫秒差 */
const UUID_EPOCH_OFFSET_MS = 12219292800000;

/**
 * 规范化单个输入片段：去空白、去 urn:uuid: 前缀与花括号、转小写
 *
 * @param raw - 原始片段
 * @returns 规范化后的字符串
 */
function normalizeToken(raw: string): string {
  let token = raw.trim().toLowerCase();
  if (token.startsWith('urn:uuid:')) {
    token = token.slice('urn:uuid:'.length);
  }
  if (token.startsWith('{') && token.endsWith('}')) {
    token = token.slice(1, -1);
  }
  return token;
}

/**
 * 把 100ns 计数的 UUID 60 位时间戳精确换算为 Unix 毫秒。
 * ticks = high * 2^highShift + low，直接用 Number 合并 60 位会超过
 * MAX_SAFE_INTEGER 丢失精度，因此按模 10000 拆分取整与余数，
 * 全程数值均在安全整数范围内。
 *
 * @param high - 高位部分
 * @param low - 低位部分
 * @param highShift - 高位部分的左移位数（v1/v2 为 32，v6 为 28）
 * @returns Unix 纪元毫秒数
 */
function uuidTicksToUnixMs(high: number, low: number, highShift: number): number {
  const TICKS_PER_MS = 10000;
  const shiftBase = 2 ** highShift;
  const fullMs = Math.floor(shiftBase / TICKS_PER_MS);
  const remainderUnit = shiftBase % TICKS_PER_MS;
  const highMs = high * fullMs;
  const lowMs = Math.floor((high * remainderUnit + low) / TICKS_PER_MS);
  return highMs + lowMs - UUID_EPOCH_OFFSET_MS;
}

/**
 * 把 100ns 计数的 UUID 时间戳换算为 ISO 字符串
 *
 * @param unixMs - Unix 纪元毫秒数
 * @returns ISO 8601 时间
 */
function formatUuidTimestamp(unixMs: number): string {
  return new Date(unixMs).toISOString();
}

const VERSION_LABELS: Record<number, string> = {
  1: 'v1（基于时间）',
  2: 'v2（DCE 安全版本，含本地标识符）',
  3: 'v3（基于命名空间，MD5）',
  4: 'v4（随机）',
  5: 'v5（基于命名空间，SHA-1）',
  6: 'v6（重排时间戳，RFC 9562）',
  7: 'v7（Unix 毫秒时间戳，RFC 9562）',
  8: 'v8（厂商自定义，RFC 9562）',
};

const VARIANT_LABELS: Record<UuidVariant, string> = {
  rfc4122: 'RFC 4122（10xx）',
  ncs: 'NCS 遗留（0xxx）',
  microsoft: 'Microsoft（110x）',
  reserved: '保留（111x）',
};

/**
 * 解析并校验单个 UUID 字符串
 *
 * @param raw - UUID 文本，兼容 urn:uuid: 前缀与花括号
 * @returns 解析结果
 */
export function inspectUuid(raw: string): UuidInfo {
  const base: UuidInfo = {
    input: raw,
    canonical: null,
    valid: false,
    error: null,
    version: null,
    versionLabel: '未知',
    variant: null,
    variantLabel: '未知',
    timestamp: null,
    timestampNote: null,
    node: null,
    clockSeq: null,
    warnings: [],
    isDuplicate: false,
  };

  const token = normalizeToken(raw);
  if (token === '') {
    return { ...base, error: '空输入' };
  }

  if (!UUID_PATTERN.test(token)) {
    return {
      ...base,
      error: '不是合法的 UUID 格式，应为 8-4-4-4-12 的十六进制形式（如 550e8400-e29b-41d4-a716-446655440000）',
    };
  }

  const hex = token.replace(/-/g, '');
  const groups = token.split('-');
  const timeLow = parseInt(groups[0] ?? '', 16);
  const timeMid = parseInt(groups[1] ?? '', 16);
  const timeHiAndVersion = parseInt(groups[2] ?? '', 16);
  const clockSeqHi = parseInt((groups[3] ?? '').slice(0, 2), 16);
  const clockSeqLow = parseInt((groups[3] ?? '').slice(2, 4), 16);
  const versionNibble = (timeHiAndVersion >>> 12) & 0xf;
  const nodeHex = groups[4] ?? '';

  let version: number | 'nil' | 'max';
  let versionLabel: string;
  if (/^0+$/.test(hex)) {
    version = 'nil';
    versionLabel = 'nil（全零特殊 UUID）';
  } else if (/^f+$/.test(hex)) {
    version = 'max';
    versionLabel = 'max（全 f 特殊 UUID）';
  } else if (versionNibble >= 1 && versionNibble <= 8) {
    version = versionNibble;
    versionLabel = VERSION_LABELS[versionNibble] ?? `v${versionNibble}`;
  } else {
    version = versionNibble;
    versionLabel = `保留/未知版本（版本字段为 ${versionNibble}）`;
  }

  // 变体由第 9 字节（clock_seq_hi）的最高位决定
  let variant: UuidVariant;
  if ((clockSeqHi & 0x80) === 0) {
    variant = 'ncs';
  } else if ((clockSeqHi & 0xc0) === 0x80) {
    variant = 'rfc4122';
  } else if ((clockSeqHi & 0xe0) === 0xc0) {
    variant = 'microsoft';
  } else {
    variant = 'reserved';
  }

  const warnings: string[] = [];
  if (typeof version === 'number' && version >= 1 && version <= 8 && variant !== 'rfc4122') {
    warnings.push(`版本字段为 v${version}，但变体位不是 RFC 4122（实际：${VARIANT_LABELS[variant]}）`);
  }
  if (typeof version === 'number' && (version === 0 || version > 8)) {
    warnings.push(`版本字段 ${version} 为保留值，RFC 9562 仅定义 v1–v8`);
  }

  let timestamp: string | null = null;
  let timestampNote: string | null = null;
  if (version === 1) {
    const high = (timeHiAndVersion & 0x0fff) * 0x10000 + timeMid;
    timestamp = formatUuidTimestamp(uuidTicksToUnixMs(high, timeLow >>> 0, 32));
  } else if (version === 2) {
    // v2 的 time_low 被本地标识符替换，只能用高 28 位还原，低 32 位补零
    const high = (timeHiAndVersion & 0x0fff) * 0x10000 + timeMid;
    timestamp = formatUuidTimestamp(uuidTicksToUnixMs(high, 0, 32));
    timestampNote = 'v2 的低 32 位时间字段被本地标识符替换，时间为近似值（精度约 429.5 秒）';
  } else if (version === 6) {
    // RFC 9562 §5.6：g1=ticks[59:28]，g2=ticks[27:12]，g3 低 12 位=ticks[11:0]
    const high = timeLow >>> 0;
    const low = timeMid * 0x1000 + (timeHiAndVersion & 0x0fff);
    timestamp = formatUuidTimestamp(uuidTicksToUnixMs(high, low, 28));
  } else if (version === 7) {
    const unixMs = (timeLow >>> 0) * 0x10000 + timeMid;
    timestamp = new Date(unixMs).toISOString();
  }

  let node: string | null = null;
  let clockSeq: number | null = null;
  if (version === 1 || version === 2) {
    node = (nodeHex.match(/.{2}/g) ?? []).join(':');
    clockSeq = ((clockSeqHi & 0x3f) << 8) | clockSeqLow;
  }

  return {
    ...base,
    canonical: token,
    valid: true,
    error: null,
    version,
    versionLabel,
    variant,
    variantLabel: VARIANT_LABELS[variant],
    timestamp,
    timestampNote,
    node,
    clockSeq,
    warnings,
  };
}

/**
 * 批量解析 UUID（按空白、逗号、分号分隔），统计合法/非法/去重/重复数量
 *
 * @param input - 可含多个 UUID 的文本
 * @returns 逐条结果与汇总
 */
export function inspectBatch(input: string): BatchResult {
  const tokens = input
    .split(/[\s,;，；]+/)
    .map((token) => token.trim())
    .filter((token) => token !== '');

  const items = tokens.map((token) => inspectUuid(token));
  const seen = new Map<string, number>();
  for (const item of items) {
    if (item.canonical !== null) {
      seen.set(item.canonical, (seen.get(item.canonical) ?? 0) + 1);
    }
  }

  let duplicate = 0;
  for (const item of items) {
    if (item.canonical !== null && (seen.get(item.canonical) ?? 0) > 1) {
      item.isDuplicate = true;
      duplicate += 1;
    }
  }

  const valid = items.filter((item) => item.valid).length;
  const summary: BatchSummary = {
    total: items.length,
    valid,
    invalid: items.length - valid,
    unique: seen.size,
    duplicate,
  };

  return { items, summary };
}
