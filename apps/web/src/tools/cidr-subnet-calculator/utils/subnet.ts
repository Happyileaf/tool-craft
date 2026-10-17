/**
 * CIDR / IP 子网计算纯函数集合。
 * 支持 IPv4（CIDR 前缀或点分掩码）与 IPv6（CIDR 前缀）的网络地址、广播/末位地址、
 * 可用主机范围与掩码信息计算，全部为确定性纯函数，不触碰 DOM / React，也不发起网络请求。
 */

/** IPv4 子网计算结果 */
export interface Ipv4SubnetResult {
  /** 输入的 IP 地址（点分十进制） */
  address: string;
  /** CIDR 前缀长度（0-32） */
  prefixLength: number;
  /** 点分十进制子网掩码 */
  netmask: string;
  /** 通配符掩码（反掩码） */
  wildcardMask: string;
  /** 网络地址 */
  networkAddress: string;
  /** 广播地址 */
  broadcastAddress: string;
  /** 首个可用主机地址 */
  firstHost: string;
  /** 最后一个可用主机地址 */
  lastHost: string;
  /** 可用主机数量 */
  usableHosts: number;
  /** 网段内地址总数 */
  totalAddresses: number;
  /** 是否属于私有、回环或链路本地等保留网段 */
  isPrivate: boolean;
  /** 地址类别（A/B/C/D/E） */
  ipClass: string;
  /** 地址的 32 位二进制字符串 */
  binaryAddress: string;
  /** 子网掩码的 32 位二进制字符串 */
  binaryNetmask: string;
}

/** IPv6 子网计算结果 */
export interface Ipv6SubnetResult {
  /** 规范化（小写并按 RFC 5952 压缩）后的 IPv6 地址 */
  address: string;
  /** CIDR 前缀长度（0-128） */
  prefixLength: number;
  /** 网络地址 */
  networkAddress: string;
  /** 网段内首个主机地址（/128 时为地址本身，否则为网络地址 + 1） */
  firstAddress: string;
  /** 网段内最后一个地址 */
  lastAddress: string;
  /** 地址总数（十进制字符串） */
  totalAddresses: string;
}

/** IPv4 掩码全 1 */
const IPV4_FULL_MASK = 0xffffffff;

/** IPv6 128 位全 1 */
const IPV6_FULL_MASK = (BigInt(1) << BigInt(128)) - BigInt(1);

/** IPv6 单个地址组的位宽 */
const IPV6_GROUP_BITS = BigInt(16);

/** IPv6 单组最大值 */
const IPV6_GROUP_MASK = BigInt(0xffff);

/** 私有、回环与链路本地等保留网段（起止地址数值对） */
const RESERVED_IPV4_RANGES: readonly (readonly [number, number])[] = [
  [parseIpv4('10.0.0.0'), parseIpv4('10.255.255.255')],
  [parseIpv4('172.16.0.0'), parseIpv4('172.31.255.255')],
  [parseIpv4('192.168.0.0'), parseIpv4('192.168.255.255')],
  [parseIpv4('127.0.0.0'), parseIpv4('127.255.255.255')],
  [parseIpv4('169.254.0.0'), parseIpv4('169.254.255.255')],
];

/**
 * 把点分十进制 IPv4 地址解析为 32 位无符号整数
 *
 * @param input - 点分十进制地址，如 192.168.1.10
 * @returns 32 位无符号整数（0 - 4294967295）
 * @throws 段数不为 4、含非数字段或任一段超出 0-255 时抛出可读错误
 */
export function parseIpv4(input: string): number {
  const text = input.trim();
  const parts = text.split('.');
  if (parts.length !== 4) {
    throw new Error('IPv4 地址非法：' + input);
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error('IPv4 地址非法：' + input);
    }
    const octet = Number(part);
    if (octet > 255) {
      throw new Error('IPv4 地址非法：' + input);
    }
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

/**
 * 把 32 位无符号整数格式化为点分十进制 IPv4 地址
 *
 * @param value - 32 位地址数值
 * @returns 点分十进制地址
 */
export function formatIpv4(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join('.');
}

/**
 * 统计 32 位整数中置 1 的位数
 *
 * @param value - 待统计的数值
 * @returns 置 1 的位数
 */
function countSetBits(value: number): number {
  let rest = value >>> 0;
  let count = 0;
  while (rest !== 0) {
    count += rest & 1;
    rest >>>= 1;
  }
  return count;
}

/**
 * 由点分十进制子网掩码得到 CIDR 前缀长度
 *
 * @param mask - 点分十进制掩码，如 255.255.255.0
 * @returns 前缀长度（0-32）
 * @throws 掩码非「连续 1 后接连续 0」形式时抛出可读错误
 */
export function prefixFromMask(mask: string): number {
  const value = parseIpv4(mask);
  const inverted = ~value >>> 0;
  if (((inverted + 1) & inverted) !== 0) {
    throw new Error('子网掩码非法：必须为连续的 1');
  }
  return 32 - countSetBits(inverted);
}

/**
 * 解析 CIDR 前缀长度的数字文本
 *
 * @param text - 前缀数字文本
 * @returns 前缀长度数值
 * @throws 非纯数字文本时抛出可读错误
 */
function parsePrefixNumber(text: string): number {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) {
    throw new Error('CIDR 前缀非法：' + text);
  }
  return Number(trimmed);
}

