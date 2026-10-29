/**
 * 文本模式批量提取：按选定的内置模式与一条自定义正则，
 * 从文本中批量提取匹配项，输出按模式分组、组内去重并计数的结果。
 *
 * 全部为不依赖 DOM 的纯函数，便于单测。
 */

import { PATTERN_MAP } from './patterns';

/** 单个去重匹配项 */
export interface MatchItem {
  /** 匹配字面值 */
  value: string;
  /** 出现次数（未去重前） */
  count: number;
}

/** 一个模式的提取结果 */
export interface PatternResult {
  /** 模式标识；自定义模式固定为 'custom' */
  key: string;
  /** 模式展示名 */
  label: string;
  /** 去重后的匹配项，保持首次出现顺序 */
  items: MatchItem[];
  /** 该模式命中总次数（含重复） */
  total: number;
  /** 自定义正则语法错误信息；正常时为 null */
  error: string | null;
}

/** 自定义正则入参 */
export interface CustomPattern {
  /** 自定义模式展示名（可空，缺省为「自定义」） */
  name: string;
  /** 正则源码（不含两侧斜杠） */
  source: string;
  /** 是否忽略大小写 */
  ignoreCase?: boolean;
}

/** 完整提取结果 */
export interface ExtractionResult {
  /** 各模式结果（按选择顺序，自定义置末） */
  groups: PatternResult[];
  /** 去重后匹配项总数 */
  uniqueCount: number;
  /** 命中总次数（含重复） */
  totalCount: number;
}

/**
 * 用一个全局正则从文本中提取全部匹配并去重计数。
 *
 * @param text - 待扫描文本
 * @param regex - 必须带 g 标志的正则
 * @returns 去重后的匹配项（保持首次出现顺序）与总命中数
 */
export function collectMatches(
  text: string,
  regex: RegExp,
): { items: MatchItem[]; total: number } {
  const order: string[] = [];
  const counts = new Map<string, number>();
  let total = 0;

  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = globalRegex.exec(text)) !== null) {
    const value = match[0];
    total += 1;
    if (!counts.has(value)) {
      order.push(value);
      counts.set(value, 1);
    } else {
      counts.set(value, (counts.get(value) as number) + 1);
    }
    // 防止零宽匹配导致死循环
    if (match.index === globalRegex.lastIndex) {
      globalRegex.lastIndex += 1;
    }
  }

  return {
    items: order.map((value) => ({ value, count: counts.get(value) as number })),
    total,
  };
}

/**
 * 按选定模式批量提取。
 *
 * @param text - 待扫描文本
 * @param patternKeys - 启用的内置模式 key 列表
 * @param custom - 可选的自定义正则
 * @returns 分组提取结果与汇总计数
 */
export function extractPatterns(
  text: string,
  patternKeys: string[],
  custom?: CustomPattern | null,
): ExtractionResult {
  const groups: PatternResult[] = [];

  for (const key of patternKeys) {
    const def = PATTERN_MAP[key];
    if (!def) {
      continue;
    }
    const { items, total } = collectMatches(text, def.regex);
    groups.push({ key, label: def.label, items, total, error: null });
  }

  if (custom && custom.source.trim() !== '') {
    try {
      const flags = custom.ignoreCase ? 'gi' : 'g';
      const regex = new RegExp(custom.source, flags);
      const { items, total } = collectMatches(text, regex);
      groups.push({
        key: 'custom',
        label: custom.name.trim() || '自定义',
        items,
        total,
        error: null,
      });
    } catch (error) {
      groups.push({
        key: 'custom',
        label: custom.name.trim() || '自定义',
        items: [],
        total: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    groups,
    uniqueCount: groups.reduce((sum, group) => sum + group.items.length, 0),
    totalCount: groups.reduce((sum, group) => sum + group.total, 0),
  };
}

/**
 * 把提取结果渲染为可复制的纯文本。
 *
 * @param result - 提取结果
 * @returns 分组的多行文本
 */
export function resultToText(result: ExtractionResult): string {
  const lines: string[] = [];
  for (const group of result.groups) {
    lines.push(`# ${group.label}（${group.items.length} 项 / ${group.total} 次）`);
    if (group.error) {
      lines.push(`  正则错误：${group.error}`);
    } else if (group.items.length === 0) {
      lines.push('  （无匹配）');
    } else {
      for (const item of group.items) {
        lines.push(`  ${item.value}\t×${item.count}`);
      }
    }
    lines.push('');
  }
  lines.push(`合计：去重 ${result.uniqueCount} 项，命中 ${result.totalCount} 次`);
  return lines.join('\n');
}
