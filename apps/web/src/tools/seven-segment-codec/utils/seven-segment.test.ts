import { describe, expect, it } from 'vitest';
import { SEGMENT_NAMES } from '../constants';
import {
  DEFAULT_OPTIONS,
  byteFromMask,
  decodeByte,
  encodeText,
  formatBinary,
  formatHex,
  glyphMask,
  maskFromByte,
  parseByteInput,
} from './seven-segment';

describe('encodeText', () => {
  it('编码数字 0 为共阴 0x3F', () => {
    const result = encodeText('0', DEFAULT_OPTIONS);
    expect(result.glyphs).toHaveLength(1);
    expect(result.glyphs[0]?.byte).toBe(0x3f);
    expect(result.glyphs[0]?.hex).toBe('0x3F');
    expect(result.glyphs[0]?.binary).toBe('00111111');
    expect(result.glyphs[0]?.segments).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('共阳极性下段码取反', () => {
    const result = encodeText('0', { ...DEFAULT_OPTIONS, activeHigh: false });
    expect(result.glyphs[0]?.byte).toBe(0xc0);
  });

  it('MSB 优先时位序反转', () => {
    const result = encodeText('1', { ...DEFAULT_OPTIONS, msbFirst: true });
    expect(result.glyphs[0]?.byte).toBe(0x60);
  });

  it('dp 位于最低位的自定义段序', () => {
    const order = [...SEGMENT_NAMES].reverse();
    const result = encodeText('1', { ...DEFAULT_OPTIONS, order });
    expect(result.glyphs[0]?.byte).toBe(0x60);
  });

  it('小数点叠加到前一个字形', () => {
    const result = encodeText('A.8?', DEFAULT_OPTIONS);
    expect(result.glyphs).toHaveLength(2);
    expect((result.glyphs[0]?.mask ?? 0) & 0x80).toBe(0x80);
    expect(result.skipped).toEqual(['?']);
  });

  it('字母 A 的共阴段码为 0x77', () => {
    const result = encodeText('A', DEFAULT_OPTIONS);
    expect(result.glyphs[0]?.byte).toBe(0x77);
  });
});

describe('decodeByte', () => {
  it('0x3F 解码为数字 0', () => {
    const result = decodeByte(0x3f, DEFAULT_OPTIONS);
    expect(result.mask).toBe(0x3f);
    expect(result.chars).toEqual(['0']);
    expect(result.baseChars).toEqual(['0']);
    expect(result.hasDecimalPoint).toBe(false);
  });

  it('带小数点的 0xBF 仅返回基础字形', () => {
    const result = decodeByte(0xbf, DEFAULT_OPTIONS);
    expect(result.chars).toEqual([]);
    expect(result.baseChars).toEqual(['0']);
    expect(result.hasDecimalPoint).toBe(true);
    expect(result.segments).toContain('dp');
  });

  it('共享字形的 0x6D 同时匹配 5 与 S', () => {
    const result = decodeByte(0x6d, DEFAULT_OPTIONS);
    expect(result.chars).toEqual(['5', 'S']);
  });

  it('十六进制 A 字形 0x77 解码为 A', () => {
    expect(decodeByte(0x77, DEFAULT_OPTIONS).chars).toEqual(['A']);
  });

  it('字节与掩码在自定义选项下可往返', () => {
    const options = { activeHigh: false, order: [...SEGMENT_NAMES].reverse(), msbFirst: true };
    const mask = glyphMask('6');
    expect(mask).not.toBeNull();
    const byte = byteFromMask(mask ?? 0, options);
    expect(maskFromByte(byte, options)).toBe(mask);
  });
});

describe('parseByteInput', () => {
  it('解析十六进制、二进制与十进制', () => {
    expect(parseByteInput('0x3F')).toBe(63);
    expect(parseByteInput('0b00111111')).toBe(63);
    expect(parseByteInput('63')).toBe(63);
    expect(parseByteInput('3F')).toBe(63);
  });

  it('拒绝越界与非法格式', () => {
    expect(() => parseByteInput('')).toThrow();
    expect(() => parseByteInput('256')).toThrow();
    expect(() => parseByteInput('0b111111111')).toThrow();
    expect(() => parseByteInput('GG')).toThrow();
  });
});

describe('格式化辅助函数', () => {
  it('补齐十六进制与二进制位数', () => {
    expect(formatHex(0x3f)).toBe('0x3F');
    expect(formatBinary(0x06)).toBe('00000110');
  });

  it('未收录字符返回 null', () => {
    expect(glyphMask('Z')).toBeNull();
    expect(glyphMask('?')).toBeNull();
  });
});
