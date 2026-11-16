/**
 * IEEE 802.1Q VLAN 标签（含 QinQ 双层）编解码纯函数。
 *
 * 单标签 4 字节布局（大端）：
 *   字节 0-1  TPID（0x8100 C-TAG / 0x88A8 S-TAG / 0x9100 旧 Q-in-Q）
 *   字节 2-3  TCI：PCP(3 bit) + DEI(1 bit) + VID(12 bit)
 * QinQ 双层 8 字节：外层 S-TAG（0x88A8）+ 内层 C-TAG（0x8100），解析顺序外→内。
 */

/** 已知 VLAN TPID 取值 */
export const TPID_CTAG = 0x8100;
export const TPID_STAG = 0x88a8;
export const TPID_QINQ_LEGACY = 0x9100;

const KNOWN_TPIDS: readonly number[] = [TPID_CTAG, TPID_STAG, TPID_QINQ_LEGACY];

export const VID_MIN = 0;
export const VID_MAX = 4095;
export const VID_RESERVED_ZERO = 0;
export const VID_RESERVED_MAX = 4095;
export const PCP_MAX = 7;

export class VlanError extends Error {}

/** TPID 的标准名称 */
export function tpidName(tpid: number): string {
  switch (tpid) {
    case TPID_CTAG:
      return 'C-TAG（客户标签，802.1Q）';
    case TPID_STAG:
      return 'S-TAG（服务标签，QinQ 外层）';
    case TPID_QINQ_LEGACY:
      return '旧版 Q-in-Q 标签';
    default:
      return `未知 TPID（0x${tpid.toString(16).padStart(4, '0')}）`;
  }
}

/** 宽松归一化十六进制字符串：去 0x 前缀、空格、换行、冒号、逗号与短横线 */
export function normalizeHex(input: string): string {
  return input
    .trim()
    .replace(/0x/gi, '')
    .replace(/[\s:,.-]/g, '');
}

/** 十六进制字符串 → 字节数组，奇数位 / 非法字符 / 空输入分别抛出带说明的错误 */
export function hexToBytes(input: string): Uint8Array {
  const cleaned = normalizeHex(input);
  if (!cleaned) {
    throw new VlanError('十六进制输入为空');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new VlanError('输入包含非十六进制字符（仅允许 0-9、a-f）');
  }
  if (cleaned.length % 2 !== 0) {
    throw new VlanError(`十六进制字符数为奇数（${cleaned.length} 个），必须为偶数才能组成完整字节`);
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节数组 → 大写十六进制字符串，spaced 时按字节空格分组 */
export function bytesToHex(bytes: ArrayLike<number>, spaced = true): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    parts.push((bytes[i] ?? 0).toString(16).padStart(2, '0').toUpperCase());
  }
  return spaced ? parts.join(' ') : parts.join('');
}

/** 16 位数字 → 4 位大写 hex（无分隔），如 0xa864 → "A864" */
export function uint16ToHex(value: number): string {
  return value.toString(16).padStart(4, '0').toUpperCase();
}

export interface TciFields {
  pcp: number;
  dei: number;
  vid: number;
}

/** 校验 PCP / DEI / VID 取值范围，VID 0 与 4095 保留但允许计算（仅告警） */
export function validateFields(fields: TciFields): void {
  const { pcp, dei, vid } = fields;
  if (!Number.isInteger(pcp) || pcp < 0 || pcp > PCP_MAX) {
    throw new VlanError(`PCP 必须是 0-${PCP_MAX} 之间的整数，当前为 ${String(pcp)}`);
  }
  if (dei !== 0 && dei !== 1) {
    throw new VlanError(`DEI 只能是 0 或 1，当前为 ${String(dei)}`);
  }
  if (!Number.isInteger(vid) || vid < VID_MIN || vid > VID_MAX) {
    throw new VlanError(`VID 必须是 ${VID_MIN}-${VID_MAX} 之间的 12 位整数，当前为 ${String(vid)}`);
  }
}

/** VID 保留值告警文案，非保留值返回 null */
export function vidWarning(vid: number): string | null {
  if (vid === VID_RESERVED_ZERO) {
    return 'VID=0 为保留值（表示不基于 VID 区分，仅携带优先级），实际业务 VLAN 不应使用';
  }
  if (vid === VID_RESERVED_MAX) {
    return 'VID=4095（0xFFF）为保留值，规范禁止用于普通业务 VLAN';
  }
  return null;
}

