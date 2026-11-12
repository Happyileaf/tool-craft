/**
 * Redis RESP（REdis Serialization Protocol）编解码纯函数，
 * 兼容 RESP2（Redis 2.0+）与 RESP3（Redis 6.0+）的全部数据类型。
 * 解析在 UTF-8 字节缓冲区上进行，bulk 长度按字节计数，
 * 不依赖 DOM 与 React，可在 Node 与浏览器环境运行。
 */

/** RESP 数据类型标识，覆盖 RESP2/RESP3 全部首字节类型 */
export type RespType =
  | 'simple-string'
  | 'error'
  | 'integer'
  | 'bulk-string'
  | 'array'
  | 'null'
  | 'double'
  | 'boolean'
  | 'big-number'
  | 'bulk-error'
  | 'verbatim-string'
  | 'map'
  | 'set'
  | 'push'
  | 'streamed-string-part';

/** 结构化 RESP 值；value 按类型承载字符串、数字、BigInt 或嵌套元素 */
export interface RespValue {
  /** RESP 数据类型 */
  type: RespType;
  /** 简单串/错误/整数/双精度/布尔/大数字等标量值，或 verbatim 的 encoding 前缀 */
  value?: string | number | bigint | boolean;
  /** bulk 类类型的原始字符串 */
  data?: string;
  /** RESP2 降级路径下表示 $-1 空 bulk（null）标记 */
  nullBulk?: boolean;
  /** 容器类型的子元素（map 时按键值相邻平铺） */
  elements?: RespValue[];
}

/** 解析出的单条消息及消费的字节数 */
export interface ParsedMessage {
  /** 结构化 RESP 值 */
  value: RespValue;
  /** 本条消息占用的总字节数（含结尾 CRLF） */
  consumed: number;
}

/** 解码完整返回 */
export interface DecodeResult {
  /** 成功解析的全部消息 */
  messages: RespValue[];
  /** 非致命警告 */
  warnings: string[];
  /** 解析失败时的错误信息 */
  error: string | null;
  /** 末尾未消费的残片文本（半包数据，可留待下次拼接） */
  remainder: string;
}

/** CRLF 行结束符 */
const CRLF = '\r\n';
/** 回车字节 */
const CR = 0x0d;
/** 换行字节 */
const LF = 0x0a;

/** 复用的 UTF-8 编解码器 */
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

/** RESP3 各类型首字节 -> 类型标识 */
const TYPE_BY_PREFIX: Record<string, RespType> = {
  '+': 'simple-string',
  '-': 'error',
  ':': 'integer',
  $: 'bulk-string',
  '*': 'array',
  '_': 'null',
  ',': 'double',
  '#': 'boolean',
  '(': 'big-number',
  '!': 'bulk-error',
  '=': 'verbatim-string',
  '%': 'map',
  '~': 'set',
  '>': 'push',
  ';': 'streamed-string-part',
};

/** 字节级解析上下文，游标按字节推进 */
class ByteReader {
  /** UTF-8 字节缓冲 */
  readonly bytes: Uint8Array;
  /** 当前字节游标 */
  cursor = 0;

  constructor(text: string) {
    this.bytes = encoder.encode(text);
  }

  /** 缓冲剩余字节数 */
  get remaining(): number {
    return this.bytes.length - this.cursor;
  }

  /**
   * 读取到下一个 CRLF 之间的行（不含 CRLF），游标推进到 CRLF 之后。
   *
   * @returns 行文本与新游标；数据不足返回 null
   */
  readLine(): { line: string; next: number } | null {
    const start = this.cursor;
    let i = start;
    while (i < this.bytes.length - 1) {
      if (this.bytes[i] === CR && this.bytes[i + 1] === LF) {
        const line = decoder.decode(this.bytes.subarray(start, i));
        this.cursor = i + 2;
        return { line, next: this.cursor };
      }
      i += 1;
    }
    return null;
  }

  /**
   * 读取定长数据及紧随其后的 CRLF。
   *
   * @param length - 数据字节长度
   * @returns 数据字符串与新游标；数据不足返回 null
   */
  readBulk(length: number): { data: string; next: number } | null {
    const dataStart = this.cursor;
    const dataEnd = dataStart + length;
    if (this.bytes.length < dataEnd + 2) {
      return null;
    }
    if (this.bytes[dataEnd] !== CR || this.bytes[dataEnd + 1] !== LF) {
      return null;
    }
    const data = decoder.decode(this.bytes.subarray(dataStart, dataEnd));
    this.cursor = dataEnd + 2;
    return { data, next: this.cursor };
  }
}

