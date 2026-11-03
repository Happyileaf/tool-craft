import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  bytesToText,
  decodeEscapes,
  decodeInput,
  generateCode,
  hexToBytes,
  isValidIdentifier,
  parseArrayLiteral,
  textToBytes,
} from './byteArray';

const HELLO = new Uint8Array([0x48, 0x69]); // Hi
const W_BYTES = new Uint8Array([0xe4, 0xb8, 0x96]); // "世" UTF-8

describe('hex 编解码', () => {
  it('bytesToHex 连续与带空格', () => {
    expect(bytesToHex(HELLO)).toBe('4869');
    expect(bytesToHex(HELLO, true)).toBe('48 69');
  });

  it('hexToBytes 容忍空白/逗号/0x 前缀与大小写', () => {
    expect(Array.from(hexToBytes('48 69'))).toEqual([0x48, 0x69]);
    expect(Array.from(hexToBytes('0x48, 0x69'))).toEqual([0x48, 0x69]);
    expect(Array.from(hexToBytes('aAbB'))).toEqual([0xaa, 0xbb]);
    expect(Array.from(hexToBytes(''))).toEqual([]);
  });

  it('拒绝非法字符与奇数长度', () => {
    expect(() => hexToBytes('4g')).toThrow('非法字符');
    expect(() => hexToBytes('abc')).toThrow('偶数');
  });
});

describe('base64 编解码（RFC 4648 向量）', () => {
  it('标准向量', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
    expect(bytesToBase64(new Uint8Array([0x66]))).toBe('Zg==');
    expect(bytesToBase64(new Uint8Array([0x66, 0x6f]))).toBe('Zm8=');
    expect(bytesToBase64(new Uint8Array([0x66, 0x6f, 0x6f]))).toBe('Zm9v');
    expect(bytesToBase64(new Uint8Array([0x66, 0x6f, 0x6f, 0x62]))).toBe('Zm9vYg==');
    expect(bytesToBase64(new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61]))).toBe('Zm9vYmE=');
    expect(bytesToBase64(new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]))).toBe('Zm9vYmFy');
  });

  it('往返随机长度', () => {
    const data = new Uint8Array(256);
    data.forEach((_v, i) => {
      data[i] = i;
    });
    expect(Array.from(base64ToBytes(bytesToBase64(data)))).toEqual(Array.from(data));
  });

  it('解析容忍空白与 URL-safe 字母', () => {
    expect(Array.from(base64ToBytes(' Zm9v '))).toEqual([0x66, 0x6f, 0x6f]);
    // 标准字母表输出为 +/；解码器额外接受 URL-safe 的 -_
    expect(bytesToBase64(new Uint8Array([0xfb, 0xff]))).toBe('+/8=');
    expect(Array.from(base64ToBytes('-_8='))).toEqual([0xfb, 0xff]);
    expect(Array.from(base64ToBytes('+/8='))).toEqual([0xfb, 0xff]);
  });

  it('拒绝非法输入', () => {
    expect(() => base64ToBytes('abc')).toThrow(); // 长度非 4 倍数
    expect(() => base64ToBytes('ab=d')).toThrow('格式不合法');
    expect(() => base64ToBytes('!!!!')).toThrow('格式不合法');
  });
});

describe('UTF-8 文本', () => {
  it('文本与字节互转（含中文）', () => {
    expect(Array.from(textToBytes('世'))).toEqual([0xe4, 0xb8, 0x96]);
    expect(bytesToText(W_BYTES)).toBe('世');
    expect(bytesToText(textToBytes('Hello, 世界'))).toBe('Hello, 世界');
  });

  it('decodeInput 按类型分派', () => {
    expect(Array.from(decodeInput('hex', '48 69'))).toEqual([0x48, 0x69]);
    expect(Array.from(decodeInput('base64', 'Zm9v'))).toEqual([0x66, 0x6f, 0x6f]);
    expect(Array.from(decodeInput('text', 'A'))).toEqual([0x41]);
  });
});

