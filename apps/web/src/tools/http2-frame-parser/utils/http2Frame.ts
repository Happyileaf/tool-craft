/**
 * HTTP/2 帧头解析与帧序列查看纯函数模块（RFC 7540）。
 *
 * 帧头固定 9 字节：
 *   长度(24bit) | 类型(8bit) | 标志(8bit) | R(1bit)+流标识(31bit)
 *
 * 本模块只解析帧头与「无需 HPACK 解压」的载荷（SETTINGS / WINDOW_UPDATE /
 * PING / GOAWAY），HEADERS / CONTINUATION / DATA 仅做长度与标志位展示，
 * 不实现 HPACK（RFC 7541）。所有函数确定性执行、不依赖浏览器 API。
 */

/** RFC 7540 §11 定义的帧类型 */
export const FRAME_TYPES: Readonly<Record<number, string>> = {
  0x0: 'DATA',
  0x1: 'HEADERS',
  0x2: 'PRIORITY',
  0x3: 'RST_STREAM',
  0x4: 'SETTINGS',
  0x5: 'PUSH_PROMISE',
  0x6: 'PING',
  0x7: 'GOAWAY',
  0x8: 'WINDOW_UPDATE',
  0x9: 'CONTINUATION',
};

/** 各帧类型的标志位（位掩码 → 名称），RFC 7540 §6 */
export const FRAME_FLAGS: Readonly<Record<number, ReadonlyArray<{ mask: number; name: string }>>> = {
  0x0: [{ mask: 0x1, name: 'END_STREAM' }, { mask: 0x8, name: 'PADDED' }],
  0x1: [
    { mask: 0x1, name: 'END_STREAM' },
    { mask: 0x4, name: 'END_HEADERS' },
    { mask: 0x8, name: 'PADDED' },
    { mask: 0x20, name: 'PRIORITY' },
  ],
  0x4: [{ mask: 0x1, name: 'ACK' }],
  0x5: [{ mask: 0x4, name: 'END_HEADERS' }, { mask: 0x8, name: 'PADDED' }],
  0x6: [{ mask: 0x1, name: 'ACK' }],
  0x9: [{ mask: 0x4, name: 'END_HEADERS' }],
};

/** SETTINGS 帧参数标识符（RFC 7540 §6.5.2） */
export const SETTING_IDENTIFIERS: Readonly<Record<number, string>> = {
  0x1: 'HEADER_TABLE_SIZE',
  0x2: 'ENABLE_PUSH',
  0x3: 'MAX_CONCURRENT_STREAMS',
  0x4: 'INITIAL_WINDOW_SIZE',
  0x5: 'MAX_FRAME_SIZE',
  0x6: 'MAX_HEADER_LIST_SIZE',
};

/** GOAWAY 错误码（RFC 7540 §7） */
export const ERROR_CODES: Readonly<Record<number, string>> = {
  0x0: 'NO_ERROR',
  0x1: 'PROTOCOL_ERROR',
  0x2: 'INTERNAL_ERROR',
  0x3: 'FLOW_CONTROL_ERROR',
  0x4: 'SETTINGS_TIMEOUT',
  0x5: 'STREAM_CLOSED',
  0x6: 'FRAME_SIZE_ERROR',
  0x7: 'REFUSED_STREAM',
  0x8: 'CANCEL',
  0x9: 'COMPRESSION_ERROR',
  0xa: 'CONNECT_ERROR',
  0xb: 'ENHANCE_YOUR_CALM',
  0xc: 'INADEQUATE_SECURITY',
  0xd: 'HTTP_1_1_REQUIRED',
};

/** 解析后的单帧 */
export interface ParsedFrame {
  /** 序号（从 0 开始） */
  index: number;
  /** 帧在原始字节流中的起始偏移 */
  offset: number;
  /** 载荷长度（24bit） */
  length: number;
  /** 类型数值 */
  typeCode: number;
  /** 类型名称（未知类型为 UNKNOWN(0x..)） */
  typeName: string;
  /** 标志原始字节 */
  flags: number;
  /** 命中的标志名称 */
  flagNames: string[];
  /** 保留位 R（应为 0） */
  reservedBit: number;
  /** 流标识（31bit） */
  streamId: number;
  /** 整帧字节数（9 字节头 + 载荷） */
  totalBytes: number;
  /** 类型相关的载荷摘要（已解析部分） */
  payloadSummary: string;
  /** 该帧的告警信息（如保留位非 0、长度非法） */
  warnings: string[];
}

/** 整体解析结果 */
export interface ParseResult {
  frames: ParsedFrame[];
  errors: string[];
  /** 已消费字节数；输入被截断时小于总长度 */
  consumedBytes: number;
  /** 剩余未解析字节（截断场景） */
  trailingBytes: number;
}

