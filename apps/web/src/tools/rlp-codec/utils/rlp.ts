/**
 * 以太坊 RLP（Recursive Length Prefix，黄皮书附录 B）零依赖编解码。
 *
 * 编码规则（payload 长度 L）：
 * - 单字节字符串，值 < 0x80：字节本身
 * - 字符串 0–55 字节：0x80 + L，后接 payload
 * - 字符串 >55 字节：0xb7 + len(BE(L))，后接 BE(L) 与 payload
 * - 列表 payload 0–55 字节：0xc0 + L，后接 payload
 * - 列表 payload >55 字节：0xf7 + len(BE(L))，后接 BE(L) 与 payload
 */

/** 编码入参节点：字符串项、原始字节，或同类节点的嵌套数组 */
export type RlpInput = RlpString | Uint8Array | RlpInput[];
/** 字符串项：kind=hex 时 data 为原始字节（0x 前缀输入）；kind=utf8 时 data 为 UTF-8 字节 */
export interface RlpString {
  kind: 'hex' | 'utf8';
  text: string;
  data: Uint8Array;
}

export type RlpNodeType = 'byte' | 'short-string' | 'long-string' | 'short-list' | 'long-list';

export interface RlpDecodedString {
  kind: 'string';
  type: RlpNodeType;
  /** 该节点在整个输入中的起始字节偏移（含前缀） */
  offset: number;
  /** 前缀长度（含长度字节） */
  prefixLength: number;
  /** payload 长度 */
  length: number;
  data: Uint8Array;
}

export interface RlpDecodedList {
  kind: 'list';
  type: RlpNodeType;
  offset: number;
  prefixLength: number;
  length: number;
  items: RlpDecoded[];
}

export type RlpDecoded = RlpDecodedString | RlpDecodedList;

/** 解码失败错误，携带出错的字节偏移（可定位时） */
export class RlpError extends Error {
  offset: number | null;

  constructor(message: string, offset: number | null = null) {
    super(offset === null ? message : `${message}（偏移 ${offset}）`);
    this.name = 'RlpError';
    this.offset = offset;
  }
}

export const MAX_DEPTH = 64;

const HEX_CHARS = /^(0x)?[0-9a-fA-F]*$/;

/**
 * 解析 hex 字符串为字节（0x 可选）。奇数个 hex 数字或非法字符抛错。
 */
