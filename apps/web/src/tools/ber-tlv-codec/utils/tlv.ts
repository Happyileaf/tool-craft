/**
 * BER-TLV（EMV / SIM APDU 等场景使用的标签-长度-值结构）解析与构造纯函数。
 *
 * Tag 规则（ISO/IEC 7816-4 / X.690）：
 * - 首字节低 5 位为 0x1F 表示多字节 Tag，后续字节最高位为续位，
 *   直到某字节最高位为 0 结束
 * - 首字节 bit6 为构造位（1=构造型，可嵌套子 TLV；0=原始型）
 * Length 规则：
 * - 首字节 < 0x80 为短形式，直接给出长度
 * - 首字节 = 0x80 为不定长（本工具在解析构造型时支持结束符 00 00）
 * - 首字节 > 0x80 时低 7 位给出后续长度字节数，按大端拼接
 */

/** 单个 BER-TLV 节点 */
export interface TlvNode {
  /** 完整 Tag 的十六进制串（大写、无空格），如 6F、9F38 */
  tag: string;
  /** Tag 原始字节 */
  tagBytes: number[];
  /** 是否为构造型（constructed），可包含子 TLV */
  constructed: boolean;
  /** Tag 类别：universal / application / context-specific / private */
  tagClass: string;
  /** 标签号（首字节低 5 位，多字节 Tag 时为后续拼接值） */
  tagNumber: number;
  /** Value 原始字节 */
  value: number[];
  /** Value 的十六进制串（空格分隔） */
  valueHex: string;
  /** 整个 TLV（含 Tag+Length+Value）占用的字节数 */
  totalLength: number;
  /** 构造型节点解析出的子 TLV；原始型为空数组 */
  children: TlvNode[];
  /** 长度字段占用的字节数 */
  lengthBytes: number;
  /** 是否使用了不定长形式 */
  indefinite: boolean;
}

/**
 * 解析十六进制字符串为字节数组
 */
export function parseHexBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,;_-]/g, '');
  if (cleaned === '') {
    throw new Error('十六进制输入为空');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('包含非十六进制字符');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

export function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(toHex).join(' ');
}

const CLASS_NAMES = ['universal', 'application', 'context-specific', 'private'];

/**
 * 从 offset 读取一个完整 Tag，返回 [Tag 字节数组, 新 offset]
 */
function readTag(bytes: number[], offset: number): [number[], number] {
  const first = bytes[offset];
  if (first === undefined) {
    throw new Error('位置 ' + offset + ' 期望 Tag 字节但数据已结束');
  }
  const tagBytes = [first];
  let cursor = offset + 1;
  if ((first & 0x1f) === 0x1f) {
    // 多字节 Tag：持续读取直到最高位为 0
    let current = bytes[cursor];
    if (current === undefined) {
      throw new Error('多字节 Tag 在位置 ' + cursor + ' 意外结束');
    }
    while ((current & 0x80) !== 0) {
      tagBytes.push(current);
      cursor += 1;
      current = bytes[cursor]!;
    }
    tagBytes.push(current);
    cursor += 1;
  }
  return [tagBytes, cursor];
}

/**
 * 从 offset 读取 Length，返回 [长度值, 长度字段字节数, 是否不定长, 新 offset]
 */
function readLength(bytes: number[], offset: number): [number, number, boolean, number] {
  const first = bytes[offset]!;
  if (first < 0x80) {
    return [first, 1, false, offset + 1];
  }
  if (first === 0x80) {
    return [-1, 1, true, offset + 1];
  }
  const numBytes = first & 0x7f;
  if (numBytes > 6) {
    throw new Error('长度字段后续字节数超出支持范围（最多 6）');
  }
  let length = 0;
  for (let i = 1; i <= numBytes; i += 1) {
    const byte = bytes[offset + i];
    if (byte === undefined) {
      throw new Error('长度字段在位置 ' + offset + ' 被截断');
    }
    length = length * 256 + byte;
  }
  return [length, numBytes + 1, false, offset + numBytes + 1];
}

function buildNode(tagBytes: number[], value: number[], lengthBytes: number, indefinite: boolean): TlvNode {
  const first = tagBytes[0]!;
  const constructed = (first & 0x20) !== 0;
  const tagClass = CLASS_NAMES[(first >>> 6) & 0x03]!;
  let tagNumber = first & 0x1f;
  if (tagNumber === 0x1f && tagBytes.length > 1) {
    tagNumber = 0;
    for (let i = 1; i < tagBytes.length; i += 1) {
      tagNumber = tagNumber * 128 + (tagBytes[i]! & 0x7f);
    }
  }
  return {
    tag: tagBytes.map(toHex).join('').toUpperCase(),
    tagBytes,
    constructed,
    tagClass,
    tagNumber,
    value,
    valueHex: bytesToHex(value),
    totalLength: tagBytes.length + lengthBytes + value.length + (indefinite ? 2 : 0),
    children: [],
    lengthBytes,
    indefinite,
  };
}

/**
 * 递归解析一段字节中的所有同级 TLV，直到到达 endOffset（或不定长结束符）
 */
