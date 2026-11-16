/** DHCPv4 编解码工具的常量与内置样例 */

/** 解析/构造模式切换 */
export const MODE_OPTIONS = [
  { value: 'parse', label: '解析报文' },
  { value: 'build', label: '构造报文' },
];

/** 8 种 DHCP 消息类型（option 53，值 1–8） */
export const DHCP_MESSAGE_TYPE_OPTIONS = [
  { value: 1, label: 'DISCOVER (1)' },
  { value: 2, label: 'OFFER (2)' },
  { value: 3, label: 'REQUEST (3)' },
  { value: 4, label: 'DECLINE (4)' },
  { value: 5, label: 'ACK (5)' },
  { value: 6, label: 'NAK (6)' },
  { value: 7, label: 'RELEASE (7)' },
  { value: 8, label: 'INFORM (8)' },
];

/** 构造器可添加的常用 option（53 由消息类型自动写入，不在此列） */
export const BUILDABLE_OPTION_OPTIONS = [
  { value: 50, label: '50 Requested IP Address（IPv4）' },
  { value: 51, label: '51 IP Address Lease Time（秒）' },
  { value: 55, label: '55 Parameter Request List（逗号分隔字节）' },
  { value: 61, label: '61 Client Identifier（hex）' },
  { value: 12, label: '12 Host Name（文本）' },
  { value: 1, label: '1 Subnet Mask（IPv4）' },
  { value: 3, label: '3 Router（IPv4，逗号分隔）' },
  { value: 6, label: '6 DNS（IPv4，逗号分隔）' },
  { value: 15, label: '15 Domain Name（文本）' },
  { value: 82, label: '82 Relay Agent Information（hex）' },
];

/** 各 option 的输入提示 */
export const OPTION_VALUE_PLACEHOLDERS: Record<number, string> = {
  1: '例如 255.255.255.0',
  3: '例如 192.168.1.1',
  6: '例如 8.8.8.8, 1.1.1.1',
  12: '例如 client-01',
  15: '例如 example.com',
  50: '例如 192.168.1.100',
  51: '例如 86400（秒）',
  55: '例如 1, 3, 6, 12',
  61: '例如 01001122334455（hex）',
  82: 'hex 字节，例如 0106010203040506',
};

/**
 * 内置 DHCP DISCOVER 样例（256 字节）：
 * op=1 BOOTREQUEST、htype=1、hlen=6、xid=0x12345678、
 * chaddr=00:11:22:33:44:55，options 含 53=DISCOVER、51=86400、55=[1,3,6]，
 * 含 1 字节 padding 与 0xFF end。
 */
export const SAMPLE_DISCOVER_HEX =
  '0101060012345678000000000000000000000000000000000000000000112233' +
  '4455000000000000000000000000000000000000000000000000000000000000' +
  '0000000000000000000000000000000000000000000000000000000000000000' +
  '0000000000000000000000000000000000000000000000000000000000000000' +
  '0000000000000000000000000000000000000000000000000000000000000000' +
  '0000000000000000000000000000000000000000000000000000000000000000' +
  '0000000000000000000000000000000000000000000000000000000000000000' +
  '00000000000000000000000063825363350101330400015180370301030600FF';

export const HEX_PLACEHOLDER =
  '粘贴 DHCPv4 报文十六进制（自动忽略空格/换行/0x 前缀，至少 240 字节）';

/** 构造器默认值 */
export const DEFAULT_BUILD_CONFIG = {
  xid: '0x12345678',
  chaddr: '00:11:22:33:44:55',
  messageType: 1,
};
