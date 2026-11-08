/**
 * 原始 HTTP 报文解析纯函数（零依赖）。
 *
 * 兼容 CRLF 与裸 LF 行分隔，自动识别请求 / 响应，结构化起始行、headers、body，
 * 展开常见 header（Content-Type / Cookie / Cache-Control / Authorization /
 * Transfer-Encoding），并以带定位的告警报告畸形报文而非抛异常。
 */

export type HttpKind = 'request' | 'response';

export type IssueLevel = 'error' | 'warning';

export interface ParseIssue {
  level: IssueLevel;
  /** 1 基行号或字段名，便于定位。 */
  location: string;
  message: string;
}

export interface HeaderField {
  name: string;
  value: string;
  /** 重复头同名时的序号（0 起）。 */
  index: number;
  /** 人类可读展开明细（可选）。 */
  detail?: string;
}

export interface QueryParam {
  key: string;
  value: string;
}

export interface ParsedMessage {
  kind: HttpKind;
  /** 原始起始行。 */
  startLine: string;
  /** 请求侧字段。 */
  method?: string;
  path?: string;
  pathname?: string;
  queryParams?: QueryParam[];
  /** 响应侧字段。 */
  statusCode?: number;
  reasonPhrase?: string;
  statusMeaning?: string;
  /** 两侧共有。 */
  version: string;
  headers: HeaderField[];
  /** 同名 header 的聚合值（数组）。 */
  headerMap: Record<string, string[]>;
  body: string;
  bodyLength: number;
  isChunked: boolean;
  issues: ParseIssue[];
  /** 是否检测到裸 LF 行分隔。 */
  bareLineFeed: boolean;
}

/** 常用 HTTP 状态码含义（1xx–5xx 代表性条目）。 */
export const STATUS_MEANINGS: Record<number, string> = {
  100: 'Continue 继续',
  101: 'Switching Protocols 切换协议',
  200: 'OK 成功',
  201: 'Created 已创建',
  202: 'Accepted 已接受',
  204: 'No Content 无内容',
  206: 'Partial Content 部分内容',
  301: 'Moved Permanently 永久重定向',
  302: 'Found 临时重定向',
  304: 'Not Modified 未修改',
  307: 'Temporary Redirect 临时重定向',
  308: 'Permanent Redirect 永久重定向',
  400: 'Bad Request 错误请求',
  401: 'Unauthorized 未授权',
  403: 'Forbidden 禁止访问',
  404: 'Not Found 未找到',
  405: 'Method Not Allowed 方法不允许',
  408: 'Request Timeout 请求超时',
  409: 'Conflict 冲突',
  410: 'Gone 已失效',
  413: 'Payload Too Large 负载过大',
  414: 'URI Too Long URI 过长',
  415: 'Unsupported Media Type 不支持的媒体类型',
  422: 'Unprocessable Entity 实体无法处理',
  429: 'Too Many Requests 请求过多',
  500: 'Internal Server Error 服务器内部错误',
  501: 'Not Implemented 未实现',
  502: 'Bad Gateway 网关错误',
  503: 'Service Unavailable 服务不可用',
  504: 'Gateway Timeout 网关超时',
  505: 'HTTP Version Not Supported 版本不支持',
};

const TOKEN_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']);

