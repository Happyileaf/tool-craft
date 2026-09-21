/**
 * 从本地存储读取并解析 JSON 数据
 *
 * @param key - 存储键名
 * @returns 解析后的数据；不存在、解析失败或环境不支持时返回 null
 */
export function readStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) return null;
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

/**
 * 将数据序列化为 JSON 并写入本地存储
 *
 * @param key - 存储键名
 * @param value - 待写入的数据
 */
export function writeStorageJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /** 存储不可用（隐私模式或容量不足）时静默忽略，不影响工具主流程 */
  }
}

/**
 * 移除本地存储中的指定数据
 *
 * @param key - 存储键名
 */
export function removeStorageValue(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /** 存储不可用时静默忽略 */
  }
}
