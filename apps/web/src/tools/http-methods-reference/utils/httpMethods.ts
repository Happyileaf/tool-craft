/**
 * HTTP 请求方法速查的纯函数：搜索过滤、属性统计与对比筛选。
 * 不触碰 DOM、零依赖，全部为确定性纯函数。
 */
import {
  HTTP_METHODS,
  METHOD_COMPARISONS,
  type BodySupport,
  type HttpMethodEntry,
  type MethodComparison,
} from './httpMethodsData';

/** 搜索命中范围 */
export interface MethodSearchResult {
  methods: HttpMethodEntry[];
  comparisons: MethodComparison[];
}

/**
 * 在方法名、中英文名、语义、RFC、关键字等字段上做小写包含匹配
 *
 * @param keyword - 搜索关键字
 * @returns 命中的方法与专题对比
 */
export function filterMethods(keyword: string): MethodSearchResult {
  const query = (keyword ?? '').trim().toLowerCase();
  if (!query) {
    return { methods: HTTP_METHODS, comparisons: METHOD_COMPARISONS };
  }

  const methods = HTTP_METHODS.filter((entry) => {
    const haystack = [
      entry.method,
      entry.name,
      entry.nameEn,
      entry.semantics,
      entry.rfc,
      entry.body,
      ...entry.useCases,
      ...entry.pitfalls,
      ...entry.keywords,
      entry.safe ? 'safe 安全' : '',
      entry.idempotent ? 'idempotent 幂等' : '',
      entry.cacheable ? 'cacheable 可缓存' : '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  const comparisons = METHOD_COMPARISONS.filter((item) =>
    [...item.keywords, item.title, item.titleEn, item.summary, item.id]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );

  return { methods, comparisons };
}

/**
 * 按方法名精确查找
 *
 * @param method - 大写方法名
 */
export function getMethod(method: string): HttpMethodEntry | undefined {
  return HTTP_METHODS.find((item) => item.method === method.toUpperCase());
}

/** 请求体支持度的中文展示文案 */
export function bodySupportLabel(body: BodySupport): string {
  switch (body) {
    case 'yes':
      return '允许';
    case 'no':
      return '不允许';
    case 'undefined':
      return '未定义';
  }
}

/** 统计具有某属性的方法名列表 */
export function methodsWith(property: 'safe' | 'idempotent' | 'cacheable'): string[] {
  return HTTP_METHODS.filter((entry) => entry[property]).map((entry) => entry.method);
}

/** 校验内置数据与 RFC 9110 关键定义一致，返回不一致项（空数组表示全部一致） */
export function validateMethodInvariants(): string[] {
  const errors: string[] = [];
  const expected = new Map<string, { safe: boolean; idempotent: boolean }>([
    ['GET', { safe: true, idempotent: true }],
    ['HEAD', { safe: true, idempotent: true }],
    ['OPTIONS', { safe: true, idempotent: true }],
    ['TRACE', { safe: true, idempotent: true }],
    ['POST', { safe: false, idempotent: false }],
    ['PUT', { safe: false, idempotent: true }],
    ['DELETE', { safe: false, idempotent: true }],
    ['PATCH', { safe: false, idempotent: false }],
    ['CONNECT', { safe: false, idempotent: false }],
  ]);

  for (const [method, invariant] of expected) {
    const entry = getMethod(method);
    if (!entry) {
      errors.push(`缺少标准方法 ${method}`);
      continue;
    }
    if (entry.safe !== invariant.safe) {
      errors.push(`${method} 的 safe 应为 ${invariant.safe}`);
    }
    if (entry.idempotent !== invariant.idempotent) {
      errors.push(`${method} 的 idempotent 应为 ${invariant.idempotent}`);
    }
  }

  // safe 方法必然 idempotent（RFC 9110：safe 方法自动幂等）
  for (const entry of HTTP_METHODS) {
    if (entry.safe && !entry.idempotent) {
      errors.push(`${entry.method} 是 safe 方法，必须同时 idempotent`);
    }
    if (entry.commonStatuses.length === 0) {
      errors.push(`${entry.method} 缺少常见状态码`);
    }
  }

  return errors;
}
