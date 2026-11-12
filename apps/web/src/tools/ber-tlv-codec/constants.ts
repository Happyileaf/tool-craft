/** BER-TLV 工具的常量与示例 */

export const DEFAULT_PARSE_INPUT = '6F 0B A0 05 5A 03 01 02 03 5F 2A 01 AA';

export const DEFAULT_BUILD_INPUT = `[
  {
    "tag": "6F",
    "children": [
      { "tag": "A0", "children": [{ "tag": "5A", "value": "01 02 03" }] },
      { "tag": "5F2A", "value": "AA" }
    ]
  }
]`;

export const TLV_PLACEHOLDER = '粘贴 BER-TLV 十六进制，支持嵌套与不定长（00 00 结束）';

export type TlvMode = 'parse' | 'build';

export const MODE_OPTIONS: Array<{ value: TlvMode; label: string }> = [
  { value: 'parse', label: '十六进制 → 解析树' },
  { value: 'build', label: '结构化 JSON → 十六进制' },
];

export const TAG_PRESETS: Array<{ label: string; hex: string }> = [
  {
    label: 'EMV FCI 模板',
    hex: '6F 1A 84 07 A0 00 00 00 03 10 10 A5 0F 50 0A 56 49 53 41 20 44 45 42 49 54 5F 2D 02 01 22',
  },
  { label: '多字节 Tag（9F38）', hex: '9F 38 03 01 02 03' },
  { label: '不定长构造 TLV', hex: '30 80 02 01 01 00 00' },
];
