/**
 * TypeID 编解码（jetify-com/typeid 规范），纯函数、零网络依赖。
 *
 * TypeID = 类型前缀（可选）+ "_" + 26 字符 Crockford Base32 后缀，
 * 后缀编码一个 16 字节 UUID（按 128 位补一个前导 0 位，共 130 位 = 26×5）。
 */

/** TypeID 使用的 Crockford Base32 字母表（不含 I、L、O、U） */
const BASE32_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/** Base32 字符到 5 位数值的反查表 */
const BASE32_DECODE = new Map<string, number>(
  [...BASE32_ALPHABET].map((char, index) => [char, index]),
);

/** 后缀固定长度（编码 16 字节 UUID） */
const SUFFIX_LENGTH = 26;

/** UUID 字节数 */
const UUID_BYTES = 16;

/** 前缀最大长度 */
const MAX_PREFIX_LENGTH = 63;

/** 合法前缀：首字符小写字母，其余小写字母/数字/下划线 */
const PREFIX_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

/** 标准 UUID 十六进制形态（8-4-4-4-12） */
const UUID_HEX_PATTERN = /^[0-9a-f]{32}$/;

/** 解析后的 TypeID 结构 */
export interface DecodedTypeid {
  /** 类型前缀，裸后缀时为空串 */
  prefix: string;
  /** 内嵌 UUID 的标准 8-4-4-4-12 字符串 */
  uuid: string;
  /** 16 字节 UUID */
  bytes: Uint8Array;
  /** UUID 版本（高 4 位） */
  version: number;
  /** UUID variant（应固定为 10，即 RFC 4122） */
  variant: number;
  /** 当版本为 7 时提取的毫秒时间戳，否则为 null */
  timestampMs: number | null;
}

/** 5 位一组的掩码 */
const FIVE_BIT_MASK = BigInt(0x1f);
/** 单字节掩码 */
const BYTE_MASK = BigInt(0xff);

/**
 * 把 16 字节 UUID 编码为 26 字符 Base32 后缀。
 * 按 TypeID 官方参考实现：把 128 位 UUID 视作带两个前导零位的 130 位整数，
 * 从最低位起每 5 位映射一个字母表字符，再逆序输出，最高位字符恒为 '0'。
 *
 * @param bytes - 16 字节 UUID
 * @returns 26 字符后缀
 */
export function encodeBase32(bytes: Uint8Array): string {
  if (bytes.length !== UUID_BYTES) {
    throw new Error(`UUID 必须为 ${UUID_BYTES} 字节，实际为 ${bytes.length} 字节`);
  }
  let numeric = BigInt(0);
  for (const byte of bytes) {
    numeric = (numeric << BigInt(8)) | BigInt(byte);
  }
  const characters: string[] = [];
  for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
    const digit = Number(numeric & FIVE_BIT_MASK);
    characters.push(BASE32_ALPHABET[digit]!);
    numeric >>= BigInt(5);
  }
  return characters.reverse().join('');
}

/**
 * 把 26 字符 Base32 后缀解码为 16 字节 UUID。
 *
 * @param suffix - 26 字符后缀
 * @returns 16 字节 UUID
 */
export function decodeBase32(suffix: string): Uint8Array {
  if (suffix.length !== SUFFIX_LENGTH) {
    throw new Error(`后缀必须为 ${SUFFIX_LENGTH} 个字符，实际为 ${suffix.length} 个`);
  }
  // 首字符承载前导零位，必须为 '0'
  if (suffix[0] !== BASE32_ALPHABET[0]) {
    throw new Error('后缀首字符必须为 0（128 位 UUID 的前导零位）');
  }
  let numeric = BigInt(0);
  for (let index = 0; index < suffix.length; index += 1) {
    const char = suffix[index]!;
    const value = BASE32_DECODE.get(char);
    if (value === undefined) {
      throw new Error(`后缀含非法 Base32 字符「${char}」（位于第 ${index + 1} 位，不允许 I/L/O/U）`);
    }
    numeric = (numeric << BigInt(5)) | BigInt(value);
  }
  const bytes = new Uint8Array(UUID_BYTES);
  for (let index = UUID_BYTES - 1; index >= 0; index -= 1) {
    bytes[index] = Number(numeric & BYTE_MASK);
    numeric >>= BigInt(8);
  }
  if (numeric !== BigInt(0)) {
    throw new Error('后缀解码后存在溢出位，不是合法的 128 位 UUID');
  }
  return bytes;
}

