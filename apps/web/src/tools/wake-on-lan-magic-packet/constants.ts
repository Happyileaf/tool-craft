/** 示例 MAC 地址（单播、文档示例用途） */
export const EXAMPLE_MACS: { name: string; mac: string }[] = [
  { name: '标准冒号格式', mac: 'AA:BB:CC:DD:EE:FF' },
  { name: '连字符格式', mac: '00-11-22-33-44-55' },
  { name: 'Cisco 点分格式', mac: '0011.2233.4455' },
];

/** 用于解析演示的合法魔术包示例 MAC */
export const PARSE_DEMO_MAC = 'DE:AD:BE:EF:00:01';