/** 安全的 Base64 解码（浏览器 atob，失败返回 null）。 */
function safeAtob(input: string): string | null {
  try {
    const binary = atob(input.trim());
    // 还原 UTF-8（Basic 凭据可能含非 ASCII）。
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** 解析 query string 为参数表（保留重复键与空值）。 */
export function parseQuery(search: string): QueryParam[] {
  const trimmed = search.startsWith('?') ? search.slice(1) : search;
  if (trimmed === '') return [];
  return trimmed.split('&').map((pair) => {
    const eq = pair.indexOf('=');
    if (eq === -1) {
      return { key: safeDecode(pair), value: '' };
    }
    return {
      key: safeDecode(pair.slice(0, eq)),
      value: safeDecode(pair.slice(eq + 1)),
    };
  });
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

/** 展开 Content-Type 的 charset / boundary。 */
function detailContentType(value: string): string {
  const parts = value.split(';').map((p) => p.trim()).filter(Boolean);
  const mediaType = parts[0] ?? value;
  const attrs = parts.slice(1).map((p) => {
    const [k, ...rest] = p.split('=');
    return `${(k ?? '').trim()}=${rest.join('=').trim().replace(/^"|"$/g, '')}`;
  });
  return [`媒体类型：${mediaType}`, ...attrs.map((a) => `参数：${a}`)].join('；');
}

/** 展开 Cookie 请求头为键值对。 */
function detailCookie(value: string): string {
  return value
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const eq = p.indexOf('=');
      return eq === -1 ? p : `${p.slice(0, eq).trim()} = ${p.slice(eq + 1).trim()}`;
    })
    .join('；');
}

/** 展开 Set-Cookie 的属性。 */
function detailSetCookie(value: string): string {
  const segments = value.split(';').map((p) => p.trim()).filter(Boolean);
  const first = segments[0] ?? '';
  const attrs = segments.slice(1);
  const flags = attrs.filter((a) => !a.includes('=')).join('、') || '无标志位';
  const kv = attrs.filter((a) => a.includes('=')).join('；') || '无键值属性';
  return `Cookie：${first}；属性：${kv}；标志：${flags}`;
}

/** 展开 Cache-Control 指令。 */
function detailCacheControl(value: string): string {
  return value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((d) => (d.includes('=') ? `指令 ${d}` : `标志 ${d}`))
    .join('；');
}

/** 识别 Authorization 方案，Basic 解码预览并提示敏感。 */
function detailAuthorization(value: string): { detail: string; sensitive: boolean } {
  const space = value.indexOf(' ');
  if (space === -1) {
    return { detail: `方案：${value}（无凭据段）`, sensitive: false };
  }
  const scheme = value.slice(0, space).trim();
  const credential = value.slice(space + 1).trim();
  if (scheme.toLowerCase() === 'basic') {
    const decoded = safeAtob(credential);
    if (decoded === null) {
      return { detail: 'Basic 方案：凭据段不是合法 Base64', sensitive: true };
    }
    return {
      detail: `Basic 方案：Base64 解码预览 → ${decoded}（含敏感明文凭据，请勿分享截图）`,
      sensitive: true,
    };
  }
  if (scheme.toLowerCase() === 'bearer') {
    return { detail: `Bearer 方案：令牌长度 ${credential.length} 字符（已脱敏，不展示全文）`, sensitive: true };
  }
  return { detail: `${scheme} 方案：凭据长度 ${credential.length} 字符`, sensitive: false };
}

/** 为 header 生成人类可读展开明细。 */
function buildHeaderDetail(name: string, value: string): string | undefined {
  const lower = name.toLowerCase();
  switch (lower) {
    case 'content-type':
      return detailContentType(value);
    case 'cookie':
      return detailCookie(value);
    case 'set-cookie':
      return detailSetCookie(value);
    case 'cache-control':
      return detailCacheControl(value);
    case 'authorization':
      return detailAuthorization(value).detail;
    case 'transfer-encoding':
      return value.toLowerCase().includes('chunked')
        ? '分块传输编码：body 由若干 chunk 组成，Content-Length 通常不存在'
        : `传输编码：${value}`;
    case 'content-length':
      return `负载字节长度声明：${value.trim()}`;
    default:
      return undefined;
  }
}

/** 解析完整报文。 */
export function parseHttpMessage(raw: string): ParsedMessage {
  const issues: ParseIssue[] = [];
  if (raw.trim() === '') {
    throw new Error('报文为空');
  }

  const bareLineFeed = /(?<!\r)\n/.test(raw);
  if (bareLineFeed) {
    issues.push({
      level: 'warning',
      location: '全局',
      message: '检测到裸 LF（\\n）行分隔，标准 HTTP 要求 CRLF（\\r\\n），已兼容解析',
    });
  }

  // 统一为 \n 处理，记录原始 CRLF 形态仅用于告警。
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sepIndex = normalized.indexOf('\n\n');
  const headSection = sepIndex === -1 ? normalized : normalized.slice(0, sepIndex);
  const body = sepIndex === -1 ? '' : normalized.slice(sepIndex + 2);
  const lines = headSection.split('\n').filter((l) => l !== '');

  const startLine = lines[0] ?? '';
  const isResponse = startLine.startsWith('HTTP/');

  // HTTP 字段名大小写不敏感：map 键统一小写，headers 保留原始拼写。
  const headerMap: Record<string, string[]> = {};
  const headers: HeaderField[] = [];
  const nameCounts: Record<string, number> = {};

  // 先处理折叠续行：以空白开头的行并入上一逻辑行。
  const logicalLines: { text: string; lineNo: number }[] = [];
  lines.slice(1).forEach((line, idx) => {
    const lineNo = idx + 2;
    if (/^[ \t]/.test(line) && logicalLines.length > 0) {
      const prev = logicalLines[logicalLines.length - 1];
      if (prev) prev.text += ' ' + line.trim();
    } else {
      logicalLines.push({ text: line, lineNo });
    }
  });

  for (const { text, lineNo } of logicalLines) {
    const colon = text.indexOf(':');
    if (colon === 0 || colon === -1) {
      issues.push({
        level: 'error',
        location: `第 ${lineNo} 行`,
        message: `header 缺少冒号分隔：「${text.slice(0, 40)}」`,
      });
      continue;
    }
    const name = text.slice(0, colon).trim();
    const value = text.slice(colon + 1).trim();
    const lowerName = name.toLowerCase();
    const count = nameCounts[lowerName] ?? 0;
    nameCounts[lowerName] = count + 1;
    headers.push({ name, value, index: count, detail: buildHeaderDetail(name, value) });
    if (!headerMap[lowerName]) headerMap[lowerName] = [];
    headerMap[lowerName]?.push(value);
  }

  const isChunked = (headerMap['transfer-encoding'] ?? []).some((v) =>
    v.toLowerCase().includes('chunked'),
  );

  const base: ParsedMessage = {
    kind: isResponse ? 'response' : 'request',
    startLine,
    version: '',
    headers,
    headerMap,
    body,
    bodyLength: new TextEncoder().encode(body).length,
    isChunked,
    issues,
    bareLineFeed,
  };

  if (isResponse) {
    return parseResponse(startLine, base, issues);
  }
  return parseRequest(startLine, base, issues);
}

function parseRequest(startLine: string, msg: ParsedMessage, issues: ParseIssue[]): ParsedMessage {
  const parts = startLine.split(' ');
  if (parts.length < 3) {
    issues.push({
      level: 'error',
      location: '第 1 行',
      message: `请求起始行无法识别（应为 "METHOD PATH HTTP/x.y"）：${startLine}`,
    });
    return { ...msg, version: parts[2] ?? '' };
  }
  const [method, path, version] = [parts[0] ?? '', parts.slice(1, -1).join(' '), parts[parts.length - 1] ?? ''];

  if (method && !TOKEN_METHODS.has(method.toUpperCase())) {
    issues.push({
      level: 'warning',
      location: '第 1 行',
      message: `非常规请求方法：${method}`,
    });
  }
  // 多于 3 段说明 path 内含非法空格。
  if (parts.length > 3) {
    issues.push({
      level: 'error',
      location: '第 1 行',
      message: '请求路径包含非法空格，已按空格重组，请核对原始报文',
    });
  }
  if (version && !/^HTTP\/\d(\.\d)?$/.test(version)) {
    issues.push({
      level: 'warning',
      location: '第 1 行',
      message: `无法识别的 HTTP 版本字段：${version}`,
    });
  }

  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const queryParams = queryIndex === -1 ? [] : parseQuery(path.slice(queryIndex + 1));

  checkContentLength(msg, issues);

  return { ...msg, method, path, pathname, queryParams, version };
}

function parseResponse(startLine: string, msg: ParsedMessage, issues: ParseIssue[]): ParsedMessage {
  const parts = startLine.split(' ');
  const version = parts[0] ?? '';
  const statusCode = Number(parts[1] ?? '');
  const reasonPhrase = parts.slice(2).join(' ');

  if (!/^HTTP\/\d(\.\d)?$/.test(version)) {
    issues.push({
      level: 'warning',
      location: '第 1 行',
      message: `无法识别的 HTTP 版本字段：${version}`,
    });
  }
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    issues.push({
      level: 'error',
      location: '第 1 行',
      message: `状态码非法：「${parts[1] ?? ''}」`,
    });
  }

  checkContentLength(msg, issues);

  return {
    ...msg,
    version,
    statusCode: Number.isInteger(statusCode) ? statusCode : undefined,
    reasonPhrase,
    statusMeaning: STATUS_MEANINGS[statusCode],
  };
}

