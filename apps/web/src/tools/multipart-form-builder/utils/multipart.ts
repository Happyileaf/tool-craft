/**
 * multipart/form-data 请求体构造与反向解析的纯函数实现
 *
 * 依据 RFC 7578（Returning Values from Forms: multipart/form-data）与
 * RFC 2046（MIME Part Two: Media Types）实现：
 * - 分隔符 boundary 由 bchars 组成（字母数字与 ' ( ) + _ , - . / = ? : ）
 * - 每段以 `--<boundary>\r\n` 起始，头部块后接空行 `\r\n`，再跟段体与 `\r\n`
 * - 结束段为 `--<boundary>--\r\n`
 * - 头部参数中的 `"` 与 `\` 按 RFC 2616 quoted-string 规则转义，CR/LF 不允许出现
 *
 * 本模块不依赖 React 或 DOM，仅使用全局 TextEncoder 计算 UTF-8 字节长度，
 * 不使用 FormData / File API，全部报文以字符串手工拼装以便展示原始字节文本。
 */

import { BOUNDARY_PREFIX, MAX_FIELDS } from '../constants';

/** 字段类型：普通文本字段或文件字段 */
export type FormFieldKind = 'text' | 'file';

/** 单个表单字段的结构化描述 */
export interface FormField {
  /** 组件内使用的唯一标识 */
  id: string;
  /** 字段类型 */
  kind: FormFieldKind;
  /** 字段名（Content-Disposition 的 name 参数） */
  name: string;
  /** 字段内容（文本值或文件文本内容） */
  value: string;
  /** 文件字段的文件名（仅 kind 为 file 时使用） */
  filename?: string;
  /** 文件字段的内容类型（仅 kind 为 file 时使用，可留空） */
  contentType?: string;
}

/** buildMultipart 的拼装结果 */
export interface BuildResult {
  /** 实际使用的 boundary（不含前导 --） */
  boundary: string;
  /** 完整的 Content-Type 请求头值 */
  contentType: string;
  /** 完整 multipart 请求体字符串 */
  body: string;
  /** 请求体的 UTF-8 字节长度 */
  byteLength: number;
}

/** 反向解析得到的单个分段 */
export interface ParsedPart {
  /** 字段名 */
  name: string;
  /** 段体文本内容 */
  value: string;
  /** 文件名（文件字段才有） */
  filename?: string;
  /** 段 Content-Type（显式声明才有） */
  contentType?: string;
}

/** parseMultipart 的解析结果 */
export interface ParseResult {
  /** 结构是否完整可解析 */
  ok: boolean;
  /** 成功解析出的分段 */
  parts: ParsedPart[];
  /** 结构化错误信息，ok 为 true 时为空数组 */
  errors: string[];
}

/** boundary 随机/确定性后缀的长度 */
const BOUNDARY_SUFFIX_LENGTH = 16;

/** 后缀字母表：bchars 中的字母数字子集 */
const SUFFIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** 行结束序列 */
const CRLF = '\r\n';

/** 从 Content-Type 头提取 boundary 参数的正则（兼容带引号写法） */
const BOUNDARY_HEADER_RE = /boundary=("?)([^";]+)\1/i;

/** 匹配 Content-Disposition 头部中 name/filename 参数的正则 */
const DISPOSITION_PARAM_RE = /(name|filename)\s*=\s*("(?:[^"\\]|\\.)*"|[^;]+)(?:;|$)/gi;

/**
 * 生成 16 位随机字母数字后缀
 *
 * @returns 由字母数字组成的随机后缀字符串
 */
function randomSuffix(): string {
  let suffix = '';
  for (let index = 0; index < BOUNDARY_SUFFIX_LENGTH; index += 1) {
    const charIndex = Math.floor(Math.random() * SUFFIX_CHARS.length);
    const char = SUFFIX_CHARS[charIndex];
    if (char !== undefined) {
      suffix += char;
    }
  }
  return suffix;
}

/**
 * 以 LCG（线性同余）生成确定性 16 位字母数字后缀，供单元测试使用
 *
 * @param seed - 随机种子，同一种子产出完全相同的后缀
 * @returns 由字母数字组成的确定性后缀字符串
 */
function deterministicSuffix(seed: number): string {
  let state = seed >>> 0;
  let suffix = '';
  for (let index = 0; index < BOUNDARY_SUFFIX_LENGTH; index += 1) {
    // Numerical Recipes 风格 LCG，避免 state 停在 0
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const charIndex = state % SUFFIX_CHARS.length;
    const char = SUFFIX_CHARS[charIndex];
    if (char !== undefined) {
      suffix += char;
    }
  }
  return suffix;
}

/**
 * 生成随机 boundary：WebKit 风格前缀 + 16 位随机字母数字后缀
 *
 * @returns 可直接用于 multipart 报文的 boundary
 */
export function generateBoundary(): string {
  return BOUNDARY_PREFIX + randomSuffix();
}

