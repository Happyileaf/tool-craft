/**
 * 以太网 II（DIX）帧解析、构造与 FCS（CRC-32）校验纯函数。
 *
 * 帧布局：
 *  0   Destination MAC (48 bit)
 *  48  Source MAC (48 bit)
 *  96  EtherType (16 bit)
 *  112 Payload (46–1500 字节，不含 FCS)
 *  末尾 Frame Check Sequence (32 bit CRC-32)
 */

/** 以太网帧解析结果 */
export interface EthernetFrame {
  destinationMac: string;
  sourceMac: string;
  etherType: number;
  etherTypeName: string;
  payloadHex: string;
  payloadLength: number;
  /** 检测到并剥离的 FCS（4 字节十六进制），未检测到时为 null */
  fcsHex: string | null;
  /** 输入末尾 4 字节是否与 CRC-32 计算结果一致 */
  fcsValid: boolean;
  /** 对帧体（不含 FCS）重算的 CRC-32 */
  computedFcs: number;
  /** 输入总字节数（含 FCS） */
  frameLength: number;
  frameHex: string;
  warnings: string[];
}

/** 构造以太网帧的输入参数 */
export interface EthernetBuildConfig {
  destination: string;
  source: string;
  etherType: number;
  payloadHex: string;
}

/** 常见 EtherType 名称（IEEE 802 / IANA 子集） */
const ETHER_TYPE_NAMES: Record<number, string> = {
  0x0800: 'IPv4',
  0x0806: 'ARP',
  0x8035: 'RARP',
  0x8100: 'IEEE 802.1Q VLAN',
  0x86dd: 'IPv6',
  0x8847: 'MPLS Unicast',
  0x8848: 'MPLS Multicast',
  0x8863: 'PPPoE Discovery',
  0x8864: 'PPPoE Session',
  0x88cc: 'LLDP',
  0x8906: 'FCoE',
};

export function getEtherTypeName(etherType: number): string {
  return ETHER_TYPE_NAMES[etherType] ?? `未知 EtherType (0x${etherType.toString(16).padStart(4, '0')})`;
}

/**
 * 解析十六进制字符串为字节数组，容忍空格、逗号、冒号、短横线与 0x 前缀
 */
export function hexToBytes(input: string): number[] {
  const cleaned = input
    .replace(/0x/gi, '')
    .replace(/[\s,:-]/g, '');
  if (!cleaned) {
    throw new Error('请输入十六进制数据');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('包含非法十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数（每个字节两位）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 字节数组转大写十六进制，默认按空格分组 */
export function bytesToHex(bytes: ArrayLike<number>, group = 1): string {
  const hexes: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hexes.push(bytes[i]!.toString(16).padStart(2, '0').toUpperCase());
  }
  if (group <= 1) {
    return hexes.join(' ');
  }
  const groups: string[] = [];
  for (let i = 0; i < hexes.length; i += group) {
    groups.push(hexes.slice(i, i + group).join(''));
  }
  return groups.join(' ');
}

/** 解析 MAC 地址为 6 字节 */
export function parseMac(input: string): number[] {
  const cleaned = input.trim().replace(/[:-]/g, '');
  if (!/^[0-9a-fA-F]{12}$/.test(cleaned)) {
    throw new Error(`MAC 地址“${input}”无效，应为 12 位十六进制（如 02:00:00:00:00:01）`);
  }
  const bytes: number[] = [];
  for (let i = 0; i < 12; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 6 字节转大写冒号分隔 MAC */
export function formatMac(bytes: ArrayLike<number>): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

/** CRC-32/IEEE 802.3 查找表（反射多项式 0xEDB88320） */
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/** 计算 CRC-32（与以太网 FCS 相同的 ISO-HDLC 参数：init 0xFFFFFFFF，xorout 0xFFFFFFFF） */
export function crc32(bytes: ArrayLike<number>): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 把 32 位无符号整数写成 4 个字节（大端） */
function uint32ToBytes(value: number): number[] {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}

/**
 * 解析以太网 II 帧。输入若末尾 4 字节恰好等于帧体的 CRC-32 则视为包含 FCS 并自动剥离。
 */
export function parseEthernetFrame(input: string): EthernetFrame {
  const bytes = hexToBytes(input);
  if (bytes.length < 14) {
    throw new Error(`以太网帧至少需要 14 字节（当前 ${bytes.length} 字节），仅含源/目的 MAC 与 EtherType`);
  }

  const destinationMac = formatMac(bytes.slice(0, 6));
  const sourceMac = formatMac(bytes.slice(6, 12));
  const etherType = ((bytes[12]! << 8) | bytes[13]!) >>> 0;

  let body = bytes;
  let fcsHex: string | null = null;
  let fcsValid = false;

  if (bytes.length >= 18) {
    const tailValue = ((bytes[bytes.length - 4]! << 24) |
      (bytes[bytes.length - 3]! << 16) |
      (bytes[bytes.length - 2]! << 8) |
      bytes[bytes.length - 1]!) >>> 0;
    const bodyCrc = crc32(bytes.slice(0, -4));
    if (tailValue === bodyCrc) {
      body = bytes.slice(0, -4);
      fcsHex = bytesToHex(bytes.slice(-4));
      fcsValid = true;
    }
  }

  const payload = body.slice(14);
  const computedFcs = crc32(body);
  const warnings: string[] = [];

  if (bytes.length < 64) {
    warnings.push(`帧长 ${bytes.length} 字节，低于以太网最小 64 字节（含 FCS），实际链路上会由网卡填充至 64 字节`);
  }
  if (bytes.length > 1518) {
    warnings.push(`帧长 ${bytes.length} 字节，超过标准以太网最大 1518 字节（不含 802.1Q 标签）`);
  }
  if (payload.length < 46 && fcsHex) {
    warnings.push('载荷短于 46 字节，属于填充帧（runt/padding），常见于 ARP 等小报文');
  }
  if (!fcsHex) {
    warnings.push('末尾 4 字节与帧体 CRC-32 不匹配：输入可能不含 FCS，或 FCS 已被损坏');
  }

  return {
    destinationMac,
    sourceMac,
    etherType,
    etherTypeName: getEtherTypeName(etherType),
    payloadHex: bytesToHex(payload, 16),
    payloadLength: payload.length,
    fcsHex,
    fcsValid,
    computedFcs,
    frameLength: bytes.length,
    frameHex: bytesToHex(bytes, 16),
    warnings,
  };
}

/**
 * 构造以太网 II 帧，自动追加 CRC-32 FCS。载荷允许 1–1500 字节。
 */
export function buildEthernetFrame(config: EthernetBuildConfig): { bytes: number[]; hex: string; fcs: number } {
  const destination = parseMac(config.destination);
  const source = parseMac(config.source);
  if (!Number.isInteger(config.etherType) || config.etherType < 0 || config.etherType > 0xffff) {
    throw new Error('EtherType 必须是 0–65535 之间的整数（常用 IPv4 为 0x0800）');
  }
  const payload = hexToBytes(config.payloadHex);
  if (payload.length > 1500) {
    throw new Error(`标准以太网载荷上限为 1500 字节（当前 ${payload.length} 字节）`);
  }
  if (payload.length === 0) {
    throw new Error('载荷不能为空');
  }

  const header = [...destination, ...source, (config.etherType >>> 8) & 0xff, config.etherType & 0xff];
  const body = [...header, ...payload];
  const fcs = crc32(body);
  const bytes = [...body, ...uint32ToBytes(fcs)];
  return { bytes, hex: bytesToHex(bytes, 16), fcs };
}
