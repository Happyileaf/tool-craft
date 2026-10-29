/**
 * DNS PTR 反向解析记录名构造的纯函数实现
 * IPv4 依据 RFC 1035（in-addr.arpa），IPv6 依据 RFC 3596 §2.5（ip6.arpa）
 * 不依赖任何运行时网络能力，全部为地址解析与字符串变换
 */

/** 地址类型 */
export type IpVersion = 4 | 6;

/** PTR 构造结果 */
export interface PtrResult {
  /** 地址类型 */
  version: IpVersion;
  /** 规范化后的地址（IPv6 为完整展开形式） */
  normalized: string;
  /** 完整 PTR 记录名（FQDN，不含末尾点） */
  ptrName: string;
  /** 指定前缀时对应的反向 zone 名；未指定前缀时与 ptrName 相同 */
  zoneName: string;
  /** 实际使用的前缀长度（bit） */
  prefixLength: number;
}

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const H16_REGEX = /^[0-9a-fA-F]{1,4}$/;

/**
 * 解析并校验 IPv4 地址，返回四个八位组
 *
 * @param input - 待解析的文本
 * @returns 四个 0-255 的八位组；非法时返回 null
 */
export function parseIpv4(input: string): number[] | null {
  const match = IPV4_REGEX.exec(input.trim());
  if (!match) {
    return null;
  }
  const octets: number[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const raw = match[i];
    if (raw === undefined) {
      return null;
    }
    // 拒绝前导零（如 01.1.1.1），避免八进制歧义
    if (raw.length > 1 && raw.charAt(0) === '0') {
      return null;
    }
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      return null;
    }
    octets.push(value);
  }
  return octets;
}

/**
 * 解析 IPv6 地址为 8 个 16 位组；支持 :: 压缩与尾部内嵌 IPv4
 *
 * @param input - 待解析的文本
 * @returns 8 个 0-65535 的 16 位组；非法时返回 null
 */
export function parseIpv6(input: string): number[] | null {
  const text = input.trim();
  if (!text) {
    return null;
  }
  // 显式范围区（如 fe80::1%eth0、带方括号）不予支持
  if (text.includes('%') || text.includes('[') || text.includes(']')) {
    return null;
  }
  const doubleColonCount = text.split('::').length - 1;
  if (doubleColonCount > 1) {
    return null;
  }

  let headPart = text;
  let embeddedV4: number[] | null = null;

  // 处理尾部内嵌 IPv4（如 ::ffff:192.0.2.1）
  const lastColon = headPart.lastIndexOf(':');
  const tail = lastColon >= 0 ? headPart.slice(lastColon + 1) : headPart;
  if (tail.includes('.')) {
    embeddedV4 = parseIpv4(tail);
    if (!embeddedV4) {
      return null;
    }
    // 截掉内嵌地址及其前导冒号，仅保留冒号分隔的 16 位组部分
    headPart = headPart.slice(0, lastColon).replace(/:$/, '');
  }

  const halves = headPart.split('::');
  if (halves.length > 2) {
    return null;
  }
  const parseGroups = (part: string): number[] | null => {
    if (part === '') {
      return [];
    }
    // "::1" split 后头部为空属合法；但形如 "1::" 尾空也合法
    const tokens = part.split(':');
    const groups: number[] = [];
    for (const token of tokens) {
      if (!H16_REGEX.test(token)) {
        return null;
      }
      groups.push(parseInt(token, 16));
    }
    return groups;
  };

  const left = halves[0] !== undefined ? parseGroups(halves[0]) : [];
  const right = halves[1] !== undefined ? parseGroups(halves[1]) : [];
  if (left === null || right === null) {
    return null;
  }

  let groups: number[];
  if (embeddedV4) {
    const v4Groups = [
      ((embeddedV4[0] ?? 0) << 8) | (embeddedV4[1] ?? 0),
      ((embeddedV4[2] ?? 0) << 8) | (embeddedV4[3] ?? 0),
    ];
    if (doubleColonCount === 0) {
      if (left.length !== 6 || right.length !== 0) {
        return null;
      }
      groups = [...left, ...v4Groups];
    } else {
      const hextets = left.length + right.length + 2;
      if (hextets > 8) {
        return null;
      }
      groups = [...left, ...new Array(8 - hextets).fill(0), ...right, ...v4Groups];
    }
  } else if (doubleColonCount === 0) {
    if (left.length !== 8 || right.length !== 0) {
      return null;
    }
    groups = left;
  } else {
    const explicit = left.length + right.length;
    if (explicit >= 8) {
      return null;
    }
    groups = [...left, ...new Array(8 - explicit).fill(0), ...right];
  }

  return groups.length === 8 ? groups : null;
}

/**
 * 把 8 个 16 位组展开为 32 个小写十六进制 nibble
 */
function toNibbles(groups: number[]): string {
  return groups
    .map((group) => group.toString(16).padStart(4, '0'))
    .join('');
}

/**
 * 探测地址类型；无法识别时抛出错误
 *
 * @param input - IPv4 或 IPv6 文本
 * @returns 地址版本
 */
export function detectVersion(input: string): IpVersion {
  if (parseIpv4(input)) {
    return 4;
  }
  if (parseIpv6(input)) {
    return 6;
  }
  throw new Error('无法识别为合法的 IPv4 或 IPv6 地址');
}

/**
 * 构造 PTR 反向解析记录名
 *
 * @param input - IPv4 或 IPv6 地址
 * @param prefixLength - 可选前缀长度（bit），用于构造 zone 名；IPv4 需为 8 的倍数，IPv6 需为 4 的倍数
 * @returns 完整 PTR 名与 zone 名
 */
export function buildPtr(input: string, prefixLength?: number): PtrResult {
  const octets = parseIpv4(input);
  if (octets) {
    const prefix = prefixLength ?? 32;
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32 || prefix % 8 !== 0) {
      throw new Error('IPv4 前缀长度必须是 0-32 之间 8 的倍数（如 8、16、24）');
    }
    const reversed = [...octets].reverse();
    const ptrName = `${reversed.join('.')}.in-addr.arpa`;
    const keep = prefix / 8;
    // zone 只含网络段八位组（原始顺序的前 keep 段，即反转序列的尾部）
    const zoneName = keep === 0 ? 'in-addr.arpa' : `${reversed.slice(4 - keep).join('.')}.in-addr.arpa`;
    return {
      version: 4,
      normalized: octets.join('.'),
      ptrName,
      zoneName,
      prefixLength: prefix,
    };
  }

  const groups = parseIpv6(input);
  if (groups) {
    const prefix = prefixLength ?? 128;
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128 || prefix % 4 !== 0) {
      throw new Error('IPv6 前缀长度必须是 0-128 之间 4 的倍数（如 32、48、64）');
    }
    const nibbles = toNibbles(groups);
    const normalized = (nibbles.match(/.{4}/g) ?? []).join(':');
    const reversedNibbles = nibbles.split('').reverse();
    const ptrName = `${reversedNibbles.join('.')}.ip6.arpa`;
    const keep = prefix / 4;
    // zone 只含前缀覆盖的 nibble（原始序列前部，即反转序列的尾部）
    const zoneName =
      keep === 0 ? 'ip6.arpa' : `${reversedNibbles.slice(32 - keep).join('.')}.ip6.arpa`;
    return {
      version: 6,
      normalized,
      ptrName,
      zoneName,
      prefixLength: prefix,
    };
  }

  throw new Error('无法识别为合法的 IPv4 或 IPv6 地址');
}
