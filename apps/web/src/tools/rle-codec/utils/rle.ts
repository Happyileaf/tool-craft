/**
 * 游程编码（RLE）工具集：基础字节 RLE 与 Apple PackBits 变体。
 * 全部为纯字节数组运算，无外部依赖；固定输入必有固定输出。
 */

export interface EncodeResult {
  /** 编码后的字节序列（基础 RLE 为 count/byte 成对输出；PackBits 为标记头+数据） */
  bytes: number[];
  originalLength: number;
  encodedLength: number;
  /** 压缩率：(原始 - 编码后) / 原始，百分比；负值表示膨胀 */
  compressionRatio: number;
}

export interface DecodeResult {
  bytes: number[];
  error: string | null;
}

const MAX_RUN = 255;

/** 基础 RLE 编码：输出 [count, byte, count, byte, ...]，单字节游程 count=1，超长游程按 255 截断拆分 */
export function encodeBasicRle(input: number[]): EncodeResult {
  const bytes: number[] = [];
  let i = 0;
  while (i < input.length) {
    const value = input[i] ?? 0;
    let run = 1;
    while (i + run < input.length && input[i + run] === value && run < MAX_RUN) {
      run += 1;
    }
    bytes.push(run, value);
    i += run;
  }
  return buildResult(input.length, bytes);
}

/** 基础 RLE 解码：要求偶数长度的 count/byte 序列，count 必须为 1..255 */
export function decodeBasicRle(encoded: number[]): DecodeResult {
  if (encoded.length % 2 !== 0) {
    return { bytes: [], error: '基础 RLE 数据长度必须为偶数（count/byte 成对）' };
  }
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 2) {
    const count = encoded[i] ?? 0;
    const value = encoded[i + 1] ?? 0;
    if (count < 1 || count > MAX_RUN) {
      return { bytes: [], error: `第 ${i / 2 + 1} 组 count=${count} 越界，合法范围为 1..255` };
    }
    for (let k = 0; k < count; k += 1) bytes.push(value);
  }
  return { bytes, error: null };
}

/**
 * Apple PackBits 编码。
 * 标记头 n 为有符号字节：
 * - n ∈ [0,127]：后接 n+1 个字面字节
 * - n ∈ [-127,-1]：后接 1 个字节，重复 1-n 次（即 2..128 次）
 * - n = -128（0x80）：无操作，解码时跳过
 */
export function encodePackBits(input: number[]): EncodeResult {
  const bytes: number[] = [];
  let i = 0;

  while (i < input.length) {
    // 向后探测重复游程长度
    let run = 1;
    while (i + run < input.length && input[i + run] === input[i] && run < 128) {
      run += 1;
    }

    if (run >= 2) {
      // 重复段：n = 1 - run（范围 -127..-1）
      bytes.push(toSignedByte(1 - run), input[i] ?? 0);
      i += run;
    } else {
      // 字面段：收集直到出现 2 连重复或达到 128 字节上限
      const literal: number[] = [];
      while (
        i < input.length &&
        literal.length < 128 &&
        !(i + 1 < input.length && input[i] === input[i + 1])
      ) {
        literal.push(input[i] ?? 0);
        i += 1;
      }
      // 边界：剩余不足 2 连且字面段将超限时，直接吞掉余下字节（下一轮处理）
      if (literal.length === 0) continue;
      bytes.push(toSignedByte(literal.length - 1), ...literal);
    }
  }

  return buildResult(input.length, bytes);
}

/** PackBits 解码：按标记头语义展开，0x80 无操作跳过，畸形长度带定位报错 */
export function decodePackBits(encoded: number[]): DecodeResult {
  const bytes: number[] = [];
  let i = 0;
  while (i < encoded.length) {
    const header = fromSignedByte(encoded[i] ?? 0);
    i += 1;
    if (header === -128) {
      // NOP
      continue;
    }
    if (header >= 0) {
      const literalCount = header + 1;
      if (i + literalCount > encoded.length) {
        return {
          bytes: [],
          error: `偏移 ${i - 1} 处字面段声明 ${literalCount} 字节，但剩余数据不足`,
        };
      }
      for (let k = 0; k < literalCount; k += 1) {
        bytes.push(encoded[i] ?? 0);
        i += 1;
      }
    } else {
      const repeatCount = 1 - header;
      if (i >= encoded.length) {
        return { bytes: [], error: `偏移 ${i - 1} 处重复段缺少数据字节` };
      }
      const value = encoded[i] ?? 0;
      i += 1;
      for (let k = 0; k < repeatCount; k += 1) bytes.push(value);
    }
  }
  return { bytes, error: null };
}

function buildResult(originalLength: number, encoded: number[]): EncodeResult {
  const encodedLength = encoded.length;
  const compressionRatio =
    originalLength === 0 ? 0 : ((originalLength - encodedLength) / originalLength) * 100;
  return { bytes: encoded, originalLength, encodedLength, compressionRatio };
}

/** 有符号标记头转无符号字节存储（-127..127 → 129..255 / 0..127） */
function toSignedByte(n: number): number {
  return n < 0 ? n + 256 : n;
}

/** 无符号字节还原为有符号标记头 */
function fromSignedByte(byte: number): number {
  return byte > 127 ? byte - 256 : byte;
}

/** 解析 HEX 字符串（允许空格/0x 前缀/换行），失败时返回带定位的错误 */
export function parseHex(hex: string): { bytes: number[]; error: string | null } {
  const cleaned = hex
    .replace(/0x/gi, '')
    .replace(/[\s,]/g, '');
  if (cleaned.length === 0) return { bytes: [], error: null };
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    const badIndex = cleaned.search(/[^0-9a-fA-F]/);
    return { bytes: [], error: `含非 HEX 字符，首个非法位置在第 ${badIndex + 1} 个字符附近` };
  }
  if (cleaned.length % 2 !== 0) {
    return { bytes: [], error: 'HEX 字符数必须为偶数（完整字节）' };
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return { bytes, error: null };
}

/** 字节数组转大写 HEX，可带空格分隔 */
export function toHex(bytes: number[], spaced = true): string {
  const hex = bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0'));
  return spaced ? hex.join(' ') : hex.join('');
}

/** 文本按 UTF-8 编码为字节数组 */
export function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** 字节数组按 UTF-8 解码为文本，失败字节用替换符号 */
export function bytesToText(bytes: number[]): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bytes));
}