/**
 * 递归解析单条 RESP 消息。
 *
 * @param reader - 字节读取上下文
 * @returns 解析结果；数据不足时返回 null
 */
function parseOne(reader: ByteReader): ParsedMessage | null {
  if (reader.remaining === 0) {
    return null;
  }
  const start = reader.cursor;
  const prefixByte = reader.bytes[reader.cursor];
  if (prefixByte === undefined) {
    return null;
  }
  const prefix = String.fromCharCode(prefixByte);
  reader.cursor += 1;
  const lineResult = reader.readLine();
  if (lineResult === null) {
    reader.cursor = start;
    return null;
  }
  const { line } = lineResult;

  switch (prefix) {
    case '+':
      return { value: { type: 'simple-string', value: line }, consumed: reader.cursor - start };
    case '-':
      return { value: { type: 'error', value: line }, consumed: reader.cursor - start };
    case ':': {
      if (!/^[+-]?\d+$/.test(line)) {
        throw new Error(`非法整数「${line}」，整数类型只允许可选符号加十进制数字`);
      }
      return { value: { type: 'integer', value: BigInt(line) }, consumed: reader.cursor - start };
    }
    case ',': {
      if (line === 'inf' || line === '-inf' || line === 'nan') {
        return { value: { type: 'double', value: line }, consumed: reader.cursor - start };
      }
      if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(line)) {
        throw new Error(`非法双精度数「${line}」`);
      }
      return { value: { type: 'double', value: Number(line) }, consumed: reader.cursor - start };
    }
    case '#': {
      if (line !== 't' && line !== 'f') {
        throw new Error(`非法布尔值「${line}」，RESP3 布尔只允许 t 或 f`);
      }
      return {
        value: { type: 'boolean', value: line === 't' },
        consumed: reader.cursor - start,
      };
    }
    case '(':
      if (!/^[+-]?\d+$/.test(line)) {
        throw new Error(`非法大数字「${line}」，BigNumber 只允许可选符号加十进制数字`);
      }
      return {
        value: { type: 'big-number', value: BigInt(line) },
        consumed: reader.cursor - start,
      };
    case '_':
      if (line !== '') {
        throw new Error('RESP3 空值（_）首行不应携带内容');
      }
      return { value: { type: 'null' }, consumed: reader.cursor - start };
    case ';':
      return parseBulkLike(reader, start, 'streamed-string-part', line);
    case '$':
      return parseBulkLike(reader, start, 'bulk-string', line);
    case '!':
      return parseBulkLike(reader, start, 'bulk-error', line);
    case '=':
      return parseBulkLike(reader, start, 'verbatim-string', line);
    case '*':
    case '~':
    case '>':
      return parseContainer(reader, start, prefix, line);
    case '%':
      return parseMap(reader, start, line);
    default:
      throw new Error(`未知 RESP 类型首字节「${prefix}」`);
  }
}

/**
 * 解析 bulk 类类型（$ / ! / ; / =），首行（长度行）已由 parseOne 读取，
 * 其后跟随定长数据与 CRLF。
 *
 * @param reader - 字节读取上下文
 * @param start - 本条消息起始字节
 * @param type - 目标类型
 * @param lengthLine - 已读取的长度行文本
 * @returns 解析结果；数据不足返回 null
 */
function parseBulkLike(
  reader: ByteReader,
  start: number,
  type: RespType,
  lengthLine: string,
): ParsedMessage | null {
  const length = Number(lengthLine);
  if (!Number.isInteger(length) || length < -1 || !Number.isSafeInteger(length)) {
    throw new Error(`非法 bulk 长度「${lengthLine}」`);
  }
  if (length === -1) {
    return { value: { type: 'null' }, consumed: reader.cursor - start };
  }
  const bulk = reader.readBulk(length);
  if (bulk === null) {
    reader.cursor = start;
    return null;
  }
  const raw = bulk.data;
  if (type === 'verbatim-string') {
    if (length < 4 || raw[3] !== ':') {
      throw new Error('Verbatim string 必须以 3 字节编码前缀加冒号开头（如 txt:）');
    }
    return {
      value: { type, value: raw.slice(0, 3), data: raw.slice(4) },
      consumed: reader.cursor - start,
    };
  }
  return { value: { type, data: raw }, consumed: reader.cursor - start };
}