const FRAME_HEADER_SIZE = 9;
const MAX_FRAME_PAYLOAD = 16384; // RFC 7540 默认最大帧载荷
const MAX_24BIT = 0xffffff;

/**
 * 把十六进制文本（可含空格、换行、0x 前缀）解析为字节数组。
 *
 * @param raw - 用户输入的十六进制文本
 * @returns 字节数组；含非法十六进制字符或奇数个 nibble 时返回错误
 */
export function parseHexInput(raw: string): { bytes: number[]; errors: string[] } {
  const cleaned = raw
    .replace(/0x/gi, '')
    .replace(/[\s,;]/g, '');
  if (cleaned === '') {
    return { bytes: [], errors: ['输入为空，请粘贴 HTTP/2 帧的十六进制数据（可省略连接前导）'] };
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    return { bytes: [], errors: ['输入包含非十六进制字符，仅允许 0-9、a-f、空格与 0x 前缀'] };
  }
  if (cleaned.length % 2 !== 0) {
    return { bytes: [], errors: ['十六进制字符数为奇数，每个字节需要两位十六进制数'] };
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return { bytes, errors: [] };
}

/**
 * 解析完整帧序列。
 *
 * @param input - 字节数组
 * @returns 帧列表与诊断信息
 */
export function parseFrames(input: number[]): ParseResult {
  const frames: ParsedFrame[] = [];
  const errors: string[] = [];
  let offset = 0;
  let index = 0;

  while (offset + FRAME_HEADER_SIZE <= input.length) {
    const warnings: string[] = [];
    const length = (input[offset]! << 16) | (input[offset + 1]! << 8) | input[offset + 2]!;
    const typeCode = input[offset + 3]!;
    const flags = input[offset + 4]!;
    const streamWord = (input[offset + 5]! << 24) | (input[offset + 6]! << 16) | (input[offset + 7]! << 8) | input[offset + 8]!;
    const reservedBit = (streamWord >>> 31) & 0x1;
    const streamId = streamWord & 0x7fffffff;

    if (reservedBit !== 0) {
      warnings.push('保留位 R 为 1，RFC 7540 规定该位必须为 0');
    }
    if (length > MAX_24BIT) {
      warnings.push('载荷长度超出 24bit 表示范围');
    }
    if (length > MAX_FRAME_PAYLOAD && typeCode !== 0x4) {
      warnings.push(`载荷 ${length} 字节超过默认 MAX_FRAME_SIZE ${MAX_FRAME_PAYLOAD}，除非对端协商过更大值`);
    }

    // 截断：声明的载荷超出剩余输入
    if (offset + FRAME_HEADER_SIZE + length > input.length) {
      errors.push(
        `第 #${index} 帧（${FRAME_TYPES[typeCode] ?? 'UNKNOWN'}）声明载荷 ${length} 字节，但输入在帧中途结束，存在数据截断`,
      );
      break;
    }

    const payload = input.slice(offset + FRAME_HEADER_SIZE, offset + FRAME_HEADER_SIZE + length);
    const typeName = FRAME_TYPES[typeCode] ?? `UNKNOWN(0x${typeCode.toString(16)})`;
    const flagNames = resolveFlagNames(typeCode, flags);
    validateFrameRules(typeCode, streamId, length, flags, warnings);
    const payloadSummary = summarizePayload(typeCode, payload, flags);

    frames.push({
      index,
      offset,
      length,
      typeCode,
      typeName,
      flags,
      flagNames,
      reservedBit,
      streamId,
      totalBytes: FRAME_HEADER_SIZE + length,
      payloadSummary,
      warnings,
    });

    offset += FRAME_HEADER_SIZE + length;
    index += 1;
  }

  if (frames.length === 0 && errors.length === 0 && input.length > 0 && input.length < FRAME_HEADER_SIZE) {
    errors.push(`剩余 ${input.length} 字节不足 9 字节帧头，无法解析出完整帧`);
  }

  return {
    frames,
    errors,
    consumedBytes: offset,
    trailingBytes: input.length - offset,
  };
}

/** 解析标志位名称 */
function resolveFlagNames(typeCode: number, flags: number): string[] {
  const defs = FRAME_FLAGS[typeCode];
  if (!defs) {
    return [];
  }
  return defs.filter((def) => (flags & def.mask) !== 0).map((def) => def.name);
}

/** RFC 7540 §6 的帧级规则校验 */
function validateFrameRules(
  typeCode: number,
  streamId: number,
  length: number,
  flags: number,
  warnings: string[],
): void {
  // 连接级帧必须携带流标识 0
  const connectionLevel = [0x4, 0x6, 0x7, 0x8];
  if (connectionLevel.includes(typeCode) && streamId !== 0) {
    warnings.push(`${FRAME_TYPES[typeCode]} 是连接级帧，流标识必须为 0，当前为 ${streamId}`);
  }
  if (typeCode === 0x4 && length % 6 !== 0) {
    warnings.push('SETTINGS 载荷必须是 6 字节倍数，当前长度不合法');
  }
  if (typeCode === 0x4 && (flags & 0x1) !== 0 && length !== 0) {
    warnings.push('SETTINGS ACK 帧载荷必须为空');
  }
  if (typeCode === 0x8 && length !== 4) {
    warnings.push('WINDOW_UPDATE 载荷必须恰为 4 字节');
  }
  if (typeCode === 0x6 && length !== 8) {
    warnings.push('PING 载荷必须恰为 8 字节');
  }
  if (typeCode === 0x3 && length !== 4) {
    warnings.push('RST_STREAM 载荷必须恰为 4 字节错误码');
  }
}

/** 生成类型相关的载荷摘要（不做 HPACK 解压） */
function summarizePayload(typeCode: number, payload: number[], flags: number): string {
  switch (typeCode) {
    case 0x4: {
      if ((flags & 0x1) !== 0) {
        return 'SETTINGS ACK（无参数）';
      }
      const entries: string[] = [];
      for (let i = 0; i + 5 < payload.length; i += 6) {
        const id = (payload[i]! << 8) | payload[i + 1]!;
        const value =
          (payload[i + 2]! * 0x1000000) +
          (payload[i + 3]! << 16) +
          (payload[i + 4]! << 8) +
          payload[i + 5]!;
        const name = SETTING_IDENTIFIERS[id] ?? `UNKNOWN(0x${id.toString(16)})`;
        entries.push(`${name}=${value}`);
      }
      return entries.length ? entries.join('; ') : '空 SETTINGS（探测对端默认值）';
    }
    case 0x8: {
      if (payload.length !== 4) {
        return '长度非法';
      }
      const word = (payload[0]! << 24) | (payload[1]! << 16) | (payload[2]! << 8) | payload[3]!;
      const increment = word & 0x7fffffff;
      return `Window Size Increment=${increment}`;
    }
    case 0x6:
      return `Opaque 8 字节=${payload.map((b) => b.toString(16).padStart(2, '0')).join(' ')}`;
    case 0x7: {
      if (payload.length < 8) {
        return 'GOAWAY 载荷不足 8 字节';
      }
      const lastStream = ((payload[0]! & 0x7f) << 24) | (payload[1]! << 16) | (payload[2]! << 8) | payload[3]!;
      const errorCode = (payload[4]! << 24) | (payload[5]! << 16) | (payload[6]! << 8) | payload[7]!;
      const debug = payload.slice(8).map((b) => b.toString(16).padStart(2, '0')).join(' ');
      const errorName = ERROR_CODES[errorCode >>> 0] ?? `UNKNOWN(0x${(errorCode >>> 0).toString(16)})`;
      return `Last-Stream-ID=${lastStream}; Error=${errorName}${debug ? `; Debug=${debug}` : ''}`;
    }
    case 0x3: {
      if (payload.length !== 4) {
        return 'RST_STREAM 载荷长度非法';
      }
      const code = (payload[0]! << 24) | (payload[1]! << 16) | (payload[2]! << 8) | payload[3]!;
      return `Error=${ERROR_CODES[code >>> 0] ?? `0x${(code >>> 0).toString(16)}`}`;
    }
    case 0x1:
      return 'HEADERS 载荷为 HPACK 压缩块，本工具不做 HPACK 解压，仅展示帧头与标志';
    case 0x9:
      return 'CONTINUATION 载荷为 HPACK 压缩块片段，本工具不做 HPACK 解压';
    case 0x0:
      return (flags & 0x8) !== 0 ? 'DATA（含 Padding，首字节为填充长度）' : 'DATA 应用数据，长度见帧头';
    default:
      return payload.length ? `${payload.length} 字节载荷（未展开）` : '无载荷';
  }
}

/** 将字节数组格式化为带空格的十六进制字符串 */
export function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

/**
 * 内置样例：SETTINGS + WINDOW_UPDATE + PING 三帧（不含连接前导），
 * 便于用户首次进入即可看到解析效果。
 */
export const SAMPLE_HEX =
  '00 00 0c 04 00 00 00 00 00 00 03 00 00 00 64 00 04 00 00 40 00 ' +
  '00 00 04 08 00 00 00 00 00 00 00 10 00 ' +
  '00 00 08 06 01 00 00 00 00 01 02 03 04 05 06 07 08';
