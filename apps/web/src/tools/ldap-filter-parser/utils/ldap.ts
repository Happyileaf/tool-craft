/**
 * RFC 4515 LDAP 搜索过滤器的递归下降解析器与序列化器（纯函数）。
 *
 * 文法（简化）：
 *   filter    = LPAREN filtercomp RPAREN
 *   filtercomp= and / or / not / item
 *   and       = '&' filter-list
 *   or        = '|' filter-list
 *   not       = '!' filter
 *   item      = presence / equality / substrings / ge / le / approx
 * 同时处理 RFC 4514/4515 的 \HH 十六进制转义。
 */

/** 叶子（比较型）过滤器节点 */
export interface FilterItem {
  kind: 'item';
  /** 属性描述，例如 cn、objectClass */
  attribute: string;
  /** 比较操作符 */
  operator: '=' | '>=' | '<=' | '~=';
  /** 断言值的原始（已反转义）文本 */
  value: string;
  /** 是否为 presence 过滤器 (attr=*) */
  presence: boolean;
  /** 子串断言拆分：前缀/包含片段/后缀，非子串表达式时为 null */
  substrings: { initial: string | null; any: string[]; final: string | null } | null;
}

/** 逻辑组合节点（and / or / not） */
export interface FilterLogic {
  kind: 'and' | 'or' | 'not';
  /** 子节点；not 恰好一个，and/or 至少一个 */
  children: FilterNode[];
}

/** 过滤器 AST 节点联合类型 */
export type FilterNode = FilterItem | FilterLogic;

/** 解析结果 */
export interface ParseResult {
  root: FilterNode;
  /** 规范化回写的过滤器字符串 */
  normalized: string;
}

const ATTRIBUTE_CHARS = /[a-zA-Z0-9.;-]/;

/**
 * 把 RFC 4515 断言值中的 \HH 转义还原为可读字符
 */
