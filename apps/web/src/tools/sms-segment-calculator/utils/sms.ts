/**
 * SMS 短信长度与长短信分片计算（3GPP TS 23.038）
 *
 * - GSM 7-bit 默认字母表：单条最多 160 个 septet（7 bit 单位）= 140 字节；
 *   扩展字符（^{}\[~]|€）需要 ESC 转义，占 2 个 septet。
 * - 长短信（concatenated SMS）：每段携带 6 字节 UDH 拼接头，
 *   GSM-7 每段净荷 floor((140 - 6) * 8 / 7) = 153 septet；
 *   UCS-2 每段净荷 floor((140 - 6) / 2) = 67 个编码单元（134 字节）。
 * - UCS-2：每个 BMP 字符 2 字节；BMP 之外字符（emoji 等）用代理对表示，占 2 个编码单元。
 */

/** 单条 TP-UD 净荷上限（字节） */
export const TP_PAYLOAD_BYTES = 140;

/** 长短信拼接头 UDH 长度（字节，IEI 8 位引用号方案） */
export const CONCAT_UDH_BYTES = 6;

/** GSM-7 单条最大 septet 数：160 */
export const GSM_SINGLE_MAX_SEPTETS = 160;

/** GSM-7 长短信每段最大 septet 数：153 */
export const GSM_CONCAT_SEPTETS = 153;

/** UCS-2 单条最大编码单元数：70 */
export const UCS2_SINGLE_MAX_UNITS = 70;

/** UCS-2 长短信每段最大编码单元数：67 */
export const UCS2_CONCAT_UNITS = 67;

/**
 * GSM 7-bit 默认字母表（TS 23.038 6.2.1），下标即 septet 值 0x00–0x7F；
 * 0x1B 为转义前缀 ESC，本身不可直接输入。
 */
export const GSM_BASIC_TABLE: readonly string[] = [
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', '\u001b', 'Æ', 'æ', 'ß', 'É',
  ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
  '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à',
];

/** GSM 扩展字符 → ESC 之后的 septet 值（TS 23.038 6.2.1.1） */
export const GSM_EXTENSION_CODES: Readonly<Record<string, number>> = {
  '^': 0x14,
  '{': 0x28,
  '}': 0x29,
  '\\': 0x2f,
  '[': 0x3c,
  '~': 0x3d,
  ']': 0x3e,
  '|': 0x40,
  '€': 0x65,
};

const BASIC_SET = new Set(GSM_BASIC_TABLE.filter((ch) => ch !== '\u001b'));
const EXTENSION_SET = new Set(Object.keys(GSM_EXTENSION_CODES));

/** 判断字符是否属于 GSM 默认字母表（含扩展字符） */
export function isGsmChar(ch: string): boolean {
  return BASIC_SET.has(ch) || EXTENSION_SET.has(ch);
}

/** GSM 字符的 septet 权重：扩展字符 2（ESC + 码值），其余 1 */
export function gsmCharWeight(ch: string): number {
  return EXTENSION_SET.has(ch) ? 2 : 1;
}

export type SmsEncoding = 'gsm7' | 'ucs2';

export type SmsEncodingMode = 'auto' | SmsEncoding;

export interface CharMark {
  /** 字符 */
  char: string;
  /** 在原文中的码点序号 */
  index: number;
  /** 出现次数 */
  count: number;
}

export interface SmsSegment {
  /** 段序号（从 1 开始） */
  ordinal: number;
  /** 该段承载的文本 */
  text: string;
  /** 该段使用的计费单位数（GSM 为 septet，UCS-2 为编码单元） */
  units: number;
  /** 该段在 PDU 中的字节数（长短信含 6 字节 UDH） */
  bytes: number;
}

export interface SmsAnalysis {
  /** 实际采用的编码 */
  encoding: SmsEncoding;
  /** 输入字符数（按码点计） */
  charCount: number;
  /** 全部计费单位总数（GSM septet / UCS-2 编码单元） */
  totalUnits: number;
  /** 分片结果 */
  segments: SmsSegment[];
  /** 分片条数（即运营商常见的计费条数） */
  segmentCount: number;
  /** 单条容量 */
  singleCapacity: number;
  /** 长短信每段净荷容量 */
  concatCapacity: number;
  /** 最后一段已用单位 */
  usedInLastSegment: number;
  /** 最后一段剩余可输入单位 */
  remainingInLastSegment: number;
  /** 所有分片的 PDU 字节总和（含 UDH） */
  totalBytes: number;
  /** 命中的 GSM 扩展字符统计 */
  extensionChars: CharMark[];
  /** 导致 UCS-2 的非 GSM 字符统计 */
  nonGsmChars: CharMark[];
  /** 无法编码等告警信息 */
  warnings: string[];
}

function collectMarks(text: string, predicate: (ch: string) => boolean): CharMark[] {
  const map = new Map<string, CharMark>();
  let index = 0;
  for (const ch of text) {
    if (predicate(ch)) {
      const mark = map.get(ch);
      if (mark) {
        mark.count += 1;
      } else {
        map.set(ch, { char: ch, index, count: 1 });
      }
    }
    index += 1;
  }
  return [...map.values()].sort((a, b) => a.index - b.index);
}