/** 校验 Content-Length 与实际 body 字节数（chunked 时跳过）。 */
function checkContentLength(msg: ParsedMessage, issues: ParseIssue[]): void {
  if (msg.isChunked) return;
  const declared = msg.headerMap['content-length']?.[0];
  if (declared === undefined) return;
  const expected = Number(declared.trim());
  if (!Number.isInteger(expected)) {
    issues.push({
      level: 'error',
      location: 'Content-Length',
      message: `Content-Length 不是整数：${declared}`,
    });
    return;
  }
  if (expected !== msg.bodyLength) {
    issues.push({
      level: 'warning',
      location: 'Content-Length',
      message: `Content-Length 声明 ${expected} 字节，实际 body 为 ${msg.bodyLength} 字节（可能截断或含多报文）`,
    });
  }
}

/** 导出结构化 JSON 摘要（复制用）。 */
export function toSummaryJson(msg: ParsedMessage): string {
  const summary = {
    kind: msg.kind,
    startLine: msg.startLine,
    method: msg.method,
    path: msg.path,
    pathname: msg.pathname,
    queryParams: msg.queryParams,
    version: msg.version,
    statusCode: msg.statusCode,
    reasonPhrase: msg.reasonPhrase,
    statusMeaning: msg.statusMeaning,
    headers: msg.headerMap,
    isChunked: msg.isChunked,
    bodyLength: msg.bodyLength,
    body: msg.body,
    issues: msg.issues,
  };
  return JSON.stringify(summary, null, 2);
}
