/**
 * 零依赖 JSON5 解析与「合法 JSON 降级为 JSON5 友好形态」纯函数。
 * 支持：// 与 / * * / 注释、单引号字符串、未加引号标识符键、
 * 尾逗号、十六进制 / 正负无穷 / NaN、前导小数点、正号数字、
 * 多行字符串（行尾反斜杠续行）与字符串转义。全部本地运行。
 */

/** 解析结果 */
export interface Json5Result {
  /** 解析出的值；失败为 null */
  output: unknown;
  /** 错误信息；成功为 null */
  error: string | null;
}

/** 行、列位置 */
interface Position {
  line: number;
  column: number;
  offset: number;
}

class Json5Parser {
  private pos = 0;

  constructor(private readonly text: string) {}

  parse(): unknown {
    const value = this.parseValue();
    this.skipWhitespaceAndComments();
    if (this.pos < this.text.length) {
      throw this.error(`JSON 内容结束后存在多余字符「${this.current()}」`);
    }
    return value;
  }

  private current(): string {
    return this.text[this.pos] ?? '';
  }

  private position(): Position {
    let line = 1;
    let column = 1;
    for (let i = 0; i < this.pos; i += 1) {
      if (this.text[i] === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
    return { line, column, offset: this.pos };
  }

  private error(message: string): Error {
    const { line, column } = this.position();
    return new Error(`第 ${line} 行第 ${column} 列：${message}`);
  }

  /** 跳过空白与注释（// 行注释与 / * 块注释 * /） */
  private skipWhitespaceAndComments(): void {
    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        this.pos += 1;
      } else if (char === '/' && this.text[this.pos + 1] === '/') {
        this.pos += 2;
        while (this.pos < this.text.length && this.text[this.pos] !== '\n') {
          this.pos += 1;
        }
      } else if (char === '/' && this.text[this.pos + 1] === '*') {
        this.pos += 2;
        const end = this.text.indexOf('*/', this.pos);
        if (end === -1) {
          throw this.error('块注释缺少结束标记 */');
        }
        this.pos = end + 2;
      } else {
        break;
      }
    }
  }

