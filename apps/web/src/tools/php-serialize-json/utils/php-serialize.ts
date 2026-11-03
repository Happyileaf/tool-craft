/**
 * PHP serialize() / unserialize() 文本格式的解析与生成纯函数，
 * 不依赖 DOM、React 与任何第三方库。字符串长度声明按 UTF-16 码元计数，
 * 与浏览器端 String API 及 PHP 常见的二进制安全单字节载荷实践兼容；
 * 全部运算在浏览器本地完成。
 */

/** 序列化标记对象：表示 PHP 关联数组（含非 0..n-1 数字键或混合键） */
export const PHP_OBJECT_MARKER = '$$phpObject$$';
/** 序列化标记字段：显式标注 PHP 数组是 list（array）还是 map（assoc） */
export const PHP_KIND_MARKER = '$$phpArrayKind$$';

/** PHP 数组在 JSON 侧的标记对象 */
export interface PhpArrayMarker {
  [PHP_OBJECT_MARKER]: true;
  [PHP_KIND_MARKER]: 'array' | 'assoc';
  data: unknown;
}

/** 解析结果 */
export interface ParseResult {
  /** 解析出的值；失败时为 null */
  output: unknown;
  /** 错误信息；成功时为 null */
  error: string | null;
}

/** 生成结果 */
export interface SerializeResult {
  /** 序列化文本；失败时为空字符串 */
  output: string;
  /** 错误信息；成功时为 null */
  error: string | null;
}

class PhpParser {
  private pos = 0;

