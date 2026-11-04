import { describe, expect, it } from 'vitest';
import {
  MAX_DEPTH,
  RlpError,
  beLength,
  bytesToHex,
  countNodes,
  decode,
  encode,
  hexItem,
  hexToBytes,
  tryUtf8,
  utf8Item,
  type RlpDecoded,
  type RlpInput,
} from './rlp';

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit';

function encHex(value: RlpInput): string {
  return bytesToHex(encode(value));
}

describe('encode — Ethereum wiki official vectors', () => {
  it('single bytes below 0x80 are their own RLP', () => {
    expect(encHex(utf8Item(''))).toBe('0x80');
    expect(encHex(hexItem('0x'))).toBe('0x80');
    expect(encHex(hexItem('0x00'))).toBe('0x00');
    expect(encHex(hexItem('0x7f'))).toBe('0x7f');
    expect(encHex(hexItem('0x80'))).toBe('0x8180');
  });

  it('encodes short and long strings', () => {
    expect(encHex(utf8Item('dog'))).toBe('0x83646f67');
    expect(encHex(utf8Item(LOREM))).toBe(
      '0xb8384c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e7365637465747572206164697069736963696e6720656c6974',
    );
  });

  it('encodes empty, short and long lists', () => {
    expect(encHex([])).toBe('0xc0');
    expect(encHex([utf8Item('cat'), utf8Item('dog')])).toBe('0xc88363617483646f67');
    expect(encHex([[], [[]], [[], [[]]]])).toBe('0xc7c0c1c0c3c0c1c0');
    // 1024 个零字节字符串：字符串自身 b90400…；外层列表 payload=1027=0x0403 → f90403
    const longZeros = new Uint8Array(1024);
    const out = encHex([longZeros]);
    expect(out.slice(0, 8)).toBe('0xf90403');
    expect(out.slice(8, 14)).toBe('b90400');
    expect(encHex(longZeros).slice(0, 8)).toBe('0xb90400');
  });

  it('treats 0x-prefixed strings as raw bytes and utf8 as UTF-8', () => {
    expect(encHex(hexItem('0x7067'))).toBe('0x827067');
    // “中” UTF-8 = e4 b8 ad
    expect(encHex(utf8Item('中'))).toBe('0x83e4b8ad');
  });
});

describe('decode — structure and offsets', () => {
  it('decodes dog with byte-accurate prefix metadata', () => {
    const node = decode('0x83646f67');
    expect(node.kind).toBe('string');
    if (node.kind === 'string') {
      expect(node.type).toBe('short-string');
      expect(node.offset).toBe(0);
      expect(node.prefixLength).toBe(1);
      expect(node.length).toBe(3);
      expect(bytesToHex(node.data, false)).toBe('646f67');
      expect(tryUtf8(node.data)).toBe('dog');
    }
  });

  it('decodes nested lists and children offsets', () => {
    const node = decode('0xc7c0c1c0c3c0c1c0');
    expect(node.kind).toBe('list');
    if (node.kind === 'list') {
      expect(node.items).toHaveLength(3);
      expect(node.items[0]?.kind).toBe('list');
      const second = node.items[1];
      expect(second?.kind).toBe('list');
      if (second?.kind === 'list') {
        expect(second.offset).toBe(2);
        expect(second.items[0]?.kind).toBe('list');
      }
    }
    expect(countNodes(node)).toBe(8);
  });

  it('decodes long string and reports long-string type', () => {
    const node = decode(encHex(utf8Item(LOREM)));
    expect(node.kind).toBe('string');
    expect(node.type).toBe('long-string');
    if (node.kind === 'string') {
      expect(node.prefixLength).toBe(2);
      expect(node.length).toBe(56);
    }
  });
});

describe('round-trip', () => {
  const cases: RlpInput[] = [
    utf8Item(''),
    hexItem('0x00'),
    utf8Item('The quick brown fox jumps over the lazy dog'),
    [utf8Item('cat'), [utf8Item('dog'), hexItem('0x7067')], []],
    Array.from({ length: 60 }, () => utf8Item('ab')),
  ];

  it('encode → decode → encode is stable for mixed nested input', () => {
    // 将解码树还原为 RlpInput（字符串→原始字节，列表→数组），再走标准 encode
    const fromTree = (n: RlpDecoded): RlpInput =>
      n.kind === 'string' ? n.data : n.items.map(fromTree);
    for (const value of cases) {
      const encoded = encode(value);
      const node = decode(encoded);
      expect(bytesToHex(encode(fromTree(node)))).toBe(bytesToHex(encoded));
    }
  });
});

describe('decode — malformed and non-canonical input', () => {
  it('rejects empty input', () => {
    expect(() => decode('0x')).toThrow(RlpError);
    expect(() => decode(new Uint8Array(0))).toThrow(/为空/);
  });

  it('rejects trailing bytes after a single root', () => {
    // 0x80 编码空串后多出 0x00
    expect(() => decode('0x8000')).toThrow(/尾字节/);
  });

  it('rejects truncated payload', () => {
    // 声明 3 字节字符串但只给 2 字节
    expect(() => decode('0x83646f')).toThrow(/截断/);
    // 长字符串长度字段不完整
    expect(() => decode('0xb904')).toThrow(/截断/);
  });

  it('rejects non-canonical leading zeros in length bytes', () => {
    // 0xb8 0x00 + 0 字节：长度 0 却用长格式且前导零
    expect(() => decode('0xb800')).toThrow(/前导零|非规范/);
    // 长列表 0xf8 0x00
    expect(() => decode('0xf800')).toThrow(/前导零|非规范/);
  });

  it('rejects long prefix used for short (<=55) payload', () => {
    // 0xb8 0x01 0x00 → 声明 1 字节 payload，应直接 0x00
    expect(() => decode('0xb80100')).toThrow(/非规范|短格式/);
  });

  it('rejects single byte <0x80 wrapped in a short string prefix', () => {
    // 0x81 0x7f 应为裸 0x7f
    expect(() => decode('0x817f')).toThrow(/非规范/);
  });

  it('rejects odd-length / invalid hex', () => {
    expect(() => hexToBytes('0xabc')).toThrow(/偶数/);
    expect(() => hexToBytes('0xzz')).toThrow(/非法字符/);
  });

  it('enforces nesting depth limit', () => {
    // 构造 MAX_DEPTH+1 层嵌套空列表，通过标准 encode 生成合法前缀
    let value: RlpInput = [];
    for (let i = 0; i < MAX_DEPTH + 1; i += 1) {
      value = [value];
    }
    expect(() => decode(encode(value))).toThrow(new RegExp(`深度.*${MAX_DEPTH}`));
    // 恰好 MAX_DEPTH 层可正常解码
    let ok: RlpInput = [];
    for (let i = 0; i < MAX_DEPTH; i += 1) {
      ok = [ok];
    }
    expect(() => decode(encode(ok))).not.toThrow();
  });
});

describe('beLength', () => {
  it('encodes big-endian minimal length bytes', () => {
    expect(Array.from(beLength(0))).toEqual([]);
    expect(Array.from(beLength(56))).toEqual([56]);
    expect(Array.from(beLength(256))).toEqual([1, 0]);
    expect(Array.from(beLength(1024))).toEqual([4, 0]);
  });
});
