import { describe, it, expect } from 'vitest';
import {
  MessagePackError,
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  decodeMessagePack,
  encodeJsonToBytes,
  encodeMessagePack,
  hexDump,
  hexToBytes,
} from './messagepack';

describe('MessagePack 官方规范向量', () => {
  it('{"compact":true,"schema":0} 逐字节匹配官方序列', () => {
    const bytes = encodeJsonToBytes(JSON.stringify({ compact: true, schema: 0 }));
    expect(bytesToHex(bytes)).toBe('82a7636f6d70616374c3a6736368656d6100');
  });

  it('官方 HEX（带空格 0x）解码还原对象', () => {
    const hex = '82 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00';
    expect(decodeMessagePack(hexToBytes(hex))).toEqual({ compact: true, schema: 0 });
  });
});

describe('整数最紧凑宽度选择', () => {
  it.each([
    [0, '00'],
    [1, '01'],
    [127, '7f'],
    [128, 'cc80'],
    [255, 'ccff'],
    [256, 'cd0100'],
    [65535, 'cdffff'],
    [65536, 'ce00010000'],
    [4294967295, 'ceffffffff'],
  ])('非负整数 %s 编码为 %s', (n, hex) => {
    expect(bytesToHex(encodeMessagePack(n))).toBe(hex);
  });

  it.each([
    [-1, 'ff'],
    [-32, 'e0'],
    [-33, 'd0df'],
    [-128, 'd080'],
    [-129, 'd1ff7f'],
    [-32768, 'd18000'],
    [-32769, 'd2ffff7fff'],
  ])('负整数 %s 编码为 %s', (n, hex) => {
    expect(bytesToHex(encodeMessagePack(n))).toBe(hex);
  });

  it('64 位安全整数走 uint64/int64 且可往返', () => {
    const big = 9007199254740991; // Number.MAX_SAFE_INTEGER
    const encoded = encodeMessagePack(big);
    expect(encoded[0]).toBe(0xcf);
    expect(decodeMessagePack(encoded)).toBe(big);

    const neg = -9007199254740991;
    const negEncoded = encodeMessagePack(neg);
    expect(negEncoded[0]).toBe(0xd3);
    expect(decodeMessagePack(negEncoded)).toBe(neg);
  });
});

describe('标量类型编码', () => {
  it('nil 与布尔', () => {
    expect(Array.from(encodeMessagePack(null))).toEqual([0xc0]);
    expect(Array.from(encodeMessagePack(true))).toEqual([0xc3]);
    expect(Array.from(encodeMessagePack(false))).toEqual([0xc2]);
  });

  it('浮点走 float64（0xcb）', () => {
    const encoded = encodeMessagePack(3.14);
    expect(encoded[0]).toBe(0xcb);
    expect(decodeMessagePack(encoded)).toBeCloseTo(3.14);
  });

  it('fixstr 含中文 UTF-8 多字节', () => {
    const encoded = encodeMessagePack('你好');
    // 你好 = 6 个 UTF-8 字节，fixstr 头 0xa6
    expect(encoded[0]).toBe(0xa6);
    expect(decodeMessagePack(encoded)).toBe('你好');
  });

  it('str8 长度前缀（构造 40 字符字符串）', () => {
    const s = 'a'.repeat(40);
    const encoded = encodeMessagePack(s);
    expect(encoded[0]).toBe(0xd9);
    expect(encoded[1]).toBe(40);
    expect(decodeMessagePack(encoded)).toBe(s);
  });
});

describe('数组与 Map 容器', () => {
  it('fixarray 与 fixmap 往返', () => {
    const value = { list: [1, 2, 3], nested: { ok: true, none: null } };
    const encoded = encodeJsonToBytes(JSON.stringify(value));
    expect(decodeMessagePack(encoded)).toEqual(value);
  });

  it('array16/map16 宽度（16 元素以上）', () => {
    const arr = Array.from({ length: 20 }, (_, i) => i);
    const encoded = encodeMessagePack(arr);
    expect(encoded[0]).toBe(0xdc); // array16
    expect(decodeMessagePack(encoded)).toEqual(arr);

    const obj: Record<string, number> = {};
    for (let i = 0; i < 20; i += 1) obj[`k${i}`] = i;
    const objEncoded = encodeMessagePack(obj);
    expect(objEncoded[0]).toBe(0xde); // map16
    expect(decodeMessagePack(objEncoded)).toEqual(obj);
  });
});

describe('HEX / Base64 输入与字节工具', () => {
  it('HEX 与 Base64 两种输入解码结果一致', () => {
    const original = { compact: true, schema: 0 };
    const bytes = encodeJsonToBytes(JSON.stringify(original));
    const hex = bytesToHex(bytes, 1);
    const b64 = bytesToBase64(bytes);
    expect(decodeMessagePack(hexToBytes(hex))).toEqual(original);
    expect(decodeMessagePack(base64ToBytes(b64))).toEqual(original);
  });

  it('hexDump 每行最多 16 字节并带偏移', () => {
    const dump = hexDump(new Uint8Array(20));
    const lines = dump.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]?.startsWith('00000000')).toBe(true);
    expect(lines[1]?.startsWith('00000010')).toBe(true);
  });
});

describe('错误定位', () => {
  it('截断输入报带偏移的 MessagePackError', () => {
    // str8 头声明长度 10 但没有后续字节
    const truncated = new Uint8Array([0xd9, 0x0a]);
    expect(() => decodeMessagePack(truncated)).toThrow(MessagePackError);
    try {
      decodeMessagePack(truncated);
    } catch (e) {
      expect(e).toBeInstanceOf(MessagePackError);
      expect((e as MessagePackError).offset).toBe(2);
    }
  });

  it('非法首字节报带偏移错误', () => {
    expect(() => decodeMessagePack(new Uint8Array([0xc1]))).toThrow(/字节偏移 0/);
  });

  it('尾随字节报错', () => {
    const bytes = new Uint8Array([0xc3, 0x00]); // true + 多余字节
    expect(() => decodeMessagePack(bytes)).toThrow(/尾随字节/);
  });

  it('空输入报错', () => {
    expect(() => decodeMessagePack(new Uint8Array(0))).toThrow(/输入为空/);
  });

  it('奇数长度 HEX 报错', () => {
    expect(() => hexToBytes('abc')).toThrow(/偶数/);
  });

  it('非法 Base64 报错', () => {
    expect(() => base64ToBytes('@@@')).toThrow(/Base64/);
  });
});

describe('ext 与 bin 解码保留', () => {
  it('fixext1 解码保留 type 与 dataHex', () => {
    // 0xd4 fixext1, type=5, data=0xaa
    const bytes = new Uint8Array([0xd4, 0x05, 0xaa]);
    const decoded = decodeMessagePack(bytes) as { __ext: boolean; type: number; dataHex: string };
    expect(decoded.__ext).toBe(true);
    expect(decoded.type).toBe(5);
    expect(decoded.dataHex).toBe('aa');
  });

  it('bin8 解码为 hex 字符串', () => {
    // 0xc4 bin8, len=3, 0x01 0x02 0x03
    const bytes = new Uint8Array([0xc4, 0x03, 0x01, 0x02, 0x03]);
    expect(decodeMessagePack(bytes)).toBe('010203');
  });
});
