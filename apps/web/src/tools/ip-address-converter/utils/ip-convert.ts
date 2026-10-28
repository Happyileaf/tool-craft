/**
 * IPv4 / IPv6 地址与整数 / 十六进制互转（零依赖纯函数）
 *
 * - IPv4：点分十进制 ↔ 32 位无符号整数 / 十六进制 / 二进制。
 * - IPv6：解析压缩形式（::）、完整形式与末尾内嵌 IPv4，转为 128 位 BigInt，
 *   再格式化为完整展开、压缩形式、十六进制整数、128 位二进制。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

const V4_BITS = BigInt(32);
const V6_BITS = BigInt(128);

export type IpVersion = 4 | 6;

export interface IpResult {
  version: IpVersion | null;
  /** 规范化点分 / 冒分形式（IPv6 为压缩形式） */
  canonical: string;
  /** 完整展开形式：IPv4 同 canonical；IPv6 为 8 组四位十六进制 */
  full: string;
  decimal: string;
  hex: string;
  binary: string;
  error: string | null;
}

function err(message: string): IpResult {
  return { version: null, canonical: '', full: '', decimal: '', hex: '', binary: '', error: message };
}

function toBinary(value: bigint, width: bigint): string {
  const w = Number(width);
  let out = '';
  for (let i = w - 1; i >= 0; i -= 1) {
    out += (value >> BigInt(i)) & BigInt(1) ? '1' : '0';
  }
  return out;
}

/* ---------------------------------- IPv4 ---------------------------------- */

/** 点分十进制 → uint32 BigInt；非法返回 null */
export function parseIpv4(input: string): bigint | null {
  const parts = input.trim().split('.');
  if (parts.length !== 4) {
    return null;
  }
  let value = BigInt(0);
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }
    // 拒绝前导零以外的歧义写法：允许 0，但不允许 '01'（与 inet_aton 八进制歧义划清界限）
    if (part.length > 1 && part[0] === '0') {
      return null;
    }
    const octet = Number(part);
    if (octet < 0 || octet > 255) {
      return null;
    }
    value = (value << BigInt(8)) | BigInt(octet);
  }
  return value;
}

export function formatIpv4(value: bigint): string {
  return [24, 16, 8, 0].map((shift) => Number((value >> BigInt(shift)) & BigInt(255))).join('.');
}

/* ---------------------------------- IPv6 ---------------------------------- */

/** 把末尾的内嵌 IPv4 转成两个 16 位组（hex，无补零）；无内嵌返回 null */
function embeddedV4ToGroups(tail: string): [string, string] | null {
  if (!tail.includes('.')) {
    return null;
  }
  const v4 = parseIpv4(tail);
  if (v4 === null) {
    return null;
  }
  return [(v4 >> BigInt(16)).toString(16), (v4 & BigInt(0xffff)).toString(16)];
}

/**
 * IPv6 文本 → 128 位 BigInt。
 * 合法条件：至多一个 `::`；展开后恰为 8 个 16 位组；每组 1–4 位十六进制。
 */
export function parseIpv6(input: string): bigint | null {
  const text = input.trim().toLowerCase();
  if (text === '' || /[^0-9a-f:.]/.test(text)) {
    return null;
  }
  const doubleColons = text.match(/::/g);
  if (!doubleColons) {
    return assembleV6(text.split(':'), null);
  }
  if (doubleColons.length > 1) {
    return null;
  }
  // 拆分 ::，注意首尾 :: 产生空串
  const at = text.indexOf('::');
  const headRaw = text.slice(0, at);
  const tailRaw = text.slice(at + 2);
  const head = headRaw === '' ? [] : headRaw.split(':');
  const tail = tailRaw === '' ? [] : tailRaw.split(':');
  return assembleV6(head, tail);
}

