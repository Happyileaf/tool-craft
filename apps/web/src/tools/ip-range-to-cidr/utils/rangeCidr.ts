/**
 * IP 地址范围 → 最小 CIDR 列表聚合的纯函数集合
 *
 * 同时支持 IPv4 与 IPv6，地址统一以 BigInt 数值参与运算，
 * 不触碰 DOM / React，也不发起任何网络请求。
 */

/** 地址族 */
export type IpFamily = 4 | 6;

/** 单个 CIDR 块 */
export interface CidrBlock {
  /** 网络地址文本（IPv4 点分十进制 / IPv6 RFC 5952 压缩格式） */
  network: string;
  /** 前缀长度 */
  prefix: number;
  /** 块内首地址数值 */
  start: bigint;
  /** 块内末地址数值 */
  end: bigint;
  /** 地址族 */
  family: IpFamily;
}

/** 解析后的 IP 范围 */
export interface IpRange {
  /** 地址族 */
  family: IpFamily;
  /** 起始地址数值 */
  start: bigint;
  /** 结束地址数值 */
  end: bigint;
}

/** IPv6 单组位宽 */
const IPV6_GROUP_BITS = BigInt(16);

/** IPv6 单组最大值 */
const IPV6_GROUP_MASK = BigInt(0xffff);

/** IPv6 128 位全 1 */
const IPV6_FULL_MASK = (BigInt(1) << BigInt(128)) - BigInt(1);

/**
 * 解析点分十进制 IPv4 地址为 32 位 BigInt
 *
 * @param input - 点分十进制地址
 * @returns 32 位地址数值
 * @throws 段数、字符或段值非法时抛出错误
 */
export function parseIpv4(input: string): bigint {
  const text = input.trim();
  const parts = text.split('.');
  if (parts.length !== 4) {
    throw new Error(`IPv4 地址非法：${input}`);
  }
  let value = BigInt(0);
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error(`IPv4 地址非法：${input}`);
    }
    const octet = Number(part);
    if (octet > 255) {
      throw new Error(`IPv4 地址非法：${input}`);
    }
    value = (value << BigInt(8)) | BigInt(octet);
  }
  return value;
}

/**
 * 把 32 位数值格式化为点分十进制 IPv4
 *
 * @param value - 32 位地址数值
 * @returns 点分十进制文本
 */
export function formatIpv4(value: bigint): string {
  const octets: string[] = [];
  let rest = value;
  for (let index = 0; index < 4; index += 1) {
    octets.unshift((rest & BigInt(0xff)).toString());
    rest >>= BigInt(8);
  }
  return octets.join('.');
}

/**
 * 解析 IPv6 地址（支持 `::` 压缩）为 128 位 BigInt
 *
 * @param input - IPv6 地址文本
 * @returns 128 位地址数值
 * @throws 段数、压缩位置或字符非法时抛出错误
 */
export function parseIpv6(input: string): bigint {
  const text = input.trim().toLowerCase();
  if (text === '' || text.includes('%') || text.includes(':::')) {
    throw new Error(`IPv6 地址非法：${input}`);
  }
  if ((text.match(/::/g) ?? []).length > 1) {
    throw new Error(`IPv6 地址非法：${input}`);
  }

  let groups: string[];
  if (text.includes('::')) {
    const [left = '', right = ''] = text.split('::');
    const leftGroups = left === '' ? [] : left.split(':');
    const rightGroups = right === '' ? [] : right.split(':');
    const missing = 8 - leftGroups.length - rightGroups.length;
    if (missing < 1) {
      throw new Error(`IPv6 地址非法：${input}`);
    }
    groups = [...leftGroups, ...new Array<string>(missing).fill('0'), ...rightGroups];
  } else {
    groups = text.split(':');
    if (groups.length !== 8) {
      throw new Error(`IPv6 地址非法：${input}`);
    }
  }

  let value = BigInt(0);
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) {
      throw new Error(`IPv6 地址非法：${input}`);
    }
    value = (value << IPV6_GROUP_BITS) | BigInt(Number.parseInt(group, 16));
  }
  return value;
}

/**
 * 把 128 位数值格式化为 RFC 5952 压缩 IPv6（小写、最长零段用 :: 压缩）
 *
 * @param value - 128 位地址数值
 * @returns 规范化 IPv6 文本
 */
