/**
 * IP 范围 → CIDR 聚合 / CIDR 超网合并工具 常量
 */

/** 工作模式 */
export type AggregateMode = 'range-to-cidr' | 'cidr-merge';

/** 模式切换选项 */
export const MODE_OPTIONS: { label: string; value: AggregateMode }[] = [
  { label: '范围 → CIDR', value: 'range-to-cidr' },
  { label: 'CIDR 合并超网', value: 'cidr-merge' },
];

/** 范围 → CIDR 模式默认输入（每行一个起止范围） */
export const DEFAULT_RANGE_INPUT = '192.168.1.0 - 192.168.1.30';

/** CIDR 合并模式默认输入（每行一个 CIDR） */
export const DEFAULT_CIDR_INPUT = '192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24';

/** 范围模式示例按钮 */
export const RANGE_SAMPLES: { label: string; value: string }[] = [
  { label: 'IPv4 非对齐段', value: '192.168.1.0 - 192.168.1.30' },
  { label: '整段 /24', value: '10.0.0.0 - 10.0.0.255' },
  { label: '单 IP', value: '172.16.5.7 - 172.16.5.7' },
  { label: 'IPv6 段', value: '2001:db8:: - 2001:db8::ffff' },
];

/** 合并模式示例按钮 */
export const MERGE_SAMPLES: { label: string; value: string }[] = [
  { label: '四个 /24 → /22', value: DEFAULT_CIDR_INPUT },
  { label: '含重叠输入', value: '10.0.0.0/24\n10.0.0.128/25\n10.0.1.0/24' },
  { label: 'IPv6 超网', value: '2001:db8::/65\n2001:db8:0:0:8000::/65' },
];
