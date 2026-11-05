/**
 * 正则语法参考的运行时验证与检索：用浏览器原生 RegExp 实测每条示例，
 * 保证文档展示的匹配结果来自真实运行而非静态文本。全部为确定性纯函数。
 */
import {
  REGEX_CATEGORIES,
  REGEX_ENTRIES,
  type RegexCategoryId,
  type RegexSyntaxEntry,
} from './regexSyntaxData';

/** 单条样例的实测结果 */
export interface ExampleCheck {
  /** 原始样例文本 */
  text: string;
  /** 期望是否命中 */
  expectedMatch: boolean;
  /** 原生 RegExp 实测是否命中 */
  actualMatch: boolean;
  /** 实测与期望是否一致 */
  consistent: boolean;
  /** 命中时的匹配片段（未命中为 null） */
  matchedText: string | null;
}

/** 单条目运行时验证结果 */
export interface EntryValidation {
  entry: RegexSyntaxEntry;
  /** 正则能否成功构造 */
  constructable: boolean;
  /** 构造或运行错误信息 */
  error: string | null;
  /** 全部样例的实测结果 */
  checks: ExampleCheck[];
  /** 所有样例是否与文档预期一致 */
  allConsistent: boolean;
}

/**
 * 用原生 RegExp 验证单条语法条目的全部样例。
 *
 * @param entry - 语法条目
 * @returns 运行时验证结果；正则非法时 constructable=false，不抛异常
 */
export function validateEntry(entry: RegexSyntaxEntry): EntryValidation {
  // 先尝试构造，非法正则直接返回 constructable=false，不抛异常
  try {
    new RegExp(entry.pattern, entry.flags);
  } catch (error) {
    return {
      entry,
      constructable: false,
      error: error instanceof Error ? error.message : String(error),
      checks: [],
      allConsistent: false,
    };
  }

  const run = (text: string, expectedMatch: boolean): ExampleCheck => {
    // 每个样例新建实例隔离，避免 g / y 标志的 lastIndex 在样例间串扰
    const isolated = new RegExp(entry.pattern, entry.flags);
    const found = text.match(isolated);
    const actualMatch = found !== null;
    return {
      text,
      expectedMatch,
      actualMatch,
      consistent: actualMatch === expectedMatch,
      matchedText: actualMatch && found ? found[0] : null,
    };
  };

  const checks = [
    ...entry.matchExamples.map((text) => run(text, true)),
    ...entry.notMatchExamples.map((text) => run(text, false)),
  ];

  return {
    entry,
    constructable: true,
    error: null,
    checks,
    allConsistent: checks.every((check) => check.consistent),
  };
}

/** 验证全部条目，返回与条目顺序一致的结果 */
export function validateAllEntries(): EntryValidation[] {
  return REGEX_ENTRIES.map(validateEntry);
}

/**
 * 按关键字过滤语法条目（名称、英文名、语法符号、解释、关键字均可命中）。
 *
 * @param keyword - 搜索词，不区分大小写
 * @returns 命中的条目
 */
export function filterEntries(keyword: string): RegexSyntaxEntry[] {
  const key = (keyword ?? '').trim().toLowerCase();
  if (!key) {
    return REGEX_ENTRIES;
  }
  return REGEX_ENTRIES.filter((entry) => {
    const haystack = [
      entry.name,
      entry.nameEn,
      entry.syntax,
      entry.explanation,
      entry.id,
      ...entry.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(key);
  });
}

/** 按分类分组条目，保持 REGEX_CATEGORIES 的分类顺序 */
export function groupByCategory(
  entries: RegexSyntaxEntry[],
): { category: (typeof REGEX_CATEGORIES)[number]; entries: RegexSyntaxEntry[] }[] {
  return REGEX_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === (category.id as RegexCategoryId)),
  })).filter((group) => group.entries.length > 0);
}

/** 标志位条目单独取出，保证 g i m s u y 完整列出 */
export function getFlagEntries(): RegexSyntaxEntry[] {
  return REGEX_ENTRIES.filter((entry) => entry.category === 'flag');
}
