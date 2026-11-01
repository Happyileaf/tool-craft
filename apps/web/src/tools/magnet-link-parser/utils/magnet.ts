/**
 * Magnet URI（magnet:?xt=…，BEP 9 / BEP 12 常见参数）解析与拼装纯函数，
 * 不依赖 DOM 与 React、零新增依赖。
 *
 * 支持的参数：
 * - xt：精确主题（exact topic），如 urn:btih:<40 位十六进制 v1 info hash>、urn:btmh:<v2>；
 * - dn：显示名（百分号编码）；tr：tracker（可重复，按出现顺序保留）；
 * - xl：文件大小（字节，十进制整数）；ws：Web 种子（可重复）；
 * - kt：关键词（可含 + 分隔）；as：普通来源 / 镜像链接；
 * - 未识别参数原样收集到 extra。
 */

/** 解析得到的 Magnet 结构 */
export interface MagnetData {
  /** 精确主题列表（xt 可出现多次） */
  exactTopics: string[];
  /** 识别出的 BitTorrent v1 info hash（40 位十六进制，大写）；不存在为 null */
  btihV1: string | null;
  /** 显示名 dn（已百分号解码） */
  displayName: string | null;
  /** tracker 列表 tr（已解码，按出现顺序） */
  trackers: string[];
  /** 文件大小 xl（字节）；缺失或非法为 null */
  fileLength: number | null;
  /** Web 种子 ws 列表（已解码） */
  webSeeds: string[];
  /** 关键词 kt（按 + 拆分并解码） */
  keywords: string[];
  /** 来源 / 镜像 as（已解码） */
  acceptableSource: string | null;
  /** 未识别参数（键小写，值已解码；同键多值收集为数组） */
  extra: Record<string, string | string[]>;
}

/** 解析结果 */
export type MagnetParseResult =
  | (MagnetData & { error: null })
  | { error: string };

/** 拼装输入（与解析结构对称，仅暴露常见字段） */
export interface MagnetBuildInput {
  /** xt 列表；至少一个 */
  exactTopics: string[];
  displayName?: string;
  trackers?: string[];
  fileLength?: number | null;
  webSeeds?: string[];
  keywords?: string[];
  acceptableSource?: string;
}

/** 40 位十六进制 v1 info hash（urn:btih: 之后） */
const BTIH_V1_PATTERN = /^urn:btih:([0-9a-fA-F]{40})$/;

/**
 * 安全百分号解码：非法 %XX 不抛异常，返回 null 由调用方报错
 *
 * @param value - 百分号编码文本
 * @returns 解码文本或 null（编码非法）
 */
function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * 把同一参数键的新值并入记录：首次为字符串，再次出现升级为数组
 *
 * @param record - extra 记录
 * @param key - 参数键
 * @param value - 已解码值
 */
function appendExtra(
  record: Record<string, string | string[]>,
  key: string,
  value: string,
): void {
  const existing = record[key];
  if (existing === undefined) {
    record[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    record[key] = [existing, value];
  }
}

/**
 * 解析 magnet URI
 *
 * @param input - magnet: 链接文本
 * @returns 结构化字段或中文错误
 */
export function parseMagnet(input: string): MagnetParseResult {
  const text = input.trim();
  if (text === '') {
    return { error: '请输入 magnet: 链接' };
  }
  if (!text.startsWith('magnet:?')) {
    return { error: '不是合法的 magnet URI：必须以 "magnet:?" 开头' };
  }

  const query = text.slice('magnet:?'.length);
  if (query === '') {
    return { error: '链接缺少查询参数（xt 等）' };
  }

  const data: MagnetData = {
    exactTopics: [],
    btihV1: null,
    displayName: null,
    trackers: [],
    fileLength: null,
    webSeeds: [],
    keywords: [],
    acceptableSource: null,
    extra: {},
  };

  const pairs = query.split('&');
  for (const pair of pairs) {
    if (pair === '') {
      continue;
    }
    const eqIndex = pair.indexOf('=');
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? '' : pair.slice(eqIndex + 1);
    const key = rawKey.toLowerCase();
    const value = safeDecode(rawValue);
    if (value === null) {
      return { error: `参数 "${rawKey}" 含非法的百分号编码（%XX），无法解码` };
    }

    switch (key) {
      case 'xt':
        data.exactTopics.push(value);
        break;
      case 'dn':
        data.displayName = value;
        break;
      case 'tr':
        data.trackers.push(value);
        break;
      case 'xl': {
        if (!/^\d+$/.test(value)) {
          return { error: `文件大小 xl="${value}" 不是非负整数（字节）` };
        }
        data.fileLength = Number(value);
        break;
      }
      case 'ws':
        data.webSeeds.push(value);
        break;
      case 'kt':
        data.keywords.push(...value.split('+').filter((word) => word !== ''));
        break;
      case 'as':
        data.acceptableSource = value;
        break;
      default:
        appendExtra(data.extra, key, value);
    }
  }

  if (data.exactTopics.length === 0) {
    return { error: '缺少必需参数 xt（精确主题，如 urn:btih:<info hash>）' };
  }

  for (const topic of data.exactTopics) {
    const match = topic.match(BTIH_V1_PATTERN);
    if (match && match[1] !== undefined) {
      data.btihV1 = match[1].toUpperCase();
      break;
    }
  }

  return { ...data, error: null };
}

/**
 * 判断解析结果是否成功（类型守卫）
 *
 * @param result - 解析结果
 * @returns 成功返回 true
 */
export function isMagnetParsed(
  result: MagnetParseResult,
): result is MagnetData & { error: null } {
  return result.error === null;
}

/**
 * 把值编码进查询串：空字符串也保留 "key="
 *
 * @param key - 参数键
 * @param value - 原始值
 * @returns key=编码值
 */
function encodePair(key: string, value: string): string {
  return `${key}=${encodeURIComponent(value)}`;
}

/**
 * 从结构化字段拼装 magnet URI
 *
 * @param input - 字段集合
 * @returns magnet URI 或中文错误
 */
export function buildMagnet(
  input: MagnetBuildInput,
): { uri: string | null; error: string | null } {
  const topics = input.exactTopics.map((topic) => topic.trim()).filter(Boolean);
  if (topics.length === 0) {
    return { uri: null, error: '至少需要一个 xt（精确主题）' };
  }

  const parts: string[] = topics.map((topic) => encodePair('xt', topic));

  if (input.displayName && input.displayName.trim() !== '') {
    parts.push(encodePair('dn', input.displayName.trim()));
  }
  for (const tracker of input.trackers ?? []) {
    if (tracker.trim() !== '') {
      parts.push(encodePair('tr', tracker.trim()));
    }
  }
  if (input.fileLength !== undefined && input.fileLength !== null) {
    if (!Number.isInteger(input.fileLength) || input.fileLength < 0) {
      return { uri: null, error: '文件大小必须是非负整数（字节）' };
    }
    parts.push(`xl=${input.fileLength}`);
  }
  for (const seed of input.webSeeds ?? []) {
    if (seed.trim() !== '') {
      parts.push(encodePair('ws', seed.trim()));
    }
  }
  const keywords = (input.keywords ?? []).map((word) => word.trim()).filter(Boolean);
  if (keywords.length > 0) {
    parts.push(
      `kt=${keywords.map((word) => encodeURIComponent(word)).join('+')}`,
    );
  }
  if (input.acceptableSource && input.acceptableSource.trim() !== '') {
    parts.push(encodePair('as', input.acceptableSource.trim()));
  }

  return { uri: `magnet:?${parts.join('&')}`, error: null };
}
