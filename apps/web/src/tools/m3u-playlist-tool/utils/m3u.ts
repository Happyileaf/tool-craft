/**
 * M3U / M3U8 播放列表生成与解析（零新增依赖，纯本地文本处理）
 *
 * 参考：RFC 8216（HTTP Live Streaming）§4.3 媒体播放列表标签。
 * 本模块不触碰 DOM 与 React，畸形输入以 errors / warnings 收集而非抛出。
 */

/** 单个媒体条目（分片） */
export interface M3uEntry {
  /** 资源 URI（相对或绝对） */
  uri: string;
  /** 时长（秒），普通 M3U 允许缺省为 null */
  duration: number | null;
  /** 标题（#EXTINF 逗号后的部分），可为空串 */
  title: string;
}

/** HLS 媒体播放列表全局标签 */
export interface HlsTags {
  /** #EXT-X-VERSION，缺省为 null */
  version: number | null;
  /** #EXT-X-TARGETDURATION（秒，整数） */
  targetDuration: number | null;
  /** #EXT-X-MEDIA-SEQUENCE，缺省为 null（默认 0） */
  mediaSequence: number | null;
  /** #EXT-X-PLAYLIST-TYPE：VOD / EVENT，缺省为 null */
  playlistType: 'VOD' | 'EVENT' | null;
  /** 是否出现 #EXT-X-ENDLIST */
  endList: boolean;
}

/** 生成方向的输入参数 */
export interface BuildOptions {
  /** 播放列表形态：普通 M3U 或 HLS 媒体播放列表 */
  mode: 'basic' | 'hls';
  entries: M3uEntry[];
  /** HLS 可选标签 */
  hls?: Partial<Pick<HlsTags, 'version' | 'mediaSequence' | 'playlistType'>> & {
    /** 是否追加 #EXT-X-ENDLIST，默认 true */
    endList?: boolean;
  };
  /** 行尾序列，默认 LF */
  lineEnding?: 'LF' | 'CRLF';
}

/** 解析结果 */
export interface ParseResult {
  /** 是否含 #EXTM3U 头 */
  hasHeader: boolean;
  /** 是否识别出任一 HLS 专属标签 */
  isHls: boolean;
  hls: HlsTags;
  entries: M3uEntry[];
  /** 全部条目时长之和（秒），缺省时长的条目按 0 计 */
  totalDuration: number;
  warnings: string[];
  errors: string[];
}

const BOM = '﻿';

/** 拆行：去 BOM、兼容 CRLF / LF / CR */
export function splitLines(text: string): string[] {
  const withoutBom = text.startsWith(BOM) ? text.slice(BOM.length) : text;
  return withoutBom.split(/\r\n|\n|\r/);
}

/** 浮点时长格式化：去掉多余尾零（RFC 8216 允许浮点 #EXTINF） */
export function formatDuration(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('时长必须是有限数值');
  }
  if (value < 0) {
    throw new Error('时长不能为负数');
  }
  // 四舍五入到 3 位小数再去尾零，避免 10.0000000001 之类浮点噪声
  return String(parseFloat(value.toFixed(3)));
}

/**
 * 生成播放列表文本。
 * basic：#EXTM3U + 每条目 #EXTINF 行（有时长才输出）+ URI 行。
 * hls：在 basic 基础上输出 HLS 全局标签，TARGETDURATION 取分片时长向上取整最大值。
 */
export function buildPlaylist(options: BuildOptions): string {
  const { mode, entries, lineEnding = 'LF' } = options;
  const eol = lineEnding === 'CRLF' ? '\r\n' : '\n';
  const lines: string[] = ['#EXTM3U'];

  if (mode === 'hls') {
    const hls = options.hls ?? {};
    const version = hls.version ?? 3;
    if (!Number.isInteger(version) || version <= 0) {
      throw new Error('HLS VERSION 必须是正整数');
    }
    lines.push(`#EXT-X-VERSION:${version}`);

    if (entries.length === 0) {
      throw new Error('HLS 媒体播放列表至少需要一个分片条目');
    }
    const durations = entries.map((entry, index) => {
      if (entry.duration === null || !Number.isFinite(entry.duration)) {
        throw new Error(`第 ${index + 1} 个分片缺少合法时长，HLS 要求每条 #EXTINF 都带时长`);
      }
      return entry.duration;
    });
    const targetDuration = Math.max(...durations.map((value) => Math.ceil(value)));
    lines.push(`#EXT-X-TARGETDURATION:${targetDuration}`);

    if (hls.mediaSequence !== undefined && hls.mediaSequence !== null) {
      if (!Number.isInteger(hls.mediaSequence) || hls.mediaSequence < 0) {
        throw new Error('MEDIA-SEQUENCE 必须是非负整数');
      }
      lines.push(`#EXT-X-MEDIA-SEQUENCE:${hls.mediaSequence}`);
    }
    if (hls.playlistType) {
      if (hls.playlistType !== 'VOD' && hls.playlistType !== 'EVENT') {
        throw new Error('PLAYLIST-TYPE 仅支持 VOD 或 EVENT');
      }
      lines.push(`#EXT-X-PLAYLIST-TYPE:${hls.playlistType}`);
    }
  }

  entries.forEach((entry, index) => {
    const uri = entry.uri.trim();
    if (!uri) {
      throw new Error(`第 ${index + 1} 个条目的资源 URI 不能为空`);
    }
    if (entry.duration !== null) {
      const durationText = formatDuration(entry.duration);
      const title = entry.title ?? '';
      lines.push(`#EXTINF:${durationText},${title}`);
    }
    lines.push(uri);
  });

  if (mode === 'hls' && options.hls?.endList !== false) {
    lines.push('#EXT-X-ENDLIST');
  }

  return lines.join(eol);
}

