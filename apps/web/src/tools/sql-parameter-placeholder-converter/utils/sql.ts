/**
 * SQL 参数占位符词法扫描与风格转换（零依赖，不触碰 DOM / React）
 *
 * 仅做词法层面的占位符识别与映射，不做 SQL 语法解析或格式化。
 * 扫描时跳过：单引号字符串、双引号 / 反引号 / 方括号标识符、
 * -- 行注释、/* *\/ 块注释与 PostgreSQL 美元引用字符串。
 * 所有错误以结果对象返回，不在纯函数内抛异常。
 */
import {
  AUTO_DETECT,
  DEFAULT_NAME_PREFIX,
  MAX_SQL_LENGTH,
  NAME_PATTERN,
  STYLE_META_MAP,
  type PlaceholderStyle,
} from '../constants';

/** 扫描得到的词法片段 */
export interface SqlToken {
  /** 普通文本（原样保留）或占位符 */
  kind: 'text' | 'placeholder';
  text: string;
  /** 占位符在原始 SQL 中的起始偏移（0-based） */
  offset: number;
  /** 编号式占位符的序号（1-based） */
  number?: number;
  /** 命名式占位符的名称 */
  name?: string;
}

/** 统一参数模型中的单个参数 */
export interface ParamEntry {
  /** 参数序号（按首次出现顺序，1-based） */
  index: number;
  /** 参数名称（位置式自动生成，如 p1） */
  name: string;
  /** 绑定次数 */
  bindings: number;
}

/** 转换结果 */
export interface ConversionResult {
  /** 转换后的 SQL；出错时为空串 */
  sql: string;
  /** 检测到的源风格；出错或未识别时为 null */
  detectedStyle: PlaceholderStyle | null;
  /** 参数清单（按首次出现顺序） */
  params: ParamEntry[];
  /** 占位符绑定总次数 */
  totalBindings: number;
  /** 提示信息（非阻断） */
  warnings: string[];
  /** 错误信息；null 表示成功 */
  error: string | null;
  /** 出错偏移（0-based），无法定位时为 null */
  errorOffset: number | null;
}

interface Scanner {
  tokens: SqlToken[];
  error: string | null;
  errorOffset: number | null;
}

const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

/** 追加普通文本片段，相邻文本合并 */
function pushText(scanner: Scanner, text: string, offset: number): void {
  if (text.length === 0) {
    return;
  }
  const last = scanner.tokens[scanner.tokens.length - 1];
  if (last && last.kind === 'text') {
    last.text += text;
  } else {
    scanner.tokens.push({ kind: 'text', text, offset });
  }
}

function fail(scanner: Scanner, message: string, offset: number): void {
  if (scanner.error === null) {
    scanner.error = message;
    scanner.errorOffset = offset;
  }
}

/** 读取美元引用定界符（$$ 或 $tag$），返回定界符长度；不匹配返回 0 */
function matchDollarTag(sql: string, start: number): number {
  if (sql[start] !== '$') {
    return 0;
  }
  let i = start + 1;
  while (i < sql.length && IDENT_PART.test(sql[i] as string)) {
    i += 1;
  }
  if (sql[i] === '$') {
    return i - start + 1;
  }
  return 0;
}

/**
 * 按指定源风格扫描 SQL，输出文本 / 占位符片段序列。
 * 未闭合的字符串、标识符、块注释或美元引用通过 error 返回并带偏移。
 */
