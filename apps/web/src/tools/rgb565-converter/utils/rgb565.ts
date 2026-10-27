import { EndianEnum, PixelFormatEnum } from '../constants';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface EncodeResult {
  value: number;
  highByte: number;
  lowByte: number;
  bytes: [number, number];
  restored: RgbColor;
  distance: number;
}

export interface DecodeResult {
  value: number;
  highByte: number;
  lowByte: number;
  bytes: [number, number];
  color: RgbColor;
  hex: string;
}

export interface BatchRow {
  source: string;
  ok: boolean;
  value?: number;
  literal?: string;
  highByte?: string;
  lowByte?: string;
  bytesText?: string;
  hex?: string;
  color?: RgbColor;
  distance?: number;
  error?: string;
}

/**
 * 解析 #RRGGBB / RRGGBB（大小写不敏感）为 RGB 通道。
 *
 * @param input - 颜色文本
 * @returns RGB 通道
 */
export function parseHexColor(input: string): RgbColor {
  const text = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(text)) {
    throw new Error('颜色格式无效，仅支持 6 位十六进制，示例：#3B82F6');
  }
  const r = parseInt(text.slice(0, 2), 16);
  const g = parseInt(text.slice(2, 4), 16);
  const b = parseInt(text.slice(4, 6), 16);
  return { r, g, b };
}

/**
 * 解析 16 位像素值（可带 0x 前缀），范围限定 0x0000–0xFFFF。
 *
 * @param input - 像素值文本
 * @returns 16 位整数
 */
export function parsePixelValue(input: string): number {
  const text = input.trim().replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]{1,4}$/.test(text)) {
    throw new Error('像素值格式无效，仅支持 0x0000–0xFFFF 的十六进制值');
  }
  const value = parseInt(text, 16);
  if (value < 0 || value > 0xffff) {
    throw new Error('像素值超出范围，仅支持 0x0000–0xFFFF');
  }
  return value;
}

/**
 * 将 24 位 RGB 打包为 16 位像素值。
 *
 * @param r - 红色通道（0–255）
 * @param g - 绿色通道（0–255）
 * @param b - 蓝色通道（0–255）
 * @param format - 像素格式（RGB565 / RGB555）
 * @returns 16 位像素值
 */
export function rgbToPixel(r: number, g: number, b: number, format: PixelFormatEnum): number {
  if (format === PixelFormatEnum.RGB555) {
    return ((r & 0xf8) << 7) | ((g & 0xf8) << 2) | (b >> 3);
  }
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
}

/**
 * 按字节序拆分 16 位像素值。
 *
 * @param value - 16 位像素值
 * @param endian - 大端 / 小端
 * @returns 长度为 2 的字节数组
 */
export function pixelToBytes(value: number, endian: EndianEnum): [number, number] {
  const high = (value >> 8) & 0xff;
  const low = value & 0xff;
  return endian === EndianEnum.BIG ? [high, low] : [low, high];
}

/**
 * 将 16 位像素值还原为 RGB888，位域低位补 1 扩展以减小量化误差。
 *
 * @param value - 16 位像素值
 * @param format - 像素格式（RGB565 / RGB555）
 * @returns RGB 通道
 */
export function pixelToRgb(value: number, format: PixelFormatEnum): RgbColor {
  if (format === PixelFormatEnum.RGB555) {
    const r5 = (value >> 10) & 0x1f;
    const g5 = (value >> 5) & 0x1f;
    const b5 = value & 0x1f;
    return {
      r: (r5 << 3) | 0x07,
      g: (g5 << 3) | 0x07,
      b: (b5 << 3) | 0x07,
    };
  }
  const r5 = (value >> 11) & 0x1f;
  const g6 = (value >> 5) & 0x3f;
  const b5 = value & 0x1f;
  return {
    r: (r5 << 3) | 0x07,
    g: (g6 << 2) | 0x03,
    b: (b5 << 3) | 0x07,
  };
}