/**
 * 把 32 位整数格式化为定长 32 位二进制字符串
 *
 * @param value - 待格式化的数值
 * @returns 32 位二进制字符串
 */
function toBinaryString(value: number): string {
  return (value >>> 0).toString(2).padStart(32, '0');
}

/**
 * 依据首字节把 IPv4 地址归入 A/B/C/D/E 类
 *
 * @param value - 32 位地址数值
 * @returns 地址类别字母
 */
function classifyIpv4(value: number): string {
  const first = (value >>> 24) & 0xff;
  if (first <= 127) return 'A';
  if (first <= 191) return 'B';
  if (first <= 223) return 'C';
  if (first <= 239) return 'D';
  return 'E';
}

/**
 * 判断地址是否落在私有、回环或链路本地等保留网段
 *
 * @param value - 32 位地址数值
 * @returns 命中任一保留网段返回 true
 */
function isReservedIpv4(value: number): boolean {
  return RESERVED_IPV4_RANGES.some(([start, end]) => value >= start && value <= end);
}

/**
 * 计算 IPv4 子网的网络地址、广播地址、可用主机范围与掩码信息
 *
 * 支持 `a.b.c.d/n`、`a.b.c.d m.m.m.m` 以及 `a.b.c.d/点分掩码` 三种输入形式；
 * 可用主机数遵循 RFC 3021：/32 为 1、/31 为 2，其余为 2^(32-前缀) - 2。
 *
 * @param input - 待计算的地址与前缀/掩码文本
 * @returns IPv4 子网计算结果
 * @throws 缺少地址或前缀、地址非法、前缀越界或掩码非连续时抛出可读错误
 */
export function calculateIpv4Subnet(input: string): Ipv4SubnetResult {
  const text = input.trim();
  if (text === '') {
    throw new Error('请输入 IP 地址或 CIDR 表示');
  }

  const tokens = text.split(/\s+/);
  let addressPart = '';
  let prefixPart = '';

  if (tokens.length === 2) {
    addressPart = tokens[0] ?? '';
    prefixPart = tokens[1] ?? '';
  } else if (tokens.length === 1) {
    const single = tokens[0] ?? '';
    const slashIndex = single.indexOf('/');
    if (slashIndex < 0) {
      throw new Error('缺少 CIDR 前缀或子网掩码：' + input);
    }
    addressPart = single.slice(0, slashIndex);
    prefixPart = single.slice(slashIndex + 1);
  } else {
    throw new Error('输入格式非法：' + input);
  }

  if (addressPart.trim() === '') {
    throw new Error('输入缺少 IP 地址部分：' + input);
  }
  if (prefixPart.trim() === '') {
    throw new Error('缺少 CIDR 前缀或子网掩码：' + input);
  }

  const prefixLength = prefixPart.includes('.')
    ? prefixFromMask(prefixPart)
    : parsePrefixNumber(prefixPart);

  if (prefixLength < 0 || prefixLength > 32) {
    throw new Error(`前缀长度 ${prefixLength} 超出范围 0-32`);
  }

  const addressValue = parseIpv4(addressPart.trim());
  const netmask = prefixLength === 0 ? 0 : (IPV4_FULL_MASK << (32 - prefixLength)) >>> 0;
  const wildcardMask = ~netmask >>> 0;
  const networkValue = (addressValue & netmask) >>> 0;
  const broadcastValue = (networkValue | wildcardMask) >>> 0;
  const totalAddresses = 2 ** (32 - prefixLength);

  let usableHosts: number;
  if (prefixLength === 32) {
    usableHosts = 1;
  } else if (prefixLength === 31) {
    usableHosts = 2;
  } else {
    usableHosts = totalAddresses - 2;
  }

  let firstHostValue: number;
  let lastHostValue: number;
  if (prefixLength === 32) {
    firstHostValue = addressValue;
    lastHostValue = addressValue;
  } else if (prefixLength === 31) {
    firstHostValue = networkValue;
    lastHostValue = broadcastValue;
  } else {
    firstHostValue = networkValue + 1;
    lastHostValue = broadcastValue - 1;
  }

  return {
    address: formatIpv4(addressValue),
    prefixLength,
    netmask: formatIpv4(netmask),
    wildcardMask: formatIpv4(wildcardMask),
    networkAddress: formatIpv4(networkValue),
    broadcastAddress: formatIpv4(broadcastValue),
    firstHost: formatIpv4(firstHostValue),
    lastHost: formatIpv4(lastHostValue),
    usableHosts,
    totalAddresses,
    isPrivate: isReservedIpv4(addressValue),
    ipClass: classifyIpv4(addressValue),
    binaryAddress: toBinaryString(addressValue),
    binaryNetmask: toBinaryString(netmask),
  };
}

