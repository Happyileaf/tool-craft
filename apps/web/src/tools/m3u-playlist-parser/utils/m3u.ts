/**
 * M3U / M3U8 播放列表解析与生成纯函数，覆盖普通播放列表与 RFC 8216 HLS 媒体播放列表
 *
 * 设计约定：
 * - 解析容忍 LF/CRLF，# 开头为标签行，其余非空行为资源 URI；不发起任何网络请求
 * - 普通条目由可选 #EXTINF:<时长>,<标题> 与紧随其后的 URI 配对
 * - HLS 模式额外识别 #EXT-X-VERSION / TARGETDURATION / MEDIA-SEQUENCE / PLAYLIST-TYPE / ENDLIST
 * - 所有错误带行号，解析不中断；生成方向输出规范文本
 */

/** 单条播放条目 */
export interface PlaylistEntry {
  /** 序号（从 0 开始） */
  index: number;
  /** 时长（秒），无 EXTINF 时为 null */
  duration: number | null;
  /** 标题，缺省为空串 */
  title: string;
  /** 资源路径或 URI */
  uri: string;
  /** URI 所在行号（从 1 开始） */
  line: number;
}

/** HLS 播放列表头部参数 */
export interface HlsHeader {
  /** #EXT-X-VERSION，缺省 null */
  version: number | null;
  /** #EXT-X-TARGETDURATION（秒），缺省 null */
  targetDuration: number | null;
  /** #EXT-X-MEDIA-SEQUENCE，缺省 null */
  mediaSequence: number | null;
  /** #EXT-X-PLAYLIST-TYPE，缺省 null */
  playlistType: string | null;
  /** 是否出现 #EXT-X-ENDLIST */
  endlist: boolean;
}

/** 解析结果 */
export interface ParseResult {
  /** 输入是否以 #EXTM3U 开头 */
  hasExtm3u: boolean;
  /** 是否检测到任意 #EXT-X-* HLS 标签 */
  isHls: boolean;
  /** HLS 头部参数 */
  hls: HlsHeader;
  /** 解析出的条目 */
  entries: PlaylistEntry[];
  /** 全部条目时长之和（秒），无时长信息时为 0 */
  totalDuration: number;
  /** 无法配对或格式错误的提示，带行号 */
  errors: string[];
  /** 未被识别为已知标签的 # 开头标签（保留原文，便于调试） */
  unknownTags: { line: number; raw: string }[];
}

const EMPTY_HLS: HlsHeader = {
  version: null,
  targetDuration: null,
  mediaSequence: null,
  playlistType: null,
  endlist: false,
};

const KNOWN_TAGS = new Set([
  '#EXTM3U',
  '#EXTINF',
  '#EXT-X-VERSION',
  '#EXT-X-TARGETDURATION',
  '#EXT-X-MEDIA-SEQUENCE',
  '#EXT-X-PLAYLIST-TYPE',
  '#EXT-X-ENDLIST',
]);

/**
 * 解析 M3U/M3U8 文本为结构化结果
 */