/**
 * 计算两个 RGB 颜色的欧氏距离，用于量化色差展示。
 *
 * @param a - 颜色 A
 * @param b - 颜色 B
 * @returns RGB 空间欧氏距离
 */
export function colorDistance(a: RgbColor, b: RgbColor): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 16 位值格式化为 C 语言十六进制字面量，如 0xF800。
 *
 * @param value - 16 位像素值
 * @returns 0xXXXX 文本
 */
export function toHexLiteral(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * 单字节格式化为两位十六进制，如 F8。
 *
 * @param byte - 字节值
 * @returns 两位十六进制文本
 */
export function toByteHex(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * RGB 通道格式化为 #RRGGBB。
 *
 * @param r - 红色通道
 * @param g - 绿色通道
 * @param b - 蓝色通道
 * @returns #RRGGBB 文本
 */
export function toHexColor(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => toByteHex(channel)).join('')}`;
}

/**
 * 正向转换单行颜色：RGB888 → 16 位像素。
 *
 * @param input - 颜色文本
 * @param format - 像素格式
 * @param endian - 字节序
 * @returns 转换结果
 */
export function encodeColor(
  input: string,
  format: PixelFormatEnum,
  endian: EndianEnum,
): EncodeResult {
  const { r, g, b } = parseHexColor(input);
  const value = rgbToPixel(r, g, b, format);
  const bytes = pixelToBytes(value, endian);
  const highByte = (value >> 8) & 0xff;
  const lowByte = value & 0xff;
  const restored = pixelToRgb(value, format);
  const distance = colorDistance({ r, g, b }, restored);
  return { value, highByte, lowByte, bytes, restored, distance };
}

/**
 * 反向转换单行像素值：16 位像素 → RGB888。
 *
 * @param input - 像素值文本
 * @param format - 像素格式
 * @param endian - 字节序
 * @returns 转换结果
 */
export function decodeColor(
  input: string,
  format: PixelFormatEnum,
  endian: EndianEnum,
): DecodeResult {
  const value = parsePixelValue(input);
  const bytes = pixelToBytes(value, endian);
  const highByte = (value >> 8) & 0xff;
  const lowByte = value & 0xff;
  const color = pixelToRgb(value, format);
  return { value, highByte, lowByte, bytes, color, hex: toHexColor(color.r, color.g, color.b) };
}

/**
 * 批量转换多行输入，空行跳过，每行独立解析与报错。
 *
 * @param text - 多行输入
 * @param format - 像素格式
 * @param endian - 字节序
 * @param mode - encode 正向 / decode 反向
 * @returns 每行转换结果
 */
export function convertBatch(
  text: string,
  format: PixelFormatEnum,
  endian: EndianEnum,
  mode: 'encode' | 'decode',
): BatchRow[] {
  const rows: BatchRow[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine) => {
    const source = rawLine.trim();
    if (!source) {
      return;
    }
    try {
      if (mode === 'encode') {
        const result = encodeColor(source, format, endian);
        rows.push({
          source,
          ok: true,
          value: result.value,
          literal: toHexLiteral(result.value),
          highByte: toByteHex(result.highByte),
          lowByte: toByteHex(result.lowByte),
          bytesText: result.bytes.map(toByteHex).join(' '),
          hex: toHexColor(result.restored.r, result.restored.g, result.restored.b),
          color: result.restored,
          distance: result.distance,
        });
      } else {
        const result = decodeColor(source, format, endian);
        rows.push({
          source,
          ok: true,
          value: result.value,
          literal: toHexLiteral(result.value),
          highByte: toByteHex(result.highByte),
          lowByte: toByteHex(result.lowByte),
          bytesText: result.bytes.map(toByteHex).join(' '),
          hex: result.hex,
          color: result.color,
        });
      }
    } catch (error) {
      rows.push({
        source,
        ok: false,
        error: error instanceof Error ? error.message : '转换失败',
      });
    }
  });
  return rows;
}
