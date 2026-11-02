/**
 * 缓存策略反向生成：根据目标缓存时长与场景生成推荐响应头
 */

/** 生成器配置 */
export interface CacheStrategyInput {
  /** 浏览器/私有缓存时长（秒） */
  browserTtlSec: number;
  /** CDN/共享缓存时长（秒）；为 null 表示与浏览器相同且不区分 */
  sharedTtlSec: number | null;
  /** 是否允许共享缓存存储（含 Set-Cookie 的个性化响应应为 false） */
  allowSharedCache: boolean;
  /** 过期后是否必须重新验证（must-revalidate） */
  mustRevalidate: boolean;
  /** 是否声明 immutable（适合指纹化静态资源） */
  immutable: boolean;
  /** stale-while-revalidate 宽限秒数；0 表示不添加 */
  staleWhileRevalidateSec: number;
  /** 是否完全禁止缓存 */
  noStore: boolean;
}

/** 生成的单条响应头 */
export interface GeneratedHeader {
  name: string;
  value: string;
  /** 该头作用的中文说明 */
  note: string;
}

export function createDefaultStrategy(): CacheStrategyInput {
  return {
    browserTtlSec: 3600,
    sharedTtlSec: null,
    allowSharedCache: true,
    mustRevalidate: false,
    immutable: false,
    staleWhileRevalidateSec: 0,
    noStore: false,
  };
}

/**
 * 根据策略生成推荐响应头组合
 */
export function generateCacheHeaders(input: CacheStrategyInput): GeneratedHeader[] {
  if (input.noStore) {
    return [
      {
        name: 'Cache-Control',
        value: 'no-store',
        note: '禁止一切缓存存储，每次请求都回源获取完整响应',
      },
    ];
  }

  const directives: string[] = [];
  if (input.allowSharedCache) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  directives.push(`max-age=${clampTtl(input.browserTtlSec)}`);

  if (input.allowSharedCache && input.sharedTtlSec !== null) {
    directives.push(`s-maxage=${clampTtl(input.sharedTtlSec)}`);
  }

  if (input.staleWhileRevalidateSec > 0) {
    directives.push(`stale-while-revalidate=${clampTtl(input.staleWhileRevalidateSec)}`);
  }

  if (input.mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (input.immutable) {
    directives.push('immutable');
  }

  const headers: GeneratedHeader[] = [
    {
      name: 'Cache-Control',
      value: directives.join(', '),
      note: describeCacheControl(input),
    },
  ];

  return headers;
}

function clampTtl(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }
  return Math.floor(seconds);
}

function describeCacheControl(input: CacheStrategyInput): string {
  const parts: string[] = [];
  parts.push(input.allowSharedCache ? '允许浏览器与 CDN 等共享缓存存储' : 'private：仅浏览器可存储，响应可携带用户个性化内容');
  parts.push(`浏览器新鲜期 ${clampTtl(input.browserTtlSec)} 秒`);
  if (input.allowSharedCache && input.sharedTtlSec !== null) {
    parts.push(`CDN 新鲜期 ${clampTtl(input.sharedTtlSec)} 秒`);
  }
  if (input.staleWhileRevalidateSec > 0) {
    parts.push(`过期后 ${clampTtl(input.staleWhileRevalidateSec)} 秒内可先用旧响应再后台重验`);
  }
  if (input.mustRevalidate) {
    parts.push('过期后禁止使用陈旧响应');
  }
  if (input.immutable) {
    parts.push('新鲜期内不重新验证（适合内容哈希指纹资源）');
  }
  return parts.join('；');
}

/** 常用 TTL 预设 */
export const TTL_PRESETS = [
  { label: '5 分钟', seconds: 300 },
  { label: '1 小时', seconds: 3600 },
  { label: '1 天', seconds: 86400 },
  { label: '7 天', seconds: 604800 },
  { label: '1 个月', seconds: 2592000 },
  { label: '1 年（指纹资源）', seconds: 31536000 },
];
