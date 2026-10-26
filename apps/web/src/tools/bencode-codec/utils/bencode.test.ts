import { describe, it, expect } from 'vitest';
import {
  BencodeValue,
  decodeBencode,
  encodeBencode,
} from './bencode';
import {
  BYTES_MARKER,
  bencodeToJsonish,
  decodeBencodeToJson,
  encodeJsonToBencode,
  jsonishToBencode,
} from './bencode-json';
import { bytesToLatin1, latin1ToBytes } from './bytes-text';

/** 把 Bencode 文本（Latin-1 承载）解码为 TS 值 */
function decodeText(input: string): BencodeValue | null {
  return decodeBencode(latin1ToBytes(input)).value;
}

describe('decodeBencode 权威向量', () => {
  it('解析整数', () => {
    expect(decodeText('i42e')).toBe(42);
    expect(decodeText('i-7e')).toBe(-7);
    expect(decodeText('i0e')).toBe(0);
  });

  it('解析字节串', () => {
    expect(decodeText('4:spam')).toBe('spam');
    expect(decodeText('0:')).toBe('');
  });

  it('解析列表', () => {
    expect(decodeText('l4:spami1ee')).toEqual(['spam', 1]);
    expect(decodeText('le')).toEqual([]);
  });

  it('解析嵌套字典', () => {
    expect(decodeText('d1:ai1e1:bd1:pd1:dli1eli1eeeeee')).toEqual({
      a: 1,
      b: { p: { d: [1, [1]] } },
    });
  });
});

describe('encodeBencode', () => {
  it('生成权威向量', () => {
    expect(bytesToLatin1(encodeBencode(42))).toBe('i42e');
    expect(bytesToLatin1(encodeBencode('spam'))).toBe('4:spam');
    expect(bytesToLatin1(encodeBencode(['spam', 1]))).toBe('l4:spami1ee');
    expect(bytesToLatin1(encodeBencode({ a: 1, b: { p: { d: [1, [1]] } } }))).toBe(
      'd1:ai1e1:bd1:pd1:dli1eli1eeeeee',
    );
  });

  it('字典键自动按字节序排序', () => {
    // 输入键顺序为 b、a，输出必须排序为 a、b
    expect(bytesToLatin1(encodeBencode({ b: 2, a: 1 }))).toBe('d1:ai1e1:bi2ee');
  });

  it('拒绝非整数', () => {
    expect(() => encodeBencode(1.5)).toThrow();
    expect(() => encodeBencode(NaN)).toThrow();
  });
});

describe('往返一致性', () => {
  it('典型 .torrent 风格结构 encode→decode 无损', () => {
    const torrent = {
      announce: 'http://tracker.example.com/announce',
      'creation date': 1327049827,
      info: {
        length: 12345,
        name: 'example.txt',
        'piece length': 16384,
        pieces: new Uint8Array([0x00, 0xff, 0x41, 0xfe]),
        private: 0,
      },
    };
    const encoded = encodeBencode(torrent);
    const decoded = decodeBencode(encoded);
    expect(decoded.error).toBeNull();
    expect(decoded.value).toEqual(torrent);
  });

  it('非 UTF-8 字节串以 Uint8Array 原样还原', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x00, 0x80]);
    const decoded = decodeBencode(encodeBencode(bytes));
    expect(decoded.value).toBeInstanceOf(Uint8Array);
    expect([...(decoded.value as Uint8Array)]).toEqual([0xff, 0xfe, 0x00, 0x80]);
  });
});

describe('严格错误校验', () => {
  it('非法起始字符报错并带位置', () => {
    const result = decodeBencodeToJson('x12e');
    expect(result.error).toContain('位置 0');
  });

  it('整数前导零非法', () => {
    expect(decodeBencodeToJson('i042e').error).toContain('前导零');
  });

  it('-0 非法', () => {
    expect(decodeBencodeToJson('i-0e').error).toContain('前导零');
  });

  it('字节串长度不足报错', () => {
    const result = decodeBencodeToJson('9:short');
    expect(result.error).toContain('声明长度');
  });

  it('列表截断报错', () => {
    expect(decodeBencodeToJson('l4:spam').error).toContain('结束符');
  });

  it('字典键未排序报错', () => {
    const result = decodeBencodeToJson('d1:bi2e1:ai1ee');
    expect(result.error).toContain('字节序');
  });

  it('字典键重复报错', () => {
    const result = decodeBencodeToJson('d1:ai1e1:ai2ee');
    expect(result.error).toContain('重复');
  });

  it('字典键必须是字节串', () => {
    const result = decodeBencodeToJson('di1ei2ee');
    expect(result.error).toContain('字节串');
  });

  it('根元素后有多余字节报错', () => {
    const result = decodeBencodeToJson('i42ei43e');
    expect(result.error).toContain('多余字节');
  });

  it('空输入报错', () => {
    expect(decodeBencodeToJson('').error).toContain('意外的输入结尾');
  });
});

describe('Bencode ↔ JSON 双向转换', () => {
  it('解码为 JSON 结构，非 UTF-8 字节串使用标记对象（十六进制）', () => {
    const bytes = new Uint8Array([0xff, 0x41]);
    const encoded = bytesToLatin1(encodeBencode({ x: bytes }));
    const result = decodeBencodeToJson(encoded);
    expect(result.error).toBeNull();
    expect(result.output).toEqual({ x: { [BYTES_MARKER]: 'ff41' } });
  });

  it('JSON 编码为 Bencode，再解码还原', () => {
    const jsonText = JSON.stringify({
      announce: 'udp://tracker.example:1337',
      info: { length: 2048, name: 'a.iso', pieces: { [BYTES_MARKER]: '00ff' } },
    });
    const encoded = encodeJsonToBencode(jsonText);
    expect(encoded.error).toBeNull();
    const back = decodeBencodeToJson(encoded.output as string);
    expect(JSON.stringify(back.output)).toBe(jsonText);
  });

  it('JSON 非法时报错', () => {
    expect(encodeJsonToBencode('{not json').error).toContain('JSON');
  });

  it('非法十六进制字节标记报错', () => {
    expect(() => jsonishToBencode({ [BYTES_MARKER]: 'xyz' })).toThrow();
    expect(() => jsonishToBencode({ [BYTES_MARKER]: 'abc' })).toThrow();
  });

  it('bencodeToJsonish 递归处理嵌套数组与字典', () => {
    expect(bencodeToJsonish([1, 'a', new Uint8Array([0x0a])])).toEqual([
      1,
      'a',
      { [BYTES_MARKER]: '0a' },
    ]);
  });
});
