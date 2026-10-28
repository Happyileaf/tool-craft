import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  decodeBase91,
  decodeBase91ToBytes,
  encodeBase91,
  encodeBytesBase91,
  hexToBytes,
  validateBase91,
} from './base91';

const FOX_ENCODED = 'nX^Iz?T1s!2t:aRn#o>vf>6C9#`##mlLK#_1:Wzv;RG!,a%q3Lc=Z';
const FOX_PLAIN = 'The quick brown fox jumps over the lazy dog';

describe('encodeBase91', () => {
  it('命中官方实现测试向量', () => {
    expect(encodeBase91('')).toBe('');
    expect(encodeBase91('A')).toBe('%A');
    expect(encodeBase91('AB')).toBe('fGC');
    expect(encodeBase91('test')).toBe('fPNKd');
    expect(encodeBase91('Hello!!')).toBe('>OwJh>gGC');
  });

  it('命中官方 pangolin 向量', () => {
    expect(encodeBase91(FOX_PLAIN)).toBe(FOX_ENCODED);
  });

  it('按 UTF-8 处理中文且往返一致', () => {
    const text = '中文 basE91 编码';
    expect(decodeBase91(encodeBase91(text)).text).toBe(text);
  });

  it('字节模式与文本模式一致', () => {
    const bytes = new TextEncoder().encode('The quick brown fox');
    expect(encodeBytesBase91(bytes)).toBe(encodeBase91('The quick brown fox'));
  });

  it('编码体积不大于 Base64（basE91 无填充概念）', () => {
    const text = 'binary-safe encoding payload 0123456789';
    const encoded = encodeBase91(text);
    expect(encoded.length).toBeLessThan(btoa(text).length);
  });
});

describe('decodeBase91', () => {
  it('解码官方向量', () => {
    expect(decodeBase91('').text).toBe('');
    expect(decodeBase91('%A').text).toBe('A');
    expect(decodeBase91('fGC').text).toBe('AB');
    expect(decodeBase91('fPNKd').text).toBe('test');
    expect(decodeBase91('>OwJh>gGC').text).toBe('Hello!!');
    expect(decodeBase91(FOX_ENCODED).text).toBe(FOX_PLAIN);
  });

  it('往返多字节内容一致', () => {
    const cases = ['a', 'ab', 'abc', 'abcd', 'line\nbreak', 'emoji 😀 test', '!"#$%&\'()*+,-./'];
    for (const item of cases) {
      expect(decodeBase91(encodeBase91(item)).text).toBe(item);
    }
  });

  it('默认忽略空白字符', () => {
    const encoded = encodeBase91('Hello World');
    const spaced = `${encoded.slice(0, 4)}\n  ${encoded.slice(4, 8)}\t${encoded.slice(8)}`;
    expect(decodeBase91(spaced).text).toBe('Hello World');
  });

  it('关闭忽略空白后拒绝空格并报告位置', () => {
    const result = decodeBase91('fP NKd', false);
    expect(result.text).toBeNull();
    expect(result.error).toContain('第 3');
  });

  it('拒绝非字母表字符并报告位置', () => {
    const result = decodeBase91('fP-NKd');
    expect(result.text).toBeNull();
    expect(result.error).toContain('第 3');
    expect(result.error).toContain('basE91 字符集');
  });

  it('拒绝非合法 UTF-8 字节序列', () => {
    const encoded = encodeBytesBase91(Uint8Array.from([0xff]));
    const result = decodeBase91(encoded);
    expect(result.text).toBeNull();
    expect(result.error).toContain('UTF-8');
  });
});

describe('hex 模式', () => {
  it('hex 与字节双向一致', () => {
    const bytes = hexToBytes('48656c6c6f');
    expect(bytes).not.toBeNull();
    expect(bytesToHex(bytes as Uint8Array)).toBe('48656C6C6F');
    expect(decodeBase91ToBytes(encodeBytesBase91(bytes as Uint8Array)).bytes).toEqual(bytes);
  });

  it('容忍 0x 前缀、空白分隔，奇数长度与非法字符报错', () => {
    expect(hexToBytes('0xDE AD')).toEqual(Uint8Array.from([0xde, 0xad]));
    expect(hexToBytes('abc')).toBeNull();
    expect(hexToBytes('zz')).toBeNull();
    expect(hexToBytes('   ')).toEqual(new Uint8Array(0));
  });
});

describe('validateBase91', () => {
  it('官方向量合法', () => {
    expect(validateBase91('fPNKd')).toBe(true);
    expect(validateBase91('>OwJh>gGC')).toBe(true);
  });

  it('非法输入为 false', () => {
    expect(validateBase91('fP-NKd')).toBe(false);
  });
});
