/**
 * ASN.1 对象标识符（OID）点分十进制 ↔ BER/DER 内容字节编解码纯函数。
 * 仅处理 OID 单一类型的内容八进制组（不含 Tag/Length 头），
 * 全部为整数与 base-128 位运算，零外部依赖，可在 Node 与浏览器运行。
 */

/** 单个弧的编码步骤可视化记录 */
export interface ArcStep {
  /** 弧序号（从 0 开始） */
  index: number;
  /** 原始弧值；首弧为合并值 40·X+Y */
  value: bigint;
  /** base-128 分组后的 7 位组（高到低） */
  groups: number[];
  /** 最终输出字节（十进制），除最后一字节外高位置 1 */
  bytes: number[];
}

/** 编码结果 */
export interface OidEncodeResult {
  /** 是否成功 */
  ok: boolean;
  /** 成功时的内容字节（十进制 0–255） */
  bytes?: number[];
  /** 成功时的大写十六进制串，无空格 */
  hex?: string;
  /** 逐弧编码步骤 */
  steps?: ArcStep[];
  /** 失败时的错误信息 */
  error?: string;
}

/** 解码结果 */
export interface OidDecodeResult {
  /** 是否成功 */
  ok: boolean;
  /** 成功时的点分十进制 OID */
  oid?: string;
  /** 成功时的弧值数组（BigInt，支持超大弧） */
  arcs?: bigint[];
  /** 失败时的错误信息 */
  error?: string;
}

/** 常用 BigInt 常量（编译目标低于 ES2020，不能使用 bigint 字面量） */
const B0 = BigInt(0);
const B1 = BigInt(1);
const B2 = BigInt(2);
const B7 = BigInt(7);
const B40 = BigInt(40);
const B80 = BigInt(80);
const B127 = BigInt(0x7f);

/** 常见 OID 的内联名称表（少量内置，不依赖外部数据库） */
const WELL_KNOWN: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'rsaEncryption（RSA 加密）',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.113549.2.9': 'hmacWithSHA256',
  '1.2.840.10045.2.1': 'ecPublicKey（EC 公钥）',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.3.1.7': 'prime256v1 / P-256 曲线',
  '1.3.132.0.34': 'secp384r1 / P-384 曲线',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  '2.5.4.3': 'commonName（CN 通用名）',
  '2.5.4.6': 'countryName（C 国家）',
  '2.5.4.7': 'localityName（L 地区）',
  '2.5.4.10': 'organizationName（O 组织）',
  '2.5.4.11': 'organizationalUnitName（OU 部门）',
  '2.5.6.2': 'top（顶级对象类）',
  '2.16.840.1.101.3.4.2.1': 'SHA-256',
  '2.16.840.1.101.3.4.2.2': 'SHA-384',
  '2.16.840.1.101.3.4.2.3': 'SHA-512',
  '1.3.14.3.2.26': 'SHA-1',
  '2.5.4.5': 'serialNumber（序列号）',
  '1.2.840.113549.1.9.1': 'emailAddress（PKCS#9 邮箱）',
  '1.2.840.113549.1.7.2': 'signedData（PKCS#7）',
  '0.9.2342.19200300.100.1.25': 'domainComponent（DC）',
  '2.5.29.17': 'subjectAltName（SAN 主题备用名称）',
  '2.5.29.31': 'cRLDistributionPoints',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess（AIA）',
};

/**
 * 查询 OID 的内置常见名称。
 *
 * @param oid - 点分十进制 OID
 * @returns 名称；未收录时返回 null
 */
export function lookupOidName(oid: string): string | null {
  return WELL_KNOWN[oid.trim()] ?? null;
}

/**
 * 把点分十进制 OID 编码为 BER/DER 内容字节。
 *
 * 规则：首两弧 X、Y 合并为 40·X+Y（X 为 0/1 时 Y 任意，X 为 2 时无限制），
 * 合并值与后续每个弧按 base-128 变长整数编码（大端 7 位组，末字节高位置 0）。
 *
 * @param input - 点分十进制字符串
 * @returns 编码结果，失败时携带错误信息
 */
export function encodeOid(input: string): OidEncodeResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: 'OID 不能为空' };
  }
  const parts = trimmed.split('.');
  if (parts.length < 2) {
    return { ok: false, error: 'OID 至少需要两个弧（如 1.2）' };
  }

  const arcs: bigint[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i] ?? '';
    if (!/^\d+$/.test(part)) {
      return { ok: false, error: `第 ${i + 1} 个弧「${part}」不是非负整数` };
    }
    arcs.push(BigInt(part));
  }

  const first = arcs[0];
  const second = arcs[1];
  if (first === undefined || second === undefined) {
    return { ok: false, error: 'OID 至少需要两个弧' };
  }
  if (first !== B0 && first !== B1 && first !== B2) {
    return { ok: false, error: '第一弧只能是 0、1 或 2（ITU-T / ISO-ITU / ISO）' };
  }
  if (first !== B2 && second >= B40) {
    return {
      ok: false,
      error: `第一弧为 ${first} 时第二弧必须小于 40，当前为 ${second}`,
    };
  }

  const merged = first * B40 + second;
  const values = [merged, ...arcs.slice(2)];
  const steps: ArcStep[] = [];
  const bytes: number[] = [];

  values.forEach((value, index) => {
    const groups = toBase128Groups(value);
    const stepBytes = groups.map((group, groupIndex) =>
      groupIndex === groups.length - 1 ? group : group | 0x80,
    );
    steps.push({
      index,
      value,
      groups,
      bytes: stepBytes,
    });
    bytes.push(...stepBytes);
  });

  return {
    ok: true,
    bytes,
    hex: bytesToHex(bytes),
    steps,
  };
}

