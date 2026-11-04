/**
 * HOTP（RFC 4226）纯逻辑集合
 *
 * 仅依赖 Web Crypto 完成 HMAC，不触碰 DOM / React，也不发起任何网络请求。
 * 计数器使用 BigInt 以支持任意长度，编码时取低 64 位。
 */

/** Web Crypto HMAC 支持的哈希算法 */
export const HOTP_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-512'] as const;

/** HOTP 可选哈希算法类型 */
export type HotpAlgorithm = (typeof HOTP_ALGORITHMS)[number];

/** Base32 编码字符表，顺序遵循 RFC 4648 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 默认验证码位数 */
export const DEFAULT_DIGITS = 6;

/** 密钥输入格式 */
export type SecretFormat = 'base32' | 'hex' | 'text';

/** HOTP 生成选项 */
export interface HotpOptions {
  /** 验证码位数，取值 6 ~ 8，默认 6 */
  digits?: number;
  /** 哈希算法，默认 SHA-1（RFC 4226 规定） */
  algorithm?: HotpAlgorithm;
}

/** 窗口校验结果 */
export interface VerifyResult {
  /** 是否在窗口内命中 */
  valid: boolean;
  /** 命中时计数器相对当前值的前进步数（0 表示当前计数器），未命中为 -1 */
  ahead: number;
  /** 命中时对应的计数器值，未命中为 null */
  matchedCounter: bigint | null;
}

/** RFC 4226 附录 D 官方向量的共享密钥（Base32：GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ） */
export const RFC4226_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

/** RFC 4226 附录 D 官方向量，counter 0 ~ 9 的 6 位 SHA-1 验证码 */
export const RFC4226_VECTORS: { counter: bigint; code: string }[] = [
  { counter: BigInt(0), code: '755224' },
  { counter: BigInt(1), code: '287082' },
  { counter: BigInt(2), code: '359152' },
  { counter: BigInt(3), code: '969429' },
  { counter: BigInt(4), code: '338314' },
  { counter: BigInt(5), code: '254676' },
  { counter: BigInt(6), code: '287922' },
  { counter: BigInt(7), code: '162583' },
  { counter: BigInt(8), code: '399871' },
  { counter: BigInt(9), code: '520489' },
];

/**
 * 将 Base32 文本解码为字节数组
 *
 * 归一化规则：去除空白、统一大写、去掉末尾 `=` 填充；合法字符仅限 A-Z2-7。
 *
 * @param input - Base32 文本
 * @returns 解码后的字节数组
 * @throws 输入为空或包含非法字符时抛出错误
 */
export function base32Decode(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
  if (normalized.length === 0) {
    throw new Error('Base32 密钥非法：输入为空');
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error('Base32 密钥非法：包含非法字符');
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * 解析十六进制密钥文本为字节数组
 *
 * @param input - 十六进制文本，可含 0x 前缀与空白
 * @returns 字节数组
 * @throws 奇数长度或含非十六进制字符时抛出错误
 */
export function hexDecode(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, '').replace(/^0[xX]/, '');
  if (normalized.length === 0) {
    throw new Error('Hex 密钥非法：输入为空');
  }
  if (normalized.length % 2 !== 0) {
    throw new Error('Hex 密钥非法：长度必须为偶数');
  }
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    throw new Error('Hex 密钥非法：包含非十六进制字符');
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 把原始文本按 UTF-8 编码为密钥字节
 *
 * @param input - 原始文本
 * @returns UTF-8 字节数组
 * @throws 输入为空时抛出错误
 */
export function textToKeyBytes(input: string): Uint8Array {
  if (input.length === 0) {
    throw new Error('文本密钥非法：输入为空');
  }
  return new TextEncoder().encode(input);
}

/**
 * 按指定格式解析密钥为字节数组
 *
 * @param secret - 密钥文本
 * @param format - base32 / hex / text
 * @returns 密钥字节
 */
export function parseSecret(secret: string, format: SecretFormat): Uint8Array {
  if (format === 'base32') {
    return base32Decode(secret);
  }
  if (format === 'hex') {
    return hexDecode(secret);
  }
  return textToKeyBytes(secret);
}

/**
 * 将计数器编码为 8 字节大端序字节数组（RFC 4226 §5.1）
 *
 * 计数器按无符号 64 位处理，超出 2^64 的部分被截断。
 *
 * @param counter - 计数器值（非负 BigInt）
 * @returns 固定 8 字节的大端序表示
 */
function encodeCounter(counter: bigint): Uint8Array {
  if (counter < BigInt(0)) {
    throw new Error('计数器必须为非负整数');
  }
  const bytes = new Uint8Array(8);
  const mask = BigInt(0xff);
  let remaining = counter;
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & mask);
    remaining >>= BigInt(8);
  }
  return bytes;
}

