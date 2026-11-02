/**
 * Cache-Control 解析与新鲜度计算相关常量（RFC 9111）
 */

/** 已知的响应端 Cache-Control 指令 */
export const RESPONSE_DIRECTIVES = new Set([
  'public',
  'private',
  'no-cache',
  'no-store',
  'max-age',
  's-maxage',
  'must-revalidate',
  'proxy-revalidate',
  'no-transform',
  'immutable',
  'stale-while-revalidate',
  'stale-if-error',
  'must-understand',
  'only-if-cached',
]);

/** 已知的请求端 Cache-Control 指令 */
export const REQUEST_DIRECTIVES = new Set([
  'max-age',
  'max-stale',
  'min-fresh',
  'no-cache',
  'no-store',
  'no-transform',
  'only-if-cached',
]);

/** 携带 delta-seconds 数值参数的响应指令 */
export const NUMERIC_RESPONSE_DIRECTIVES = new Set([
  'max-age',
  's-maxage',
  'stale-while-revalidate',
  'stale-if-error',
]);

/** 布尔型（无参数）响应指令的中文说明 */
export const DIRECTIVE_LABELS_ZH: Record<string, string> = {
  public: '公共缓存（共享缓存可存储响应）',
  private: '私有缓存（仅浏览器等单用户缓存可存储）',
  'no-cache': '使用前必须向源站重新验证（并非不存储）',
  'no-store': '禁止存储任何响应内容',
  'max-age': '新鲜度寿命（秒），相对 Date 的有效期',
  's-maxage': '共享缓存（CDN/代理）专用新鲜度寿命，覆盖 max-age 与 Expires',
  'must-revalidate': '过期后不得直接使用陈旧响应，必须成功重新验证',
  'proxy-revalidate': '共享缓存在过期后必须重新验证',
  'no-transform': '禁止代理修改响应体（如压缩、转码）',
  immutable: '新鲜期内即使手动刷新也不重新验证',
  'stale-while-revalidate': '过期后允许在后台重验的宽限秒数内先用陈旧响应',
  'stale-if-error': '重新验证失败时允许使用陈旧响应的宽限秒数',
  'must-understand': '缓存需理解状态码才允许存储',
  'only-if-cached': '请求指令：只接受已缓存响应',
  'min-fresh': '请求指令：要求响应至少还新鲜指定秒数',
  'max-stale': '请求指令：允许接受过期不超过指定秒数的响应',
};

/** 布尔型（无参数）响应指令的英文说明 */
export const DIRECTIVE_LABELS_EN: Record<string, string> = {
  public: 'Response may be stored by shared caches',
  private: 'Only a single-user cache (e.g. browser) may store the response',
  'no-cache': 'Must revalidate with the origin before use (still stored)',
  'no-store': 'Caches must not store any part of the response',
  'max-age': 'Freshness lifetime in seconds, relative to Date',
  's-maxage': 'Freshness lifetime for shared caches; overrides max-age and Expires',
  'must-revalidate': 'Stale response must not be used without successful revalidation',
  'proxy-revalidate': 'Shared caches must revalidate once stale',
  'no-transform': 'Proxies must not transform the payload',
  immutable: 'No revalidation is needed while fresh, even on reload',
  'stale-while-revalidate': 'Seconds a stale response may be served while revalidating in the background',
  'stale-if-error': 'Seconds a stale response may be used when revalidation fails',
  'must-understand': 'Cache should only store responses it understands',
  'only-if-cached': 'Request: only accept a stored response',
  'min-fresh': 'Request: response must stay fresh for at least N more seconds',
  'max-stale': 'Request: a response stale by at most N seconds is acceptable',
};
