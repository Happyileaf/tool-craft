import type { MacFormat } from './utils/mac';

export const DEFAULT_INPUT = 'AA:BB:CC:DD:EE:FF';

export const FORMAT_OPTIONS: { label: string; value: MacFormat; example: string }[] = [
  { label: '冒号分隔', value: 'colon', example: 'AA:BB:CC:DD:EE:FF' },
  { label: '连字符分隔', value: 'hyphen', example: 'AA-BB-CC-DD-EE-FF' },
  { label: 'Cisco 点分', value: 'cisco', example: 'aabb.ccdd.eeff' },
  { label: '裸十六进制', value: 'bare', example: 'AABBCCDDEEFF' },
];

export const FORMAT_LABELS: Record<MacFormat, string> = {
  colon: '冒号分隔（AA:BB:CC:DD:EE:FF）',
  hyphen: '连字符分隔（AA-BB-CC-DD-EE-FF）',
  cisco: 'Cisco 点分（aabb.ccdd.eeff）',
  bare: '裸十六进制（AABBCCDDEEFF）',
};

export const FORMAT_PLACEHOLDER = '支持 AA:BB:CC:DD:EE:FF / AA-BB-... / aabb.ccdd.eeff / AABBCCDDEEFF，MAC-48 或 EUI-64';