function parseChildren(bytes: number[], start: number, end: number): TlvNode[] {
  const nodes: TlvNode[] = [];
  let cursor = start;
  while (cursor < end) {
    // 不定长结束符 00 00
    if (bytes[cursor] === 0x00 && bytes[cursor + 1] === 0x00) {
      cursor += 2;
      break;
    }
    const node = parseOne(bytes, cursor, end);
    nodes.push(node);
    cursor += node.totalLength;
  }
  if (cursor !== end) {
    throw new Error(`TLV 结构在位置 ${cursor} 与声明边界 ${end} 不一致`);
  }
  return nodes;
}

/**
 * 解析单个 TLV，bounds 为当前层级的硬边界（用于不定长与越界校验）
 */
function parseOne(bytes: number[], offset: number, hardEnd: number): TlvNode {
  const [tagBytes, afterTag] = readTag(bytes, offset);
  const [length, lengthByteCount, indefinite, afterLength] = readLength(bytes, afterTag);

  if (indefinite) {
    const constructed = (tagBytes[0]! & 0x20) !== 0;
    if (!constructed) {
      throw new Error(`Tag ${tagBytes.map(toHex).join('')} 为原始型，不能使用不定长`);
    }
    const children = parseChildren(bytes, afterLength, hardEnd === Number.POSITIVE_INFINITY ? findEndOfContents(bytes, afterLength) : hardEnd);
    const value = bytes.slice(afterLength, afterLength + children.reduce((s, c) => s + c.totalLength, 0));
    const node = buildNode(tagBytes, value, lengthByteCount, true);
    node.children = children;
    return node;
  }

  const valueStart = afterLength;
  const valueEnd = valueStart + length;
  if (valueEnd > hardEnd || valueEnd > bytes.length) {
    throw new Error(`Tag ${tagBytes.map(toHex).join('')} 声明长度 ${length} 超出数据边界`);
  }
  const value = bytes.slice(valueStart, valueEnd);
  const node = buildNode(tagBytes, value, lengthByteCount, false);

  if (node.constructed && value.length > 0) {
    node.children = parseChildren(value, 0, value.length);
  }
  return node;
}

/** 不定长场景下定位 End-of-Contents (00 00) 的绝对位置 */
function findEndOfContents(bytes: number[], start: number): number {
  let cursor = start;
  while (cursor < bytes.length) {
    if (bytes[cursor] === 0x00 && bytes[cursor + 1] === 0x00) {
      return cursor;
    }
    const node = parseOne(bytes, cursor, bytes.length);
    cursor += node.totalLength;
  }
  throw new Error('不定长 TLV 缺少 End-of-Contents 结束符（00 00）');
}

/**
 * 解析完整 BER-TLV 字节流（可含多个顶层 TLV）
 */
export function parseBerTlv(input: string): TlvNode[] {
  const bytes = parseHexBytes(input);
  return parseChildren(bytes, 0, bytes.length);
}

/**
 * 编码 Length 八位组
 */
export function encodeLength(length: number): number[] {
  if (length < 0x80) {
    return [length];
  }
  const body: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    body.unshift(remaining & 0xff);
    remaining = Math.floor(remaining / 256);
  }
  return [0x80 | body.length, ...body];
}

/** 构造用的输入节点：tag 为十六进制串，value 或 children 二选一 */
export interface TlvBuildInput {
  tag: string;
  value?: string;
  children?: TlvBuildInput[];
}

/**
 * 由结构化输入构造 BER-TLV 字节流。提供 children 时自动按构造型处理，
 * 提供 value 时按原始字节处理；二者互斥
 */
export function buildBerTlv(input: TlvBuildInput): number[] {
  const tagBytes = parseHexBytes(input.tag);
  if (tagBytes.length === 0) {
    throw new Error('Tag 不能为空');
  }
  if (input.children !== undefined) {
    if (input.value !== undefined) {
      throw new Error(`Tag ${input.tag} 不能同时指定 value 与 children`);
    }
    const childBytes = input.children.flatMap((child) => buildBerTlv(child));
    return [...tagBytes, ...encodeLength(childBytes.length), ...childBytes];
  }
  const valueBytes = input.value === undefined || input.value === '' ? [] : parseHexBytes(input.value);
  return [...tagBytes, ...encodeLength(valueBytes.length), ...valueBytes];
}

/** 把多个顶层节点构造为一整条字节流 */
export function buildBerTlvList(inputs: TlvBuildInput[]): number[] {
  return inputs.flatMap((entry) => buildBerTlv(entry));
}

/** 扁平化遍历所有节点（含嵌套），便于表格展示 */
export function flattenNodes(nodes: TlvNode[], depth = 0): Array<{ node: TlvNode; depth: number }> {
  const rows: Array<{ node: TlvNode; depth: number }> = [];
  nodes.forEach((node) => {
    rows.push({ node, depth });
    if (node.children.length > 0) {
      rows.push(...flattenNodes(node.children, depth + 1));
    }
  });
  return rows;
}
