/**
 * INI 配置与 JSON 双向转换纯函数。
 * 不依赖 DOM / React，可直接在 Node 测试环境运行。
 *
 * 支持：section 分节（[section]）、key = value（同时兼容冒号分隔）、
 * ; / # 整行注释、单双引号包裹的值与常见转义、布尔 / 数字 / null 类型推断、
 * 同名分节合并、同名键后者覆盖，以及可选的点号嵌套键（a.b.c）。
 */

/** 解析与序列化选项 */
export interface IniOptions {
  /** 是否把 true/false、整数、浮点数、null 推断为对应 JSON 类型（默认开启） */
  inferTypes?: boolean;
  /** 是否把点号键解析为嵌套对象（默认关闭，保持扁平） */
  dotSections?: boolean;
}

/** JSON 值类型 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const DEFAULT_OPTIONS: Required<IniOptions> = {
  inferTypes: true,
  dotSections: false,
};

/**
 * 去除行内首尾空白后判断是否为注释行（; 或 # 开头）
 *
 * @param line - 单行文本
 * @returns 是否为注释
 */
function isCommentLine(line: string): boolean {
  return line.startsWith(';') || line.startsWith('#');
}

/**
 * 解析引号包裹的字符串，处理常见反斜杠转义
 *
 * @param raw - 去除外层引号前的原始值
 * @param quote - 引号字符（' 或 "）
 * @param lineNumber - 行号（用于报错）
 * @returns 解析后的字符串
 */
function parseQuoted(raw: string, quote: string, lineNumber: number): string {
  const inner = raw.slice(1, -1);
  let result = '';
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]!;
    if (ch !== '\\') {
      result += ch;
      continue;
    }
    const next = inner[i + 1];
    if (next === undefined) {
      throw new Error(`第 ${lineNumber} 行：转义符 "\\" 后缺少字符`);
    }
    const escapes: Record<string, string> = {
      n: '\n',
      t: '\t',
      r: '\r',
      '\\': '\\',
      '"': '"',
      "'": "'",
      '0': '\0',
    };
    if (next in escapes) {
      result += escapes[next]!;
      i += 1;
    } else {
      result += next;
      i += 1;
    }
  }
  return result;
}

/**
 * 对未加引号的值做类型推断
 *
 * @param raw - 原始值文本
 * @param inferTypes - 是否进行类型推断
 * @returns 推断后的 JSON 值
 */
function parseScalar(raw: string, inferTypes: boolean): JsonValue {
  if (!inferTypes) {
    return raw;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  if (raw === 'null' || raw === 'none') {
    return null;
  }
  if (raw !== '' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return raw;
}

/**
 * 解析单个 key/value 原始文本
 *
 * @param rawValue - 等号或冒号右侧文本
 * @param inferTypes - 是否类型推断
 * @param lineNumber - 行号
 * @returns JSON 值
 */
function parseValue(rawValue: string, inferTypes: boolean, lineNumber: number): JsonValue {
  const value = rawValue.trim();
  const quote = value.startsWith('"') ? '"' : value.startsWith("'") ? "'" : null;
  if (value.length >= 2 && quote !== null && value.endsWith(quote)) {
    return parseQuoted(value, quote, lineNumber);
  }
  return parseScalar(value, inferTypes);
}

/**
 * 沿点号路径定位（必要时创建）对象节点
 *
 * @param target - 根对象
 * @param path - 点号分隔的键路径
 * @returns 路径末端对应的对象节点
 */
function ensurePath(
  target: { [key: string]: JsonValue },
  path: string[],
): { [key: string]: JsonValue } {
  let cursor = target;
  path.forEach((segment) => {
    const existing = cursor[segment];
    if (existing === undefined || existing === null) {
      const created: { [key: string]: JsonValue } = {};
      cursor[segment] = created;
      cursor = created;
    } else if (typeof existing === 'object' && !Array.isArray(existing)) {
      cursor = existing as { [key: string]: JsonValue };
    } else {
      throw new Error(`路径键 "${segment}" 与已有的非对象值冲突`);
    }
  });
  return cursor;
}

/**
 * 沿点号路径写入叶子值，路径中间节点若不存在则创建
 *
 * @param target - 当前分节对象
 * @param path - 点号分隔的键路径
 * @param value - 待写入值
 */
function setDeep(target: { [key: string]: JsonValue }, path: string[], value: JsonValue): void {
  const parent = ensurePath(target, path.slice(0, -1));
  parent[path[path.length - 1]!] = value;
}

/**
 * 把 INI 文本解析为 JSON 对象
 *
 * @param iniText - INI 配置文本
 * @param options - 解析选项
 * @returns 解析得到的 JSON 对象
 */
export function iniToJson(iniText: string, options?: IniOptions): { [key: string]: JsonValue } {
  const opts = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  const root: { [key: string]: JsonValue } = {};
  let current: { [key: string]: JsonValue } = root;

  const lines = iniText.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line || isCommentLine(line)) {
      return;
    }
    const sectionMatch = /^\[(.+)]$/.exec(line);
    if (sectionMatch) {
      const name = sectionMatch[1]!.trim();
      if (!name) {
        throw new Error(`第 ${lineNumber} 行：分节名称不能为空`);
      }
      if (opts.dotSections && name.includes('.')) {
        const path = name.split('.').map((part) => part.trim());
        if (path.some((part) => !part)) {
          throw new Error(`第 ${lineNumber} 行：点号分节名 "${name}" 中存在空段`);
        }
        current = ensurePath(root, path);
        return;
      }
      const existing = root[name];
      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        current = existing as { [key: string]: JsonValue };
      } else if (existing !== undefined) {
        throw new Error(`第 ${lineNumber} 行：分节 "${name}" 与顶层同名键冲突`);
      } else {
        const section: { [key: string]: JsonValue } = {};
        root[name] = section;
        current = section;
      }
      return;
    }

    const eq = line.indexOf('=');
    const colon = line.indexOf(':');
    const sep = eq === -1 ? colon : colon === -1 ? eq : Math.min(eq, colon);
    if (sep <= 0) {
      throw new Error(`第 ${lineNumber} 行：无法识别的内容，应为 key = value 或 [section]`);
    }
    const key = line.slice(0, sep).trim();
    if (!key) {
      throw new Error(`第 ${lineNumber} 行：键名不能为空`);
    }
    const value = parseValue(line.slice(sep + 1), opts.inferTypes, lineNumber);
    if (opts.dotSections && key.includes('.')) {
      const path = key.split('.').map((part) => part.trim());
      if (path.some((part) => !part)) {
        throw new Error(`第 ${lineNumber} 行：点号嵌套键 "${key}" 中存在空段`);
      }
      setDeep(current, path, value);
    } else {
      current[key] = value;
    }
  });

  return root;
}

