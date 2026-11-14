/**
 * IPv4 子网掩码 ↔ 反掩码（Wildcard Mask）双向转换（零依赖纯函数）
 *
 * 子网掩码合法条件：32 位由连续的 1 后接连续的 0 构成（含全 0、全 1 两种极端）。
 * 反掩码 = 子网掩码按位取反（仅低 32 位），Cisco ACL/OSPF 常用。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出；数值全程用 number 即可（IPv4 32 位无符号）。
 */

export type MaskKind = 'subnet' | 'wildcard';

export interface SingleMaskResult {
  valid: boolean;
  error: string | null;
  /** 识别到的输入种类 */
  kind: MaskKind | null;
  /** 规范化后的输入点分串 */
  input: string;
  /** 对侧掩码点分串 */
  counterpart: string;
  /** 前缀长度 0–32（按子网掩码中 1 的个数） */
  prefix: number;
  /** 主机位数 32-prefix */
  hostBits: number;
  /** 子网掩码点分串 */
  subnetMask: string;
  /** 反掩码点分串 */
  wildcardMask: string;
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** 解析点分十进制为 32 位无符号整数；非法返回错误信息 */
function parseOctets(input: string): { value: number } | { error: string } {
  const match = IPV4_RE.exec(input.trim());
  if (!match) {
    return { error: '必须是 4 段点分十进制（如 255.255.255.0）' };
  }
  const octets = match.slice(1, 5).map((part) => Number(part));
  if (octets.some((octet) => octet > 255)) {
    return { error: '每个八位组必须在 0–255 之间' };
  }
  const value =
    ((octets[0]! << 24) >>> 0) +
    ((octets[1]! << 16) >>> 0) +
    ((octets[2]! << 8) >>> 0) +
    octets[3]!;
  return { value: value >>> 0 };
}

function toDotted(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

/** 判断 32 位值是否为「连续 1 后接连续 0」的合法子网掩码，返回前缀长度；非法返回 -1 */
function prefixOfContiguousMask(mask: number): number {
  const m = mask >>> 0;
  // 取反后 +1 若为 2 的幂（仅 1 个 1），则原数是连续 1 接连续 0
  const complement = (~m >>> 0) + 1;
  if ((complement & (complement - 1)) !== 0) {
    return -1;
  }
  // 统计前导 1 个数
  let prefix = 0;
  let bit = 31;
  while (bit >= 0 && ((m >>> bit) & 1) === 1) {
    prefix += 1;
    bit -= 1;
  }
  return prefix;
}

/**
 * 单条掩码转换。
 * 自动识别：能构成合法连续子网掩码的判为 subnet，其按位取反判为 wildcard；
 * 若输入本身不连续但按位取反后连续，则视为反掩码。
 */
export function processMask(input: string): SingleMaskResult {
  const trimmed = input.trim();
  const empty: SingleMaskResult = {
    valid: false,
    error: '内容不能为空',
    kind: null,
    input: '',
    counterpart: '',
    prefix: -1,
    hostBits: -1,
    subnetMask: '',
    wildcardMask: '',
  };
  if (trimmed === '') {
    return empty;
  }

  const parsed = parseOctets(trimmed);
  if ('error' in parsed) {
    return { ...empty, input: trimmed, error: parsed.error };
  }
  const value = parsed.value >>> 0;

  const asSubnetPrefix = prefixOfContiguousMask(value);
  if (asSubnetPrefix >= 0) {
    const wildcard = (~value >>> 0) >>> 0;
    return {
      valid: true,
      error: null,
      kind: 'subnet',
      input: toDotted(value),
      counterpart: toDotted(wildcard),
      prefix: asSubnetPrefix,
      hostBits: 32 - asSubnetPrefix,
      subnetMask: toDotted(value),
      wildcardMask: toDotted(wildcard),
    };
  }

  // 输入不是合法子网掩码：尝试把它当反掩码（其取反应为连续子网掩码）
  const flipped = (~value >>> 0) >>> 0;
  const asWildcardPrefix = prefixOfContiguousMask(flipped);
  if (asWildcardPrefix >= 0) {
    return {
      valid: true,
      error: null,
      kind: 'wildcard',
      input: toDotted(value),
      counterpart: toDotted(flipped),
      prefix: asWildcardPrefix,
      hostBits: 32 - asWildcardPrefix,
      subnetMask: toDotted(flipped),
      wildcardMask: toDotted(value),
    };
  }

  return {
    ...empty,
    input: toDotted(value),
    error: '非法掩码：既不是连续 1 接连续 0 的子网掩码，其取反也不合法',
  };
}

export interface NetworkResult {
  valid: boolean;
  error: string | null;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  hostCount: string;
}

/** 给定 IP 与前缀长度，计算网络地址、广播地址与可用主机范围 */
export function computeNetwork(ipInput: string, prefix: number): NetworkResult {
  const fail = (error: string): NetworkResult => ({
    valid: false,
    error,
    networkAddress: '',
    broadcastAddress: '',
    firstHost: '',
    lastHost: '',
    hostCount: '',
  });
  if (ipInput.trim() === '') {
    return fail('内容不能为空');
  }
  const parsed = parseOctets(ipInput);
  if ('error' in parsed) {
    return fail(parsed.error);
  }
  if (prefix < 0 || prefix > 32) {
    return fail('前缀长度必须在 0–32 之间');
  }
  const ip = parsed.value >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const wildcard = (~mask >>> 0) >>> 0;
  const broadcast = (network | wildcard) >>> 0;

  let firstHost = '';
  let lastHost = '';
  let hostCount: string;
  if (prefix >= 31) {
    // /31 链路（RFC 3021）与 /32 单地址：没有常规意义的可用主机区间
    firstHost = '—';
    lastHost = '—';
    hostCount = prefix === 32 ? '1（单主机地址）' : '2（RFC 3021 点对点链路）';
  } else {
    firstHost = toDotted((network + 1) >>> 0);
    lastHost = toDotted((broadcast - 1) >>> 0);
    hostCount = String(2 ** (32 - prefix) - 2);
  }

  return {
    valid: true,
    error: null,
    networkAddress: toDotted(network),
    broadcastAddress: toDotted(broadcast),
    firstHost,
    lastHost,
    hostCount,
  };
}

export interface BatchResult {
  output: string;
  warnings: string[];
}

/** 多行批量掩码转换：每行一个掩码，非法行原样保留并逐行标注 */
export function processLines(input: string): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processMask(line);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else {
      outputs.push(result.counterpart);
    }
  });
  return { output: outputs.join('\n'), warnings };
}
