/** 802.1Q VLAN 标签编解码器的常量、PCP 优先级名称表与示例 */

export const MODE_OPTIONS = [
  { value: 'build', label: '构造标签' },
  { value: 'parse', label: '解析标签 / 帧' },
];

export const LAYER_OPTIONS = [
  { value: 'single', label: '单层 802.1Q（4 字节）' },
  { value: 'qinq', label: 'QinQ 双层（8 字节）' },
];

export const PARSE_MODE_OPTIONS = [
  { value: 'tag', label: '仅标签 hex（4 / 8 字节）' },
  { value: 'frame', label: '完整以太网帧 hex' },
];

export const TPID_OPTIONS = [
  { value: 0x8100, label: '0x8100 C-TAG（客户标签）' },
  { value: 0x88a8, label: '0x88A8 S-TAG（QinQ 服务标签）' },
  { value: 0x9100, label: '0x9100 旧版 Q-in-Q' },
];

/** IEEE 802.1p PCP（3 bit）服务等级名称表 */
export const PCP_PRIORITY_NAMES: readonly { value: number; name: string; acronym: string }[] = [
  { value: 0, name: '尽力服务（默认）', acronym: 'Best Effort' },
  { value: 1, name: '后台（批量数据）', acronym: 'Background' },
  { value: 2, name: '优秀尽力服务', acronym: 'Excellent Effort' },
  { value: 3, name: '关键应用（负载保障）', acronym: 'Critical Applications' },
  { value: 4, name: '视频（小于 100ms 时延）', acronym: 'Video' },
  { value: 5, name: '语音（小于 10ms 时延）', acronym: 'Voice' },
  { value: 6, name: '网络互联控制', acronym: 'Internetwork Control' },
  { value: 7, name: '网络控制（最高优先级）', acronym: 'Network Control' },
];

export const DEI_OPTIONS = [
  { value: 0, label: '0（可丢弃，默认）' },
  { value: 1, label: '1（拥塞时优先丢弃）' },
];

/** 单层构造默认示例：PCP=5、DEI=1、VID=100 → TCI 0xA864 */
export const DEFAULT_SINGLE_FIELDS = { pcp: 5, dei: 1, vid: 100 };

/** QinQ 默认示例：外层 VID 20、内层 PCP=3/DEI=1/VID 300 */
export const DEFAULT_OUTER_FIELDS = { pcp: 0, dei: 0, vid: 20 };
export const DEFAULT_INNER_FIELDS = { pcp: 3, dei: 1, vid: 300 };

/** 解析示例：4 字节标签 81 00 B0 64（PCP=5、DEI=1、VID=100，TCI=0xB064） */
export const SAMPLE_TAG_HEX = '81 00 B0 64';

/** 解析示例：含单标签的以太网帧（目的/源 MAC 各 6 字节 + 81 00 B0 64 + EtherType 0x0800 + 载荷） */
export const SAMPLE_FRAME_HEX =
  '02 00 00 00 00 01 02 00 00 00 00 02 81 00 B0 64 08 00 45 00 00 1E 00 00 00 00 40 06 00 00 C0 A8 01 0A C0 A8 01 01';

/** 解析示例：QinQ 8 字节（外层 88 A8 00 14 + 内层 81 00 71 2C） */
export const SAMPLE_QINQ_HEX = '88 A8 00 14 81 00 71 2C';
