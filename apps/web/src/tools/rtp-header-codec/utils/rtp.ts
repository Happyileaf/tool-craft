/**
 * RTP 报文头（RFC 3550 §5.1）解析与构造的纯函数，全部多字节字段按大端序处理。
 *
 * 固定 12 字节头布局：
 *  byte 0  V(2) P(1) X(1) CC(4)
 *  byte 1  M(1) PT(7)
 *  byte 2-3  Sequence Number (16)
 *  byte 4-7  Timestamp (32)
 *  byte 8-11 SSRC (32)
 *  其后 CC×4 字节 CSRC 数组；X=1 时为扩展头（profile 16 + length 16 + length×4 数据）；
 *  然后是载荷；P=1 时报文末尾为填充，最后一个字节记录填充总长度（含该字节本身）。
 */

import { DYNAMIC_PT_MAX, DYNAMIC_PT_MIN, STATIC_PAYLOAD_TYPES } from '../constants';

export interface RtpHeaderExtension {
  /** 16 位 profile-specific 标识 */
  profile: number;
  /** 扩展数据长度，单位为 32 位字（不含扩展头自身前 4 字节） */
  lengthWords: number;
  /** 扩展数据十六进制（单字节空格分组） */
  dataHex: string;
  /** 扩展头（含 profile/length 4 字节）在报文中的起始字节偏移 */
  byteOffset: number;
}

export interface RtpLayerOffset {
  layer: 'fixed' | 'csrc' | 'extension' | 'payload' | 'padding';
  /** 起始字节偏移（含） */
  start: number;
  /** 结束字节偏移（不含） */
  end: number;
  length: number;
}

export interface RtpPacket {
  version: number;
  padding: number;
  extension: number;
  cc: number;
  marker: number;
  payloadType: number;
  sequenceNumber: number;
  timestamp: number;
  ssrc: number;
  csrc: number[];
  headerExtension?: RtpHeaderExtension;
  payloadHex: string;
  payloadOffset: number;
  paddingLength: number;
  paddingHex: string;
  layerOffsets: RtpLayerOffset[];
  payloadTypeName: string;
  warnings: string[];
}

export interface RtpBuildHeaderExtension {
  /** 16 位 profile-specific 标识 */
  profile: number;
  /** 扩展数据十六进制，字节数必须为 4 的倍数 */
  dataHex: string;
}

export interface RtpBuildConfig {
  version?: number;
  marker: boolean;
  padding: boolean;
  extension: boolean;
  payloadType: number;
  sequenceNumber: number;
  timestamp: number;
  ssrc: number;
  csrc: number[];
  headerExtension?: RtpBuildHeaderExtension;
  /** 填充长度（含末尾长度字节本身），仅 padding=true 时生效，RFC 要求至少为 1 */
  paddingLength?: number;
  payloadHex: string;
}

export interface RtpBuildResult {
  bytes: number[];
  hex: string;
  totalLength: number;
  warnings: string[];
}

