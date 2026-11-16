/**
 * DHCPv4（RFC 2131）报文解析与构造纯函数。
 *
 * 报文布局：
 *  236 字节 BOOTP 定长头（op/htype/hlen/hops、xid、secs、flags、
 *  ciaddr/yiaddr/siaddr/giaddr、chaddr(16)、sname(64)、file(128)）
 *  + 4 字节 magic cookie 0x63825363
 *  + 变长 options（TLV：type 1B、len 1B、value len B），
 *    0x00 为 padding、0xFF 为 end。
 * 所有多字节整数按大端（network byte order）读写。
 */

export const BOOTP_HEADER_LENGTH = 236;
export const MAGIC_COOKIE_LENGTH = 4;
export const MIN_PACKET_LENGTH = BOOTP_HEADER_LENGTH + MAGIC_COOKIE_LENGTH;
export const MAGIC_COOKIE = 0x63825363;
export const OPTION_PAD = 0;
export const OPTION_END = 255;
export const OPTION_DHCP_MESSAGE_TYPE = 53;

/** BOOTP 头部字段偏移 */
const OFFSET = {
  op: 0,
  htype: 1,
  hlen: 2,
  hops: 3,
  xid: 4,
  secs: 8,
  flags: 10,
  ciaddr: 12,
  yiaddr: 16,
  siaddr: 20,
  giaddr: 24,
  chaddr: 28,
  sname: 44,
  file: 108,
  cookie: 236,
} as const;

/** 常用 DHCP option 类型名称（RFC 2132 子集） */
const OPTION_NAMES: Record<number, string> = {
  1: 'Subnet Mask',
  3: 'Router',
  6: 'Domain Name Server',
  12: 'Host Name',
  15: 'Domain Name',
  50: 'Requested IP Address',
  51: 'IP Address Lease Time',
  53: 'DHCP Message Type',
  55: 'Parameter Request List',
  61: 'Client Identifier',
  82: 'Relay Agent Information',
};

/** DHCP 消息类型（option 53）1–8 名称映射 */
const DHCP_MESSAGE_NAMES: Record<number, string> = {
  1: 'DISCOVER',
  2: 'OFFER',
  3: 'REQUEST',
  4: 'DECLINE',
  5: 'ACK',
  6: 'NAK',
  7: 'RELEASE',
  8: 'INFORM',
};

export class DhcpError extends Error {}

/** 单个已解析的 DHCP option */
export interface DhcpOption {
  /** option 类型编号 */
  type: number;
  /** 类型名称，未知类型为 `Unknown (<type>)` */
  name: string;
  /** value 长度（字节），padding/end 为 0 */
  length: number;
  /** 原始 value 字节的十六进制 */
  valueHex: string;
  /** 面向 UI 的可读值 */
  display: string;
}

/** BOOTP 定长头解析结果 */
export interface DhcpHeader {
  op: number;
  opName: string;
  htype: number;
  hlen: number;
  hops: number;
  xid: number;
  secs: number;
  flags: number;
  ciaddr: string;
  yiaddr: string;
  siaddr: string;
  giaddr: string;
  /** 按 hlen 截取后的 MAC 冒号格式（小写） */
  chaddrMac: string;
  /** chaddr 字段完整 16 字节十六进制 */
  chaddrHex: string;
  sname: string;
  file: string;
}

export interface ParsedDhcpPacket {
  header: DhcpHeader;
  cookie: number;
  options: DhcpOption[];
  /** 报文总字节数 */
  packetLength: number;
  /** 原始完整十六进制（大写、无分隔） */
  packetHex: string;
  /** 非阻断警告（如缺 end 标记、chaddr 冗余字节） */
  warnings: string[];
}

/** 构造器的单个 option 输入 */
export interface DhcpBuildOption {
  type: number;
  /** 文本值，按 option 类型解释（IP / 数字 / 文本 / 字节列表 / hex） */
  value: string;
}