  private parseValue(): unknown {
    this.skipWhitespaceAndComments();
    if (this.pos >= this.text.length) {
      throw this.error('内容意外结束，缺少值');
    }
    const char = this.current();
    if (char === '{') {
      return this.parseObject();
    }
    if (char === '[') {
      return this.parseArray();
    }
    if (char === '"' || char === "'") {
      return this.parseString(char);
    }
    if (char === '-' || char === '+' || char === '.' || this.isDigit(char)) {
      // 带符号的 Infinity：+Infinity / -Infinity
      if (
        (char === '-' || char === '+') &&
        (this.text.startsWith('Infinity', this.pos + 1) || this.text.startsWith('NaN', this.pos + 1))
      ) {
        const sign = char === '-' ? -1 : 1;
        const token = this.text.startsWith('Infinity', this.pos + 1) ? 'Infinity' : 'NaN';
        this.pos += 1 + token.length;
        return token === 'Infinity' ? sign * Number.POSITIVE_INFINITY : Number.NaN;
      }
      return this.parseNumber();
    }
    return this.parseLiteral();
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_' ||
      char === '$'
    );
  }

  private isIdentifierPart(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }

  private parseObject(): Record<string, unknown> {
    this.pos += 1; // 消费 {
    const result: Record<string, unknown> = {};
    this.skipWhitespaceAndComments();
    if (this.current() === '}') {
      this.pos += 1;
      return result;
    }

    for (;;) {
      this.skipWhitespaceAndComments();
      const key = this.parseKey();
      this.skipWhitespaceAndComments();
      if (this.current() !== ':') {
        throw this.error(`对象键「${key}」后应为冒号「:」，实际为「${this.current() || '结束'}」`);
      }
      this.pos += 1;
      const value = this.parseValue();
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        throw this.error(`对象存在重复键「${key}」`);
      }
      result[key] = value;
      this.skipWhitespaceAndComments();
      if (this.current() === ',') {
        this.pos += 1;
        this.skipWhitespaceAndComments();
        if (this.current() === '}') {
          this.pos += 1;
          return result; // 尾逗号
        }
        continue;
      }
      if (this.current() === '}') {
        this.pos += 1;
        return result;
      }
      if (this.pos >= this.text.length) {
        throw this.error('对象意外结束，缺少逗号后的成员或结束花括号「}」');
      }
      throw this.error(`对象成员后应为逗号「,」或结束花括号「}」，实际为「${this.current()}」`);
    }
  }

  private parseKey(): string {
    const char = this.current();
    if (char === '"' || char === "'") {
      return this.parseString(char);
    }
    // 未加引号的标识符键（ES5.1 IdentifierName 子集）
    if (this.isIdentifierStart(char)) {
      const start = this.pos;
      this.pos += 1;
      while (this.pos < this.text.length && this.isIdentifierPart(this.text[this.pos] ?? '')) {
        this.pos += 1;
      }
      return this.text.slice(start, this.pos);
    }
    // JSON5 也允许数字字面量形式的键（如 { 123: "x" }）
    if (this.isDigit(char)) {
      return String(this.parseNumber());
    }
    throw this.error(`无法识别的对象键起始字符「${char || '结束'}」`);
  }

  private parseArray(): unknown[] {
    this.pos += 1; // 消费 [
    const result: unknown[] = [];
    this.skipWhitespaceAndComments();
    if (this.current() === ']') {
      this.pos += 1;
      return result;
    }

    for (;;) {
      this.skipWhitespaceAndComments();
      if (this.current() === ']') {
        this.pos += 1;
        return result;
      }
      result.push(this.parseValue());
      this.skipWhitespaceAndComments();
      if (this.current() === ',') {
        this.pos += 1;
        this.skipWhitespaceAndComments();
        if (this.current() === ']') {
          this.pos += 1;
          return result; // 尾逗号
        }
        continue;
      }
      if (this.current() === ']') {
        this.pos += 1;
        return result;
      }
      if (this.pos >= this.text.length) {
        throw this.error('数组意外结束，缺少逗号后的元素或结束方括号「]」');
      }
      throw this.error(`数组元素后应为逗号「,」或结束方括号「]」，实际为「${this.current()}」`);
    }
  }

  /** 解析单 / 双引号字符串，支持常见转义与行尾反斜杠续行 */
  private parseString(quote: string): string {
    this.pos += 1; // 消费起始引号
    let result = '';

    while (this.pos < this.text.length) {
      const char = this.text[this.pos];
      if (char === quote) {
        this.pos += 1;
        return result;
      }
      if (char === '\n') {
        throw this.error('字符串中出现未转义的换行；多行文本需使用行尾反斜杠或 \\n 转义');
      }
      if (char === '\\') {
        const next = this.text[this.pos + 1];
        if (next === undefined) {
          throw this.error('字符串在转义符处意外结束');
        }
        if (next === '\r' || next === '\n') {
          // 行尾续行：消费 CR/LF（含 CRLF），跳过随后的空白
          this.pos += 2;
          if (next === '\r' && this.text[this.pos] === '\n') {
            this.pos += 1;
          }
          while (this.pos < this.text.length && /[ \t]/.test(this.text[this.pos] ?? '')) {
            this.pos += 1;
          }
          continue;
        }
        result += this.readEscapeSequence();
        continue;
      }
      result += char;
      this.pos += 1;
    }
    throw this.error(`字符串缺少结束引号「${quote}」`);
  }

  /** 位于反斜杠处，读取并返回一个转义字符 */
  private readEscapeSequence(): string {
    this.pos += 1; // 消费反斜杠
    const char = this.text[this.pos] ?? '';
    const simpleEscapes: Record<string, string> = {
      '"': '"',
      "'": "'",
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
      v: '\v',
      '0': '\0',
    };
    const escaped: string | undefined = simpleEscapes[char];
    if (escaped !== undefined) {
      this.pos += 1;
      return escaped;
    }
    if (char === 'x') {
      this.pos += 1;
      const hex = this.text.slice(this.pos, this.pos + 2);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
        throw this.error(`非法的 \\x 十六进制转义「${hex}」`);
      }
      this.pos += 2;
      return String.fromCharCode(parseInt(hex, 16));
    }
    if (char === 'u') {
      this.pos += 1;
      // 代理对 \uXXXX\uXXXX 由两次转义自然拼接；花括号形式 \u{XX...} 也支持
      if (this.text[this.pos] === '{') {
        this.pos += 1;
        const end = this.text.indexOf('}', this.pos);
        if (end === -1) {
          throw this.error('\\u{...} 转义缺少右花括号');
        }
        const hex = this.text.slice(this.pos, end);
        if (!/^[0-9a-fA-F]+$/.test(hex)) {
          throw this.error(`非法的 \\u{...} 码点转义「${hex}」`);
        }
        const codePoint = parseInt(hex, 16);
        if (codePoint > 0x10ffff) {
          throw this.error(`Unicode 码点 ${hex} 超出 0x10FFFF 范围`);
        }
        this.pos = end + 1;
        return String.fromCodePoint(codePoint);
      }
      const hex = this.text.slice(this.pos, this.pos + 4);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        throw this.error(`非法的 \\uXXXX Unicode 转义「${hex}」`);
      }
      this.pos += 4;
      return String.fromCharCode(parseInt(hex, 16));
    }
    if (char === '\n' || char === '\r') {
      // 裸 CR/LF 续行（防御）
      if (char === '\r' && this.text[this.pos + 1] === '\n') {
        this.pos += 2;
      } else {
        this.pos += 1;
      }
      return '';
    }
    throw this.error(`非法的字符串转义「\\${char ?? ''}」`);
  }

  private parseNumber(): number {
    const start = this.pos;
    if (this.text[this.pos] === '+' || this.text[this.pos] === '-') {
      this.pos += 1;
    }
    // 十六进制整数 0x...
    if (this.text[this.pos] === '0' && (this.text[this.pos + 1] === 'x' || this.text[this.pos + 1] === 'X')) {
      this.pos += 2;
      const hexStart = this.pos;
      while (this.pos < this.text.length && /[0-9a-fA-F]/.test(this.text[this.pos] ?? '')) {
        this.pos += 1;
      }
      if (hexStart === this.pos) {
        throw this.error('0x 后至少需要一个十六进制数字');
      }
      this.assertNumberBoundary();
      return parseInt(this.text.slice(hexStart, this.pos), 16);
    }

    // 十进制：允许前导小数点
    while (this.pos < this.text.length && this.isDigit(this.text[this.pos] ?? '')) {
      this.pos += 1;
    }
    if (this.text[this.pos] === '.') {
      this.pos += 1;
      while (this.pos < this.text.length && this.isDigit(this.text[this.pos] ?? '')) {
        this.pos += 1;
      }
    }
    // 指数
    if (this.text[this.pos] === 'e' || this.text[this.pos] === 'E') {
      this.pos += 1;
      if (this.text[this.pos] === '+' || this.text[this.pos] === '-') {
        this.pos += 1;
      }
      const expStart = this.pos;
      while (this.pos < this.text.length && this.isDigit(this.text[this.pos] ?? '')) {
        this.pos += 1;
      }
      if (expStart === this.pos) {
        throw this.error('科学计数法指数部分至少需要一个数字');
      }
    }
    this.assertNumberBoundary();
    const raw = this.text.slice(start, this.pos);
    return Number(raw);
  }

  /** 数字后必须是结构分隔符或结束，防止把 123abc 当成数字 */
  private assertNumberBoundary(): void {
    const next = this.text[this.pos];
    if (next !== undefined && !',]} \t\n\r'.includes(next)) {
      throw this.error(`数字后紧跟非法字符「${next}」`);
    }
  }

  private parseLiteral(): unknown {
    const start = this.pos;
    if (this.text.startsWith('true', this.pos)) {
      this.pos += 4;
      return true;
    }
    if (this.text.startsWith('false', this.pos)) {
      this.pos += 5;
      return false;
    }
    if (this.text.startsWith('null', this.pos)) {
      this.pos += 4;
      return null;
    }
    if (this.text.startsWith('Infinity', this.pos)) {
      this.pos += 8;
      return Number.POSITIVE_INFINITY;
    }
    if (this.text.startsWith('NaN', this.pos)) {
      this.pos += 3;
      return Number.NaN;
    }
    const token = this.text.slice(start, start + 12);
    throw this.error(`无法识别的字面量「${token}」（JSON5 支持 true/false/null/Infinity/NaN）`);
  }
}