/** 解析十六进制字符串为字节数组，容忍空白、逗号、冒号、短横线与 0x 前缀 */
export function hexToBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
  if (!cleaned) {
    throw new Error('请输入十六进制数据');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('包含非法十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数（每个字节两位，出现奇数个 nibble）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 字节数组转大写十六进制，默认按空格分组，group>1 时每 group 字节拼成一组 */
export function bytesToHex(bytes: ArrayLike<number>, group = 1): string {
  const hexes: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hexes.push(bytes[i]!.toString(16).padStart(2, '0').toUpperCase());
  }
  if (group <= 1) {
    return hexes.join(' ');
  }
  const groups: string[] = [];
  for (let i = 0; i < hexes.length; i += group) {
    groups.push(hexes.slice(i, i + group).join(''));
  }
  return groups.join(' ');
}

/** 读取大端 uint32 并转为无符号 32 位数值 */
function readUint32(bytes: number[], offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

/** uint32 转大端 4 字节，自动做 32 位截断 */
function uint32Bytes(value: number): number[] {
  const truncated = value >>> 0;
  return [
    (truncated >>> 24) & 0xff,
    (truncated >>> 16) & 0xff,
    (truncated >>> 8) & 0xff,
    truncated & 0xff,
  ];
}

/** 依据 PT 值返回载荷类型名称（静态表 / 动态范围 / 未分配保留） */
export function getPayloadTypeName(payloadType: number): string {
  const staticName = STATIC_PAYLOAD_TYPES[payloadType];
  if (staticName) {
    return staticName;
  }
  if (payloadType >= DYNAMIC_PT_MIN && payloadType <= DYNAMIC_PT_MAX) {
    return '动态载荷范围';
  }
  return '未分配/保留';
}

/**
 * 解析 RTP 报文。
 * @param input 报文十六进制
 * @param options.allowBadVersion 为 true 时 V≠2 不抛错，改为在 warnings 中标记
 */
export function parseRtpPacket(
  input: string,
  options: { allowBadVersion?: boolean } = {},
): RtpPacket {
  const bytes = hexToBytes(input);
  const totalLength = bytes.length;
  if (totalLength < 12) {
    throw new Error(
      `RTP 报文至少需要 12 字节固定头部（当前仅 ${totalLength} 字节，在字节偏移 0 处截断）`,
    );
  }

  const first = bytes[0]!;
  const version = first >> 6;
  const padding = (first >> 5) & 0x01;
  const extension = (first >> 4) & 0x01;
  const cc = first & 0x0f;
  const second = bytes[1]!;
  const marker = second >> 7;
  const payloadType = second & 0x7f;
  const sequenceNumber = ((bytes[2]! << 8) | bytes[3]!) >>> 0;
  const timestamp = readUint32(bytes, 4);
  const ssrc = readUint32(bytes, 8);

  const warnings: string[] = [];
  if (version !== 2) {
    if (!options.allowBadVersion) {
      throw new Error(
        `版本号 V=${version} 不符合 RFC 3550（期望 V=2，位于字节偏移 0 的高 2 位）；如需教学演示可勾选“允许非 V2 教学向量”`,
      );
    }
    warnings.push(`版本号 V=${version} 非 RFC 3550 规定的 2，结果仅供教学参考`);
  }

  const layerOffsets: RtpLayerOffset[] = [{ layer: 'fixed', start: 0, end: 12, length: 12 }];
  let cursor = 12;

  const csrcLength = cc * 4;
  if (cursor + csrcLength > totalLength) {
    throw new Error(
      `CC=${cc} 声明 ${csrcLength} 字节 CSRC 数组，但字节偏移 ${cursor} 起仅剩 ${totalLength - cursor} 字节，报文被截断`,
    );
  }
  const csrc: number[] = [];
  for (let i = 0; i < cc; i += 1) {
    csrc.push(readUint32(bytes, cursor + i * 4));
  }
  if (csrcLength > 0) {
    layerOffsets.push({ layer: 'csrc', start: cursor, end: cursor + csrcLength, length: csrcLength });
    cursor += csrcLength;
  }

  let headerExtension: RtpHeaderExtension | undefined;
  if (extension) {
    if (cursor + 4 > totalLength) {
      throw new Error(
        `X=1 声明扩展头，但字节偏移 ${cursor} 处不足 4 字节的 profile/length 字段，报文被截断`,
      );
    }
    const profile = ((bytes[cursor]! << 8) | bytes[cursor + 1]!) >>> 0;
    const lengthWords = ((bytes[cursor + 2]! << 8) | bytes[cursor + 3]!) >>> 0;
    const extDataLength = lengthWords * 4;
    const extStart = cursor;
    if (cursor + 4 + extDataLength > totalLength) {
      throw new Error(
        `扩展头 length=${lengthWords}（${extDataLength} 字节数据）超出报文范围：扩展数据应位于字节偏移 ${cursor + 4}–${cursor + 4 + extDataLength - 1}，但报文总长仅 ${totalLength} 字节`,
      );
    }
    const extData = bytes.slice(cursor + 4, cursor + 4 + extDataLength);
    headerExtension = {
      profile,
      lengthWords,
      dataHex: bytesToHex(extData),
      byteOffset: extStart,
    };
    layerOffsets.push({
      layer: 'extension',
      start: extStart,
      end: extStart + 4 + extDataLength,
      length: 4 + extDataLength,
    });
    cursor += 4 + extDataLength;
  }

  let paddingLength = 0;
  let payloadEnd = totalLength;
  if (padding) {
    paddingLength = bytes[totalLength - 1]!;
    if (paddingLength < 1) {
      throw new Error(
        `P=1 但报文末字节（字节偏移 ${totalLength - 1}）记录的填充长度为 0，至少应为 1`,
      );
    }
    if (paddingLength > totalLength - cursor) {
      throw new Error(
        `填充长度 ${paddingLength} 字节越界：头部结束于字节偏移 ${cursor}，尾部仅剩 ${totalLength - cursor} 字节（含载荷与填充）`,
      );
    }
    payloadEnd = totalLength - paddingLength;
  }

  const payloadOffset = cursor;
  const payload = bytes.slice(payloadOffset, payloadEnd);
  const paddingBytes = paddingLength > 0 ? bytes.slice(payloadEnd, totalLength) : [];
  if (payload.length > 0) {
    layerOffsets.push({
      layer: 'payload',
      start: payloadOffset,
      end: payloadEnd,
      length: payload.length,
    });
  }
  if (paddingLength > 0) {
    layerOffsets.push({
      layer: 'padding',
      start: payloadEnd,
      end: totalLength,
      length: paddingLength,
    });
  }

  return {
    version,
    padding,
    extension,
    cc,
    marker,
    payloadType,
    sequenceNumber,
    timestamp,
    ssrc,
    csrc,
    headerExtension,
    payloadHex: bytesToHex(payload, 16),
    payloadOffset,
    paddingLength,
    paddingHex: bytesToHex(paddingBytes, 16),
    layerOffsets,
    payloadTypeName: getPayloadTypeName(payloadType),
    warnings,
  };
}

function isNonNegativeInteger(value: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** 由字段表单构造 RTP 报文，返回字节数组、十六进制与总长 */
export function buildRtpPacket(config: RtpBuildConfig): RtpBuildResult {
  const warnings: string[] = [];
  const version = config.version ?? 2;
  if (!isNonNegativeInteger(version) || version > 3) {
    throw new Error('版本号 V 必须是 0–3 之间的整数');
  }
  if (version !== 2) {
    warnings.push(`版本号 V=${version} 非 RFC 3550 规定的 2，构造结果仅供教学参考`);
  }
  if (!isNonNegativeInteger(config.payloadType) || config.payloadType > 127) {
    throw new Error('载荷类型 PT 必须是 0–127 之间的整数（7 位字段）');
  }
  if (!isNonNegativeInteger(config.sequenceNumber) || config.sequenceNumber > 0xffff) {
    throw new Error('序列号必须是 0–65535 之间的整数');
  }
  if (!isNonNegativeInteger(config.timestamp) || config.timestamp > 0xffffffff) {
    throw new Error('时间戳必须是 0–4294967295 之间的整数');
  }
  if (!isNonNegativeInteger(config.ssrc) || config.ssrc > 0xffffffff) {
    throw new Error('SSRC 必须是 0–4294967295 之间的整数');
  }
  if (!Array.isArray(config.csrc) || config.csrc.length > 15) {
    throw new Error('CSRC 最多 15 项（CC 为 4 位字段）');
  }
  for (const item of config.csrc) {
    if (!isNonNegativeInteger(item) || item > 0xffffffff) {
      throw new Error('每个 CSRC 标识符必须是 0–4294967295 之间的整数');
    }
  }

  const payload = config.payloadHex.trim() ? hexToBytes(config.payloadHex) : [];

  let extensionBytes: number[] = [];
  if (config.extension) {
    const headerExtension = config.headerExtension;
    if (!headerExtension) {
      throw new Error('X=1 时必须提供扩展头 profile 与扩展数据');
    }
    if (
      !isNonNegativeInteger(headerExtension.profile) ||
      headerExtension.profile > 0xffff
    ) {
      throw new Error('扩展头 profile 必须是 0–65535 之间的整数');
    }
    const extData = headerExtension.dataHex.trim() ? hexToBytes(headerExtension.dataHex) : [];
    if (extData.length % 4 !== 0) {
      throw new Error(
        `扩展数据长度必须是 4 的倍数（当前 ${extData.length} 字节），length 字段以 32 位字为单位`,
      );
    }
    const lengthWords = extData.length / 4;
    if (lengthWords > 0xffff) {
      throw new Error('扩展数据过长，length（32 位字计数）不能超过 65535');
    }
    extensionBytes = [
      (headerExtension.profile >>> 8) & 0xff,
      headerExtension.profile & 0xff,
      (lengthWords >>> 8) & 0xff,
      lengthWords & 0xff,
      ...extData,
    ];
  }

  let paddingLength = 0;
  if (config.padding) {
    paddingLength = config.paddingLength ?? 0;
    if (!isNonNegativeInteger(paddingLength) || paddingLength < 1 || paddingLength > 255) {
      throw new Error('填充长度必须是 1–255 之间的整数（末字节记录该长度，含其自身）');
    }
  }

  const cc = config.csrc.length;
  const first =
    ((version & 0x03) << 6) |
    ((config.padding ? 1 : 0) << 5) |
    ((config.extension ? 1 : 0) << 4) |
    (cc & 0x0f);
  const second = ((config.marker ? 1 : 0) << 7) | (config.payloadType & 0x7f);

  const packet: number[] = [
    first,
    second,
    (config.sequenceNumber >>> 8) & 0xff,
    config.sequenceNumber & 0xff,
    ...uint32Bytes(config.timestamp),
    ...uint32Bytes(config.ssrc),
  ];
  for (const item of config.csrc) {
    packet.push(...uint32Bytes(item));
  }
  packet.push(...extensionBytes, ...payload);

  if (config.padding) {
    for (let i = 0; i < paddingLength - 1; i += 1) {
      packet.push(0);
    }
    packet.push(paddingLength);
  }

  return {
    bytes: packet,
    hex: bytesToHex(packet, 16),
    totalLength: packet.length,
    warnings,
  };
}
