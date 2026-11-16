/** RTP 报文头编解码工具的常量、静态载荷类型表与示例 */

/**
 * 验收标准向量：V=2、P=0、X=0、CC=0、M=1、PT=96（动态）、
 * Seq=1、Timestamp=13、SSRC=5，载荷 AA BB。
 * 注意 byte1=0xE0：最高位 M=1，低 7 位 PT=96（0x60 本身的 M 位为 0）
 */
export const DEFAULT_RTP_HEX =
  '80 E0 00 01 00 00 00 0D 00 00 00 05 AA BB';

export const RTP_PLACEHOLDER =
  '粘贴 RTP 报文十六进制（从固定头第一个字节开始，至少 12 字节；可含空格与 0x 前缀）';

/** RFC 3550 静态 RTP 载荷类型（PT）映射小表 */
export const STATIC_PAYLOAD_TYPES: Record<number, string> = {
  0: 'PCMU',
  3: 'GSM',
  4: 'G723',
  8: 'PCMA',
  9: 'G722',
  26: 'JPEG',
  34: 'H263',
};

/** 动态载荷范围下限（含） */
export const DYNAMIC_PT_MIN = 96;
/** 动态载荷范围上限（含） */
export const DYNAMIC_PT_MAX = 127;

/** 分层偏移表各层的展示名称与 Tag 颜色 */
export const LAYER_META: Record<string, { label: string; color: string }> = {
  fixed: { label: '固定头（12 字节）', color: 'blue' },
  csrc: { label: 'CSRC 贡献源列表', color: 'purple' },
  extension: { label: '扩展头', color: 'cyan' },
  payload: { label: '载荷', color: 'green' },
  padding: { label: '填充', color: 'orange' },
};