export function hexToBytes(hex: string): Uint8Array {
  const trimmed = hex.trim();
  if (!HEX_CHARS.test(trimmed)) {
    throw new RlpError('十六进制包含非法字符（仅允许 0-9a-fA-F 与可选 0x 前缀）');
  }
  const body = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed;
  if (body.length % 2 !== 0) {
    throw new RlpError('十六进制位数必须为偶数');
  }
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(data: Uint8Array, prefix = true): string {
  let hex = '';
  for (const b of data) {
    hex += b.toString(16).padStart(2, '0');
  }
  return prefix ? `0x${hex}` : hex;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

/** UTF-8 文本构造字符串项 */
export function utf8Item(text: string): RlpString {
  return { kind: 'utf8', text, data: encoder.encode(text) };
}

/** hex（0x 可选）构造字符串项 */
export function hexItem(hex: string): RlpString {
  return { kind: 'hex', text: hex.trim(), data: hexToBytes(hex) };
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

export function beLength(value: number): Uint8Array {
  if (value === 0) return new Uint8Array(0);
  const bytes: number[] = [];
  let v = value;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  }
  return Uint8Array.from(bytes);
}

/** 编码单个字符串节点（data 为已确定的字节 payload） */
function encodeBytes(data: Uint8Array): Uint8Array {
  if (data.length === 1 && data[0]! < 0x80) {
    return Uint8Array.from([data[0]]);
  }
  if (data.length <= 55) {
    return concatBytes([Uint8Array.from([0x80 + data.length]), data]);
  }
  const lenBytes = beLength(data.length);
  return concatBytes([Uint8Array.from([0xb7 + lenBytes.length]), lenBytes, data]);
}

/**
 * RLP 编码。入参为 RlpString（utf8Item/hexItem）、Uint8Array（按原始字节）
 * 或其嵌套数组。
 */
export function encode(value: RlpInput): Uint8Array {
  if (value instanceof Uint8Array) {
    return encodeBytes(value);
  }
  if (Array.isArray(value)) {
    const payload = concatBytes(value.map((item) => encode(item)));
    if (payload.length <= 55) {
      return concatBytes([Uint8Array.from([0xc0 + payload.length]), payload]);
    }
    const lenBytes = beLength(payload.length);
    return concatBytes([Uint8Array.from([0xf7 + lenBytes.length]), lenBytes, payload]);
  }
  return encodeBytes(value.data);
}

interface ParsedPrefix {
  type: RlpNodeType;
  prefixLength: number;
  length: number;
  isList: boolean;
}

/**
 * 在 offset 处解析前缀，严格校验非规范编码（短格式可用却用长格式、长度前导零）。
 */
function parsePrefix(input: Uint8Array, offset: number): ParsedPrefix {
  if (offset >= input.length) {
    throw new RlpError('输入已截断：缺少前缀字节', offset);
  }
  const first = input[offset]!;

  if (first < 0x80) {
    return { type: 'byte', prefixLength: 1, length: 1, isList: false };
  }
  if (first <= 0xb7) {
    return { type: 'short-string', prefixLength: 1, length: first - 0x80, isList: false };
  }
  if (first <= 0xbf) {
    const lenOfLen = first - 0xb7;
    const lenStart = offset + 1;
    if (lenStart + lenOfLen > input.length) {
      throw new RlpError('输入已截断：长字符串长度字段不完整', offset);
    }
    if (input[lenStart] === 0) {
      throw new RlpError('非规范编码：长度字段含前导零', lenStart);
    }
    let length = 0;
    for (let i = 0; i < lenOfLen; i += 1) {
      length = length * 256 + input[lenStart + i]!;
    }
    if (length <= 55) {
      throw new RlpError('非规范编码：payload ≤55 字节却使用长字符串前缀', offset);
    }
    return { type: 'long-string', prefixLength: 1 + lenOfLen, length, isList: false };
  }
  if (first <= 0xf7) {
    return { type: 'short-list', prefixLength: 1, length: first - 0xc0, isList: true };
  }
  const lenOfLen = first - 0xf7;
  const lenStart = offset + 1;
  if (lenStart + lenOfLen > input.length) {
    throw new RlpError('输入已截断：长列表长度字段不完整', offset);
  }
  if (input[lenStart] === 0) {
    throw new RlpError('非规范编码：长度字段含前导零', lenStart);
  }
  let length = 0;
  for (let i = 0; i < lenOfLen; i += 1) {
    length = length * 256 + input[lenStart + i]!;
  }
  if (length <= 55) {
    throw new RlpError('非规范编码：payload ≤55 字节却使用长列表前缀', offset);
  }
  return { type: 'long-list', prefixLength: 1 + lenOfLen, length, isList: true };
}

function decodeAt(input: Uint8Array, offset: number, depth: number): { node: RlpDecoded; next: number } {
  if (depth > MAX_DEPTH) {
    throw new RlpError(`嵌套深度超过上限 ${MAX_DEPTH}`, offset);
  }
  const prefix = parsePrefix(input, offset);

  // 单字节 <0x80：字节本身即完整节点，无前缀、无额外 payload
  if (prefix.type === 'byte') {
    const data = input.slice(offset, offset + 1);
    return {
      node: { kind: 'string', type: 'byte', offset, prefixLength: 0, length: 1, data },
      next: offset + 1,
    };
  }

  const payloadStart = offset + prefix.prefixLength;
  const payloadEnd = payloadStart + prefix.length;
  if (payloadEnd > input.length) {
    throw new RlpError(
      `输入已截断：声明长度 ${prefix.length}，实际剩余 ${input.length - payloadStart}`,
      offset,
    );
  }

  if (!prefix.isList) {
    if (prefix.type === 'short-string' && prefix.length === 1) {
      const only = input[payloadStart];
      if (only !== undefined && only < 0x80) {
        throw new RlpError('非规范编码：单字节 <0x80 必须直接编码为字节本身', offset);
      }
    }
    const node: RlpDecodedString = {
      kind: 'string',
      type: prefix.type,
      offset,
      prefixLength: prefix.prefixLength,
      length: prefix.length,
      data: input.slice(payloadStart, payloadEnd),
    };
    return { node, next: payloadEnd };
  }

  const items: RlpDecoded[] = [];
  let cursor = payloadStart;
  while (cursor < payloadEnd) {
    const child = decodeAt(input, cursor, depth + 1);
    items.push(child.node);
    cursor = child.next;
  }
  if (cursor !== payloadEnd) {
    // 理论不可达（子节点越界已被上面的截断检查覆盖）
    throw new RlpError('列表 payload 解析后边界不一致', offset);
  }
  const node: RlpDecodedList = {
    kind: 'list',
    type: prefix.type,
    offset,
    prefixLength: prefix.prefixLength,
    length: prefix.length,
    items,
  };
  return { node, next: payloadEnd };
}

/**
 * 解码 RLP 字节（或 hex 字符串）为结构化树。要求单根节点且无尾字节残留。
 */
export function decode(input: Uint8Array | string): RlpDecoded {
  const bytes = typeof input === 'string' ? hexToBytes(input) : input;
  if (bytes.length === 0) {
    throw new RlpError('输入为空：RLP 不编码空字节串');
  }
  const { node, next } = decodeAt(bytes, 0, 0);
  if (next !== bytes.length) {
    throw new RlpError(`根节点之外存在 ${bytes.length - next} 个多余尾字节`, next);
  }
  return node;
}

/** 尝试把字节按 UTF-8 解码为文本，失败（非法序列）时返回 null */
export function tryUtf8(data: Uint8Array): string | null {
  try {
    return decoder.decode(data);
  } catch {
    return null;
  }
}

/** 计算 RLP 树的节点总数（含根） */
export function countNodes(node: RlpDecoded): number {
  if (node.kind === 'string') return 1;
  return 1 + node.items.reduce((sum, item) => sum + countNodes(item), 0);
}
