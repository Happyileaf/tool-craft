/** 曼彻斯特/差分曼彻斯特线路编解码工具的常量与示例 */

/** 默认载入的样例比特串 */
export const DEFAULT_BITS = '10110010';

/** 默认比特率（bit/s），10 Mbps 与经典 10BASE-T 以太网一致 */
export const DEFAULT_BITRATE = 10_000_000;

/** 波形渲染的最大位数，超出仅绘制前若干位 */
export const WAVEFORM_MAX_BITS = 64;

/** 超长输入提示阈值（位），函数仍完整计算，仅限制波形渲染 */
export const LONG_INPUT_THRESHOLD = 4096;

export const BITS_PLACEHOLDER =
  '粘贴比特串（仅含 0/1，可含空格或 0b 前缀，例如 0b1011 0010）';

export const LEVELS_PLACEHOLDER =
  '粘贴双相电平序列（H/L，可用空格分隔；也接受 0/1 双相采样，0→L、1→H）';

export type CodecMode = 'encode' | 'decode';

export type ManchesterConvention = 'ieee' | 'thomas';

export type LineScheme = 'ieee' | 'thomas' | 'differential';

export const MODE_OPTIONS: Array<{ label: string; value: CodecMode }> = [
  { label: '编码', value: 'encode' },
  { label: '解码', value: 'decode' },
];

export const SCHEME_OPTIONS: Array<{ label: string; value: LineScheme }> = [
  { label: 'IEEE 802.3 曼彻斯特', value: 'ieee' },
  { label: 'Thomas 曼彻斯特', value: 'thomas' },
  { label: '差分曼彻斯特', value: 'differential' },
];

export const INITIAL_LEVEL_OPTIONS: Array<{ label: string; value: 'H' | 'L' }> = [
  { label: '高电平 H', value: 'H' },
  { label: '低电平 L', value: 'L' },
];
