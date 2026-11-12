/**
 * OID（对象标识符）点分十进制与 BER OBJECT IDENTIFIER 内容字节之间的
 * 双向编解码纯函数实现，依据 ITU-T X.690（BER）8.19 节。
 *
 * BER 编码规则：
 * - 前两个弧 (X, Y) 合并为一个基值 40 * X + Y（X 仅允许 0、1、2）
 * - 其余每个弧按 base-128 变长编码：最高位为续位，低 7 位为有效载荷
 */

/** 解析后的 OID 描述 */
export interface OidDecodeResult {
  /** 点分十进制字符串，例如 1.2.840.113549 */
  dotted: string;
  /** 各弧的十进制数值 */
  arcs: number[];
  /** 内容字节（不含 Tag 与 Length）的十六进制串 */
  contentHex: string;
}

/**
 * 把点分十进制 OID 解析为弧数组，校验非法字符、空段与负号
 */
export function parseDottedOid(input: string): number[] {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('OID 不能为空');
  }
  const parts = trimmed.split('.');
  if (parts.length < 2) {
    throw new Error('OID 至少需要两个弧（例如 1.2）');
  }
  const arcs: number[] = [];
  parts.forEach((part, index) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(`第 ${index + 1} 个弧「${part}」不是非负整数`);
    }
    const value = Number(part);
    if (!Number.isSafeInteger(value)) {
      throw new Error(`第 ${index + 1} 个弧超出安全整数范围`);
    }
    arcs.push(value);
  });
  const firstArc = arcs[0]!;
  const secondArc = arcs[1]!;
  if (firstArc > 2) {
    throw new Error('第一个弧只能是 0、1 或 2（ITU-T 分配规则）');
  }
  if (firstArc < 2 && secondArc >= 40) {
    throw new Error('当首弧为 0 或 1 时，第二个弧必须小于 40');
  }
  return arcs;
}

/**
 * 对单个非负整数做 base-128 变长编码
 */
function encodeBase128(value: number): number[] {
  if (value === 0) {
    return [0];
  }
  const chunks: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    chunks.unshift(remaining & 0x7f);
    remaining = Math.floor(remaining / 128);
  }
  return chunks.map((chunk, index) =>
    index === chunks.length - 1 ? chunk : chunk | 0x80,
  );
}

/**
 * 把弧数组编码为 BER OBJECT IDENTIFIER 的内容字节
 */
export function encodeOidContent(arcs: number[]): number[] {
  if (arcs.length < 2) {
    throw new Error('OID 至少需要两个弧');
  }
  const first = 40 * arcs[0]! + arcs[1]!;
  const bytes = encodeBase128(first);
  for (let i = 2; i < arcs.length; i += 1) {
    bytes.push(...encodeBase128(arcs[i]!));
  }
  return bytes;
}

/**
 * 点分十进制 OID -> 完整 TLV 字节（Tag 固定 0x06，长度为短/长形式）
 */
export function encodeOidTlv(input: string): number[] {
  const arcs = parseDottedOid(input);
  const content = encodeOidContent(arcs);
  return [0x06, ...encodeLength(content.length), ...content];
}

/**
 * 按 BER 规则编码长度八位组（短形式与长形式）
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

/**
 * 解析十六进制字节串为字节数组，容忍空格/逗号/0x 前缀，要求偶数个字符
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

/**
 * 读取 BER 长度八位组，返回 [长度值, 占用字节数]
 */
function decodeLength(bytes: number[], offset: number): [number, number] {
  const first = bytes[offset]!;
  if (first < 0x80) {
    return [first, 1];
  }
  const numBytes = first & 0x7f;
  if (numBytes === 0) {
    throw new Error('OID 不使用不定长形式（0x80）');
  }
  if (numBytes > 6) {
    throw new Error('长度八位组超出本工具支持范围');
  }
  let length = 0;
  for (let i = 1; i <= numBytes; i += 1) {
    length = length * 256 + bytes[offset + i]!;
  }
  return [length, numBytes + 1];
}

/**
 * 解码 BER OBJECT IDENTIFIER 的内容字节为弧数组
 */
export function decodeOidContent(content: number[]): number[] {
  if (content.length === 0) {
    throw new Error('OID 内容为空');
  }
  const values: number[] = [];
  let accumulator = 0;
  let pending = false;
  content.forEach((byte) => {
    accumulator = accumulator * 128 + (byte & 0x7f);
    if (!Number.isSafeInteger(accumulator)) {
      throw new Error('弧值超出安全整数范围');
    }
    pending = true;
    if ((byte & 0x80) === 0) {
      values.push(accumulator);
      accumulator = 0;
      pending = false;
    }
  });
  if (pending) {
    throw new Error('最后一个弧的 base-128 序列缺少结束字节（最高位未清零）');
  }
  const firstValue = values[0]!;
  let firstArc: number;
  let secondArc: number;
  if (firstValue < 40) {
    firstArc = 0;
    secondArc = firstValue;
  } else if (firstValue < 80) {
    firstArc = 1;
    secondArc = firstValue - 40;
  } else {
    firstArc = 2;
    secondArc = firstValue - 80;
  }
  return [firstArc, secondArc, ...values.slice(1)];
}

/**
 * 完整 TLV 字节 -> 解析结果（校验 Tag=0x06 与长度一致性）
 */
export function decodeOidTlv(input: string): OidDecodeResult {
  const bytes = parseHexBytes(input);
  const tag = bytes[0]!;
  if (tag !== 0x06) {
    throw new Error(`Tag 应为 0x06（OBJECT IDENTIFIER），实际为 0x${tag.toString(16).padStart(2, '0')}`);
  }
  const [length, lengthBytes] = decodeLength(bytes, 1);
  const contentStart = 1 + lengthBytes;
  if (bytes.length - contentStart !== length) {
    throw new Error(`长度字段声明 ${length} 字节，实际内容 ${bytes.length - contentStart} 字节`);
  }
  const content = bytes.slice(contentStart);
  const arcs = decodeOidContent(content);
  return {
    arcs,
    dotted: arcs.join('.'),
    contentHex: content.map((b) => b.toString(16).padStart(2, '0')).join(' '),
  };
}

/** 字节数组转小写十六进制串 */
export function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
}