  constructor(private readonly input: string) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.pos < this.input.length) {
      throw new Error(`第 ${this.pos + 1} 列：序列化内容结束后仍有多余字符「${this.peek()}」`);
    }
    return value;
  }

  private peek(): string {
    return this.input[this.pos] ?? '';
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.peek())) {
      this.pos += 1;
    }
  }

  private expect(char: string): void {
    if (this.input[this.pos] !== char) {
      const actual = this.input[this.pos];
      throw new Error(
        `第 ${this.pos + 1} 列：期望「${char}」，实际为${actual === undefined ? '字符串结束' : `「${actual}」`}`,
      );
    }
    this.pos += 1;
  }

  /** 读取到指定分隔符为止的数字 */
  private readNumber(terminator: string): number {
    const start = this.pos;
    while (this.pos < this.input.length && this.input[this.pos] !== terminator) {
      this.pos += 1;
    }
    const raw = this.input.slice(start, this.pos);
    if (!/^-?\d+$/.test(raw)) {
      throw new Error(`第 ${start + 1} 列：「${raw}」不是合法整数字段`);
    }
    this.expect(terminator);
    return Number(raw);
  }

  private parseValue(): unknown {
    this.skipWhitespace();
    if (this.pos >= this.input.length || this.input[this.pos] === '}') {
      throw new Error(`第 ${this.pos + 1} 列：字符串提前结束，缺少类型标记（N/s/i/d/b/a/O/C）`);
    }
    const type = this.input[this.pos];
    this.pos += 1;
    switch (type) {
      case 'N':
        this.expect(';');
        return null;
      case 's':
        return this.parseString();
      case 'i':
        this.expect(':');
        return this.readNumber(';');
      case 'd':
        return this.parseDouble();
      case 'b':
        return this.parseBoolean();
      case 'a':
        return this.parseArray();
      case 'O':
        return this.parseObject();
      case 'C':
        return this.parseSerializable();
      default:
        throw new Error(`第 ${this.pos} 列：不支持的类型标记「${type}」（对象/资源等 PHP 专有类型请使用标记结构）`);
    }
  }

  private parseString(): string {
    this.expect(':');
    const declaredLength = this.readNumber(':');
    if (declaredLength < 0) {
      throw new Error(`第 ${this.pos + 1} 列：字符串长度声明不能为负数`);
    }
    this.expect('"');
    // 合法字符串至少还需要 declaredLength 个内容码元 + 1 个闭合引号
    if (this.pos + declaredLength + 1 > this.input.length) {
      throw new Error(
        `第 ${this.pos + 1} 列：声明字符串长度 ${declaredLength}，但剩余内容不足（载荷被截断，或长度声明与实际内容不符）`,
      );
    }
    const content = this.input.substr(this.pos, declaredLength);
    if (content.length < declaredLength) {
      throw new Error(
        `第 ${this.pos + 1} 列：声明字符串长度 ${declaredLength}，但剩余内容只有 ${content.length} 个码元（载荷可能被截断或为多字节编码）`,
      );
    }
    if (this.input[this.pos + declaredLength] !== '"') {
      throw new Error(
        `第 ${this.pos + 1} 列：声明字符串长度 ${declaredLength}，但按长度取到的内容后不是闭合引号「"」（长度声明与实际内容不符，载荷可能损坏或编码不一致）`,
      );
    }
    this.pos += declaredLength;
    this.expect('"');
    this.expect(';');
    return content;
  }

  private parseDouble(): number {
    this.expect(':');
    const start = this.pos;
    while (this.pos < this.input.length && this.input[this.pos] !== ';') {
      this.pos += 1;
    }
    const raw = this.input.slice(start, this.pos);
    this.expect(';');
    if (raw === 'INF') {
      return Number.POSITIVE_INFINITY;
    }
    if (raw === '-INF') {
      return Number.NEGATIVE_INFINITY;
    }
    if (raw === 'NAN') {
      return Number.NaN;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) && raw !== '0') {
      throw new Error(`第 ${start + 1} 列：「${raw}」不是合法的 PHP 浮点序列化值`);
    }
    return value;
  }

  private parseBoolean(): boolean {
    this.expect(':');
    const raw = this.input[this.pos];
    this.pos += 1;
    this.expect(';');
    if (raw !== '0' && raw !== '1') {
      throw new Error(`第 ${this.pos} 列：布尔值只能是 b:0; 或 b:1;，实际为 b:${raw};`);
    }
    return raw === '1';
  }

  private parseArray(): PhpArrayMarker {
    this.expect(':');
    const count = this.readNumber(':');
    if (count < 0) {
      throw new Error(`第 ${this.pos + 1} 列：数组元素数量不能为负数`);
    }
    this.expect('{');
    const entries: Array<[string | number, unknown]> = [];
    for (let i = 0; i < count; i += 1) {
      const key = this.parseKey();
      const value = this.parseValue();
      entries.push([key, value]);
    }
    this.expect('}');

    // 判断 list：键恰好为 0..n-1 且无重复
    let isList = entries.length > 0;
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (entry === undefined || entry[0] !== i) {
        isList = false;
        break;
      }
    }
    if (entries.length === 0) {
      // 空数组 a:0:{} 在 PHP 中既可为 list 又可为 map，统一呈现为空数组
      isList = true;
    }

    if (isList) {
      return {
        [PHP_OBJECT_MARKER]: true,
        [PHP_KIND_MARKER]: 'array',
        data: entries.map(([, value]) => value),
      };
    }

    const map: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      map[String(key)] = value;
    }
    return {
      [PHP_OBJECT_MARKER]: true,
      [PHP_KIND_MARKER]: 'assoc',
      data: map,
    };
  }

  private parseKey(): string | number {
    this.skipWhitespace();
    if (this.pos >= this.input.length || this.input[this.pos] === '}') {
      throw new Error(`第 ${this.pos + 1} 列：数组提前结束，缺少第 ${this.pos + 1} 个元素的键值对`);
    }
    const type = this.input[this.pos];
    if (type === 'i') {
      this.pos += 1;
      this.expect(':');
      return this.readNumber(';');
    }
    if (type === 's') {
      this.pos += 1;
      return this.parseString();
    }
    throw new Error(`第 ${this.pos + 1} 列：数组键只能是整数(i:)或字符串(s:)，实际为「${type ?? '结束'}」`);
  }

  private parseObject(): never {
    // 读取类名长度与类名后给出明确错误，避免误解析
    this.expect(':');
    const nameLength = this.readNumber(':');
    this.expect('"');
    const name = this.input.substr(this.pos, nameLength);
    this.pos += nameLength;
    this.expect('"');
    throw new Error(`检测到 PHP 对象序列化（O:${nameLength}:"${name}"），Web 工具不支持对象反序列化，仅支持标量、数组与 null`);
  }

  private parseSerializable(): never {
    throw new Error('检测到 PHP Serializable 对象（C: 标记），Web 工具不支持该专有类型');
  }
}

