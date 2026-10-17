/**
 * cURL 命令解析与代码生成纯函数集合。
 * 全部逻辑在浏览器本地执行，遵循 shell 常见引用规则，不触碰 DOM / React。
 */

/**
 * 代码生成的目标语言枚举
 */
export enum TargetLanguageEnum {
  /** 浏览器 / Node 原生 fetch */
  JAVASCRIPT_FETCH = 'javascript-fetch',
  /** Node.js + axios */
  NODE_AXIOS = 'node-axios',
  /** Python + requests */
  PYTHON_REQUESTS = 'python-requests',
  /** Go 标准库 net/http */
  GO = 'go',
}

/**
 * cURL 命令解析结果
 */
export interface ParsedCurlRequest {
  /** HTTP 方法（大写），如 GET / POST */
  method: string;
  /** 请求地址 */
  url: string;
  /** 请求头，键为头名、键值为头值 */
  headers: Record<string, string>;
  /** 请求体，多个 -d 以 & 拼接后的原始字符串 */
  data?: string;
  /** -F/--form 形式的表单字段 */
  form?: Record<string, string>;
}

/** -d 系列取值选项集合 */
const DATA_OPTIONS = new Set<string>([
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-ascii',
  '--data-urlencode',
]);

/** 需要忽略的布尔开关集合 */
const BOOLEAN_OPTIONS = new Set<string>([
  '-k',
  '--insecure',
  '-s',
  '--silent',
  '-S',
  '--show-error',
  '-L',
  '--location',
  '-v',
  '--verbose',
  '-i',
  '--include',
  '-f',
  '--fail',
  '-#',
  '--no-buffer',
]);

/** Base64 字母表 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * 把 UTF-8 字符串编码为 Base64（不依赖 btoa/atob）
 *
 * @param input - 待编码的字符串
 * @returns Base64 编码结果
 */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    const triplet = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += b1 === undefined ? '=' : BASE64_CHARS[(triplet >> 6) & 0x3f];
    result += b2 === undefined ? '=' : BASE64_CHARS[triplet & 0x3f];
  }
  return result;
}

/**
 * 按 shell 常见词法规则把 cURL 命令切分为 token 序列，
 * 支持单引号（内容原样）、双引号（\" / \\ / \$ 转义）、反斜杠续行与 $'...' ANSI-C 字面量
 *
 * @param command - 原始 cURL 命令文本
 * @returns 切分后的 token 列表
 */
