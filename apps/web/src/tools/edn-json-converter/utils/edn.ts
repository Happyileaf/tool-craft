/**
 * Clojure EDN（Extensible Data Notation）解析与生成的纯函数实现。
 *
 * 支持的数据形式（EDN 规范的内置元素）：
 * - nil、布尔 true/false
 * - 字符串（含 \t \n \r \\ \" \uXXXX 等转义）
 * - 整数与浮点数字（含负号、指数）
 * - 符号 symbol（含命名空间 foo/bar）与关键字 :keyword（含 :: 别名形式按普通关键字处理）
 * - 列表 (…)、向量 […]、集合 #{…}、映射 {…}
 * - #inst "..." 与 #uuid "..." 带标签值
 *
 * 与 JSON 互转时的映射约定：
 * - 关键字在 JS 侧表示为 { "___edn_type": "keyword", "value": ":foo" }；
 * - 符号表示为 { "___edn_type": "symbol", "value": "bar" }；
 * - 集合表示为 { "___edn_type": "set", "items": [...] }；
 * - #inst/#uuid 表示为 { "___edn_type": "inst"|"uuid", "value": "..." }；
 * - 列表与向量都映射为 JSON 数组，列表元素带有序标记（list）。
 */

/** EDN 带类型标记的 JS 表示 */
export type EdnTagged = {
  ___edn_type: 'keyword' | 'symbol' | 'set' | 'list' | 'inst' | 'uuid';
  value?: string;
  items?: unknown[];
};

type EdnValue =
  | null
  | boolean
  | string
  | number
  | EdnValue[]
  | { [key: string]: EdnValue }
  | EdnTagged;

const TAG_KEY = '___edn_type';

/** EDN 词法分析器产生的 token 类型 */
type TokenType =
  | 'nil'
  | 'boolean'
  | 'string'
  | 'number'
  | 'symbol'
  | 'keyword'
  | 'lparen'
  | 'rparen'
  | 'lbracket'
  | 'rbracket'
  | 'lbrace'
  | 'rbrace'
  | 'set-start'
  | 'tag';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/** 词法分析：把 EDN 文本切分为 token 流，字符串与分隔符分别处理 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  const isWhitespace = (char: string) => /[\s,]/.test(char);
  const terminators = new Set(['(', ')', '[', ']', '{', '}', ';']);
  const isTerminator = (char: string | undefined) =>
    char === undefined || isWhitespace(char) || terminators.has(char);
  while (index < input.length) {
    const char = input[index];

    if (char === undefined) {
      break;
    }
    if (isWhitespace(char)) {
      index += 1;
      continue;
    }
    // 注释：分号到行尾
    if (char === ';') {
      while (index < input.length && input[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    const start = index;

    // 字符串
    if (char === '"') {
      index += 1;
      let value = '';
      while (index < input.length && input[index] !== '"') {
        const current = input[index];
        if (current === '\\') {
          const next = input[index + 1];
          if (next === undefined) {
            throw new EdnError('字符串转义不完整', index);
          }
          value += decodeEscape(next, input, index);
          index += next === 'u' ? 6 : 2;
          continue;
        }
        value += current;
        index += 1;
      }
      if (input[index] !== '"') {
        throw new EdnError('字符串缺少闭合引号', start);
      }
      index += 1;
      tokens.push({ type: 'string', value, position: start });
      continue;
    }

    // 分隔符
    const delimiters: Record<string, TokenType> = {
      '(': 'lparen',
      ')': 'rparen',
      '[': 'lbracket',
      ']': 'rbracket',
      '{': 'lbrace',
      '}': 'rbrace',
    };
    if (delimiters[char] !== undefined) {
      // #{ 集合起始
      if (char === '{' && input[start - 1] === '#') {
        tokens.pop();
        tokens.push({ type: 'set-start', value: '#{', position: start - 1 });
      } else {
        tokens.push({ type: delimiters[char], value: char, position: start });
      }
      index += 1;
      continue;
    }

    // 丢弃单独的 #（集合前缀已在上方合并）
    if (char === '#') {
      // 带标签值 #inst / #uuid / #tag
      let lookahead = index + 1;
      let tag = '';
      while (lookahead < input.length && !isTerminator(input[lookahead])) {
        tag += input[lookahead];
        lookahead += 1;
      }
      if (tag === '{') {
        // 交给下一轮处理为 set-start
        index += 1;
        continue;
      }
      tokens.push({ type: 'tag', value: tag, position: start });
      index = lookahead;
      continue;
    }

    // 关键字
    if (char === ':') {
      let value = '';
      index += 1;
      while (index < input.length && !isTerminator(input[index])) {
        value += input[index];
        index += 1;
      }
      tokens.push({ type: 'keyword', value, position: start });
      continue;
    }

    // 裸原子（nil/boolean/number/symbol）
    let atom = '';
    while (index < input.length && !isTerminator(input[index])) {
      atom += input[index];
      index += 1;
    }
    if (atom === 'nil') {
      tokens.push({ type: 'nil', value: atom, position: start });
    } else if (atom === 'true' || atom === 'false') {
      tokens.push({ type: 'boolean', value: atom, position: start });
    } else if (isNumericLiteral(atom)) {
      tokens.push({ type: 'number', value: atom, position: start });
    } else {
      tokens.push({ type: 'symbol', value: atom, position: start });
    }
  }

  return tokens;
}

/** 处理字符串内反斜杠转义，\uXXXX 一次消费 6 个字符 */
function decodeEscape(next: string, input: string, backslashIndex: number): string {
  switch (next) {
    case 't':
      return '\t';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    case '"':
      return '"';
    case '\\':
      return '\\';
    case 'u': {
      const hex = input.slice(backslashIndex + 2, backslashIndex + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        throw new EdnError(`非法 Unicode 转义: \\u${hex}`, backslashIndex);
      }
      return String.fromCharCode(parseInt(hex, 16));
    }
    default:
      return next;
  }
}

