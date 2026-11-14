/** TCP 报文段编解码工具的常量与示例 */

/** 28 字节 SYN 段：MSS=1460、SACK Permitted，校验和 0x3EBB 已按 10.0.0.1 → 10.0.0.2 计算 */
export const DEFAULT_TCP_HEX =
  '30 39 00 50 00 00 03 E8 00 00 00 00 70 02 FB F0 3E BB 00 00 02 04 05 B4 04 02 01 01';

export const DEFAULT_SOURCE_IP = '10.0.0.1';
export const DEFAULT_DESTINATION_IP = '10.0.0.2';

export const TCP_PLACEHOLDER =
  '粘贴 TCP 报文段十六进制（从源端口开始，至少 20 字节；不要包含 IP 首部）';

export const FLAG_OPTIONS = [
  { label: 'FIN', value: 'fin' },
  { label: 'SYN', value: 'syn' },
  { label: 'RST', value: 'rst' },
  { label: 'PSH', value: 'psh' },
  { label: 'ACK', value: 'ack' },
  { label: 'URG', value: 'urg' },
  { label: 'ECE', value: 'ece' },
  { label: 'CWR', value: 'cwr' },
  { label: 'NS', value: 'ns' },
];
