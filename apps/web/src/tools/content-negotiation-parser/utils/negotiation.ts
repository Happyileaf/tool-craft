/**
 * HTTP 内容协商请求头解析与排序（零依赖纯函数）
 *
 * 依据 RFC 9110 §12.5（Content Negotiation）：
 * - Accept / Accept-Language / Accept-Encoding / Accept-Charset 的字段值均为
 *   逗号分隔的条目列表，每个条目形如 token;q=0.8;level=1；
 * - 权重参数 q（weight，又称 q 值 / q 因子）缺省为 1，合法范围 0–1，
 *   q=0 表示「明确不可接受」（仍展示但不参与首选）；
 * - 排序规则：先按 q 降序，q 相同时按「具体度（specificity）」降序，
 *   再相同则保持输入中的原始顺序（稳定排序）。
 * - 媒体范围：具体类型（text/html）最具体，子类型通配（text/*）次之，*&#47;* 最末；
 *   语言标签：按 - 分段，段数越多越具体，* 最末；
 *   内容编码与字符集：具名值最具体，* 最末。
 *
 * 非法条目（token 为空、媒体范围形状非法、q 值非法）直接忽略，不参与排序；
 * 当字段值里没有任何可用条目时以结果对象的 error 字段给出中文提示。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type HeaderKind = 'accept' | 'accept-language' | 'accept-encoding' | 'accept-charset';

/** 解析并排序后的单个协商条目 */
export interface RankedEntry {
  /** 原始条目文本（已去除首尾空白，保留原始大小写与参数） */
  raw: string;
  /** 用于比较与展示的规范化 token（Accept / Encoding / Charset 统一小写，语言标签保留原显示） */
  token: string;
  /** 权重 q 值（0–1，缺省为 1） */
  q: number;
  /** 具体度数值，越大越具体（q 之外的额外参数数量计入次级排序） */
  specificity: number;
  /** 是否被明确拒绝（q=0） */
  rejected: boolean;
  /** 中文具体度说明，如「具体类型」「语言标签 2 段」「通配 *」 */
  note: string;
}

export interface NegotiationResult {
  /** 按服务端内容协商规则排序后的全部有效条目（含 q=0 的拒绝条目） */
  entries: RankedEntry[];
  /** 首选表示：排序后第一个 q>0 的条目；无可用条目时为 null */
  preferred: RankedEntry | null;
  /** 致命错误中文提示（字段为空串时为 null；全部条目非法时给出提示） */
  error: string | null;
}

/** 排序用中间结构，附带原始下标与额外参数数量 */
interface ParsedItem {
  raw: string;
  token: string;
  q: number;
  specificity: number;
  extraParams: number;
  index: number;
}

/** q 值词法：整数 0/1 或 0.xxx（允许任意位小数），拒绝科学计数法与多余空白 */
const Q_VALUE_RE = /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/;

