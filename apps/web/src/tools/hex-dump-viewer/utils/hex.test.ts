import { describe, it, expect } from 'vitest';
import {
  textToHex,
  hexToText,
  parseHexBytes,
  bytesToDump,
  textToDump,
  encodeUtf8,
} from './hex';

describe('textToHex - 文本编码为十六进制', () => {
  it('基础 ASCII 编码', () => {
    expect(textToHex('Hello', { hexCase: 'lower', separator: 'none', mode: 'plain' })).toEqual({
      output: '48656c6c6f',
      error: null,
    });
  });

  it('空格分隔', () => {
    expect(textToHex('Hello', { hexCase: 'lower', separator: 'space', mode: 'plain' })).toEqual({
      output: '48 65 6c 6c 6f',
      error: null,
    });
  });

  it('大写输出', () => {
    expect(textToHex('Hello', { hexCase: 'upper', separator: 'none', mode: 'plain' })).toEqual({
      output: '48656C6C6F',
      error: null,
    });
  });

  it('冒号分隔', () => {
    expect(textToHex('AB', { hexCase: 'upper', separator: 'colon', mode: 'plain' })).toEqual({
      output: '41:42',
      error: null,
    });
  });

  it('每字节 0x 前缀', () => {
    expect(textToHex('Hi', { hexCase: 'lower', separator: '0x', mode: 'plain' })).toEqual({
      output: '0x48 0x69',
      error: null,
    });
  });

  it('中文按 UTF-8 编码', () => {
    expect(textToHex('中文', { hexCase: 'lower', separator: 'none', mode: 'plain' })).toEqual({
      output: 'e4b8ade69687',
      error: null,
    });
  });

  it('空文本返回空串', () => {
    expect(textToHex('', { hexCase: 'lower', separator: 'none', mode: 'plain' })).toEqual({
      output: '',
      error: null,
    });
  });
});

describe('hexToText / parseHexBytes - 十六进制解码', () => {
  it('基础解码', () => {
    expect(hexToText('48656c6c6f')).toEqual({ output: 'Hello', error: null });
  });

  it('中文往返一致', () => {
    expect(hexToText('e4b8ade69687')).toEqual({ output: '中文', error: null });
  });

  it('容忍空格、冒号、换行、0x 前缀与大小写', () => {
    expect(hexToText('48 65 6C 6c 6f')).toEqual({ output: 'Hello', error: null });
    expect(hexToText('0x48 0x65 0x6c 0x6c 0x6f')).toEqual({ output: 'Hello', error: null });
    expect(hexToText('48:65:6c:6c:6f')).toEqual({ output: 'Hello', error: null });
    expect(hexToText('48656c6c\n6f')).toEqual({ output: 'Hello', error: null });
    expect(hexToText('48656C6C6F')).toEqual({ output: 'Hello', error: null });
  });

  it('容忍逗号与连字符分隔', () => {
    expect(Array.from(parseHexBytes('48,65-6c'))).toEqual([0x48, 0x65, 0x6c]);
  });

  it('空输入返回空文本', () => {
    expect(hexToText('   \n ')).toEqual({ output: '', error: null });
  });

  it('奇数个 hex 位返回错误', () => {
    const result = hexToText('abc');
    expect(result.output).toBe('');
    expect(result.error).toContain('偶数');
  });

  it('非法字符返回错误', () => {
    const result = hexToText('4g65');
    expect(result.output).toBe('');
    expect(result.error).toContain('非法十六进制字符');
  });

  it('非法 UTF-8 字节序列返回错误', () => {
    const result = hexToText('ffe696');
    expect(result.output).toBe('');
    expect(result.error).toBeTruthy();
  });
});

describe('bytesToDump / textToDump - 十六进制转储', () => {
  it('短于 16 字节的单行 dump', () => {
    const dump = textToDump('Hello');
    const lines = dump.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      '00000000  48 65 6c 6c 6f                                    |Hello           |',
    );
  });

  it('恰好 16 字节为一行，偏移从 00000000 起', () => {
    const dump = textToDump('0123456789abcdef');
    const lines = dump.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]?.startsWith('00000000  30 31 32 33 34 35 36 37  38 39 61 62 63 64 65 66')).toBe(
      true,
    );
    expect(lines[0]?.endsWith('|0123456789abcdef|')).toBe(true);
  });

  it('超过 16 字节正确分行并递增偏移', () => {
    const dump = textToDump('0123456789abcdefXYZ');
    const lines = dump.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]?.startsWith('00000000')).toBe(true);
    expect(lines[1]?.startsWith('00000010')).toBe(true);
    // 第二行只有 3 字节，其余以空格对齐，ASCII 预览剩余位置为空格
    expect(lines[1]).toBe(
      '00000010  58 59 5a                                          |XYZ             |',
    );
  });

  it('不可打印字节在 ASCII 预览中显示为点', () => {
    const bytes = new Uint8Array([0x00, 0x0a, 0x41, 0xff]);
    const dump = bytesToDump(bytes);
    expect(dump).toContain('|..A.');
  });

  it('空字节序列返回空串', () => {
    expect(bytesToDump(new Uint8Array(0))).toBe('');
  });

  it('UTF-8 多字节字符在 dump 中按字节展开', () => {
    const bytes = encodeUtf8('中');
    expect(Array.from(bytes)).toEqual([0xe4, 0xb8, 0xad]);
    expect(textToDump('中')).toContain('e4 b8 ad');
  });
});
