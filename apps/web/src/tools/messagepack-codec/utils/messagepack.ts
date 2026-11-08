/**
 * MessagePack 编解码纯函数（零依赖实现，依据 https://msgpack.org 公开规范）。
 *
 * 支持类型：nil / bool / 正负 fixint / uint 8/16/32/64 / int 8/16/32/64 /
 * float32 / float64 / fixstr / str8/16/32 / bin8/16/32 / fixarray / array16/32 /
 * fixmap / map16/32 / fixext/ext 8/16/32（解码保留 type 与 data，编码不开放）。
 * 整数自动选择最紧凑宽度；64 位整数经 BigInt 路径处理。
 */

/** 解码错误，携带出错的字节偏移，便于 UI 定位。 */
export class MessagePackError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(`${message}（字节偏移 ${offset}）`);
    this.name = 'MessagePackError';
    this.offset = offset;
  }
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** 解码出的 ext 类型，保留 type 与原始字节（hex）。 */
export interface ExtValue {
  __ext: true;
  type: number;
  dataHex: string;
}

type DecodedValue =
  | null
  | boolean
  | number
  | bigint
  | string
  | DecodedValue[]
  | { [key: string]: DecodedValue }
  | ExtValue;

// ---------------------------------------------------------------------------
// 编码
// ---------------------------------------------------------------------------

class ByteWriter {
  private chunks: number[] = [];

  get length(): number {
    return this.chunks.length;
  }

  u8(v: number): void {
    this.chunks.push(v & 0xff);
  }

  /** 大端写入多字节整数。 */
  bytes(v: number, width: number): void {
    for (let shift = (width - 1) * 8; shift >= 0; shift -= 8) {
      this.chunks.push((v >>> shift) & 0xff);
    }
  }

  bigBytes(v: bigint, width: number): void {
    let value = v;
    const mask = BigInt(0xff);
    const out: number[] = new Array(width).fill(0);
    for (let i = width - 1; i >= 0; i -= 1) {
      out[i] = Number(value & mask);
      value >>= BigInt(8);
    }
    this.chunks.push(...out);
  }

