/**
 * 最近使用工具记录在浏览器本地存储中的键名，带项目前缀以避免与其他站点数据冲突
 */
export const RECENT_STORAGE_KEY = 'tool-craft:recent';

/**
 * 最近使用工具的最大保留条数，超出后从列表尾部淘汰最久未使用的记录
 */
export const RECENT_MAX_COUNT = 10;

/**
 * 读取最近使用的工具 slug 列表
 *
 * @returns 按最近访问时间由新到旧排列的 slug 列表；服务端渲染、本地存储不可用或数据损坏时返回空列表
 */
export function getRecentTools(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const rawValue = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }
    return parsedValue.filter(
      (item): item is string => typeof item === 'string',
    );
  } catch {
    /** 存储被禁用或内容为非法 JSON 时按无记录处理，避免阻断页面渲染 */
    return [];
  }
}

/**
 * 记录一次工具访问，将目标工具置顶并持久化到本地存储
 *
 * @param slug - 本次访问的工具短标识
 * @returns 更新后按最近访问时间由新到旧排列的 slug 列表
 */
export function addRecentTool(slug: string): string[] {
  const recentTools = getRecentTools().filter((item) => item !== slug);
  recentTools.unshift(slug);
  const nextRecentTools = recentTools.slice(0, RECENT_MAX_COUNT);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        RECENT_STORAGE_KEY,
        JSON.stringify(nextRecentTools),
      );
    } catch {
      /** 存储写入失败（隐私模式或容量不足）时仅返回内存结果，不影响工具页面使用 */
    }
  }
  return nextRecentTools;
}
