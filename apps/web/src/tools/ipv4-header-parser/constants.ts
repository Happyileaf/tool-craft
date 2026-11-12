/** IPv4 头部解析工具的常量与示例 */

export const DEFAULT_HEADER_HEX =
  '45 00 00 3c 1c 46 40 00 40 06 00 00 c0 a8 01 0a c0 a8 01 01';

export const HEADER_PLACEHOLDER = '粘贴 IPv4 数据报头部十六进制（至少 20 字节）';

export const PROTOCOL_PRESETS: Array<{ label: string; protocol: number }> = [
  { label: 'ICMP (1)', protocol: 1 },
  { label: 'TCP (6)', protocol: 6 },
  { label: 'UDP (17)', protocol: 17 },
  { label: 'GRE (47)', protocol: 47 },
  { label: 'ICMPv6 (58)', protocol: 58 },
];

/** 字段展示顺序与中文名称，供详情表格使用 */
export const FIELD_LABELS: Record<string, string> = {
  version: '版本 Version',
  ihl: '首部长度 IHL（32 位字）',
  headerLength: '首部字节数',
  dscp: '区分服务 DSCP',
  ecn: '显式拥塞通知 ECN',
  totalLength: '总长度 Total Length',
  identification: '标识 Identification',
  ttl: '生存时间 TTL',
  protocol: '协议 Protocol',
  protocolName: '协议名称',
  headerChecksum: '首部校验和（原值）',
  sourceAddress: '源地址 Source',
  destinationAddress: '目的地址 Destination',
  fragmentOffset: '片偏移 Fragment Offset',
  payloadLength: '载荷长度',
};
