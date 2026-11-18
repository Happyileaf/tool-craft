/**
 * ICMPv4 Echo Request / Reply（RFC 792）报文构建与解析纯函数。
 * 字段布局（网络字节序 / 大端）：
 *   偏移 0: Type（8=Echo Request，0=Echo Reply）
 *   偏移 1: Code（Echo 报文固定为 0）
 *   偏移 2-3: Checksum（RFC 1071 反码求和，校验时该字段清零参与计算）
 *   偏移 4-5: Identifier
 *   偏移 6-7: Sequence Number
 *   偏移 8+: Data（payload）
 */

/** Echo 报文类型 */
export type IcmpEchoType =
  | typeof ICMP_TYPE_ECHO_REPLY
  | typeof ICMP_TYPE_ECHO_REQUEST;

export const ICMP_TYPE_ECHO_REPLY = 0;
export const ICMP_TYPE_ECHO_REQUEST = 8;
/** ICMP 固定首部长度 */
export const ICMP_HEADER_LENGTH = 8;
/** 典型以太网 MTU 下的 payload 参考上限（1500 - 20 IP - 8 ICMP） */
export const TYPICAL_PAYLOAD_LIMIT = 1472;

/** 构建入参 */
export interface IcmpBuildInput {
  type: IcmpEchoType;
  identifier: number;
  sequence: number;
  /** payload 字节 */
  data: Uint8Array;
}

/** 解析后的结构化报文 */
export interface IcmpPacket {
  type: number;
  code: number;
  checksum: number;
  identifier: number;
  sequence: number;
  data: Uint8Array;
  /** 报文中携带的校验和与清零重算结果是否一致 */
  checksumValid: boolean;
  /** 按当前字段重算得到的校验和（报文字段不变时应等于 checksum） */
  recomputedChecksum: number;
  /** 非致命警告（如 Code 非 0、payload 超典型 MTU） */
  warnings: string[];
}

/**
 * 剥离十六进制文本中的噪声（空格、冒号、逗号、换行、0x 前缀）并转为字节数组。
 *
 * @param input - 原始 hex 文本
 * @returns 字节数组
 * @throws 含非 hex 字符或奇数个数字时抛出错误
 */
export function normalizeHexInput(input: string): Uint8Array {
  const cleaned = input
    .replace(/0x/gi, '')
    .replace(/[\s,:]+/g, '');
  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('十六进制文本含非法字符（仅允许 0-9、A-F、空格、冒号、逗号与 0x 前缀）');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制数字个数为奇数，无法按字节对齐');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/**
 * RFC 1071 一维反码求和：对字节序列按 16 位大端字求和并折叠进位，返回未取反的和。
 * 奇数长度时末尾补 0 字节。
 */
export function onesComplementSum(bytes: Uint8Array): number {
  let sum = 0;
  const paddedLength = bytes.length + (bytes.length % 2);
  for (let offset = 0; offset < paddedLength; offset += 2) {
    const high = bytes[offset] ?? 0;
    const low = bytes[offset + 1] ?? 0;
    sum += (high << 8) | low;
  }
  while ((sum >> 16) !== 0) {
    sum = (sum & 0xffff) + (sum >> 16);
  }
  return sum;
}

/**
 * 计算互联网校验和（反码求和后取反）。调用方需保证校验和字段已清零。
 */
export function internetChecksum(bytes: Uint8Array): number {
  return (~onesComplementSum(bytes)) & 0xffff;
}

function assertU16(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new Error(`${field} 必须是 0–65535 之间的整数`);
  }
}

/**
 * 构建完整 ICMPv4 Echo 报文（8 字节首部 + payload），校验和自动计算并回填。
 *
 * @param input - 类型、标识符、序列号与 payload
 * @returns 完整报文字节
 */
export function buildIcmpPacket(input: IcmpBuildInput): Uint8Array {
  const { type, identifier, sequence, data } = input;
  if (type !== ICMP_TYPE_ECHO_REQUEST && type !== ICMP_TYPE_ECHO_REPLY) {
    throw new Error('Type 仅支持 8（Echo Request）或 0（Echo Reply）');
  }
  assertU16(identifier, 'Identifier');
  assertU16(sequence, 'Sequence Number');

  const packet = new Uint8Array(ICMP_HEADER_LENGTH + data.length);
  const view = new DataView(packet.buffer);
  view.setUint8(0, type);
  view.setUint8(1, 0); // Code 固定 0
  view.setUint16(2, 0); // 校验和先清零
  view.setUint16(4, identifier);
  view.setUint16(6, sequence);
  packet.set(data, ICMP_HEADER_LENGTH);

  const checksum = internetChecksum(packet);
  view.setUint16(2, checksum);
  return packet;
}

/**
 * 解析 ICMPv4 Echo 报文，逐字段还原并核对校验和。
 *
 * @param raw - 完整报文字节（至少 8 字节）
 * @returns 结构化报文与校验结果
 */
export function parseIcmpPacket(raw: Uint8Array): IcmpPacket {
  if (raw.length < ICMP_HEADER_LENGTH) {
    throw new Error(`报文长度不足 ${ICMP_HEADER_LENGTH} 字节，无法容纳 ICMP 首部`);
  }

  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const type = view.getUint8(0);
  const code = view.getUint8(1);
  const checksum = view.getUint16(2);
  const identifier = view.getUint16(4);
  const sequence = view.getUint16(6);
  const data = raw.slice(ICMP_HEADER_LENGTH);

  // 清零校验和字段后重算，验证抓包数据
  const zeroed = new Uint8Array(raw);
  new DataView(zeroed.buffer).setUint16(2, 0);
  const recomputedChecksum = internetChecksum(zeroed);

  const warnings: string[] = [];
  if (type !== ICMP_TYPE_ECHO_REQUEST && type !== ICMP_TYPE_ECHO_REPLY) {
    warnings.push(`Type=${type} 不是 Echo Request(8) / Echo Reply(0)，本工具按 Echo 布局解析`);
  }
  if (code !== 0) {
    warnings.push(`Code=${code}，RFC 792 规定 Echo 报文 Code 必须为 0`);
  }
  if (data.length > TYPICAL_PAYLOAD_LIMIT) {
    warnings.push(`payload 长度 ${data.length} 超过典型 MTU 参考上限 ${TYPICAL_PAYLOAD_LIMIT} 字节`);
  }

  return {
    type,
    code,
    checksum,
    identifier,
    sequence,
    data,
    checksumValid: checksum === recomputedChecksum,
    recomputedChecksum,
    warnings,
  };
}

/** 把字节数组格式化为大写、两位、空格分隔的十六进制字符串 */
export function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

/** 把文本 payload 编码为 UTF-8 字节 */
export function encodeTextPayload(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** 尝试把 payload 解码为 UTF-8 文本（非法字节以替换字符呈现） */
export function decodeTextPayload(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}
