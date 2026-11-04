import {
  BASE64_MARKER,
  DATA_URI_PREFIX,
  DEFAULT_IMAGE_TYPE,
  SUPPORTED_IMAGE_TYPES,
} from '../constants';

/**
 * 解析后的 Data URI 结构
 */
export interface ParsedDataUri {
  /** 完整媒体类型，如 image/png */
  mimeType: string;
  /** 是否为 base64 编码 */
  isBase64: boolean;
  /** 逗号之后的原始数据部分 */
  data: string;
}

/**
 * 判断 MIME 类型是否在受支持的图片白名单内
 *
 * @param mimeType - 待判断的 MIME 类型
 * @returns 受支持返回 true
 */
export function isSupportedImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

/**
 * 解析并校验 Data URI 字符串
 *
 * 仅接受 data: 协议、图片 MIME 且为 base64 编码的输入；
 * URL 编码形式（不含 ;base64）与非图片类型一律拒绝
 *
 * @param input - 待解析的 Data URI 文本
 * @returns 解析结果；非法时返回 null
 */
export function parseDataUri(input: string): ParsedDataUri | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith(DATA_URI_PREFIX)) {
    return null;
  }

  const commaIndex = trimmed.indexOf(',');
  if (commaIndex < 0) {
    return null;
  }

  const header = trimmed.slice(DATA_URI_PREFIX.length, commaIndex);
  const data = trimmed.slice(commaIndex + 1);
  if (data.length === 0) {
    return null;
  }

  const isBase64 = header.endsWith(BASE64_MARKER.slice(0, -1));
  if (!isBase64) {
    return null;
  }

  // header 形如 image/png;base64，去掉 ;base64 后得到媒体类型
  const mimeType = header
    .slice(0, header.length - (BASE64_MARKER.length - 1))
    .toLowerCase();

  if (!mimeType.startsWith('image/') || !isSupportedImageType(mimeType)) {
    return null;
  }

  if (!isValidBase64(data)) {
    return null;
  }

  return { mimeType, isBase64: true, data };
}

/**
 * 宽松校验字符串是否为合法 base64（允许填充等号与空白）
 *
 * @param value - 待校验字符串
 * @returns 合法返回 true
 */
export function isValidBase64(value: string): boolean {
  if (value.length === 0) {
    return false;
  }
  const normalized = value.replace(/\s/g, '');
  if (normalized.length % 4 !== 0) {
    return false;
  }
  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

/**
 * 由 MIME 类型与 base64 字符串拼装完整 Data URI
 *
 * @param mimeType - 图片 MIME 类型
 * @param base64 - 不含 data: 前缀的 base64 载荷
 * @returns 完整 Data URI 字符串
 */
export function buildDataUri(mimeType: string, base64: string): string {
  const type = isSupportedImageType(mimeType)
    ? mimeType.toLowerCase()
    : DEFAULT_IMAGE_TYPE;
  return `${DATA_URI_PREFIX}${type}${BASE64_MARKER}${base64}`;
}

/**
 * 把 base64 字符串解码为字节数组（浏览器 atob，Node 测试环境同样可用）
 *
 * @param base64 - 合法 base64 字符串
 * @returns 解码后的 Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 把字节数组编码为 base64 字符串（浏览器 btoa）
 *
 * @param bytes - 待编码字节
 * @returns base64 字符串
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  // 分块处理避免大文件下 String.fromCharCode 参数过多导致栈溢出
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * 根据文件头魔数探测图片真实 MIME 类型
 *
 * 用于在解码 Data URI 后交叉验证声明类型与实际内容是否一致；
 * 无法识别时返回 null
 *
 * @param bytes - 文件字节
 * @returns 探测到的 MIME 类型，无法识别返回 null
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (pngSignature.every((byte, index) => bytes[index] === byte)) {
      return 'image/png';
    }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 6) {
    // GIF87a / GIF89a
    const gif = [0x47, 0x49, 0x46, 0x38];
    if (gif.every((byte, index) => bytes[index] === byte) && (bytes[4] === 0x37 || bytes[4] === 0x39)) {
      return 'image/gif';
    }
  }
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }
  // SVG 为文本，检查开头是否含 <svg（跳过 BOM 与空白）
  const head = new TextDecoder()
    .decode(bytes.subarray(0, Math.min(bytes.length, 256)))
    .trimStart()
    .toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) {
    return 'image/svg+xml';
  }
  return null;
}

/**
 * 依据 MIME 类型返回常用文件扩展名
 *
 * @param mimeType - 图片 MIME 类型
 * @returns 扩展名（不含点），未知类型回退 png
 */
export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/avif': 'avif',
  };
  return map[mimeType.toLowerCase()] ?? 'png';
}

/**
 * 把字节数格式化为带单位的可读字符串
 *
 * @param bytes - 字节数
 * @returns 如 "1.50 KB" 的可读文本
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}