/**
 * 判断字符串在推断模式下是否需要加引号以保持原样
 *
 * @param value - 待判断字符串
 * @returns 是否需要引号
 */
function needsQuote(value: string): boolean {
  if (value === '') {
    return true;
  }
  if (/^\s|\s$/.test(value)) {
    return true;
  }
  if (/[\r\n=:;#[\]"']/.test(value)) {
    return true;
  }
  if (/^(true|false|null|none)$/.test(value)) {
    return true;
  }
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
    return true;
  }
  return false;
}

/**
 * 序列化字符串值，必要时加双引号并转义
 *
 * @param value - 原始字符串
 * @returns INI 值文本
 */
function formatString(value: string): string {
  if (!needsQuote(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
}

/**
 * 把一个 JSON 标量或标量数组渲染为 INI 值文本
 *
 * @param value - JSON 值
 * @param keyPath - 完整键路径（用于报错）
 * @returns INI 值文本
 */
function formatLeaf(value: JsonValue, keyPath: string): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return formatString(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (item === null || typeof item !== 'object') {
          return formatLeaf(item, `${keyPath}[${index}]`);
        }
        throw new Error(`键 "${keyPath}" 是对象数组，INI 无法直接表达，请先展平数据`);
      })
      .join(', ');
  }
  throw new Error(`键 "${keyPath}" 嵌套层级过深，INI 仅支持一层分节`);
}

/**
 * 把 JSON 对象序列化为 INI 文本
 *
 * @param json - JSON 对象（或 JSON 字符串）
 * @returns INI 配置文本
 */
export function jsonToIni(json: { [key: string]: JsonValue } | string): string {
  const parsed: unknown = typeof json === 'string' ? JSON.parse(json) : json;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON 根节点必须是对象');
  }
  const data = parsed as { [key: string]: JsonValue };

  const topLines: string[] = [];
  const sections: string[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const body = Object.entries(value).map(([subKey, subValue]) => {
        return `${subKey} = ${formatLeaf(subValue, `${key}.${subKey}`)}`;
      });
      sections.push(`[${key}]`, ...body, '');
    } else {
      topLines.push(`${key} = ${formatLeaf(value, key)}`);
    }
  });

  const parts: string[] = [];
  if (topLines.length > 0) {
    parts.push(topLines.join('\n'));
  }
  if (sections.length > 0) {
    parts.push(sections.join('\n').trimEnd());
  }
  return parts.length > 0 ? `${parts.join('\n\n')}\n` : '';
}
