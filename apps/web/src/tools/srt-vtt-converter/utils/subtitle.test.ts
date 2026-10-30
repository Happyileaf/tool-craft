import { describe, it, expect } from 'vitest';
import { convertSubtitle } from './subtitle';

describe('srt2vtt', () => {
  it('输出以 WEBVTT 开头、逗号变点号、多行正文保留、cueCount 正确', () => {
    const srt = `1
00:00:01,500 --> 00:00:04,000
第一行字幕
第二行字幕

2
00:00:05,000 --> 00:00:08,500
Hi there`;

    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.cueCount).toBe(2);
    expect(result.output).toBe(
      `WEBVTT

1
00:00:01.500 --> 00:00:04.000
第一行字幕
第二行字幕

2
00:00:05.000 --> 00:00:08.500
Hi there`,
    );
  });

  it('允许省略 SRT 序号行，多行正文原样保留', () => {
    const srt = `00:00:00,250 --> 00:00:02,750
只有一条
没有序号`;
    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(true);
    expect(result.cueCount).toBe(1);
    expect(result.output).toBe(
      `WEBVTT

00:00:00.250 --> 00:00:02.750
只有一条
没有序号`,
    );
  });
});

describe('vtt2srt', () => {
  it('剥离 WEBVTT/NOTE/REGION/STYLE 头与 positioning，重新编号 1/2/3，点号变逗号', () => {
    const vtt = `WEBVTT 示例字幕

NOTE 这是一段注释
横跨两行

REGION
id:top
width:50%

STYLE
::cue { color: lime; }

cue-a
00:00:01.500 --> 00:00:04.000 align:start position:0%
第一条

2
00:05:00.000 --> 00:05:03.250 line:0
第二条
补充一行

cue-c
00:10:10.100 --> 00:10:12.000
第三条`;

    const result = convertSubtitle(vtt, 'vtt2srt');
    expect(result.valid).toBe(true);
    expect(result.cueCount).toBe(3);
    expect(result.output).toBe(
      `1
00:00:01,500 --> 00:00:04,000
第一条

2
00:05:00,000 --> 00:05:03,250
第二条
补充一行

3
00:10:10,100 --> 00:10:12,000
第三条`,
    );
    expect(result.output).not.toMatch(/WEBVTT/);
    expect(result.output).not.toMatch(/NOTE|REGION|STYLE|注释/);
    expect(result.output).not.toMatch(/align|position|line:/);
  });

  it('MM:SS.mmm（无小时）时间戳补 00: 前缀', () => {
    const vtt = `WEBVTT

01:02.500 --> 01:05.000
短时间戳`;
    const result = convertSubtitle(vtt, 'vtt2srt');
    expect(result.valid).toBe(true);
    expect(result.output).toContain('00:01:02,500 --> 00:01:05,000');
  });

  it('首行不是 WEBVTT 时直接报错', () => {
    const result = convertSubtitle('1\n00:00:01.000 --> 00:00:02.000\n正文', 'vtt2srt');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/WEBVTT/);
  });
});

describe('shiftMs 时间偏移', () => {
  it('正偏移：00:00:01,500 +500ms = 00:00:02,000', () => {
    const srt = '1\n00:00:01,500 --> 00:00:04,000\n正文';
    const result = convertSubtitle(srt, 'srt2vtt', { shiftMs: 500 });
    expect(result.valid).toBe(true);
    expect(result.output).toContain('00:00:02.000 --> 00:00:04.500');
  });

  it('负偏移（不越过零点）：00:00:01,500 -500ms = 00:00:01,000', () => {
    const srt = '1\n00:00:01,500 --> 00:00:04,000\n正文';
    const result = convertSubtitle(srt, 'srt2vtt', { shiftMs: -500 });
    expect(result.valid).toBe(true);
    expect(result.output).toContain('00:00:01.000 --> 00:00:03.500');
  });

  it('负偏移导致负时间戳时按 cue 序号报错', () => {
    const srt = `1
00:00:01,500 --> 00:00:04,000
第一条

2
00:00:00,200 --> 00:00:01,000
第二条`;
    const result = convertSubtitle(srt, 'srt2vtt', { shiftMs: -500 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/第 2 个/);
  });
});

describe('边界与错误处理', () => {
  it('带 UTF-8 BOM 的 SRT 输入正常处理', () => {
    const srt = '\uFEFF1\n00:00:01,000 --> 00:00:02,000\n带 BOM';
    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(true);
    expect(result.output.startsWith('WEBVTT')).toBe(true);
    expect(result.output).toContain('带 BOM');
  });

  it('带 UTF-8 BOM 的 VTT 输入也能识别 WEBVTT 头', () => {
    const vtt = '\uFEFFWEBVTT\n\n00:00:01.000 --> 00:00:02.000\n带 BOM';
    const result = convertSubtitle(vtt, 'vtt2srt');
    expect(result.valid).toBe(true);
    expect(result.output).toContain('00:00:01,000 --> 00:00:02,000');
  });

  it('空输入（含纯空白）返回不能为空错误', () => {
    expect(convertSubtitle('', 'srt2vtt').valid).toBe(false);
    expect(convertSubtitle('   \n\t\n', 'srt2vtt').error).toMatch(/不能为空/);
  });

  it('完全没有时间戳行的输入返回未找到字幕条目错误', () => {
    const result = convertSubtitle('hello\nworld\n\nfoo', 'srt2vtt');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/未找到/);
  });

  it('时间戳数字越界（秒 ≥ 60）返回可读错误并带行号', () => {
    const srt = '1\n00:00:61,000 --> 00:01:02,000\n正文';
    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/第 2 行/);
    expect(result.error).toMatch(/秒必须小于 60/);
  });

  it('时间戳格式非法时返回可读错误', () => {
    const srt = '1\n00:00:01,50 --> 00:00:02,000\n正文';
    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/格式非法/);
  });

  it('CRLF 换行与尾随空白被规范化', () => {
    const srt = '1\r\n00:00:01,000 --> 00:00:02,000\r\n正文   \r\n';
    const result = convertSubtitle(srt, 'srt2vtt');
    expect(result.valid).toBe(true);
    expect(result.output).not.toContain('\r');
    expect(result.output).not.toContain('正文 ');
    expect(result.output).toMatch(/\n正文$/);
  });
});

describe('往返一致性', () => {
  it('srt → vtt → srt 后正文与序号保持一致', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,500
Hello
World

2
00:00:04,000 --> 00:00:06,750
Second cue
第二行`;

    const vtt = convertSubtitle(srt, 'srt2vtt');
    expect(vtt.valid).toBe(true);
    const back = convertSubtitle(vtt.output, 'vtt2srt');
    expect(back.valid).toBe(true);
    expect(back.cueCount).toBe(2);
    expect(back.output).toBe(srt);
  });
});