export function unescapeAssertionValue(raw: string): string {
  return raw.replace(/\\([0-9a-fA-F]{2})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

/**
 * 把可读字符串按 RFC 4515 规则转义：
 * 保留 * 与 () 由调用方决定，这里仅转义必须转义的 * ( ) \ \0 及非 ASCII
 */
export function escapeAssertionValue(value: string): string {
  let output = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (char === '*' || char === '(' || char === ')' || char === '\\' || char === '\0') {
      output += `\\${code.toString(16).padStart(2, '0')}`;
    } else if (code > 127) {
      // 非 ASCII 按 UTF-8 字节逐字节转义
      for (const byte of new TextEncoder().encode(char)) {
        output += `\\${byte.toString(16).padStart(2, '0')}`;
      }
    } else {
      output += char;
    }
  }
  return output;
}

class Parser {
  private position = 0;

  constructor(private readonly input: string) {}

  parse(): FilterNode {
    this.skipSpaces();
    const node = this.parseFilter();
    this.skipSpaces();
    if (this.position !== this.input.length) {
      throw new Error(`位置 ${this.position} 之后存在未消费的字符「${this.peek()}」`);
    }
    return node;
  }

  private peek(): string {
    return this.input[this.position] ?? '';
  }

  private skipSpaces(): void {
    while (this.peek() === ' ') {
      this.position += 1;
    }
  }

  private parseFilter(): FilterNode {
    this.skipSpaces();
    if (this.peek() !== '(') {
      throw new Error(`位置 ${this.position} 期望「(」，实际为「${this.peek() || '空'}」`);
    }
    this.position += 1;
    const node = this.parseFilterComp();
    this.skipSpaces();
    if (this.peek() !== ')') {
      throw new Error(`位置 ${this.position} 期望「)」，实际为「${this.peek() || '空'}」`);
    }
    this.position += 1;
    return node;
  }

  private parseFilterComp(): FilterNode {
    this.skipSpaces();
    const char = this.peek();
    if (char === '&' || char === '|') {
      this.position += 1;
      const children = this.parseFilterList();
      if (children.length === 0) {
        throw new Error(`「${char}」组合至少需要一个子过滤器`);
      }
      return { kind: char === '&' ? 'and' : 'or', children };
    }
    if (char === '!') {
      this.position += 1;
      const child = this.parseFilter();
      return { kind: 'not', children: [child] };
    }
    return this.parseItem();
  }

  private parseFilterList(): FilterNode[] {
    const children: FilterNode[] = [];
    this.skipSpaces();
    while (this.peek() === '(') {
      children.push(this.parseFilter());
      this.skipSpaces();
    }
    return children;
  }

  private parseItem(): FilterItem {
    const start = this.position;
    let attribute = '';
    while (this.position < this.input.length && ATTRIBUTE_CHARS.test(this.peek())) {
      attribute += this.peek();
      this.position += 1;
    }
    if (attribute === '') {
      throw new Error(`位置 ${start} 缺少合法的属性描述`);
    }

    const operator = this.parseOperator();
    const rawValue = this.parseValueRaw();
    const value = unescapeAssertionValue(rawValue);

    const presence = rawValue === '*';
    const substrings = rawValue.includes('*') && !presence
      ? this.splitSubstrings(rawValue)
      : null;

    return {
      kind: 'item',
      attribute,
      operator,
      value,
      presence,
      substrings,
    };
  }

  private parseOperator(): FilterItem['operator'] {
    const remaining = this.input.slice(this.position);
    if (remaining.startsWith('>=')) {
      this.position += 2;
      return '>=';
    }
    if (remaining.startsWith('<=')) {
      this.position += 2;
      return '<=';
    }
    if (remaining.startsWith('~=')) {
      this.position += 2;
      return '~=';
    }
    if (this.peek() === '=') {
      this.position += 1;
      return '=';
    }
    throw new Error(`位置 ${this.position} 缺少比较操作符（=、>=、<=、~=）`);
  }

  private parseValueRaw(): string {
    let raw = '';
    while (this.position < this.input.length) {
      const char = this.peek();
      if (char === ')') {
        break;
      }
      if (char === '(') {
        throw new Error(`位置 ${this.position} 的断言值中出现未转义的「(」`);
      }
      if (char === '\\') {
        const hex = this.input.slice(this.position + 1, this.position + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
          throw new Error(`位置 ${this.position} 的转义序列「\\${hex}」不是两位十六进制`);
        }
        raw += `\\${hex}`;
        this.position += 3;
      } else {
        raw += char;
        this.position += 1;
      }
    }
    return raw;
  }

  private splitSubstrings(raw: string): FilterItem['substrings'] {
    const pieces: string[] = [];
    let current = '';
    let i = 0;
    while (i < raw.length) {
      const char = raw[i]!;
      if (char === '\\') {
        current += raw.slice(i, i + 3);
        i += 3;
      } else if (char === '*') {
        pieces.push(current);
        current = '';
        i += 1;
      } else {
        current += char;
        i += 1;
      }
    }
    pieces.push(current);

    const initial = raw.startsWith('*') ? null : unescapeAssertionValue(pieces[0]!);
    const final = raw.endsWith('*') ? null : unescapeAssertionValue(pieces[pieces.length - 1]!);
    const any = pieces
      .slice(1, pieces.length - 1)
      .map((piece) => unescapeAssertionValue(piece))
      .filter((piece) => piece !== '');
    return { initial, any, final };
  }
}

/**
 * 解析 RFC 4515 过滤器字符串，返回 AST 与规范化文本
 */
export function parseLdapFilter(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('过滤器不能为空');
  }
  const root = new Parser(trimmed).parse();
  return { root, normalized: serializeFilter(root) };
}

/**
 * 把 AST 规范化回 RFC 4515 文本（叶子值重新转义）
 */
export function serializeFilter(node: FilterNode): string {
  if (node.kind === 'item') {
    const value = node.presence
      ? '*'
      : node.substrings
        ? serializeSubstrings(node.substrings)
        : escapeAssertionValue(node.value);
    return `(${node.attribute}${node.operator}${value})`;
  }
  const symbol = node.kind === 'and' ? '&' : node.kind === 'or' ? '|' : '!';
  return `(${symbol}${node.children.map(serializeFilter).join('')})`;
}

function serializeSubstrings(sub: NonNullable<FilterItem['substrings']>): string {
  const initial = sub.initial === null ? '' : escapeAssertionValue(sub.initial);
  const middle = sub.any.map((piece) => `${escapeAssertionValue(piece)}*`).join('');
  const finalPart = sub.final === null ? '' : escapeAssertionValue(sub.final);
  return `${initial}*${middle}${finalPart}`;
}

/** 遍历 AST，先序访问每个节点 */
export function walkFilter(
  node: FilterNode,
  visitor: (node: FilterNode, depth: number) => void,
  depth = 0,
): void {
  visitor(node, depth);
  if (node.kind !== 'item') {
    node.children.forEach((child) => walkFilter(child, visitor, depth + 1));
  }
}

/** 统计 AST 中的叶子断言数量 */
export function countItems(node: FilterNode): number {
  if (node.kind === 'item') {
    return 1;
  }
  return node.children.reduce((sum, child) => sum + countItems(child), 0);
}