/** 字段拼装 16 位 TCI：PCP<<13 | DEI<<12 | VID */
export function buildTci(fields: TciFields): number {
  validateFields(fields);
  return ((fields.pcp << 13) | (fields.dei << 12) | fields.vid) & 0xffff;
}

/** 16 位 TCI 拆位为 PCP / DEI / VID */
export function parseTci(tci: number): TciFields {
  return {
    pcp: (tci >>> 13) & 0x7,
    dei: (tci >>> 12) & 0x1,
    vid: tci & 0xfff,
  };
}

export interface VlanTag extends TciFields {
  tpid: number;
  tpidHex: string;
  tci: number;
  tciHex: string;
}

/** 构造单层 4 字节标签（TPID + TCI），返回字段结构与字节 */
export function buildTag(fields: TciFields, tpid: number = TPID_CTAG): VlanTag {
  if (!KNOWN_TPIDS.includes(tpid)) {
    throw new VlanError(
      `未知 TPID 0x${tpid.toString(16).padStart(4, '0')}，支持 0x8100 / 0x88A8 / 0x9100`,
    );
  }
  const tci = buildTci(fields);
  return {
    ...fields,
    tpid,
    tpidHex: uint16ToHex(tpid),
    tci,
    tciHex: uint16ToHex(tci),
  };
}

/** 标签结构 → 4 字节大端字节数组 */
export function tagToBytes(tag: VlanTag): Uint8Array {
  return Uint8Array.from([
    (tag.tpid >>> 8) & 0xff,
    tag.tpid & 0xff,
    (tag.tci >>> 8) & 0xff,
    tag.tci & 0xff,
  ]);
}

/** 读取字节数组指定偏移处的 16 位大端整数，越界时抛带偏移的错误 */
function readUint16(bytes: Uint8Array, offset: number, label: string): number {
  const high = bytes[offset];
  const low = bytes[offset + 1];
  if (high === undefined || low === undefined) {
    throw new VlanError(`${label}读取越界：字节偏移 ${offset} 处数据不足（输入总长 ${bytes.length} 字节）`);
  }
  return ((high << 8) | low) >>> 0;
}

/** 解析单层 4 字节标签（仅标签模式），错误 TPID 抛带偏移的中文异常 */
export function parseTagBytes(bytes: Uint8Array): VlanTag {
  if (bytes.length < 4) {
    throw new VlanError(`单标签至少需要 4 字节，当前仅 ${bytes.length} 字节`);
  }
  const tpid = readUint16(bytes, 0, 'TPID');
  if (!KNOWN_TPIDS.includes(tpid)) {
    throw new VlanError(
      `字节偏移 0 处 TPID 错误：期望 0x8100 / 0x88A8 / 0x9100，实际为 0x${tpid
        .toString(16)
        .padStart(4, '0')}`,
    );
  }
  const tci = readUint16(bytes, 2, 'TCI');
  return { ...parseTci(tci), tpid, tpidHex: uint16ToHex(tpid), tci, tciHex: uint16ToHex(tci) };
}

export interface QinQPair {
  outer: VlanTag;
  inner: VlanTag;
}

/** QinQ 双层构造：外层 S-TAG（默认 0x88A8）+ 内层 C-TAG（默认 0x8100），共 8 字节 */
export function buildQinQ(outerFields: TciFields, innerFields: TciFields): QinQPair {
  return {
    outer: buildTag(outerFields, TPID_STAG),
    inner: buildTag(innerFields, TPID_CTAG),
  };
}

/** QinQ 结构 → 8 字节大端字节数组（外→内） */
export function qinQToBytes(pair: QinQPair): Uint8Array {
  const outer = tagToBytes(pair.outer);
  const inner = tagToBytes(pair.inner);
  const merged = new Uint8Array(8);
  merged.set(outer, 0);
  merged.set(inner, 4);
  return merged;
}