/** 解析 #EXTINF:<duration>,<title> 行，返回时长与标题；畸形返回 null */
function parseExtInf(line: string, lineNo: number, errors: string[]): M3uEntry | null {
  const payload = line.slice('#EXTINF:'.length);
  const commaIndex = payload.indexOf(',');
  const durationPart = (commaIndex >= 0 ? payload.slice(0, commaIndex) : payload).trim();
  const title = commaIndex >= 0 ? payload.slice(commaIndex + 1) : '';
  const duration = Number(durationPart);
  if (durationPart === '' || !Number.isFinite(duration) || duration < 0) {
    errors.push(`第 ${lineNo} 行：#EXTINF 时长「${durationPart}」不是合法非负数字`);
    return { uri: '', duration: null, title };
  }
  return { uri: '', duration, title };
}

/**
 * 解析 M3U / M3U8 文本为结构化结果。
 * 状态机：#EXTINF 暂存待配对，下一个非注释行作为其 URI；
 * 缺头 / 未配对等问题进 warnings / errors，不中断解析。
 */
export function parsePlaylist(text: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const entries: M3uEntry[] = [];
  const hls: HlsTags = {
    version: null,
    targetDuration: null,
    mediaSequence: null,
    playlistType: null,
    endList: false,
  };

  const lines = splitLines(text);
  const firstMeaningful = lines.find((line) => line.trim() !== '');
  const hasHeader = firstMeaningful?.trim() === '#EXTM3U';
  if (text.trim() !== '' && !hasHeader) {
    warnings.push('缺少 #EXTM3U 头部标识，已按宽松模式尽力解析');
  }

  let pending: M3uEntry | null = null;
  let isHls = false;

  const flushPending = (lineNo: number) => {
    if (pending) {
      errors.push(`第 ${lineNo} 行：#EXTINF 标签后缺少配对的资源 URI 行`);
      entries.push(pending);
      pending = null;
    }
  };

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();
    if (line === '') {
      return;
    }

    if (!line.startsWith('#')) {
      if (pending) {
        pending.uri = line;
        entries.push(pending);
        pending = null;
      } else {
        // 无 #EXTINF 的裸 URI 行，普通 M3U 允许
        entries.push({ uri: line, duration: null, title: '' });
      }
      return;
    }

    // 注释 / 标签行
    if (line === '#EXTM3U') {
      flushPending(lineNo);
      return;
    }
    if (line.startsWith('#EXTINF:')) {
      flushPending(lineNo);
      pending = parseExtInf(line, lineNo, errors);
      return;
    }

    // HLS 全局标签
    if (line.startsWith('#EXT-X-')) {
      isHls = true;
      if (line.startsWith('#EXT-X-VERSION:')) {
        const value = Number(line.split(':')[1]);
        if (Number.isInteger(value) && value > 0) {
          hls.version = value;
        } else {
          errors.push(`第 ${lineNo} 行：#EXT-X-VERSION 取值非法（${line.split(':')[1] ?? ''}）`);
        }
      } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
        const value = Number(line.split(':')[1]);
        if (Number.isInteger(value) && value >= 0) {
          hls.targetDuration = value;
        } else {
          errors.push(`第 ${lineNo} 行：#EXT-X-TARGETDURATION 取值非法`);
        }
      } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
        const value = Number(line.split(':')[1]);
        if (Number.isInteger(value) && value >= 0) {
          hls.mediaSequence = value;
        } else {
          errors.push(`第 ${lineNo} 行：#EXT-X-MEDIA-SEQUENCE 取值非法`);
        }
      } else if (line.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
        const value = line.split(':')[1]?.trim();
        if (value === 'VOD' || value === 'EVENT') {
          hls.playlistType = value;
        } else {
          errors.push(`第 ${lineNo} 行：#EXT-X-PLAYLIST-TYPE 仅支持 VOD / EVENT`);
        }
      } else if (line === '#EXT-X-ENDLIST') {
        hls.endList = true;
      }
      // 其余 #EXT-X-* 标签（KEY/MAP/ALLOW-CACHE 等）忽略但不报错
      flushPending(lineNo);
      return;
    }

    // 其他 # 开头行视为注释；若当前有待配对 EXTINF，注释不应充当 URI，保留 pending
  });

  flushPending(lines.length + 1);

  const totalDuration = entries.reduce(
    (sum, entry) => sum + (entry.duration === null ? 0 : entry.duration),
    0,
  );

  return { hasHeader, isHls, hls, entries, totalDuration, warnings, errors };
}

/** 秒数转 HH:mm:ss（不足 1 小时省略小时段），用于统计展示 */
export function formatTotalDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`;
}
