import { describe, it, expect } from 'vitest';
import { decodeHtml, encodeHtml } from './entities';

describe('encodeHtml', () => {
  it('把基础敏感字符转义为命名实体', () => {
    expect(encodeHtml('a & b < c > d "e" \'f\'')).toBe(
      'a &amp; b &lt; c &gt; d &quot;e&quot; &#39;f&#39;',
    );
  });

  it('单次处理 & 不会造成二次转义', () => {
    expect(encodeHtml('<')).toBe('&lt;');
    expect(encodeHtml('&')).toBe('&amp;');
    expect(encodeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('默认保留非 ASCII 字符', () => {
    expect(encodeHtml('café ©')).toBe('café ©');
  });

  it('开启编码非 ASCII 字符后命中命名实体或使用十进制实体', () => {
    expect(encodeHtml('© 2026', { encodeNonAscii: true })).toBe('&copy; 2026');
    expect(encodeHtml('café', { encodeNonAscii: true })).toBe('caf&#233;');
    expect(encodeHtml('—', { encodeNonAscii: true })).toBe('&mdash;');
  });

  it('空文本返回空串', () => {
    expect(encodeHtml('')).toBe('');
  });
});

describe('decodeHtml', () => {
  it('还原命名实体与数字实体', () => {
    expect(decodeHtml('a &amp; b &lt; c &gt; d')).toBe('a & b < c > d');
    expect(decodeHtml('&#65;&#x42;')).toBe('AB');
    expect(decodeHtml('&copy; &hellip;')).toBe('© …');
  });

  it('还原多字节与 emoji 数字实体', () => {
    expect(decodeHtml('&#233;')).toBe('é');
    expect(decodeHtml('&#x1F600;')).toBe('😀');
    expect(decodeHtml('&nbsp;')).toBe('\u00a0');
  });

  it('未知命名实体与非法数字实体保留原文', () => {
    expect(decodeHtml('&unknown;')).toBe('&unknown;');
    expect(decodeHtml('&#xZZ;')).toBe('&#xZZ;');
    expect(decodeHtml('&#999999999;')).toBe('&#999999999;');
    expect(decodeHtml('a & b')).toBe('a & b');
  });

  it('编码与解码可往返', () => {
    const source = 'Tom & Jerry <"quote"> \u00a9 2026';
    expect(decodeHtml(encodeHtml(source, { encodeNonAscii: true }))).toBe(source);
  });
});
