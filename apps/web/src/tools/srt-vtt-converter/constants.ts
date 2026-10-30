import type { SubtitleMode } from './utils/subtitle';

export interface ModeOption {
  value: SubtitleMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'srt2vtt', label: 'SRT → WebVTT', hint: '补 WEBVTT 头、逗号改点号，序号与多行正文原样保留' },
  { value: 'vtt2srt', label: 'WebVTT → SRT', hint: '剥离 WEBVTT/NOTE/REGION/STYLE 与定位设置，序号重新编号' },
];

/** 默认样例：两条 cue，均含多行正文 */
export const DEFAULT_INPUT = `1
00:00:01,000 --> 00:00:04,000
第一行字幕
第二行字幕

2
00:00:05,500 --> 00:00:09,000
Subtitle line one
Subtitle line two`;
