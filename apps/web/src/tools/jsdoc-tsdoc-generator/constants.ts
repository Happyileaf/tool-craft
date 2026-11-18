/** 生成页默认函数签名样例（覆盖泛型 / async / 可选 / 剩余参数） */
export const SAMPLE_SIGNATURE = `async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  ...tags: string[]
): Promise<T>`;

/** 解析校验页默认注释块样例 */
export const SAMPLE_DOCBLOCK = `/**
 * 拉取并解析 JSON 数据。
 *
 * @template T 响应负载类型
 * @param {string} url - 目标地址
 * @param {RequestInit} [init] - 可选请求配置
 * @returns {Promise<T>} 解析后的负载
 * @throws {Error} 响应状态非 2xx 时抛出
 */`;
