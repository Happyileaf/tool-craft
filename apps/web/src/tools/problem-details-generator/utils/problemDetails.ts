/**
 * RFC 7807 Problem Details for HTTP APIs 生成与解析纯函数。
 *
 * application/problem+json 的标准成员：
 *   - type（URI 引用，缺省 about:blank）
 *   - title（人类可读摘要，缺省时可由 status 推导）
 *   - status（真实 HTTP 状态码，可选但强烈建议）
 *   - detail（面向本次具体错误的解释）
 *   - instance（发生错误的具体资源 URI 引用）
 *   - 任意扩展成员（extension members）
 *
 * 本模块只做字段校验、序列化与解析，不发起任何网络请求、不触碰 DOM。
 */

/** RFC 7807 规定的五个标准成员名（区分大小写） */
export const STANDARD_FIELDS = ['type', 'title', 'status', 'detail', 'instance'] as const;

/** type 缺省值（RFC 7807 §3） */
export const DEFAULT_TYPE = 'about:blank';

/** 常见 HTTP 状态码 → reason phrase 映射，用于 title 缺省推导与校验提示 */
const HTTP_STATUS_PHRASES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  409: 'Conflict',
  410: 'Gone',
  412: 'Precondition Failed',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/** 生成器入参（扩展成员以扁平键值对收集） */
export interface ProblemInput {
  type?: string;
  title?: string;
  status?: number | null;
  detail?: string;
  instance?: string;
  /** 扩展成员：键名不能与标准成员冲突，值必须可被 JSON 序列化 */
  extensions: Array<{ key: string; value: string }>;
}

/** 结构化 Problem Details 对象 */
export interface ProblemObject {
  type: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
}

/** 宽松 URI 引用校验：允许绝对 URI、相对引用与 about:blank，拒绝空白与控制字符 */
const URI_REFERENCE_PATTERN = /^[^\s]*$/;

/** 校验 URI 引用字段（RFC 3986 URI-reference，这里做实用级检查） */
function assertUriReference(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new Error(`${field} 不能为空字符串`);
  }
  if (!URI_REFERENCE_PATTERN.test(trimmed)) {
    throw new Error(`${field}「${value}」包含空白字符，不是合法 URI 引用`);
  }
  return trimmed;
}

/** 校验 HTTP 状态码（RFC 7231 三位整数 100–599） */
export function assertHttpStatus(status: number): number {
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new Error(`HTTP 状态码必须是 100–599 之间的整数，当前为「${status}」`);
  }
  return status;
}

/** 返回状态码对应的标准 reason phrase（未知码返回 undefined） */
export function statusPhrase(status: number): string | undefined {
  return HTTP_STATUS_PHRASES[status];
}

/** 尝试把字符串扩展值还原为 JSON 标量 / 数组 / 对象，失败则保留原字符串 */
function coerceExtensionValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return raw;
  }
}

/**
 * 生成 Problem Details 对象与 application/problem+json 正文。
 *
 * @param input 表单收集的标准字段与扩展成员
 * @returns 结构化对象、紧凑 JSON 与美化 JSON
 */