function tokenize(command: string): string[] {
  const tokens: string[] = [];
  const len = command.length;
  let current = '';
  let started = false;
  let i = 0;

  /** 提交当前累积的 token（仅当已开始累积时） */
  const commit = () => {
    if (started) {
      tokens.push(current);
      current = '';
      started = false;
    }
  };

  while (i < len) {
    const ch = command.charAt(i);

    if (ch === '\\') {
      const next = command.charAt(i + 1);
      if (next === '\n') {
        i += 2;
        continue;
      }
      if (next === '\r' && command.charAt(i + 2) === '\n') {
        i += 3;
        continue;
      }
      if (next === '') {
        i += 1;
        continue;
      }
      current += next;
      started = true;
      i += 2;
      continue;
    }

    if (ch === '$' && command.charAt(i + 1) === "'") {
      i += 2;
      started = true;
      while (i < len && command.charAt(i) !== "'") {
        const c = command.charAt(i);
        if (c !== '\\') {
          current += c;
          i += 1;
          continue;
        }
        const n = command.charAt(i + 1);
        switch (n) {
          case 'n':
            current += '\n';
            i += 2;
            break;
          case 't':
            current += '\t';
            i += 2;
            break;
          case 'r':
            current += '\r';
            i += 2;
            break;
          case '\\':
            current += '\\';
            i += 2;
            break;
          case "'":
            current += "'";
            i += 2;
            break;
          case '"':
            current += '"';
            i += 2;
            break;
          case 'a':
            current += '\u0007';
            i += 2;
            break;
          case 'b':
            current += '\b';
            i += 2;
            break;
          case 'f':
            current += '\f';
            i += 2;
            break;
          case 'v':
            current += '\v';
            i += 2;
            break;
          case '0':
            current += '\0';
            i += 2;
            break;
          case 'x': {
            const hex = command.slice(i + 2, i + 4);
            if (/^[0-9a-fA-F]{2}$/.test(hex)) {
              current += String.fromCharCode(parseInt(hex, 16));
              i += 4;
            } else {
              current += 'x';
              i += 2;
            }
            break;
          }
          case 'u': {
            const hex = command.slice(i + 2, i + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              current += String.fromCharCode(parseInt(hex, 16));
              i += 6;
            } else {
              current += 'u';
              i += 2;
            }
            break;
          }
          case '':
            current += '\\';
            i += 1;
            break;
          default:
            current += n;
            i += 2;
            break;
        }
      }
      i += 1;
      continue;
    }

    if (ch === "'") {
      i += 1;
      started = true;
      while (i < len && command.charAt(i) !== "'") {
        current += command.charAt(i);
        i += 1;
      }
      i += 1;
      continue;
    }

    if (ch === '"') {
      i += 1;
      started = true;
      while (i < len && command.charAt(i) !== '"') {
        const c = command.charAt(i);
        if (c === '\\') {
          const n = command.charAt(i + 1);
          if (n === '"' || n === '\\' || n === '$') {
            current += n;
            i += 2;
            continue;
          }
          if (n === '\n') {
            i += 2;
            continue;
          }
          if (n === '\r' && command.charAt(i + 2) === '\n') {
            i += 3;
            continue;
          }
          current += c;
          i += 1;
          continue;
        }
        current += c;
        i += 1;
      }
      i += 1;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      commit();
      i += 1;
      continue;
    }

    current += ch;
    started = true;
    i += 1;
  }

  commit();
  return tokens;
}

/**
 * 在请求头中按小写名查找实际存储的键
 *
 * @param headers - 请求头对象
 * @param lowerName - 小写后的头名
 * @returns 命中时返回原键名，否则返回 undefined
 */
function findHeaderKey(headers: Record<string, string>, lowerName: string): string | undefined {
  return Object.keys(headers).find((key) => key.toLowerCase() === lowerName);
}

/**
 * 解析一条 cURL 命令为结构化请求对象
 *
 * @param command - cURL 命令文本
 * @returns 解析后的请求对象
 * @throws 未找到请求地址时抛出「未在命令中找到 URL」
 */