/** 解析 q 参数值；非法（非数字、>1、<0、词法不合法）时返回 null */
function parseQ(raw: string): number | null {
  const v = raw.trim();
  if (!Q_VALUE_RE.test(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1) return null;
  return n;
}

/**
 * 计算 Accept 媒体范围的具体度与规范化 token。
 * 仅接受 type/subtype、type/*、*&#47;* 三种形状（如 *&#47;xml 非法忽略）。
 */
function acceptSpecificity(rawToken: string): { token: string; specificity: number } | null {
  const slash = rawToken.indexOf('/');
  if (slash <= 0 || slash !== rawToken.lastIndexOf('/')) return null;
  const type = rawToken.slice(0, slash).trim();
  const subtype = rawToken.slice(slash + 1).trim();
  if (!type || !subtype) return null;
  if (type === '*') {
    if (subtype !== '*') return null;
    return { token: '*/*', specificity: 0 };
  }
  const token = `${type.toLowerCase()}/${subtype.toLowerCase()}`;
  return { token, specificity: subtype === '*' ? 1 : 2 };
}

/** Accept-Language：按 - 分段，段数越多越具体，* 最末；比较不区分大小写、显示保留原样 */
function languageSpecificity(rawToken: string): { token: string; specificity: number } | null {
  if (rawToken.includes(' ')) return null;
  if (rawToken === '*') return { token: '*', specificity: 0 };
  const segments = rawToken.split('-').filter((s) => s !== '');
  if (segments.length === 0) return null;
  return { token: rawToken, specificity: segments.length };
}

/** Accept-Encoding / Accept-Charset：具名值最具体，* 最末；比较统一小写 */
function namedWildcardSpecificity(rawToken: string): {
  token: string;
  specificity: number;
} | null {
  if (rawToken.includes(' ')) return null;
  if (rawToken === '*') return { token: '*', specificity: 0 };
  if (!rawToken) return null;
  return { token: rawToken.toLowerCase(), specificity: 1 };
}

function describeNote(kind: HeaderKind, specificity: number, extraParams: number): string {
  if (kind === 'accept') {
    if (specificity === 2) return '具体类型';
    if (specificity === 1) return '子类型通配 type/*';
    return '类型通配 */*';
  }
  if (kind === 'accept-language') {
    return specificity === 0 ? '通配 *' : `语言标签 ${specificity} 段`;
  }
  const base = specificity === 0 ? '通配 *' : '具名值';
  return extraParams > 0 ? `${base}（额外参数 ${extraParams} 个）` : base;
}

/**
 * 解析内容协商请求头并按 RFC 9110 §12.5 排序。
 *
 * @param kind - 头类型
 * @param raw - 原始头字段值
 * @returns 排序条目、首选表示与错误提示；本函数不抛异常
 */
export function parseNegotiationHeader(kind: HeaderKind, raw: string): NegotiationResult {
  if (raw === '') {
    return { entries: [], preferred: null, error: null };
  }

  const items: ParsedItem[] = [];
  let skipped = 0;

  raw.split(',').forEach((segment, index) => {
    const part = segment.trim();
    if (part === '') {
      skipped += 1;
      return;
    }

    const pieces = part.split(';').map((p) => p.trim());
    const rawToken = pieces[0] ?? '';
    if (rawToken === '') {
      skipped += 1;
      return;
    }

    let q = 1;
    let qSeen = false;
    let extraParams = 0;
    for (const param of pieces.slice(1)) {
      if (param === '') continue;
      const eq = param.indexOf('=');
      const key = (eq === -1 ? param : param.slice(0, eq)).trim().toLowerCase();
      const value = eq === -1 ? '' : param.slice(eq + 1).trim();
      if (key === 'q') {
        if (qSeen) continue;
        qSeen = true;
        const parsed = parseQ(value);
        if (parsed === null) {
          // q 非法（非数字、>1、<0）：整个条目忽略，不参与排序
          skipped += 1;
          return;
        }
        q = parsed;
      } else if (key !== '') {
        // q 之外的参数（如 level）保留并作为同具体度下的加分依据
        extraParams += 1;
      }
    }

    const spec =
      kind === 'accept'
        ? acceptSpecificity(rawToken)
        : kind === 'accept-language'
          ? languageSpecificity(rawToken)
          : namedWildcardSpecificity(rawToken);
    if (!spec) {
      skipped += 1;
      return;
    }

    items.push({
      raw: part,
      token: spec.token,
      q,
      specificity: spec.specificity,
      extraParams,
      index,
    });
  });

  if (items.length === 0) {
    const hints: Record<HeaderKind, string> = {
      accept: '未解析出任何合法的 Accept 条目，请检查媒体范围（如 text/html、*/*）与 q 值（0–1）',
      'accept-language':
        '未解析出任何合法的 Accept-Language 条目，请检查语言标签（如 zh-CN、en）与 q 值（0–1）',
      'accept-encoding':
        '未解析出任何合法的 Accept-Encoding 条目，请检查编码名（如 gzip、br）与 q 值（0–1）',
      'accept-charset':
        '未解析出任何合法的 Accept-Charset 条目，请检查字符集名（如 utf-8）与 q 值（0–1）',
    };
    return { entries: [], preferred: null, error: `${hints[kind]}（已忽略 ${skipped} 个非法条目）` };
  }

  // 稳定排序：q 降序 → 具体度降序 → 额外参数数量降序 → 原始顺序
  const sorted = [...items].sort((a, b) => {
    if (b.q !== a.q) return b.q - a.q;
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    if (b.extraParams !== a.extraParams) return b.extraParams - a.extraParams;
    return a.index - b.index;
  });

  const entries: RankedEntry[] = sorted.map((item) => ({
    raw: item.raw,
    token: item.token,
    q: item.q,
    specificity: item.specificity,
    rejected: item.q === 0,
    note: describeNote(kind, item.specificity, item.extraParams),
  }));

  const preferred = entries.find((e) => e.q > 0) ?? null;
  // 非法条目一律静默忽略；只要存在有效条目即不算致命错误
  return { entries, preferred, error: null };
}
