/**
 * CIDR / IP 子网计算器 工具内常量
 */

import type { Ipv4SubnetResult, Ipv6SubnetResult } from './utils/subnet';

/** 地址族识别模式 */
export type InputMode = 'auto' | 'ipv4' | 'ipv6';

/** 识别模式选项，供「识别模式」单选按钮渲染 */
export const INPUT_MODE_OPTIONS: { label: string; value: InputMode }[] = [
  { label: '自动识别', value: 'auto' },
  { label: 'IPv4', value: 'ipv4' },
  { label: 'IPv6', value: 'ipv6' },
];

/** 工具首次载入时填入的默认地址（CIDR 形式） */
export const DEFAULT_ADDRESS = '192.168.1.10/24';

/** 常用示例，供工具顶部示例按钮渲染 */
export const SUBNET_SAMPLES: { label: string; value: string }[] = [
  { label: '10.0.0.1/8', value: '10.0.0.1/8' },
  { label: '192.168.1.10/24', value: '192.168.1.10/24' },
  { label: '172.16.0.0/12', value: '172.16.0.0/12' },
  { label: '2001:db8::1/64', value: '2001:db8::1/64' },
];

/** IPv4 结果字段的中文标签与取值键顺序 */
export const IPV4_FIELD_LABELS: { key: keyof Ipv4SubnetResult; label: string }[] = [
  { key: 'address', label: 'IP 地址' },
  { key: 'prefixLength', label: 'CIDR 前缀' },
  { key: 'netmask', label: '子网掩码' },
  { key: 'wildcardMask', label: '通配符掩码' },
  { key: 'networkAddress', label: '网络地址' },
  { key: 'broadcastAddress', label: '广播地址' },
  { key: 'firstHost', label: '首个可用主机' },
  { key: 'lastHost', label: '最后可用主机' },
  { key: 'usableHosts', label: '可用主机数' },
  { key: 'totalAddresses', label: '地址总数' },
  { key: 'isPrivate', label: '是否私有网段' },
  { key: 'ipClass', label: '地址类别' },
];

/** IPv6 结果字段的中文标签与取值键顺序 */
export const IPV6_FIELD_LABELS: { key: keyof Ipv6SubnetResult; label: string }[] = [
  { key: 'address', label: 'IPv6 地址' },
  { key: 'prefixLength', label: 'CIDR 前缀' },
  { key: 'networkAddress', label: '网络地址' },
  { key: 'firstAddress', label: '首个地址' },
  { key: 'lastAddress', label: '最后地址' },
  { key: 'totalAddresses', label: '地址总数' },
];