export function parseCurl(command: string): ParsedCurlRequest {
  const tokens = tokenize(command);
  if (tokens[0] === 'curl') {
    tokens.shift();
  }

  const headers: Record<string, string> = {};
  const dataParts: string[] = [];
  let form: Record<string, string> | undefined;
  let explicitMethod: string | undefined;
  let url: string | undefined;
  let user: string | undefined;
  let cookie: string | undefined;
  let head = false;
  let get = false;
  let compressed = false;

  for (let i = 0; i < tokens.length; i += 1) {
    let token = tokens[i] ?? '';
    let inline: string | undefined;

    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      if (eq !== -1) {
        inline = token.slice(eq + 1);
        token = token.slice(0, eq);
      }
    }

    /** 读取当前选项的取值，支持 --opt=value 内联形式 */
    const readValue = (): string | undefined => {
      if (inline !== undefined) {
        return inline;
      }
      if (i + 1 < tokens.length) {
        i += 1;
        return tokens[i];
      }
      return undefined;
    };

    if (token === '-I' || token === '--head') {
      head = true;
      continue;
    }
    if (token === '-G' || token === '--get') {
      get = true;
      continue;
    }
    if (token === '--compressed') {
      compressed = true;
      continue;
    }
    if (BOOLEAN_OPTIONS.has(token)) {
      continue;
    }

    if (token === '-X' || token === '--request') {
      const value = readValue();
      if (value !== undefined) {
        explicitMethod = value.toUpperCase();
      }
      continue;
    }

    if (token === '-H' || token === '--header') {
      const value = readValue();
      if (value !== undefined) {
        const idx = value.indexOf(':');
        if (idx !== -1) {
          const name = value.slice(0, idx).trim();
          const headerValue = value.slice(idx + 1).trim();
          if (name) {
            headers[name] = headerValue;
          }
        }
      }
      continue;
    }

    if (DATA_OPTIONS.has(token)) {
      const value = readValue();
      if (value !== undefined) {
        dataParts.push(value);
      }
      continue;
    }

    if (token === '-F' || token === '--form') {
      const value = readValue();
      if (value !== undefined) {
        const idx = value.indexOf('=');
        const name = idx === -1 ? value : value.slice(0, idx);
        const formValue = idx === -1 ? '' : value.slice(idx + 1);
        if (!form) {
          form = {};
        }
        if (name) {
          form[name] = formValue;
        }
      }
      continue;
    }

    if (token === '-u' || token === '--user') {
      const value = readValue();
      if (value !== undefined) {
        user = value;
      }
      continue;
    }

    if (token === '-b' || token === '--cookie') {
      const value = readValue();
      if (value !== undefined) {
        cookie = cookie ? `${cookie}; ${value}` : value;
      }
      continue;
    }

    if (token === '--url') {
      const value = readValue();
      if (value !== undefined) {
        url = value;
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      // 未知选项，忽略
      continue;
    }

    if (url === undefined) {
      url = token;
    }
  }

  if (url === undefined) {
    throw new Error('未在命令中找到 URL');
  }

  if (user !== undefined) {
    const existing = findHeaderKey(headers, 'authorization');
    if (existing) {
      delete headers[existing];
    }
    headers.Authorization = `Basic ${encodeBase64(user)}`;
  }

  if (cookie !== undefined) {
    const existing = findHeaderKey(headers, 'cookie');
    if (existing) {
      headers[existing] = `${headers[existing]}; ${cookie}`;
    } else {
      headers.Cookie = cookie;
    }
  }

  if (compressed && findHeaderKey(headers, 'accept-encoding') === undefined) {
    headers['Accept-Encoding'] = 'gzip, deflate';
  }

  let method = 'GET';
  if (explicitMethod !== undefined) {
    method = explicitMethod;
  } else if (head) {
    method = 'HEAD';
  } else if (get) {
    method = 'GET';
  } else if (dataParts.length > 0 || form !== undefined) {
    method = 'POST';
  }

  const result: ParsedCurlRequest = { method, url, headers };

  if (dataParts.length > 0) {
    result.data = dataParts.join('&');
  }
  if (form !== undefined) {
    result.form = form;
  }

  return result;
}

/**
 * 取请求的等效请求体：优先 data，其次把 form 序列化为 k=v&k=v
 *
 * @param request - 解析后的请求
 * @returns 请求体字符串，无请求体时返回 undefined
 */