/** head/tail 为 :: 两侧的组（无 :: 时 tail 为 null，head 须恰为 8 组） */
function assembleV6(headRaw: string[], tailRaw: string[] | null): bigint | null {
  let groups: Array<string | null>;
  if (tailRaw === null) {
    if (headRaw.length !== 8 || headRaw.some((g) => g === '')) {
      return null;
    }
    groups = [...headRaw];
  } else {
    if (headRaw.some((g) => g === '') || tailRaw.some((g) => g === '')) {
      return null;
    }
    // 末尾可能内嵌一个 IPv4（占 2 组）
    const head = [...headRaw];
    const tail = [...tailRaw];
    if (tail.length > 0 && tail[tail.length - 1]?.includes('.')) {
      const last = tail.pop() ?? '';
      const embedded = embeddedV4ToGroups(last);
      if (embedded === null) {
        return null;
      }
      tail.push(embedded[0], embedded[1]);
    }
    if (head.some((g) => g.includes('.')) || tail.length + head.length > 8) {
      return null;
    }
    const gap = 8 - head.length - tail.length;
    if (gap <= 0) {
      return null; // :: 至少要压缩 1 个零组
    }
    groups = [...head, ...Array<string | null>(gap).fill(null), ...tail];
  }

  let value = BigInt(0);
  for (const group of groups) {
    // null 为 :: 展开的零组占位
    if (group !== null && !/^[0-9a-f]{1,4}$/.test(group)) {
      return null;
    }
    value = (value << BigInt(16)) | BigInt(group === null ? 0 : parseInt(group, 16));
  }
  return value;
}

/** BigInt → 8 组四位小写十六进制 */
export function expandIpv6(value: bigint): string[] {
  const groups: string[] = [];
  for (let i = 7; i >= 0; i -= 1) {
    groups.push(
      Number((value >> BigInt(i * 16)) & BigInt(0xffff)).toString(16).padStart(4, '0'),
    );
  }
  return groups;
}

/** RFC 5952 压缩：最长（并列取最前）的全零组序列（长度 ≥ 2）替换为 :: */
export function compressIpv6(value: bigint): string {
  const groups = expandIpv6(value).map((g) => g.replace(/^0+/, '') || '0');
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  groups.forEach((g, i) => {
    if (g === '0') {
      if (curLen === 0) {
        curStart = i;
      }
      curLen += 1;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curLen = 0;
    }
  });
  if (bestLen < 2) {
    return groups.join(':');
  }
  const head = groups.slice(0, bestStart).join(':');
  const tail = groups.slice(bestStart + bestLen).join(':');
  return `${head}::${tail}`;
}

/* --------------------------------- 统一入口 -------------------------------- */

/** 自动识别 IPv4 / IPv6 并输出全部表示形式 */
export function convertIp(input: string): IpResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return err('内容不能为空');
  }

  // IPv4：含点号且不含冒号
  if (trimmed.includes('.') && !trimmed.includes(':')) {
    const value = parseIpv4(trimmed);
    if (value === null) {
      return err(`「${trimmed}」不是合法的 IPv4 地址：需要 4 个 0–255 的十进制段`);
    }
    return {
      version: 4,
      canonical: formatIpv4(value),
      full: formatIpv4(value),
      decimal: value.toString(),
      hex: `0x${value.toString(16).toUpperCase().padStart(8, '0')}`,
      binary: toBinary(value, V4_BITS),
      error: null,
    };
  }

  // 兼容 ::ffff:192.168.0.1 等内嵌形式，统一走 IPv6 解析
  const value6 = parseIpv6(trimmed);
  if (value6 !== null) {
    const expanded = expandIpv6(value6).join(':');
    return {
      version: 6,
      canonical: compressIpv6(value6),
      full: expanded,
      decimal: value6.toString(),
      hex: `0x${value6.toString(16).toUpperCase().padStart(32, '0')}`,
      binary: toBinary(value6, V6_BITS),
      error: null,
    };
  }

  return err(`「${trimmed}」无法识别为合法的 IPv4 或 IPv6 地址`);
}

export interface BatchResult {
  output: string;
  warnings: string[];
}

/** 多行批量转换：每行一个地址，非法行原样保留并逐行标注 */
export function processLines(input: string): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = convertIp(line);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
      return;
    }
    const prefix = result.version === 4 ? 'IPv4' : 'IPv6';
    outputs.push(
      [
        `${line.trim()}  [${prefix}]`,
        `  规范形式：${result.canonical}`,
        `  完整展开：${result.full}`,
        `  十进制整数：${result.decimal}`,
        `  十六进制：${result.hex}`,
        `  二进制：${result.binary}`,
      ].join('\n'),
    );
  });
  return { output: outputs.join('\n'), warnings };
}
