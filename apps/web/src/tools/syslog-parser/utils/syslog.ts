/**
 * Syslog RFC 5424 / RFC 3164 线协议解析纯函数；
 * 不依赖 DOM、不发起任何网络请求，日志内容仅在浏览器内存中处理
 */

/** 线协议格式 */
export type SyslogFormat = 'rfc5424' | 'rfc3164' | 'unknown';

/** 结构化数据块（RFC 5424 SD） */
export interface StructuredDataBlock {
  /** SD-ID */
  id: string;
  /** 参数键值对 */
  params: Record<string, string>;
}

/** 解析出的字段集合 */
export interface SyslogFields {
  /** PRI 原始值 facility*8+severity */
  pri?: number;
  /** 设施码 */
  facilityCode?: number;
  /** 设施名称 */
  facilityName?: string;
  /** 严重级码 */
  severityCode?: number;
  /** 严重级名称 */
  severityName?: string;
  /** 版本号（仅 RFC 5424） */
  version?: number;
  /** 时间戳原文 */
  timestamp?: string;
  /** 主机名 */
  host?: string;
  /** 应用名（RFC 3164 为 TAG） */
  app?: string;
  /** 进程 ID */
  procid?: string;
  /** 消息 ID（仅 RFC 5424） */
  msgid?: string;
  /** 结构化数据 */
  structuredData?: StructuredDataBlock[];
  /** 消息正文 */
  message?: string;
}

/** 单行解析结果 */
export interface ParsedSyslogLine {
  /** 行号（从 1 开始） */
  lineNo: number;
  /** 识别到的格式，无法识别为 unknown */
  format: SyslogFormat;
  /** 解析字段 */
  fields: SyslogFields;
  /** 原始行 */
  raw: string;
  /** 解析过程中的错误信息 */
  errors: string[];
}

/** 批量解析汇总 */
export interface ParseSummary {
  /** 总行数（不含空行） */
  total: number;
  /** 各格式计数 */
  formatCounts: Record<SyslogFormat, number>;
  /** 含错误的行数 */
  errorLines: number;
}

/** 批量解析完整结果 */
export interface ParseResult {
  /** 逐行结果 */
  lines: ParsedSyslogLine[];
  /** 汇总统计 */
  summary: ParseSummary;
}

/** facility 码 → 名称（RFC 5424 表 2） */
export const FACILITY_NAMES: string[] = [
  'kernel',
  'user-level',
  'mail-system',
  'system-daemon',
  'security-auth',
  'syslogd-internal',
  'line-printer',
  'network-news',
  'uucp',
  'clock',
  'security-auth2',
  'ftp',
  'ntp',
  'log-audit',
  'log-alert',
  'clock2',
  'local0',
  'local1',
  'local2',
  'local3',
  'local4',
  'local5',
  'local6',
  'local7',
];

/** severity 码 → 名称（RFC 5424 表 3） */
export const SEVERITY_NAMES: string[] = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'informational',
  'debug',
];

/** 匹配开头 PRI 的正则 */
const PRI_PATTERN = /^<(\d{1,3})>/;
/** RFC 3164 时间戳 `Mmm dd hh:mm:ss` */
const RFC3164_TIMESTAMP = /^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s/;
/** 月份缩写白名单 */
const MONTH_ABBRS = new Set([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]);

/**
 * 解码 PRI 值为 facility / severity 码与名称
 *
 * @param pri - 原始 PRI 整数
 * @returns 字段片段与可能的错误
 */
function decodePri(pri: number): { fields: SyslogFields; errors: string[] } {
  const errors: string[] = [];
  if (pri > 191) {
    errors.push(`PRI 值 ${pri} 越界（合法范围 0–191）`);
  }
  const facilityCode = Math.floor(pri / 8);
  const severityCode = pri % 8;
  return {
    fields: {
      pri,
      facilityCode,
      facilityName: FACILITY_NAMES[facilityCode] ?? `unknown(${facilityCode})`,
      severityCode,
      severityName: SEVERITY_NAMES[severityCode] ?? `unknown(${severityCode})`,
    },
    errors,
  };
}