export interface DhcpBuildConfig {
  /** 1=BOOTREQUEST（默认），2=BOOTREPLY */
  op?: number;
  htype?: number;
  hlen?: number;
  hops?: number;
  xid: number;
  secs?: number;
  flags?: number;
  ciaddr?: string;
  yiaddr?: string;
  siaddr?: string;
  giaddr?: string;
  /** 客户端 MAC，冒号/连字符/无分隔均可 */
  chaddr: string;
  sname?: string;
  file?: string;
  /** option 53 的值（1–8），自动写入，无需放进 options */
  messageType: number;
  /** 除 option 53 外的自定义 option */
  options?: DhcpBuildOption[];
}

/** 宽松解析十六进制字符串：去空格/换行/0x 前缀/冒号/连字符 */
export function hexToBytes(hexInput: string): Uint8Array {
  const cleaned = hexInput
    .trim()
    .replace(/0x/gi, '')
    .replace(/[\s:.-]/g, '');
  if (!cleaned) {
    throw new DhcpError('十六进制输入为空');
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new DhcpError('输入包含非十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new DhcpError('十六进制字符数为奇数，每个字节需要两位十六进制');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节数组转连续大写十六进制 */
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => (b ?? 0).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

/** MAC 文本（冒号/连字符/无分隔）转字节 */
export function parseMacAddress(input: string): Uint8Array {
  const hex = input.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  if (hex.length !== 12) {
    throw new DhcpError(
      `MAC 地址应为 6 字节（12 个十六进制字符），当前解析得到 ${hex.length} 个`,
    );
  }
  const bytes = new Uint8Array(6);
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节转小写冒号 MAC */
export function formatMac(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => (b ?? 0).toString(16).padStart(2, '0'))
    .join(':');
}

/** 点分十进制 IPv4 转 4 字节 */
export function parseIpv4(input: string): number[] {
  const parts = input.trim().split('.');
  if (parts.length !== 4) {
    throw new DhcpError(`IP 地址“${input}”不是合法的点分十进制 IPv4`);
  }
  const bytes = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new DhcpError(`IP 地址“${input}”包含非数字段`);
    }
    const value = Number(part);
    if (value < 0 || value > 255) {
      throw new DhcpError(`IP 地址“${input}”存在超出 0–255 的段`);
    }
    return value;
  });
  return bytes;
}

/** 4 字节转点分十进制 IPv4 */
export function formatIpv4(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, 4)).join('.');
}

/** 读取 C 风格 NUL 结尾字符串（sname/file 字段） */
function readNullTerminatedString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return Array.from(slice)
    .map((b) => String.fromCharCode(b ?? 0))
    .join('');
}

/** 32 位无符号秒数换算为天/时描述 */
export function formatLeaseTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const remainSeconds = seconds % 3600;
  const parts: string[] = [`${seconds} 秒`];
  if (days > 0 || hours > 0) {
    const human: string[] = [];
    if (days > 0) {
      human.push(`${days} 天`);
    }
    if (hours > 0) {
      human.push(`${hours} 小时`);
    }
    if (remainSeconds > 0) {
      human.push(`${remainSeconds} 秒`);
    }
    parts.push(`（约 ${human.join(' ')}）`);
  }
  return parts.join('');
}

/** option 类型编号转名称，未知类型返回 `Unknown (<type>)` */
export function getOptionName(type: number): string {
  return OPTION_NAMES[type] ?? `Unknown (${type})`;
}

/** DHCP 消息类型编号转名称（1–8），未知返回 `UNKNOWN (<type>)` */
export function getDhcpMessageName(value: number): string {
  return DHCP_MESSAGE_NAMES[value] ?? `UNKNOWN (${value})`;
}

/** 按 option 语义把 value 字节转成可读文本 */
function formatOptionValue(type: number, value: Uint8Array): string {
  const hex = bytesToHex(value);
  switch (type) {
    case 1:
    case 50:
      if (value.length === 4) {
        return formatIpv4(value);
      }
      return hex;
    case 3:
    case 6: {
      if (value.length >= 4 && value.length % 4 === 0) {
        const ips: string[] = [];
        for (let i = 0; i < value.length; i += 4) {
          ips.push(formatIpv4(value.slice(i, i + 4)));
        }
        return ips.join(', ');
      }
      return hex;
    }
    case 12:
    case 15:
      return Array.from(value)
        .map((b) => String.fromCharCode(b ?? 0))
        .join('');
    case 51: {
      if (value.length !== 4) {
        return hex;
      }
      const seconds = new DataView(value.buffer, value.byteOffset, 4).getUint32(0);
      return formatLeaseTime(seconds);
    }
    case 53: {
      const code = value[0] ?? 0;
      return `${getDhcpMessageName(code)} (${code})`;
    }
    case 55:
      return Array.from(value).join(', ');
    case 61:
      return `hex=${hex}${value.length > 1 ? `，首字节类型=${value[0] ?? 0}` : ''}`;
    case 82:
      return `Relay-Agent 子 TLV，hex=${hex}`;
    default:
      return hex;
  }
}

