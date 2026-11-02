/**
 * IPv4/IPv6 解析、RFC 5952 格式化与 CIDR 聚合纯函数内核
 *
 * 使用 BigInt 保证 128 位 IPv6 运算精度；为兼容 ES2017 编译目标，
 * 全程不使用 BigInt 字面量（123n），统一通过 B() 构造。
 */

export type IpVersion = 4 | 6;

/** 解析后的 IP */
export interface ParsedIp {
  version: IpVersion;
  value: bigint;
}

/** CIDR 块 */
export interface CidrBlock {
  version: IpVersion;
  /** 网络地址数值 */
  network: bigint;
  /** 前缀长度 */
  prefix: number;
  /** 标准文本，如 192.168.1.0/24 或 2001:db8::/32 */
  text: string;
  /** 块内地址总数 */
  size: bigint;
}

const IPV4_BITS = 32;
const IPV6_BITS = 128;

/** 数字 → bigint（避免 BigInt 字面量） */
function B(value: number | bigint): bigint {
  return BigInt(value);
}

const B0 = B(0);
const B1 = B(1);
const B8 = B(8);
const B16 = B(16);
const B255 = B(255);
const B65535 = B(65535);
const IPV4_MAX = (B1 << B(32)) - B1;
const IPV6_MAX = (B1 << B(128)) - B1;

/** IPv4 点分十进制 → bigint；非法抛出 Error */
export function parseIpv4(input: string): bigint {
  const text = input.trim();
  const parts = text.split('.');
  if (parts.length !== 4) {
    throw new Error(`"${input}" 不是合法 IPv4：需要 4 个点分十进制段`);
  }
  let value = B0;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index] ?? '';
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error(`"${input}" 的第 ${index + 1} 段 "${part}" 不是 0~255 的十进制整数`);
    }
    // 拒绝前导 0 歧义写法（如 01.1.1.1）
    if (part.length > 1 && part.startsWith('0')) {
      throw new Error(`"${input}" 含前导零段 "${part}"，请使用标准点分十进制写法`);
    }
    const octet = Number(part);
    if (octet > 255) {
      throw new Error(`"${input}" 的第 ${index + 1} 段 ${octet} 超出 0~255`);
    }
    value = (value << B8) | B(octet);
  }
  return value;
}

/** IPv6 → bigint，支持 :: 压缩与末段内嵌 IPv4；非法抛出 Error */
export function parseIpv6(input: string): bigint {
  const text = input.trim();
  if (text.length === 0) {
    throw new Error('IPv6 地址为空');
  }

  // 末段内嵌 IPv4（如 ::ffff:192.0.2.1）：先转成两组 hex
  let body = text;
  const lastColon = body.lastIndexOf(':');
  const lastSegment = body.slice(lastColon + 1);
  if (lastSegment.includes('.')) {
    const ipv4 = parseIpv4(lastSegment);
    const high = Number((ipv4 >> B16) & B65535);
    const low = Number(ipv4 & B65535);
    body = `${body.slice(0, lastColon + 1)}${high.toString(16)}:${low.toString(16)}`;
  }

  const doubleColonCount = (body.match(/::/g) ?? []).length;
  if (doubleColonCount > 1) {
    throw new Error(`"${input}" 中 :: 至多出现一次`);
  }

  let groups: string[];
  if (doubleColonCount === 1) {
    const separatorIndex = body.indexOf('::');
    const leftRaw = body.slice(0, separatorIndex);
    const rightRaw = body.slice(separatorIndex + 2);
    const left = leftRaw === '' ? [] : leftRaw.split(':');
    const right = rightRaw === '' ? [] : rightRaw.split(':');
    const missing = 8 - left.length - right.length;
    if (missing <= 0) {
      throw new Error(`"${input}" 的 :: 压缩段数不正确`);
    }
    groups = [...left, ...Array<string>(missing).fill('0'), ...right];
  } else {
    groups = body.split(':');
  }

  if (groups.length !== 8) {
    throw new Error(`"${input}" 不是合法 IPv6：应包含 8 组 16 进制段`);
  }

  let value = B0;
  groups.forEach((group, index) => {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      throw new Error(`"${input}" 的第 ${index + 1} 段 "${group}" 不是 1~4 位十六进制数`);
    }
    value = (value << B16) | B(parseInt(group, 16));
  });
  return value;
}

/** 自动识别并解析 IP（仅含点号按 IPv4，含冒号按 IPv6） */
export function parseIp(input: string): ParsedIp {
  const text = input.trim();
  if (text.includes('.') && !text.includes(':')) {
    return { version: 4, value: parseIpv4(text) };
  }
  if (text.includes(':')) {
    return { version: 6, value: parseIpv6(text) };
  }
  throw new Error(`"${input}" 既不是合法 IPv4 也不是 IPv6 地址`);
}

/** bigint → IPv4 点分十进制 */
export function formatIpv4(value: bigint): string {
  if (value < B0 || value > IPV4_MAX) {
    throw new Error(`数值 ${value} 超出 IPv4 范围`);
  }
  return [24, 16, 8, 0].map((shift) => Number((value >> B(shift)) & B255)).join('.');
}

