/**
 * SQL 字符串字面量转义 / 反转义零依赖纯函数模块
 *
 * 覆盖四类操作：
 * - standard-escape：SQL 标准（ANSI SQL）模式，单引号双写 ''，不产生反斜杠序列
 * - standard-unescape：标准模式反转义，'' → '；输入须为带外层单引号的完整字面量
 * - mysql-escape / mysql-unescape：MySQL 模式，反斜杠转义 \' \" \\ \0 \b \n \r \t \Z，
 *   单引号同时双写以兼容 NO_BACKSLASH_ESCAPES 之外的全部 SQL 模式
 * - like-escape / like-unescape：LIKE 通配符 % _ 与转义符自身的转义，
 *   并生成 / 解析带 ESCAPE 子句的完整 LIKE 表达式
 *
 * 与通用 string-escape 工具的边界：后者只处理 JS/JSON/Python/Java 字面量，
 * 不识别 SQL 的双写单引号规则，也不生成 LIKE ... ESCAPE 表达式。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出，支持多行批量处理。
 */

export type SqlEscapeMode =
  | 'standard-escape'
  | 'standard-unescape'
  | 'mysql-escape'
  | 'mysql-unescape'
  | 'like-escape'
  | 'like-unescape';

/** LIKE 转义符，固定为反斜杠并与生成的 ESCAPE 子句保持一致 */
export const LIKE_ESCAPE_CHAR = '\\';

export interface SqlEscapeResult {
  valid: boolean;
  /** 主输出文本 */
  output: string;
  /** like-escape 模式下生成的完整 LIKE 表达式；其余模式为空串 */
  likeClause: string;
  error: string | null;
}

/** MySQL 反斜杠转义映射 */
const MYSQL_ESCAPE_MAP: Record<string, string> = {
  '\0': '0',
  '\b': 'b',
  '\n': 'n',
  '\r': 'r',
  '\t': 't',
  '\x1a': 'Z',
  '\\': '\\',
  "'": "'",
  '"': '"',
};

/** SQL 标准转义：仅把单引号双写，并包裹外层单引号 */
export function escapeStandard(raw: string): string {
  return `'${raw.replace(/'/g, "''")}'`;
}

/** MySQL 转义：反斜杠序列 + 单引号双写，并包裹外层单引号 */
export function escapeMysql(raw: string): string {
  const escaped = raw.replace(/[\0\b\n\r\t\x1a\\"']/g, (char) => `\\${MYSQL_ESCAPE_MAP[char]}`);
  return `'${escaped}'`;
}

/** SQL 标准反转义：剥去外层引号，'' → '；出现未双写的裸单引号即判定字面量未闭合 */
export function unescapeStandard(literal: string): SqlEscapeResult {
  const trimmed = literal.trim();
  if (trimmed.length < 2 || trimmed[0] !== "'" || trimmed[trimmed.length - 1] !== "'") {
    return {
      valid: false,
      output: '',
      likeClause: '',
      error: '反转义输入必须是带外层单引号的完整 SQL 字面量（如 \'O\'\'Reilly\'）',
    };
  }
  const inner = trimmed.slice(1, -1);
  let output = '';
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i]!;
    if (char === "'") {
      if (inner[i + 1] === "'") {
        output += "'";
        i += 1;
      } else {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `位置 ${i + 1} 存在未双写的单引号，SQL 字面量未正确闭合（标准 SQL 中引号必须写为 ''）`,
        };
      }
    } else {
      output += char;
    }
  }
  return { valid: true, output, likeClause: '', error: null };
}

/** MySQL 反转义：识别反斜杠序列与双写单引号，拒绝未知反斜杠序列 */
export function unescapeMysql(literal: string): SqlEscapeResult {
  const trimmed = literal.trim();
  if (trimmed === '') return { valid: false, output: '', likeClause: '', error: '内容不能为空' };
  // 末字符为反斜杠时可能是孤立转义符，先进入循环以精确定位，而非在外层拦截
  if (trimmed.length < 2 || trimmed[0] !== "'" || (trimmed[trimmed.length - 1] !== "'" && trimmed[trimmed.length - 1] !== '\\')) {
    return {
      valid: false,
      output: '',
      likeClause: '',
      error: '反转义输入必须是带外层单引号的完整 MySQL 字面量（如 \'O\\\'Reilly\'）',
    };
  }
  const inner = trimmed[trimmed.length - 1] === "'" ? trimmed.slice(1, -1) : trimmed.slice(1);
  const reverseMap: Record<string, string> = {
    '0': '\0',
    b: '\b',
    n: '\n',
    r: '\r',
    t: '\t',
    Z: '\x1a',
    '\\': '\\',
    "'": "'",
    '"': '"',
  };
  let output = '';
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i]!;
    if (char === '\\') {
      const next = inner[i + 1];
      if (next === undefined) {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `位置 ${i + 1} 的反斜杠后缺少转义字符，字面量未闭合`,
        };
      }
      const mapped = reverseMap[next];
      if (mapped === undefined) {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `未知的 MySQL 转义序列 "\\${next}"，支持 \\' \\" \\\\ \\0 \\b \\n \\r \\t \\Z`,
        };
      }
      output += mapped;
      i += 1;
    } else if (char === "'") {
      if (inner[i + 1] === "'") {
        output += "'";
        i += 1;
      } else {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `位置 ${i + 1} 存在未转义的单引号，MySQL 字面量未正确闭合`,
        };
      }
    } else {
      output += char;
    }
  }
  return { valid: true, output, likeClause: '', error: null };
}