/**
 * 将 JSON5 文本解析为 JS 值。
 *
 * @param text - JSON5 文本
 * @returns 解析结果，错误带行列号
 */
export function parseJson5(text: string): Json5Result {
  if (!text.trim()) {
    return { output: null, error: null };
  }
  try {
    return { output: new Json5Parser(text).parse(), error: null };
  } catch (error) {
    return { output: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** JSON5 序列化选项 */
export interface Json5StringifyOptions {
  /** 缩进空格数，默认 2 */
  indent?: number;
  /** 是否优先使用单引号字符串，默认 true */
  singleQuotes?: boolean;
}

/**
 * 将 JS 值序列化为「JSON5 友好文本」：与 JSON 基本一致，
 * 但默认使用单引号、键在合法标识符时不加引号、允许 Infinity/NaN，
 * 便于直接粘贴进 JS / TS / 配置文件。
 *
 * @param value - 任意可 JSON 化的值
 * @param options - 序列化选项
 * @returns 文本与可能的错误（循环引用等）
 */
export function stringifyJson5(
  value: unknown,
  options: Json5StringifyOptions = {},
): { output: string; error: string | null } {
  const { indent = 2, singleQuotes = true } = options;
  const seen = new WeakSet<object>();

  const quote = singleQuotes ? "'" : '"';
  const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  const escapeString = (str: string): string => {
    let result = quote;
    for (const char of str) {
      if (char === quote) {
        result += `\\${quote}`;
      } else if (char === '"' && quote === "'") {
        result += '"';
      } else if (char === '\\') {
        result += '\\\\';
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else if (char === '\b') {
        result += '\\b';
      } else if (char === '\f') {
        result += '\\f';
      } else {
        result += char;
      }
    }
    return result + quote;
  };

  const serialize = (node: unknown, depth: number): string => {
    const pad = ' '.repeat(indent * depth);
    const childPad = ' '.repeat(indent * (depth + 1));

    if (node === null) {
      return 'null';
    }
    if (typeof node === 'boolean') {
      return String(node);
    }
    if (typeof node === 'number') {
      if (Number.isNaN(node)) {
        return 'NaN';
      }
      if (node === Number.POSITIVE_INFINITY) {
        return 'Infinity';
      }
      if (node === Number.NEGATIVE_INFINITY) {
        return '-Infinity';
      }
      return String(node);
    }
    if (typeof node === 'string') {
      return escapeString(node);
    }
    if (typeof node === 'object') {
      if (seen.has(node as object)) {
        throw new Error('数据中存在循环引用，无法序列化');
      }
      seen.add(node as object);
      if (Array.isArray(node)) {
        if (node.length === 0) {
          return '[]';
        }
        const items = node.map((item) => `${childPad}${serialize(item, depth + 1)}`);
        return `[\n${items.join(',\n')}\n${pad}]`;
      }
      const entries = Object.entries(node as Record<string, unknown>);
      if (entries.length === 0) {
        return '{}';
      }
      const items = entries.map(([key, value]) => {
        const renderedKey = identifierPattern.test(key) ? key : escapeString(key);
        return `${childPad}${renderedKey}: ${serialize(value, depth + 1)}`;
      });
      return `{\n${items.join(',\n')}\n${pad}}`;
    }
    throw new Error(`存在无法序列化的值类型：${typeof node}`);
  };

  try {
    return { output: serialize(value, 0), error: null };
  } catch (error) {
    return { output: '', error: error instanceof Error ? error.message : String(error) };
  }
}
