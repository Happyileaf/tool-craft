import { describe, expect, it } from 'vitest';
import { md5Hex } from './md5';

describe('md5Hex RFC 1321 官方向量', () => {
  it('空字符串摘要正确', () => {
    expect(md5Hex('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('单字符 a 摘要正确', () => {
    expect(md5Hex('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
  });

  it('abc 摘要正确', () => {
    expect(md5Hex('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('message digest 摘要正确', () => {
    expect(md5Hex('message digest')).toBe(
      'f96b697d7cb7938d525a2f31aaf161d0',
    );
  });

  it('UTF-8 中文按三个字节编码后摘要正确', () => {
    expect(md5Hex('中文')).toBe('a7bac2239fcdcb3a067903d8077c4a07');
  });

  it('输出为小写 32 位十六进制', () => {
    const digest = md5Hex('ToolCraft');
    expect(digest).toMatch(/^[0-9a-f]{32}$/);
  });
});