function resolveBody(request: ParsedCurlRequest): string | undefined {
  if (request.data !== undefined) {
    return request.data;
  }
  if (request.form) {
    return Object.entries(request.form)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
  return undefined;
}

/**
 * 生成 JavaScript fetch 代码片段
 *
 * @param request - 解析后的请求
 * @returns JavaScript 代码
 */
function generateJavaScriptFetch(request: ParsedCurlRequest): string {
  const lines: string[] = [];
  lines.push(`const response = await fetch(${JSON.stringify(request.url)}, {`);
  lines.push(`  method: ${JSON.stringify(request.method)},`);

  const headerEntries = Object.entries(request.headers);
  if (headerEntries.length > 0) {
    lines.push('  headers: {');
    headerEntries.forEach(([key, value]) => {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    });
    lines.push('  },');
  }

  const body = resolveBody(request);
  if (body !== undefined) {
    lines.push(`  body: ${JSON.stringify(body)},`);
  }

  lines.push('});');
  lines.push('');
  lines.push('const data = await response.json();');
  return lines.join('\n');
}

/**
 * 生成 Node.js axios 代码片段
 *
 * @param request - 解析后的请求
 * @returns JavaScript（axios）代码
 */
function generateNodeAxios(request: ParsedCurlRequest): string {
  const lines: string[] = [];
  lines.push("const axios = require('axios');");
  lines.push('');
  lines.push('const response = await axios({');
  lines.push(`  method: ${JSON.stringify(request.method)},`);
  lines.push(`  url: ${JSON.stringify(request.url)},`);

  const headerEntries = Object.entries(request.headers);
  if (headerEntries.length > 0) {
    lines.push('  headers: {');
    headerEntries.forEach(([key, value]) => {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    });
    lines.push('  },');
  }

  const body = resolveBody(request);
  if (body !== undefined) {
    lines.push(`  data: ${JSON.stringify(body)},`);
  }

  lines.push('});');
  lines.push('');
  lines.push('console.log(response.data);');
  return lines.join('\n');
}

/**
 * 把字符串转义为 Python 单引号字符串字面量
 *
 * @param value - 原始字符串
 * @returns Python 字面量
 */
function quotePython(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `'${escaped}'`;
}

/**
 * 生成 Python requests 代码片段
 *
 * @param request - 解析后的请求
 * @returns Python 代码
 */
function generatePythonRequests(request: ParsedCurlRequest): string {
  const lines: string[] = [];
  lines.push('import requests');
  lines.push('');
  lines.push('response = requests.request(');
  lines.push(`    method=${quotePython(request.method)},`);
  lines.push(`    url=${quotePython(request.url)},`);

  const headerEntries = Object.entries(request.headers);
  if (headerEntries.length > 0) {
    lines.push('    headers={');
    headerEntries.forEach(([key, value]) => {
      lines.push(`        ${quotePython(key)}: ${quotePython(value)},`);
    });
    lines.push('    },');
  }

  const body = resolveBody(request);
  if (body !== undefined) {
    lines.push(`    data=${quotePython(body)},`);
  }

  lines.push(')');
  lines.push('');
  lines.push('print(response.json())');
  return lines.join('\n');
}

/**
 * 生成 Go 标准库 net/http 代码片段
 *
 * @param request - 解析后的请求
 * @returns Go 代码
 */
function generateGo(request: ParsedCurlRequest): string {
  const body = resolveBody(request);
  const bodyArg = body === undefined ? 'nil' : 'body';

  const lines: string[] = [];
  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('\t"net/http"');
  if (body !== undefined) {
    lines.push('\t"strings"');
  }
  lines.push(')');
  lines.push('');
  lines.push('func main() {');
  if (body !== undefined) {
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(body)})`);
  }
  lines.push(`\treq, err := http.NewRequest(${JSON.stringify(request.method)}, ${JSON.stringify(request.url)}, ${bodyArg})`);
  lines.push('\tif err != nil {');
  lines.push('\t\tpanic(err)');
  lines.push('\t}');
  Object.entries(request.headers).forEach(([key, value]) => {
    lines.push(`\treq.Header.Set(${JSON.stringify(key)}, ${JSON.stringify(value)})`);
  });
  lines.push('');
  lines.push('\tclient := &http.Client{}');
  lines.push('\tresp, err := client.Do(req)');
  lines.push('\tif err != nil {');
  lines.push('\t\tpanic(err)');
  lines.push('\t}');
  lines.push('\tdefer resp.Body.Close()');
  lines.push('}');
  return lines.join('\n');
}

/**
 * 把解析后的 cURL 请求转换为目标语言代码片段
 *
 * @param request - 解析后的请求
 * @param language - 目标语言
 * @returns 目标语言代码
 */
export function generateCode(request: ParsedCurlRequest, language: TargetLanguageEnum): string {
  switch (language) {
    case TargetLanguageEnum.JAVASCRIPT_FETCH:
      return generateJavaScriptFetch(request);
    case TargetLanguageEnum.NODE_AXIOS:
      return generateNodeAxios(request);
    case TargetLanguageEnum.PYTHON_REQUESTS:
      return generatePythonRequests(request);
    case TargetLanguageEnum.GO:
      return generateGo(request);
    default:
      return '';
  }
}
