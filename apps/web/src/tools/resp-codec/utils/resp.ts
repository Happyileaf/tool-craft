/**
 * Redis RESP2/RESP3 协议编解码纯函数实现。
 *
 * 支持的类型前缀：
 *   + 简单字符串（Simple String）   - 错误（Error）
 *   : 整数（Integer）              $ 批量字符串（Bulk String，含 null）
 *   * 数组（Array，含 null）        _ RESP3 null
 *   , RESP3 双精度浮点             # RESP3 布尔
 *   ! RESP3 Bulk Error              = RESP3 Verbatim String
 *   ( RESP3 Big Number              ~ RESP3 Set
 *   | RESP3 Map                     > RESP3 Push
 * 另支持 telnet inline 命令的解析。
 */

/** RESP 数据节点 */
export interface RespNode {
  /** 类型标识，与协议前缀对应 */
  type:
    | 'simple-string'
    | 'error'
    | 'integer'
    | 'bulk-string'
    | 'array'
    | 'null'
    | 'double'
    | 'boolean'
    | 'bulk-error'
    | 'verbatim-string'
    | 'big-number'
    | 'set'
    | 'map'
    | 'push';
  /** 协议前缀字符 */
  prefix: string;
  /** 原始可读载荷：字符串值、数字文本、错误消息等 */
  value: string | null;
  /** 容器类型的子节点（array/set/push） */
  children: RespNode[] | null;
  /** map 类型的键值对子节点，按 [key, value] 成对排列 */
  entries: Array<[RespNode, RespNode]> | null;
  /** 逐字字符串的 3 字节编码提示，如 txt、md */
  verbatimEncoding: string | null;
  /** 原始协议文本（包含前缀与 CRLF） */
  raw: string;
}

const CRLF = '\r\n';

class RespParser {
  private position = 0;

  constructor(private readonly input: string) {}

  parseAll(): RespNode[] {
    const nodes: RespNode[] = [];
    this.skipLeadingBlankLines();
    while (this.position < this.input.length) {
      if (this.peek() === '\r' || this.peek() === '\n') {
        this.position += 1;
        continue;
      }
      nodes.push(this.parseNode());
    }
    return nodes;
  }

  private peek(): string {
    return this.input[this.position] ?? '';
  }

  private skipLeadingBlankLines(): void {
    while (this.peek() === '\r' || this.peek() === '\n') {
      this.position += 1;
    }
  }

  private readLine(): string {
    const crlf = this.input.indexOf(CRLF, this.position);
    if (crlf === -1) {
      throw new Error(`位置 ${this.position} 缺少 CRLF（\\r\\n）结束符`);
    }
    const line = this.input.slice(this.position, crlf);
    this.position = crlf + 2;
    return line;
  }

  private parseNode(): RespNode {
    const start = this.position;
    const prefix = this.peek();
    this.position += 1;

    switch (prefix) {
      case '+':
        return this.leaf('simple-string', prefix, this.readLine(), start);
      case '-':
        return this.leaf('error', prefix, this.readLine(), start);
      case ':':
        return this.leaf('integer', prefix, this.readLine(), start);
      case '_': {
        const line = this.readLine();
        if (line !== '') {
          throw new Error('RESP3 null（_）后必须立即跟 CRLF');
        }
        return this.leaf('null', prefix, null, start);
      }
      case ',':
        return this.leaf('double', prefix, this.readLine(), start);
      case '#': {
        const line = this.readLine();
        if (line !== 't' && line !== 'f') {
          throw new Error(`RESP3 布尔值只能是 t 或 f，实际为「${line}」`);
        }
        return this.leaf('boolean', prefix, line === 't' ? 'true' : 'false', start);
      }
      case '(':
        return this.leaf('big-number', prefix, this.readLine(), start);
      case '$':
        return this.parseBulkLike('bulk-string', prefix, start, false);
      case '!':
        return this.parseBulkLike('bulk-error', prefix, start, false);
      case '=':
        return this.parseBulkLike('verbatim-string', prefix, start, true);
      case '*':
        return this.parseCollection('array', prefix, start);
      case '~':
        return this.parseCollection('set', prefix, start);
      case '>':
        return this.parseCollection('push', prefix, start);
      case '|':
        return this.parseMap(start);
      default:
        throw new Error(`位置 ${start} 遇到不支持的 RESP 前缀「${prefix || '空'}」`);
    }
  }

  private leaf(
    type: RespNode['type'],
    prefix: string,
    value: string | null,
    start: number,
  ): RespNode {
    return {
      type,
      prefix,
      value,
      children: null,
      entries: null,
      verbatimEncoding: null,
      raw: this.input.slice(start, this.position),
    };
  }

