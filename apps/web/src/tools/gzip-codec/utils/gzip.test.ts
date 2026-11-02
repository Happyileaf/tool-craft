import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  compressText,
  compressionRatio,
  decompressBytes,
  GZIP_MAGIC,
  hexToBytes,
  textToBytes,
} from './gzip';

describe('hex 转换', () => {
  it('bytes ↔ hex 往返，且 gzip 魔数为 1f8b', () => {
    expect(bytesToHex(new Uint8Array(GZIP_MAGIC))).toBe('1f8b');
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
    expect(hexToBytes('1f 8b')).toEqual(new Uint8Array([0x1f, 0x8b]));
    expect(hexToBytes(bytesToHex(new Uint8Array([1, 2, 3, 254])))).toEqual(
      new Uint8Array([1, 2, 3, 254]),
    );
  });

  it('拒绝非法 hex', () => {
    expect(() => hexToBytes('abc')).toThrow(/偶数/);
    expect(() => hexToBytes('xyz0')).toThrow(/0-9/);
    expect(hexToBytes('').length).toBe(0);
  });
});

describe('base64 转换', () => {
  it('bytes ↔ base64 往返', () => {
    const samples = ['', 'hello', '中文 UTF-8 内容', '\x00\x01\x02\xff'];
    for (const sample of samples) {
      const bytes = textToBytes(sample);
      expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    }
    expect(bytesToBase64(new Uint8Array([72, 105]))).toBe('SGk=');
  });

  it('拒绝非法 base64', () => {
    expect(() => base64ToBytes('@@@@')).toThrow(/非法字符/);
    expect(base64ToBytes('  ').length).toBe(0);
  });
});

describe('compressText / decompressBytes', () => {
  it('gzip 与 deflate 往返一致（含中文与重复文本）', async () => {
    const text = 'GZip 压缩测试 hello hello hello hello hello 中文内容 2026';
    for (const algorithm of ['gzip', 'deflate'] as const) {
      const compressed = await compressText(text, algorithm);
      const restored = await decompressBytes(compressed, algorithm);
      expect(restored).toBe(text);
    }
  });

  it('gzip 产物以 1f 8b 魔数开头', async () => {
    const compressed = await compressText('magic number test');
    expect(compressed[0]).toBe(0x1f);
    expect(compressed[1]).toBe(0x8b);
  });

  it('重复文本压缩后更小', async () => {
    const text = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'.repeat(20);
    const compressed = await compressText(text, 'gzip');
    expect(compressed.length).toBeLessThan(textToBytes(text).length);
  });

  it('损坏 / 截断 / 魔数错误的载荷返回友好错误', async () => {
    await expect(decompressBytes(new Uint8Array([]), 'gzip')).rejects.toThrow(/为空/);
    await expect(
      decompressBytes(new Uint8Array([0x00, 0x00, 0x01, 0x02]), 'gzip'),
    ).rejects.toThrow(/1f 8b/);
    const good = await compressText('corrupt me', 'gzip');
    const truncated = good.subarray(0, good.length - 6);
    await expect(decompressBytes(truncated, 'gzip')).rejects.toThrow(/解压失败/);
  });

  it('空字符串可安全往返', async () => {
    const compressed = await compressText('', 'gzip');
    expect(await decompressBytes(compressed, 'gzip')).toBe('');
  });
});

describe('compressionRatio', () => {
  it('返回 压缩后/原始 比例并对零长度除零安全', () => {
    expect(compressionRatio(25, 100)).toBeCloseTo(0.25);
    expect(compressionRatio(0, 0)).toBe(0);
    expect(compressionRatio(10, -1)).toBe(0);
  });
});
