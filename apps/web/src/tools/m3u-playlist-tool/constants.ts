import type { M3uEntry } from './utils/m3u';

/** 生成模式示例条目 */
export const SAMPLE_ENTRIES: M3uEntry[] = [
  { uri: 'https://media.example.com/seg-0.ts', duration: 8.12, title: '分片 0' },
  { uri: 'https://media.example.com/seg-1.ts', duration: 7.96, title: '分片 1' },
  { uri: 'https://media.example.com/seg-2.ts', duration: 8.0, title: '分片 2' },
];

/** 解析模式示例（RFC 8216 风格简单媒体播放列表） */
export const SAMPLE_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:9
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:8.12,分片 0
https://media.example.com/seg-0.ts
#EXTINF:7.96,分片 1
https://media.example.com/seg-1.ts
#EXTINF:8.0,分片 2
https://media.example.com/seg-2.ts
#EXT-X-ENDLIST`;

/** 播放列表形态选项 */
export const MODE_OPTIONS = [
  { value: 'basic', label: '普通 M3U（#EXTINF + URI）' },
  { value: 'hls', label: 'HLS 媒体播放列表（M3U8）' },
] as const;

/** PLAYLIST-TYPE 选项 */
export const PLAYLIST_TYPE_OPTIONS = [
  { value: '', label: '不输出' },
  { value: 'VOD', label: 'VOD' },
  { value: 'EVENT', label: 'EVENT' },
] as const;