describe('generateCode', () => {
  const opts = { variableName: 'data', bytesPerLine: 4 };

  it('C / C++', () => {
    const { code, extension } = generateCode(new Uint8Array([1, 2, 0xab]), 'c', opts);
    expect(extension).toBe('c');
    expect(code).toContain('const unsigned char data[3] = {');
    expect(code).toContain('0x01, 0x02, 0xAB');
    expect(code).toContain('const unsigned int data_len = 3;');
  });

  it('Java：>127 加 (byte) 强转', () => {
    const { code } = generateCode(new Uint8Array([1, 0x80, 0xff]), 'java', opts);
    expect(code).toContain('byte[] data = {');
    expect(code).toContain('0x01, (byte) 0x80, (byte) 0xFF');
    expect(code).toContain('// 3 bytes');
  });

  it('Python bytes 字面量与多行括号', () => {
    const { code, extension } = generateCode(new Uint8Array([0x48, 0x69, 10]), 'python', opts);
    expect(extension).toBe('py');
    expect(code).toContain('data = (');
    expect(code).toContain('b"\\x48\\x69\\x0a"');
    expect(code).not.toContain('// 3 bytes');
    expect(code).toContain('# 3 bytes');
  });

  it('Go []byte 短变量声明', () => {
    const { code, extension } = generateCode(HELLO, 'go', opts);
    expect(extension).toBe('go');
    expect(code).toContain('data := []byte{');
    expect(code).toContain('0x48, 0x69');
  });

  it('按每行字节数换行', () => {
    const code = generateCode(new Uint8Array([1, 2, 3, 4, 5]), 'c', {
      variableName: 'd',
      bytesPerLine: 2,
    }).code;
    expect(code).toContain('0x01, 0x02,\n  0x03, 0x04,\n  0x05,');
  });

  it('空数组', () => {
    expect(generateCode(new Uint8Array(0), 'c', opts).code).toContain('data[0]');
    expect(generateCode(new Uint8Array(0), 'java', opts).code).toBe('byte[] data = {}; // 0 bytes');
    expect(generateCode(new Uint8Array(0), 'python', opts).code).toBe('data = b""  # 0 bytes');
    expect(generateCode(new Uint8Array(0), 'go', opts).code).toBe('data := []byte{} // 0 bytes');
  });

  it('非法变量名报错', () => {
    expect(() => generateCode(HELLO, 'c', { variableName: '1bad', bytesPerLine: 8 })).toThrow(
      '变量名',
    );
    expect(() => generateCode(HELLO, 'c', { variableName: 'a-b', bytesPerLine: 8 })).toThrow(
      '变量名',
    );
  });
});

describe('parseArrayLiteral 反向解析', () => {
  it('解析 C 风格数组', () => {
    const c = `const unsigned char data[] = {
      0x48, 0x65, 0x6C, 0x6C, 0x6F,
      0x2C, 0x20, 0xE4, 0xB8
    };`;
    expect(Array.from(parseArrayLiteral(c))).toEqual([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0xe4, 0xb8,
    ]);
  });

  it('解析 Java (byte) 强转与负数', () => {
    const java = 'byte[] x = { 0x01, (byte) 0x80, (byte)0xFF, -1, -16 };';
    expect(Array.from(parseArrayLiteral(java))).toEqual([1, 0x80, 0xff, 0xff, 0xf0]);
  });

  it('解析 Go 方括号十进制', () => {
    expect(Array.from(parseArrayLiteral('x := []byte{72, 105}'))).toEqual([72, 105]);
  });

  it('解析 Python b"..." 转义字符串（含相邻拼接）', () => {
    expect(Array.from(parseArrayLiteral("data = b'\\x48\\x69'"))).toEqual([0x48, 0x69]);
    expect(
      Array.from(parseArrayLiteral('data = (b"\\x48\\x69" b"\\x0a")')),
    ).toEqual([0x48, 0x69, 0x0a]);
  });

  it('常见字符转义', () => {
    expect(decodeEscapes('\\n\\r\\t\\\\\\x41')).toEqual([0x0a, 0x0d, 0x09, 0x5c, 0x41]);
  });

  it('解析 Python 混合数值与字符串时以字符串优先（数组体不重复计数）', () => {
    // b"\x48" 被字符串提取，花括号内无内容
    expect(Array.from(parseArrayLiteral("x = [b'\\x48']"))).toEqual([0x48]);
  });

  it('超出范围与空输入报错', () => {
    expect(() => parseArrayLiteral('{ 256 }')).toThrow('超出 0-255');
    expect(() => parseArrayLiteral('{ 0x100 }')).toThrow('超出 0-255');
    expect(() => parseArrayLiteral('')).toThrow('请粘贴');
    expect(() => parseArrayLiteral('nothing here')).toThrow('未在粘贴内容中识别到字节');
  });
});

describe('isValidIdentifier', () => {
  it('判断标识符', () => {
    expect(isValidIdentifier('data')).toBe(true);
    expect(isValidIdentifier('_x1')).toBe(true);
    expect(isValidIdentifier('1x')).toBe(false);
    expect(isValidIdentifier('a b')).toBe(false);
  });
});