/**
 * 把任意非负 BigInt 拆成大端 7 位组（未加高位标记）。
 *
 * @param value - 非负整数
 * @returns 7 位组数组，高到低排列，至少 1 个元素
 */
function toBase128Groups(value: bigint): number[] {
  if (value === B0) {
    return [0];
  }
  const groups: number[] = [];
  let remaining = value;
  while (remaining > B0) {
    groups.push(Number(remaining & B127));
    remaining >>= B7;
  }
  return groups.reverse();
}

/**
 * 把 BER/DER 内容字节解码为点分十进制 OID。
 * 输入接受十六进制串（可含空格/0x 前缀）或字节数组。
 *
 * @param input - 十六进制文本或字节数组
 * @returns 解码结果，失败时携带错误信息
 */
export function decodeOid(input: string | number[]): OidDecodeResult {
  let bytes: number[];
  if (typeof input === 'string') {
    const parsed = hexToBytes(input);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }
    bytes = parsed.bytes;
  } else {
    bytes = input;
  }

  if (bytes.length === 0) {
    return { ok: false, error: '内容字节为空，无法解码 OID' };
  }
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte === undefined || byte < 0 || byte > 255 || !Number.isInteger(byte)) {
      return { ok: false, error: `第 ${i + 1} 个字节超出 0–255 范围` };
    }
  }

  const values: bigint[] = [];
  let accumulator = B0;
  let hasAny = false;
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i] ?? 0;
    accumulator = (accumulator << B7) | BigInt(byte & 0x7f);
    hasAny = true;
    if ((byte & 0x80) === 0) {
      values.push(accumulator);
      accumulator = B0;
      hasAny = false;
    }
  }
  if (hasAny) {
    return { ok: false, error: '末尾 base-128 整数缺少结束字节（最高位为 0 的字节）' };
  }

  const firstMerged = values[0];
  if (firstMerged === undefined) {
    return { ok: false, error: '未解析出任何弧值' };
  }

  let first: bigint;
  let second: bigint;
  if (firstMerged < B40) {
    first = B0;
    second = firstMerged;
  } else if (firstMerged < B80) {
    first = B1;
    second = firstMerged - B40;
  } else {
    first = B2;
    second = firstMerged - B80;
  }

  const arcs = [first, second, ...values.slice(1)];
  return {
    ok: true,
    arcs,
    oid: arcs.map((arc) => arc.toString()).join('.'),
  };
}

/**
 * 字节数组转大写十六进制串。
 *
 * @param bytes - 字节数组
 * @returns 无空格十六进制串
 */
export function bytesToHex(bytes: number[]): string {
  return bytes
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

/**
 * 十六进制串转字节数组，容忍空格、冒号、0x 前缀与大小写。
 *
 * @param text - 十六进制文本
 * @returns 字节数组或错误
 */
export function hexToBytes(text: string): { ok: true; bytes: number[] } | { ok: false; error: string } {
  const cleaned = text
    .replace(/0x/gi, '')
    .replace(/[\s:.-]/g, '');
  if (cleaned === '') {
    return { ok: false, error: '十六进制内容为空' };
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return { ok: false, error: '包含非十六进制字符（仅允许 0–9、A–F、空格与冒号）' };
  }
  if (cleaned.length % 2 !== 0) {
    return { ok: false, error: '十六进制长度必须为偶数' };
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return { ok: true, bytes };
}

/**
 * 生成完整 DER TLV 十六进制（Tag 06 + Length + 内容），便于直接对照证书转储。
 *
 * @param contentBytes - OID 内容字节
 * @returns 完整 TLV 十六进制串
 */
export function wrapDerTlv(contentBytes: number[]): string {
  const tag = '06';
  const length = contentBytes.length;
  let lengthOctets: string;
  if (length < 0x80) {
    lengthOctets = length.toString(16).toUpperCase().padStart(2, '0');
  } else {
    const lengthBytes: number[] = [];
    let remaining = length;
    while (remaining > 0) {
      lengthBytes.unshift(remaining & 0xff);
      remaining = Math.floor(remaining / 0x100);
    }
    const lead = (0x80 | lengthBytes.length).toString(16).toUpperCase();
    lengthOctets =
      lead + lengthBytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  }
  return `${tag}${lengthOctets}${bytesToHex(contentBytes)}`;
}