/** 判断原子是否为数字字面量（整数、浮点、指数） */
function isNumericLiteral(atom: string): boolean {
  return /^[+-]?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(atom);
}

/** 自定义错误，携带字符位置便于 UI 定位 */
export class EdnError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(`${message}（位置 ${position}）`);
    this.name = 'EdnError';
    this.position = position;
  }
}

/** 递归下降解析器 */
class EdnParser {
  private cursor = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): EdnValue {
    if (this.tokens.length === 0) {
      throw new EdnError('EDN 内容为空', 0);
    }
    const value = this.readValue();
    if (this.cursor < this.tokens.length) {
      const extra = this.tokens[this.cursor];
      throw new EdnError(`存在多余的 token: ${extra?.value ?? ''}`, extra?.position ?? 0);
    }
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.cursor];
  }

  private advance(): Token {
    const token = this.tokens[this.cursor];
    if (token === undefined) {
      throw new EdnError('意外的输入结束', 0);
    }
    this.cursor += 1;
    return token;
  }

  private readValue(): EdnValue {
    const token = this.peek();
    if (token === undefined) {
      throw new EdnError('意外的输入结束', 0);
    }

    switch (token.type) {
      case 'nil':
        this.advance();
        return null;
      case 'boolean':
        this.advance();
        return token.value === 'true';
      case 'string':
        this.advance();
        return token.value;
      case 'number':
        this.advance();
        return Number(token.value);
      case 'keyword':
        this.advance();
        return { ___edn_type: 'keyword', value: `:${token.value}` };
      case 'symbol':
        this.advance();
        return { ___edn_type: 'symbol', value: token.value };
      case 'tag':
        return this.readTagged();
      case 'lparen':
        return this.readSequence('lparen', 'rparen', 'list');
      case 'lbracket':
        return this.readSequence('lbracket', 'rbracket', undefined);
      case 'set-start':
        return this.readSequence('set-start', 'rbrace', 'set');
      case 'lbrace':
        return this.readMap();
      default:
        throw new EdnError(`意外的 token: ${token.value}`, token.position);
    }
  }

  private readSequence(
    open: TokenType,
    close: TokenType,
    wrapper: 'list' | 'set' | undefined,
  ): EdnValue {
    const openToken = this.advance();
    const items: EdnValue[] = [];
    while (this.peek()?.type !== close) {
      if (this.peek() === undefined) {
        throw new EdnError('集合缺少闭合分隔符', openToken.position);
      }
      items.push(this.readValue());
    }
    this.advance(); // 消费闭合符

    if (wrapper === 'list') {
      return { ___edn_type: 'list', items };
    }
    if (wrapper === 'set') {
      return { ___edn_type: 'set', items };
    }
    return items;
  }

  private readMap(): EdnValue {
    const openToken = this.advance();
    const result: Record<string, EdnValue> = {};
    while (this.peek()?.type !== 'rbrace') {
      if (this.peek() === undefined) {
        throw new EdnError('映射缺少闭合 }', openToken.position);
      }
      const keyToken = this.readValue();
      const key = this.mapKeyToString(keyToken);
      if (this.peek()?.type === 'rbrace' || this.peek() === undefined) {
        throw new EdnError(`映射键 ${key} 缺少对应的值`, openToken.position);
      }
      const value = this.readValue();
      result[key] = value;
    }
    this.advance();
    return result;
  }

  /** 映射键统一转字符串，关键字键去掉外层标记保留 : 前缀 */
  private mapKeyToString(key: EdnValue): string {
    if (typeof key === 'object' && key !== null && TAG_KEY in key) {
      const tagged = key as EdnTagged;
      if (tagged.___edn_type === 'keyword' && tagged.value !== undefined) {
        return tagged.value;
      }
      if (tagged.value !== undefined) {
        return tagged.value;
      }
    }
    if (typeof key === 'string' || typeof key === 'number' || typeof key === 'boolean') {
      return String(key);
    }
    return JSON.stringify(key);
  }

  private readTagged(): EdnValue {
    const tagToken = this.advance();
    const valueToken = this.peek();
    if (valueToken === undefined || valueToken.type !== 'string') {
      throw new EdnError(`#${tagToken.value} 标签后必须紧跟字符串`, tagToken.position);
    }
    this.advance();
    const tagName = tagToken.value;
    if (tagName === 'inst' || tagName === 'uuid') {
      return { ___edn_type: tagName, value: valueToken.value };
    }
    // 其他标签保留符号名与值
    return { ___edn_type: 'symbol', value: `#${tagName} ${valueToken.value}` };
  }
}

