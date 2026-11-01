/**
 * Segment KSUID（K-Sortable Unique IDentifier）生成与解析的零依赖纯函数实现，
 * 不触碰 DOM 与 React。遵循 Segment KSUID 规范：
 * 二进制结构为 20 字节 = 4 字节大端 uint32 调整时间戳（Unix 秒减去纪元偏移
 * EPOCH = 1400000000）+ 16 字节随机 payload；整体按 Base62 字母表
 * 0-9A-Za-z 编码为恰好 27 个字符（不足前导补 '0'）。
 *
 * Base62 编解码使用 BigInt（20 字节整数远超出 Number 安全整数范围）。
 * 所有错误均以结果对象（{ error }）返回而非抛出异常，随机字节来源可注入以便测试。
 */

/** KSUID 纪元偏移：调整时间戳 = Unix 秒 - 1400000000 */
export const KSUID_EPOCH = 1400000000;

/** KSUID 二进制长度（字节）：4 字节时间戳 + 16 字节随机 payload */
export const KSUID_BYTES = 20;

/** 随机 payload 长度（字节） */
export const KSUID_PAYLOAD_BYTES = 16;

/** Base62 编码后的固定长度（字符） */
export const KSUID_LENGTH = 27;

/** 4 字节大端 uint32 时间戳上界（2^32 - 1） */
export const TIMESTAMP_MAX = 0xffffffff;

/** 20 字节全 0xff 对应的大整数上界（2^160 - 1） */
export const MAX_VALUE = (BigInt(1) << BigInt(KSUID_BYTES * 8)) - BigInt(1);

/** 20 字节上界编码出的最大合法 Base62 字符串（27 字符） */
export const MAX_ENCODED = 'aWgEPTl1tmebfsQzFP4bxwgy80V';

/** Base62 字母表（顺序固定：数字 0-9、大写 A-Z、小写 a-z） */
export const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** 字符 → 数值反查表 */
const CHAR_VALUE: Record<string, number> = Object.fromEntries(
  [...BASE62_ALPHABET].map((char, index) => [char, index]),
);

const BASE = BigInt(62);

/** 合法 Base62 字符（恰好 27 个） */
const BASE62_PATTERN = /^[0-9A-Za-z]{27}$/;

/** 随机字节提供器：返回恰好 16 字节随机数据，便于注入固定向量测试 */
export type RandomPayloadProvider = () => Uint8Array;

/** KSUID 解析成功结果 */
export interface KSUID_PARTS {
  /** 规范化后的 KSUID 字符串 */
  ksuid: string;
  /** 原始 Unix 秒级时间戳 */
  timestampSeconds: number;
  /** UTC 时间字符串（yyyy-MM-dd HH:mm:ss，UTC） */
  date: string;
  /** 16 字节随机 payload 的小写十六进制 */
  payloadHex: string;
}

/** 解析失败结果 */
export interface KSUID_ERROR {
  /** 面向用户的错误说明 */
  error: string;
}

/** 解析结果：成功时为分段信息，失败时为错误对象 */
export type KSUID_PARSE_RESULT = KSUID_PARTS | KSUID_ERROR;

/**
 * 把 20 字节序列视为大端无符号整数，使用 BigInt 编码为 Base62 字符串
 *
 * @param bytes - 至多 20 字节的大端字节
 * @returns 恰好 27 字符的 Base62 字符串（不足前导补 '0'）
 */
export function encodeBase62(bytes: Uint8Array): string {
  let value = BigInt(0);
  for (const byte of bytes) {
    value = (value << BigInt(8)) | BigInt(byte);
  }
  let output = '';
  while (value > BigInt(0)) {
    const remainder = Number(value % BASE);
    output = (BASE62_ALPHABET[remainder] ?? '') + output;
    value /= BASE;
  }
  return output.padStart(KSUID_LENGTH, BASE62_ALPHABET[0] ?? '0');
}

/**
 * 把 Base62 字符串解码为 20 字节大端字节，左侧补 0 字节；
 * 数值超过 20 字节上界或含非法字符时返回错误结果对象。
 *
 * @param input - 27 字符 Base62 字符串
 * @returns 20 字节序列，或错误对象
 */
export function decodeBase62(input: string): Uint8Array | KSUID_ERROR {
  if (!BASE62_PATTERN.test(input)) {
    return { error: '包含非法字符：KSUID 仅允许 Base62 字符（0-9、A-Z、a-z）' };
  }
  let value = BigInt(0);
  for (const char of input) {
    value = value * BASE + BigInt(CHAR_VALUE[char] ?? 0);
  }
  if (value > MAX_VALUE) {
    return { error: '数值超出 20 字节上限' };
  }
  const bytes = new Uint8Array(KSUID_BYTES);
  let cursor = KSUID_BYTES - 1;
  const byteMask = BigInt(0xff);
  while (value > BigInt(0) && cursor >= 0) {
    bytes[cursor] = Number(value & byteMask);
    value >>= BigInt(8);
    cursor -= 1;
  }
  return bytes;
}

/**
 * 把 Unix 秒级时间戳格式化为 UTC 字符串（yyyy-MM-dd HH:mm:ss UTC）
 *
 * @param timestampSeconds - Unix 秒级时间戳
 * @returns UTC 时间字符串
 */
export function formatUtcDate(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, ' UTC')
    .replace('T', ' ');
}

/**
 * 生成单个 Segment KSUID。
 *
 * @param timestampSeconds - Unix 秒级时间戳
 * @param rng - 随机 payload 提供器，返回恰好 16 字节
 * @returns 27 字符 KSUID；时间戳越界或随机字节长度不对时返回错误对象
 */
export function generateKsuid(
  timestampSeconds: number,
  rng: RandomPayloadProvider,
): string | KSUID_ERROR {
  if (
    !Number.isInteger(timestampSeconds) ||
    timestampSeconds < KSUID_EPOCH ||
    timestampSeconds > KSUID_EPOCH + TIMESTAMP_MAX
  ) {
    return {
      error: `时间戳必须是 ${KSUID_EPOCH}–${KSUID_EPOCH + TIMESTAMP_MAX} 之间的整数 Unix 秒值`,
    };
  }
  const payload = rng();
  if (payload.length !== KSUID_PAYLOAD_BYTES) {
    return { error: `随机 payload 需要恰好 ${KSUID_PAYLOAD_BYTES} 个字节` };
  }
  const adjusted = timestampSeconds - KSUID_EPOCH;
  const bytes = new Uint8Array(KSUID_BYTES);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, adjusted);
  bytes.set(payload, 4);
  return encodeBase62(bytes);
}

/**
 * 解析 Segment KSUID：校验长度与 Base62 字符集，反解调整时间戳与随机 payload。
 *
 * @param input - 待解析的 KSUID（容忍首尾空白）
 * @returns 时间戳、UTC 时间、payload 十六进制，或错误对象
 */
export function parseKsuid(input: string): KSUID_PARSE_RESULT {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return { error: '请输入需要解析的 KSUID' };
  }
  if (normalized.length !== KSUID_LENGTH) {
    return {
      error: `KSUID 长度必须为 ${KSUID_LENGTH} 个字符，当前为 ${normalized.length} 个`,
    };
  }
  const decoded = decodeBase62(normalized);
  if ('error' in decoded) {
    return decoded;
  }
  const bytes = decoded;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const adjusted = view.getUint32(0);
  const timestampSeconds = adjusted + KSUID_EPOCH;
  const payloadHex = [...bytes.slice(4)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    ksuid: normalized,
    timestampSeconds,
    date: formatUtcDate(timestampSeconds),
    payloadHex,
  };
}
