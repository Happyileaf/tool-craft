/**
 * 游程编码（RLE）与 Apple PackBits 变体的零依赖纯函数实现
 *
 * 三种模式：
 * - text ：面向文本的计数前缀 RLE，格式为「计数 + 字符」，如 AAAA → 4A；
 *          计数为 1 时省略计数（单字符原样输出）。注意数字字符会与计数字段歧义，
 *          该格式仅适合不含阿拉伯数字的文本。
 * - byte ：字节级 RLE，输入按 UTF-8 字节序列处理，输出十六进制；
 *          每个游程为「1 字节计数值（1..255）+ 1 字节数据」。
 * - packbits：Apple PackBits 有符号标记字节格式，
 *          重复 n 个字节 → 标记 -(n-1) + 数据字节；
 *          连续 n（1..128）个字面量 → 标记 n-1 + n 个数据字节。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type RleMode = 'text' | 'byte' | 'packbits';
export type RleDirection = 'encode' | 'decode';

export interface RleResult {
  /** 编解码产物（文本模式为字符串，字节/ PackBits 模式为十六进制或还原文本） */
  output: string;
  /** 原始数据大小：编码为输入大小，解码为载荷大小（文本模式按字符数，字节模式按字节数） */
  originalSize: number;
  /** 产物大小：编码为编码后大小，解码为还原数据大小（单位与 originalSize 一致） */
  resultSize: number;
  /** 压缩率百分比（1 - 产物/原始）×100，膨胀时为负值；原始为空时为 0 */
  ratioPercent: number;
  /** 非致命提示（如文本模式逐行解码错误），不影响其他行输出 */
  warnings: string[];
  /** 致命错误（如非法十六进制、载荷截断），出错时 output 为空字符串 */
  error: string | null;
}

/** 解码计数的安全上限，防止恶意超大计数耗尽内存 */
const MAX_RUN_COUNT = 1_000_000;
/** 字节级 RLE 单游程的最大计数（1 字节无符号） */
const MAX_BYTE_RUN = 255;
/** PackBits 标记字节可表达的最大游程/字面量长度 */
const MAX_PACKBITS_RUN = 128;

/* ------------------------------------------------------------------ */
/* 通用工具                                                            */
/* ------------------------------------------------------------------ */

/** 字符串以 UTF-8 编码为字节 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** UTF-8 字节严格解码为字符串，非法序列返回中文错误信息 */
function bytesToTextStrict(bytes: Uint8Array): { text: string } | { error: string } {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { error: '还原后的字节序列不是合法的 UTF-8 文本，载荷可能已损坏' };
  }
}

/** Uint8Array → 小写紧凑 Hex（如 1f8b） */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 严格解析 Hex 为 Uint8Array，自动忽略空白；
 * 奇数长度或含非法字符时返回中文错误信息而非抛出
 */
function parseHex(hex: string): { bytes: Uint8Array } | { error: string } {
  const cleaned = hex.replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { bytes: new Uint8Array(0) };
  }
  if (cleaned.length % 2 !== 0) {
    return { error: 'Hex 长度必须为偶数，当前输入存在落单的半字节' };
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return { error: 'Hex 只能包含 0-9、a-f 字符（空白可忽略），检测到非法字符' };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return { bytes };
}

/** 有符号 8 位转换：128..255 映射为 -128..-1 */
function toInt8(value: number): number {
  return value > 127 ? value - 256 : value;
}

/**
 * 压缩率百分比：(1 - 产物大小 / 原始大小) × 100；
 * 膨胀（产物更大）时如实返回负值，原始为空时返回 0（除零安全）
 */
export function compressionPercent(resultSize: number, originalSize: number): number {
  if (originalSize <= 0) return 0;
  return ((originalSize - resultSize) / originalSize) * 100;
}

function emptyResult(): RleResult {
  return {
    output: '',
    originalSize: 0,
    resultSize: 0,
    ratioPercent: 0,
    warnings: [],
    error: null,
  };
}

/* ------------------------------------------------------------------ */
/* 文本模式：计数前缀 RLE（逐行处理）                                    */
/* ------------------------------------------------------------------ */

/** 单行文本编码：连续重复 n 次的字符输出「n字符」，n 为 1 时省略计数 */
export function encodeTextLine(line: string): string {
  const chars = Array.from(line);
  const tokens: string[] = [];
  let index = 0;
  while (index < chars.length) {
    const char = chars[index] ?? '';
    let run = 1;
    while (index + run < chars.length && chars[index + run] === char) {
      run += 1;
    }
    tokens.push(run === 1 ? char : `${run}${char}`);
    index += run;
  }
  return tokens.join('');
}

/**
 * 单行文本解码，数字前缀作为计数（无计数视为 1）。
 * 返回该行的还原文本或可读中文错误。
 */
