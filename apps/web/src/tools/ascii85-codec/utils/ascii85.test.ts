import { describe, it, expect } from 'vitest';
import { decodeAscii85, encodeAscii85, validateAscii85 } from './ascii85';

describe('encodeAscii85（标准 Ascii85）', () => {
  it('命中 Python base64.a85encode 交叉验证向量', () => {
    expect(encodeAscii85('')).toBe('');
    expect(encodeAscii85('f')).toBe('Ac');
    expect(encodeAscii85('fo')).toBe('Ao@');
    expect(encodeAscii85('foo')).toBe('AoDS');
    expect(encodeAscii85('foob')).toBe('AoDTs');
    expect(encodeAscii85('fooba')).toBe('AoDTs@/');
    expect(encodeAscii85('foobar')).toBe('AoDTs@<)');
  });

  it('命中经典 Ascii85 向量（Man / 单空格）', () => {
    expect(encodeAscii85('Man')).toBe('9jqo');
    expect(encodeAscii85(' ')).toBe('+9');
  });

  it('连续 4 个零字节压缩为 z', () => {
    expect(encodeAscii85('\x00\x00\x00\x00')).toBe('z');
    expect(encodeAscii85('\x00\x00\x00\x00', { compressZ: false })).toBe('!!!!!');
  });

  it('可输出 <~ ~> 定界符', () => {
    expect(encodeAscii85('foobar', { delimiters: true })).toBe('<~AoDTs@<)~>');
    expect(encodeAscii85('', { delimiters: true })).toBe('<~~>');
  });

  it('按 UTF-8 编码中文并往返一致', () => {
    const encoded = encodeAscii85('中文 Ascii85');
    expect(decodeAscii85(encoded).text).toBe('中文 Ascii85');
  });

  it('btoa 变体使用相同字母表、xbtoa 定界且 4 空格压缩为 y', () => {
    expect(encodeAscii85('\x00\x00\x00\x00', { variant: 'btoa' })).toBe('z');
    expect(encodeAscii85('foobar', { variant: 'btoa', delimiters: true })).toBe(
      'xbtoa Begin\nAoDTs@<)\nxbtoa End',
    );
    expect(encodeAscii85('    ', { variant: 'btoa' })).toBe('y');
    expect(encodeAscii85('    ', { variant: 'btoa', compressZ: false })).toBe('+<VdL');
  });
});

describe('decodeAscii85', () => {
  it('解码标准编码并往返', () => {
    expect(decodeAscii85('AoDTs@<)').text).toBe('foobar');
    expect(decodeAscii85('9jqo').text).toBe('Man');
    expect(decodeAscii85('').text).toBe('');
  });

  it('解码 z 压缩简写', () => {
    expect(decodeAscii85('z').text).toBe('\x00\x00\x00\x00');
    expect(decodeAscii85('<~z~>').text).toBe('\x00\x00\x00\x00');
  });

  it('剥离 <~ ~> 定界符并忽略空白', () => {
    expect(decodeAscii85('<~AoDTs @<)~>').text).toBe('foobar');
    expect(decodeAscii85('<~\nAoDTs@<)\n~>').text).toBe('foobar');
  });

  it('缺少结束定界符时报错', () => {
    expect(decodeAscii85('<~AoDTs').error).toContain('~>');
  });

  it('非法字符报错并给出位置', () => {
    const result = decodeAscii85('Ao|Ts');
    expect(result.text).toBe(null);
    expect(result.error).toContain('非法 Ascii85 字符');
    expect(result.error).toContain('位置');
  });

  it('单字符尾组与 Python 行为一致（A 解为空，s 溢出报错）', () => {
    expect(decodeAscii85('A').text).toBe('');
    const result = decodeAscii85('s');
    expect(result.text).toBe(null);
    expect(result.error).toContain('尾组');
  });

  it('尾组值超出 32 位范围时报错', () => {
    // "ss" 作为 2 字符尾组还原值超过 0xffffffff（与 Python base64.a85decode 的 overflow 一致）
    const result = decodeAscii85('ss');
    expect(result.text).toBe(null);
    expect(result.error).toContain('尾组');
  });

  it('完整 5 字符组后的 z 简写合法（Python 交叉验证 AoDTsz）', () => {
    expect(decodeAscii85('AoDTsz').text).toBe('foob\x00\x00\x00\x00');
    expect(decodeAscii85('zzAoDTs').text).toBe('\x00\x00\x00\x00\x00\x00\x00\x00foob');
  });

  it('z 夹在数据组中间时报错', () => {
    const result = decodeAscii85('AoDTs@<)z');
    expect(result.text).toBe(null);
    expect(result.error).toContain('数据组边界');
  });

  it('btoa 变体使用 xbtoa 定界解码并支持 y=4 空格简写', () => {
    const encoded = encodeAscii85('foobar', { variant: 'btoa' });
    expect(decodeAscii85(encoded, 'btoa').text).toBe('foobar');
    expect(decodeAscii85('y', 'btoa').text).toBe('    ');
    expect(decodeAscii85('AoDTsy', 'btoa').text).toBe('foob    ');
  });

  it('标准模式下 y 是普通字符而非简写', () => {
    // y 作为普通字符时码值为 87-33=87… 实际 y=121-33=88 > 84，标准字母表 !–u 不含 y，应报非法字符
    expect(decodeAscii85('y', 'standard').error).toContain('非法 Ascii85 字符');
  });

  it('自动识别 xbtoa Begin/End 定界的 btoa 数据', () => {
    const wrapped = encodeAscii85('foobar', { variant: 'btoa', delimiters: true });
    expect(decodeAscii85(wrapped).text).toBe('foobar');
  });

  it('无定界时按 y 简写自动识别 btoa', () => {
    expect(decodeAscii85('y').text).toBe('    ');
  });
});

describe('validateAscii85', () => {
  it('校验合法与非法输入', () => {
    expect(validateAscii85('<~AoDTs@<)~>').valid).toBe(true);
    expect(validateAscii85('Ao|Ts').valid).toBe(false);
  });
});
