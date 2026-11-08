/**
 * LRC 歌词时间戳生成与解析器的静态配置与示例。
 */

/** 生成模式的示例逐行歌词（mm:ss.cc 空格 文本） */
export const SAMPLE_PLAIN_LYRICS = [
  '00:00.50 作词：示例 / 作曲：示例',
  '00:03.00 第一句歌词',
  '00:08.25 第二句歌词',
  '00:15.00 副歌重复段落',
  '00:24.75 尾奏',
].join('\n');

/** 解析模式的示例 LRC 文本（含 ID 标签与行内多时间戳） */
export const SAMPLE_LRC = [
  '[ti:示例歌曲]',
  '[ar:示例歌手]',
  '[al:示例专辑]',
  '[by:lrc-parser]',
  '[offset:0]',
  '[00:00.50]作词：示例 / 作曲：示例',
  '[00:03.00]第一句歌词',
  '[00:08.25]第二句歌词',
  '[00:15.00][00:30.00]副歌重复段落',
  '[00:24.75]尾奏',
].join('\r\n');

/** 可编辑的 ID 标签键 */
export const TAG_KEYS = ['ti', 'ar', 'al', 'by'] as const;

/** 标签中文名 */
export const TAG_LABELS: Record<string, string> = {
  ti: '歌曲标题',
  ar: '艺术家',
  al: '专辑',
  by: 'LRC 制作者',
  offset: '全局偏移（自动）',
};
