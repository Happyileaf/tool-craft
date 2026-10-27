import { describe, it, expect } from 'vitest';
import {
  decodeQuotedPrintable,
  encodeQuotedPrintable,
  validateQuotedPrintable,
} from './quoted-printable';

describe('encodeQuotedPrintable', () => {
  it('可打印 ASCII（除 =）原样输出', () => {
    expect(encodeQuotedPrintable("Now's the time")).toBe("Now's the time");
  });

  it('等号必须转义为 =3D（RFC 2045 规则 1）', () => {
    expect(encodeQuotedPrintable('gal: =42')).toBe('gal: =3D42');
  });

  it('非 ASCII 字节按 UTF-8 转义为大写 =XX', () => {
    expect(encodeQuotedPrintable('€')).toBe('=E2=82=AC');
    expect(encodeQuotedPrintable('中')).toBe('=E4=B8=AD');
  });

  it('裸 LF 作为硬换行（输出 CRLF），裸 CR 按规则转义为 =0D', () => {
    expect(encodeQuotedPrintable('a\nb')).toBe('a\r\nb');
    expect(encodeQuotedPrintable('a\rb')).toBe('a=0Db');
  });

  it('硬换行前的尾随空格 / 制表符转义为 =20 / =09（规则 4）', () => {
    expect(encodeQuotedPrintable('a  \nb')).toBe('a =20\r\nb');
    expect(encodeQuotedPrintable('a\t\nb')).toBe('a=09\r\nb');
  });

  it('超过 75 字符的行自动软换行，整行含 = 不超过 76（规则 5）', () => {
    const encoded = encodeQuotedPrintable('a'.repeat(200));
    const lines = encoded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(76);
    }
    expect(lines[0]).toBe(`${'a'.repeat(75)}=`);
    expect(decodeQuotedPrintable(encoded).text).toBe('a'.repeat(200));
  });

  it('LF 行结束符选项生效', () => {
    expect(encodeQuotedPrintable('a\nb', 'lf')).toBe('a\nb');
  });

  it('包含等号、CRLF、非 ASCII 与多字节文本的混合输入往返一致', () => {
    const text = 'a=b\r\n中文 café = 42';
    const roundTrip = decodeQuotedPrintable(encodeQuotedPrintable(text));
    expect(roundTrip.text).toBe(text);
    expect(roundTrip.error).toBeNull();
  });

  it('空字符串编码为空', () => {
    expect(encodeQuotedPrintable('')).toBe('');
  });
});

describe('decodeQuotedPrintable', () => {
  it('RFC 2045 §6.7 经典示例解码（人工软换行拼接 + =20 行尾空格）', () => {
    const encoded =
      "Now's the time =\r\nfor all folk to come=20\r\nto the aid of their country.";
    expect(decodeQuotedPrintable(encoded).text).toBe(
      "Now's the time for all folk to come \nto the aid of their country.",
    );
  });

  it('软换行（=CRLF / =LF）被移除并拼接', () => {
    expect(decodeQuotedPrintable('ab=\r\ncd').text).toBe('abcd');
    expect(decodeQuotedPrintable('ab=\ncd').text).toBe('abcd');
  });

  it('=20 后紧跟硬换行时还原为行尾空格', () => {
    expect(decodeQuotedPrintable('come=20\r\nto').text).toBe('come \nto');
  });

  it('普通硬换行还原为 LF', () => {
    expect(decodeQuotedPrintable('a\r\nb').text).toBe('a\nb');
  });

  it('按 UTF-8 还原中文且与编码往返一致', () => {
    const text = 'Quoted-Printable 编码示例：café = 42€。';
    expect(decodeQuotedPrintable(encodeQuotedPrintable(text)).text).toBe(text);
  });

  it('小写十六进制转义同样接受', () => {
    expect(decodeQuotedPrintable('=e2=82=ac').text).toBe('€');
  });

  it('拒绝不完整的转义序列并报告行列位置', () => {
    const result = decodeQuotedPrintable('ab=4');
    expect(result.text).toBeNull();
    expect(result.error).toContain('第 1 行第 3 列');
  });

  it('拒绝非法十六进制转义', () => {
    const result = decodeQuotedPrintable('ab=ZZ');
    expect(result.text).toBeNull();
    expect(result.error).toContain('非法');
  });

  it('拒绝非合法 UTF-8 字节序列', () => {
    const result = decodeQuotedPrintable('=FF=FE');
    expect(result.text).toBeNull();
    expect(result.error).toContain('UTF-8');
  });

  it('空字符串解码为空', () => {
    expect(decodeQuotedPrintable('').text).toBe('');
  });
});

describe('validateQuotedPrintable', () => {
  it('合法输入为 true', () => {
    expect(validateQuotedPrintable('gal: =3D42')).toBe(true);
  });

  it('非法转义为 false', () => {
    expect(validateQuotedPrintable('ab=ZZ')).toBe(false);
  });
});
