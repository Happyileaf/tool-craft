import { describe, expect, it } from 'vitest';
import {
  buildPlaylist,
  formatDuration,
  formatTotalDuration,
  parsePlaylist,
  splitLines,
  type M3uEntry,
} from './m3u';

/** RFC 8216 §4.3.3 简单媒体播放列表示例（微调为合法分片名） */
const RFC_SIMPLE_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:8
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:7.975,
http://media.example.com/frag0.ts
#EXTINF:7.941,
http://media.example.com/frag1.ts
#EXTINF:7.975,
http://media.example.com/frag2.ts
#EXT-X-ENDLIST`;

const SAMPLE_ENTRIES: M3uEntry[] = [
  { uri: 'track01.mp3', duration: 215.5, title: '开场曲' },
  { uri: 'track02.mp3', duration: 182, title: '主题曲' },
  { uri: 'track03.mp3', duration: 9.001, title: '尾声' },
];

describe('buildPlaylist - 普通 M3U', () => {
  it('首行为 #EXTM3U，每条目严格为 EXTINF 行 + URI 行且顺序一致', () => {
    const output = buildPlaylist({ mode: 'basic', entries: SAMPLE_ENTRIES });
    const lines = output.split('\n');
    expect(lines[0]).toBe('#EXTM3U');
    expect(lines).toHaveLength(7);
    expect(lines[1]).toBe('#EXTINF:215.5,开场曲');
    expect(lines[2]).toBe('track01.mp3');
    expect(lines[3]).toBe('#EXTINF:182,主题曲');
    expect(lines[4]).toBe('track02.mp3');
    expect(lines[5]).toBe('#EXTINF:9.001,尾声');
    expect(lines[6]).toBe('track03.mp3');
  });

  it('支持 CRLF 行尾与无时长条目', () => {
    const output = buildPlaylist({
      mode: 'basic',
      entries: [{ uri: 'a.mp3', duration: null, title: '' }],
      lineEnding: 'CRLF',
    });
    expect(output.split('\r\n')).toEqual(['#EXTM3U', 'a.mp3']);
  });

  it('空 URI、负时长抛错', () => {
    expect(() => buildPlaylist({ mode: 'basic', entries: [{ uri: '  ', duration: 1, title: '' }] })).toThrow(
      'URI 不能为空',
    );
    expect(() => buildPlaylist({ mode: 'basic', entries: [{ uri: 'a', duration: -1, title: '' }] })).toThrow(
      '不能为负数',
    );
  });
});

describe('buildPlaylist - HLS', () => {
  it('输出 VERSION/TARGETDURATION/ENDLIST，TARGETDURATION 为向上取整最大值', () => {
    const output = buildPlaylist({ mode: 'hls', entries: SAMPLE_ENTRIES });
    expect(output).toContain('#EXT-X-VERSION:3');
    // max(215.5, 182, 9.001) 向上取整 = 216
    expect(output).toContain('#EXT-X-TARGETDURATION:216');
    expect(output.endsWith('#EXT-X-ENDLIST')).toBe(true);
    expect(output.startsWith('#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:216\n')).toBe(true);
  });

  it('mediaSequence 与 playlistType 按输入输出，endList:false 时不追加 ENDLIST', () => {
    const output = buildPlaylist({
      mode: 'hls',
      entries: SAMPLE_ENTRIES,
      hls: { mediaSequence: 10, playlistType: 'EVENT', endList: false, version: 6 },
    });
    expect(output).toContain('#EXT-X-VERSION:6');
    expect(output).toContain('#EXT-X-MEDIA-SEQUENCE:10');
    expect(output).toContain('#EXT-X-PLAYLIST-TYPE:EVENT');
    expect(output).not.toContain('#EXT-X-ENDLIST');
  });

  it('HLS 分片缺时长或列表为空时抛错', () => {
    expect(() =>
      buildPlaylist({ mode: 'hls', entries: [{ uri: 'a.ts', duration: null, title: '' }] }),
    ).toThrow('缺少合法时长');
    expect(() => buildPlaylist({ mode: 'hls', entries: [] })).toThrow('至少需要一个分片');
  });
});