  f32(v: number): void {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, v, false);
    this.chunks.push(...new Uint8Array(buf));
  }

  f64(v: number): void {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setFloat64(0, v, false);
    this.chunks.push(...new Uint8Array(buf));
  }

  raw(data: Uint8Array): void {
    this.chunks.push(...data);
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

function encodeString(w: ByteWriter, s: string): void {
  const utf8 = new TextEncoder().encode(s);
  const len = utf8.length;
  if (len <= 31) {
    w.u8(0xa0 | len); // fixstr
  } else if (len <= 0xff) {
    w.u8(0xd9); // str8
    w.u8(len);
  } else if (len <= 0xffff) {
    w.u8(0xda); // str16
    w.bytes(len, 2);
  } else if (len <= 0xffffffff) {
    w.u8(0xdb); // str32
    w.bytes(len, 4);
  } else {
    throw new MessagePackError('字符串长度超过 uint32 上限', w.length);
  }
  w.raw(utf8);
}

function encodeInteger(w: ByteWriter, n: number): void {
  if (n >= 0) {
    if (n <= 0x7f) {
      w.u8(n); // positive fixint
    } else if (n <= 0xff) {
      w.u8(0xcc); // uint8
      w.u8(n);
    } else if (n <= 0xffff) {
      w.u8(0xcd); // uint16
      w.bytes(n, 2);
    } else if (n <= 0xffffffff) {
      w.u8(0xce); // uint32
      w.bytes(n, 4);
    } else if (Number.isSafeInteger(n)) {
      w.u8(0xcf); // uint64
      w.bigBytes(BigInt(n), 8);
    } else {
      throw new MessagePackError(`整数超出安全整数范围：${n}`, w.length);
    }
  } else {
    if (n >= -32) {
      w.u8(n & 0xff); // negative fixint
    } else if (n >= -128) {
      w.u8(0xd0); // int8
      w.u8(n & 0xff);
    } else if (n >= -32768) {
      w.u8(0xd1); // int16
      w.bytes(n & 0xffff, 2);
    } else if (n >= -2147483648) {
      w.u8(0xd2); // int32
      w.bytes(n >>> 0, 4);
    } else if (Number.isSafeInteger(n)) {
      w.u8(0xd3); // int64
      w.bigBytes(BigInt(n), 8);
    } else {
      throw new MessagePackError(`整数超出安全整数范围：${n}`, w.length);
    }
  }
}

function encodeValue(w: ByteWriter, value: JsonValue): void {
  if (value === null) {
    w.u8(0xc0);
    return;
  }
  if (typeof value === 'boolean') {
    w.u8(value ? 0xc3 : 0xc2);
    return;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      encodeInteger(w, value);
    } else {
      w.u8(0xcb); // float64
      w.f64(value);
    }
    return;
  }
  if (typeof value === 'string') {
    encodeString(w, value);
    return;
  }
  if (Array.isArray(value)) {
    const len = value.length;
    if (len <= 15) {
      w.u8(0x90 | len); // fixarray
    } else if (len <= 0xffff) {
      w.u8(0xdc); // array16
      w.bytes(len, 2);
    } else if (len <= 0xffffffff) {
      w.u8(0xdd); // array32
      w.bytes(len, 4);
    } else {
      throw new MessagePackError('数组长度超过 uint32 上限', w.length);
    }
    for (const item of value) {
      encodeValue(w, item);
    }
    return;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const len = entries.length;
    if (len <= 15) {
      w.u8(0x80 | len); // fixmap
    } else if (len <= 0xffff) {
      w.u8(0xde); // map16
      w.bytes(len, 2);
    } else if (len <= 0xffffffff) {
      w.u8(0xdf); // map32
      w.bytes(len, 4);
    } else {
      throw new MessagePackError('Map 长度超过 uint32 上限', w.length);
    }
    for (const [key, val] of entries) {
      encodeString(w, key);
      encodeValue(w, val);
    }
    return;
  }
  throw new MessagePackError(`不支持的 JSON 类型：${typeof value}`, w.length);
}

/** 把 JSON 兼容值编码为 MessagePack 字节。 */
export function encodeMessagePack(value: JsonValue): Uint8Array {
  const w = new ByteWriter();
  encodeValue(w, value);
  return w.toUint8Array();
}

/** 解析 JSON 文本并编码为 MessagePack 字节，JSON 语法错误直接透传。 */
export function encodeJsonToBytes(jsonText: string): Uint8Array {
  const parsed = JSON.parse(jsonText) as JsonValue;
  return encodeMessagePack(parsed);
}

// ---------------------------------------------------------------------------
// 解码
// ---------------------------------------------------------------------------

class ByteReader {
  readonly data: Uint8Array;
  pos = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  require(n: number): void {
    if (this.pos + n > this.data.length) {
      throw new MessagePackError(`数据截断：还需 ${n} 字节，剩余 ${this.data.length - this.pos} 字节`, this.pos);
    }
  }

  u8(): number {
    this.require(1);
    return this.data[this.pos++] ?? 0;
  }

