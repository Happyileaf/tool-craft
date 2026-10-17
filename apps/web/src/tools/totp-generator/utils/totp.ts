/**
 * TOTP 动态验证码纯逻辑集合。
 * 遵循 RFC 6238（基于 HMAC 的一次性密码）与 RFC 4226（HOTP 动态截断），
 * 仅依赖 Web Crypto，不触碰 DOM / React，也不发起任何网络请求。
 */

/** Web Crypto HMAC 支持的哈希算法，作为 TOTP 可选算法集合 */
export const TOTP_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-512'] as const;

/** TOTP 可选哈希算法类型，取自 TOTP_ALGORITHMS 的元素 */
export type TotpAlgorithm = (typeof TOTP_ALGORITHMS)[number];

/** Base32 编码字符表，顺序遵循 RFC 4648 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 默认时间步长（秒） */
const DEFAULT_STEP_SECONDS = 30;

/** 默认验证码位数 */
const DEFAULT_DIGITS = 6;

/** 默认哈希算法 */
const DEFAULT_ALGORITHM: TotpAlgorithm = 'SHA-1';

/** TOTP 生成选项，全部字段可选，便于按注入的时间戳做确定性计算 */
export interface TotpOptions {
  /** 生成时刻的时间戳（毫秒），默认为 Date.now() */
  timestampMs?: number;
  /** 时间步长（秒），默认为 30 */
  stepSeconds?: number;
  /** 验证码位数，默认为 6 */
  digits?: number;
  /** 哈希算法，默认为 SHA-1 */
  algorithm?: TotpAlgorithm;
}

/**
 * 将 Base32 文本解码为字节数组
 *
 * 归一化规则：去除所有空白字符、统一转为大写、去掉末尾 `=` 填充；
 * 合法字符仅限 `A-Z2-7`，非法字符抛异常。
 *
 * @param input - 待解码的 Base32 文本，允许携带空白与 `=` 填充
 * @returns 解码后的字节数组
 * @throws 当输入为空或包含非法字符时抛出可读错误
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
 * 按时间步长把时间戳折算为计数器值（RFC 6238 §4.2）
 *
 * @param timestampMs - 时间戳（毫秒）
 * @param stepSeconds - 时间步长（秒）
 * @returns 计数器值，即 T = floor((时间戳 / 1000) / 步长)
 */
export function getCounter(timestampMs: number, stepSeconds: number): number {
  return Math.floor(timestampMs / 1000 / stepSeconds);
}

/**
 * 计算当前时间步内剩余的秒数
 *
 * @param timestampMs - 时间戳（毫秒）
 * @param stepSeconds - 时间步长（秒）
 * @returns 距离本步结束还剩的秒数，取值区间为 [1, stepSeconds]
 */
export function getRemainingSeconds(
  timestampMs: number,
  stepSeconds: number,
): number {
  const elapsed = Math.floor(timestampMs / 1000) % stepSeconds;
  return stepSeconds - elapsed;
}

/**
 * 将计数器编码为 8 字节大端序字节数组（RFC 4226 §5.1）
 *
 * @param counter - 计数器值
 * @returns 固定 8 字节的大端序表示
 */
function encodeCounter(counter: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8);
  let remaining = counter;
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  return bytes;
}

/**
 * 基于 Base32 解码后的密钥生成 RFC 6238 动态验证码
 *
 * 使用 Web Crypto 对 8 字节大端序计数器做 HMAC，再按 RFC 4226 §5.4
 * 动态截断取出 31 位整数，对 10 的 digits 次幂取模并左侧补零。
 *
 * @param secret - 解码后的密钥字节
 * @param options - 生成选项，时间戳可注入以保证确定性
 * @returns 左侧补零到指定长度的数字验证码
 * @throws 当运行环境不支持 Web Crypto 时抛出错误
 */
export async function generateTotp(
  secret: Uint8Array,
  options: TotpOptions = {},
): Promise<string> {
  const {
    timestampMs = Date.now(),
    stepSeconds = DEFAULT_STEP_SECONDS,
    digits = DEFAULT_DIGITS,
    algorithm = DEFAULT_ALGORITHM,
  } = options;

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto');
  }

  const counter = getCounter(timestampMs, stepSeconds);
  // 复制出精确长度的字节视图，兼容子数组并满足 BufferSource 的类型要求
  const keyData = new Uint8Array(secret.length);
  keyData.set(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encodeCounter(counter)),
  );

  // RFC 4226 §5.4 动态截断：以最后一字节的低 4 位作为偏移量取出 4 字节
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