/**
 * 解析完整 DHCPv4 报文。
 * 错误均抛出带偏移/字段定位的 DhcpError（中文）；缺 end 等不阻断场景写入 warnings。
 */
export function parseDhcpPacket(input: string | Uint8Array): ParsedDhcpPacket {
  const bytes = typeof input === 'string' ? hexToBytes(input) : input;

  if (bytes.length < MIN_PACKET_LENGTH) {
    throw new DhcpError(
      `报文总长度 ${bytes.length} 字节，不足最小 ${MIN_PACKET_LENGTH} 字节（236 字节 BOOTP 头 + 4 字节 magic cookie）`,
    );
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const cookie = view.getUint32(OFFSET.cookie);
  if (cookie !== MAGIC_COOKIE) {
    throw new DhcpError(
      `magic cookie 校验失败：偏移 236 处应为 0x63825363，实际为 0x${cookie
        .toString(16)
        .padStart(8, '0')
        .toUpperCase()}`,
    );
  }

  const op = bytes[OFFSET.op] ?? 0;
  const htype = bytes[OFFSET.htype] ?? 0;
  const hlen = bytes[OFFSET.hlen] ?? 0;
  const hops = bytes[OFFSET.hops] ?? 0;
  const xid = view.getUint32(OFFSET.xid);
  const secs = view.getUint16(OFFSET.secs);
  const flags = view.getUint16(OFFSET.flags);

  const readIp = (offset: number): string =>
    formatIpv4(bytes.slice(offset, offset + 4));
  const ciaddr = readIp(OFFSET.ciaddr);
  const yiaddr = readIp(OFFSET.yiaddr);
  const siaddr = readIp(OFFSET.siaddr);
  const giaddr = readIp(OFFSET.giaddr);

  const chaddrFull = bytes.slice(OFFSET.chaddr, OFFSET.chaddr + 16);
  const effectiveHlen = Math.min(Math.max(hlen, 0), 16);
  const chaddrMac = formatMac(chaddrFull.slice(0, effectiveHlen));
  const chaddrTail = chaddrFull.slice(effectiveHlen);
  const warnings: string[] = [];
  if (chaddrTail.some((b) => b !== 0)) {
    warnings.push(
      `chaddr 字段共 16 字节，hlen=${hlen}，仅前 ${effectiveHlen} 字节作为客户端硬件地址解析，其余 ${
        16 - effectiveHlen
      } 字节已忽略（hex=${bytesToHex(chaddrTail)}）`,
    );
  }

  const sname = readNullTerminatedString(bytes.slice(OFFSET.sname, OFFSET.sname + 64));
  const file = readNullTerminatedString(bytes.slice(OFFSET.file, OFFSET.file + 128));

  const header: DhcpHeader = {
    op,
    opName: op === 1 ? 'BOOTREQUEST' : op === 2 ? 'BOOTREPLY' : `UNKNOWN (${op})`,
    htype,
    hlen,
    hops,
    xid,
    secs,
    flags,
    ciaddr,
    yiaddr,
    siaddr,
    giaddr,
    chaddrMac,
    chaddrHex: bytesToHex(chaddrFull),
    sname,
    file,
  };

  const options: DhcpOption[] = [];
  let offset = MIN_PACKET_LENGTH;
  let sawEnd = false;

  while (offset < bytes.length) {
    const type = bytes[offset];
    if (type === undefined) {
      break;
    }
    if (type === OPTION_PAD) {
      offset += 1;
      continue;
    }
    if (type === OPTION_END) {
      sawEnd = true;
      break;
    }
    if (offset + 1 >= bytes.length) {
      throw new DhcpError(
        `option 长度字段越界：偏移 ${offset} 处的 type=${type} 后缺少 length 字节（报文剩余 ${
          bytes.length - offset
        } 字节）`,
      );
    }
    const length = bytes[offset + 1] ?? 0;
    const valueStart = offset + 2;
    const valueEnd = valueStart + length;
    if (valueEnd > bytes.length) {
      throw new DhcpError(
        `option length 越界：偏移 ${offset} 处 type=${type} 声明长度 ${length} 字节，但报文剩余仅 ${
          bytes.length - valueStart
        } 字节`,
      );
    }
    const value = bytes.slice(valueStart, valueEnd);
    options.push({
      type,
      name: getOptionName(type),
      length,
      valueHex: bytesToHex(value),
      display: formatOptionValue(type, value),
    });
    offset = valueEnd;
  }

  if (!sawEnd) {
    warnings.push('options 区缺少 0xFF end 标记，已按报文末尾结束解析（非阻断）');
  }

  return {
    header,
    cookie,
    options,
    packetLength: bytes.length,
    packetHex: bytesToHex(bytes),
    warnings,
  };
}

/** 按 option 语义把文本值编码为字节 */
function encodeOptionValue(type: number, rawValue: string): number[] {
  const value = rawValue.trim();
  if (!value) {
    throw new DhcpError(`option ${type} 的值不能为空`);
  }
  switch (type) {
    case 1:
    case 50:
      return parseIpv4(value);
    case 3:
    case 6:
      return value.split(',').flatMap((ip) => parseIpv4(ip));
    case 51: {
      const seconds = Number(value);
      if (!Number.isInteger(seconds) || seconds < 0 || seconds > 0xffffffff) {
        throw new DhcpError(`option 51 租期需为 0–4294967295 的整数秒，当前为“${value}”`);
      }
      return [
        (seconds >>> 24) & 0xff,
        (seconds >>> 16) & 0xff,
        (seconds >>> 8) & 0xff,
        seconds & 0xff,
      ];
    }
    case 55: {
      const list = value.split(',').map((item) => {
        const num = Number(item.trim());
        if (!Number.isInteger(num) || num < 0 || num > 255) {
          throw new DhcpError(`option 55 参数请求列表每项需为 0–255 整数，非法项“${item}”`);
        }
        return num;
      });
      return list;
    }
    case 12:
    case 15:
      return Array.from(value).map((char) => char.charCodeAt(0) & 0xff);
    case 61:
    case 82:
    default: {
      const hex = value.replace(/0x/gi, '').replace(/[\s:.-]/g, '');
      if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
        throw new DhcpError(`option ${type} 的值需为偶数位十六进制（可含空格/冒号/0x）`);
      }
      const out: number[] = [];
      for (let i = 0; i < hex.length; i += 2) {
        out.push(Number.parseInt(hex.slice(i, i + 2), 16));
      }
      return out;
    }
  }
}