export function generateProblem(input: ProblemInput): {
  object: ProblemObject;
  compactJson: string;
  prettyJson: string;
} {
  const object: ProblemObject = { type: DEFAULT_TYPE };

  if (input.type && input.type.trim() !== '') {
    object.type = assertUriReference(input.type, 'type');
  }

  if (input.status !== undefined && input.status !== null && Number.isFinite(input.status)) {
    const status = assertHttpStatus(input.status);
    object.status = status;
    // title 缺省时按 RFC 7807 §3.1 推荐由状态码短语推导
    if (!input.title || input.title.trim() === '') {
      const phrase = statusPhrase(status);
      if (phrase) {
        object.title = phrase;
      }
    }
  }

  if (input.title && input.title.trim() !== '') {
    object.title = input.title.trim();
  }
  if (input.detail && input.detail.trim() !== '') {
    object.detail = input.detail.trim();
  }
  if (input.instance && input.instance.trim() !== '') {
    object.instance = assertUriReference(input.instance, 'instance');
  }

  const seen = new Set<string>();
  for (const extension of input.extensions) {
    const key = extension.key.trim();
    if (key === '') {
      continue;
    }
    if ((STANDARD_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`扩展成员名「${key}」与 RFC 7807 标准字段冲突，请改名或使用对应标准字段`);
    }
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) {
      throw new Error(`扩展成员名「${key}」不合法：需以字母或下划线开头，仅含字母、数字、下划线与连字符`);
    }
    if (seen.has(key)) {
      throw new Error(`扩展成员名「${key}」重复`);
    }
    seen.add(key);
    object[key] = coerceExtensionValue(extension.value);
  }

  return {
    object,
    compactJson: JSON.stringify(object),
    prettyJson: JSON.stringify(object, null, 2),
  };
}

/** 解析结果 */
export interface ParsedProblem {
  object: ProblemObject;
  /** 标准成员实际出现情况 */
  standard: {
    type: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
  };
  /** 扩展成员键名与值 */
  extensions: Array<{ key: string; value: unknown }>;
  /** 校验告警（不阻断解析） */
  warnings: string[];
}

/**
 * 解析并校验 application/problem+json 正文。
 *
 * @param raw 原始 JSON 文本
 * @returns 拆分后的标准字段、扩展成员与告警列表
 * @throws JSON 语法错误、根不是对象、status 非法等硬错误
 */
export function parseProblem(raw: string): ParsedProblem {
  if (raw.trim() === '') {
    throw new Error('请粘贴 application/problem+json 正文');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON 语法错误：${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Problem Details 根节点必须是 JSON 对象');
  }
  const source = parsed as Record<string, unknown>;
  const warnings: string[] = [];
  const object: ProblemObject = { type: DEFAULT_TYPE };
  const extensions: Array<{ key: string; value: unknown }> = [];

  for (const [key, value] of Object.entries(source)) {
    if (key === 'type') {
      if (typeof value !== 'string') {
        throw new Error('type 必须是字符串（URI 引用）');
      }
      object.type = value;
    } else if (key === 'title') {
      if (typeof value !== 'string') {
        warnings.push('title 应为字符串，已保留原值');
      }
      object.title = value as string;
    } else if (key === 'status') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error('status 必须是整数（HTTP 状态码）');
      }
      assertHttpStatus(value);
      object.status = value;
    } else if (key === 'detail') {
      if (typeof value !== 'string') {
        warnings.push('detail 应为字符串，已保留原值');
      }
      object.detail = value as string;
    } else if (key === 'instance') {
      if (typeof value !== 'string') {
        throw new Error('instance 必须是字符串（URI 引用）');
      }
      object.instance = value;
    } else {
      object[key] = value;
      extensions.push({ key, value });
    }
  }

  if (!('type' in source)) {
    warnings.push('缺少 type 字段，按 RFC 7807 缺省视为 about:blank');
  }
  if (!('status' in source)) {
    warnings.push('缺少 status 字段：建议带上真实 HTTP 状态码以便客户端判断');
  } else if (object.type === DEFAULT_TYPE && object.status !== undefined) {
    // RFC 7807 §3.1：仅当 type 为 about:blank 时，title 才应与 HTTP 状态短语一致
    const phrase = statusPhrase(object.status);
    if (phrase && object.title && object.title !== phrase) {
      warnings.push(`about:blank 文档的 title「${object.title}」与状态码 ${object.status} 的标准短语「${phrase}」不一致`);
    }
  }
  if (object.type === DEFAULT_TYPE && object.status !== undefined && !object.title) {
    warnings.push('type 为 about:blank 时建议让 title 与 HTTP 状态码短语保持一致');
  }

  return {
    object,
    standard: {
      type: object.type,
      title: object.title,
      status: object.status,
      detail: object.detail,
      instance: object.instance,
    },
    extensions,
    warnings,
  };
}