export function scanSql(sql: string, style: PlaceholderStyle): Scanner {
  const scanner: Scanner = { tokens: [], error: null, errorOffset: null };
  let i = 0;
  let textStart = 0;

  const flushText = (end: number) => {
    pushText(scanner, sql.slice(textStart, end), textStart);
  };

  while (i < sql.length) {
    const ch = sql[i] as string;

    // 单引号字符串：'' 双写转义，反斜杠转义下一个字符
    if (ch === "'") {
      flushText(i);
      let j = i + 1;
      let closed = false;
      while (j < sql.length) {
        const c = sql[j] as string;
        if (c === '\\' && j + 1 < sql.length) {
          j += 2;
          continue;
        }
        if (c === "'") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      if (!closed) {
        fail(scanner, `未闭合的单引号字符串，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
        pushText(scanner, sql.slice(i), i);
        return scanner;
      }
      pushText(scanner, sql.slice(i, j), i);
      i = j;
      textStart = i;
      continue;
    }

    // 双引号标识符："" 双写转义
    if (ch === '"') {
      flushText(i);
      let j = i + 1;
      let closed = false;
      while (j < sql.length) {
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') {
            j += 2;
            continue;
          }
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      if (!closed) {
        fail(scanner, `未闭合的双引号标识符，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
        pushText(scanner, sql.slice(i), i);
        return scanner;
      }
      pushText(scanner, sql.slice(i, j), i);
      i = j;
      textStart = i;
      continue;
    }

    // 反引号标识符
    if (ch === '`') {
      flushText(i);
      const close = sql.indexOf('`', i + 1);
      if (close === -1) {
        fail(scanner, `未闭合的反引号标识符，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
        pushText(scanner, sql.slice(i), i);
        return scanner;
      }
      pushText(scanner, sql.slice(i, close + 1), i);
      i = close + 1;
      textStart = i;
      continue;
    }

    // 方括号标识符（SQL Server）：]] 双写转义
    if (ch === '[') {
      flushText(i);
      let j = i + 1;
      let closed = false;
      while (j < sql.length) {
        if (sql[j] === ']') {
          if (sql[j + 1] === ']') {
            j += 2;
            continue;
          }
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      if (!closed) {
        fail(scanner, `未闭合的方括号标识符，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
        pushText(scanner, sql.slice(i), i);
        return scanner;
      }
      pushText(scanner, sql.slice(i, j), i);
      i = j;
      textStart = i;
      continue;
    }

    // 行注释 --
    if (ch === '-' && sql[i + 1] === '-') {
      flushText(i);
      let j = i + 2;
      while (j < sql.length && sql[j] !== '\n') {
        j += 1;
      }
      pushText(scanner, sql.slice(i, j), i);
      i = j;
      textStart = i;
      continue;
    }

    // 块注释 /* */（支持嵌套）
    if (ch === '/' && sql[i + 1] === '*') {
      flushText(i);
      let depth = 1;
      let j = i + 2;
      while (j < sql.length && depth > 0) {
        if (sql[j] === '/' && sql[j + 1] === '*') {
          depth += 1;
          j += 2;
          continue;
        }
        if (sql[j] === '*' && sql[j + 1] === '/') {
          depth -= 1;
          j += 2;
          continue;
        }
        j += 1;
      }
      if (depth > 0) {
        fail(scanner, `未闭合的块注释，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
        pushText(scanner, sql.slice(i), i);
        return scanner;
      }
      pushText(scanner, sql.slice(i, j), i);
      i = j;
      textStart = i;
      continue;
    }

    // 美元引用字符串 $$...$$ / $tag$...$tag$
    if (ch === '$') {
      const tagLen = matchDollarTag(sql, i);
      if (tagLen > 1 || (tagLen === 1 && style !== 'dollar-number')) {
        const tag = sql.slice(i, i + tagLen);
        const close = sql.indexOf(tag, i + tagLen);
        if (close === -1) {
          fail(scanner, `未闭合的美元引用字符串 ${tag}，起始于偏移 ${i}（第 ${i + 1} 个字符）`, i);
          pushText(scanner, sql.slice(i), i);
          return scanner;
        }
        flushText(i);
        pushText(scanner, sql.slice(i, close + tagLen), i);
        i = close + tagLen;
        textStart = i;
        continue;
      }
    }

    // @@ 系统变量（如 @@version）整体作为普通文本，避免第二个 @ 被当作命名占位符
    if (ch === '@' && sql[i + 1] === '@') {
      let j = i + 2;
      while (j < sql.length && IDENT_PART.test(sql[j] as string)) {
        j += 1;
      }
      i = j;
      continue;
    }

    // :: PostgreSQL 类型转换整体作为普通文本，避免第二个 : 被当作命名占位符
    if (ch === ':' && sql[i + 1] === ':') {
      let j = i + 2;
      while (j < sql.length && IDENT_PART.test(sql[j] as string)) {
        j += 1;
      }
      i = j;
      continue;
    }

    // ---- 占位符识别（跳过区域之外）----
    const placeholder = matchPlaceholder(sql, i, style);
    if (placeholder) {
      flushText(i);
      scanner.tokens.push({ kind: 'placeholder', text: placeholder.text, offset: i, ...placeholder.extra });
      i += placeholder.text.length;
      textStart = i;
      continue;
    }

    i += 1;
  }

  flushText(sql.length);
  return scanner;
}

interface PlaceholderMatch {
  text: string;
  extra: { number?: number; name?: string };
}

/** 在偏移 pos 处按风格尝试匹配单个占位符；不匹配返回 null */
function matchPlaceholder(sql: string, pos: number, style: PlaceholderStyle): PlaceholderMatch | null {
  const ch = sql[pos] as string;
  const next = sql[pos + 1];

  switch (style) {
    case 'question':
      // 排除 PostgreSQL jsonb 运算符 ?| 与 ?&
      if (ch === '?' && next !== '|' && next !== '&') {
        return { text: '?', extra: {} };
      }
      return null;

    case 'percent-s':
      if (ch === '%' && next === 's') {
        return { text: '%s', extra: {} };
      }
      return null;

    case 'dollar-number': {
      if (ch !== '$' || !DIGIT.test(next ?? '')) {
        return null;
      }
      let j = pos + 1;
      while (j < sql.length && DIGIT.test(sql[j] as string)) {
        j += 1;
      }
      return { text: sql.slice(pos, j), extra: { number: Number(sql.slice(pos + 1, j)) } };
    }

    case 'colon-number': {
      if (ch !== ':' || !DIGIT.test(next ?? '')) {
        return null;
      }
      let j = pos + 1;
      while (j < sql.length && DIGIT.test(sql[j] as string)) {
        j += 1;
      }
      return { text: sql.slice(pos, j), extra: { number: Number(sql.slice(pos + 1, j)) } };
    }

    case 'at-p-number': {
      // @pN：@ 后紧跟 p 与至少一位数字；排除 @@ 前缀（@@version 等系统变量整体跳过）
      if (ch !== '@' || next === '@' || next !== 'p' || !DIGIT.test(sql[pos + 2] ?? '')) {
        return null;
      }
      let j = pos + 2;
      while (j < sql.length && DIGIT.test(sql[j] as string)) {
        j += 1;
      }
      return { text: sql.slice(pos, j), extra: { number: Number(sql.slice(pos + 2, j)) } };
    }

    case 'colon-name': {
      // 排除 :: 类型转换；名称首字符须为字母 / 下划线
      if (ch !== ':' || next === ':' || !IDENT_START.test(next ?? '')) {
        return null;
      }
      let j = pos + 1;
      while (j < sql.length && IDENT_PART.test(sql[j] as string)) {
        j += 1;
      }
      return { text: sql.slice(pos, j), extra: { name: sql.slice(pos + 1, j) } };
    }

    case 'at-name': {
      // @@ 系统变量不是占位符，交由扫描器按普通字符推进（matchPlaceholder 返回 null）
      if (ch !== '@' || next === '@' || !IDENT_START.test(next ?? '')) {
        return null;
      }
      let j = pos + 1;
      while (j < sql.length && IDENT_PART.test(sql[j] as string)) {
        j += 1;
      }
      return { text: sql.slice(pos, j), extra: { name: sql.slice(pos + 1, j) } };
    }

    case 'py-named': {
      // %(name)s
      if (ch !== '%' || next !== '(') {
        return null;
      }
      const close = sql.indexOf(')s', pos + 2);
      if (close === -1) {
        return null;
      }
      const name = sql.slice(pos + 2, close);
      // 名称合法性交由 convertPlaceholders 的 validateNamed 统一报错（保留偏移）
      return { text: sql.slice(pos, close + 2), extra: { name } };
    }

    case 'double-brace': {
      // {{name}}；{ 不参与其他占位符，允许 {{{a}}} 形式（取最左起始、最右闭合）
      if (ch !== '{' || next !== '{') {
        return null;
      }
      const close = sql.indexOf('}}', pos + 2);
      if (close === -1) {
        return null;
      }
      const name = sql.slice(pos + 2, close);
      // 名称合法性交由 convertPlaceholders 的 validateNamed 统一报错（保留偏移）
      return { text: sql.slice(pos, close + 2), extra: { name } };
    }

    default:
      return null;
  }
}

/** 仅取占位符 token */
function placeholderTokens(tokens: SqlToken[]): SqlToken[] {
  return tokens.filter((token) => token.kind === 'placeholder');
}

/**
 * 自动识别源风格：对九种风格分别扫描，
 * 同一语句出现多种风格 → 报错并列出风格名。
 */
export function detectStyle(sql: string): { style: PlaceholderStyle | null; error: string | null; errorOffset: number | null } {
  const matched: PlaceholderStyle[] = [];
  let firstError: { error: string; errorOffset: number | null } | null = null;

  for (const style of Object.keys(STYLE_META_MAP) as PlaceholderStyle[]) {
    const scanned = scanSql(sql, style);
    if (scanned.error) {
      if (!firstError) {
        firstError = { error: scanned.error, errorOffset: scanned.errorOffset };
      }
      continue;
    }
    if (placeholderTokens(scanned.tokens).length > 0) {
      matched.push(style);
    }
  }

  if (firstError && matched.length === 0) {
    return { style: null, error: firstError.error, errorOffset: firstError.errorOffset };
  }
  if (matched.length > 1) {
    const labels = matched.map((s) => STYLE_META_MAP[s].sample).join('、');
    return {
      style: null,
      error: `同一语句检测到多种占位符风格（${labels}），请在源风格中手动指定其一`,
      errorOffset: null,
    };
  }
  return { style: matched[0] ?? null, error: null, errorOffset: null };
}

/** 校验编号式占位符：从 1 开始、连续、可重复 */
function validateNumbered(tokens: SqlToken[]): string | null {
  const numbers = tokens.map((t) => t.number as number);
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  if (unique[0] === 0) {
    const zero = tokens.find((t) => t.number === 0);
    return `编号式占位符不允许序号 0（偏移 ${zero?.offset ?? 0}），序号必须从 1 开始`;
  }
  for (let n = 1; n <= unique.length; n += 1) {
    if (unique[n - 1] !== n) {
      return `编号式占位符序号必须从 1 开始且连续，期望 $${n} 但实际为 $${unique[n - 1] ?? '缺失'}`;
    }
  }
  return null;
}

/** 校验命名式占位符名称合法性，返回大小写重名提示 */
function validateNamed(tokens: SqlToken[]): string[] {
  const warnings: string[] = [];
  for (const token of tokens) {
    if (!NAME_PATTERN.test(token.name ?? '')) {
      return [`占位符名称「${token.name}」不合法，名称须匹配 [A-Za-z_][A-Za-z0-9_]*（偏移 ${token.offset}）`];
    }
  }
  const lowerMap = new Map<string, Set<string>>();
  for (const token of tokens) {
    const key = (token.name ?? '').toLowerCase();
    const set = lowerMap.get(key) ?? new Set<string>();
    set.add(token.name ?? '');
    lowerMap.set(key, set);
  }
  for (const variants of lowerMap.values()) {
    if (variants.size > 1) {
      warnings.push(`检测到仅大小写不同的占位符名称 ${[...variants].join('、')}，按区分大小写处理为不同参数`);
    }
  }
  return warnings;
}

/** 按目标风格渲染单个占位符 */
function renderPlaceholder(style: PlaceholderStyle, name: string, number: number): string {
  switch (style) {
    case 'question':
      return '?';
    case 'percent-s':
      return '%s';
    case 'dollar-number':
      return `$${number}`;
    case 'colon-number':
      return `:${number}`;
    case 'at-p-number':
      return `@p${number}`;
    case 'colon-name':
      return `:${name}`;
    case 'at-name':
      return `@${name}`;
    case 'py-named':
      return `%(${name})s`;
    case 'double-brace':
      return `{{${name}}}`;
    default:
      return '';
  }
}

/** 转换主入口 */
export function convertPlaceholders(
  sql: string,
  sourceStyle: PlaceholderStyle | typeof AUTO_DETECT,
  targetStyle: PlaceholderStyle,
  namePrefix: string = DEFAULT_NAME_PREFIX,
): ConversionResult {
  const base: ConversionResult = {
    sql: '',
    detectedStyle: null,
    params: [],
    totalBindings: 0,
    warnings: [],
    error: null,
    errorOffset: null,
  };

  if (sql.trim().length === 0) {
    return { ...base, error: '请输入包含占位符的 SQL 语句' };
  }
  if (sql.length > MAX_SQL_LENGTH) {
    return { ...base, error: `SQL 长度 ${sql.length} 字符超过上限 ${MAX_SQL_LENGTH.toLocaleString()} 字符` };
  }
  if (!NAME_PATTERN.test(namePrefix)) {
    return { ...base, error: `命名前缀「${namePrefix}」不合法，须匹配 [A-Za-z_][A-Za-z0-9_]*` };
  }

  let style: PlaceholderStyle | null;
  if (sourceStyle === AUTO_DETECT) {
    const detected = detectStyle(sql);
    if (detected.error) {
      return { ...base, error: detected.error, errorOffset: detected.errorOffset };
    }
    style = detected.style;
  } else {
    style = sourceStyle;
  }

  if (!style) {
    return { ...base, error: '未发现任何参数占位符，SQL 无需改写' };
  }

  const scanned = scanSql(sql, style);
  if (scanned.error) {
    return { ...base, detectedStyle: style, error: scanned.error, errorOffset: scanned.errorOffset };
  }
  const placeholders = placeholderTokens(scanned.tokens);
  if (placeholders.length === 0) {
    return { ...base, detectedStyle: style, error: '未发现任何参数占位符，SQL 无需改写' };
  }

  const sourceKind = STYLE_META_MAP[style].kind;
  if (sourceKind === 'numbered') {
    const numberedError = validateNumbered(placeholders);
    if (numberedError) {
      return { ...base, detectedStyle: style, error: numberedError };
    }
  }
  let namedWarnings: string[] = [];
  if (sourceKind === 'named') {
    namedWarnings = validateNamed(placeholders);
    if (namedWarnings[0]?.startsWith('占位符名称')) {
      const bad = placeholders.find((t) => !NAME_PATTERN.test(t.name ?? ''));
      return { ...base, detectedStyle: style, error: namedWarnings[0], errorOffset: bad?.offset ?? null };
    }
  }

  const targetKind = STYLE_META_MAP[targetStyle].kind;
  const expandNamed = sourceKind === 'named' && targetKind === 'positional';

  // 统一参数模型：同一逻辑参数（同名 / 同编号）复用一个序号并累计绑定次数；
  // 命名式 → 位置式时每次绑定独立编号（同名重复展开），参数清单仍按逻辑参数去重统计。
  const params: ParamEntry[] = [];
  const keyToIndex = new Map<string, number>();
  const registerParam = (key: string, displayName: string): number => {
    const existing = keyToIndex.get(key);
    if (existing !== undefined) {
      params[existing - 1]!.bindings += 1;
      return existing;
    }
    params.push({ index: params.length + 1, name: displayName, bindings: 1 });
    keyToIndex.set(key, params.length);
    return params.length;
  };

  // 每个占位符 token 对应的目标渲染；bindSeq 为位置式展开时的单调绑定序号
  const rendered: { token: SqlToken; text: string }[] = [];
  let bindSeq = 0;
  for (const token of placeholders) {
    bindSeq += 1;
    let renderText: string;

    if (sourceKind === 'positional') {
      const generated = `${namePrefix}${bindSeq}`;
      registerParam(`pos:${bindSeq}`, generated);
      renderText = renderPlaceholder(targetStyle, generated, bindSeq);
    } else if (sourceKind === 'numbered') {
      const num = token.number as number;
      const paramIndex = registerParam(`num:${num}`, `${namePrefix}${num}`);
      renderText = renderPlaceholder(targetStyle, `${namePrefix}${num}`, expandNamed ? bindSeq : paramIndex);
    } else {
      const name = token.name as string;
      const paramIndex = registerParam(`name:${name}`, name);
      renderText = renderPlaceholder(targetStyle, name, expandNamed ? bindSeq : paramIndex);
    }

    rendered.push({ token, text: renderText });
  }

  // 用渲染结果替换 token 序列中的占位符
  const placeholderQueue = [...rendered];
  const outputParts: string[] = [];
  for (const token of scanned.tokens) {
    if (token.kind === 'placeholder') {
      outputParts.push(placeholderQueue.shift()?.text ?? token.text);
    } else {
      outputParts.push(token.text);
    }
  }

  return {
    sql: outputParts.join(''),
    detectedStyle: style,
    params,
    totalBindings: placeholders.length,
    warnings: namedWarnings,
    error: null,
    errorOffset: null,
  };
}