/** bigint → RFC 5952 压缩格式 IPv6 */
export function formatIpv6(value: bigint): string {
  if (value < B0 || value > IPV6_MAX) {
    throw new Error(`数值 ${value} 超出 IPv6 范围`);
  }
  const groups: number[] = [];
  for (let index = 0; index < 8; index += 1) {
    const shift = B((7 - index) * 16);
    groups.push(Number((value >> shift) & B65535));
  }

  // RFC 5952：选择最长的连续全零段（并列取第一个），长度须 ≥ 2 才压缩
  let bestStart = -1;
  let bestLength = 1;
  let currentStart = -1;
  let currentLength = 0;
  groups.forEach((group, index) => {
    if (group === 0) {
      if (currentStart === -1) {
        currentStart = index;
        currentLength = 1;
      } else {
        currentLength += 1;
      }
      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
    } else {
      currentStart = -1;
      currentLength = 0;
    }
  });

  const hexGroups = groups.map((group) => group.toString(16));
  if (bestStart === -1) {
    return hexGroups.join(':');
  }
  const before = hexGroups.slice(0, bestStart).join(':');
  const after = hexGroups.slice(bestStart + bestLength).join(':');
  return `${before}::${after}`;
}

/** 按版本格式化 */
export function formatIp(value: bigint, version: IpVersion): string {
  return version === 4 ? formatIpv4(value) : formatIpv6(value);
}

/** value 末尾连续 0 的位数（最大不超过 totalBits） */
function trailingZeroBits(value: bigint, totalBits: number): number {
  if (value === B0) {
    return totalBits;
  }
  let bits = 0;
  let current = value;
  while ((current & B1) === B0 && bits < totalBits) {
    current >>= B1;
    bits += 1;
  }
  return bits;
}

/** 正整数的二进制位数（如 8→4，1→1） */
function bitLength(value: bigint): number {
  return value.toString(2).length;
}

/**
 * 把连续 [startValue, endValue] 区间聚合为数量最少的 CIDR 列表
 */
export function rangeToCidrs(startValue: bigint, endValue: bigint, version: IpVersion): CidrBlock[] {
  const totalBits = version === 4 ? IPV4_BITS : IPV6_BITS;
  const maxValue = (B1 << B(totalBits)) - B1;

  if (startValue < B0 || endValue > maxValue || startValue > endValue) {
    throw new Error('IP 区间非法：起始大于结束或超出地址空间');
  }

  const blocks: CidrBlock[] = [];
  let cursor = startValue;

  while (cursor <= endValue) {
    const zeros = trailingZeroBits(cursor, totalBits);
    // 不越过 end 所能容纳的最大块：hostBits = floor(log2(end - cursor + 1))
    const remaining = endValue - cursor + B1;
    const capacityBits = bitLength(remaining) - 1;
    const hostBits = Math.min(zeros, capacityBits);
    const prefix = totalBits - hostBits;
    const size = B1 << B(hostBits);

    blocks.push(makeBlock(cursor, prefix, version));
    cursor += size;
  }

  return blocks;
}

/** 解析两段 IP 文本并聚合（要求同版本） */
export function parseRangeToCidrs(startText: string, endText: string): CidrBlock[] {
  const start = parseIp(startText);
  const end = parseIp(endText);
  if (start.version !== end.version) {
    throw new Error(`起始地址（IPv${start.version}）与结束地址（IPv${end.version}）协议版本不一致`);
  }
  return rangeToCidrs(start.value, end.value, start.version);
}

function makeBlock(network: bigint, prefix: number, version: IpVersion): CidrBlock {
  const totalBits = version === 4 ? IPV4_BITS : IPV6_BITS;
  const hostBits = totalBits - prefix;
  return {
    version,
    network,
    prefix,
    text: `${formatIp(network, version)}/${prefix}`,
    size: B1 << B(hostBits),
  };
}

/** 解析单个 CIDR（如 10.0.0.0/24、2001:db8::/32） */
export function parseCidr(text: string): { version: IpVersion; low: bigint; high: bigint } {
  const trimmed = text.trim();
  const slashIndex = trimmed.indexOf('/');
  if (slashIndex === -1) {
    throw new Error(`"${text}" 缺少 /前缀长度`);
  }
  const addressText = trimmed.slice(0, slashIndex);
  const prefixText = trimmed.slice(slashIndex + 1);
  const parsed = parseIp(addressText);
  const totalBits = parsed.version === 4 ? IPV4_BITS : IPV6_BITS;

  if (!/^\d+$/.test(prefixText)) {
    throw new Error(`"${text}" 的前缀长度 "${prefixText}" 不是整数`);
  }
  const prefix = Number(prefixText);
  if (prefix < 0 || prefix > totalBits) {
    throw new Error(`"${text}" 的前缀长度必须在 0~${totalBits} 之间`);
  }

  const hostBits = B(totalBits - prefix);
  // 前导 1 网络掩码（/0 时为 0）
  const networkMask = ((B1 << B(totalBits)) - B1) ^ ((B1 << hostBits) - B1);
  const low = parsed.value & networkMask;
  const high = low | ((B1 << hostBits) - B1);
  return { version: parsed.version, low, high };
}

/**
 * 把一组可能重叠或相邻的 CIDR 合并为最小超网列表
 *
 * @param cidrTexts - CIDR 文本数组（必须同一协议版本）
 */
export function summarizeCidrs(cidrTexts: string[]): CidrBlock[] {
  const ranges = cidrTexts.map((text) => ({ ...parseCidr(text) }));

  if (ranges.length === 0) {
    return [];
  }
  const version = ranges[0]?.version;
  if (!version || ranges.some((range) => range.version !== version)) {
    throw new Error('待合并的 CIDR 必须全部属于同一 IP 协议版本');
  }

  ranges.sort((a, b) => (a.low === b.low ? 0 : a.low < b.low ? -1 : 1));

  const merged: Array<{ low: bigint; high: bigint }> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.low <= last.high + B1) {
      if (range.high > last.high) {
        last.high = range.high;
      }
    } else {
      merged.push({ low: range.low, high: range.high });
    }
  }

  return merged.flatMap((range) => rangeToCidrs(range.low, range.high, version));
}
