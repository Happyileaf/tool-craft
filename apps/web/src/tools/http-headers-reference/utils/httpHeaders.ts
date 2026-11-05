/**
 * HTTP 头字段速查的纯函数：搜索、分类筛选与数据校验。
 * 不触碰 DOM、零依赖，全部为确定性纯函数。
 */
import {
  HEADER_CATEGORIES,
  HTTP_HEADERS,
  type HeaderCategoryId,
  type HeaderDirection,
  type HttpHeaderEntry,
} from './httpHeadersData';

/** 方向的中文标签 */
export const DIRECTION_LABELS: Record<HeaderDirection, string> = {
  request: '请求头',
  response: '响应头',
  both: '通用',
};

export interface HeaderFilter {
  /** 搜索关键字 */
  keyword: string;
  /** 分类筛选，null 表示全部分类 */
  category: HeaderCategoryId | null;
  /** 方向筛选，null 表示全部方向 */
  direction: HeaderDirection | null;
}

/**
 * 按名称、说明、语法、示例、标准与关键字做小写包含匹配，
 * 并与分类、方向筛选组合。
 *
 * @param filter - 筛选条件
 * @returns 命中的头字段条目
 */
export function filterHeaders(filter: HeaderFilter): HttpHeaderEntry[] {
  const keyword = (filter.keyword ?? '').trim().toLowerCase();

  return HTTP_HEADERS.filter((entry) => {
    if (filter.category && entry.category !== filter.category) {
      return false;
    }
    if (filter.direction && entry.direction !== filter.direction) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    const haystack = [
      entry.name,
      entry.summary,
      entry.syntax,
      entry.example,
      entry.spec,
      ...entry.pitfalls,
      ...entry.keywords,
      entry.forbidden ? 'forbidden 禁止修改' : '',
      entry.deprecated ? 'deprecated 废弃' : '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
}

/** 按头名称精确查找（大小写不敏感） */
export function getHeader(name: string): HttpHeaderEntry | undefined {
  const target = name.trim().toLowerCase();
  return HTTP_HEADERS.find((entry) => entry.name.toLowerCase() === target);
}

/** 统计某分类下的条目数量 */
export function countByCategory(category: HeaderCategoryId): number {
  return HTTP_HEADERS.filter((entry) => entry.category === category).length;
}

/** 获取所有被标记为 forbidden 的头名称 */
export function forbiddenHeaderNames(): string[] {
  return HTTP_HEADERS.filter((entry) => entry.forbidden).map((entry) => entry.name);
}

/**
 * 校验内置数据的完整性与一致性，返回错误信息数组（空数组表示通过）。
 * 验收要求每条都含方向、分类、说明、取值语法与示例。
 */
export function validateHeaderData(): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  const categoryIds = new Set(HEADER_CATEGORIES.map((item) => item.id));

  for (const entry of HTTP_HEADERS) {
    if (!entry.name || names.has(entry.name.toLowerCase())) {
      errors.push(`头名称缺失或重复：${entry.name}`);
    }
    names.add(entry.name.toLowerCase());

    if (!categoryIds.has(entry.category)) {
      errors.push(`${entry.name} 的分类未登记：${entry.category}`);
    }
    if (!entry.summary || !entry.syntax || !entry.example) {
      errors.push(`${entry.name} 缺少说明 / 语法 / 示例必填信息`);
    }
    if (!entry.spec || entry.pitfalls.length === 0 || entry.keywords.length === 0) {
      errors.push(`${entry.name} 缺少标准来源 / 注意事项 / 关键字`);
    }
    // 标准头名称使用连字符形式（Pascal-Kebab）
    if (entry.name.includes('_')) {
      errors.push(`${entry.name} 名称应使用连字符而非下划线`);
    }
  }

  return errors;
}
