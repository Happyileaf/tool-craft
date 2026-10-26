export type MacFormat = 'colon' | 'hyphen' | 'cisco' | 'bare';

export type MacBitCount = 48 | 64;

export interface ParsedMac {
  bytes: number[];
  bitCount: MacBitCount;
  format: MacFormat;
}

export interface MacAnalysis {
  bitCount: MacBitCount;
  isMulticast: boolean;
  isLocallyAdministered: boolean;
  transmissionType: string;
  administrationType: string;
  oui: string;
  deviceIdentifier: string;
  firstOctetBinary: string;
}

const BYTE_PATTERN = /^[0-9a-fA-F]{2}$/;
const BARE_48_PATTERN = /^[0-9a-fA-F]{12}$/;
const BARE_64_PATTERN = /^[0-9a-fA-F]{16}$/;
const CISSO_WORD_PATTERN = /^[0-9a-fA-F]{4}$/;

/**
 * 将十六进制字符串按两位一组解析为字节数组
 *
 * @param hex - 连续十六进制文本（长度须为偶数）
 * @returns 字节数组
 */
function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < hex.length; index += 2) {
    bytes.push(parseInt(hex.slice(index, index + 2), 16));
  }
  return bytes;
}

/**
 * 把任意分隔形式的 MAC 地址输入解析为字节数组，支持：
 * 冒号分隔（AA:BB:CC:DD:EE:FF）、连字符分隔、Cisco 点分（aabb.ccdd.eeff）与裸十六进制。
 * MAC-48 为 6 字节，EUI-64 为 8 字节。
 *
 * @param input - MAC 地址文本
 * @returns 字节数组、位数与识别到的输入格式
 */
export function parseMac(input: string): ParsedMac {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('请输入 MAC 地址');
  }

  let hex: string;
  let format: MacFormat;

  if (trimmed.includes(':')) {
    format = 'colon';
    const groups = trimmed.split(':');
    if (!groups.every((group) => BYTE_PATTERN.test(group))) {
      throw new Error('冒号格式要求每组恰好 2 位十六进制，如 AA:BB:CC:DD:EE:FF');
    }
    hex = groups.join('');
  } else if (trimmed.includes('-')) {
    format = 'hyphen';
    const groups = trimmed.split('-');
    if (!groups.every((group) => BYTE_PATTERN.test(group))) {
      throw new Error('连字符格式要求每组恰好 2 位十六进制，如 AA-BB-CC-DD-EE-FF');
    }
    hex = groups.join('');
  } else if (trimmed.includes('.')) {
    format = 'cisco';
    const groups = trimmed.split('.');
    if (!groups.every((group) => CISSO_WORD_PATTERN.test(group))) {
      throw new Error('Cisco 点分格式要求每组 4 位十六进制，如 aabb.ccdd.eeff');
    }
    if (groups.length !== 3 && groups.length !== 4) {
      throw new Error('Cisco 点分格式 MAC-48 为 3 组、EUI-64 为 4 组');
    }
    hex = groups.join('');
  } else {
    format = 'bare';
    if (!BARE_48_PATTERN.test(trimmed) && !BARE_64_PATTERN.test(trimmed)) {
      throw new Error('裸十六进制格式要求连续 12 位（MAC-48）或 16 位（EUI-64），且只含 0-9 / A-F');
    }
    hex = trimmed;
  }

  let bitCount: MacBitCount;
  if (hex.length === 12) {
    bitCount = 48;
  } else if (hex.length === 16) {
    bitCount = 64;
  } else {
    throw new Error('仅支持 48 位（MAC-48，6 字节）或 64 位（EUI-64，8 字节）地址');
  }

  return { bytes: hexToBytes(hex), bitCount, format };
}

/**
 * 按指定格式输出 MAC 地址
 *
 * @param bytes - 字节数组（6 或 8 字节）
 * @param format - 目标格式：colon / hyphen / cisco / bare
 * @param uppercase - 是否大写输出
 * @returns 格式化后的 MAC 地址文本
 */
export function formatMac(bytes: number[], format: MacFormat, uppercase = true): string {
  const pairs = bytes.map((byte) => byte.toString(16).padStart(2, '0'));
  let output: string;
  if (format === 'colon') {
    output = pairs.join(':');
  } else if (format === 'hyphen') {
    output = pairs.join('-');
  } else if (format === 'bare') {
    output = pairs.join('');
  } else {
    const words: string[] = [];
    for (let index = 0; index < pairs.length; index += 2) {
      words.push(`${pairs[index] ?? ''}${pairs[index + 1] ?? ''}`);
    }
    output = words.join('.');
  }
  return uppercase ? output.toUpperCase() : output;
}

/**
 * 分析 MAC 地址的首位字节标志位：I/G（单播/组播）位与 U/L（全球/本地管理）位，
 * 并拆分 OUI（厂商代码，前 3 字节）与设备标识（其余字节）
 *
 * @param bytes - 字节数组
 * @param bitCount - 地址位数
 * @returns 标志位与组成字段
 */
export function analyzeMac(bytes: number[], bitCount: MacBitCount): MacAnalysis {
  const firstOctet = bytes[0] ?? 0;
  const isMulticast = (firstOctet & 0x01) === 0x01;
  const isLocallyAdministered = (firstOctet & 0x02) === 0x02;
  const oui = bytes
    .slice(0, 3)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
  const deviceIdentifier = bytes
    .slice(3)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
  return {
    bitCount,
    isMulticast,
    isLocallyAdministered,
    transmissionType: isMulticast ? '组播（multicast，I/G = 1）' : '单播（unicast，I/G = 0）',
    administrationType: isLocallyAdministered
      ? '本地管理（LAA，U/L = 1）'
      : '全球唯一（OUI / UAA，U/L = 0）',
    oui,
    deviceIdentifier,
    firstOctetBinary: firstOctet.toString(2).padStart(8, '0'),
  };
}

/**
 * 将 MAC-48 地址派生为 EUI-64：在第 3、4 字节之间插入 FF:FE（不翻转 U/L 位）
 *
 * @param bytes - 6 字节 MAC-48
 * @returns 8 字节 EUI-64
 */
export function mac48ToEui64(bytes: number[]): number[] {
  if (bytes.length !== 6) {
    throw new Error('仅 MAC-48（6 字节）可以派生 EUI-64');
  }
  return [...bytes.slice(0, 3), 0xff, 0xfe, ...bytes.slice(3)];
}
