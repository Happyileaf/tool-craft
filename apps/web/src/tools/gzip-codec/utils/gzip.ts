/**
 * GZip / Deflate 压缩解压的零依赖工具函数
 *
 * 基于浏览器原生 CompressionStream / DecompressionStream；
 * Hex / Base64 与字节数组的转换为纯函数，便于在 Node 下单测。
 */

/** 支持的压缩算法（CompressionStream format） */
export type GzipAlgorithm = 'gzip' | 'deflate';

export const GZIP_MAGIC = [0x1f, 0x8b] as const;

/** Uint8Array → 小写 Hex（如 1f8b） */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hex → Uint8Array，自动去除空白；非法字符或奇数长度抛出 Error（中文信息）
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s+/g, '');
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex 长度必须为偶数');
  }
  if (cleaned.length > 0 && !/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('Hex 只能包含 0-9、a-f 字符');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Uint8Array → Base64（Node 与浏览器均可运行） */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Base64 → Uint8Array，非法字符抛出 Error（中文信息） */
export function base64ToBytes(base64: string): Uint8Array {
  const cleaned = base64.replace(/\s+/g, '');
  if (cleaned.length > 0 && !/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    throw new Error('Base64 包含非法字符');
  }
  let binary: string;
  try {
    binary = atob(cleaned);
  } catch {
    throw new Error('Base64 格式无效，无法解码');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 字符串以 UTF-8 编码为字节 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** UTF-8 字节解码为字符串 */
export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

/** 汇聚 ReadableStream 的全部数据块 */
async function drainStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/** 当前运行环境是否支持原生压缩流 */
export function isCompressionSupported(): boolean {
  return (
    typeof CompressionStream !== 'undefined' &&
    typeof DecompressionStream !== 'undefined'
  );
}

/**
 * 压缩 UTF-8 文本，返回压缩后的字节
 *
 * @param text - 原始文本
 * @param algorithm - gzip 或 deflate
 */
export async function compressText(
  text: string,
  algorithm: GzipAlgorithm = 'gzip',
): Promise<Uint8Array> {
  if (!isCompressionSupported()) {
    throw new Error('当前浏览器不支持 CompressionStream，无法压缩');
  }
  const input = new Blob([textToBytes(text) as BlobPart]);
  const stream = input.stream().pipeThrough(new CompressionStream(algorithm));
  return drainStream(stream);
}

/**
 * 解压字节为 UTF-8 文本，格式错误时抛出带中文说明的 Error
 *
 * @param bytes - 压缩载荷
 * @param algorithm - gzip 或 deflate
 */
export async function decompressBytes(
  bytes: Uint8Array,
  algorithm: GzipAlgorithm = 'gzip',
): Promise<string> {
  if (!isCompressionSupported()) {
    throw new Error('当前浏览器不支持 DecompressionStream，无法解压');
  }
  if (bytes.length === 0) {
    throw new Error('载荷为空，没有可解压的数据');
  }
  if (algorithm === 'gzip' && (bytes[0] !== GZIP_MAGIC[0] || bytes[1] !== GZIP_MAGIC[1])) {
    throw new Error(
      `不是有效的 gzip 数据：应以魔数 1f 8b 开头，实际为 ${bytesToHex(bytes.subarray(0, 2))}`,
    );
  }
  try {
    const input = new Blob([bytes as BlobPart]);
    const stream = input.stream().pipeThrough(new DecompressionStream(algorithm));
    const output = await drainStream(stream);
    return bytesToText(output);
  } catch {
    throw new Error('解压失败：数据已损坏、被截断或算法选择不正确');
  }
}

/**
 * 计算压缩率：压缩后 / 原始；原始为空时返回 0（除零安全）
 *
 * @returns 0–1 区间的比率
 */
export function compressionRatio(compressedBytes: number, originalBytes: number): number {
  if (originalBytes <= 0) return 0;
  return compressedBytes / originalBytes;
}