/** LIKE 通配符转义：% _ 与反斜杠本身加反斜杠前缀，返回转义后内容（不含外层引号） */
export function escapeLike(raw: string): { escaped: string; clause: string } {
  const escaped = raw.replace(/[\\%_]/g, (char) => `\\${char}`);
  const clause = `LIKE '${escaped}' ESCAPE '${LIKE_ESCAPE_CHAR}'`;
  return { escaped, clause };
}

/** LIKE 反转义：剥去外层引号并解析 \% \_ \\，拒绝孤立反斜杠与未知转义序列 */
export function unescapeLike(literal: string): SqlEscapeResult {
  const trimmed = literal.trim();
  if (trimmed === '') return { valid: false, output: '', likeClause: '', error: '内容不能为空' };
  // 兼容用户直接粘贴完整 LIKE 表达式的情况：提取引号内内容
  const clauseMatch = trimmed.match(/^LIKE\s+'([\s\S]*)'\s+ESCAPE\s+'([^'])'$/i);
  let inner: string;
  if (clauseMatch) {
    if (clauseMatch[2] !== LIKE_ESCAPE_CHAR) {
      return {
        valid: false,
        output: '',
        likeClause: '',
        error: `仅支持转义符为 "${LIKE_ESCAPE_CHAR}" 的 LIKE 表达式，当前为 "${clauseMatch[2]}"`,
      };
    }
    inner = clauseMatch[1]!;
  } else {
    if (trimmed.length < 2 || trimmed[0] !== "'" || trimmed[trimmed.length - 1] !== "'") {
      return {
        valid: false,
        output: '',
        likeClause: '',
        error: '请输入带外层单引号的 LIKE 内容（如 \'100\\% off\'）或完整 LIKE ... ESCAPE 表达式',
      };
    }
    inner = trimmed.slice(1, -1);
  }
  let output = '';
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i]!;
    if (char === LIKE_ESCAPE_CHAR) {
      const next = inner[i + 1];
      if (next === undefined) {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `位置 ${i + 1} 的转义符后缺少字符，内容未闭合`,
        };
      }
      if (next !== '\\' && next !== '%' && next !== '_') {
        return {
          valid: false,
          output: '',
          likeClause: '',
          error: `LIKE 中仅可转义 %、_ 与转义符本身，"\\${next}" 是非法转义序列`,
        };
      }
      output += next;
      i += 1;
    } else {
      output += char;
    }
  }
  return { valid: true, output, likeClause: '', error: null };
}

/** 单行统一入口，按模式分派 */
export function processLine(rawLine: string, mode: SqlEscapeMode): SqlEscapeResult {
  switch (mode) {
    case 'standard-escape':
      return { valid: true, output: escapeStandard(rawLine), likeClause: '', error: null };
    case 'standard-unescape':
      return unescapeStandard(rawLine);
    case 'mysql-escape':
      return { valid: true, output: escapeMysql(rawLine), likeClause: '', error: null };
    case 'mysql-unescape':
      return unescapeMysql(rawLine);
    case 'like-escape': {
      if (rawLine.trim() === '') {
        return { valid: false, output: '', likeClause: '', error: '内容不能为空' };
      }
      const { escaped, clause } = escapeLike(rawLine);
      return { valid: true, output: escaped, likeClause: clause, error: null };
    }
    default:
      return unescapeLike(rawLine);
  }
}

/** 多行批量处理，空行跳过 */
export function processBatch(rawBatch: string, mode: SqlEscapeMode): SqlEscapeResult[] {
  // 转义方向按物理行处理；反转义方向同样逐行解析（字面量内部不允许裸换行）
  return rawBatch
    .split(/\r?\n/)
    .map((line) => (line.trim() === '' ? null : processLine(line, mode)))
    .filter((result): result is SqlEscapeResult => result !== null);
}
