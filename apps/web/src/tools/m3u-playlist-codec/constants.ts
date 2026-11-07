export const DEFAULT_M3U_INPUT = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:13
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:12.5,开场片段
https://cdn.example.com/live/seg0.ts
#EXTINF:13.0,正片片段
https://cdn.example.com/live/seg1.ts
#EXTINF:-1,直播持续流
https://cdn.example.com/live/seg2.ts
#EXT-X-ENDLIST`;

export const DEFAULT_BASE_URL = 'https://cdn.example.com/live/index.m3u8';
