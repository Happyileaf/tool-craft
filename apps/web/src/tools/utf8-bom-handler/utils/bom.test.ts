import { describe, expect, it } from 'vitest';
import {
  BOM_BYTES,
  BOM_BYTE_LENGTH,
  BOM_CHAR,
  analyzeBom,
  countBom,
  getUtf8ByteLength,
  processBom,
} from './bom';

describe('BOM 常量', () => {
  it('BOM 字符编码为 EF BB BF 且占 3 字节', () => {
    expect(BOM_BYTES).toEqual([0xef, 0xbb, 0xbf]);
    expect(BOM_BYTE_LENGTH).toBe(3);
    expect(getUtf8ByteLength(BOM_CHAR)).toBe(3);
  });
});

describe('countBom', () => {
  it('统计全文 U+FEFF 次数', () => {
    expect(countBom('hello')).toBe(0);
    expect(countBom(`${BOM_CHAR}hello`)).toBe(1);
    expect(countBom(`${BOM_CHAR}a${BOM_CHAR}b${BOM_CHAR}`)).toBe(3);
  });
});

describe('analyzeBom', () => {
  it('无 BOM 文本', () => {
    const result = analyzeBom('hello 世界');
    expect(result.hasLeadingBom).toBe(false);
    expect(result.innerBomCount).toBe(0);
    expect(result.totalBomCount).toBe(0);
    expect(result.byteLength).toBe(getUtf8ByteLength('hello 世界'));
    expect(result.byteLengthWithoutBom).toBe(result.byteLength);
  });

  it('开头 BOM 被识别且内部 BOM 单独计数', () => {
    const result = analyzeBom(`${BOM_CHAR}a${BOM_CHAR}b`);
    expect(result.hasLeadingBom).toBe(true);
    expect(result.totalBomCount).toBe(2);
    expect(result.innerBomCount).toBe(1);
    expect(result.byteLength - result.byteLengthWithoutBom).toBe(6);
  });

  it('空文本', () => {
    const result = analyzeBom('');
    expect(result.hasLeadingBom).toBe(false);
    expect(result.totalBomCount).toBe(0);
    expect(result.byteLength).toBe(0);
  });

  it('仅含 BOM 的文本', () => {
    const result = analyzeBom(BOM_CHAR);
    expect(result.hasLeadingBom).toBe(true);
    expect(result.innerBomCount).toBe(0);
    expect(result.byteLengthWithoutBom).toBe(0);
  });
});

describe('processBom', () => {
  it('detect 模式不改写文本', () => {
    const text = `${BOM_CHAR}hello`;
    expect(processBom(text, 'detect')).toBe(text);
  });

  it('add 模式添加开头 BOM 且幂等', () => {
    expect(processBom('hello', 'add')).toBe(`${BOM_CHAR}hello`);
    const withBom = `${BOM_CHAR}hello`;
    expect(processBom(withBom, 'add')).toBe(withBom);
  });

  it('strip-leading 只移除首个 BOM', () => {
    expect(processBom(`${BOM_CHAR}a${BOM_CHAR}b`, 'strip-leading')).toBe(`a${BOM_CHAR}b`);
    expect(processBom('hello', 'strip-leading')).toBe('hello');
  });

  it('strip-all 移除全部 U+FEFF', () => {
    expect(processBom(`${BOM_CHAR}a${BOM_CHAR}b${BOM_CHAR}`, 'strip-all')).toBe('ab');
  });

  it('空文本各模式均安全', () => {
    expect(processBom('', 'add')).toBe(BOM_CHAR);
    expect(processBom('', 'strip-leading')).toBe('');
    expect(processBom('', 'strip-all')).toBe('');
  });
});
