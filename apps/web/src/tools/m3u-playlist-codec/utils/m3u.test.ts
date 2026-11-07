import { describe, expect, it } from 'vitest';
import {
  normalizeText,
  parseAttributeList,
  parseM3u,
  relativeToAbsolute,
  stringifyM3u,
  validateM3u,
} from './m3u';

const SAMPLE = `#EXTM3U
#EXT-X-TARGETDURATION:13
#EXTINF:12.5,第一首歌
media/a.ts
#EXTINF:-1,直播流
live/b.ts
#EXT-X-ENDLIST`;

const VARIANT_SAMPLE = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION="720x480",CODECS="avc1,mp4a"
http://example.com/low/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION="1280x720"
http://example.com/high/index.m3u8`;

describe('parseM3u', () => {
  it('解析 EXTINF 条目，字段逐字段一致，-1 直播流不报错', () => {
    const result = parseM3u(SAMPLE);
    expect(result.headerPresent).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.duration).toBe(12.5);
    expect(result.entries[0]!.title).toBe('第一首歌');
    expect(result.entries[0]!.uri).toBe('media/a.ts');
    expect(result.entries[1]!.duration).toBe(-1);
    expect(result.entries[1]!.title).toBe('直播流');
    expect(result.standaloneDirectives).toContain('#EXT-X-TARGETDURATION:13');
    expect(result.standaloneDirectives).toContain('#EXT-X-ENDLIST');
    expect(result.issues).toHaveLength(0);
  });

  it('解析 STREAM-INF 属性，引号值去引号且引号内逗号不分割', () => {
    const result = parseM3u(VARIANT_SAMPLE);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]!.attrs.BANDWIDTH).toBe('1280000');
    expect(result.entries[0]!.attrs.RESOLUTION).toBe('720x480');
    expect(result.entries[0]!.attrs.CODECS).toBe('avc1,mp4a');
    expect(result.entries[1]!.attrs.BANDWIDTH).toBe('2560000');
  });

  it('缺 EXTM3U 头产生 warning；EXTINF 后无 URI 产生带行号 error', () => {
    const issues = validateM3u('#EXTINF:10,孤儿标签\n');
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('#EXTM3U'))).toBe(true);
    expect(issues.some((i) => i.level === 'error' && i.message.includes('URI'))).toBe(true);
  });

  it('非法时长产生带行号错误但不抛异常', () => {
    const result = parseM3u('#EXTM3U\n#EXTINF:abc,坏时长\nx.ts');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.duration).toBeNull();
    expect(result.issues.some((i) => i.line === 2)).toBe(true);
  });

  it('CRLF 与 UTF-8 BOM 输入可正常解析', () => {
    const crlf = '\uFEFF#EXTM3U\r\n#EXTINF:5,标题\r\na.ts\r\n';
    const result = parseM3u(crlf);
    expect(result.headerPresent).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.uri).toBe('a.ts');
    expect(normalizeText(crlf).startsWith('\uFEFF')).toBe(false);
  });
});

describe('parseAttributeList', () => {
  it('处理无引号与带引号属性', () => {
    const attrs = parseAttributeList('BANDWIDTH=1280000,RESOLUTION="720x480"');
    expect(attrs.BANDWIDTH).toBe('1280000');
    expect(attrs.RESOLUTION).toBe('720x480');
  });
});

describe('stringifyM3u 往返', () => {
  it('parse → stringify → parse 语义字段深度相等，输出 LF 且以 EXTM3U 开头', () => {
    const first = parseM3u(SAMPLE);
    const text = stringifyM3u(first);
    expect(text.startsWith('#EXTM3U\n')).toBe(true);
    expect(text.includes('\r')).toBe(false);
    const second = parseM3u(text);
    expect(second.entries.map((e) => [e.duration, e.title, e.uri])).toEqual(
      first.entries.map((e) => [e.duration, e.title, e.uri]),
    );
    expect(second.standaloneDirectives).toEqual(first.standaloneDirectives);
  });

  it('header=false 时不输出 EXTM3U', () => {
    const text = stringifyM3u(parseM3u(SAMPLE), { header: false });
    expect(text.startsWith('#EXTM3U')).toBe(false);
  });
});

describe('relativeToAbsolute', () => {
  it('相对 URI 按 base URL 解析，指令行与绝对 URI 不动', () => {
    const input = '#EXTM3U\n#EXTINF:5,t\nmedia/a.ts\nhttps://x.test/b.ts';
    const out = relativeToAbsolute('https://cdn.test/live/index.m3u8', input);
    expect(out).toContain('https://cdn.test/live/media/a.ts');
    expect(out).toContain('https://x.test/b.ts');
    expect(out).toContain('#EXTINF:5,t');
  });

  it('非法 base 时保留原行不抛异常', () => {
    const out = relativeToAbsolute('not a url', '#EXTM3U\na.ts');
    expect(out).toContain('a.ts');
  });
});