/**
 * 构造 DHCPv4 报文：236 字节 BOOTP 头 + cookie + option 53 + 自定义 options，
 * 自动 padding 对齐到 4 字节边界并以 0xFF end 收尾。
 */
export function buildDhcpPacket(config: DhcpBuildConfig): Uint8Array {
  const op = config.op ?? 1;
  const htype = config.htype ?? 1;
  const hlen = config.hlen ?? 6;
  const hops = config.hops ?? 0;
  const secs = config.secs ?? 0;
  const flags = config.flags ?? 0;
  const xid = config.xid;

  if (!Number.isInteger(op) || (op !== 1 && op !== 2)) {
    throw new DhcpError('op 仅支持 1（BOOTREQUEST）或 2（BOOTREPLY）');
  }
  for (const [label, num] of [
    ['htype', htype],
    ['hlen', hlen],
    ['hops', hops],
  ] as const) {
    if (!Number.isInteger(num) || num < 0 || num > 255) {
      throw new DhcpError(`${label} 需为 0–255 的整数`);
    }
  }
  if (!Number.isInteger(xid) || xid < 0 || xid > 0xffffffff) {
    throw new DhcpError('xid 需为 0–4294967295 的 32 位无符号整数');
  }
  if (!Number.isInteger(secs) || secs < 0 || secs > 0xffff) {
    throw new DhcpError('secs 需为 0–65535 的整数');
  }
  if (!Number.isInteger(flags) || flags < 0 || flags > 0xffff) {
    throw new DhcpError('flags 需为 0–65535 的整数');
  }
  if (!Number.isInteger(config.messageType) || config.messageType < 1 || config.messageType > 8) {
    throw new DhcpError('DHCP 消息类型（option 53）需为 1–8');
  }

  const mac = parseMacAddress(config.chaddr);
  if (hlen !== 6) {
    throw new DhcpError(`当前构造器仅支持 hlen=6 的以太网 MAC，收到 hlen=${hlen}`);
  }

  const packet: number[] = new Array<number>(BOOTP_HEADER_LENGTH).fill(0);
  packet[OFFSET.op] = op;
  packet[OFFSET.htype] = htype;
  packet[OFFSET.hlen] = hlen;
  packet[OFFSET.hops] = hops;
  const writeUint32 = (offset: number, value: number): void => {
    packet[offset] = (value >>> 24) & 0xff;
    packet[offset + 1] = (value >>> 16) & 0xff;
    packet[offset + 2] = (value >>> 8) & 0xff;
    packet[offset + 3] = value & 0xff;
  };
  const writeUint16 = (offset: number, value: number): void => {
    packet[offset] = (value >>> 8) & 0xff;
    packet[offset + 1] = value & 0xff;
  };
  writeUint32(OFFSET.xid, xid >>> 0);
  writeUint16(OFFSET.secs, secs);
  writeUint16(OFFSET.flags, flags);

  const writeIp = (offset: number, ip: string | undefined): void => {
    if (!ip || !ip.trim()) {
      return;
    }
    const ipBytes = parseIpv4(ip);
    ipBytes.forEach((b, i) => {
      packet[offset + i] = b;
    });
  };
  writeIp(OFFSET.ciaddr, config.ciaddr);
  writeIp(OFFSET.yiaddr, config.yiaddr);
  writeIp(OFFSET.siaddr, config.siaddr);
  writeIp(OFFSET.giaddr, config.giaddr);

  mac.forEach((b, i) => {
    packet[OFFSET.chaddr + i] = b;
  });

  const writeAsciiField = (offset: number, length: number, text: string | undefined): void => {
    if (!text) {
      return;
    }
    const bytes = Array.from(text).map((char) => char.charCodeAt(0) & 0xff);
    if (bytes.length > length) {
      throw new DhcpError(`字段文本最长 ${length} 字节，当前 ${bytes.length} 字节`);
    }
    bytes.forEach((b, i) => {
      packet[offset + i] = b;
    });
  };
  writeAsciiField(OFFSET.sname, 64, config.sname);
  writeAsciiField(OFFSET.file, 128, config.file);

  // magic cookie（大端 0x63825363）
  writeUint32(OFFSET.cookie, MAGIC_COOKIE);

  const pushOption = (type: number, value: number[]): void => {
    if (value.length > 255) {
      throw new DhcpError(`option ${type} 的值最长 255 字节，当前 ${value.length} 字节`);
    }
    packet.push(type, value.length, ...value);
  };

  // option 53 始终自动写入
  pushOption(OPTION_DHCP_MESSAGE_TYPE, [config.messageType]);

  for (const option of config.options ?? []) {
    if (option.type === OPTION_DHCP_MESSAGE_TYPE) {
      throw new DhcpError('option 53 由消息类型选择自动写入，请勿在自定义 option 中重复添加');
    }
    if (option.type === OPTION_PAD || option.type === OPTION_END) {
      throw new DhcpError(`option type ${option.type} 为保留标记（padding/end），不能手动添加`);
    }
    if (!Number.isInteger(option.type) || option.type < 1 || option.type > 254) {
      throw new DhcpError(`option type 需为 1–254 的整数，当前为 ${option.type}`);
    }
    pushOption(option.type, encodeOptionValue(option.type, option.value));
  }

  // padding 对齐到 4 字节边界，再写 end
  while ((packet.length + 1) % 4 !== 0) {
    packet.push(OPTION_PAD);
  }
  packet.push(OPTION_END);

  return Uint8Array.from(packet);
}
