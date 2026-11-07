import { describe, it, expect } from 'vitest';
import {
  parsePlaylist,
  generatePlaylist,
  formatDuration,
  formatClock,
  type DraftEntry,
} from './m3u';

const HLS_SAMPLE = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:8
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:7.975,
http://example.com/0.ts
#EXTINF:8,
http://example.com/1.ts
#EXT-X-ENDLIST`;

describe('parsePlaylist', () => {
  it('解析 RFC 8216 风格 HLS 媒体播放列表', () => {
    const result = parsePlaylist(HLS_SAMPLE);
    expect(result.hasExtm3u).toBe(true);
    expect(result.isHls).toBe(true);
    expect(result.hls.version).toBe(3);
    expect(result.hls.targetDuration).toBe(8);
    expect(result.hls.mediaSequence).toBe(0);
    expect(result.hls.playlistType).toBe('VOD');
    expect(result.hls.endlist).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.duration).toBeCloseTo(7.975, 10);
    expect(result.entries[0]!.uri).toBe('http://example.com/0.ts');
    expect(result.entries[1]!.duration).toBe(8);
    expect(result.totalDuration).toBeCloseTo(15.975, 10);
    expect(result.errors).toEqual([]);
  });

  it('解析普通播放列表的标题与时长', () => {
    const text = `#EXTM3U
#EXTINF:213,Artist - Song
music/track01.flac
#EXTINF:198,Another
music/track02.flac`;
    const result = parsePlaylist(text);
    expect(result.isHls).toBe(false);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.title).toBe('Artist - Song');
    expect(result.entries[0]!.duration).toBe(213);
    expect(result.totalDuration).toBe(411);
  });

  it('容忍 CRLF 与无 EXTINF 的裸 URI', () => {
    const result = parsePlaylist('#EXTM3U\r\na.mp4\r\nb.mp4\r\n');
    expect(result.entries.map((entry) => entry.uri)).toEqual(['a.mp4', 'b.mp4']);
    expect(result.entries[0]!.duration).toBeNull();
    expect(result.errors).toEqual([]);
  });

  it('EXTINF 缺少配对 URI 时带行号报错', () => {
    const result = parsePlaylist('#EXTM3U\n#EXTINF:10,Orphan');
    expect(result.entries).toHaveLength(0);
    expect(result.errors.some((error) => error.includes('第 2 行'))).toBe(true);
  });

  it('缺少 #EXTM3U 文件头时宽松解析并告警', () => {
    const result = parsePlaylist('a.mp4\nb.mp4');
    expect(result.entries).toHaveLength(2);
    expect(result.hasExtm3u).toBe(false);
    expect(result.errors.some((error) => error.includes('#EXTM3U'))).toBe(true);
  });

  it('非法时长与非法 HLS 取值逐条报错', () => {
    const text = `#EXTM3U
#EXT-X-TARGETDURATION:8
#EXTINF:nope,bad
a.ts
#EXTINF:12,too-long
b.ts
#EXT-X-PLAYLIST-TYPE:BAD
#EXT-X-VERSION:x`;
    const result = parsePlaylist(text);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.duration).toBeNull();
    expect(result.errors.some((error) => error.includes('时长非法'))).toBe(true);
    expect(result.errors.some((error) => error.includes('TARGETDURATION'))).toBe(true);
    expect(result.errors.some((error) => error.includes('PLAYLIST-TYPE'))).toBe(true);
    expect(result.errors.some((error) => error.includes('VERSION'))).toBe(true);
  });

  it('收集未知标签但不中断解析', () => {
    const result = parsePlaylist('#EXTM3U\n#EXTGRP:Rock\n#EXTINF:5,x\na.mp3');
    expect(result.unknownTags).toHaveLength(1);
    expect(result.unknownTags[0]!.line).toBe(2);
    expect(result.entries).toHaveLength(1);
  });
});

describe('generatePlaylist', () => {
  const entries: DraftEntry[] = [
    { duration: 7.975, title: '', uri: 'http://example.com/0.ts' },
    { duration: 8, title: 'second', uri: 'http://example.com/1.ts' },
  ];

  it('生成 HLS 媒体播放列表并可往返解析', () => {
    const text = generatePlaylist(entries, {
      version: 3,
      targetDuration: 8,
      mediaSequence: 0,
      playlistType: 'VOD',
      endlist: true,
    });
    expect(text.startsWith('#EXTM3U\n#EXT-X-VERSION:3')).toBe(true);
    expect(text).toContain('#EXT-X-TARGETDURATION:8');
    expect(text).toContain('#EXT-X-PLAYLIST-TYPE:VOD');
    expect(text.endsWith('#EXT-X-ENDLIST')).toBe(true);
    const reparsed = parsePlaylist(text);
    expect(reparsed.entries).toHaveLength(2);
    expect(reparsed.totalDuration).toBeCloseTo(15.975, 10);
    expect(reparsed.hls.endlist).toBe(true);
  });

  it('生成普通播放列表且无时长条目只输出 URI', () => {
    const text = generatePlaylist([{ duration: null, title: '', uri: 'a.mp4' }]);
    expect(text).toBe('#EXTM3U\na.mp4');
  });
});

describe('formatDuration / formatClock', () => {
  it('时长去除尾随零', () => {
    expect(formatDuration(8)).toBe('8');
    expect(formatDuration(7.975)).toBe('7.975');
    expect(formatDuration(7.1)).toBe('7.1');
  });

  it('秒数转时钟格式', () => {
    expect(formatClock(61)).toBe('01:01');
    expect(formatClock(3725)).toBe('01:02:05');
  });
});
