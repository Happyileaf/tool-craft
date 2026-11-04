import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  buildDataUri,
  bytesToBase64,
  formatBytes,
  getExtensionFromMime,
  isSupportedImageType,
  isValidBase64,
  parseDataUri,
  sniffImageMime,
} from './data-uri';

/**
 * 测试用 1x1 透明 PNG 的 base64（真实合法 PNG 魔数）
 */
const PNG_1PX_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const PNG_DATA_URI = `data:image/png;base64,${PNG_1PX_BASE64}`;

describe('isSupportedImageType', () => {
  it('白名单内图片类型通过，大小写不敏感', () => {
    expect(isSupportedImageType('image/png')).toBe(true);
    expect(isSupportedImageType('IMAGE/JPEG')).toBe(true);
    expect(isSupportedImageType('image/webp')).toBe(true);
  });

  it('非图片或未知类型拒绝', () => {
    expect(isSupportedImageType('text/plain')).toBe(false);
    expect(isSupportedImageType('application/json')).toBe(false);
    expect(isSupportedImageType('image/tiff')).toBe(false);
  });
});

describe('isValidBase64', () => {
  it('合法 base64 通过', () => {
    expect(isValidBase64('aGVsbG8=')).toBe(true);
    expect(isValidBase64(PNG_1PX_BASE64)).toBe(true);
    expect(isValidBase64('aGVs bG8=\n')).toBe(true);
  });

  it('空串、长度非 4 倍数、含非法字符拒绝', () => {
    expect(isValidBase64('')).toBe(false);
    expect(isValidBase64('abc')).toBe(false);
    expect(isValidBase64('ab!c')).toBe(false);
  });
});

describe('parseDataUri', () => {
  it('正确解析合法图片 Data URI', () => {
    const parsed = parseDataUri(PNG_DATA_URI);
    expect(parsed).not.toBeNull();
    expect(parsed?.mimeType).toBe('image/png');
    expect(parsed?.isBase64).toBe(true);
    expect(parsed?.data).toBe(PNG_1PX_BASE64);
  });

  it('容忍前后空白', () => {
    const parsed = parseDataUri(`  ${PNG_DATA_URI}  `);
    expect(parsed?.mimeType).toBe('image/png');
  });

  it('拒绝非 data: 协议', () => {
    expect(parseDataUri('https://example.com/a.png')).toBeNull();
  });

  it('拒绝缺少逗号的输入', () => {
    expect(parseDataUri('data:image/png;base64')).toBeNull();
  });

  it('拒绝非图片 MIME', () => {
    expect(parseDataUri('data:text/plain;base64,aGVsbG8=')).toBeNull();
  });

  it('拒绝 URL 编码（非 base64）形式', () => {
    expect(parseDataUri('data:image/png,hello%20world')).toBeNull();
  });

  it('拒绝空载荷与非法 base64', () => {
    expect(parseDataUri('data:image/png;base64,')).toBeNull();
    expect(parseDataUri('data:image/png;base64,ab!c')).toBeNull();
  });
});

describe('buildDataUri', () => {
  it('拼装完整 Data URI', () => {
    expect(buildDataUri('image/png', 'aGVsbG8=')).toBe(
      'data:image/png;base64,aGVsbG8=',
    );
  });

  it('未知 MIME 回退到默认 png 并转小写', () => {
    expect(buildDataUri('image/unknown', 'aGVs')).toBe(
      'data:image/png;base64,aGVs',
    );
    expect(buildDataUri('IMAGE/JPEG', 'a')).toBe('data:image/jpeg;base64,a');
  });

  it('构建结果可被 parseDataUri 重新解析（往返）', () => {
    const uri = buildDataUri('image/webp', PNG_1PX_BASE64);
    const parsed = parseDataUri(uri);
    expect(parsed?.mimeType).toBe('image/webp');
    expect(parsed?.data).toBe(PNG_1PX_BASE64);
  });
});

describe('base64 与字节互转', () => {
  it('base64 -> bytes -> base64 往返一致', () => {
    const bytes = base64ToBytes(PNG_1PX_BASE64);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytesToBase64(bytes)).toBe(PNG_1PX_BASE64);
  });

  it('正确解码已知 ASCII', () => {
    const bytes = base64ToBytes('aGVsbG8=');
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it('编码任意字节序列', () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 254]);
    const base64 = bytesToBase64(bytes);
    expect(base64ToBytes(base64)).toEqual(bytes);
  });

  it('大数据分块编解码不溢出', () => {
    const bytes = new Uint8Array(100000);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = i % 256;
    }
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});

describe('sniffImageMime', () => {
  it('通过魔数识别 PNG', () => {
    const bytes = base64ToBytes(PNG_1PX_BASE64);
    expect(sniffImageMime(bytes)).toBe('image/png');
  });

  it('识别 JPEG（FF D8 FF）', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    expect(sniffImageMime(jpeg)).toBe('image/jpeg');
  });

  it('识别 GIF89a', () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(sniffImageMime(gif)).toBe('image/gif');
  });

  it('识别 RIFF/WEBP', () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageMime(webp)).toBe('image/webp');
  });

  it('识别 BMP 与 SVG 文本', () => {
    const bmp = new Uint8Array([0x42, 0x4d, 0x00, 0x00]);
    expect(sniffImageMime(bmp)).toBe('image/bmp');
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(sniffImageMime(svg)).toBe('image/svg+xml');
  });

  it('无法识别时返回 null', () => {
    const unknown = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(sniffImageMime(unknown)).toBeNull();
  });
});

describe('getExtensionFromMime', () => {
  it('返回正确扩展名，jpeg 缩写为 jpg', () => {
    expect(getExtensionFromMime('image/png')).toBe('png');
    expect(getExtensionFromMime('image/jpeg')).toBe('jpg');
    expect(getExtensionFromMime('image/svg+xml')).toBe('svg');
    expect(getExtensionFromMime('image/x-icon')).toBe('ico');
  });

  it('未知类型回退 png', () => {
    expect(getExtensionFromMime('image/tiff')).toBe('png');
  });
});

describe('formatBytes', () => {
  it('按 1024 进位并带正确单位', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('非法输入回退 0 B', () => {
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});
