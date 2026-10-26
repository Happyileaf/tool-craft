import { describe, it, expect } from 'vitest';
import { decodeBase45, encodeBase45, validateBase45 } from './base45';

describe('encodeBase45', () => {
  it('命中 RFC 9285 官方向量', () => {
    expect(encodeBase45('AB')).toBe('BB8');
    expect(encodeBase45('Hello!!')).toBe('%69 VD92EX0');
    expect(encodeBase45('base-45')).toBe('UJCLQE7W581');
  });

  it('空字符串编码为空', () => {
    expect(encodeBase45('')).toBe('');
  });

  it('单字节尾组只输出 2 个字符', () => {
    const encoded = encodeBase45('A');
    expect(encoded).toHaveLength(2);
    expect(encoded).toBe('K1');
  });

  it('与 Python base45 库向量一致（ietf! / 双字节边界）', () => {
    expect(encodeBase45('ietf!')).toBe('QED8WEX0');
  });

  it('按 UTF-8 处理中文且往返一致', () => {
    const text = '中文 Base45 编码';
    expect(decodeBase45(encodeBase45(text)).text).toBe(text);
  });
});

describe('decodeBase45', () => {
  it('解码 RFC 9285 官方向量', () => {
    expect(decodeBase45('BB8').text).toBe('AB');
    expect(decodeBase45('%69 VD92EX0').text).toBe('Hello!!');
    expect(decodeBase45('UJCLQE7W581').text).toBe('base-45');
    expect(decodeBase45('QED8WEX0').text).toBe('ietf!');
  });

  it('空字符串解码为空', () => {
    expect(decodeBase45('').text).toBe('');
  });

  it('拒绝非法字符并报告位置', () => {
    const result = decodeBase45('BB8#');
    expect(result.text).toBeNull();
    expect(result.error).toContain('第 4');
  });

  it('拒绝非法单字符尾序列', () => {
    const result = decodeBase45('BB8X');
    expect(result.text).toBeNull();
    expect(result.error).toContain('尾序列');
  });

  it('拒绝尾组数值溢出单字节', () => {
    const result = decodeBase45('::');
    expect(result.text).toBeNull();
    expect(result.error).toContain('超出');
  });

  it('拒绝非合法 UTF-8 字节序列', () => {
    const result = decodeBase45('U5');
    expect(result.text).toBeNull();
    expect(result.error).toContain('UTF-8');
  });
});

describe('validateBase45', () => {
  it('官方向量合法', () => {
    expect(validateBase45('BB8')).toBe(true);
    expect(validateBase45('UJCLQE7W581')).toBe(true);
  });

  it('非法输入为 false', () => {
    expect(validateBase45('BB8#')).toBe(false);
    expect(validateBase45('X')).toBe(false);
  });
});
