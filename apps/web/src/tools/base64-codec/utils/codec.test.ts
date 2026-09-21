import { describe, expect, it } from 'vitest';
import { CodecDirectionEnum, CodecModeEnum } from '../constants';
import {
  decodeBase64,
  decodeHex,
  encodeBase64,
  encodeHex,
  runCodec,
} from './codec';

describe('encodeBase64 / decodeBase64', () => {
  it('正确往返编码 ASCII 与 UTF-8 中文文本', () => {
    const text = 'ToolCraft 工具箱 🚀';
    const encoded = encodeBase64(text);
    expect(encoded).not.toContain(' ');
    expect(decodeBase64(encoded)).toBe(text);
  });

  it('编码结果与标准实现一致', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });
});

describe('encodeHex / decodeHex', () => {
  it('以空格分隔输出字节并支持往返', () => {
    const text = '你好';
    const encoded = encodeHex(text);
    expect(encoded).toBe('e4 bd a0 e5 a5 bd');
    expect(decodeHex(encoded)).toBe(text);
  });

  it('奇数长度输入抛出异常', () => {
    expect(() => decodeHex('abc')).toThrow(/偶数/);
  });

  it('含非法字符时抛出异常', () => {
    expect(() => decodeHex('zz')).toThrow(/非法字符/);
  });
});

describe('runCodec', () => {
  it('空输入返回空输出且视为成功', () => {
    const result = runCodec(
      '',
      CodecModeEnum.BASE64,
      CodecDirectionEnum.ENCODE,
    );
    expect(result.success).toBe(true);
    expect(result.output).toBe('');
  });

  it('URL 方案可双向编解码', () => {
    const encoded = runCodec(
      'a=1&b=中文',
      CodecModeEnum.URL,
      CodecDirectionEnum.ENCODE,
    );
    expect(encoded.success).toBe(true);
    const decoded = runCodec(
      encoded.output,
      CodecModeEnum.URL,
      CodecDirectionEnum.DECODE,
    );
    expect(decoded.output).toBe('a=1&b=中文');
  });

  it('非法 Base64 解码时返回失败结果而非抛出异常', () => {
    const result = runCodec(
      '不是合法的 base64 !!!',
      CodecModeEnum.BASE64,
      CodecDirectionEnum.DECODE,
    );
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });
});
