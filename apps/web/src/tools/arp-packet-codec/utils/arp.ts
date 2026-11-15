export interface ArpPacket {
  hardwareType: number;
  protocolType: number;
  hardwareLength: number;
  protocolLength: number;
  operation: number;
  senderHardware: number[];
  senderProtocol: number[];
  targetHardware: number[];
  targetProtocol: number[];
  raw: number[];
}

export interface ArpParseResult {
  ok: boolean;
  packet?: ArpPacket;
  warnings: string[];
  error?: string;
}

export interface ArpBuildInput {
  operation: number;
  senderMac: string;
  senderIp: string;
  targetMac: string;
  targetIp: string;
}

export interface ArpBuildResult {
  ok: boolean;
  bytes?: number[];
  hex?: string;
  compact?: string;
  warnings: string[];
  error?: string;
}

export interface ArpLayoutRow {
  offset: number;
  length: number;
  name: string;
  value: string;
}

export const ARP_OPERATION_LABELS: Record<number, string> = {
  1: 'ARP Request（who-has）',
  2: 'ARP Reply（is-at）',
  3: 'RARP Request',
  4: 'RARP Reply',
};

export const BROADCAST_MAC = 'FF:FF:FF:FF:FF:FF';
export const SAMPLE_ARP =
  '00 01 08 00 06 04 00 01 00 11 22 33 44 55 C0 A8 01 01 00 00 00 00 00 00 C0 A8 01 02';

function parseHex(input: string): { ok: boolean; bytes: number[]; error?: string } {
  let digits = '';
  for (let index = 0; index < input.length; index += 1) {
    const ch = input.charAt(index);
    if (/\s/.test(ch) || ch === ',' || ch === '_' || ch === ':') continue;
    if (ch === '0' && (input.charAt(index + 1) === 'x' || input.charAt(index + 1) === 'X')) {
      index += 1;
      continue;
    }
    if (/[0-9a-fA-F]/.test(ch)) {
      digits += ch;
      continue;
    }
    return {
      ok: false,
      bytes: [],
      error: `非法字符 "${ch}"（第 ${index + 1} 个字符），仅支持十六进制数字与空白分隔`,
    };
  }
  if (digits === '') return { ok: false, bytes: [], error: '未找到有效的十六进制数字' };
  if (digits.length % 2 === 1) digits = `0${digits}`;
  const bytes: number[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    bytes.push(parseInt(digits.slice(i, i + 2), 16));
  }
  return { ok: true, bytes };
}

function hexBytes(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

export function formatHardwareAddress(bytes: number[]): string {
  if (bytes.length === 6) {
    return bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(':');
  }
  return hexBytes(bytes);
}

export function formatProtocolAddress(bytes: number[]): string {
  if (bytes.length === 4) return bytes.join('.');
  return hexBytes(bytes);
}

/** 解析十六进制 ARP 报文（以太网 + IPv4 标准 28 字节，同时按 HLEN/PLEN 支持其他长度）。 */
export function parseArp(input: string): ArpParseResult {
  const parsed = parseHex(input);
  if (!parsed.ok) return { ok: false, warnings: [], error: parsed.error };

  const bytes = parsed.bytes;
  const warnings: string[] = [];

  if (bytes.length < 8) {
    return {
      ok: false,
      warnings,
      error: `ARP 固定头至少需要 8 字节，当前只有 ${bytes.length} 字节`,
    };
  }

  const hardwareType = (bytes[0]! << 8) | bytes[1]!;
  const protocolType = (bytes[2]! << 8) | bytes[3]!;
  const hardwareLength = bytes[4]!;
  const protocolLength = bytes[5]!;
  const operation = (bytes[6]! << 8) | bytes[7]!;
  const expected = 8 + 2 * hardwareLength + 2 * protocolLength;

  if (bytes.length < expected) {
    return {
      ok: false,
      warnings,
      error: `按 HLEN=${hardwareLength}、PLEN=${protocolLength} 计算报文应为 ${expected} 字节，当前只有 ${bytes.length} 字节`,
    };
  }
  if (bytes.length > expected) {
    warnings.push(`报文长度 ${bytes.length} 字节，比按字段计算的 ${expected} 字节多出 ${bytes.length - expected} 字节，多余部分已忽略`);
  }
  if (hardwareType !== 1) {
    warnings.push(`硬件类型为 ${hardwareType}（0x${hardwareType.toString(16)}），非以太网（1），地址格式按通用字节显示`);
  }
  if (protocolType !== 0x0800) {
    warnings.push(`协议类型为 0x${protocolType.toString(16).toUpperCase()}，非 IPv4（0x0800），协议地址按通用字节显示`);
  }
  if (hardwareType === 1 && hardwareLength !== 6) {
    warnings.push(`以太网 ARP 的 HLEN 应为 6，当前为 ${hardwareLength}，报文结构可能异常`);
  }
  if (protocolType === 0x0800 && protocolLength !== 4) {
    warnings.push(`IPv4 ARP 的 PLEN 应为 4，当前为 ${protocolLength}，报文结构可能异常`);
  }
  if (expected !== 28 && hardwareType === 1 && protocolType === 0x0800) {
    warnings.push('以太网 + IPv4 场景的 ARP 报文应为 28 字节');
  }
  if (operation !== 1 && operation !== 2) {
    warnings.push(`操作码为 ${operation}，不是常见的 Request（1）或 Reply（2）`);
  }

  let cursor = 8;
  const senderHardware = bytes.slice(cursor, cursor + hardwareLength);
  cursor += hardwareLength;
  const senderProtocol = bytes.slice(cursor, cursor + protocolLength);
  cursor += protocolLength;
  const targetHardware = bytes.slice(cursor, cursor + hardwareLength);
  cursor += hardwareLength;
  const targetProtocol = bytes.slice(cursor, cursor + protocolLength);

  return {
    ok: true,
    warnings,
    packet: {
      hardwareType,
      protocolType,
      hardwareLength,
      protocolLength,
      operation,
      senderHardware,
      senderProtocol,
      targetHardware,
      targetProtocol,
      raw: bytes.slice(0, expected),
    },
  };
}

function parseMac(input: string): { ok: boolean; bytes?: number[]; error?: string } {
  const text = input.trim();
  if (text === '') return { ok: false, error: 'MAC 地址不能为空' };
  const digits = text.replace(/[:.\-]/g, '').replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]{12}$/.test(digits)) {
    return { ok: false, error: 'MAC 地址需为 6 个字节（如 00:11:22:33:44:55 或 001122334455）' };
  }
  const bytes: number[] = [];
  for (let i = 0; i < 12; i += 2) {
    bytes.push(parseInt(digits.slice(i, i + 2), 16));
  }
  return { ok: true, bytes };
}