  take(n: number): Uint8Array {
    this.require(n);
    const slice = this.data.slice(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }

  uint(width: number): number {
    this.require(width);
    let v = 0;
    for (let i = 0; i < width; i += 1) {
      v = v * 256 + (this.data[this.pos + i] ?? 0);
    }
    this.pos += width;
    return v;
  }

  bigInt(width: number, signed: boolean): bigint {
    this.require(width);
    let v = BigInt(0);
    for (let i = 0; i < width; i += 1) {
      v = (v << BigInt(8)) | BigInt(this.data[this.pos + i] ?? 0);
    }
    if (signed) {
      const signBit = BigInt(1) << BigInt(width * 8 - 1);
      if (v >= signBit) {
        v -= BigInt(1) << BigInt(width * 8);
      }
    }
    this.pos += width;
    return v;
  }

  f32(): number {
    const bytes = this.take(4);
    const buf = new ArrayBuffer(4);
    new Uint8Array(buf).set(bytes);
    return new DataView(buf).getFloat32(0, false);
  }

  f64(): number {
    const bytes = this.take(8);
    const buf = new ArrayBuffer(8);
    new Uint8Array(buf).set(bytes);
    return new DataView(buf).getFloat64(0, false);
  }
}

function decodeExt(r: ByteReader, size: number): ExtValue {
  const type = r.u8();
  const data = r.take(size);
  return { __ext: true, type, dataHex: bytesToHex(data) };
}

function decodeValue(r: ByteReader): DecodedValue {
  const start = r.pos;
  const b = r.u8();

  // positive fixint 0x00–0x7f / fixmap 0x80–0x8f / fixarray 0x90–0x9f / fixstr 0xa0–0xbf
  if (b <= 0x7f) return b;
  if (b >= 0xe0) return b - 256; // negative fixint 0xe0–0xff
  if (b >= 0x80 && b <= 0x8f) return decodeMap(r, b & 0x0f);
  if (b >= 0x90 && b <= 0x9f) return decodeArray(r, b & 0x0f);
  if (b >= 0xa0 && b <= 0xbf) return decodeString(r, b & 0x1f);

  switch (b) {
    case 0xc0:
      return null;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xc4: { // bin8
      const len = r.u8();
      return bytesToHex(r.take(len));
    }
    case 0xc5: { // bin16
      const len = r.uint(2);
      return bytesToHex(r.take(len));
    }
    case 0xc6: { // bin32
      const len = r.uint(4);
      return bytesToHex(r.take(len));
    }
    case 0xc7: { // ext8
      const len = r.u8();
      return decodeExt(r, len);
    }
    case 0xc8: { // ext16
      const len = r.uint(2);
      return decodeExt(r, len);
    }
    case 0xc9: { // ext32
      const len = r.uint(4);
      return decodeExt(r, len);
    }
    case 0xca: // float32
      return r.f32();
    case 0xcb: // float64
      return r.f64();
    case 0xcc: // uint8
      return r.u8();
    case 0xcd: // uint16
      return r.uint(2);
    case 0xce: // uint32
      return r.uint(4);
    case 0xcf: { // uint64
      const v = r.bigInt(8, false);
      return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : v;
    }
    case 0xd0: // int8
      return intFromBytes(r.take(1));
    case 0xd1: // int16
      return intFromBytes(r.take(2));
    case 0xd2: // int32
      return intFromBytes(r.take(4));
    case 0xd3: { // int64
      const v = r.bigInt(8, true);
      return v >= BigInt(Number.MIN_SAFE_INTEGER) && v <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(v)
        : v;
    }
    case 0xd4: // fixext1
      return decodeExt(r, 1);
    case 0xd5: // fixext2
      return decodeExt(r, 2);
    case 0xd6: // fixext4
      return decodeExt(r, 4);
    case 0xd7: // fixext8
      return decodeExt(r, 8);
    case 0xd8: // fixext16
      return decodeExt(r, 16);
    case 0xd9: { // str8
      const len = r.u8();
      return decodeString(r, len);
    }
    case 0xda: { // str16
      const len = r.uint(2);
      return decodeString(r, len);
    }
    case 0xdb: { // str32
      const len = r.uint(4);
      return decodeString(r, len);
    }
    case 0xdc: { // array16
      const len = r.uint(2);
      return decodeArray(r, len);
    }
    case 0xdd: { // array32
      const len = r.uint(4);
      return decodeArray(r, len);
    }
    case 0xde: { // map16
      const len = r.uint(2);
      return decodeMap(r, len);
    }
    case 0xdf: { // map32
      const len = r.uint(4);
      return decodeMap(r, len);
    }
    default:
      throw new MessagePackError(`非法或未支持的格式首字节 0x${b.toString(16).padStart(2, '0')}`, start);
  }
}

/** 有符号整数（int8/16/32）由大端字节还原。 */
function intFromBytes(bytes: Uint8Array): number {
  let v = 0;
  for (const byte of bytes) {
    v = v * 256 + byte;
  }
  const signBit = 1 << (bytes.length * 8 - 1);
  return v >= signBit ? v - signBit * 2 : v;
}

function decodeString(r: ByteReader, len: number): string {
  const bytes = r.take(len);
  return new TextDecoder().decode(bytes);
}

function decodeArray(r: ByteReader, len: number): DecodedValue[] {
  const arr: DecodedValue[] = [];
  for (let i = 0; i < len; i += 1) {
    arr.push(decodeValue(r));
  }
  return arr;
}

function decodeMap(r: ByteReader, len: number): { [key: string]: DecodedValue } {
  const obj: { [key: string]: DecodedValue } = {};
  for (let i = 0; i < len; i += 1) {
    const keyStart = r.pos;
    const keyByte = r.u8();
    let key: string;
    if (keyByte >= 0xa0 && keyByte <= 0xbf) {
      key = decodeString(r, keyByte & 0x1f);
    } else if (keyByte === 0xd9 || keyByte === 0xda || keyByte === 0xdb) {
      const width = keyByte === 0xd9 ? 1 : keyByte === 0xda ? 2 : 4;
      const len = width === 1 ? r.u8() : r.uint(width);
      key = decodeString(r, len);
    } else {
      throw new MessagePackError('Map 键必须是字符串类型', keyStart);
    }
    obj[key] = decodeValue(r);
  }
  return obj;
}

/** 解码 MessagePack 字节，返回 JS 值（64 位超界整数为 bigint，bin/ext 保留特殊形态）。 */
export function decodeMessagePack(data: Uint8Array): DecodedValue {
  if (data.length === 0) {
    throw new MessagePackError('输入为空，无可解码字节', 0);
  }
  const r = new ByteReader(data);
  const value = decodeValue(r);
  if (r.pos !== data.length) {
    throw new MessagePackError(`存在 ${data.length - r.pos} 个未消费的尾随字节`, r.pos);
  }
  return value;
}

// ---------------------------------------------------------------------------
// 字节文本互转与转储
// ---------------------------------------------------------------------------

/** HEX 文本（允许空格、换行、0x 前缀）转字节。 */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex
    .replace(/0x/gi, '')
    .replace(/[^0-9a-fA-F]/g, '');
  if (cleaned.length === 0) {
    throw new MessagePackError('HEX 输入为空', 0);
  }
  if (cleaned.length % 2 !== 0) {
    throw new MessagePackError('HEX 字符数必须为偶数', cleaned.length);
  }
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new MessagePackError(`非法 HEX 字符位于偏移 ${i}`, i);
    }
    out[i / 2] = byte;
  }
  return out;
}

