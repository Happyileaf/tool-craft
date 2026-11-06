/**
 * 用浏览器原生 RegExp 实时验证速查条目，保证展示的匹配结果来自
 * 运行时行为而非静态文案；同时提供条目搜索与分类过滤。
 */
import {
  CATEGORY_LABELS,
  REGEX_ENTRIES,
  type RegexCategory,
  type RegexEntry,
} from './regex-data';

/** 单个样例的实测结果 */
export interface SampleCheck {
  text: string;
  /** 原生 RegExp 是否命中 */
  matched: boolean;
  /** 命中时的具体匹配文本（可能为空字符串的零宽匹配也保留） */
  matchText: string | null;
}

/** 条目验证结果 */
export interface VerifiedEntry {
  entry: RegexEntry;
  /** 构造正则是否成功（语法非法时为 false） */
  constructible: boolean;
  /** 构造或运行时错误信息 */
  error: string | null;
  matchChecks: SampleCheck[];
  rejectChecks: SampleCheck[];
  /** 所有匹配样例命中、所有不匹配样例均未命中 */
  allExpectationsMet: boolean;
}

/**
 * 构造原生 RegExp 并测试单个样例。
 *
 * @param entry - 语法条目
 * @param text - 样例字符串
 * @returns 检查结果
 */
function testSample(entry: RegexEntry, text: string): SampleCheck {
  try {
    const regex = new RegExp(entry.pattern, entry.flags ?? '');
    const found = text.match(regex);
    return {
      text,
      matched: found !== null,
      matchText: found ? found[0] : null,
    };
  } catch {
    return { text, matched: false, matchText: null };
  }
}

/**
 * 验证全部条目：逐条构造 RegExp 并对匹配 / 不匹配样例实测。
 *
 * @returns 带实测结果的条目数组
 */
export function verifyAllEntries(): VerifiedEntry[] {
  return REGEX_ENTRIES.map((entry) => {
    let constructible = true;
    let error: string | null = null;
    try {
      // 先显式构造一次以暴露语法错误
      new RegExp(entry.pattern, entry.flags ?? '');
    } catch (err) {
      constructible = false;
      error = err instanceof Error ? err.message : String(err);
    }
    const matchChecks = entry.matchSamples.map((text) => testSample(entry, text));
    const rejectChecks = entry.rejectSamples.map((text) => testSample(entry, text));
    const allExpectationsMet =
      constructible &&
      matchChecks.every((item) => item.matched) &&
      rejectChecks.every((item) => !item.matched);
    return { entry, constructible, error, matchChecks, rejectChecks, allExpectationsMet };
  });
}

/**
 * 按关键字过滤条目（名称、语法、关键字字段、描述均参与匹配）。
 *
 * @param keyword - 搜索词
 * @param category - 可选分类限定
 * @returns 命中的原始条目
 */
export function filterEntries(keyword: string, category?: RegexCategory | 'all'): RegexEntry[] {
  const lower = keyword.trim().toLowerCase();
  return REGEX_ENTRIES.filter((entry) => {
    if (category && category !== 'all' && entry.category !== category) {
      return false;
    }
    if (!lower) {
      return true;
    }
    const haystack = [
      entry.name,
      entry.syntax,
      entry.description,
      ...entry.keywords,
      CATEGORY_LABELS[entry.category],
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(lower);
  });
}

/**
 * 统计数据：供页面顶部展示覆盖度。
 *
 * @returns 分类数与条目数
 */
export function getCoverageStats(): { categories: number; entries: number } {
  return {
    categories: new Set(REGEX_ENTRIES.map((entry) => entry.category)).size,
    entries: REGEX_ENTRIES.length,
  };
}
