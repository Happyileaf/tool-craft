/**
 * IPv4 数据报头（RFC 791）解析、字段拆解与互联网头部校验和验证纯函数。
 *
 * 头部布局（单位 bit）：
 *  0  Version(4) IHL(4)  TOS/DSCP+ECN(8)        Total Length(16)
 *  32 Identification(16)  Flags(3) Fragment Offset(13)
 *  64 TTL(8)  Protocol(8)  Header Checksum(16)
 *  96 Source Address(32)
 * 128 Destination Address(32)
 * 160 Options (IHL*4 - 20 字节) ...
 */

/** 解析后的 IPv4 头部 */
export interface Ipv4Header {
  version: number;
  ihl: number;
  headerLength: number;
  dscp: number;
  ecn: number;
  totalLength: number;
  identification: number;
  flags: { reserved: boolean; df: boolean; mf: boolean };
  fragmentOffset: number;
  ttl: number;
  protocol: number;
  protocolName: string;
  headerChecksum: number;
  sourceAddress: string;
  destinationAddress: string;
  optionsHex: string;
  payloadLength: number;
  /** 用接收到的头部计算出的校验和（包含原校验和字段时应为 0） */
  computedChecksum: number;
  checksumValid: boolean;
  /** 头部原始十六进制（按 4 字节分组） */
  headerHex: string;
}

/** 常见 IP 协议号映射（RFC 790 / IANA 子集） */
const PROTOCOL_NAMES: Record<number, string> = {
  1: 'ICMP',
  2: 'IGMP',
  6: 'TCP',
  17: 'UDP',
  41: 'IPv6',
  47: 'GRE',
  50: 'ESP',
  51: 'AH',
  58: 'ICMPv6',
  89: 'OSPF',
  132: 'SCTP',
};

export function getProtocolName(protocol: number): string {
  return PROTOCOL_NAMES[protocol] ?? `未知协议 (${protocol})`;
}

/**
 * 解析十六进制字符串为字节数组，容忍空格/逗号/0x 前缀
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
 * RFC 1071 互联网校验和：对给定字节按 16 位字求和并回卷进位
 */
export function internetChecksum(bytes: number[]): number {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    const high = bytes[i]!;
    const low = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    sum += (high << 8) | low;
  }
  while ((sum & 0xffff0000) !== 0) {
    sum = (sum & 0xffff) + (sum >>> 16);
  }
  return (~sum) & 0xffff;
}

function toDotted(bytes: number[]): string {
  return bytes.join('.');
}

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

/**
 * 解析完整 IPv4 数据报（至少包含头部），返回结构化字段
 */
export function parseIpv4Header(input: string): Ipv4Header {
  const bytes = parseHexBytes(input);
  if (bytes.length < 20) {
    throw new Error(`IPv4 头部最少 20 字节，当前仅 ${bytes.length} 字节`);
  }
  const first = bytes[0]!;
  const version = first >>> 4;
  if (version !== 4) {
    throw new Error(`版本字段应为 4，实际为 ${version}`);
  }
  const ihl = first & 0x0f;
  const headerLength = ihl * 4;
  if (ihl < 5) {
    throw new Error(`IHL 最小值为 5（20 字节），实际为 ${ihl}`);
  }
  if (bytes.length < headerLength) {
    throw new Error(`IHL 声明头部 ${headerLength} 字节，但输入只有 ${bytes.length} 字节`);
  }

  const tos = bytes[1]!;
  const dscp = tos >>> 2;
  const ecn = tos & 0x03;
  const totalLength = (bytes[2]! << 8) | bytes[3]!;
  const identification = (bytes[4]! << 8) | bytes[5]!;
  const flagsAndOffset = ((bytes[6]! << 8) | bytes[7]!) >>> 0;
  const flags = {
    reserved: (bytes[6]! & 0x80) !== 0,
    df: (bytes[6]! & 0x40) !== 0,
    mf: (bytes[6]! & 0x20) !== 0,
  };
  const fragmentOffset = flagsAndOffset & 0x1fff;
  const ttl = bytes[8]!;
  const protocol = bytes[9]!;
  const headerChecksum = ((bytes[10]! << 8) | bytes[11]!) >>> 0;
  const sourceAddress = toDotted(bytes.slice(12, 16));
  const destinationAddress = toDotted(bytes.slice(16, 20));
  const options = bytes.slice(20, headerLength);

  // 校验和验证：对整个头部（含原校验和字段）求和，正确数据报结果应为 0
  const headerBytes = bytes.slice(0, headerLength);
  const computedChecksum = internetChecksum(headerBytes);
  const checksumValid = computedChecksum === 0;

  const headerGroups: string[] = [];
  for (let i = 0; i < headerLength; i += 4) {
    headerGroups.push(headerBytes.slice(i, i + 4).map(toHex).join(' '));
  }

  return {
    version,
    ihl,
    headerLength,
    dscp,
    ecn,
    totalLength,
    identification,
    flags,
    fragmentOffset,
    ttl,
    protocol,
    protocolName: getProtocolName(protocol),
    headerChecksum,
    sourceAddress,
    destinationAddress,
    optionsHex: options.map(toHex).join(' '),
    payloadLength: Math.max(totalLength - headerLength, 0),
    computedChecksum,
    checksumValid,
    headerHex: headerGroups.join('  '),
  };
}

/**
 * 构造一个最小 IPv4 头部（无选项，IHL=5），并自动计算头部校验和，
 * 便于教学与单元测试；返回字节数组
 */
export function buildIpv4Header(params: {
  dscp?: number;
  ecn?: number;
  totalLength: number;
  identification?: number;
  df?: boolean;
  mf?: boolean;
  fragmentOffset?: number;
  ttl: number;
  protocol: number;
  source: string;
  destination: string;
}): number[] {
  const source = params.source.split('.').map(Number);
  const destination = params.destination.split('.').map(Number);
  if (source.length !== 4 || destination.length !== 4) {
    throw new Error('源地址与目的地址必须是点分十进制 IPv4');
  }
  const bytes = new Array<number>(20).fill(0);
  bytes[0] = 0x45;
  bytes[1] = ((params.dscp ?? 0) << 2) | (params.ecn ?? 0);
  bytes[2] = (params.totalLength >>> 8) & 0xff;
  bytes[3] = params.totalLength & 0xff;
  bytes[4] = (params.identification ?? 0) >>> 8;
  bytes[5] = (params.identification ?? 0) & 0xff;
  const flagBits = (params.df ? 0x40 : 0) | (params.mf ? 0x20 : 0);
  const offset = params.fragmentOffset ?? 0;
  bytes[6] = flagBits | ((offset >>> 8) & 0x1f);
  bytes[7] = offset & 0xff;
  bytes[8] = params.ttl;
  bytes[9] = params.protocol;
  source.forEach((octet, index) => {
    bytes[12 + index] = octet;
  });
  destination.forEach((octet, index) => {
    bytes[16 + index] = octet;
  });
  const checksum = internetChecksum(bytes);
  bytes[10] = (checksum >>> 8) & 0xff;
  bytes[11] = checksum & 0xff;
  return bytes;
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(toHex).join(' ');
}
