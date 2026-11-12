/**
 * RFC 7239 Forwarded HTTP 头解析与生成的纯函数实现。
 *
 * 规范要点（RFC 7239）：
 * - 头字段值由逗号分隔的转发元素（forwarded-element）组成，每个元素描述一跳代理；
 * - 元素由分号分隔的 token=value 对组成，标准参数为 for / by / host / proto；
 * - 值可以是 token、quoted-string，或带引号的 IPv6/IPv4 节点（含端口时必须加引号）；
 * - 节点标识支持 "unknown"、obfuscated（_foo）、IPv4、IPv6（可带端口）；
 * - 解析容忍大小写差异与空白，生成时统一使用小写参数名并在必要时加引号。
 */

/** 单个转发元素（一跳）的结构化表示 */
export interface ForwardedElement {
  /** 发起请求的节点（客户端侧） */
  for?: string;
  /** 处理转发的代理节点 */
  by?: string;
  /** 原始 Host 头 */
  host?: string;
  /** 原始协议（http / https） */
  proto?: string;
}

/** 解析结果：成功携带元素数组，失败携带错误信息 */
export interface ParseResult {
  valid: boolean;
  elements: ForwardedElement[];
  errors: string[];
}

/** 受支持的标准参数名（小写） */
const STANDARD_PARAMS = new Set(['for', 'by', 'host', 'proto']);

/**
 * 拆分顶层逗号分隔的片段，忽略引号内的逗号。
 *
 * @param input - 原始头字段值
 * @returns 每个转发元素的原始文本片段
 */
function splitElements(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/**
 * 拆分元素内分号分隔的参数对，同样忽略引号内的分号。
 */
function splitParameters(element: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;

  for (const char of element) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (char === ';' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/**
 * 去掉引号字符串外层引号并处理反斜杠转义。
 *
 * @param value - 原始参数值
 * @returns 解码后的值
 */
function decodeValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    const inner = trimmed.slice(1, -1);
    return inner.replace(/\\(.)/g, '$1');
  }
  return trimmed;
}

/**
 * 校验节点标识（for / by 的值）。
 *
 * 接受：unknown、_obfuscated、IPv4（可带 :port）、IPv6（裸地址或 "[v6]:port" / "[v6]"）。
 *
 * @param node - 已解码的节点值
 * @returns 错误信息；合法时返回 undefined
 */
export function validateNode(node: string): string | undefined {
  if (node === 'unknown' || /^_[!-~]+$/.test(node)) {
    return undefined;
  }
  // 带方括号的 IPv6（可含端口）
  const bracketed = /^\[([^\]]+)](?::(\d+))?$/;
  const bracketMatch = node.match(bracketed);
  if (bracketMatch) {
    const v6Part = bracketMatch[1];
    if (v6Part === undefined || !isValidIPv6(v6Part)) {
      return `非法 IPv6 节点: ${node}`;
    }
    if (bracketMatch[2] !== undefined && !isValidPort(bracketMatch[2])) {
      return `非法端口: ${node}`;
    }
    return undefined;
  }
  // IPv4 或 IPv4:port（单个冒号且左侧为合法 IPv4）
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(node)) {
    const [ipv4Part, portPart] = node.split(':');
    if (ipv4Part === undefined || !isValidIPv4(ipv4Part)) {
      return `非法节点标识: ${node}`;
    }
    if (portPart !== undefined && !isValidPort(portPart)) {
      return `非法端口: ${node}`;
    }
    return undefined;
  }
  // 裸 IPv6（含多个冒号的压缩/完整形式）
  if (node.includes(':')) {
    if (isValidIPv6(node)) {
      return undefined;
    }
    return `非法节点标识: ${node}`;
  }
  return `无法识别的节点标识: ${node}`;
}

function isValidIPv4(value: string): boolean {
  const segments = value.split('.');
  if (segments.length !== 4) {
    return false;
  }
  return segments.every((segment) => {
    if (!/^\d{1,3}$/.test(segment)) {
      return false;
    }
    const num = Number(segment);
    return num >= 0 && num <= 255;
  });
}

