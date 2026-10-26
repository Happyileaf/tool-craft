import { describe, it, expect } from 'vitest';
import {
  caesarDecrypt,
  caesarEncrypt,
  caesarShift,
  normalizeShift,
  rot13,
} from './caesar';

describe('位移量归一化', () => {
  it('0–25 的合法值保持不变', () => {
    expect(normalizeShift(0)).toBe(0);
    expect(normalizeShift(3)).toBe(3);
    expect(normalizeShift(25)).toBe(25);
  });

  it('26 与 0 等价', () => {
    expect(normalizeShift(26)).toBe(0);
    expect(normalizeShift(52)).toBe(0);
  });

  it('负数位移归一化为正位移', () => {
    expect(normalizeShift(-1)).toBe(25);
    expect(normalizeShift(-3)).toBe(23);
    expect(normalizeShift(-26)).toBe(0);
  });
});

describe('凯撒加密 / 解密', () => {
  it('shift=3 经典位移与边界循环', () => {
    expect(caesarEncrypt('abcXYZ', 3)).toBe('defABC');
    expect(caesarEncrypt('Hello, World!', 3)).toBe('Khoor, Zruog!');
  });

  it('解密还原原文', () => {
    const cipher = caesarEncrypt('The quick brown fox jumps over the lazy dog.', 7);
    expect(caesarDecrypt(cipher, 7)).toBe('The quick brown fox jumps over the lazy dog.');
  });

  it('仅字母参与位移，数字 / 符号 / 空格 / 中文原样保留', () => {
    expect(caesarEncrypt('a1! 你好', 1)).toBe('b1! 你好');
    expect(caesarEncrypt('Z9', 1)).toBe('A9');
  });

  it('shift=0 恒等，shift=26 与 shift=0 等价', () => {
    const text = 'Mixed CASE text 2026';
    expect(caesarEncrypt(text, 0)).toBe(text);
    expect(caesarEncrypt(text, 26)).toBe(text);
  });

  it('负位移等于反向位移', () => {
    expect(caesarShift('defABC', -3)).toBe('abcXYZ');
    expect(caesarEncrypt('abc', -1)).toBe('zab');
  });

  it('空串返回空串', () => {
    expect(caesarEncrypt('', 13)).toBe('');
    expect(caesarDecrypt('', 13)).toBe('');
  });
});

describe('ROT13', () => {
  it('标准验收向量 Hello, World! → Uryyb, Jbeyq!', () => {
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!');
  });

  it('两次变换还原原文', () => {
    const text = 'ROT13 applies to Latin letters only.';
    expect(rot13(rot13(text))).toBe(text);
  });

  it('数字与符号不参与变换', () => {
    expect(rot13('123 !@#')).toBe('123 !@#');
  });
});
