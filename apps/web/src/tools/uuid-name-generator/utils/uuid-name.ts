/**
 * RFC 9562 名称型 UUID（v3 / v5）纯函数实现
 *
 * name-based UUID = 对「命名空间 UUID 的 16 字节大端表示 + 名称 UTF-8 字节」
 * 做 MD5（v3）或 SHA-1（v5，经 Web Crypto）摘要，取前 16 字节后改写
 * version（第 6 字节高 4 位）与 variant（第 8 字节高 2 位 = 10）。
 */

import { md5Bytes } from './md5';

export type UuidVersion = 3 | 5;

/** RFC 9562 附录预定义命名空间 */
export const NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
} as const;

export type NamespaceKey = keyof typeof NAMESPACES;

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * 解析标准 8-4-4-4-12 形式 UUID 为 16 字节大端序列
 *
 * @param uuid - UUID 字符串
 * @returns 16 字节；格式非法时为 null
 */
export function parseUuid(uuid: string): Uint8Array | null {
  const normalized = uuid.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  const hex = normalized.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * 将 16 字节序列格式化为 8-4-4-4-12 小写 UUID 字符串
 */
export function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

/**
 * 在摘要字节上写入 version / variant 位
 */
function stampVersionVariant(digest16: Uint8Array, version: UuidVersion): Uint8Array {
  const result = new Uint8Array(digest16);
  result[6] = (result[6]! & 0x0f) | (version << 4);
  result[8] = (result[8]! & 0x3f) | 0x80;
  return result;
}

export interface NameUuidResult {
  uuid: string | null;
  version: UuidVersion;
  error: string | null;
}

/**
 * 生成名称型 UUID
 *
 * @param version - 3（MD5）或 5（SHA-1）
 * @param namespaceUuid - 命名空间 UUID 字符串
 * @param name - 名称（按 UTF-8 编码）
 */
export async function nameBasedUuid(
  version: UuidVersion,
  namespaceUuid: string,
  name: string,
): Promise<NameUuidResult> {
  const namespaceBytes = parseUuid(namespaceUuid);
  if (!namespaceBytes) {
    return { uuid: null, version, error: '命名空间不是合法的 8-4-4-4-12 形式 UUID' };
  }

  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes, 0);
  input.set(nameBytes, namespaceBytes.length);

  let digest16: Uint8Array;
  if (version === 3) {
    digest16 = md5Bytes(input);
  } else {
    const sha1 = new Uint8Array(await crypto.subtle.digest('SHA-1', input));
    digest16 = sha1.subarray(0, 16);
  }

  const stamped = stampVersionVariant(digest16, version);
  return { uuid: formatUuid(stamped), version, error: null };
}

/** 同步生成 v3 UUID（MD5 无需 Web Crypto），主要供测试使用 */
export function nameBasedUuidV3Sync(namespaceUuid: string, name: string): NameUuidResult {
  const namespaceBytes = parseUuid(namespaceUuid);
  if (!namespaceBytes) {
    return { uuid: null, version: 3, error: '命名空间不是合法的 8-4-4-4-12 形式 UUID' };
  }
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes, 0);
  input.set(nameBytes, namespaceBytes.length);
  const stamped = stampVersionVariant(md5Bytes(input), 3);
  return { uuid: formatUuid(stamped), version: 3, error: null };
}
