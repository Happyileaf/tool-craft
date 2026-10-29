/**
 * 文本模式批量提取器的内置模式定义
 *
 * 每条模式包含唯一 key、双语标签与一个全局正则；正则均带 g 标志，
 * 由 extract.ts 负责复用与零宽匹配保护。
 */

export interface PatternDef {
  /** 模式唯一标识 */
  key: string;
  /** 中文标签 */
  label: string;
  /** 英文标签 */
  labelEn: string;
  /** 全局匹配正则 */
  regex: RegExp;
}

/**
 * 邮箱（RFC 简化实用形态：本地名 + @ + 域名）
 */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * URL（http / https / ftp / ftps，可选端口与路径）
 */
const URL_PATTERN = /\b(?:https?|ftps?):\/\/[^\s<>"'`]+/gi;

/** IPv4 单段 0–255 */
const IPV4_SEGMENT = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';

/**
 * IPv4（点分四段，每段 0–255；环视边界避免 999.1.1.1 被部分截取）
 */
const IPV4_PATTERN = new RegExp(
  `(?<![\\d.])(?:${IPV4_SEGMENT}\\.){3}${IPV4_SEGMENT}(?![\\d.])`,
  'g',
);

/**
 * IPv6（完整 / 双冒号压缩 / 末尾嵌 IPv4 的常见形态）
 */
const IPV6_PATTERN = new RegExp(
  [
    '(?<![A-Fa-f0-9:])(?:',
    '(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}',
    '|(?:[A-Fa-f0-9]{1,4}:){1,7}:',
    '|(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}',
    '|(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}',
    '|(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}',
    '|(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}',
    '|(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}',
    '|[A-Fa-f0-9]{1,4}:(?::[A-Fa-f0-9]{1,4}){1,6}',
    '|:(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:)',
    `|(?:[A-Fa-f0-9]{1,4}:){1,6}:(?:${IPV4_SEGMENT}\\.){3}${IPV4_SEGMENT}`,
    ')(?![A-Fa-f0-9:])',
  ].join(''),
  'g',
);

/**
 * UUID（8-4-4-4-12 十六进制，RFC 4122 常见形态）
 */
const UUID_PATTERN =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

/**
 * 日期时间（YYYY-MM-DD 或 YYYY/MM/DD，可带 HH:MM(:SS)）
 */
const DATETIME_PATTERN =
  /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?\b/g;

/**
 * 十六进制色值（#RGB / #RRGGBB / #RRGGBBAA）
 */
const HEX_COLOR_PATTERN = /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;

/** 内置模式表（顺序即展示顺序） */
export const BUILTIN_PATTERNS: PatternDef[] = [
  { key: 'email', label: '邮箱', labelEn: 'Email', regex: EMAIL_PATTERN },
  { key: 'url', label: 'URL', labelEn: 'URL', regex: URL_PATTERN },
  { key: 'ipv4', label: 'IPv4', labelEn: 'IPv4', regex: IPV4_PATTERN },
  { key: 'ipv6', label: 'IPv6', labelEn: 'IPv6', regex: IPV6_PATTERN },
  { key: 'uuid', label: 'UUID', labelEn: 'UUID', regex: UUID_PATTERN },
  { key: 'datetime', label: '日期时间', labelEn: 'Date time', regex: DATETIME_PATTERN },
  { key: 'hexColor', label: '十六进制色值', labelEn: 'Hex color', regex: HEX_COLOR_PATTERN },
];

/** 内置模式 key → 定义的映射 */
export const PATTERN_MAP: Record<string, PatternDef> = Object.fromEntries(
  BUILTIN_PATTERNS.map((pattern) => [pattern.key, pattern]),
);
