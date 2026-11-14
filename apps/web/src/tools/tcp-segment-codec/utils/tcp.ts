/**
 * TCP 报文段解析、构造与 IPv4 伪首部校验和计算的纯函数。
 *
 * 段布局：
 *  0  Source Port (16)
 *  2  Destination Port (16)
 *  4  Sequence Number (32)
 *  8  Acknowledgment Number (32)
 * 12  Data Offset (4) | Reserved (3) | NS (1)
 * 13  CWR ECE URG ACK PSH RST SYN FIN
 * 14  Window Size (16)
 * 16  Checksum (16)
 * 18  Urgent Pointer (16)
 * 20  Options (variable)
 *     Payload
 */

export interface TcpFlags {
  ns: boolean;
  cwr: boolean;
  ece: boolean;
  urg: boolean;
  ack: boolean;
  psh: boolean;
  rst: boolean;
  syn: boolean;
  fin: boolean;
}

export interface TcpOption {
  kind: number;
  name: string;
  length: number | null;
  valueHex: string;
  description: string;
}

export interface TcpSegment {
  sourcePort: number;
  destinationPort: number;
  sequenceNumber: number;
  acknowledgmentNumber: number;
  dataOffset: number;
  headerLength: number;
  flags: TcpFlags;
  windowSize: number;
  checksum: number;
  urgentPointer: number;
  options: TcpOption[];
  payloadHex: string;
  payloadLength: number;
  segmentLength: number;
  segmentHex: string;
  /** 提供了合法源/目的 IPv4 时，校验和是否有效；否则为 null */
  checksumValid: boolean | null;
  /** 按伪首部重算出的正确校验和 */
  expectedChecksum: number | null;
}

export interface TcpBuildOptions {
  mss?: number;
  windowScale?: number;
  sackPermitted?: boolean;
  timestamps?: { tsval: number; tsecr: number };
}

export interface TcpBuildConfig {
  sourcePort: number;
  destinationPort: number;
  sequenceNumber: number;
  acknowledgmentNumber: number;
  flags: Partial<TcpFlags>;
  windowSize: number;
  urgentPointer: number;
  payloadHex: string;
  options?: TcpBuildOptions;
  sourceIp?: string;
  destinationIp?: string;
}

const OPTION_NAMES: Record<number, string> = {
  0: 'End of Option List（选项结束）',
  1: 'No-Operation（无操作/对齐填充）',
  2: 'Maximum Segment Size（最大报文段长度）',
  3: 'Window Scale（窗口缩放因子）',
  4: 'SACK Permitted（允许选择性确认）',
  5: 'SACK（选择性确认块）',
  8: 'Timestamps（时间戳）',
  28: 'User Timeout（用户超时）',
  29: 'TCP Authentication Option（认证选项）',
};

/** 解析十六进制字符串为字节数组，容忍空格、逗号、冒号、短横线与 0x 前缀 */
export function hexToBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
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

/** 解析 IPv4 点分十进制地址为 4 字节 */
export function parseIpv4(input: string): number[] {
  const parts = input.trim().split('.');
  if (parts.length !== 4) {
    throw new Error(`IPv4 地址“${input}”无效，应为点分十进制四段`);
  }
  return parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(`IPv4 地址“${input}”含非法段`);
    }
    const value = Number(part);
    if (value < 0 || value > 255) {
      throw new Error(`IPv4 地址“${input}”的段超出 0–255`);
    }
    return value;
  });
}

const uint32Bytes = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

/** 16 位反码和折叠 */
function foldSum(bytes: number[]): number {
  let sum = 0;
  const padded = bytes.length % 2 === 1 ? [...bytes, 0] : bytes;
  for (let i = 0; i < padded.length; i += 2) {
    sum += (padded[i]! << 8) | padded[i + 1]!;
  }
  while (sum >>> 16) {
    sum = (sum & 0xffff) + (sum >>> 16);
  }
  return sum & 0xffff;
}

/** 构造 TCP 伪首部（IPv4：源/目的地址、0、协议号 6、TCP 长度） */
function buildPseudoHeader(sourceIp: number[], destinationIp: number[], tcpLength: number): number[] {
  return [
    ...sourceIp,
    ...destinationIp,
    0,
    6,
    (tcpLength >>> 8) & 0xff,
    tcpLength & 0xff,
  ];
}

/** 计算 TCP 校验和（传入的 segment 中校验和字段必须为 0） */
export function computeTcpChecksum(sourceIp: number[], destinationIp: number[], segment: number[]): number {
  const pseudo = buildPseudoHeader(sourceIp, destinationIp, segment.length);
  return (~foldSum([...pseudo, ...segment])) & 0xffff;
}

const flagBytes = (flags: Partial<TcpFlags>): [number, number] => {
  const low =
    (flags.cwr ? 0x80 : 0) |
    (flags.ece ? 0x40 : 0) |
    (flags.urg ? 0x20 : 0) |
    (flags.ack ? 0x10 : 0) |
    (flags.psh ? 0x08 : 0) |
    (flags.rst ? 0x04 : 0) |
    (flags.syn ? 0x02 : 0) |
    (flags.fin ? 0x01 : 0);
  return [flags.ns ? 0x01 : 0, low];
};

