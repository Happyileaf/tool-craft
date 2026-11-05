export interface ModeOption {
  value: 'encode' | 'verify';
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'encode', label: '计算校验和', hint: '把全小写 / 全大写地址转换为 EIP-55 混合大小写形式' },
  { value: 'verify', label: '校验地址', hint: '检查地址字母大小写是否符合 EIP-55 校验和' },
];

export const DEFAULT_INPUT = [
  '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed',
  '0xFB6916095CA1DF60BB79CE92CE3EA74C37C5D359',
  '0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb',
].join('\n');
