import { describe, expect, it } from 'vitest';
import {
  normalizeKey,
  vigenere,
  vigenereDecrypt,
  vigenereEncrypt,
} from './vigenere';

describe('vigenereEncrypt', () => {
  it('经典向量：ATTACKATDAWN + LEMON = LXFOPVEFRNHR', () => {
    expect(vigenereEncrypt('ATTACKATDAWN', 'LEMON').text).toBe('LXFOPVEFRNHR');
  });

  it('保留原大小写：密文大小写跟随明文', () => {
    expect(vigenereEncrypt('HelloWorld', 'KEY').text).toBe('RijvsUyvjn');
  });

  it('非字母字符原样保留且不消耗密钥位', () => {
    expect(vigenereEncrypt('Attack at dawn!', 'LEMON').text).toBe(
      'Lxfopv ef rnhr!',
    );
  });

  it('密钥短于文本时循环复用', () => {
    expect(vigenereEncrypt('ABCABC', 'KEY').text).toBe(vigenereEncrypt('ABCABC', 'KEYKEY').text);
  });

  it('密钥大小写不敏感', () => {
    expect(vigenereEncrypt('ATTACKATDAWN', 'lemon').text).toBe('LXFOPVEFRNHR');
    expect(vigenereEncrypt('ATTACKATDAWN', 'LeMoN').text).toBe('LXFOPVEFRNHR');
  });

  it('密钥中的数字与空格被忽略', () => {
    expect(vigenereEncrypt('ATTACKATDAWN', 'L E M O N 123').text).toBe(
      'LXFOPVEFRNHR',
    );
  });
});

describe('vigenereDecrypt', () => {
  it('经典向量可正确解密', () => {
    expect(vigenereDecrypt('LXFOPVEFRNHR', 'LEMON').text).toBe('ATTACKATDAWN');
  });

  it('加密 → 解密往返一致（大小写与非字母字符保持）', () => {
    const text = 'Hello, World! 维吉尼亚 2026';
    const encrypted = vigenereEncrypt(text, 'SECRET').text ?? '';
    expect(vigenereDecrypt(encrypted, 'SECRET').text).toBe(text);
  });

  it('解密对非字母字符同样原样保留', () => {
    expect(vigenereDecrypt('Lxfopv ef rnhr!', 'LEMON').text).toBe(
      'Attack at dawn!',
    );
  });
});

describe('错误与边界', () => {
  it('密钥去除字母后为空返回明确错误', () => {
    const result = vigenereEncrypt('HELLO', '123 !');
    expect(result.text).toBeNull();
    expect(result.error).toContain('密钥');
  });

  it('空密钥返回错误', () => {
    expect(vigenere('HELLO', '').error).not.toBeNull();
  });

  it('空输入返回空串且不报错', () => {
    const result = vigenereEncrypt('', 'KEY');
    expect(result.text).toBe('');
    expect(result.error).toBeNull();
  });
});

describe('normalizeKey', () => {
  it('字母转为 0–25 位移且大小写不敏感', () => {
    expect(normalizeKey('aBz')).toEqual([0, 1, 25]);
  });

  it('无字母时返回 null', () => {
    expect(normalizeKey('1 2\n3!')).toBeNull();
  });
});
