/**
 * Bencode 编解码工具内常量
 */
import { encodeBencode } from './utils/bencode';
import { bytesToLatin1 } from './utils/bytes-text';

/** 转换方向 */
export enum CodecModeEnum {
  /** Bencode 解码为 JSON */
  DECODE = 'decode',
  /** JSON 编码为 Bencode */
  ENCODE = 'encode',
}

/** 转换方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '解码（Bencode → JSON）', value: CodecModeEnum.DECODE },
  { label: '编码（JSON → Bencode）', value: CodecModeEnum.ENCODE },
];

/** 示例数据（单文件 .torrent 风格片段） */
const SAMPLE_VALUE = {
  announce: 'udp://tracker.example:1337/announce',
  'creation date': 1327049827,
  info: {
    length: 2048,
    name: 'example.iso',
    'piece length': 16384,
  },
};

/** 解码方向的默认示例 Bencode 文本（由示例数据编码生成，保证向量合法） */
export const DEFAULT_BENCODE = bytesToLatin1(encodeBencode(SAMPLE_VALUE));

/** 编码方向的默认示例 JSON 文本（缩进格式化） */
export const DEFAULT_JSON = JSON.stringify(SAMPLE_VALUE, null, 2);
