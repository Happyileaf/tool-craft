/**
 * 经典 PCAP（libpcap）抓包文件解析纯函数。
 *
 * 全局头 24 字节：magic、version、thiszone、sigfigs、snaplen、network
 * 分组头 16 字节：ts_sec、ts_usec/nsec、incl_len、orig_len
 */

export interface PcapPacket {
  index: number;
  timestampSeconds: number;
  timestampFraction: number;
  timestamp: string;
  capturedLength: number;
  originalLength: number;
  /** 原始长度大于捕获长度（抓包时被 snaplen 截断） */
  truncated: boolean;
  dataHex: string;
}

export interface PcapFile {
  magic: string;
  endianness: 'little' | 'big';
  timestampResolution: 'microsecond' | 'nanosecond';
  versionMajor: number;
  versionMinor: number;
  thiszone: number;
  sigfigs: number;
  snapLength: number;
  linkType: number;
  linkTypeName: string;
  packets: PcapPacket[];
  /** 文件中的分组记录总数（可能大于 packets.length 的展示上限） */
  totalPackets: number;
  /** 因展示上限而未包含在 packets 中的数量 */
  omittedPackets: number;
  fileLength: number;
  warnings: string[];
}

/** 解析时最多保留的分组数，避免超大文件阻塞渲染 */
const MAX_DISPLAY_PACKETS = 500;

const LINK_TYPES: Record<number, string> = {
  0: 'NULL / Loopback',
  1: 'Ethernet (10Mb)',
  101: 'Raw IP',
  105: 'IEEE 802.11',
  113: 'Linux SLL',
  127: 'IEEE 802.11 radiotap',
  276: 'Linux SLL2',
};

/** 解析十六进制字符串为字节数组，容忍空格、逗号、冒号、短横线与 0x 前缀 */
export function hexToBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
  if (!cleaned) {
    throw new Error('请输入十六进制数据或选择 .pcap 文件');
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
    hexes.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
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

const readU16 = (bytes: ArrayLike<number>, offset: number, little: boolean): number =>
  little ? (bytes[offset] + (bytes[offset + 1] << 8)) : ((bytes[offset] << 8) + bytes[offset + 1]);

const readU32 = (bytes: ArrayLike<number>, offset: number, little: boolean): number => {
  if (little) {
    return (bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] * 0x1000000)) >>> 0;
  }
  return ((bytes[offset] << 24) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
};

const readI32 = (bytes: ArrayLike<number>, offset: number, little: boolean): number => {
  const unsigned = readU32(bytes, offset, little);
  return unsigned >= 0x80000000 ? unsigned - 0x100000000 : unsigned;
};

const detectFormat = (bytes: ArrayLike<number>): {
  endianness: 'little' | 'big';
  timestampResolution: 'microsecond' | 'nanosecond';
  magic: string;
} => {
  const first = bytes[0];
  const second = bytes[1];
  const third = bytes[2];
  const fourth = bytes[3];
  if (first === 0xd4 && second === 0xc3 && third === 0xb2 && fourth === 0xa1) {
    return { endianness: 'little', timestampResolution: 'microsecond', magic: '0xA1B2C3D4' };
  }
  if (first === 0xa1 && second === 0xb2 && third === 0xc3 && fourth === 0xd4) {
    return { endianness: 'big', timestampResolution: 'microsecond', magic: '0xA1B2C3D4' };
  }
  if (first === 0x4d && second === 0x3c && third === 0xb2 && fourth === 0xa1) {
    return { endianness: 'little', timestampResolution: 'nanosecond', magic: '0xA1B23C4D' };
  }
  if (first === 0xa1 && second === 0xb2 && third === 0x3c && fourth === 0x4d) {
    return { endianness: 'big', timestampResolution: 'nanosecond', magic: '0xA1B23C4D' };
  }
  if (first === 0x0a && second === 0x0d && third === 0x0d && fourth === 0x0a) {
    throw new Error('检测到 pcapng（PCAP Next Generation）magic 0x0A0D0D0A，本工具仅支持经典 libpcap 格式');
  }
  throw new Error('未识别的文件 magic：既不是经典 PCAP（A1B2C3D4 系列），也不是 pcapng');
};

const formatTimestamp = (seconds: number, fraction: number, nano: boolean): string => {
  const milliseconds = nano ? Math.floor(fraction / 1_000_000) : Math.floor(fraction / 1_000);
  try {
    return new Date(seconds * 1000 + milliseconds).toISOString();
  } catch {
    return `${seconds}.${String(fraction).padStart(nano ? 9 : 6, '0')}`;
  }
};

/** 解析经典 PCAP 字节（Uint8Array / number[] 均可） */
export function parsePcap(bytes: ArrayLike<number>): PcapFile {
  if (bytes.length < 24) {
    throw new Error(`PCAP 全局头需要 24 字节（当前 ${bytes.length} 字节）`);
  }
  const format = detectFormat(bytes);
  const { endianness, timestampResolution } = format;
  const little = endianness === 'little';
  const nano = timestampResolution === 'nanosecond';

  const versionMajor = readU16(bytes, 4, little);
  const versionMinor = readU16(bytes, 6, little);
  const thiszone = readI32(bytes, 8, little);
  const sigfigs = readU32(bytes, 12, little);
  const snapLength = readU32(bytes, 16, little);
  const linkType = readU32(bytes, 20, little);

  const packets: PcapPacket[] = [];
  const warnings: string[] = [];
  let offset = 24;
  let totalPackets = 0;

  while (offset < bytes.length) {
    if (offset + 16 > bytes.length) {
      warnings.push(`末尾剩余 ${bytes.length - offset} 字节不足以构成完整分组头`);
      break;
    }
    const timestampSeconds = readU32(bytes, offset, little);
    const timestampFraction = readU32(bytes, offset + 4, little);
    const capturedLength = readU32(bytes, offset + 8, little);
    const originalLength = readU32(bytes, offset + 12, little);
    const dataStart = offset + 16;

    if (capturedLength > bytes.length - dataStart) {
      throw new Error(
        `第 ${totalPackets + 1} 个分组声明捕获 ${capturedLength} 字节，但文件仅剩 ${bytes.length - dataStart} 字节`,
      );
    }
    if (snapLength > 0 && capturedLength > snapLength) {
      warnings.push(`第 ${totalPackets + 1} 个分组捕获长度 ${capturedLength} 超过全局 snaplen ${snapLength}`);
    }
    if (capturedLength > 262144) {
      warnings.push(`第 ${totalPackets + 1} 个分组捕获长度异常（${capturedLength} 字节）`);
    }

    if (packets.length < MAX_DISPLAY_PACKETS) {
      packets.push({
        index: totalPackets + 1,
        timestampSeconds,
        timestampFraction,
        timestamp: formatTimestamp(timestampSeconds, timestampFraction, nano),
        capturedLength,
        originalLength,
        truncated: originalLength > capturedLength,
        dataHex: bytesToHex(bytes.slice(dataStart, dataStart + capturedLength), 16),
      });
    }
    totalPackets += 1;
    offset = dataStart + capturedLength;
  }

  return {
    magic: format.magic,
    endianness,
    timestampResolution,
    versionMajor,
    versionMinor,
    thiszone,
    sigfigs,
    snapLength,
    linkType,
    linkTypeName: LINK_TYPES[linkType] ?? `未知链路类型 (${linkType})`,
    packets,
    totalPackets,
    omittedPackets: Math.max(0, totalPackets - packets.length),
    fileLength: bytes.length,
    warnings,
  };
}