describe('parsePlaylist', () => {
  it('解析 RFC 8216 简单媒体播放列表，还原全部分片与总时长', () => {
    const result = parsePlaylist(RFC_SIMPLE_PLAYLIST);
    expect(result.hasHeader).toBe(true);
    expect(result.isHls).toBe(true);
    expect(result.hls.version).toBe(3);
    expect(result.hls.targetDuration).toBe(8);
    expect(result.hls.mediaSequence).toBe(0);
    expect(result.hls.endList).toBe(true);
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]?.uri).toBe('http://media.example.com/frag0.ts');
    expect(result.entries[0]?.duration).toBe(7.975);
    expect(result.entries[2]?.uri).toBe('http://media.example.com/frag2.ts');
    expect(result.totalDuration).toBeCloseTo(23.891, 3);
    expect(result.errors).toHaveLength(0);
  });

  it('生成→解析往返数据一致', () => {
    const output = buildPlaylist({
      mode: 'hls',
      entries: SAMPLE_ENTRIES,
      hls: { mediaSequence: 10, playlistType: 'VOD' },
      lineEnding: 'CRLF',
    });
    const result = parsePlaylist(output);
    expect(result.entries.map((entry) => entry.uri)).toEqual(SAMPLE_ENTRIES.map((e) => e.uri));
    expect(result.entries.map((entry) => entry.title)).toEqual(SAMPLE_ENTRIES.map((e) => e.title));
    expect(result.entries.map((entry) => entry.duration)).toEqual([215.5, 182, 9.001]);
    expect(result.hls.mediaSequence).toBe(10);
    expect(result.hls.playlistType).toBe('VOD');
    expect(result.hls.targetDuration).toBe(216);
  });

  it('缺 #EXTM3U 头给警告但仍尽力解析', () => {
    const result = parsePlaylist('#EXTINF:10,a\n a.mp3');
    expect(result.hasHeader).toBe(false);
    expect(result.warnings.some((w) => w.includes('#EXTM3U'))).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.uri).toBe('a.mp3');
  });

  it('EXTINF 后无 URI 收集为错误且不丢行', () => {
    const result = parsePlaylist('#EXTM3U\n#EXTINF:10,孤儿标签\n#EXTINF:5,b\nb.mp3');
    expect(result.entries).toHaveLength(2);
    expect(result.errors.some((e) => e.includes('缺少配对的资源 URI'))).toBe(true);
    expect(result.entries[1]?.uri).toBe('b.mp3');
  });

  it('时长非数字、非法 HLS 标签均进入错误列表，不抛异常', () => {
    const text = [
      '#EXTM3U',
      '#EXT-X-VERSION:abc',
      '#EXT-X-TARGETDURATION:8',
      '#EXT-X-PLAYLIST-TYPE:BAD',
      '#EXTINF:nope,x',
      'x.ts',
      '#EXT-X-ENDLIST',
    ].join('\n');
    const result = parsePlaylist(text);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.entries[0]?.duration).toBeNull();
    expect(result.hls.targetDuration).toBe(8);
    expect(result.hls.endList).toBe(true);
  });

  it('空文本不报错；BOM 与 CR 行尾可正常拆行', () => {
    expect(parsePlaylist('').entries).toHaveLength(0);
    const withBom = '﻿#EXTM3U\r#EXTINF:3,t\r\na.mp3\r';
    expect(splitLines(withBom)[0]).toBe('#EXTM3U');
    const result = parsePlaylist(withBom);
    expect(result.entries[0]?.uri).toBe('a.mp3');
    expect(result.entries[0]?.duration).toBe(3);
  });

  it('未知注释行与裸 URI 行被宽容处理', () => {
    const result = parsePlaylist('#EXTM3U\n# 这是注释\n裸轨.mp3\n#EXT-X-KEY:METHOD=NONE');
    expect(result.entries.map((e) => e.uri)).toEqual(['裸轨.mp3']);
    expect(result.errors).toHaveLength(0);
  });
});

describe('辅助函数', () => {
  it('formatDuration 去尾零并拒绝非法值', () => {
    expect(formatDuration(10)).toBe('10');
    expect(formatDuration(7.975)).toBe('7.975');
    expect(() => formatDuration(Number.NaN)).toThrow('有限数值');
  });

  it('formatTotalDuration 按小时段展示', () => {
    expect(formatTotalDuration(65)).toBe('01:05');
    expect(formatTotalDuration(3725)).toBe('1:02:05');
  });
});
