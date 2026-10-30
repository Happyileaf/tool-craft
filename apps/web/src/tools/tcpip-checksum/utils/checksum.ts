/**
 * TCP/IP 互联网校验和（RFC 1071）纯函数实现：16 位反码求和
 * 适用于 IPv4 首部、ICMP 报文以及带伪首部的 TCP / UDP 段
 */

/** 支持的协议模式 */
export type ChecksumProtocol = 'raw' | 'tcp' | 'udp';

/** 解析十六进制字节文本时允许的分隔符（空格 / 逗号 / 0x 前缀 / 换行） */
const HEX_TOKEN = /^(?:0x)?([0-9a-f]+)$/i;

/**
 * 将十六进制文本解析为字节数组，支持空格 / 逗号 / 换行分隔、每字节连写与 0x 前缀
 *
 * @param input - 十六进制文本
 * @returns 字节数组
 * @throws 含非法字符或奇数个十六进制数字时抛出错误
 */
export function parseHexBytes(input: string): number[] {
  const tokens = input.split(/[\s,]+/).filter((token) => token.length > 0);
  const bytes: number[] = [];
  for (const token of tokens) {
    const matched = HEX_TOKEN.exec(token);
    const digits = matched?.[1];
    if (!digits) {
      throw new Error(`非法的十六进制片段：${token}`);
    }
    if (digits.length % 2 !== 0) {
      throw new Error(`片段 "${token}" 含奇数个十六进制数字`);
    }
    for (let index = 0; index < digits.length; index += 2) {
      bytes.push(Number.parseInt(digits.slice(index, index + 2), 16));
    }
  }
  return bytes;
}

/**
 * 解析 IPv4 点分十进制地址为 4 字节数组
 *
 * @param text - 形如 192.168.0.1 的地址
 * @returns 4 字节网络序数组
 * @throws 地址格式非法时抛出错误
 */
export function parseIpv4(text: string): number[] {
  const parts = text.trim().split('.');
  if (parts.length !== 4) {
    throw new Error('IPv4 地址必须包含 4 个点分十进制段');
  }
  return parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error(`非法的 IPv4 地址段：${part}`);
    }
    const value = Number(part);
    if (value > 255) {
      throw new Error(`IPv4 地址段超出 0–255：${part}`);
    }
    return value;
  });
}

/**
 * 构造 TCP / UDP 伪首部（RFC 793 / RFC 768）：源地址、目的地址、零、协议号、段长度
 *
 * @param srcIp - 源 IPv4 地址字节
 * @param dstIp - 目的 IPv4 地址字节
 * @param protocol - 协议号（TCP=6，UDP=17）
 * @param segmentLength - TCP / UDP 段字节长度
 * @returns 12 字节伪首部
 */
export function buildPseudoHeader(
  srcIp: number[],
  dstIp: number[],
  protocol: number,
  segmentLength: number,
): number[] {
  if (segmentLength < 0 || segmentLength > 0xffff) {
    throw new Error('段长度必须在 0–65535 之间');
  }
  return [
    ...srcIp,
    ...dstIp,
    0,
    protocol,
    (segmentLength >> 8) & 0xff,
    segmentLength & 0xff,
  ];
}

/**
 * 对字节序列计算反码求和中间值（已折叠进位，未取反）
 * 奇数长度时末尾补 0 字节参与运算
 *
 * @param bytes - 字节序列
 * @returns 折叠到 16 位的求和结果
 */
export function onesComplementSum(bytes: number[]): number {
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
 * 计算互联网校验和（反码求和后取反）
 *
 * @param bytes - 参与计算的字节（校验和字段应已清零）
 * @returns 16 位校验和
 */
export function internetChecksum(bytes: number[]): number {
  return (~onesComplementSum(bytes)) & 0xffff;
}

/**
 * 校验模式：对含校验和字段的完整报文求和，结果为 0 即合法
 *
 * @param bytes - 含校验和字段的完整字节序列
 * @returns 校验和是否合法
 */
export function verifyChecksum(bytes: number[]): boolean {
  return onesComplementSum(bytes) === 0xffff && bytes.length > 0;
}

/**
 * 在指定偏移回填校验和（高字节在前），返回新数组
 *
 * @param bytes - 原始字节序列
 * @param offset - 校验和字段起始偏移（TCP=16，UDP=6）
 * @param checksum - 16 位校验和
 * @returns 回填后的新字节数组
 */
export function applyChecksum(bytes: number[], offset: number, checksum: number): number[] {
  if (offset < 0 || offset + 1 >= bytes.length) {
    throw new Error('校验和偏移超出报文范围');
  }
  const filled = [...bytes];
  filled[offset] = (checksum >> 8) & 0xff;
  filled[offset + 1] = checksum & 0xff;
  return filled;
}

/** TCP 校验和字段在段内的偏移 */
export const TCP_CHECKSUM_OFFSET = 16;
/** UDP 校验和字段在段内的偏移 */
export const UDP_CHECKSUM_OFFSET = 6;
/** TCP 协议号 */
export const PROTO_TCP = 6;
/** UDP 协议号 */
export const PROTO_UDP = 17;

/**
 * 生成模式：按协议拼接伪首部（如需）并将校验和字段清零后计算
 *
 * @param segment - TCP / UDP 段或裸报文
 * @param protocol - 协议模式
 * @param srcIp - 可选源 IPv4 字节（TCP / UDP 必填）
 * @param dstIp - 可选目的 IPv4 字节（TCP / UDP 必填）
 * @returns 校验和（UDP 允许传输 0 表示不校验，此处仍返回计算值）
 */
export function generateChecksum(
  segment: number[],
  protocol: ChecksumProtocol,
  srcIp?: number[],
  dstIp?: number[],
): number {
  const offset = protocol === 'tcp' ? TCP_CHECKSUM_OFFSET : protocol === 'udp' ? UDP_CHECKSUM_OFFSET : -1;
  const zeroed = offset >= 0 ? applyChecksum(segment, offset, 0) : segment;
  if (protocol === 'raw') {
    return internetChecksum(zeroed);
  }
  if (!srcIp || !dstIp) {
    throw new Error('TCP / UDP 模式必须提供源地址与目的地址');
  }
  const protocolNumber = protocol === 'tcp' ? PROTO_TCP : PROTO_UDP;
  const pseudo = buildPseudoHeader(srcIp, dstIp, protocolNumber, segment.length);
  return internetChecksum([...pseudo, ...zeroed]);
}

/**
 * 校验模式：按协议拼接伪首部（如需），对含校验和字段的完整数据求和
 *
 * @param segment - 含校验和字段的报文
 * @param protocol - 协议模式
 * @param srcIp - 可选源 IPv4 字节（TCP / UDP 必填）
 * @param dstIp - 可选目的 IPv4 字节（TCP / UDP 必填）
 * @returns 校验和是否合法
 */
export function verifySegment(
  segment: number[],
  protocol: ChecksumProtocol,
  srcIp?: number[],
  dstIp?: number[],
): boolean {
  if (protocol === 'raw') {
    return verifyChecksum(segment);
  }
  if (!srcIp || !dstIp) {
    throw new Error('TCP / UDP 模式必须提供源地址与目的地址');
  }
  const protocolNumber = protocol === 'tcp' ? PROTO_TCP : PROTO_UDP;
  const pseudo = buildPseudoHeader(srcIp, dstIp, protocolNumber, segment.length);
  return onesComplementSum([...pseudo, ...segment]) === 0xffff;
}

/** 将字节数组格式化为大写、两位、空格分隔的十六进制字符串 */
export function toHex(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}