export function formatIpv6(value: bigint): string {
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
 * 自动识别地址族并解析单个 IP 文本
 *
 * @param input - IP 地址
 * @returns 地址族与数值
 */
export function parseIp(input: string): { family: IpFamily; value: bigint } {
  const text = input.trim();
  if (text.includes(':')) {
    return { family: 6, value: parseIpv6(text) };
  }
  return { family: 4, value: parseIpv4(text) };
}

/** 按地址族格式化地址数值 */
export function formatIp(value: bigint, family: IpFamily): string {
  return family === 4 ? formatIpv4(value) : formatIpv6(value);
}

/**
 * 解析一行或一段 `start - end` / `start end` 形式的 IP 范围
 *
 * @param input - 范围文本，起止地址可用 `-` 或空白分隔
 * @returns 解析后的范围
 * @throws 地址族混用、起止倒置或格式非法时抛出错误
 */
export function parseRange(input: string): IpRange {
  const text = input.trim();
  const match = text.match(/^(\S+)\s*[-\s]\s*(\S+)$/);
  if (!match) {
    throw new Error(`范围格式非法（应为「起始 IP - 结束 IP」）：${input}`);
  }
  const [, startText = '', endText = ''] = match;
  const start = parseIp(startText);
  const end = parseIp(endText);
  if (start.family !== end.family) {
    throw new Error('起始与结束地址必须属于同一地址族（不能混用 IPv4 与 IPv6）');
  }
  if (start.value > end.value) {
    throw new Error('起始地址不能大于结束地址');
  }
  return { family: start.family, start: start.value, end: end.value };
}

/**
 * 解析多行范围文本，每行一个范围
 *
 * @param text - 多行文本
 * @returns 范围数组（保持输入顺序）
 */
export function parseRanges(text: string): IpRange[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseRange(line));
}

/**
 * 把单个连续地址范围聚合为数量最少的 CIDR 块列表
 *
 * 贪心算法：从起始地址开始，取满足「块边界对齐且不越过结束地址」的
 * 最大块（前缀最短），逐块推进直到覆盖整个范围。
 *
 * @param range - 已解析的地址范围
 * @returns 最小 CIDR 块列表（按地址升序）
 */
export function rangeToCidrs(range: IpRange): CidrBlock[] {
  const maxBits = range.family === 4 ? 32 : 128;
  const blocks: CidrBlock[] = [];
  let cursor = range.start;

  while (cursor <= range.end) {
    // 当前地址尾部连续 0 的个数，决定以它为网络地址时最大的块尺寸
    const trailingZeros = cursor === BigInt(0) ? maxBits : countTrailingZeros(cursor);
    // 剩余地址数对应的块尺寸（2^size - 1 <= remaining）
    const remaining = range.end - cursor;
    const sizeByRemaining = floorPowerOfTwoExponent(remaining + BigInt(1));
    const sizeBits = Math.min(trailingZeros, sizeByRemaining, maxBits);

    const prefix = maxBits - sizeBits;
    const blockSize = BigInt(1) << BigInt(sizeBits);
    const blockEnd = cursor + blockSize - BigInt(1);
    blocks.push({
      network: formatIp(cursor, range.family),
      prefix,
      start: cursor,
      end: blockEnd,
      family: range.family,
    });
    cursor = blockEnd + BigInt(1);
  }

  return blocks;
}

/**
 * 统计非负 BigInt 的二进制尾部连续 0 的个数
 *
 * @param value - 正整数
 * @returns 尾部 0 的个数
 */
function countTrailingZeros(value: bigint): number {
  let count = 0;
  let current = value;
  while ((current & BigInt(1)) === BigInt(0)) {
    current >>= BigInt(1);
    count += 1;
  }
  return count;
}

/**
 * 返回不超过 value 的最大 2 的幂对应的指数 k（即 2^k <= value）
 *
 * @param value - 正整数
 * @returns 指数 k
 */
function floorPowerOfTwoExponent(value: bigint): number {
  let exponent = 0;
  let current = value;
  while (current > BigInt(1)) {
    current >>= BigInt(1);
    exponent += 1;
  }
  return exponent;
}

/**
 * 把 CIDR 块渲染为 `network/prefix` 文本
 *
 * @param block - CIDR 块
 * @returns 标准 CIDR 文本
 */
export function formatCidr(block: CidrBlock): string {
  return `${block.network}/${block.prefix}`;
}

/**
 * 统计 CIDR 列表覆盖的地址总数
 *
 * @param blocks - CIDR 块列表
 * @returns 地址总数（BigInt，规避 2^128 精度问题）
 */