/**
 * 解析 EDN 文本为带类型标记的 JS 数据。
 *
 * @param input - EDN 文本
 * @returns 解析后的 JS 数据（关键字/集合等带 ___edn_type 标记）
 */
export function parseEdn(input: string): EdnValue {
  const tokens = tokenize(input);
  return new EdnParser(tokens).parse();
}

/**
 * 把 EDN 文本转换为 JSON 字符串。
 *
 * @param input - EDN 文本
 * @param indent - 缩进空格数
 */
export function ednToJson(input: string, indent = 2): string {
  const parsed = parseEdn(input);
  return JSON.stringify(parsed, null, indent);
}

/**
 * 把 JSON 文本转换为 EDN 字符串。
 *
 * 识别 ___edn_type 标记以还原关键字、符号、集合与标签值。
 *
 * @param input - JSON 文本
 * @param indent - EDN 输出缩进空格数（0 表示紧凑）
 */
export function jsonToEdn(input: string, indent = 2): string {
  const parsed = JSON.parse(input) as EdnValue;
  return serializeEdn(parsed, indent, 0);
}

/** 递归序列化 JS 数据为 EDN 文本 */
function serializeEdn(value: EdnValue, indent: number, depth: number): string {
  if (value === null) {
    return 'nil';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'nil';
  }
  if (typeof value === 'string') {
    return `"${escapeEdnString(value)}"`;
  }

  if (Array.isArray(value)) {
    return serializeCollection('[', ']', value, indent, depth);
  }

  if (typeof value === 'object' && TAG_KEY in value) {
    return serializeTagged(value as EdnTagged, indent, depth);
  }

  if (typeof value === 'object') {
    return serializeMap(value as Record<string, EdnValue>, indent, depth);
  }

  throw new EdnError(`无法序列化的值类型: ${typeof value}`, 0);
}

function serializeTagged(tagged: EdnTagged, indent: number, depth: number): string {
  switch (tagged.___edn_type) {
    case 'keyword':
      return tagged.value ?? '';
    case 'symbol':
      return tagged.value ?? '';
    case 'inst':
    case 'uuid':
      return `#${tagged.___edn_type} "${tagged.value ?? ''}"`;
    case 'list':
      return serializeCollection('(', ')', tagged.items ?? [], indent, depth);
    case 'set':
      return serializeCollection('#{', '}', tagged.items ?? [], indent, depth);
    default:
      throw new EdnError(`未知 EDN 标记类型: ${tagged.___edn_type}`, 0);
  }
}

function serializeCollection(
  open: string,
  close: string,
  items: unknown[],
  indent: number,
  depth: number,
): string {
  if (items.length === 0) {
    return open === '#{' ? '#{}' : `${open}${close}`;
  }
  if (indent === 0) {
    return `${open}${items
      .map((item) => serializeEdn(item as EdnValue, 0, depth + 1))
      .join(' ')}${close}`;
  }
  const innerPad = ' '.repeat(indent * (depth + 1));
  const outerPad = ' '.repeat(indent * depth);
  const body = items
    .map((item) => `${innerPad}${serializeEdn(item as EdnValue, indent, depth + 1)}`)
    .join('\n');
  return `${open}\n${body}\n${outerPad}${close}`;
}

function serializeMap(
  record: Record<string, EdnValue>,
  indent: number,
  depth: number,
): string {
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return '{}';
  }
  if (indent === 0) {
    return `{${entries
      .map(([key, value]) => `${formatMapKey(key)} ${serializeEdn(value, 0, depth + 1)}`)
      .join(', ')}}`;
  }
  const innerPad = ' '.repeat(indent * (depth + 1));
  const outerPad = ' '.repeat(indent * depth);
  const body = entries
    .map(
      ([key, value]) =>
        `${innerPad}${formatMapKey(key)} ${serializeEdn(value, indent, depth + 1)}`,
    )
    .join('\n');
  return `{\n${body}\n${outerPad}}`;
}

/** 映射键输出：以 : 开头的字符串还原为 EDN 关键字，其余加引号 */
function formatMapKey(key: string): string {
  if (/^:[A-Za-z0-9_./:-]+$/.test(key)) {
    return key;
  }
  return `"${escapeEdnString(key)}"`;
}

/** EDN 字符串转义 */
function escapeEdnString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/** 示例 EDN */
export const SAMPLE_EDN = `{
  :person/id #uuid "550e8400-e29b-41d4-a716-446655440000"
  :person/name "Alice"
  :person/active true
  :person/tags #{:admin :editor}
  :person/roles ["owner" "writer"]
  :person/login-history (1024 2048 4096)
  :person/created-at #inst "2026-11-12T10:00:00Z"
  :person/score 3.14
}`;