/**
 * 基于密钥字节与计数器生成 HOTP 验证码
 *
 * 使用 Web Crypto 对 8 字节大端序计数器做 HMAC，再按 RFC 4226 §5.4
 * 动态截断取出 31 位整数，对 10^digits 取模并左侧补零。
 *
 * @param secret - 密钥字节
 * @param counter - 计数器值（非负 BigInt）
 * @param options - 位数与哈希算法选项
 * @returns 左侧补零到指定长度的数字验证码
 */
export async function generateHotp(
  secret: Uint8Array,
  counter: bigint,
  options: HotpOptions = {},
): Promise<string> {
  const { digits = DEFAULT_DIGITS, algorithm = 'SHA-1' } = options;
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) {
    throw new Error('验证码位数必须为 6 ~ 8 之间的整数');
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto');
  }

  const keyData = new Uint8Array(secret.length);
  keyData.set(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const counterBytes = encodeCounter(counter);
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, counterBytes.slice().buffer),
  );

  // RFC 4226 §5.4 动态截断
  const lastByte = signature[signature.length - 1] ?? 0;
  const offset = lastByte & 0x0f;
  const p = signature[offset] ?? 0;
  const q = signature[offset + 1] ?? 0;
  const r = signature[offset + 2] ?? 0;
  const s = signature[offset + 3] ?? 0;
  const binary =
    ((p & 0x7f) << 24) | ((q & 0xff) << 16) | ((r & 0xff) << 8) | (s & 0xff);

  const code = binary % 10 ** digits;
  return code.toString().padStart(digits, '0');
}

/**
 * 服务端视角的 HOTP 校验：在 look-ahead 窗口内查找提交码
 *
 * @param secret - 密钥字节
 * @param token - 用户提交的验证码
 * @param currentCounter - 服务端当前计数器
 * @param window - 向前查找的窗口大小（含当前计数器，即检查 current ~ current+window）
 * @param options - 位数与哈希算法选项
 * @returns 命中状态、前进步数与命中计数器；窗口外或重放（仅当 window=0 且码不匹配）返回未命中
 */
export async function verifyHotp(
  secret: Uint8Array,
  token: string,
  currentCounter: bigint,
  window: number,
  options: HotpOptions = {},
): Promise<VerifyResult> {
  if (!Number.isInteger(window) || window < 0) {
    throw new Error('窗口大小必须为非负整数');
  }
  if (currentCounter < BigInt(0)) {
    throw new Error('计数器必须为非负整数');
  }
  const normalizedToken = token.trim();
  if (!/^\d+$/.test(normalizedToken)) {
    return { valid: false, ahead: -1, matchedCounter: null };
  }

  for (let step = 0; step <= window; step += 1) {
    const candidateCounter = currentCounter + BigInt(step);
    const expected = await generateHotp(secret, candidateCounter, options);
    if (constantTimeEqual(expected, normalizedToken)) {
      return { valid: true, ahead: step, matchedCounter: candidateCounter };
    }
  }
  return { valid: false, ahead: -1, matchedCounter: null };
}

/**
 * 定长字符串常量时间比较，避免计时侧信道
 *
 * @param left - 期望值
 * @param right - 实际值
 * @returns 是否相等
 */
function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}
