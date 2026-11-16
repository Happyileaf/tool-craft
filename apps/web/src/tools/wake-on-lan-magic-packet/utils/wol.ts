/**
 * Wake-on-LAN 魔术包构造与反向解析纯函数（AMD Magic Packet 规范）
 * 报文结构：6 字节 0xFF 同步流 + 目标 MAC 重复 16 次，固定 102 字节
 */

export const MAGIC_PACKET_SYNC: readonly number[] = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
export const MAGIC_PACKET_SIZE = 102;
export const MAC_REPEAT_COUNT = 16;
export const MAC_BYTE_LENGTH = 6;

export interface ParsedMagicPacket {
  /** 从报文中提取的目标 MAC，小写冒号格式，如 aa:bb:cc:dd:ee:ff */
  targetMac: string;
  /** 原始 102 字节 */
  bytes: Uint8Array;
}

export class WolError extends Error {}

/**
 * 将多种写法的 MAC 地址规范化为 6 字节数组。
 * 支持：aa:bb:cc:dd:ee:ff、aa-bb-cc-dd-ee-ff、aabb.ccdd.eeff、aabbccddeeff（含空格）
 */
export function parseMacAddress(input: string): Uint8Array {
  if (!input || !input.trim()) {
    throw new WolError('MAC 地址不能为空');
  }
  const hex = input.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  if (hex.length !== MAC_BYTE_LENGTH * 2) {
    throw new WolError(
      `MAC 地址应为 6 字节（12 个十六进制字符），当前解析得到 ${hex.length} 个`,
    );
  }
  if (!/^[0-9a-f]{12}$/.test(hex)) {
    throw new WolError('MAC 地址包含非法的十六进制字符');
  }
  const bytes = new Uint8Array(MAC_BYTE_LENGTH);
  for (let i = 0; i < MAC_BYTE_LENGTH; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 将 6 字节 MAC 格式化为小写冒号形式 */
export function formatMac(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, MAC_BYTE_LENGTH))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':');
}

/** 构造 102 字节魔术包 */
export function buildMagicPacket(macInput: string): Uint8Array {
  const mac = parseMacAddress(macInput);
  const packet = new Uint8Array(MAGIC_PACKET_SIZE);
  packet.set(MAGIC_PACKET_SYNC, 0);
  for (let i = 0; i < MAC_REPEAT_COUNT; i += 1) {
    packet.set(mac, MAGIC_PACKET_SYNC.length + i * MAC_BYTE_LENGTH);
  }
  return packet;
}

/** 字节数组转连续大写十六进制字符串 */
export function bytesToHex(bytes: Uint8Array, spaced = false): string {
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(spaced ? ' ' : '');
  return spaced ? raw.toUpperCase() : raw.toUpperCase();
}

/** 宽松解析十六进制字符串：去除 0x 前缀、空格、换行与冒号分隔 */
export function hexToBytes(hexInput: string): Uint8Array {
  const cleaned = hexInput
    .trim()
    .replace(/^0x/i, '')
    .replace(/[\s:.-]/g, '');
  if (!cleaned) {
    throw new WolError('十六进制输入为空');
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new WolError('输入包含非十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new WolError('十六进制字符数必须为偶数（完整字节）');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Base64 字符串解码为字节（浏览器环境使用 atob） */
export function base64ToBytes(base64: string): Uint8Array {
  const cleaned = base64.trim();
  if (!cleaned) {
    throw new WolError('Base64 输入为空');
  }
  let binary: string;
  try {
    binary = atob(cleaned);
  } catch {
    throw new WolError('Base64 格式非法，无法解码');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 字节数组转 Base64（浏览器环境使用 btoa） */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

/**
 * 反向解析并校验魔术包：
 * 1. 长度必须恰为 102 字节
 * 2. 前 6 字节必须为同步流 0xFF
 * 3. 其后 16 段 MAC 必须完全一致
 */
export function parseMagicPacket(bytes: Uint8Array): ParsedMagicPacket {
  if (bytes.length !== MAGIC_PACKET_SIZE) {
    throw new WolError(
      `魔术包长度必须为 ${MAGIC_PACKET_SIZE} 字节，当前为 ${bytes.length} 字节`,
    );
  }
  for (let i = 0; i < MAGIC_PACKET_SYNC.length; i += 1) {
    const actual = bytes[i] ?? 0;
    if (actual !== MAGIC_PACKET_SYNC[i]) {
      throw new WolError(
        `同步流校验失败：前 6 字节应全为 FF，第 ${i + 1} 字节实际为 ${actual
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()}`,
      );
    }
  }
  const mac = bytes.slice(6, 6 + MAC_BYTE_LENGTH);
  if (mac.length < MAC_BYTE_LENGTH) {
    throw new WolError('报文过短，无法提取完整目标 MAC');
  }
  for (let repeat = 1; repeat < MAC_REPEAT_COUNT; repeat += 1) {
    const offset = 6 + repeat * MAC_BYTE_LENGTH;
    for (let j = 0; j < MAC_BYTE_LENGTH; j += 1) {
      if ((bytes[offset + j] ?? -1) !== (mac[j] ?? -2)) {
        throw new WolError(
          `MAC 重复一致性校验失败：第 ${repeat + 1} 份 MAC（字节偏移 ${offset + j}）与首份不一致`,
        );
      }
    }
  }
  return { targetMac: formatMac(mac), bytes };
}
