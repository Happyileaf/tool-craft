/** UDP 报文编解码工具的常量与示例 */

/**
 * 向量 1 的完整报文：源端口 1234（0x04D2）、目的端口 80（0x0050）、
 * 载荷 "Test.\n"（54 65 73 74 2E 0A），长度 14；
 * 校验和 0x8178 已按 192.168.1.2 → 192.168.1.1 的 IPv4 伪首部回填
 */
export const DEFAULT_UDP_HEX = '04 D2 00 50 00 0E 81 78 54 65 73 74 2E 0A';

export const DEFAULT_SOURCE_IPV4 = '192.168.1.2';
export const DEFAULT_DESTINATION_IPV4 = '192.168.1.1';

export const DEFAULT_SOURCE_IPV6 = '2001:db8::2';
export const DEFAULT_DESTINATION_IPV6 = '2001:db8::1';

export const UDP_PLACEHOLDER =
  '粘贴 UDP 报文十六进制（从源端口开始，至少 8 字节；不要包含 IP 首部）';

/** 十六进制分行视图每行的字节数 */
export const BYTES_PER_LINE = 16;
