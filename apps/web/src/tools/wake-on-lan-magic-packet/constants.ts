export const DEFAULT_MAC = 'AA:BB:CC:DD:EE:FF';

export const WOL_PORTS = [
  { value: 9, label: '端口 9（Discard，WoL 事实标准）' },
  { value: 7, label: '端口 7（Echo，部分设备使用）' },
];

export const MODE_OPTIONS = [
  { value: 'build', label: '构造魔术包' },
  { value: 'parse', label: '反向解析校验' },
];

export const INPUT_FORMAT_OPTIONS = [
  { value: 'hex', label: '十六进制 HEX' },
  { value: 'base64', label: 'Base64' },
];