function isValidIPv6(value: string): boolean {
  // 支持 :: 压缩形式，逐段做十六进制校验；不追求覆盖所有字面量边界场景
  if (value.includes('::')) {
    const sides = value.split('::');
    if (sides.length !== 2 || sides[0] === undefined || sides[1] === undefined) {
      return false;
    }
    const left = sides[0] === '' ? [] : sides[0].split(':');
    const right = sides[1] === '' ? [] : sides[1].split(':');
    if (left.length + right.length > 7) {
      return false;
    }
    return [...left, ...right].every((segment) => /^[0-9a-fA-F]{1,4}$/.test(segment));
  }
  const segments = value.split(':');
  if (segments.length !== 8) {
    return false;
  }
  return segments.every((segment) => /^[0-9a-fA-F]{1,4}$/.test(segment));
}

function isValidPort(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  const port = Number(value);
  return port >= 0 && port <= 65535;
}

/**
 * 解析 Forwarded 头字段值为结构化转发元素数组。
 *
 * @param input - 原始头字段值（可包含多跳、多逗号）
 * @returns 解析结果，含逐元素错误信息
 */
export function parseForwardedHeader(input: string): ParseResult {
  const errors: string[] = [];
  const elements: ForwardedElement[] = [];
  const rawElements = splitElements(input);

  if (rawElements.length === 0) {
    return { valid: false, elements: [], errors: ['头字段值为空'] };
  }

  rawElements.forEach((rawElement, index) => {
    const element: ForwardedElement = {};
    const parameters = splitParameters(rawElement);

    parameters.forEach((parameter) => {
      const equalIndex = parameter.indexOf('=');
      if (equalIndex <= 0) {
        errors.push(`第 ${index + 1} 跳参数缺少 "=": ${parameter}`);
        return;
      }
      const key = parameter.slice(0, equalIndex).trim().toLowerCase();
      const rawValue = parameter.slice(equalIndex + 1).trim();

      if (rawValue === '') {
        errors.push(`第 ${index + 1} 跳参数 ${key} 的值为空`);
        return;
      }

      const value = decodeValue(rawValue);

      if (!STANDARD_PARAMS.has(key)) {
        // 扩展参数保留但不进入结构化字段，仅告警
        errors.push(`第 ${index + 1} 跳包含非标准参数: ${key}`);
        return;
      }

      if (key === 'for' || key === 'by') {
        const nodeError = validateNode(value);
        if (nodeError) {
          errors.push(`第 ${index + 1} 跳 ${key}: ${nodeError}`);
          return;
        }
      }
      if (key === 'proto' && !/^[!-~]+$/.test(value)) {
        errors.push(`第 ${index + 1} 跳 proto 含非法字符: ${value}`);
        return;
      }

      element[key as keyof ForwardedElement] = value;
    });

    if (Object.keys(element).length === 0) {
      errors.push(`第 ${index + 1} 跳未包含任何有效参数`);
      return;
    }
    elements.push(element);
  });

  return { valid: errors.filter((error) => !error.includes('非标准参数')).length === 0, elements, errors };
}

/**
 * 判断生成时该值是否需要引号包裹。
 *
 * 含冒号（IPv6/端口）、逗号、分号、引号或空白时需要引号；纯 token 不需要。
 */
function needsQuotes(value: string): boolean {
  if (value === '') {
    return true;
  }
  // RFC 7230 token 字符集：不含分隔符与控制字符
  const tokenPattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  return !tokenPattern.test(value);
}

/** 生成单个参数片段，必要时加引号并转义内部引号/反斜杠 */
function encodeParameter(key: string, value: string): string {
  if (needsQuotes(value)) {
    const escaped = value.replace(/([\\"])/g, '\\$1');
    return `${key}="${escaped}"`;
  }
  return `${key}=${value}`;
}

/**
 * 把结构化转发元素序列化为 RFC 7239 合规的头字段值。
 *
 * @param elements - 转发元素数组（按代理链顺序）
 * @returns 可直接写入 Forwarded 头的字符串
 */
export function generateForwardedHeader(elements: ForwardedElement[]): string {
  return elements
    .map((element) => {
      const parts: string[] = [];
      // 固定参数顺序，保证输出稳定可测试
      for (const key of ['for', 'by', 'host', 'proto'] as const) {
        const value = element[key];
        if (value !== undefined && value !== '') {
          parts.push(encodeParameter(key, value));
        }
      }
      return parts.join(';');
    })
    .filter((part) => part.length > 0)
    .join(', ');
}

/** 示例头值，供 UI 默认填充 */
export const SAMPLE_FORWARDED_HEADER =
  'for=192.0.2.60;proto=http;by=203.0.113.43, for="[2001:db8:cafe::17]:4711";proto=https;host=example.com';
