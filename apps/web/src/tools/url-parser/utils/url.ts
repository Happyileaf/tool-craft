/**
 * URL 结构化解析、查询参数编辑与重新拼接的纯函数实现，不依赖 DOM 与 React。
 */

/** 查询参数条目 */
export interface QueryParam {
  /** 解码后的键 */
  key: string;
  /** 解码后的值 */
  value: string;
  /** 原始（未解码）键 */
  rawKey: string;
  /** 原始（未解码）值 */
  rawValue: string;
  /** 是否启用；停用的参数不参与重新拼接 */
  enabled: boolean;
}

/** URL 结构 */
export interface UrlParts {
  /** 协议，如 https */
  scheme: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 主机名 */
  host: string;
  /** 端口 */
  port: string;
  /** 路径 */
  pathname: string;
  /** 查询参数字符串（不含 ?） */
  query: string;
  /** 哈希片段（不含 #） */
  hash: string;
  /** 解析后的查询参数列表 */
  params: QueryParam[];
}

/** URL 解析结果 */
export interface UrlParseResult {
  /** 解析成功时的结构，失败为 null */
  parts: UrlParts | null;
  /** 错误信息 */
  error: string | null;
}

/** URL 拼接选项 */
export interface BuildUrlOptions {
  /** 是否按原始编码形式拼接（true 时使用 rawKey / rawValue），默认 false */
  preserveRaw?: boolean;
}

/**
 * URL 结构解析正则，依次捕获 协议 / 用户名 / 密码 / 主机 / 端口 / 路径 / 查询 / 哈希，
 * 允许缺少协议与主机的相对路径
 */
const URL_PATTERN =
  /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):)?(?:\/\/(?:([^:@/?#]*)(?::([^@/?#]*))?@)?([^:/?#]*)(?::([^/?#]*))?)?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;

/**
 * 安全地做百分号解码，无法解码时原样返回
 *
 * @param text - 原始文本
 * @returns 解码后的文本
 */
function decodeSafe(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
}

/**
 * 解析查询参数字符串为有序键值对列表，支持重复键并同时给出原始与解码值
 *
 * @param query - 查询字符串，可含前导 ?
 * @returns 参数条目列表
 */
export function parseQueryString(query: string): QueryParam[] {
  const raw = query.startsWith('?') ? query.slice(1) : query;
  if (raw === '') {
    return [];
  }
  const pairs = raw.split('&').filter((pair) => pair !== '');
  return pairs.map((pair) => {
    const index = pair.indexOf('=');
    const rawKey = index === -1 ? pair : pair.slice(0, index);
    const rawValue = index === -1 ? '' : pair.slice(index + 1);
    return {
      rawKey,
      rawValue,
      key: decodeSafe(rawKey),
      value: decodeSafe(rawValue),
      enabled: true,
    };
  });
}

/**
 * 将 URL 字符串拆解为各结构组件
 *
 * @param input - 待解析的 URL 字符串
 * @returns 解析结果或错误信息
 */
export function parseUrl(input: string): UrlParseResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { parts: null, error: '请输入 URL' };
  }

  const matched = URL_PATTERN.exec(trimmed);
  if (!matched) {
    return { parts: null, error: '无法解析的 URL' };
  }

  const [
    ,
    scheme = '',
    username = '',
    password = '',
    host = '',
    port = '',
    pathname = '',
    query = '',
    hash = '',
  ] = matched;

  if (port !== '') {
    if (!/^\d+$/.test(port)) {
      return { parts: null, error: `端口无效：${port}` };
    }
    if (Number(port) > 65535) {
      return { parts: null, error: `端口超出范围：${port}` };
    }
  }

  return {
    parts: {
      scheme,
      username,
      password,
      host,
      port,
      pathname,
      query,
      hash,
      params: parseQueryString(query),
    },
    error: null,
  };
}

/**
 * 依据编辑后的结构重新拼接 URL，按需使用原始编码形式
 *
 * @param parts - URL 结构
 * @param options - 拼接选项
 * @returns 拼接后的 URL 字符串
 */
export function buildUrl(parts: UrlParts, options: BuildUrlOptions = {}): string {
  const { preserveRaw = false } = options;

  let result = '';
  if (parts.scheme !== '') {
    result += `${parts.scheme}:`;
  }

  const hasAuthority =
    parts.host !== '' || parts.username !== '' || parts.password !== '';
  if (hasAuthority) {
    result += '//';
    if (parts.username !== '' || parts.password !== '') {
      result += parts.username;
      if (parts.password !== '') {
        result += `:${parts.password}`;
      }
      result += '@';
    }
    result += parts.host;
    if (parts.port !== '') {
      result += `:${parts.port}`;
    }
  }

  result += parts.pathname;

  const enabledParams = parts.params.filter((param) => param.enabled);
  if (enabledParams.length > 0) {
    const pairs = enabledParams.map((param) =>
      preserveRaw
        ? `${param.rawKey}=${param.rawValue}`
        : `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`,
    );
    result += `?${pairs.join('&')}`;
  }

  if (parts.hash !== '') {
    result += `#${parts.hash}`;
  }

  return result;
}
