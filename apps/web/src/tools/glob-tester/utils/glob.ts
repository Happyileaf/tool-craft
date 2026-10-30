/**
 * Glob → JavaScript RegExp 的确定性翻译与匹配
 *
 * 支持的语法：
 * - `*`  匹配单个路径段内任意数量字符（不含 `/`）
 * - `**` 跨路径段匹配（按 doublestar/minimatch 常见规则处理）
 * - `?`  匹配单个字符（不含 `/`）
 * - `{a,b}` 组展开，可嵌套
 * - `[abc]` / `[a-z]` / `[!abc]` 字符类
 * - 其余正则元字符自动转义
 */

/** 需要在正则中转义的元字符 */
const REGEXP_META = /[$()*+.?[\\\]^{|}]/;

/** 翻译选项 */
export interface GlobOptions {
  /** 是否区分大小写，默认 true */
  caseSensitive?: boolean;
}

/** 匹配结果 */
export interface GlobMatchResult {
  /** 被测路径 */
  path: string;
  /** 是否匹配 */
  matched: boolean;
}

/**
 * 转义正则元字符（`*`、`?` 由调用方先行消费，不会到达这里）
 *
 * @param char - 待转义的单个字符
 * @returns 转义后的正则片段
 */
function escapeMeta(char: string): string {
  return REGEXP_META.test(char) ? `\\${char}` : char;
}

/**
 * 从 `[` 开始翻译字符类，i 指向 `[`
 *
 * @param pattern - 完整 glob 模式
 * @param i - 当前下标（指向 `[`）
 * @returns 翻译片段与新下标（新下标为类结束 `]` 的位置）
 */
function scanBracket(pattern: string, i: number): { fragment: string; next: number } {
  let fragment = '[';
  let j = i + 1;
  const first = pattern[j];
  if (first === '!') {
    fragment += '^';
    j += 1;
  } else if (first === '^') {
    fragment += '\\^';
    j += 1;
  }
  if (pattern[j] === ']') {
    fragment += '\\]';
    j += 1;
  }
  let closed = false;
  while (j < pattern.length) {
    const char = pattern[j];
    if (char === ']') {
      closed = true;
      fragment += ']';
      j += 1;
      break;
    }
    if (char === '\\') {
      fragment += '\\\\';
    } else if (char === '/') {
      fragment += '\\/';
    } else {
      fragment += char;
    }
    j += 1;
  }
  if (!closed) {
    return { fragment: '\\[', next: i };
  }
  return { fragment, next: j - 1 };
}

/**
 * 查找与起始 `{` 配对的 `}` 下标，考虑嵌套
 *
 * @param pattern - 完整 glob 模式
 * @param start - `{` 的下标
 * @returns 配对 `}` 的下标；未闭合返回 -1
 */
function findBraceEnd(pattern: string, start: number): number {
  let depth = 0;
  for (let i = start; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '\\') {
      i += 1;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * 按顶层逗号拆分花括号组内容（嵌套组内的逗号不拆）
 *
 * @param inner - 花括号内的原始内容
 * @returns 各分支字符串
 */
function splitAlternatives(inner: string): string[] {
  const branches: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i];
    if (char === '\\') {
      current += char + (inner[i + 1] ?? '');
      i += 1;
      continue;
    }
    if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
    }
    if (char === ',' && depth === 0) {
      branches.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  branches.push(current);
  return branches;
}

/**
 * 递归翻译 glob 片段为正则源码
 *
 * @param pattern - glob 片段
 * @returns 等价正则源码
 */
function translateSegment(pattern: string): string {
  let source = '';
  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === undefined) {
      break;
    }

    if (char === '\\') {
      const next = pattern[i + 1];
      if (next !== undefined) {
        source += `\\${next}`;
        i += 2;
      } else {
        source += '\\\\';
        i += 1;
      }
      continue;
    }

    if (char === '*') {
      if (pattern[i + 1] === '*') {
        const prev = pattern[i - 1];
        let j = i + 2;
        while (pattern[j] === '/') {
          j += 1;
        }
        if (prev === undefined || prev === '/') {
          source += '(?:[^/]*(?:\\/|$))*';
        } else {
          source += '.*';
        }
        i = j;
        continue;
      }
      source += '[^/]*';
      i += 1;
      continue;
    }

    if (char === '?') {
      source += '[^/]';
      i += 1;
      continue;
    }

    if (char === '[') {
      const bracket = scanBracket(pattern, i);
      source += bracket.fragment;
      i = bracket.next + 1;
      continue;
    }

    if (char === '{') {
      const end = findBraceEnd(pattern, i);
      if (end === -1) {
        source += '\\{';
        i += 1;
        continue;
      }
      const inner = pattern.slice(i + 1, end);
      const branches = splitAlternatives(inner);
      source += `(?:${branches.map((branch) => translateSegment(branch)).join('|')})`;
      i = end + 1;
      continue;
    }

    if (char === '}') {
      source += '\\}';
      i += 1;
      continue;
    }

    source += escapeMeta(char);
    i += 1;
  }
  return source;
}

/**
 * 将 glob 模式翻译为等价的 JavaScript RegExp（整串锚定）
 *
 * @param pattern - glob 模式
 * @param options - 翻译选项
 * @returns 等价正则表达式
 */
export function globToRegExp(pattern: string, options: GlobOptions = {}): RegExp {
  const caseSensitive = options.caseSensitive ?? true;
  return new RegExp(`^(?:${translateSegment(pattern)})$`, caseSensitive ? '' : 'i');
}

/**
 * 将 glob 模式转换为可直接粘贴使用的 JavaScript RegExp 字面量字符串
 *
 * @param pattern - glob 模式
 * @param options - 翻译选项
 * @returns 形如 `/^...$/i` 的字面量
 */
export function globToRegExpLiteral(pattern: string, options: GlobOptions = {}): string {
  const caseSensitive = options.caseSensitive ?? true;
  const body = translateSegment(pattern);
  return `/^(?:${body})$/${caseSensitive ? '' : 'i'}`;
}

/**
 * 判断单个路径是否匹配 glob
 *
 * @param pattern - glob 模式
 * @param path - 被测路径
 * @param options - 翻译选项
 * @returns 是否匹配
 */
export function matchGlob(pattern: string, path: string, options: GlobOptions = {}): boolean {
  return globToRegExp(pattern, options).test(path);
}

/**
 * 批量测试一组路径
 *
 * @param pattern - glob 模式
 * @param paths - 被测路径数组
 * @param options - 翻译选项
 * @returns 每条路径的匹配结果
 */
export function matchPaths(pattern: string, paths: string[], options: GlobOptions = {}): GlobMatchResult[] {
  const regexp = globToRegExp(pattern, options);
  return paths.map((path) => ({ path, matched: regexp.test(path) }));
}
