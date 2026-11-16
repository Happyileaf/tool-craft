/**
 * UDP 报文（RFC 768）解析、构造与伪首部校验和计算的纯函数，零依赖、可在主线程运行。
 *
 * UDP 首部布局（8 字节）：
 *  0  Source Port（16 位）
 *  2  Destination Port（16 位）
 *  4  Length（16 位，首部 + 载荷的总字节数）
 *  6  Checksum（16 位）
 *  8  Payload（变长）
 */

export type IpVersion = 'ipv4' | 'ipv6';
export type ChecksumMode = 'disabled' | 'ipv4' | 'ipv6';

export interface UdpFieldView {
  /** 字段名 */
  field: string;
  /** 起始字节偏移（从 0 开始） */
  offset: number;
  /** 占用字节数 */
  length: number;
  /** 展示用值（十六进制，必要时附带十进制） */
  value: string;
}

export interface UdpBuildConfig {
  /** 源端口，0–65535，0 合法 */
  sourcePort: number;
  /** 目的端口，1–65535，0 非法 */
  destinationPort: number;
  /** 十六进制载荷，与 payloadText 同时提供时优先使用本字段 */
  payloadHex?: string;
  /** 文本载荷，使用 TextEncoder 按 UTF-8 编码 */
  payloadText?: string;
  /** 校验和模式：禁用 / 按 IPv4 伪首部 / 按 IPv6 伪首部 */
  checksumMode: ChecksumMode;
  /** 伪首部源地址 */
  srcIp?: string;
  /** 伪首部目的地址 */
  dstIp?: string;
  /** 显式指定 IP 版本（禁用校验和时用于判断是否违反 IPv6 强制校验和规则） */
  ipVersion?: IpVersion;
}

export interface UdpBuildResult {
  bytes: number[];
  hex: string;
  /** UDP Length 字段值（首部 + 载荷） */
  length: number;
  /** 写入报文的校验和；禁用模式为 null（字段为 0x0000） */
  checksum: number | null;
  fieldViews: UdpFieldView[];
}

export interface UdpParseOptions {
  srcIp?: string;
  dstIp?: string;
  ipVersion?: IpVersion;
}

export interface UdpParseResult {
  sourcePort: number;
  destinationPort: number;
  /** Length 字段声明的长度 */
  length: number;
  checksum: number;
  /** 提供合法伪首部地址时的校验结论；未提供地址或 IPv4 校验和为 0 时为 null */
  checksumValid: boolean | null;
  /** 按伪首部重算出的校验和；无法校验时为 null */
  expectedChecksum: number | null;
  payloadHex: string;
  payloadText: string;
  payloadLength: number;
  datagramLength: number;
  fieldViews: UdpFieldView[];
}

const UDP_PROTOCOL = 17;
const UDP_HEADER_LENGTH = 8;

/** 规范化并解析十六进制字符串为字节数组，容忍空格、逗号、冒号、换行与 0x 前缀 */
export function hexToBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
  if (!cleaned) {
    throw new Error('十六进制（hex）不能为空');
  }
  const illegal = cleaned.search(/[^0-9a-fA-F]/);
  if (illegal >= 0) {
    throw new Error(`十六进制（hex）在 nibble 偏移 ${illegal} 处包含非法字符“${cleaned[illegal]}”`);
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error(
      `十六进制（hex）的 nibble 数为奇数（${cleaned.length} 个），每个字节需要两位十六进制字符`,
    );
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 字节数组转大写十六进制，group>1 时每 group 个字节连成一组，组间空格分隔 */
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

/** 解析 IPv4 点分十进制地址为 4 字节 */
export function parseIpv4(input: string): number[] {
  const parts = input.trim().split('.');
  if (parts.length !== 4) {
    throw new Error(`源/目的 IPv4 地址“${input}”无效，应为点分十进制四段`);
  }
  return parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(`IPv4 地址“${input}”包含非法段“${part}”`);
    }
    const value = Number(part);
    if (value > 255) {
      throw new Error(`IPv4 地址“${input}”的段“${part}”超出 0–255 范围`);
    }
    return value;
  });
}

