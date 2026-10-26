import { describe, it, expect } from 'vitest';
import {
  analyzeLineEndings,
  convertLineEndings,
  getUtf8ByteLength,
  stripBom,
  BOM,
} from './lineEndings';

describe('getUtf8ByteLength', () => {
  it('按 UTF-8 编码计算 ASCII、中文与 emoji 字节数', () => {
    expect(getUtf8ByteLength('abc')).toBe(3);
    expect(getUtf8ByteLength('中文')).toBe(6);
    expect(getUtf8ByteLength('a中')).toBe(4);
    expect(getUtf8ByteLength('😀')).toBe(4);
    expect(getUtf8ByteLength('')).toBe(0);
  });
});

describe('analyzeLineEndings', () => {
  it('统计纯 CRLF 文本', () => {
    const result = analyzeLineEndings('a\r\nb\r\nc');
    expect(result.counts).toEqual({ lf: 0, crlf: 2, cr: 0 });
    expect(result.totalEndings).toBe(2);
    expect(result.types).toEqual(['CRLF']);
    expect(result.isMixed).toBe(false);
    expect(result.dominant).toBe('CRLF');
    expect(result.lineCount).toBe(3);
    expect(result.hasFinalNewline).toBe(false);
    expect(result.hasBom).toBe(false);
  });

  it('统计纯 LF 文本并识别末尾换行', () => {
    const result = analyzeLineEndings('a\nb\n');
    expect(result.counts).toEqual({ lf: 2, crlf: 0, cr: 0 });
    expect(result.lineCount).toBe(2);
    expect(result.hasFinalNewline).toBe(true);
    expect(result.dominant).toBe('LF');
  });

  it('统计经典 Mac 的纯 CR 文本', () => {
    const result = analyzeLineEndings('a\rb\rc\r');
    expect(result.counts).toEqual({ lf: 0, crlf: 0, cr: 3 });
    expect(result.lineCount).toBe(3);
    expect(result.hasFinalNewline).toBe(true);
    expect(result.dominant).toBe('CR');
  });

  it('识别 LF 与 CRLF 混排', () => {
    const result = analyzeLineEndings('a\r\nb\nc\r\nd');
    expect(result.counts).toEqual({ lf: 1, crlf: 2, cr: 0 });
    expect(result.isMixed).toBe(true);
    expect(result.types).toEqual(['LF', 'CRLF']);
    expect(result.dominant).toBe('CRLF');
    expect(result.lineCount).toBe(4);
  });

  it('识别三种行结束符同时出现的混排', () => {
    const result = analyzeLineEndings('a\nb\rc\r\n');
    expect(result.counts).toEqual({ lf: 1, crlf: 1, cr: 1 });
    expect(result.isMixed).toBe(true);
    expect(result.types).toEqual(['LF', 'CRLF', 'CR']);
    expect(result.lineCount).toBe(3);
    expect(result.hasFinalNewline).toBe(true);
  });

  it('检测开头 UTF-8 BOM 且字节大小计入 BOM', () => {
    const result = analyzeLineEndings(`${BOM}a\nb`);
    expect(result.hasBom).toBe(true);
    expect(result.counts.lf).toBe(1);
    expect(result.byteLength).toBe(getUtf8ByteLength(`${BOM}a\nb`));
  });

  it('空文本返回零行与 null 主导类型', () => {
    const result = analyzeLineEndings('');
    expect(result.lineCount).toBe(0);
    expect(result.totalEndings).toBe(0);
    expect(result.types).toEqual([]);
    expect(result.dominant).toBeNull();
    expect(result.hasFinalNewline).toBe(false);
  });

  it('无换行的单行文本计为 1 行', () => {
    expect(analyzeLineEndings('hello').lineCount).toBe(1);
  });
});

describe('convertLineEndings', () => {
  it('CRLF 归一化为 LF 且每行节省 1 字节', () => {
    const result = convertLineEndings('a\r\nb\r\n', 'LF');
    expect(result.output).toBe('a\nb\n');
    expect(result.target).toBe('LF');
    expect(result.endingsConverted).toBe(2);
    expect(result.byteDelta).toBe(-2);
    expect(result.bomStripped).toBe(false);
  });

  it('LF 归一化为 CRLF 且每行增加 1 字节', () => {
    const result = convertLineEndings('a\nb', 'CRLF');
    expect(result.output).toBe('a\r\nb');
    expect(result.byteDelta).toBe(1);
  });

  it('混合换行统一转换为 CR', () => {
    const result = convertLineEndings('a\nb\r\nc\rd', 'CR');
    expect(result.output).toBe('a\rb\rc\rd');
  });

  it('转换时默认剥离 BOM', () => {
    const result = convertLineEndings(`${BOM}a\r\nb`, 'LF');
    expect(result.output).toBe('a\nb');
    expect(result.bomStripped).toBe(true);
  });

  it('stripBom 为 false 时保留 BOM', () => {
    const result = convertLineEndings(`${BOM}a\r\nb`, 'LF', false);
    expect(result.output).toBe(`${BOM}a\nb`);
    expect(result.bomStripped).toBe(false);
  });

  it('目标格式与原文一致时字节不变', () => {
    const result = convertLineEndings('a\nb\nc\n', 'LF');
    expect(result.output).toBe('a\nb\nc\n');
    expect(result.byteDelta).toBe(0);
  });

  it('空文本转换不报错', () => {
    const result = convertLineEndings('', 'LF');
    expect(result.output).toBe('');
    expect(result.endingsConverted).toBe(0);
  });
});

describe('stripBom', () => {
  it('剥离开头 BOM 并保留其余内容', () => {
    expect(stripBom(`${BOM}abc`)).toBe('abc');
  });

  it('无 BOM 时原样返回', () => {
    expect(stripBom('abc')).toBe('abc');
  });

  it('不会误删非开头位置的 U+FEFF 字符', () => {
    expect(stripBom(`a${BOM}b`)).toBe(`a${BOM}b`);
  });
});