/**
 * 解析 RFC 5424 结构化数据字符串（NILVALUE 或一个以上 SD 块）
 *
 * @param raw - SD 原文
 * @returns 结构化块与错误信息
 */
function parseStructuredData(raw: string): {
  blocks: StructuredDataBlock[];
  errors: string[];
} {
  const errors: string[] = [];
  const blocks: StructuredDataBlock[] = [];
  if (raw === '-') {
    return { blocks, errors };
  }
  const blockPattern = /\[([^\][]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(raw)) !== null) {
    const body = match[1]!;
    // 第一个 token 为 SD-ID，其余为 key="value"
    const paramPattern = /(\S+)="((?:[^"\\]|\\.)*)"/g;
    const idMatch = /^(\S+)\s/.exec(`${body} `);
    const id = idMatch ? idMatch[1]! : body;
    const params: Record<string, string> = {};
    let paramMatch: RegExpExecArray | null;
    while ((paramMatch = paramPattern.exec(body)) !== null) {
      params[paramMatch[1]!] = paramMatch[2]!.replace(/\\("|\\|\])/g, '$1');
    }
    blocks.push({ id, params });
  }
  // 去除所有匹配块后，若仍有非空白残留，说明存在无法匹配的片段
  const leftover = raw.replace(blockPattern, '').trim();
  if (leftover !== '') {
    errors.push('结构化数据存在无法匹配的片段（括号可能不配对）');
  }
  return { blocks, errors };
}

/**
 * 尝试按 RFC 5424 解析单行
 *
 * @param line - 原始行（已确认以 <PRI> 开头）
 * @returns 解析结果，不匹配返回 null
 */
function parseRfc5424(line: string): ParsedSyslogLine | null {
  const priMatch = PRI_PATTERN.exec(line);
  if (!priMatch) {
    return null;
  }
  const pri = Number(priMatch[1]);
  // 5424 在 PRI 后紧跟版本号（单个数字）与空格
  const afterPri = line.slice(priMatch[0].length);
  const versionMatch = /^(\d+)\s/.exec(afterPri);
  if (!versionMatch) {
    return null;
  }

  const { fields, errors } = decodePri(pri);
  fields.version = Number(versionMatch[1]);
  const rest = afterPri.slice(versionMatch[0].length);

  // 按 SP 拆分前 6 个结构化字段：timestamp host app procid msgid structured-data
  const tokens = rest.split(' ');
  const [timestamp, host, app, procid, msgid] = tokens;
  if (tokens.length < 6) {
    return {
      lineNo: 0,
      format: 'rfc5424',
      fields,
      raw: line,
      errors: [...errors, 'RFC 5424 字段数不足，缺少结构化数据等必填字段'],
    };
  }
  fields.timestamp = timestamp === '-' ? undefined : timestamp;
  fields.host = host === '-' ? undefined : host;
  fields.app = app === '-' ? undefined : app;
  fields.procid = procid === '-' ? undefined : procid;
  fields.msgid = msgid === '-' ? undefined : msgid;

  // 结构化数据可能含空格（参数内），需按括号匹配截取；
  // 以下索引均基于 rest（已剥离版本前缀），最终从 rest 切出消息正文
  let sdRaw = tokens[5]!;
  let messageStart = tokens.slice(0, 6).join(' ').length + 1;
  if (sdRaw !== '-') {
    const firstBracket = rest.indexOf('[');
    if (firstBracket === -1) {
      errors.push('结构化数据缺少起始方括号 [');
      messageStart = rest.length;
    } else {
      let depth = 0;
      let end = -1;
      for (let i = firstBracket; i < rest.length; i += 1) {
        if (rest[i] === '[') {
          depth += 1;
        } else if (rest[i] === ']') {
          depth -= 1;
          // 深度归零后若紧跟下一个块的起始 [，则继续（多个相邻 SD 块）
          if (depth === 0 && rest[i + 1] !== '[') {
            end = i;
            break;
          }
        }
      }
      if (end === -1) {
        errors.push('结构化数据括号不配对');
        sdRaw = rest.slice(firstBracket);
        messageStart = rest.length;
      } else {
        sdRaw = rest.slice(firstBracket, end + 1);
        messageStart = end + 1;
      }
    }
  }
  const sdResult = parseStructuredData(sdRaw);
  fields.structuredData = sdResult.blocks;
  errors.push(...sdResult.errors);

  let message = rest.slice(messageStart).replace(/^\s/, '');
  if (message.charCodeAt(0) === 0xfeff) {
    message = message.slice(1); // 去除 UTF-8 BOM（U+FEFF）
  }
  fields.message = message === '' ? undefined : message;

  return { lineNo: 0, format: 'rfc5424', fields, raw: line, errors };
}

