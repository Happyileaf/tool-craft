/** 以太网 II 帧编解码工具的常量与示例 */

/** 64 字节合法以太网 II 帧（IPv4 载荷 46 字节 + 正确 FCS） */
export const DEFAULT_FRAME_HEX =
  '02 00 00 00 00 01 02 00 00 00 00 02 08 00 45 00 00 2E 1C 46 40 00 40 06 9B 28 C0 A8 01 0A C0 A8 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 DF 73 52 01';

export const FRAME_PLACEHOLDER =
  '粘贴以太网帧十六进制（含 6 字节目的 MAC、6 字节源 MAC、2 字节 EtherType、载荷与可选 FCS）';

export const SAMPLE_PAYLOAD_HEX =
  '45 00 00 2E 1C 46 40 00 40 06 9B 28 C0 A8 01 0A C0 A8 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00';

export const ETHER_TYPE_PRESETS: Array<{ label: string; value: string }> = [
  { label: 'IPv4 (0x0800)', value: '0x0800' },
  { label: 'ARP (0x0806)', value: '0x0806' },
  { label: 'IPv6 (0x86DD)', value: '0x86DD' },
  { label: 'VLAN (0x8100)', value: '0x8100' },
  { label: 'LLDP (0x88CC)', value: '0x88CC' },
];