  private parseBulkLike(
    type: RespNode['type'],
    prefix: string,
    start: number,
    verbatim: boolean,
  ): RespNode {
    const lengthLine = this.readLine();
    const length = Number(lengthLine);
    if (!Number.isInteger(length) || length < -1) {
      throw new Error(`非法的 ${prefix} 长度「${lengthLine}」`);
    }
    if (length === -1) {
      return {
        type: 'null',
        prefix,
        value: null,
        children: null,
        entries: null,
        verbatimEncoding: null,
        raw: this.input.slice(start, this.position),
      };
    }
    const payload = this.input.slice(this.position, this.position + length);
    if (payload.length < length) {
      throw new Error(`${prefix} 声明 ${length} 字节但数据被截断`);
    }
    this.position += length;
    if (this.input.slice(this.position, this.position + 2) !== CRLF) {
      throw new Error(`${prefix} 批量数据后缺少 CRLF`);
    }
    this.position += 2;

    let verbatimEncoding: string | null = null;
    let value = payload;
    if (verbatim) {
      if (length < 4 || payload[3] !== ':') {
        throw new Error('Verbatim String 必须以 3 字节编码提示加冒号开头（如 txt:）');
      }
      verbatimEncoding = payload.slice(0, 3);
      value = payload.slice(4);
    }

    return {
      type,
      prefix,
      value,
      children: null,
      entries: null,
      verbatimEncoding,
      raw: this.input.slice(start, this.position),
    };
  }

  private parseCollection(type: RespNode['type'], prefix: string, start: number): RespNode {
    const countLine = this.readLine();
    const count = Number(countLine);
    if (!Number.isInteger(count) || count < -1) {
      throw new Error(`非法的 ${prefix} 元素数量「${countLine}」`);
    }
    if (count === -1) {
      return {
        type: 'null',
        prefix,
        value: null,
        children: null,
        entries: null,
        verbatimEncoding: null,
        raw: this.input.slice(start, this.position),
      };
    }
    const children: RespNode[] = [];
    for (let i = 0; i < count; i += 1) {
      children.push(this.parseNode());
    }
    return {
      type,
      prefix,
      value: null,
      children,
      entries: null,
      verbatimEncoding: null,
      raw: this.input.slice(start, this.position),
    };
  }

  private parseMap(start: number): RespNode {
    const countLine = this.readLine();
    const count = Number(countLine);
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`非法的 Map 键值对数量「${countLine}」`);
    }
    const entries: Array<[RespNode, RespNode]> = [];
    for (let i = 0; i < count; i += 1) {
      const key = this.parseNode();
      const valueNode = this.parseNode();
      entries.push([key, valueNode]);
    }
    return {
      type: 'map',
      prefix: '|',
      value: null,
      children: null,
      entries,
      verbatimEncoding: null,
      raw: this.input.slice(start, this.position),
    };
  }
}

/**
 * 解析 RESP2/RESP3 协议文本，支持一个或多个并列的顶层消息
 */
export function parseResp(input: string): RespNode[] {
  if (input.trim() === '') {
    throw new Error('输入为空');
  }
  return new RespParser(input).parseAll();
}

/**
 * 解析 telnet inline 命令（空格分词，支持双引号），转换为 RESP 数组节点的协议文本
 */
export function parseInlineCommand(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed === '') {
    throw new Error('inline 命令为空');
  }
  const tokens: string[] = [];
  const regex = /"((?:\\.|[^"\\])*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(match[1].replace(/\\(.)/g, '$1'));
    } else {
      tokens.push(match[2]!);
    }
  }
  return tokens;
}

/** 把字符串编码为 RESP bulk string */
export function encodeBulkString(value: string): string {
  return `$${value.length}${CRLF}${value}${CRLF}`;
}

/**
 * 把 inline 命令字符串编码为标准 RESP2 数组协议文本
 */
export function encodeInlineToResp(line: string): string {
  const tokens = parseInlineCommand(line);
  return `*${tokens.length}${CRLF}${tokens.map(encodeBulkString).join('')}`;
}

/** 把任意 JS 值构造为 RESP 协议文本（用于教学/测试的轻量编码器） */
export function encodeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return `_${CRLF}`;
  }
  if (typeof value === 'boolean') {
    return `#${value ? 't' : 'f'}${CRLF}`;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `:${value}${CRLF}` : `,${value}${CRLF}`;
  }
  if (typeof value === 'bigint') {
    return `(${value.toString()}${CRLF}`;
  }
  if (Array.isArray(value)) {
    return `*${value.length}${CRLF}${value.map(encodeValue).join('')}`;
  }
  if (value instanceof Error) {
    return `-${value.message}${CRLF}`;
  }
  if (typeof value === 'object') {
    const pairs = Object.entries(value as Record<string, unknown>);
    return `|${pairs.length}${CRLF}${pairs
      .map(([key, val]) => `${encodeBulkString(key)}${encodeValue(val)}`)
      .join('')}`;
  }
  return encodeBulkString(String(value));
}

/** 节点类型的中文标签 */
export const TYPE_LABELS: Record<RespNode['type'], string> = {
  'simple-string': '简单字符串',
  error: '错误',
  integer: '整数',
  'bulk-string': '批量字符串',
  array: '数组',
  null: 'Null',
  double: '双精度浮点',
  boolean: '布尔',
  'bulk-error': '批量错误',
  'verbatim-string': '逐字字符串',
  'big-number': '大整数',
  set: '集合',
  map: '字典',
  push: 'Push',
};