/** 解析 8 字节 QinQ 标签，顺序外→内；TPID 顺序或取值错误时抛带偏移异常 */
export function parseQinQBytes(bytes: Uint8Array): QinQPair {
  if (bytes.length < 8) {
    throw new VlanError(`QinQ 双层标签需要 8 字节，当前仅 ${bytes.length} 字节`);
  }
  const outerTpid = readUint16(bytes, 0, '外层 TPID');
  if (outerTpid !== TPID_STAG && outerTpid !== TPID_QINQ_LEGACY) {
    throw new VlanError(
      `字节偏移 0 处外层 TPID 错误：期望 0x88A8（或旧版 0x9100），实际为 0x${outerTpid
        .toString(16)
        .padStart(4, '0')}`,
    );
  }
  const innerTpid = readUint16(bytes, 4, '内层 TPID');
  if (innerTpid !== TPID_CTAG) {
    throw new VlanError(
      `字节偏移 4 处内层 TPID 错误：期望 0x8100，实际为 0x${innerTpid
        .toString(16)
        .padStart(4, '0')}`,
    );
  }
  const outerTci = readUint16(bytes, 2, '外层 TCI');
  const innerTci = readUint16(bytes, 6, '内层 TCI');
  return {
    outer: {
      ...parseTci(outerTci),
      tpid: outerTpid,
      tpidHex: uint16ToHex(outerTpid),
      tci: outerTci,
      tciHex: uint16ToHex(outerTci),
    },
    inner: {
      ...parseTci(innerTci),
      tpid: innerTpid,
      tpidHex: uint16ToHex(innerTpid),
      tci: innerTci,
      tciHex: uint16ToHex(innerTci),
    },
  };
}

export interface FrameTagLocation {
  /** 标签起始字节偏移（标准以太网帧为 12） */
  tagOffset: number;
  /** 检测到的标签层数：1 或 2 */
  layers: 1 | 2;
  /** 解析出的标签（外→内） */
  tags: VlanTag[];
  /** 标签之后的 EtherType（大端数字） */
  followingEtherType: number;
  followingEtherTypeHex: string;
}

/**
 * 在完整以太网帧 hex 中定位 VLAN 标签：
 * 标准帧源 MAC（6 字节）结束于偏移 12，其后应为 TPID。
 * 支持单标签（4 字节）与 QinQ 双标签（8 字节）。
 */
export function locateTagInFrame(bytes: Uint8Array): FrameTagLocation {
  // 12 字节 MAC + 至少 2 字节 TPID
  if (bytes.length < 14) {
    throw new VlanError(
      `输入过短：以太网帧至少需要 14 字节（12 字节 MAC 首部 + 2 字节类型字段），当前 ${bytes.length} 字节`,
    );
  }
  const tagOffset = 12;
  const firstTpid = readUint16(bytes, tagOffset, 'TPID');
  if (!KNOWN_TPIDS.includes(firstTpid)) {
    throw new VlanError(
      `未检测到 VLAN 标签：字节偏移 ${tagOffset}（源 MAC 之后）期望 0x8100 / 0x88A8 / 0x9100，实际为 0x${firstTpid
        .toString(16)
        .padStart(4, '0')}`,
    );
  }

  const secondTpid = readUint16(bytes, tagOffset + 4, '第二层 TPID');
  const isQinQ =
    (firstTpid === TPID_STAG || firstTpid === TPID_QINQ_LEGACY) &&
    secondTpid === TPID_CTAG;

  if (isQinQ) {
    const pair = parseQinQBytes(bytes.slice(tagOffset, tagOffset + 8));
    const etherTypeOffset = tagOffset + 8;
    const followingEtherType = readUint16(bytes, etherTypeOffset, '标签后 EtherType');
    return {
      tagOffset,
      layers: 2,
      tags: [pair.outer, pair.inner],
      followingEtherType,
      followingEtherTypeHex: uint16ToHex(followingEtherType),
    };
  }

  const tag = parseTagBytes(bytes.slice(tagOffset, tagOffset + 4));
  const etherTypeOffset = tagOffset + 4;
  const followingEtherType = readUint16(bytes, etherTypeOffset, '标签后 EtherType');
  return {
    tagOffset,
    layers: 1,
    tags: [tag],
    followingEtherType,
    followingEtherTypeHex: uint16ToHex(followingEtherType),
  };
}