/**
 * 尝试按 RFC 3164 解析单行
 *
 * @param line - 原始行
 * @returns 解析结果，不匹配返回 null
 */
function parseRfc3164(line: string): ParsedSyslogLine | null {
  const priMatch = PRI_PATTERN.exec(line);
  if (!priMatch) {
    return null;
  }
  const pri = Number(priMatch[1]);
  const afterPri = line.slice(priMatch[0].length);
  const timestampMatch = RFC3164_TIMESTAMP.exec(afterPri);
  if (!timestampMatch) {
    return null;
  }
  const timestampRaw = timestampMatch[0].trim();
  const month = timestampRaw.slice(0, 3);
  if (!MONTH_ABBRS.has(month)) {
    return null;
  }

  const { fields, errors } = decodePri(pri);
  fields.timestamp = timestampRaw;
  const remainder = afterPri.slice(timestampMatch[0].length);

  // HOST 为下一个空格前的 token
  const spaceIndex = remainder.indexOf(' ');
  if (spaceIndex === -1) {
    return {
      lineNo: 0,
      format: 'rfc3164',
      fields,
      raw: line,
      errors: [...errors, 'RFC 3164 缺少 TAG/MSG 部分'],
    };
  }
  fields.host = remainder.slice(0, spaceIndex);
  const tagAndMsg = remainder.slice(spaceIndex + 1);

  // TAG：字母数字串，可选 [pid]，以 : 或 [ 结束
  const tagMatch = /^([A-Za-z0-9._/-]+)(?:\[(\d+)\])?\s*:?\s?/.exec(tagAndMsg);
  if (tagMatch) {
    fields.app = tagMatch[1];
    if (tagMatch[2]) {
      fields.procid = tagMatch[2];
    }
    fields.message = tagAndMsg.slice(tagMatch[0].length);
  } else {
    fields.message = tagAndMsg;
  }

  return { lineNo: 0, format: 'rfc3164', fields, raw: line, errors };
}

/**
 * 解析单行 syslog；无 PRI 的纯文本标记为 unknown 并原样保留
 *
 * @param line - 原始行
 * @param lineNo - 行号
 * @returns 解析结果
 */
export function parseSyslogLine(line: string, lineNo: number): ParsedSyslogLine {
  const base: ParsedSyslogLine = {
    lineNo,
    format: 'unknown',
    fields: { message: line },
    raw: line,
    errors: [],
  };
  if (!PRI_PATTERN.test(line)) {
    base.errors.push('未检测到 <PRI> 前缀，无法按 syslog 线协议解析');
    return base;
  }

  const rfc5424 = parseRfc5424(line);
  if (rfc5424) {
    return { ...rfc5424, lineNo };
  }
  const rfc3164 = parseRfc3164(line);
  if (rfc3164) {
    return { ...rfc3164, lineNo };
  }

  base.errors.push('含 PRI 前缀但不符合 RFC 5424 / RFC 3164 结构');
  return base;
}

/**
 * 批量解析多行 syslog 文本，空行自动跳过
 *
 * @param input - 原始日志文本
 * @returns 逐行结果与汇总统计
 */
export function parseSyslog(input: string): ParseResult {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');

  const parsed = lines.map((line, index) => parseSyslogLine(line, index + 1));
  const summary: ParseSummary = {
    total: parsed.length,
    formatCounts: { rfc5424: 0, rfc3164: 0, unknown: 0 },
    errorLines: 0,
  };
  for (const line of parsed) {
    summary.formatCounts[line.format] += 1;
    if (line.errors.length > 0) {
      summary.errorLines += 1;
    }
  }
  return { lines: parsed, summary };
}
