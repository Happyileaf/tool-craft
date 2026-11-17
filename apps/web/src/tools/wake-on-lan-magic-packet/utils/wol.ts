/**
 * Wake-on-LAN 魔术包构造与解析纯函数（AMD WoL 帧格式）
 *
 * 帧结构（共 102 字节）：
 *   - 6 字节同步流：FF FF FF FF FF FF
 *   - 16 次目标网卡 MAC 地址（6 字节）重复
 * 参考：AMD Magic Packet Technology 白皮书 / Wikipedia "Wake-on-LAN"
 */

/** 魔术包固定长度（字节） */
export const MAGIC_PACKET_LENGTH = 6 + 16 * 6;

/** 同步流长度（字节） */
const SYNC_STREAM_LENGTH = 6;

/** MAC 重复次数 */
const MAC_REPETITIONS = 16;

/** 解析后的魔术包结构 */
export interface ParsedMagicPacket {
  /** 同步流（始终为 6 个 0xff） */
  syncStream: number[];
  /** 16 次重复中携带的目标 MAC（规范化后的十六进制串，冒号分隔） */
  targetMac: string;
  /** 16 次重复的 MAC 原始字节，每次一个 6 字节数组 */
  repetitions: number[][];
  /** 帧总字节数 */
  length: number;
}

/**
 * 把任意常见写法的 MAC 地址规范化为 6 个字节。
 * 支持分隔符：冒号 `:`、连字符 `-`、点 `.`（Cisco 风格 xxxx.xxxx.xxxx）、无分隔符。
 *
 * @param input 用户输入的 MAC 字符串
 * @returns 长度为 6 的字节数组
 * @throws 输入为空、含非法十六进制字符或字节数不为 6 时抛错
 */
export function parseMac(input: string): number[] {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('MAC 地址不能为空');
  }
  const trimmed = input.trim();

  // Cisco 点分风格：0011.2233.4455
  const dotGroups = trimmed.split('.');
  let hex: string;
  if (dotGroups.length === 3 && dotGroups.every((group) => /^[0-9a-fA-F]{4}$/.test(group))) {
    hex = dotGroups.join('');
  } else {
    // 统一去掉冒号 / 连字符 / 点分隔符
    hex = trimmed.replace(/[:\-.\s]/g, '');
  }

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('MAC 地址含非法字符，只允许十六进制字符与 : - . 分隔符');
  }
  if (hex.length !== 12) {
    throw new Error(`MAC 地址应为 6 个字节（12 个十六进制字符），当前为 ${hex.length / 2} 个字节`);
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * 把字节数组格式化为冒号分隔的大写 MAC 字符串，如 `AA:BB:CC:DD:EE:FF`。
 *
 * @param bytes 长度为 6 的字节数组
 * @returns 规范化 MAC 字符串
 */
export function formatMac(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

/**
 * 构造 Wake-on-LAN 魔术包字节数组。
 *
 * @param macInput 任意常见写法的目标 MAC 地址
 * @returns 长度固定为 102 的 Uint8Array
 * @throws MAC 地址非法时抛错
 */
export function buildMagicPacket(macInput: string): Uint8Array {
  const mac = parseMac(macInput);
  const packet = new Uint8Array(MAGIC_PACKET_LENGTH);

  // 前 6 字节同步流 0xFF
  packet.fill(0xff, 0, SYNC_STREAM_LENGTH);

  // 随后重复 16 次 MAC
  for (let repetition = 0; repetition < MAC_REPETITIONS; repetition += 1) {
    const offset = SYNC_STREAM_LENGTH + repetition * mac.length;
    packet.set(mac, offset);
  }

  return packet;
}

/**
 * 把字节数组编码为十六进制字符串（可配置大小写与分隔符）。
 *
 * @param bytes 字节数组
 * @param options.separator 每两个十六进制字符之间的分隔符，默认空串
 * @param options.uppercase 是否大写，默认 true
 * @returns 十六进制文本
 */
export function toHex(
  bytes: Uint8Array | number[],
  options: { separator?: string; uppercase?: boolean } = {},
): string {
  const { separator = '', uppercase = true } = options;
  const parts: string[] = [];
  for (const byte of bytes) {
    parts.push(byte.toString(16).padStart(2, '0'));
  }
  const joined = parts.join(separator);
  return uppercase ? joined.toUpperCase() : joined;
}

/**
 * 解析十六进制文本为字节数组，允许空白、换行与 `0x` 前缀。
 *
 * @param hexText 十六进制文本
 * @returns 字节数组
 * @throws 含非法字符或出现奇数个十六进制字符时抛错
 */
export function fromHex(hexText: string): Uint8Array {
  if (typeof hexText !== 'string' || hexText.trim() === '') {
    throw new Error('十六进制输入不能为空');
  }
  const cleaned = hexText
    .replace(/0x/gi, '')
    .replace(/[\s,]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('十六进制输入含非法字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 校验并解析一个魔术包字节数组。
 *
 * @param packet 待校验的字节数组
 * @returns 解析后的结构（同步流、目标 MAC、16 次重复）
 * @throws 长度不符、同步流错误或 16 次 MAC 不一致时抛错
 */
export function parseMagicPacket(packet: Uint8Array | number[]): ParsedMagicPacket {
  const bytes = packet instanceof Uint8Array ? packet : Uint8Array.from(packet);

  if (bytes.length !== MAGIC_PACKET_LENGTH) {
    throw new Error(`魔术包长度必须为 ${MAGIC_PACKET_LENGTH} 字节，当前为 ${bytes.length} 字节`);
  }

  const syncStream = Array.from(bytes.slice(0, SYNC_STREAM_LENGTH));
  if (!syncStream.every((byte) => byte === 0xff)) {
    throw new Error('前 6 字节同步流必须全部为 0xFF');
  }

  const repetitions: number[][] = [];
  for (let repetition = 0; repetition < MAC_REPETITIONS; repetition += 1) {
    const start = SYNC_STREAM_LENGTH + repetition * 6;
    repetitions.push(Array.from(bytes.slice(start, start + 6)));
  }

  const first = repetitions[0] as number[];
  for (let repetition = 1; repetition < MAC_REPETITIONS; repetition += 1) {
    const current = repetitions[repetition] as number[];
    if (!current.every((byte, index) => byte === first[index])) {
      throw new Error(`第 ${repetition + 1} 次 MAC 重复与第 1 次不一致，魔术包已损坏`);
    }
  }

  return {
    syncStream,
    targetMac: formatMac(first),
    repetitions,
    length: bytes.length,
  };
}
