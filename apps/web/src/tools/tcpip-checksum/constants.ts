/** raw 模式默认样例：20 字节 IPv4 首部（校验和字段已清零） */
export const DEFAULT_RAW_HEX =
  '45 00 00 73 00 00 40 00 40 11 00 00 c0 a8 00 01 c0 a8 00 c7';

/** TCP 模式默认样例：40 字节最小 TCP 段（校验和偏移 16，已清零） */
export const DEFAULT_TCP_HEX =
  '1f 90 00 50 00 00 00 01 00 00 00 00 50 14 00 00 00 00 00 00' +
  '48 65 6c 6c 6f 20 54 43 50 21 0a 00 00 00 00 00 00 00 00 00';

/** UDP 模式默认样例：14 字节 UDP 段（8 首部 + 6 数据，校验和偏移 6，已清零） */
export const DEFAULT_UDP_HEX = '04 d2 00 50 00 0e 00 00 54 65 73 74 2e 0a';

/** 默认源 IPv4 地址 */
export const DEFAULT_SRC_IP = '192.168.1.2';

/** 默认目的 IPv4 地址 */
export const DEFAULT_DST_IP = '192.168.1.1';

/** raw 模式默认校验和字段偏移（IPv4 首部为 10） */
export const DEFAULT_RAW_OFFSET = 10;

/** 协议模式选项 */
export const PROTOCOL_OPTIONS = [
  { label: 'IPv4 / ICMP（裸报文）', value: 'raw' },
  { label: 'TCP（含伪首部）', value: 'tcp' },
  { label: 'UDP（含伪首部）', value: 'udp' },
] as const;