export function decodeTextLine(line: string): { text: string } | { error: string } {
  const chars = Array.from(line);
  const pieces: string[] = [];
  let index = 0;
  while (index < chars.length) {
    let digits = '';
    while (index < chars.length && /\d/.test(chars[index] ?? '')) {
      digits += chars[index] ?? '';
      index += 1;
    }
    if (index >= chars.length) {
      return { error: `编码片段「${digits}」缺少计数值后的字符，编码不完整` };
    }
    const char = chars[index] ?? '';
    index += 1;
    if (digits === '') {
      pieces.push(char);
      continue;
    }
    const count = Number(digits);
    if (count === 0) {
      return { error: `计数不能为 0（片段「0${char}」），合法计数范围为 1..${MAX_RUN_COUNT}` };
    }
    if (count > MAX_RUN_COUNT) {
      return { error: `计数 ${count} 超过安全上限 ${MAX_RUN_COUNT}，请检查输入是否正确` };
    }
    pieces.push(char.repeat(count));
  }
  return { text: pieces.join('') };
}

function encodeText(input: string): RleResult {
  const lines = input.split('\n');
  const output = lines.map(encodeTextLine).join('\n');
  const originalSize = Array.from(input).length;
  return {
    output,
    originalSize,
    resultSize: Array.from(output).length,
    ratioPercent: compressionPercent(Array.from(output).length, originalSize),
    warnings: [],
    error: null,
  };
}

function decodeText(input: string): RleResult {
  const warnings: string[] = [];
  const outputs = input.split('\n').map((line, lineIndex) => {
    if (line === '') return '';
    const decoded = decodeTextLine(line);
    if ('error' in decoded) {
      warnings.push(`第 ${lineIndex + 1} 行：${decoded.error}`);
      return line;
    }
    return decoded.text;
  });
  const output = outputs.join('\n');
  const resultSize = Array.from(output).length;
  return {
    output,
    originalSize: Array.from(input).length,
    resultSize,
    ratioPercent: compressionPercent(resultSize, Array.from(input).length),
    warnings,
    error: null,
  };
}

/* ------------------------------------------------------------------ */
/* 字节级 RLE：「计数(1B) + 数据(1B)」对，Hex 承载                       */
/* ------------------------------------------------------------------ */

function encodeByteRle(input: string): RleResult {
  const source = textToBytes(input);
  const encoded: number[] = [];
  let index = 0;
  while (index < source.length) {
    const value = source[index] ?? 0;
    let run = 1;
    while (index + run < source.length && (source[index + run] ?? -1) === value && run < MAX_BYTE_RUN) {
      run += 1;
    }
    encoded.push(run, value);
    index += run;
  }
  const payload = new Uint8Array(encoded);
  return {
    output: bytesToHex(payload),
    originalSize: source.length,
    resultSize: payload.length,
    ratioPercent: compressionPercent(payload.length, source.length),
    warnings: [],
    error: null,
  };
}

function decodeByteRle(input: string): RleResult {
  const parsed = parseHex(input);
  if ('error' in parsed) {
    return { ...emptyResult(), error: parsed.error };
  }
  const payload = parsed.bytes;
  if (payload.length === 0) return emptyResult();
  if (payload.length % 2 !== 0) {
    return {
      ...emptyResult(),
      error: `字节级 RLE 载荷必须为「计数字节 + 数据字节」成对出现，当前为 ${payload.length} 个字节，缺少数据字节`,
    };
  }
  const decoded: number[] = [];
  for (let i = 0; i < payload.length; i += 2) {
    const count = payload[i] ?? 0;
    if (count === 0) {
      return {
        ...emptyResult(),
        error: `第 ${i / 2 + 1} 个游程的计数字节为 0x00，合法计数范围为 1..255`,
      };
    }
    if (decoded.length + count > MAX_RUN_COUNT) {
      return { ...emptyResult(), error: `解码结果超过安全上限 ${MAX_RUN_COUNT} 字节，请检查载荷` };
    }
    const value = payload[i + 1] ?? 0;
    for (let j = 0; j < count; j += 1) decoded.push(value);
  }
  const bytes = new Uint8Array(decoded);
  const text = bytesToTextStrict(bytes);
  if ('error' in text) return { ...emptyResult(), error: text.error };
  return {
    output: text.text,
    originalSize: payload.length,
    resultSize: bytes.length,
    ratioPercent: compressionPercent(bytes.length, payload.length),
    warnings: [],
    error: null,
  };
}

/* ------------------------------------------------------------------ */
/* Apple PackBits：有符号标记字节                                       */
/* ------------------------------------------------------------------ */

/**
 * PackBits 编码：
 * - 至少 3 个相同字节才作为重复游程（2 个重复并入字面量，这是主流编码器的取舍）；
 * - 重复 n 个字节输出标记 (-(n-1)) 与 1 个数据字节，n 上限 128；
 * - 连续字面量每 128 个一组，输出标记 (n-1) 与 n 个数据字节。
 */