/**
 * 将 PHP serialize 文本解析为可 JSON.stringify 的值。
 * PHP 数组以标记对象 { $$phpObject$$, $$phpArrayKind$$, data } 呈现，
 * 以区分索引数组（list）与关联数组（map）。
 *
 * @param text - serialize() 文本
 * @returns 解析结果
 */
export function parsePhpSerialize(text: string): ParseResult {
  if (!text.trim()) {
    return { output: null, error: null };
  }
  try {
    const parser = new PhpParser(text);
    return { output: parser.parse(), error: null };
  } catch (error) {
    return { output: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** 判断是否为 PHP 数组标记对象 */
export function isPhpArrayMarker(value: unknown): value is PhpArrayMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>)[PHP_OBJECT_MARKER] === true &&
    typeof (value as Record<string, unknown>)[PHP_KIND_MARKER] === 'string'
  );
}

/** 生成器状态 */
class PhpSerializer {
  private output = '';

  serialize(value: unknown): string {
    this.writeValue(value, '$');
    return this.output;
  }

  private writeRaw(chunk: string): void {
    this.output += chunk;
  }

  private writeString(value: string): void {
    this.writeRaw(`s:${value.length}:"${value}";`);
  }

  private writeValue(value: unknown, path: string): void {
    if (value === null) {
      this.writeRaw('N;');
      return;
    }
    if (typeof value === 'boolean') {
      this.writeRaw(`b:${value ? 1 : 0};`);
      return;
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        this.writeRaw(`i:${value};`);
      } else {
        this.writeRaw(`d:${this.formatDouble(value)};`);
      }
      return;
    }
    if (typeof value === 'string') {
      this.writeString(value);
      return;
    }
    if (Array.isArray(value)) {
      this.writeListArray(value, path);
      return;
    }
    if (isPhpArrayMarker(value)) {
      if (value[PHP_KIND_MARKER] === 'array' && Array.isArray(value.data)) {
        this.writeListArray(value.data, path);
        return;
      }
      if (value[PHP_KIND_MARKER] === 'assoc' && typeof value.data === 'object' && value.data !== null) {
        this.writeAssocObject(value.data as Record<string, unknown>, path);
        return;
      }
      throw new Error(`路径 ${path}：PHP 数组标记与 data 字段类型不一致`);
    }
    if (typeof value === 'object') {
      this.writeAssocObject(value as Record<string, unknown>, path);
      return;
    }
    throw new Error(`路径 ${path}：存在无法序列化的值类型（${typeof value}）`);
  }

  /** PHP 浮点序列化格式：与 PHP 默认 serialize 精度风格对齐 */
  private formatDouble(value: number): string {
    if (Number.isNaN(value)) {
      return 'NAN';
    }
    if (value === Number.POSITIVE_INFINITY) {
      return 'INF';
    }
    if (value === Number.NEGATIVE_INFINITY) {
      return '-INF';
    }
    // PHP serialize 对浮点使用最大精度十进制表示
    const text = String(value);
    return text.includes('e') || text.includes('.') ? text : `${text}.0`;
  }

  private writeListArray(list: unknown[], path: string): void {
    this.writeRaw(`a:${list.length}:{`);
    list.forEach((item, index) => {
      this.writeRaw(`i:${index};`);
      this.writeValue(item, `${path}[${index}]`);
    });
    this.writeRaw('}');
  }

  private writeAssocObject(record: Record<string, unknown>, path: string): void {
    const keys = Object.keys(record);
    this.writeRaw(`a:${keys.length}:{`);
    for (const key of keys) {
      this.writeString(key);
      this.writeValue(record[key], `${path}.${key}`);
    }
    this.writeRaw('}');
  }
}

/**
 * 将 JSON 值（已 parse 的 JS 值）序列化为 PHP serialize 文本。
 * JS 数组 → a:n:{} 索引数组；普通对象 → 关联数组；
 * 标记对象可显式指定 array/assoc。
 *
 * @param value - 任意可序列化的 JS 值
 * @returns 序列化结果
 */
export function serializeToPhp(value: unknown): SerializeResult {
  try {
    return { output: new PhpSerializer().serialize(value), error: null };
  } catch (error) {
    return { output: '', error: error instanceof Error ? error.message : String(error) };
  }
}
