import { describe, it, expect } from 'vitest';
import { decodeBase32, encodeBase32, normalizeBase32, validateBase32 } from './base32';

describe('encodeBase32（RFC 4648 标准测试向量）', () => {
  it('逐项命中官方向量（带填充）', () => {
    expect(encodeBase32('')).toBe('');
    expect(encodeBase32('f')).toBe('MY======');
    expect(encodeBase32('fo')).toBe('MZXQ====');
    expect(encodeBase32('foo')).toBe('MZXW6===');
    expect(encodeBase32('foob')).toBe('MZXW6YQ=');
    expect(encodeBase32('fooba')).toBe('MZXW6YTB');
    expect(encodeBase32('foobar')).toBe('MZXW6YTBOI======');
  });

  it('去填充变体不输出 =', () => {
    expect(encodeBase32('f', { padding: false })).toBe('MY');
    expect(encodeBase32('fo', { padding: false })).toBe('MZXQ');
    expect(encodeBase32('foobar', { padding: false })).toBe('MZXW6YTBOI');
  });

  it('按 UTF-8 编码中文并往返一致', () => {
    const encoded = encodeBase32('中文');
    expect(decodeBase32(encoded).text).toBe('中文');
  });
});

describe('decodeBase32', () => {
  it('解码带填充与去填充输入', () => {
    expect(decodeBase32('MZXW6YTBOI======').text).toBe('foobar');
    expect(decodeBase32('MZXW6YTB').text).toBe('fooba');
    expect(decodeBase32('').text).toBe('');
  });

  it('大小写不敏感并忽略空白', () => {
    expect(decodeBase32('mzxw6ytboi======').text).toBe('foobar');
    expect(decodeBase32('MZXW 6YTB OI======').text).toBe('foobar');
  });

  it('非法字符报错并给出位置', () => {
    expect(decodeBase32('MZXW6!TB').error).toContain('位置 6');
  });

  it('长度非法时报错', () => {
    expect(decodeBase32('M').error).toContain('长度非法');
    expect(decodeBase32('MZX').error).toContain('长度非法');
  });

  it('填充位置与数量非法时报错', () => {
    expect(decodeBase32('MZ=XW6YT').error).toContain('只能出现在末尾');
    expect(decodeBase32('MZXQ==').error).toContain('填充字符数量');
  });
});

describe('validateBase32 与 normalizeBase32', () => {
  it('校验合法与非法输入', () => {
    expect(validateBase32('MZXW6YTBOI======').valid).toBe(true);
    expect(validateBase32('mzxw6ytb').valid).toBe(true);
    expect(validateBase32('MZXW6YTB!').valid).toBe(false);
  });

  it('规范化去空白并转大写', () => {
    expect(normalizeBase32(' mzxw 6ytb ')).toBe('MZXW6YTB');
  });
});