/**
 * 解析数组/集合/Push 容器。
 *
 * @param reader - 字节读取上下文
 * @param start - 本条消息起始字节
 * @param prefix - 首字节
 * @param line - 长度行内容
 * @returns 解析结果；数据不足返回 null
 */
function parseContainer(
  reader: ByteReader,
  start: number,
  prefix: string,
  line: string,
): ParsedMessage | null {
  const count = Number(line);
  if (!Number.isInteger(count) || count < -1) {
    throw new Error(`非法容器长度「${line}」`);
  }
  if (count === -1) {
    return { value: { type: 'null' }, consumed: reader.cursor - start };
  }
  const elements: RespValue[] = [];
  for (let i = 0; i < count; i += 1) {
    const child = parseOne(reader);
    if (child === null) {
      reader.cursor = start;
      return null;
    }
    elements.push(child.value);
  }
  const containerType = TYPE_BY_PREFIX[prefix];
  if (!containerType) {
    throw new Error(`未知容器首字节「${prefix}」`);
  }
  return { value: { type: containerType, elements }, consumed: reader.cursor - start };
}

/**
 * 解析 RESP3 Map，长度行表示键值对数量（元素按 key,value 相邻平铺）。
 *
 * @param reader - 字节读取上下文
 * @param start - 本条消息起始字节
 * @param line - 对数行内容
 * @returns 解析结果；数据不足返回 null
 */
function parseMap(reader: ByteReader, start: number, line: string): ParsedMessage | null {
  const pairs = Number(line);
  if (!Number.isInteger(pairs) || pairs < 0) {
    throw new Error(`非法 Map 键值对数量「${line}」`);
  }
  const elements: RespValue[] = [];
  for (let i = 0; i < pairs * 2; i += 1) {
    const child = parseOne(reader);
    if (child === null) {
      reader.cursor = start;
      return null;
    }
    elements.push(child.value);
  }
  return { value: { type: 'map', elements }, consumed: reader.cursor - start };
}

/**
 * 将 RESP 线格式文本解码为结构化消息数组，支持半包残片与多消息流。
 *
 * @param text - 原始 RESP 文本
 * @returns 消息数组、警告、错误与残片
 */
export function decodeResp(text: string): DecodeResult {
  const warnings: string[] = [];
  const messages: RespValue[] = [];
  const reader = new ByteReader(text);

  try {
    while (reader.remaining > 0) {
      const before = reader.cursor;
      const parsed = parseOne(reader);
      if (parsed === null) {
        break;
      }
      messages.push(parsed.value);
      if (reader.cursor === before) {
        throw new Error('解析器未推进游标，已中止以避免死循环');
      }
    }
  } catch (error) {
    return {
      messages,
      warnings,
      error: error instanceof Error ? error.message : String(error),
      remainder: decoder.decode(reader.bytes.subarray(reader.cursor)),
    };
  }

  return {
    messages,
    warnings,
    error: null,
    remainder:
      reader.cursor < reader.bytes.length
        ? decoder.decode(reader.bytes.subarray(reader.cursor))
        : '',
  };
}

/** 编码失败结果 */
export interface EncodeFailure {
  /** 固定 false */
  ok: false;
  /** 全部错误信息 */
  errors: string[];
}

/** 编码成功结果 */
export interface EncodeSuccess {
  /** 固定 true */
  ok: true;
  /** RESP 线格式文本 */
  output: string;
}

/** 编码联合返回 */
export type EncodeResult = EncodeSuccess | EncodeFailure;

/**
 * 以行首字节 + 内容 + CRLF 的形式输出一个标量行。
 *
 * @param prefix - 类型首字节
 * @param content - 行内容
 * @returns 线格式片段
 */
function line(prefix: string, content: string): string {
  return `${prefix}${content}${CRLF}`;
}

/**
 * 计算 bulk 数据的 UTF-8 字节长度（RESP 长度行按字节计数）。
 *
 * @param data - bulk 原始数据
 * @returns UTF-8 字节数
 */
function byteLength(data: string): number {
  return encoder.encode(data).length;
}

/**
 * 递归编码单个结构化 RESP 值。
 *
 * @param value - RESP 值
 * @param errors - 收集校验错误的数组
 * @returns 线格式片段
 */