/** 按 GSM-7 septet 切分；扩展字符的 ESC+码值不可跨段拆分 */
function splitGsm(text: string): Array<{ text: string; units: number }> {
  const chars = Array.from(text);
  const weightOf = (ch: string) => (EXTENSION_SET.has(ch) ? 2 : 1);
  const total = chars.reduce((sum, ch) => sum + weightOf(ch), 0);
  if (chars.length === 0) {
    return [];
  }
  const capacity = total <= GSM_SINGLE_MAX_SEPTETS ? GSM_SINGLE_MAX_SEPTETS : GSM_CONCAT_SEPTETS;
  const segments: Array<{ text: string; units: number }> = [];
  let current = '';
  let used = 0;
  chars.forEach((ch) => {
    const weight = weightOf(ch);
    if (used + weight > capacity) {
      segments.push({ text: current, units: used });
      current = '';
      used = 0;
    }
    current += ch;
    used += weight;
  });
  segments.push({ text: current, units: used });
  return segments;
}

/** 按 UCS-2 编码单元切分；代理对不可跨段拆开 */
function splitUcs2(text: string): Array<{ text: string; units: number }> {
  const chars = Array.from(text);
  const weightOf = (ch: string) => ((ch.codePointAt(0) ?? 0) > 0xffff ? 2 : 1);
  const total = chars.reduce((sum, ch) => sum + weightOf(ch), 0);
  if (chars.length === 0) {
    return [];
  }
  const capacity = total <= UCS2_SINGLE_MAX_UNITS ? UCS2_SINGLE_MAX_UNITS : UCS2_CONCAT_UNITS;
  const segments: Array<{ text: string; units: number }> = [];
  let current = '';
  let used = 0;
  chars.forEach((ch) => {
    const weight = weightOf(ch);
    // 剩余 1 个单元时遇到代理对（2 单元）：整字符挪到下一段
    if (used + weight > capacity || (weight === 2 && used === capacity - 1)) {
      segments.push({ text: current, units: used });
      current = '';
      used = 0;
    }
    current += ch;
    used += weight;
  });
  segments.push({ text: current, units: used });
  return segments;
}

/**
 * 分析短信文本的编码方式、长度与分片
 *
 * @param text - 短信原文
 * @param mode - auto（默认，自动判定）/ gsm7 / ucs2（强制）
 */
export function analyzeSms(text: string, mode: SmsEncodingMode = 'auto'): SmsAnalysis {
  const chars = Array.from(text);
  const extensionChars = collectMarks(text, (ch) => EXTENSION_SET.has(ch));
  const nonGsmChars = collectMarks(text, (ch) => !BASIC_SET.has(ch) && !EXTENSION_SET.has(ch));
  const warnings: string[] = [];

  let encoding: SmsEncoding;
  if (mode === 'gsm7') {
    encoding = 'gsm7';
    if (nonGsmChars.length > 0) {
      warnings.push(
        `存在 ${nonGsmChars.reduce((sum, mark) => sum + mark.count, 0)} 个 GSM 默认字母表之外的字符，强制 GSM-7 时无法编码，实际发送将失败或被网关替换。`,
      );
    }
  } else if (mode === 'ucs2') {
    encoding = 'ucs2';
  } else {
    encoding = nonGsmChars.length > 0 ? 'ucs2' : 'gsm7';
  }

  const isGsm = encoding === 'gsm7';
  const rawSegments = isGsm ? splitGsm(text) : splitUcs2(text);
  const singleCapacity = isGsm ? GSM_SINGLE_MAX_SEPTETS : UCS2_SINGLE_MAX_UNITS;
  const concatCapacity = isGsm ? GSM_CONCAT_SEPTETS : UCS2_CONCAT_UNITS;
  const multipart = rawSegments.length > 1 || ((rawSegments[0]?.units ?? 0) > singleCapacity);

  const segments: SmsSegment[] = rawSegments.map((segment, i) => ({
    ordinal: i + 1,
    text: segment.text,
    units: segment.units,
    bytes: isGsm
      ? (multipart ? CONCAT_UDH_BYTES : 0) + Math.ceil((segment.units * 7) / 8)
      : (multipart ? CONCAT_UDH_BYTES : 0) + segment.units * 2,
  }));

  const totalUnits = segments.reduce((sum, segment) => sum + segment.units, 0);
  const totalBytes = segments.reduce((sum, segment) => sum + segment.bytes, 0);
  const last = segments[segments.length - 1];
  const capacityInEffect = multipart ? concatCapacity : singleCapacity;

  if (!isGsm && mode === 'auto' && nonGsmChars.length > 0) {
    warnings.push(
      `包含 ${nonGsmChars.reduce((sum, mark) => sum + mark.count, 0)} 个非 GSM 字符（如中文、emoji），编码自动切换为 UCS-2：单条容量由 160 字符降为 70 字符。`,
    );
  }
  const supplementaryCount = chars.filter((ch) => (ch.codePointAt(0) ?? 0) > 0xffff).length;
  if (!isGsm && supplementaryCount > 0) {
    warnings.push(
      `含 ${supplementaryCount} 个 BMP 之外的字符（如 emoji），在 UCS-2 中以代理对表示，每个占 2 个编码单元（4 字节）。`,
    );
  }
  if (isGsm && extensionChars.length > 0) {
    warnings.push(
      `含扩展字符（${extensionChars.map((mark) => mark.char).join(' ')}），每个需 ESC 转义，占 2 个 7-bit 单位。`,
    );
  }
  if (multipart) {
    warnings.push(
      `文本超过单条上限，将拆分为 ${segments.length} 条长短信（concat SMS），每条携带 6 字节 UDH 拼接头，运营商通常按 ${segments.length} 条计费。`,
    );
  }

  return {
    encoding,
    charCount: chars.length,
    totalUnits,
    segments,
    segmentCount: segments.length,
    singleCapacity,
    concatCapacity,
    usedInLastSegment: last?.units ?? 0,
    remainingInLastSegment: last ? capacityInEffect - last.units : singleCapacity,
    totalBytes,
    extensionChars,
    nonGsmChars,
    warnings,
  };
}