/**
 * 把 IPv6 地址文本解析为 128 位无符号大整数
 *
 * @param input - IPv6 地址文本，支持 `::` 压缩与大小写混写
 * @returns 128 位地址数值
 * @throws 段数、字符或压缩位置非法时抛出可读错误
 */
function parseIpv6(input: string): bigint {
  const text = input.trim().toLowerCase();
  if (text === '' || text.includes('%')) {
    throw new Error('IPv6 地址非法：' + input);
  }

  const doubleColonCount = text.split('::').length - 1;
  if (doubleColonCount > 1 || text.includes(':::')) {
    throw new Error('IPv6 地址非法：' + input);
  }

  let groups: string[];
  if (text.includes('::')) {
    const [left = '', right = ''] = text.split('::');
    const leftGroups = left === '' ? [] : left.split(':');
    const rightGroups = right === '' ? [] : right.split(':');
    const missing = 8 - leftGroups.length - rightGroups.length;
    if (missing < 1) {
      throw new Error('IPv6 地址非法：' + input);
    }
    groups = [...leftGroups, ...new Array<string>(missing).fill('0'), ...rightGroups];
  } else {
    groups = text.split(':');
    if (groups.length !== 8) {
      throw new Error('IPv6 地址非法：' + input);
    }
  }

  let value = BigInt(0);
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) {
      throw new Error('IPv6 地址非法：' + input);
    }
    value = (value << IPV6_GROUP_BITS) | BigInt(Number.parseInt(group, 16));
  }
  return value;
}

/**
 * 把 128 位地址数值格式化为小写、按 RFC 5952 压缩（压缩最长连续 0 段）的 IPv6 地址
 *
 * @param value - 128 位地址数值
 * @returns 规范化后的 IPv6 地址文本
 */
function formatIpv6(value: bigint): string {
  const groups: number[] = [];
  let rest = value & IPV6_FULL_MASK;
  for (let index = 0; index < 8; index += 1) {
    groups.unshift(Number(rest & IPV6_GROUP_MASK));
    rest >>= IPV6_GROUP_BITS;
  }
  const hexGroups = groups.map((group) => group.toString(16));

  let bestStart = -1;
  let bestLength = 0;
  let runStart = -1;
  let runLength = 0;
  for (let index = 0; index < groups.length; index += 1) {
    if (groups[index] === 0) {
      if (runStart < 0) {
        runStart = index;
        runLength = 1;
      } else {
        runLength += 1;
      }
      if (runLength > bestLength) {
        bestLength = runLength;
        bestStart = runStart;
      }
    } else {
      runStart = -1;
      runLength = 0;
    }
  }

  if (bestLength < 2) {
    return hexGroups.join(':');
  }
  const left = hexGroups.slice(0, bestStart).join(':');
  const right = hexGroups.slice(bestStart + bestLength).join(':');
  return `${left}::${right}`;
}

/**
 * 计算 IPv6 子网的网络地址、地址范围与地址总数
 *
 * @param input - `addr/prefix` 形式的 IPv6 地址与前缀（0-128）
 * @returns IPv6 子网计算结果，地址数量以十进制字符串返回
 * @throws 缺少地址或前缀、地址非法或前缀越界时抛出可读错误
 */
export function calculateIpv6Subnet(input: string): Ipv6SubnetResult {
  const text = input.trim();
  if (text === '') {
    throw new Error('请输入 IPv6 地址或 CIDR 表示');
  }
  const slashIndex = text.indexOf('/');
  if (slashIndex < 0) {
    throw new Error('缺少 CIDR 前缀：' + input);
  }

  const addressPart = text.slice(0, slashIndex).trim();
  const prefixPart = text.slice(slashIndex + 1).trim();
  if (addressPart === '') {
    throw new Error('输入缺少 IPv6 地址部分：' + input);
  }
  if (!/^\d{1,3}$/.test(prefixPart)) {
    throw new Error('IPv6 前缀非法：' + prefixPart);
  }

  const prefixLength = Number(prefixPart);
  if (prefixLength < 0 || prefixLength > 128) {
    throw new Error(`IPv6 前缀长度 ${prefixLength} 超出范围 0-128`);
  }

  const addressValue = parseIpv6(addressPart);
  const hostBits = 128 - prefixLength;
  const netmask = IPV6_FULL_MASK ^ ((BigInt(1) << BigInt(hostBits)) - BigInt(1));
  const wildcard = IPV6_FULL_MASK ^ netmask;
  const networkValue = addressValue & netmask;
  const lastValue = networkValue | wildcard;
  const firstValue = prefixLength === 128 ? networkValue : networkValue + BigInt(1);
  const totalAddresses = (BigInt(1) << BigInt(hostBits)).toString();

  return {
    address: formatIpv6(addressValue),
    prefixLength,
    networkAddress: formatIpv6(networkValue),
    firstAddress: formatIpv6(firstValue),
    lastAddress: formatIpv6(lastValue),
    totalAddresses,
  };
}
