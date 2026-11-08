export type CodecMode = 'encode' | 'decode';
export type BinaryFormat = 'hex' | 'base64';

export interface ModeOption {
  value: CodecMode;
  label: string;
  hint: string;
}

export interface FormatOption {
  value: BinaryFormat;
  label: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'encode', label: 'JSON → MessagePack', hint: 'JSON 文本编码为二进制负载' },
  { value: 'decode', label: 'MessagePack → JSON', hint: 'HEX / Base64 负载解码为 JSON' },
];

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'base64', label: 'Base64' },
];

/** 编码方向默认 JSON 示例（官方规范向量的超集）。 */
export const DEFAULT_JSON = `{
  "compact": true,
  "schema": 0,
  "list": [1, -5, 3.14],
  "name": "你好 msgpack"
}`;

/** 解码方向默认 HEX：官方示例 {"compact":true,"schema":0}。 */
export const DEFAULT_HEX = '82 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00';

/** 解码方向默认 Base64（与 DEFAULT_HEX 同负载）。 */
export const DEFAULT_BASE64 = 'gqdjb21wYWN0w6ZzY2hlbWEA';