/**
 * 把 16 字节转为标准 8-4-4-4-12 UUID 字符串
 *
 * @param bytes - 16 字节
 * @returns UUID 字符串
 */
export function bytesToUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

/**
 * 把标准 UUID 字符串解析为 16 字节
 *
 * @param uuid - UUID 字符串
 * @returns 16 字节
 */
export function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.trim().replace(/-/g, '').toLowerCase();
  if (!UUID_HEX_PATTERN.test(hex)) {
    throw new Error('UUID 必须为 32 位十六进制（标准 8-4-4-4-12 形态）');
  }
  const bytes = hex.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16));
  return Uint8Array.from(bytes);
}

/**
 * 校验类型前缀规则：空串合法；否则首字符小写字母、仅含 [a-z0-9_]、≤63 字符。
 *
 * @param prefix - 类型前缀
 */
export function validatePrefix(prefix: string): void {
  if (prefix === '') {
    return;
  }
  if (prefix.length > MAX_PREFIX_LENGTH) {
    throw new Error(`前缀长度不能超过 ${MAX_PREFIX_LENGTH} 字符，实际为 ${prefix.length} 字符`);
  }
  if (!PREFIX_PATTERN.test(prefix)) {
    throw new Error('前缀必须以小写字母开头，且仅包含小写字母、数字、下划线');
  }
}

/**
 * 由前缀与 UUID 字符串组装 TypeID
 *
 * @param prefix - 类型前缀（可空）
 * @param uuid - 标准 UUID 字符串
 * @returns TypeID 字符串
 */
export function encodeTypeid(prefix: string, uuid: string): string {
  validatePrefix(prefix);
  const suffix = encodeBase32(uuidToBytes(uuid));
  return prefix === '' ? suffix : `${prefix}_${suffix}`;
}

/**
 * 解析 TypeID，校验前缀、分隔符、后缀与 UUID 版本/变体，并提取 v7 时间戳。
 *
 * @param text - TypeID 字符串
 * @returns 结构化解析结果
 */
export function decodeTypeid(text: string): DecodedTypeid {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('请输入 TypeID');
  }
  const separatorIndex = trimmed.lastIndexOf('_');
  let prefix = '';
  let suffix = trimmed;
  if (separatorIndex !== -1) {
    prefix = trimmed.slice(0, separatorIndex);
    suffix = trimmed.slice(separatorIndex + 1);
    validatePrefix(prefix);
  } else if (!/^[0-9a-z]+$/.test(trimmed)) {
    throw new Error('裸后缀只能包含小写字母与数字；带前缀时必须使用 _ 分隔');
  }

  const bytes = decodeBase32(suffix);
  const uuid = bytesToUuid(bytes);
  const version = bytes[6]! >> 4;
  const variantBits = bytes[8]! >> 6;
  if (variantBits !== 0b10) {
    throw new Error(`UUID variant 非法：期望 RFC 4122（10），实际为 ${variantBits.toString(2)}`);
  }
  let timestampMs: number | null = null;
  if (version === 7) {
    // UUIDv7：前 48 位为 Unix 毫秒时间戳
    timestampMs =
      bytes[0]! * 2 ** 40 +
      bytes[1]! * 2 ** 32 +
      bytes[2]! * 2 ** 24 +
      bytes[3]! * 2 ** 16 +
      bytes[4]! * 2 ** 8 +
      bytes[5]!;
  }
  return { prefix, uuid, bytes, version, variant: variantBits, timestampMs };
}

/**
 * 生成一个新的 UUIDv7（48 位毫秒时间戳 + 版本/变体位 + 74 位随机）。
 * 随机字节来自浏览器原生 crypto，不引入任何 npm 依赖。
 *
 * @returns 16 字节 UUIDv7
 */
export function generateUuidV7Bytes(): Uint8Array {
  const bytes = new Uint8Array(UUID_BYTES);
  crypto.getRandomValues(bytes);
  const timestampMs = Date.now();
  // 前 6 字节写入 48 位大端时间戳
  bytes[0] = Math.floor(timestampMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestampMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestampMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestampMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestampMs / 2 ** 8) & 0xff;
  bytes[5] = timestampMs & 0xff;
  // 版本 7
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  // variant 10
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return bytes;
}

/**
 * 生成指定前缀的新 TypeID
 *
 * @param prefix - 类型前缀（可空）
 * @returns TypeID 字符串
 */
export function generateTypeid(prefix: string): string {
  validatePrefix(prefix);
  const suffix = encodeBase32(generateUuidV7Bytes());
  return prefix === '' ? suffix : `${prefix}_${suffix}`;
}