/** 解析单个 IPv6 16 位分组（1–4 位十六进制） */
function parseIpv6Group(part: string, address: string): number {
  if (!/^[0-9a-fA-F]{1,4}$/.test(part)) {
    throw new Error(`IPv6 地址“${address}”包含非法分组“${part}”`);
  }
  return parseInt(part, 16);
}

/** 解析不含嵌入 IPv4 的 IPv6 地址文本为 8 个 16 位分组 */
function splitIpv6Groups(address: string): number[] {
  if ((address.match(/::/g) ?? []).length > 1) {
    throw new Error(`IPv6 地址“${address}”最多只能出现一次“::”压缩`);
  }
  if (address.startsWith(':') && !address.startsWith('::')) {
    throw new Error(`IPv6 地址“${address}”不能以单个冒号开头`);
  }
  if (address.endsWith(':') && !address.endsWith('::')) {
    throw new Error(`IPv6 地址“${address}”不能以单个冒号结尾`);
  }

  if (!address.includes('::')) {
    const parts = address.split(':');
    if (parts.length !== 8) {
      throw new Error(`IPv6 地址“${address}”未使用“::”压缩时必须恰好包含 8 个分组`);
    }
    return parts.map((part) => parseIpv6Group(part, address));
  }

  const [leftPart, rightPart] = address.split('::');
  const left = leftPart ? leftPart.split(':') : [];
  const right = rightPart ? rightPart.split(':') : [];
  const explicitCount = left.length + right.length;
  if (explicitCount >= 8) {
    throw new Error(`IPv6 地址“${address}”的“::”至少要压缩一个全零分组`);
  }
  const leftGroups = left.map((part) => parseIpv6Group(part, address));
  const rightGroups = right.map((part) => parseIpv6Group(part, address));
  const zeroCount = 8 - explicitCount;
  return [...leftGroups, ...new Array<number>(zeroCount).fill(0), ...rightGroups];
}

/**
 * 确定性 IPv6 解析器，支持完整形式与“::”压缩，
 * 末段允许嵌入 IPv4 形式（如 ::ffff:192.0.2.1），返回 16 字节
 */
export function parseIpv6(input: string): number[] {
  const address = input.trim();
  if (!address) {
    throw new Error('IPv6 地址不能为空');
  }

  let normalized = address;
  const lastDot = address.lastIndexOf('.');
  if (lastDot >= 0) {
    const lastColon = address.lastIndexOf(':');
    if (lastColon < 0 || lastDot < lastColon) {
      throw new Error(`IPv6 地址“${address}”的嵌入 IPv4 段必须位于末尾`);
    }
    const v4Bytes = parseIpv4(address.slice(lastColon + 1));
    const embedded = [
      ((v4Bytes[0]! << 8) | v4Bytes[1]!).toString(16),
      ((v4Bytes[2]! << 8) | v4Bytes[3]!).toString(16),
    ].join(':');
    normalized = `${address.slice(0, lastColon + 1)}${embedded}`;
  }

  const groups = splitIpv6Groups(normalized);
  const bytes: number[] = [];
  for (const group of groups) {
    bytes.push((group >>> 8) & 0xff, group & 0xff);
  }
  return bytes;
}

/** 16 位反码求和：奇数字节末尾补 0 参与求和（不修改原数组），并折叠进位 */
export function onesComplementSum(bytes: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    sum += (bytes[i]! << 8) | bytes[i + 1]!;
  }
  if (bytes.length % 2 === 1) {
    sum += bytes[bytes.length - 1]! << 8;
  }
  while (sum >>> 16) {
    sum = (sum & 0xffff) + (sum >>> 16);
  }
  return sum & 0xffff;
}

/** 构造 IPv4 / IPv6 UDP 伪首部 */
function buildPseudoHeader(
  sourceBytes: number[],
  destinationBytes: number[],
  ipVersion: IpVersion,
  udpLength: number,
): number[] {
  if (ipVersion === 'ipv4') {
    return [
      ...sourceBytes,
      ...destinationBytes,
      0,
      UDP_PROTOCOL,
      (udpLength >>> 8) & 0xff,
      udpLength & 0xff,
    ];
  }
  return [
    ...sourceBytes,
    ...destinationBytes,
    (udpLength >>> 24) & 0xff,
    (udpLength >>> 16) & 0xff,
    (udpLength >>> 8) & 0xff,
    udpLength & 0xff,
    0,
    0,
    0,
    UDP_PROTOCOL,
  ];
}