function parseIpv4(input: string): { ok: boolean; bytes?: number[]; error?: string } {
  const text = input.trim();
  const parts = text.split('.');
  if (parts.length !== 4) {
    return { ok: false, error: 'IPv4 地址需为点分四段（如 192.168.1.1）' };
  }
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(part)) {
      return { ok: false, error: `IPv4 段 "${part}" 格式非法，应为 0-255 的十进制数且无前导零` };
    }
    const value = Number(part);
    if (value > 255) {
      return { ok: false, error: `IPv4 段 "${part}" 超出 0-255 范围` };
    }
    bytes.push(value);
  }
  return { ok: true, bytes };
}

/** 构造以太网 + IPv4 的 28 字节 ARP 报文。 */
export function buildArp(input: ArpBuildInput): ArpBuildResult {
  const warnings: string[] = [];
  if (!Number.isInteger(input.operation) || input.operation < 0 || input.operation > 65535) {
    return { ok: false, warnings, error: '操作码需为 0-65535 的整数' };
  }
  if (input.operation !== 1 && input.operation !== 2) {
    warnings.push(`操作码为 ${input.operation}，不是常见的 Request（1）或 Reply（2）`);
  }
  const senderMac = parseMac(input.senderMac);
  if (!senderMac.ok) {
    return { ok: false, warnings, error: `发送方 MAC 非法：${senderMac.error}` };
  }
  const targetMac = parseMac(input.targetMac);
  if (!targetMac.ok) {
    return { ok: false, warnings, error: `目标 MAC 非法：${targetMac.error}` };
  }
  const senderIp = parseIpv4(input.senderIp);
  if (!senderIp.ok) {
    return { ok: false, warnings, error: `发送方 IP 非法：${senderIp.error}` };
  }
  const targetIp = parseIpv4(input.targetIp);
  if (!targetIp.ok) {
    return { ok: false, warnings, error: `目标 IP 非法：${targetIp.error}` };
  }
  if (formatHardwareAddress(targetMac.bytes!) === BROADCAST_MAC) {
    warnings.push('目标 MAC 为广播地址 FF:FF:FF:FF:FF:FF，表示请求发送给链路上所有主机');
  }

  const bytes: number[] = [
    0x00, 0x01,
    0x08, 0x00,
    0x06, 0x04,
    (input.operation >> 8) & 0xff, input.operation & 0xff,
    ...senderMac.bytes!,
    ...senderIp.bytes!,
    ...targetMac.bytes!,
    ...targetIp.bytes!,
  ];

  return {
    ok: true,
    bytes,
    hex: hexBytes(bytes),
    compact: bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(''),
    warnings,
  };
}

/** 生成可读的字段字节布局视图。 */
export function buildLayout(packet: ArpPacket): ArpLayoutRow[] {
  const rows: ArpLayoutRow[] = [
    { offset: 0, length: 2, name: 'Hardware Type（硬件类型）', value: `${packet.hardwareType}（0x${packet.hardwareType.toString(16).padStart(4, '0').toUpperCase()}）` },
    { offset: 2, length: 2, name: 'Protocol Type（协议类型）', value: `0x${packet.protocolType.toString(16).padStart(4, '0').toUpperCase()}` },
    { offset: 4, length: 1, name: 'Hardware Length（HLEN）', value: `${packet.hardwareLength}` },
    { offset: 5, length: 1, name: 'Protocol Length（PLEN）', value: `${packet.protocolLength}` },
    { offset: 6, length: 2, name: 'Operation（操作码）', value: `${packet.operation}（${ARP_OPERATION_LABELS[packet.operation] ?? '未知'}）` },
  ];
  let cursor = 8;
  rows.push({ offset: cursor, length: packet.hardwareLength, name: 'Sender Hardware Address（发送方 MAC）', value: formatHardwareAddress(packet.senderHardware) });
  cursor += packet.hardwareLength;
  rows.push({ offset: cursor, length: packet.protocolLength, name: 'Sender Protocol Address（发送方 IP）', value: formatProtocolAddress(packet.senderProtocol) });
  cursor += packet.protocolLength;
  rows.push({ offset: cursor, length: packet.hardwareLength, name: 'Target Hardware Address（目标 MAC）', value: formatHardwareAddress(packet.targetHardware) });
  cursor += packet.hardwareLength;
  rows.push({ offset: cursor, length: packet.protocolLength, name: 'Target Protocol Address（目标 IP）', value: formatProtocolAddress(packet.targetProtocol) });
  return rows;
}
