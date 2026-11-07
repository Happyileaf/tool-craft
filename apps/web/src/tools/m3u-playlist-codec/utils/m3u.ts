/**
 * M3U / M3U8 播放列表解析与序列化纯函数（零依赖）
 *
 * 参考 RFC 8216（HTTP Live Streaming）标签约定：
 * - #EXTM3U 文件头、#EXTINF:<duration>,<title> 媒体段
 * - #EXT-X-STREAM-INF 变体流、#EXT-X-KEY 密钥标签等属性行
 * 解析不抛异常，格式问题进入 issues 列表，由 UI 展示。
 */

export interface M3uIssue {
  /** 1 起始的行号 */
  line: number;
  level: 'error' | 'warning';
  message: string;
}

export interface M3uEntry {
  /** EXTINF 时长（秒），-1 表示直播流 / 未知；非 EXTINF 条目为 null */
  duration: number | null;
  /** EXTINF 标题，可为空字符串 */
  title: string;
  /** 资源 URI（媒体分片或变体流地址） */
  uri: string;
  /** 来自 #EXT-X-STREAM-INF 等属性标签的键值 */
  attrs: Record<string, string>;
  /** 该条目关联的原始指令行（如 #EXT-X-STREAM-INF:...），无则空字符串 */
  directive: string;
}

export interface M3uParseResult {
  /** 是否存在 #EXTM3U 头 */
  headerPresent: boolean;
  entries: M3uEntry[];
  /** 不属于任何条目的独立指令（#EXT-X-KEY、#EXT-X-TARGETDURATION 等），按出现顺序保留 */
  standaloneDirectives: string[];
  issues: M3uIssue[];
}

/** 剥离 UTF-8 BOM 并归一化 CRLF/CR 为 LF */
export function normalizeText(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

/**
 * 解析属性列表：BANDWIDTH=1280000,RESOLUTION="720x480",CODECS="avc1,mp4a"
 * 带引号的值保留引号内容但去掉外层引号，逗号在引号内不作为分隔符。
 */
export function parseAttributeList(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([A-Z0-9-]+)=("(?:[^"]*)"|[^,]*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1]!;
    let value = match[2]!;
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    attrs[key] = value;
  }
  return attrs;
}

export function parseM3u(text: string): M3uParseResult {
  const normalized = normalizeText(text);
  const lines = normalized.split('\n');
  const issues: M3uIssue[] = [];
  const entries: M3uEntry[] = [];
  const standaloneDirectives: string[] = [];

  let headerPresent = false;
  let pending: { duration: number | null; title: string; directive: string } | null = null;
  let pendingAttrs: Record<string, string> = {};
  let pendingLine = 0;

  const flushPendingWithoutUri = () => {
    if (pending !== null) {
      issues.push({
        line: pendingLine,
        level: 'error',
        message: `第 ${pendingLine} 行的 EXTINF 标签后缺少资源 URI`,
      });
      pending = null;
      pendingAttrs = {};
    }
  };

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      return;
    }

    if (trimmed === '#EXTM3U') {
      headerPresent = true;
      return;
    }

    if (trimmed.startsWith('#EXTINF:')) {
      flushPendingWithoutUri();
      const body = trimmed.slice('#EXTINF:'.length);
      const commaIndex = body.indexOf(',');
      const durationRaw = commaIndex >= 0 ? body.slice(0, commaIndex).trim() : body.trim();
      const title = commaIndex >= 0 ? body.slice(commaIndex + 1).trim() : '';
      const duration = Number(durationRaw);
      if (durationRaw !== '-1' && (!Number.isFinite(duration) || duration < 0)) {
        issues.push({
          line,
          level: 'error',
          message: `第 ${line} 行 EXTINF 时长「${durationRaw}」不是合法非负数字`,
        });
      }
      pending = {
        duration: durationRaw === '-1' ? -1 : Number.isFinite(duration) ? duration : null,
        title,
        directive: trimmed,
      };
      pendingLine = line;
      return;
    }

    if (trimmed.startsWith('#EXT-X-STREAM-INF')) {
      flushPendingWithoutUri();
      const colonIndex = trimmed.indexOf(':');
      const attrRaw = colonIndex >= 0 ? trimmed.slice(colonIndex + 1) : '';
      pendingAttrs = parseAttributeList(attrRaw);
      pending = { duration: null, title: '', directive: trimmed };
      pendingLine = line;
      return;
    }

    if (trimmed.startsWith('#')) {
      // 其它指令（#EXT-X-KEY、#EXT-X-TARGETDURATION、普通注释 # 等）独立保留
      standaloneDirectives.push(trimmed);
      return;
    }

    // URI 行：与挂起的 EXTINF / STREAM-INF 配对
    entries.push({
      duration: pending?.duration ?? null,
      title: pending?.title ?? '',
      uri: trimmed,
      attrs: pendingAttrs,
      directive: pending?.directive ?? '',
    });
    pending = null;
    pendingAttrs = {};
  });

  flushPendingWithoutUri();

  if (!headerPresent) {
    issues.unshift({
      line: 1,
      level: 'warning',
      message: '缺少 #EXTM3U 文件头，已按宽松模式解析',
    });
  }

  return { headerPresent, entries, standaloneDirectives, issues };
}

export interface StringifyOptions {
  /** 是否输出 #EXTM3U 头，默认 true */
  header?: boolean;
}

/** 把结构化条目反向序列化为 M3U 文本（LF 换行） */
export function stringifyM3u(result: M3uParseResult, options: StringifyOptions = {}): string {
  const { header = true } = options;
  const out: string[] = [];
  if (header) {
    out.push('#EXTM3U');
  }
  for (const directive of result.standaloneDirectives) {
    out.push(directive);
  }
  for (const entry of result.entries) {
    if (entry.directive) {
      out.push(entry.directive);
    } else if (entry.duration !== null) {
      out.push(`#EXTINF:${entry.duration},${entry.title}`);
    }
    out.push(entry.uri);
  }
  return out.join('\n');
}

/** 基于 base URL 把 M3U 内的相对 URI 转为绝对 URI */
export function relativeToAbsolute(baseUrl: string, text: string): string {
  const normalized = normalizeText(text);
  return normalized
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        return line;
      }
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return line;
      }
      try {
        return new URL(trimmed, baseUrl).toString();
      } catch {
        return line;
      }
    })
    .join('\n');
}

/** 校验 M3U 文本，返回带行号的问题列表 */
export function validateM3u(text: string): M3uIssue[] {
  return parseM3u(text).issues;
}