/**
 * 计算 UDP 校验和：伪首部 + 校验和字段已置 0 的 UDP 报文参与反码求和后取反；
 * 结果为 0x0000 时按 RFC 768 改写为传输值 0xFFFF
 */
export function computeUdpChecksum(
  sourceBytes: number[],
  destinationBytes: number[],
  ipVersion: IpVersion,
  datagramWithZeroChecksum: number[],
): number {
  const pseudo = buildPseudoHeader(
    sourceBytes,
    destinationBytes,
    ipVersion,
    datagramWithZeroChecksum.length,
  );
  const checksum = (~onesComplementSum([...pseudo, ...datagramWithZeroChecksum])) & 0xffff;
  return checksum === 0 ? 0xffff : checksum;
}

function isPort(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 0xffff;
}

const portHex = (value: number): string => `0x${value.toString(16).padStart(4, '0').toUpperCase()}`;

/** 构造 UDP 报文，按配置回填校验和或显式禁用（IPv4 才允许禁用） */
export function buildUdpDatagram(config: UdpBuildConfig): UdpBuildResult {
  if (!isPort(config.sourcePort)) {
    throw new Error(`源端口（sourcePort）必须是 0–65535 之间的整数，当前为 ${config.sourcePort}`);
  }
  if (!isPort(config.destinationPort)) {
    throw new Error(
      `目的端口（destinationPort）必须是 0–65535 之间的整数，当前为 ${config.destinationPort}`,
    );
  }
  if (config.destinationPort === 0) {
    throw new Error('目的端口（destinationPort）不能为 0');
  }
  if (
    config.checksumMode === 'disabled' &&
    (config.ipVersion === 'ipv6' || config.srcIp?.includes(':') || config.dstIp?.includes(':'))
  ) {
    throw new Error('IPv6（RFC 8200）强制要求 UDP 校验和，不能选择禁用校验和');
  }

  let payload: number[];
  if (config.payloadHex && config.payloadHex.trim()) {
    payload = hexToBytes(config.payloadHex);
  } else if (config.payloadText !== undefined) {
    payload = Array.from(new TextEncoder().encode(config.payloadText));
  } else {
    payload = [];
  }

  const length = UDP_HEADER_LENGTH + payload.length;
  if (length > 0xffff) {
    throw new Error(`UDP 长度（Length）= 首部 8 + 载荷 ${payload.length} = ${length}，超出 65535 上限`);
  }

  const bytes: number[] = [
    (config.sourcePort >>> 8) & 0xff,
    config.sourcePort & 0xff,
    (config.destinationPort >>> 8) & 0xff,
    config.destinationPort & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
    0,
    0,
    ...payload,
  ];

  let checksum: number | null = null;
  if (config.checksumMode === 'ipv4') {
    if (!config.srcIp || !config.dstIp) {
      throw new Error('启用 IPv4 校验和时必须提供伪首部源地址与目的地址');
    }
    checksum = computeUdpChecksum(
      parseIpv4(config.srcIp),
      parseIpv4(config.dstIp),
      'ipv4',
      bytes,
    );
  } else if (config.checksumMode === 'ipv6') {
    if (!config.srcIp || !config.dstIp) {
      throw new Error('启用 IPv6 校验和时必须提供伪首部源地址与目的地址');
    }
    checksum = computeUdpChecksum(
      parseIpv6(config.srcIp),
      parseIpv6(config.dstIp),
      'ipv6',
      bytes,
    );
  }

  if (checksum !== null) {
    bytes[6] = (checksum >>> 8) & 0xff;
    bytes[7] = checksum & 0xff;
  }

  const fieldViews: UdpFieldView[] = [
    { field: '源端口 Source Port', offset: 0, length: 2, value: `${portHex(config.sourcePort)}（${config.sourcePort}）` },
    { field: '目的端口 Destination Port', offset: 2, length: 2, value: `${portHex(config.destinationPort)}（${config.destinationPort}）` },
    { field: '长度 Length', offset: 4, length: 2, value: `${portHex(length)}（${length} 字节）` },
    {
      field: '校验和 Checksum',
      offset: 6,
      length: 2,
      value: checksum === null ? '0x0000（已禁用）' : portHex(checksum),
    },
    {
      field: '载荷 Payload',
      offset: 8,
      length: payload.length,
      value: payload.length ? bytesToHex(payload, 16) : '（无载荷）',
    },
  ];

  return { bytes, hex: bytesToHex(bytes, 16), length, checksum, fieldViews };
}