export function parsePlaylist(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/);
  const errors: string[] = [];
  const unknownTags: { line: number; raw: string }[] = [];
  const entries: PlaylistEntry[] = [];
  const hls: HlsHeader = { ...EMPTY_HLS };

  let hasExtm3u = false;
  let isHls = false;
  let pendingDuration: number | null = null;
  let pendingTitle = '';
  let pendingLine: number | null = null;

  const flushPending = (uriLine: number) => {
    errors.push(`第 ${pendingLine} 行的 #EXTINF 缺少配对的资源 URI（直到第 ${uriLine} 行）`);
    pendingDuration = null;
    pendingTitle = '';
    pendingLine = null;
  };

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine.trim();
    if (line === '') {
      return;
    }

    if (!line.startsWith('#')) {
      entries.push({
        index: entries.length,
        duration: pendingDuration,
        title: pendingTitle,
        uri: line,
        line: lineNo,
      });
      pendingDuration = null;
      pendingTitle = '';
      pendingLine = null;
      return;
    }

    // 标签行
    const tagHead = line.split(/[:,]/, 1)[0] ?? line;
    if (line.toUpperCase() === '#EXTM3U') {
      hasExtm3u = true;
      return;
    }

    if (tagHead === '#EXTINF') {
      const payload = line.slice('#EXTINF:'.length);
      const comma = payload.indexOf(',');
      const durationText = comma === -1 ? payload : payload.slice(0, comma);
      const title = comma === -1 ? '' : payload.slice(comma + 1);
      const duration = Number(durationText.trim());
      if (!Number.isFinite(duration) || duration < 0) {
        errors.push(`第 ${lineNo} 行 #EXTINF 时长非法：${durationText || '（空）'}`);
        pendingDuration = null;
      } else {
        pendingDuration = duration;
      }
      pendingTitle = title.trim();
      pendingLine = lineNo;
      return;
    }

    if (line.startsWith('#EXT-X-')) {
      isHls = true;
      const colon = line.indexOf(':');
      const tag = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).trim();

      switch (tag) {
        case '#EXT-X-VERSION': {
          const version = Number(value);
          if (Number.isInteger(version) && version >= 0) {
            hls.version = version;
          } else {
            errors.push(`第 ${lineNo} 行 #EXT-X-VERSION 取值非法：${value || '（空）'}`);
          }
          break;
        }
        case '#EXT-X-TARGETDURATION': {
          const target = Number(value);
          if (Number.isInteger(target) && target >= 0) {
            hls.targetDuration = target;
          } else {
            errors.push(`第 ${lineNo} 行 #EXT-X-TARGETDURATION 取值非法：${value || '（空）'}`);
          }
          break;
        }
        case '#EXT-X-MEDIA-SEQUENCE': {
          const seq = Number(value);
          if (Number.isInteger(seq) && seq >= 0) {
            hls.mediaSequence = seq;
          } else {
            errors.push(`第 ${lineNo} 行 #EXT-X-MEDIA-SEQUENCE 取值非法：${value || '（空）'}`);
          }
          break;
        }
        case '#EXT-X-PLAYLIST-TYPE': {
          if (value === 'EVENT' || value === 'VOD') {
            hls.playlistType = value;
          } else {
            errors.push(`第 ${lineNo} 行 #EXT-X-PLAYLIST-TYPE 仅允许 EVENT / VOD，实际：${value || '（空）'}`);
          }
          break;
        }
        case '#EXT-X-ENDLIST':
          hls.endlist = true;
          break;
        default:
          unknownTags.push({ line: lineNo, raw: line });
      }
      return;
    }

    // 其他标签（含 #EXTGRP 等）：已知标签不报错，未知标签收集
    if (!KNOWN_TAGS.has(tagHead) && !line.startsWith('#EXT-X-')) {
      unknownTags.push({ line: lineNo, raw: line });
    }
  });

  if (pendingLine !== null) {
    flushPending(lines.length);
  }

  if (!hasExtm3u && entries.length > 0) {
    errors.push('输入缺少 #EXTM3U 文件头，已按宽松模式解析');
  }

  const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);

  // HLS 语义校验：任一分片时长超过 TARGETDURATION 即不符合 RFC 8216
  if (hls.targetDuration !== null) {
    entries.forEach((entry) => {
      if (entry.duration !== null && entry.duration > hls.targetDuration!) {
        errors.push(
          `第 ${entry.line} 行分片时长 ${entry.duration}s 超过 TARGETDURATION ${hls.targetDuration}s`,
        );
      }
    });
  }

  return { hasExtm3u, isHls, hls, entries, totalDuration, errors, unknownTags };
}

/** 生成方向的条目输入 */
export interface DraftEntry {
  duration: number | null;
  title: string;
  uri: string;
}

/** HLS 生成参数 */
export interface HlsOptions {
  version: number | null;
  targetDuration: number | null;
  mediaSequence: number | null;
  playlistType: string | null;
  endlist: boolean;
}

/**
 * 把结构化条目生成为 M3U/M3U8 文本
 *
 * @param entries - 条目列表
 * @param hls - 传入 HLS 参数（含 targetDuration）时输出 HLS 媒体播放列表，否则输出普通列表
 */
export function generatePlaylist(entries: DraftEntry[], hls?: HlsOptions | null): string {
  const lines: string[] = ['#EXTM3U'];
  const useHls = Boolean(hls && (hls.targetDuration !== null || hls.version !== null || hls.endlist));

  if (useHls && hls) {
    if (hls.version !== null) {
      lines.push(`#EXT-X-VERSION:${hls.version}`);
    }
    if (hls.targetDuration !== null) {
      lines.push(`#EXT-X-TARGETDURATION:${hls.targetDuration}`);
    }
    if (hls.mediaSequence !== null) {
      lines.push(`#EXT-X-MEDIA-SEQUENCE:${hls.mediaSequence}`);
    }
    if (hls.playlistType) {
      lines.push(`#EXT-X-PLAYLIST-TYPE:${hls.playlistType}`);
    }
  }

  entries.forEach((entry) => {
    if (entry.duration !== null) {
      const title = entry.title ? `,${entry.title}` : ',';
      lines.push(`#EXTINF:${formatDuration(entry.duration)}${title}`);
    }
    lines.push(entry.uri);
  });

  if (useHls && hls?.endlist) {
    lines.push('#EXT-X-ENDLIST');
  }

  return lines.join('\n');
}

/**
 * 时长格式化：整数不带小数点，浮点至多 3 位并去除尾随 0
 */
export function formatDuration(seconds: number): string {
  if (Number.isInteger(seconds)) {
    return String(seconds);
  }
  const rounded = Math.round(seconds * 1000) / 1000;
  return String(rounded);
}

/**
 * 把秒数格式化为 hh:mm:ss 可读时长
 */
export function formatClock(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
