/**
 * EUI-64 接口标识符与 SLAAC IPv6 地址派生（RFC 4291 / RFC 2373）。
 * 纯本地位运算与字符串格式化，不依赖任何外部库。
 */

export interface Eui64Result {
  /** 规范化后的 6 字节 MAC（冒号小写十六进制，如 "00:1c:c0:ff:fe:80"） */
  mac: string | null;
  /** 翻转前首字节（十六进制，如 "00"） */
  firstByteBefore: string | null;
  /** 翻转后首字节（十六进制，如 "02"） */
  firstByteAfter: string | null;
  /** EUI-64 接口标识符，4 组冒号小写十六进制 */
  interfaceId: string | null;
  /** fe80::/64 链路本地地址（零压缩规范形式） */
  linkLocal: string | null;
  /** 自定义 /64 前缀组合出的 SLAAC 地址（未给前缀时为 null） */
  slaac: string | null;
  /** 错误信息 */
  error: string | null;
}

type Byte = number;

/**
 * 解析常见写法的 48 位 MAC 地址为 6 字节元组。
 * 兼容 `aa:bb:cc:dd:ee:ff`、`aa-bb-cc-dd-ee-ff` 与 Cisco `aabb.ccdd.eeff`；
 * 也兼容无分隔符的 12 位十六进制串。
 */
export function parseMac(input: string): [Byte, Byte, Byte, Byte, Byte, Byte] | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === '') {
    return null;
  }

  let hex: string;
  if (trimmed.includes('.') && !trimmed.includes(':') && !trimmed.includes('-')) {
    // Cisco 点分：xxxx.xxxx.xxxx（3 组 4 位）
    const groups = trimmed.split('.');
    if (groups.length !== 3 || groups.some((g) => !/^[0-9a-f]{4}$/.test(g))) {
      return null;
    }
    hex = groups.join('');
  } else {
    const parts = trimmed.split(/[:\-]/);
    if (parts.length === 1) {
      if (!/^[0-9a-f]{12}$/.test(parts[0] ?? '')) {
        return null;
      }
      hex = parts[0] ?? '';
    } else if (parts.length === 6) {
      if (parts.some((p) => !/^[0-9a-f]{2}$/.test(p))) {
        return null;
      }
      hex = parts.join('');
    } else {
      return null;
    }
  }

  if (hex.length !== 12 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return [bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!, bytes[4]!, bytes[5]!];
}

/** 6 字节元组格式化为冒号分隔的小写十六进制串 */
export function formatMac(bytes: [Byte, Byte, Byte, Byte, Byte, Byte]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join(':');
}

/**
 * 由 6 字节 MAC 派生 8 字节 EUI-64 接口标识符：
 * 中间插入 ff:fe，并翻转首字节第 7 位（U/L 位，bit 1）。
 */
export function deriveEui64(mac: [Byte, Byte, Byte, Byte, Byte, Byte]): [
  Byte, Byte, Byte, Byte, Byte, Byte, Byte, Byte,
] {
  const [b0, b1, b2, b3, b4, b5] = mac;
  return [b0 ^ 0x02, b1, b2, 0xff, 0xfe, b3, b4, b5];
}

/** 把 8 字节（64 位）值转为 4 组冒号十六进制（每组去前导零，不做零压缩） */
export function formatInterfaceId(eui: [Byte, Byte, Byte, Byte, Byte, Byte, Byte, Byte]): string {
  const group = (hi: Byte, lo: Byte) => ((hi << 8) | lo).toString(16);
  return [
    group(eui[0], eui[1]),
    group(eui[2], eui[3]),
    group(eui[4], eui[5]),
    group(eui[6], eui[7]),
  ].join(':');
}

/**
 * RFC 5952 风格的 IPv6 零压缩：把最长的连续零组替换为 `::`。
 * 输入为 8 组十六进制串（每组可含前导零）。
 */
export function compressIpv6(groups: string[]): string {
  const normalized = groups.map((g) => g.replace(/^0+/, '') || '0');
  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  for (let i = 0; i <= normalized.length; i += 1) {
    if (i < normalized.length && normalized[i] === '0') {
      if (runStart === -1) {
        runStart = i;
      }
    } else if (runStart !== -1) {
      const len = i - runStart;
      if (len > bestLen) {
        bestLen = len;
        bestStart = runStart;
      }
      runStart = -1;
    }
  }
  if (bestLen < 2) {
    return normalized.join(':');
  }
  const head = normalized.slice(0, bestStart).join(':');
  const tail = normalized.slice(bestStart + bestLen).join(':');
  return `${head}::${tail}`;
}

/**
 * 解析 IPv6 文本为 8 组 4 位十六进制；非法返回 null。支持 `::` 零压缩。
 */
