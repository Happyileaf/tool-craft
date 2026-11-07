/**
 * M3U / M3U8 工具的默认样例与固定选项
 */

export enum M3uMode {
  /** 文本 → 结构化表格 */
  PARSE = 'parse',
  /** 结构化表格 → 文本 */
  GENERATE = 'generate',
}

export const M3U_MODE_OPTIONS: { label: string; value: M3uMode }[] = [
  { label: '解析 M3U/M3U8', value: M3uMode.PARSE },
  { label: '生成播放列表', value: M3uMode.GENERATE },
];

export const DEFAULT_PARSE_INPUT = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:8
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:7.975,片头
https://example.com/hls/segment-0.ts
#EXTINF:8,正片
https://example.com/hls/segment-1.ts
#EXTINF:8,正片
https://example.com/hls/segment-2.ts
#EXT-X-ENDLIST`;

export const DEFAULT_GENERATE_INPUT = `#EXTINF:213,Artist - Opening Track
music/track-01.flac
#EXTINF:198,Artist - Second Track
music/track-02.flac`;