/** 解析选项区 */
export function parseTcpOptions(bytes: number[]): TcpOption[] {
  const options: TcpOption[] = [];
  let index = 0;
  while (index < bytes.length) {
    const kind = bytes[index]!;
    if (kind === 0) {
      options.push({
        kind,
        name: OPTION_NAMES[0]!,
        length: 1,
        valueHex: '',
        description: '选项列表结束，其后为载荷或填充',
      });
      break;
    }
    if (kind === 1) {
      options.push({
        kind,
        name: OPTION_NAMES[1]!,
        length: 1,
        valueHex: '',
        description: '1 字节对齐填充',
      });
      index += 1;
      continue;
    }
    if (index + 1 >= bytes.length) {
      throw new Error(`选项类型 ${kind} 在第 ${index + 1} 字节处缺少长度字段`);
    }
    const length = bytes[index + 1]!;
    if (length < 2) {
      throw new Error(`选项类型 ${kind} 的长度字段非法（${length}）`);
    }
    if (index + length > bytes.length) {
      throw new Error(`选项类型 ${kind} 声明长度 ${length} 超出选项区范围`);
    }
    const body = bytes.slice(index + 2, index + length);
    let description = '';
    if (kind === 2 && body.length === 2) {
      description = `MSS = ${((body[0]! << 8) | body[1]!) >>> 0} 字节`;
    } else if (kind === 3 && body.length === 1) {
      description = `窗口缩放因子 = ${body[0]}（窗口乘 2^${body[0]}）`;
    } else if (kind === 4) {
      description = '表示支持 SACK 选择性确认';
    } else if (kind === 5) {
      const blocks: string[] = [];
      for (let offset = 0; offset + 8 <= body.length; offset += 8) {
        const left =
          ((body[offset]! << 24) |
            (body[offset + 1]! << 16) |
            (body[offset + 2]! << 8) |
            body[offset + 3]!) >>> 0;
        const right =
          ((body[offset + 4]! << 24) |
            (body[offset + 5]! << 16) |
            (body[offset + 6]! << 8) |
            body[offset + 7]!) >>> 0;
        blocks.push(`${left}–${right}`);
      }
      description = blocks.length > 0 ? `SACK 块：${blocks.join('，')}` : 'SACK 块长度不足 8 字节';
    } else if (kind === 8 && body.length === 8) {
      const tsval =
        ((body[0]! << 24) | (body[1]! << 16) | (body[2]! << 8) | body[3]!) >>> 0;
      const tsecr =
        ((body[4]! << 24) | (body[5]! << 16) | (body[6]! << 8) | body[7]!) >>> 0;
      description = `TSval = ${tsval}，TSecr = ${tsecr}`;
    } else {
      description = body.length > 0 ? `原始值 ${bytesToHex(body)}` : '无数据';
    }
    options.push({
      kind,
      name: OPTION_NAMES[kind] ?? `未知选项（类型 ${kind}）`,
      length,
      valueHex: bytesToHex(body),
      description,
    });
    index += length;
  }
  return options;
}

/** 解析 TCP 报文段；提供合法源/目的 IPv4 时同时校验伪首部校验和 */
export function parseTcpSegment(input: string, sourceIp?: string, destinationIp?: string): TcpSegment {
  const bytes = hexToBytes(input);
  if (bytes.length < 20) {
    throw new Error(`TCP 报文段至少需要 20 字节固定头部（当前 ${bytes.length} 字节）`);
  }
  const dataOffset = bytes[12]! >> 4;
  if (dataOffset < 5) {
    throw new Error(`数据偏移字段为 ${dataOffset}（${dataOffset * 4} 字节），必须不小于 5（20 字节）`);
  }
  const headerLength = dataOffset * 4;
  if (headerLength > bytes.length) {
    throw new Error(`数据偏移声明头部 ${headerLength} 字节，超出报文段总长 ${bytes.length} 字节`);
  }

  const sourcePort = (bytes[0]! << 8) | bytes[1]!;
  const destinationPort = (bytes[2]! << 8) | bytes[3]!;
  const sequenceNumber =
    ((bytes[4]! << 24) | (bytes[5]! << 16) | (bytes[6]! << 8) | bytes[7]!) >>> 0;
  const acknowledgmentNumber =
    ((bytes[8]! << 24) | (bytes[9]! << 16) | (bytes[10]! << 8) | bytes[11]!) >>> 0;
  const flags: TcpFlags = {
    ns: Boolean(bytes[12]! & 0x01),
    cwr: Boolean(bytes[13]! & 0x80),
    ece: Boolean(bytes[13]! & 0x40),
    urg: Boolean(bytes[13]! & 0x20),
    ack: Boolean(bytes[13]! & 0x10),
    psh: Boolean(bytes[13]! & 0x08),
    rst: Boolean(bytes[13]! & 0x04),
    syn: Boolean(bytes[13]! & 0x02),
    fin: Boolean(bytes[13]! & 0x01),
  };
  const windowSize = (bytes[14]! << 8) | bytes[15]!;
  const checksum = (bytes[16]! << 8) | bytes[17]!;
  const urgentPointer = (bytes[18]! << 8) | bytes[19]!;

  const optionBytes = bytes.slice(20, headerLength);
  const options = parseTcpOptions(optionBytes);
  const payload = bytes.slice(headerLength);

  let checksumValid: boolean | null = null;
  let expectedChecksum: number | null = null;
  if (sourceIp?.trim() && destinationIp?.trim()) {
    const source = parseIpv4(sourceIp);
    const destination = parseIpv4(destinationIp);
    const zeroed = [...bytes];
    zeroed[16] = 0;
    zeroed[17] = 0;
    expectedChecksum = computeTcpChecksum(source, destination, zeroed);
    const pseudo = buildPseudoHeader(source, destination, bytes.length);
    checksumValid = foldSum([...pseudo, ...bytes]) === 0xffff;
  }

  return {
    sourcePort,
    destinationPort,
    sequenceNumber,
    acknowledgmentNumber,
    dataOffset,
    headerLength,
    flags,
    windowSize,
    checksum,
    urgentPointer,
    options,
    payloadHex: bytesToHex(payload, 16),
    payloadLength: payload.length,
    segmentLength: bytes.length,
    segmentHex: bytesToHex(bytes, 16),
    checksumValid,
    expectedChecksum,
  };
}

