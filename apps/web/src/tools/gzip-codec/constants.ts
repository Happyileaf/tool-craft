/**
 * GZip / Deflate 工具常量
 */
import type { GzipAlgorithm } from './utils/gzip';

export type GzipMode = 'compress' | 'decompress';
export type PayloadFormat = 'hex' | 'base64';

export const DEFAULT_INPUT = 'Hello, GZip! 重复的文本会获得更好的压缩率。'.repeat(3);

export const MODE_OPTIONS = [
  { label: '压缩', value: 'compress' },
  { label: '解压', value: 'decompress' },
] as const;

export const ALGORITHM_OPTIONS: { label: string; value: GzipAlgorithm }[] = [
  { label: 'gzip', value: 'gzip' },
  { label: 'deflate (raw)', value: 'deflate' },
];

export const FORMAT_OPTIONS: { label: string; value: PayloadFormat }[] = [
  { label: 'Hex（1f8b…）', value: 'hex' },
  { label: 'Base64', value: 'base64' },
];