export function totalAddresses(blocks: CidrBlock[]): bigint {
  return blocks.reduce(
    (sum, block) =>
      sum + (block.end - block.start + BigInt(1)),
    BigInt(0),
  );
}

/**
 * 解析单个 `network/prefix` 形式的 CIDR 文本
 *
 * @param input - CIDR 文本
 * @returns CIDR 块（network 为对齐后的网络地址）
 * @throws 缺少前缀、前缀越界或地址非法时抛出错误
 */
export function parseCidr(input: string): CidrBlock {
  const text = input.trim();
  const slashIndex = text.lastIndexOf('/');
  if (slashIndex < 0) {
    throw new Error(`CIDR 格式非法（应为「地址/前缀」）：${input}`);
  }
  const addressText = text.slice(0, slashIndex).trim();
  const prefixText = text.slice(slashIndex + 1).trim();
  if (!/^\d{1,3}$/.test(prefixText)) {
    throw new Error(`CIDR 前缀非法：${input}`);
  }
  const prefix = Number(prefixText);
  const { family, value } = parseIp(addressText);
  const maxBits = family === 4 ? 32 : 128;
  if (prefix < 0 || prefix > maxBits) {
    throw new Error(`CIDR 前缀 ${prefix} 超出范围 0-${maxBits}`);
  }
  const hostBits = maxBits - prefix;
  const blockSize = hostBits === maxBits ? BigInt(1) << BigInt(maxBits) : BigInt(1) << BigInt(hostBits);
  const network = prefix === 0 ? BigInt(0) : (value >> BigInt(hostBits)) << BigInt(hostBits);
  return {
    network: formatIp(network, family),
    prefix,
    start: network,
    end: network + blockSize - BigInt(1),
    family,
  };
}

/**
 * 解析多行 CIDR 文本，每行一个 CIDR
 *
 * @param text - 多行文本
 * @returns CIDR 块数组（保持输入顺序）
 */
export function parseCidrs(text: string): CidrBlock[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseCidr(line));
}

/**
 * 把一组可能重叠、相邻或包含的 CIDR 合并为数量最少的超网列表
 *
 * 先按起始地址排序并去除被包含块，再反复合并「同前缀、相邻且边界对齐」
 * 的成对块，直到无可合并项。不同地址族的输入会报错。
 *
 * @param blocks - 待合并的 CIDR 块列表
 * @returns 最小超网 CIDR 列表（按地址升序）
 * @throws 输入为空或混用 IPv4 / IPv6 时抛出错误
 */
export function mergeCidrs(blocks: CidrBlock[]): CidrBlock[] {
  if (blocks.length === 0) {
    throw new Error('请至少输入一个 CIDR');
  }
  const family = blocks[0]?.family;
  if (family === undefined || blocks.some((block) => block.family !== family)) {
    throw new Error('待合并的 CIDR 必须属于同一地址族（不能混用 IPv4 与 IPv6）');
  }
  const maxBits = family === 4 ? 32 : 128;

  // 按起始地址排序，丢弃被前一个块完全包含的块
  const sorted = [...blocks].sort((a, b) =>
    a.start === b.start ? Number(a.prefix - b.prefix) : a.start < b.start ? -1 : 1,
  );
  const deduped: CidrBlock[] = [];
  for (const block of sorted) {
    const previous = deduped[deduped.length - 1];
    if (previous && block.start <= previous.end) {
      continue;
    }
    deduped.push(block);
  }

  let merged = true;
  let current = deduped;
  while (merged) {
    merged = false;
    const next: CidrBlock[] = [];
    let index = 0;
    while (index < current.length) {
      const block = current[index];
      const neighbor = current[index + 1];
      if (block && neighbor && block.prefix === neighbor.prefix && block.prefix > 0) {
        const hostBits = maxBits - block.prefix;
        const blockSize = BigInt(1) << BigInt(hostBits);
        const aligned =
          block.start % (blockSize * BigInt(2)) === BigInt(0) &&
          neighbor.start === block.start + blockSize;
        if (aligned) {
          const newPrefix = block.prefix - 1;
          next.push({
            network: block.network,
            prefix: newPrefix,
            start: block.start,
            end: neighbor.end,
            family,
          });
          index += 2;
          merged = true;
          continue;
        }
      }
      if (block) {
        next.push(block);
      }
      index += 1;
    }
    current = next;
  }

  return current.map((block) => ({
    ...block,
    network: formatIp(block.start, family),
  }));
}