/** 字节转小写 HEX（可分组）。 */
export function bytesToHex(data: Uint8Array, group = 0): string {
  const hex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(group ? ' ' : '');
  if (!group) return hex;
  const parts: string[] = [];
  for (let i = 0; i < hex.length; i += group * 2) {
    parts.push(hex.slice(i, i + group * 2));
  }
  return parts.join(' ').trim();
}

/** Base64 文本转字节（浏览器 atob，兼容 URL 安全字符）。 */
export function base64ToBytes(b64: string): Uint8Array {
  const normalized = b64.replace(/[^A-Za-z0-9+/=]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (normalized.length === 0) {
    throw new MessagePackError('Base64 输入为空', 0);
  }
  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    throw new MessagePackError('非法 Base64 输入', 0);
  }
}

/** 字节转 Base64。 */
export function bytesToBase64(data: Uint8Array): string {
  let binary = '';
  for (const b of data) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

/** 十六进制转储：每行 16 字节，带偏移与 ASCII 列。 */
export function hexDump(data: Uint8Array): string {
  const lines: string[] = [];
  for (let offset = 0; offset < data.length; offset += 16) {
    const slice = data.slice(offset, offset + 16);
    const hexPart = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(47, ' ');
    const asciiPart = Array.from(slice)
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${hexPart}  |${asciiPart}|`);
  }
  return lines.join('\n');
}