function encodeOne(value: RespValue, errors: string[]): string {
  switch (value.type) {
    case 'simple-string':
      if (typeof value.value !== 'string' || /[\r\n]/.test(value.value)) {
        errors.push('Simple string 不能包含 CR/LF 字符');
        return '';
      }
      return line('+', value.value);
    case 'error':
      if (typeof value.value !== 'string' || /[\r\n]/.test(value.value)) {
        errors.push('Error 消息不能包含 CR/LF 字符');
        return '';
      }
      return line('-', value.value);
    case 'integer':
      if (typeof value.value !== 'bigint' && typeof value.value !== 'number') {
        errors.push('Integer 需要 bigint 或整数 number 值');
        return '';
      }
      return line(':', value.value.toString());
    case 'double': {
      if (value.value === 'inf' || value.value === '-inf' || value.value === 'nan') {
        return line(',', value.value);
      }
      if (typeof value.value !== 'number' || Number.isNaN(value.value)) {
        errors.push('Double 需要有限数值或 inf/-inf/nan 字符串');
        return '';
      }
      return line(',', String(value.value));
    }
    case 'boolean':
      if (typeof value.value !== 'boolean') {
        errors.push('Boolean 需要布尔值');
        return '';
      }
      return line('#', value.value ? 't' : 'f');
    case 'big-number':
      if (typeof value.value !== 'bigint') {
        errors.push('BigNumber 需要 bigint 值');
        return '';
      }
      return line('(', value.value.toString());
    case 'null':
      return line('_', '');
    case 'bulk-string':
    case 'bulk-error':
    case 'streamed-string-part': {
      if (value.type === 'bulk-string' && value.nullBulk === true) {
        return `$-1${CRLF}`;
      }
      const data = value.data ?? '';
      const prefix =
        value.type === 'bulk-error'
          ? '!'
          : value.type === 'streamed-string-part'
            ? ';'
            : '$';
      return `${prefix}${byteLength(data)}${CRLF}${data}${CRLF}`;
    }
    case 'verbatim-string': {
      const encoding = typeof value.value === 'string' ? value.value : 'txt';
      if (!/^[a-zA-Z0-9]{3}$/.test(encoding)) {
        errors.push('Verbatim string 编码前缀必须是 3 个字母数字（如 txt、mkd）');
        return '';
      }
      const payload = `${encoding}:${value.data ?? ''}`;
      return `=${byteLength(payload)}${CRLF}${payload}${CRLF}`;
    }
    case 'array':
    case 'set':
    case 'push': {
      const elements = value.elements ?? [];
      const prefix = value.type === 'set' ? '~' : value.type === 'push' ? '>' : '*';
      const body = elements.map((child) => encodeOne(child, errors)).join('');
      return `${prefix}${elements.length}${CRLF}${body}`;
    }
    case 'map': {
      const elements = value.elements ?? [];
      if (elements.length % 2 !== 0) {
        errors.push('Map 的 elements 必须按键值相邻平铺且长度为偶数');
        return '';
      }
      const body = elements.map((child) => encodeOne(child, errors)).join('');
      return `%${elements.length / 2}${CRLF}${body}`;
    }
    default:
      errors.push(`不支持的 RESP 类型「${String(value.type)}」`);
      return '';
  }
}

/**
 * 将结构化 RESP 值数组编码为线格式文本。
 *
 * @param values - RESP 值数组
 * @returns 校验通过返回 `{ ok: true, output }`，否则返回 `{ ok: false, errors }`
 */
export function encodeResp(values: RespValue[]): EncodeResult {
  const errors: string[] = [];
  const output = values.map((value) => encodeOne(value, errors)).join('');
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, output };
}

/** RESP2 兼容表示：把 RESP3 专属类型降级为 RESP2 等价结构（null 用 $-1 空 bulk） */
export function toResp2(value: RespValue): RespValue {
  switch (value.type) {
    case 'null':
      return { type: 'bulk-string', data: '', nullBulk: true };
    case 'boolean':
      return { type: 'integer', value: value.value ? BigInt(1) : BigInt(0) };
    case 'double':
      return { type: 'bulk-string', data: String(value.value) };
    case 'big-number':
      return { type: 'bulk-string', data: value.value?.toString() ?? '' };
    case 'verbatim-string':
    case 'bulk-error':
    case 'streamed-string-part':
      return { type: 'bulk-string', data: value.data ?? '' };
    case 'map':
    case 'set':
    case 'push':
      return {
        type: 'array',
        elements: (value.elements ?? []).map(toResp2),
      };
    default:
      if (value.elements) {
        return { ...value, elements: value.elements.map(toResp2) };
      }
      return value;
  }
}