function isUint(value: number, max: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= max;
}

/** 构造 TCP 报文段；提供合法源/目的 IPv4 时写入正确校验和，否则校验和置 0 */
export function buildTcpSegment(config: TcpBuildConfig): { bytes: number[]; hex: string; checksum: number | null } {
  if (!isUint(config.sourcePort, 0xffff) || !isUint(config.destinationPort, 0xffff)) {
    throw new Error('源/目的端口必须是 0–65535 之间的整数');
  }
  if (!isUint(config.windowSize, 0xffff) || !isUint(config.urgentPointer, 0xffff)) {
    throw new Error('窗口大小与紧急指针必须是 0–65535 之间的整数');
  }
  if (!isUint(config.sequenceNumber, 0xffffffff) || !isUint(config.acknowledgmentNumber, 0xffffffff)) {
    throw new Error('序列号与确认号必须是 0–4294967295 之间的整数');
  }

  const payload = config.payloadHex.trim() ? hexToBytes(config.payloadHex) : [];
  const optionBytes: number[] = [];
  if (config.options?.mss !== undefined) {
    if (!isUint(config.options.mss, 0xffff)) {
      throw new Error('MSS 必须是 0–65535 之间的整数');
    }
    optionBytes.push(2, 4, config.options.mss >>> 8, config.options.mss & 0xff);
  }
  if (config.options?.windowScale !== undefined) {
    if (!isUint(config.options.windowScale, 255)) {
      throw new Error('窗口缩放因子必须是 0–255 之间的整数');
    }
    optionBytes.push(3, 3, config.options.windowScale);
  }
  if (config.options?.sackPermitted) {
    optionBytes.push(4, 2);
  }
  if (config.options?.timestamps) {
    optionBytes.push(
      8,
      10,
      ...uint32Bytes(config.options.timestamps.tsval),
      ...uint32Bytes(config.options.timestamps.tsecr),
    );
  }
  while (optionBytes.length % 4 !== 0) {
    optionBytes.push(1);
  }

  const headerLength = 20 + optionBytes.length;
  if (headerLength > 60) {
    throw new Error(`TCP 头部含选项上限为 60 字节（当前 ${headerLength} 字节）`);
  }
  const dataOffset = headerLength / 4;
  const [nsByte, flagByte] = flagBytes(config.flags);

  const segment: number[] = [
    (config.sourcePort >>> 8) & 0xff,
    config.sourcePort & 0xff,
    (config.destinationPort >>> 8) & 0xff,
    config.destinationPort & 0xff,
    ...uint32Bytes(config.sequenceNumber),
    ...uint32Bytes(config.acknowledgmentNumber),
    (dataOffset << 4) | nsByte,
    flagByte,
    (config.windowSize >>> 8) & 0xff,
    config.windowSize & 0xff,
    0,
    0,
    (config.urgentPointer >>> 8) & 0xff,
    config.urgentPointer & 0xff,
    ...optionBytes,
    ...payload,
  ];

  if (segment.length > 0xffff) {
    throw new Error('TCP 报文段总长不能超过 65535 字节');
  }

  let checksum: number | null = null;
  if (config.sourceIp?.trim() && config.destinationIp?.trim()) {
    const source = parseIpv4(config.sourceIp);
    const destination = parseIpv4(config.destinationIp);
    checksum = computeTcpChecksum(source, destination, segment);
    segment[16] = (checksum >>> 8) & 0xff;
    segment[17] = checksum & 0xff;
  }

  return { bytes: segment, hex: bytesToHex(segment, 16), checksum };
}