/** 解析 UDP 报文；提供合法伪首部地址时重算校验和并给出结论 */
export function parseUdpDatagram(hex: string, options: UdpParseOptions = {}): UdpParseResult {
  const bytes = hexToBytes(hex);
  if (bytes.length < UDP_HEADER_LENGTH) {
    throw new Error(
      `UDP 报文至少需要 8 字节首部（字节偏移 0–7），当前仅 ${bytes.length} 字节`,
    );
  }

  const sourcePort = (bytes[0]! << 8) | bytes[1]!;
  const destinationPort = (bytes[2]! << 8) | bytes[3]!;
  const length = (bytes[4]! << 8) | bytes[5]!;
  const checksum = (bytes[6]! << 8) | bytes[7]!;

  if (length < UDP_HEADER_LENGTH) {
    throw new Error(
      `长度字段（Length，字节偏移 4–5）声明为 ${length}，小于 UDP 最小首部 8 字节`,
    );
  }
  if (length !== bytes.length) {
    throw new Error(
      `长度字段（Length，字节偏移 4–5）声明为 ${length}，但实际报文为 ${bytes.length} 字节，二者不一致`,
    );
  }

  const payload = bytes.slice(UDP_HEADER_LENGTH);
  const payloadText = new TextDecoder('utf-8').decode(new Uint8Array(payload));

  let checksumValid: boolean | null = null;
  let expectedChecksum: number | null = null;
  if (options.srcIp && options.dstIp) {
    const ipVersion: IpVersion =
      options.ipVersion ?? (options.srcIp.includes(':') ? 'ipv6' : 'ipv4');
    if (checksum === 0 && ipVersion === 'ipv4') {
      checksumValid = null;
    } else {
      const sourceBytes = ipVersion === 'ipv4' ? parseIpv4(options.srcIp) : parseIpv6(options.srcIp);
      const destinationBytes =
        ipVersion === 'ipv4' ? parseIpv4(options.dstIp) : parseIpv6(options.dstIp);
      const zeroed = [...bytes];
      zeroed[6] = 0;
      zeroed[7] = 0;
      expectedChecksum = computeUdpChecksum(sourceBytes, destinationBytes, ipVersion, zeroed);
      checksumValid = checksum === expectedChecksum;
    }
  }

  const fieldViews: UdpFieldView[] = [
    { field: '源端口 Source Port', offset: 0, length: 2, value: `${portHex(sourcePort)}（${sourcePort}）` },
    { field: '目的端口 Destination Port', offset: 2, length: 2, value: `${portHex(destinationPort)}（${destinationPort}）` },
    { field: '长度 Length', offset: 4, length: 2, value: `${portHex(length)}（${length} 字节）` },
    {
      field: '校验和 Checksum',
      offset: 6,
      length: 2,
      value:
        checksum === 0
          ? '0x0000（IPv4 表示未启用）'
          : `${portHex(checksum)}${expectedChecksum !== null ? `（重算 ${portHex(expectedChecksum)}）` : ''}`,
    },
    {
      field: '载荷 Payload',
      offset: 8,
      length: payload.length,
      value: payload.length ? bytesToHex(payload, 16) : '（无载荷）',
    },
  ];

  return {
    sourcePort,
    destinationPort,
    length,
    checksum,
    checksumValid,
    expectedChecksum,
    payloadHex: bytesToHex(payload, 16),
    payloadText,
    payloadLength: payload.length,
    datagramLength: bytes.length,
    fieldViews,
  };
}
