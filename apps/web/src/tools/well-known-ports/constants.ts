/**
 * 知名端口速查工具常量
 */
import type { PortProtocol, PortRangeKey } from './utils/ports';

/** 协议筛选项 */
export const PROTOCOL_OPTIONS: { label: string; value: PortProtocol | 'all' }[] = [
  { label: '全部协议', value: 'all' },
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
];

/** 区间标题 */
export const RANGE_TITLE: Record<PortRangeKey, string> = {
  'well-known': 'well-known 知名端口（0–1023）',
  registered: 'registered 已注册端口（1024–49151）',
  dynamic: 'dynamic 动态 / 私有端口（49152–65535）',
};

/** 区间标签颜色（antd Tag 内置色板） */
export const RANGE_TAG_COLOR: Record<PortRangeKey, string> = {
  'well-known': 'red',
  registered: 'orange',
  dynamic: 'default',
};

/** 协议标签颜色 */
export const PROTOCOL_TAG_COLOR: Record<PortProtocol, string> = {
  tcp: 'blue',
  udp: 'green',
};

/** 区间分组展示顺序 */
export const RANGE_ORDER: PortRangeKey[] = ['well-known', 'registered', 'dynamic'];

/** 数据来源说明 */
export const DATA_SOURCE_HINT =
  '数据基于 IANA Service Name and Port Number Registry 的长期稳定条目（5601/9200 为生态事实默认端口，已单独标注），截至 2026-10';

/** 搜索框占位提示 */
export const SEARCH_PLACEHOLDER =
  '输入端口号（443）、服务名（ssh、https）或关键词（数据库、DNS）；可粘贴 22 80 443 批量解析';