export function expandIpv6(text: string): [string, string, string, string, string, string, string, string] | null {
  if (text === '' || (text.match(/::/g) ?? []).length > 1) {
    return null;
  }
  const doubleColon = text.includes('::');
  const [headRaw, tailRaw] = text.split('::');
  if (!doubleColon) {
    const groups = text.split(':');
    if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) {
      return null;
    }
    return groups.map((g) => g.padStart(4, '0')) as [string, string, string, string, string, string, string, string];
  }
  const headGroups = headRaw === '' ? [] : (headRaw ?? '').split(':');
  const tailGroups = tailRaw === undefined || tailRaw === '' ? [] : tailRaw.split(':');
  if (
    headGroups.some((g) => !/^[0-9a-f]{1,4}$/.test(g)) ||
    tailGroups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))
  ) {
    return null;
  }
  const missing = 8 - headGroups.length - tailGroups.length;
  if (missing < 0) {
    return null;
  }
  const groups = [
    ...headGroups.map((g) => g.padStart(4, '0')),
    ...Array(missing).fill('0000'),
    ...tailGroups.map((g) => g.padStart(4, '0')),
  ];
  return groups as [string, string, string, string, string, string, string, string];
}

/**
 * 解析 /64 IPv6 前缀，返回前 8 字节；接受完整地址带 /64 或仅前缀地址。
 * 例如 "2001:db8:1::"、"2001:db8:1::/64"。
 */
export function parsePrefix64(input: string): [Byte, Byte, Byte, Byte, Byte, Byte, Byte, Byte] | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === '') {
    return null;
  }
  const withoutLen = trimmed.replace(/\/64$/, '').replace(/\/$/, '');
  const groups = expandIpv6(withoutLen);
  if (!groups) {
    return null;
  }
  const bytes: Byte[] = [];
  for (let i = 0; i < 4; i += 1) {
    const value = Number.parseInt(groups[i]!, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }
  return [bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!, bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!];
}

/** 组合前缀 8 字节与接口标识 8 字节为零压缩 IPv6 地址 */
export function combineAddress(
  prefix: [Byte, Byte, Byte, Byte, Byte, Byte, Byte, Byte],
  eui: [Byte, Byte, Byte, Byte, Byte, Byte, Byte, Byte],
): string {
  const all = [...prefix, ...eui];
  const groups: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    groups.push(((all[i]! << 8) | all[i + 1]!).toString(16).padStart(4, '0'));
  }
  return compressIpv6(groups);
}

/** 由接口标识符构造 fe80::/64 链路本地地址（RFC 5952 零压缩） */
export function buildLinkLocal(interfaceId: string): string {
  return compressIpv6(['fe80', '0000', '0000', '0000', ...interfaceId.split(':')]);
}

/** 完整派生入口：MAC 输入 + 可选 /64 前缀 */
export function computeEui64(macInput: string, prefixInput?: string): Eui64Result {
  const mac = parseMac(macInput);
  if (!mac) {
    return {
      mac: null,
      firstByteBefore: null,
      firstByteAfter: null,
      interfaceId: null,
      linkLocal: null,
      slaac: null,
      error: 'MAC 地址格式不合法：需要 6 字节十六进制，如 00:1c:c0:ff:fe:80',
    };
  }

  const eui = deriveEui64(mac);
  const interfaceId = formatInterfaceId(eui);
  const linkLocal = buildLinkLocal(interfaceId);
  const macText = formatMac(mac);
  const before = mac[0].toString(16).padStart(2, '0');
  const after = eui[0].toString(16).padStart(2, '0');

  if (prefixInput && prefixInput.trim() !== '') {
    const trimmedPrefix = prefixInput.trim();
    // 显式给出掩码长度时只允许 /64；省略时按 /64 前缀地址处理
    const slashMatch = trimmedPrefix.match(/\/(\d*)$/);
    if (slashMatch && slashMatch[1] !== '' && slashMatch[1] !== '64') {
      return {
        mac: macText,
        firstByteBefore: before,
        firstByteAfter: after,
        interfaceId,
        linkLocal,
        slaac: null,
        error: '自定义前缀必须是 /64',
      };
    }
    const prefixBytes = parsePrefix64(trimmedPrefix);
    if (!prefixBytes) {
      return {
        mac: macText,
        firstByteBefore: before,
        firstByteAfter: after,
        interfaceId,
        linkLocal,
        slaac: null,
        error: '前缀格式不合法：需要可路由的 IPv6 /64 前缀',
      };
    }
    return {
      mac: macText,
      firstByteBefore: before,
      firstByteAfter: after,
      interfaceId,
      linkLocal,
      slaac: combineAddress(prefixBytes, eui),
      error: null,
    };
  }

  return {
    mac: macText,
    firstByteBefore: before,
    firstByteAfter: after,
    interfaceId,
    linkLocal,
    slaac: null,
    error: null,
  };
}