/**
 * 生成确定性 boundary：WebKit 风格前缀 + 基于种子的 LCG 后缀
 *
 * @param seed - 随机种子，同一种子产出完全相同的 boundary
 * @returns 确定性 boundary，仅由合法 bchars 组成
 */
export function generateBoundaryDeterministic(seed: number): string {
  return BOUNDARY_PREFIX + deterministicSuffix(seed);
}

/**
 * 转义 Content-Disposition 头部 quoted-string 参数
 * 先转义反斜杠再转义双引号，保证可逆
 *
 * @param value - 原始参数值
 * @returns 可直接放入双引号内的转义结果
 */
export function escapeHeaderParam(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * 还原 quoted-string 参数中的反斜杠转义
 *
 * @param value - 带引号或转义的原始参数值
 * @returns 反转义后的参数值
 */
function unescapeHeaderParam(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted.replace(/\\(.)/g, '$1');
}

/**
 * 校验字段集合是否满足构造要求
 *
 * @param fields - 待校验字段
 * @returns 校验结论与逐条错误信息
 */
export function validateFields(fields: FormField[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (fields.length === 0) {
    errors.push('至少需要一个字段');
    return { valid: false, errors };
  }
  if (fields.length > MAX_FIELDS) {
    errors.push(`字段数量不能超过 ${MAX_FIELDS} 个，当前为 ${fields.length} 个`);
  }
  fields.forEach((field, index) => {
    const position = `第 ${index + 1} 个字段`;
    if (field.name === '') {
      errors.push(`${position}的 name 不能为空`);
    } else if (field.name.includes('\r') || field.name.includes('\n')) {
      errors.push(`${position}的 name 不能包含 CR/LF 字符`);
    }
    if (field.kind === 'file') {
      if (field.filename === undefined || field.filename === '') {
        errors.push(`${position}为文件字段，filename 不能为空`);
      } else if (field.filename.includes('\r') || field.filename.includes('\n')) {
        errors.push(`${position}的 filename 不能包含 CR/LF 字符`);
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

/**
 * 按 RFC 7578 规则手工拼装 multipart/form-data 请求体
 *
 * @param fields - 表单字段集合
 * @param boundary - 可选自定义 boundary，未传时随机生成
 * @returns boundary、Content-Type 头、请求体与 UTF-8 字节长度
 * @throws 字段校验失败或 boundary 为空时抛出错误
 */
export function buildMultipart(fields: FormField[], boundary?: string): BuildResult {
  const validation = validateFields(fields);
  if (!validation.valid) {
    throw new Error(validation.errors.join('；'));
  }
  const actualBoundary = boundary ?? generateBoundary();
  if (actualBoundary === '') {
    throw new Error('boundary 不能为空');
  }

  const segments: string[] = [];
  for (const field of fields) {
    let part = `--${actualBoundary}${CRLF}`;
    const escapedName = escapeHeaderParam(field.name);
    if (field.kind === 'file') {
      const escapedFilename = escapeHeaderParam(field.filename ?? '');
      part += `Content-Disposition: form-data; name="${escapedName}"; filename="${escapedFilename}"${CRLF}`;
      if (field.contentType !== undefined && field.contentType !== '') {
        part += `Content-Type: ${field.contentType}${CRLF}`;
      }
    } else {
      part += `Content-Disposition: form-data; name="${escapedName}"${CRLF}`;
    }
    part += CRLF;
    part += field.value;
    part += CRLF;
    segments.push(part);
  }
  segments.push(`--${actualBoundary}--${CRLF}`);
  const body = segments.join('');

  return {
    boundary: actualBoundary,
    contentType: `multipart/form-data; boundary=${actualBoundary}`,
    body,
    byteLength: new TextEncoder().encode(body).length,
  };
}

/**
 * 转义 shell 单引号字符串：所有单引号替换为 '\'' 后整体包在单引号中
 *
 * @param value - 原始字符串
 * @returns 可安全嵌入 POSIX shell 命令的单引号字符串
 */
function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

/**
 * 基于构造结果生成可直接执行的 curl 命令
 *
 * @param url - 目标请求 URL
 * @param result - buildMultipart 的返回结果
 * @returns 单引号安全的 curl 命令字符串
 */
export function buildCurlExample(url: string, result: BuildResult): string {
  return [
    'curl -X POST',
    shellSingleQuote(url),
    `-H ${shellSingleQuote(`Content-Type: ${result.contentType}`)}`,
    `--data-binary ${shellSingleQuote(result.body)}`,
  ].join(' ');
}

/**
 * 从 Content-Type 头中提取 boundary 参数
 *
 * @param contentType - Content-Type 头值
 * @returns 提取到的 boundary，无法提取时返回 null
 */
function extractBoundaryFromHeader(contentType: string): string | null {
  const match = BOUNDARY_HEADER_RE.exec(contentType);
  if (match === null) {
    return null;
  }
  const boundary = match[2];
  return boundary === undefined || boundary === '' ? null : boundary;
}

/**
 * 从报文首个 `--` 行自动探测 boundary
 *
 * @param rawBody - 原始 multipart 请求体
 * @returns 探测到的 boundary（去掉前导 --），无法探测时返回 null
 */
function detectBoundary(rawBody: string): string | null {
  const firstLineEnd = rawBody.indexOf(CRLF);
  const firstLine = firstLineEnd === -1 ? rawBody : rawBody.slice(0, firstLineEnd);
  if (!firstLine.startsWith('--') || firstLine.length <= 2) {
    return null;
  }
  return firstLine.slice(2);
}

/**
 * 解析单个分段的头部块与段体
 *
 * @param block - 不含 boundary 分隔行的分段原始文本
 * @param index - 分段序号，用于错误信息
 * @param errors - 收集错误信息的数组
 * @returns 解析出的分段；头部结构损坏时返回 null
 */
function parsePartBlock(
  block: string,
  index: number,
  errors: string[],
): ParsedPart | null {
  const headerEnd = block.indexOf(CRLF + CRLF);
  if (headerEnd === -1) {
    errors.push(`第 ${index} 个分段缺少头部结束空行`);
    return null;
  }
  const headerBlock = block.slice(0, headerEnd);
  let value = block.slice(headerEnd + 4);
  if (value.endsWith(CRLF)) {
    value = value.slice(0, -2);
  }

  const headerLines = headerBlock.split(CRLF);
  const dispositionLine = headerLines.find((line) =>
    /^content-disposition\s*:/i.test(line),
  );
  if (dispositionLine === undefined) {
    errors.push(`第 ${index} 个分段缺少 Content-Disposition 头部`);
    return null;
  }

  let name: string | null = null;
  let filename: string | null = null;
  const params = dispositionLine.slice(dispositionLine.indexOf(':') + 1);
  let paramMatch: RegExpExecArray | null;
  DISPOSITION_PARAM_RE.lastIndex = 0;
  while ((paramMatch = DISPOSITION_PARAM_RE.exec(params)) !== null) {
    const paramName = paramMatch[1];
    const rawValue = paramMatch[2];
    if (paramName === undefined || rawValue === undefined) {
      continue;
    }
    if (paramName === 'name') {
      name = unescapeHeaderParam(rawValue);
    } else if (paramName === 'filename') {
      filename = unescapeHeaderParam(rawValue);
    }
  }

  if (name === null) {
    errors.push(`第 ${index} 个分段的 Content-Disposition 缺少 name 参数`);
    return null;
  }

  const contentTypeLine = headerLines.find((line) => /^content-type\s*:/i.test(line));
  const part: ParsedPart = { name, value };
  if (filename !== null) {
    part.filename = filename;
  }
  if (contentTypeLine !== undefined) {
    part.contentType = contentTypeLine
      .slice(contentTypeLine.indexOf(':') + 1)
      .trim();
  }
  return part;
}

/**
 * 反向解析 multipart/form-data 请求体
 * 优先从 Content-Type 头提取 boundary，缺失时从报文首行自动探测；
 * 任何结构损坏都记录到 errors 而不抛出异常
 *
 * @param rawBody - 原始 multipart 请求体
 * @param contentType - 可选的 Content-Type 头值
 * @returns 解析结论、分段列表与结构化错误
 */
export function parseMultipart(rawBody: string, contentType?: string): ParseResult {
  const errors: string[] = [];
  const parts: ParsedPart[] = [];

  if (rawBody === '') {
    return { ok: false, parts, errors: ['原始请求体为空'] };
  }

  let boundary: string | null = null;
  if (contentType !== undefined && contentType !== '') {
    boundary = extractBoundaryFromHeader(contentType);
  }
  if (boundary === null) {
    boundary = detectBoundary(rawBody);
  }
  if (boundary === null) {
    return {
      ok: false,
      parts,
      errors: ['无法确定 boundary：Content-Type 头中缺少 boundary 参数且报文首行不是 boundary 分隔行'],
    };
  }

  const delimiter = `--${boundary}`;
  const segments = rawBody.split(delimiter);
  // 首段为 preamble（通常为空），末尾元素为结束标记之后的 epilogue
  if (segments.length < 3) {
    errors.push('报文结构损坏：未找到任何有效的 boundary 分段');
    return { ok: false, parts, errors };
  }

  const closing = segments[segments.length - 1];
  if (closing === undefined || !closing.startsWith('--')) {
    errors.push('报文缺少结束分隔行 --<boundary>--');
  }

  for (let index = 1; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (segment === undefined) {
      continue;
    }
    let block = segment;
    if (block.startsWith(CRLF)) {
      block = block.slice(2);
    }
    if (block === '') {
      errors.push(`第 ${index} 个分段内容为空`);
      continue;
    }
    const part = parsePartBlock(block, index, errors);
    if (part !== null) {
      parts.push(part);
    }
  }

  return { ok: errors.length === 0, parts, errors };
}
