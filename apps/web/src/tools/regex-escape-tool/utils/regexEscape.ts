/**
 * 正则表达式元字符转义 / 反转义纯函数模块
 *
 * 自研确定性实现，不依赖运行时是否存在原生 RegExp.escape，保证 Vitest（node）可验收。
 * 转义集合与 ECMA-262 RegExp.escape 的 SyntaxCharacter 对齐，并额外转义正斜杠与换行符。
 */

/** ECMA-262 规定的正则 SyntaxCharacter，外加需要处理的正斜杠与空白控制符 */
const ESCAPABLE = /[\\^$.*+?()[\]{}|/\-]/g;

/** 换行类控制符到转义序列的映射 */
const LINE_TERMINATOR_ESCAPE: Record<string, string> = {
  '\n': '\\n',
  '\r': '\\r',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * 把任意普通文本转义为可安全嵌入正则的字面量片段。
 * 规则：元字符与 `/`、`-` 前加反斜杠；换行符转为对应转义序列。
 */
export function escapeRegex(input: string): string {
  let result = '';
  for (const char of input) {
    if (LINE_TERMINATOR_ESCAPE[char]) {
      result += LINE_TERMINATOR_ESCAPE[char];
    } else if (ESCAPABLE.test(char)) {
      result += `\\${char}`;
    } else {
      result += char;
    }
    ESCAPABLE.lastIndex = 0;
  }
  return result;
}

/** 反斜杠转义的合法前缀字符（含字母控制序列） */
const CONTROL_ESCAPES: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
  '0': '\0',
};

/**
 * 把已转义的正则字面量片段还原为原始文本（仅处理本工具 / 常见的反斜杠转义）。
 * `\uXXXX`、`\xXX` 按码点还原；其余 `\x` 去掉反斜杠保留 x。
 */
export function unescapeRegex(input: string): string {
  let result = '';
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char !== '\\') {
      result += char;
      continue;
    }
    const next = input[i + 1];
    if (next === undefined) {
      // 末尾孤立的反斜杠，原样保留
      result += char;
      break;
    }
    if (next === 'u' && /^[0-9a-fA-F]{4}/.test(input.slice(i + 2, i + 6))) {
      result += String.fromCharCode(parseInt(input.slice(i + 2, i + 6), 16));
      i += 5;
      continue;
    }
    if (next === 'x' && /^[0-9a-fA-F]{2}/.test(input.slice(i + 2, i + 4))) {
      result += String.fromCharCode(parseInt(input.slice(i + 2, i + 4), 16));
      i += 3;
      continue;
    }
    result += CONTROL_ESCAPES[next] ?? next;
    i += 1;
  }
  return result;
}

export interface RegExpSourceOptions {
  flags?: string;
}

/** 输出 `new RegExp("...", "flags")` 构造源码（内层字符串中的反斜杠与引号再做转义） */
export function buildRegExpConstructor(escaped: string, options: RegExpSourceOptions = {}): string {
  const flags = options.flags ?? '';
  const quoted = `"${escaped.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return flags ? `new RegExp(${quoted}, "${flags}")` : `new RegExp(${quoted})`;
}

/** 输出 `/.../flags` 正则字面量形式（正斜杠已在转义阶段处理） */
export function buildRegexLiteral(escaped: string, options: RegExpSourceOptions = {}): string {
  return `/${escaped}/${options.flags ?? ''}`;
}