export function encodePackBits(input: string): Uint8Array {
  const source = textToBytes(input);
  const out: number[] = [];
  let index = 0;
  while (index < source.length) {
    const current = source[index] ?? 0;
    let run = 1;
    while (index + run < source.length && (source[index + run] ?? -1) === current) {
      run += 1;
    }
    if (run >= 3) {
      let remaining = run;
      while (remaining >= 3) {
        const chunk = Math.min(remaining, MAX_PACKBITS_RUN);
        out.push(257 - chunk, current); // -(chunk-1) 的无符号表示：256-(chunk-1)=257-chunk
        remaining -= chunk;
      }
      if (remaining > 0) {
        // 128 分组后残余 1..2 个字节无法再作重复游程，按字面量段输出
        out.push(remaining - 1);
        for (let i = 0; i < remaining; i += 1) out.push(current);
      }
      index += run;
      continue;
    }
    // 字面量：从当前位置收集至多 128 个「不构成 3 连同值」的字节
    const literal: number[] = [];
    while (index < source.length && literal.length < MAX_PACKBITS_RUN) {
      const head = source[index] ?? 0;
      let peek = 1;
      while (index + peek < source.length && (source[index + peek] ?? -1) === head) {
        peek += 1;
      }
      if (peek >= 3) break;
      literal.push(head);
      index += 1;
    }
    out.push(literal.length - 1, ...literal);
  }
  return new Uint8Array(out);
}

/**
 * PackBits 解码，按标记字节逐段还原：
 * - 0..127：后随 n+1 个字面量字节；
 * - -128（0x80）：PackBits 规定的无操作填充，跳过；
 * * -127..-1：后随 1 个字节，重复 (1-n) 次。
 */
export function decodePackBits(payload: Uint8Array): Uint8Array {
  const out: number[] = [];
  let index = 0;
  while (index < payload.length) {
    const marker = toInt8(payload[index] ?? 0);
    index += 1;
    if (marker >= 0) {
      const count = marker + 1;
      if (index + count > payload.length) {
        throw new Error(
          `PackBits 字面量段在第 ${index} 字节处被截断：标记要求 ${count} 个数据字节，剩余 ${payload.length - index} 个`,
        );
      }
      for (let i = 0; i < count; i += 1) {
        out.push(payload[index] ?? 0);
        index += 1;
      }
    } else if (marker === -128) {
      // 无操作填充字节，跳过
    } else {
      const count = 1 - marker;
      if (index >= payload.length) {
        throw new Error('PackBits 重复游程缺少数据字节，载荷已被截断');
      }
      if (out.length + count > MAX_RUN_COUNT) {
        throw new Error(`解码结果超过安全上限 ${MAX_RUN_COUNT} 字节，请检查载荷`);
      }
      const value = payload[index] ?? 0;
      index += 1;
      for (let i = 0; i < count; i += 1) out.push(value);
    }
  }
  return new Uint8Array(out);
}

function encodePackBitsMode(input: string): RleResult {
  const source = textToBytes(input);
  const payload = encodePackBits(input);
  return {
    output: bytesToHex(payload),
    originalSize: source.length,
    resultSize: payload.length,
    ratioPercent: compressionPercent(payload.length, source.length),
    warnings: [],
    error: null,
  };
}

function decodePackBitsMode(input: string): RleResult {
  const parsed = parseHex(input);
  if ('error' in parsed) {
    return { ...emptyResult(), error: parsed.error };
  }
  if (parsed.bytes.length === 0) return emptyResult();
  try {
    const bytes = decodePackBits(parsed.bytes);
    const text = bytesToTextStrict(bytes);
    if ('error' in text) return { ...emptyResult(), error: text.error };
    return {
      output: text.text,
      originalSize: parsed.bytes.length,
      resultSize: bytes.length,
      ratioPercent: compressionPercent(bytes.length, parsed.bytes.length),
      warnings: [],
      error: null,
    };
  } catch (e) {
    return { ...emptyResult(), error: e instanceof Error ? e.message : 'PackBits 解码失败' };
  }
}

/* ------------------------------------------------------------------ */
/* 统一入口：所有异常收敛为结果对象，绝不向外抛出                         */
/* ------------------------------------------------------------------ */

export function runRle(input: string, mode: RleMode, direction: RleDirection): RleResult {
  if (input === '') return emptyResult();
  try {
    if (mode === 'text') {
      return direction === 'encode' ? encodeText(input) : decodeText(input);
    }
    if (mode === 'byte') {
      return direction === 'encode' ? encodeByteRle(input) : decodeByteRle(input);
    }
    return direction === 'encode' ? encodePackBitsMode(input) : decodePackBitsMode(input);
  } catch (e) {
    return {
      ...emptyResult(),
      error: e instanceof Error ? e.message : '处理过程中发生未知错误',
    };
  }
}
