import { describe, expect, it } from 'vitest';
import {
  buildBerTlv,
  buildBerTlvList,
  bytesToHex,
  encodeLength,
  flattenNodes,
  parseBerTlv,
  parseHexBytes,
} from './tlv';

describe('parseHexBytes and encodeLength', () => {
  it('parses flexible hex input', () => {
    expect(parseHexBytes('6f 1a,0x5f')).toEqual([0x6f, 0x1a, 0x5f]);
  });

  it('rejects malformed hex', () => {
    expect(() => parseHexBytes('abc')).toThrow('偶数');
    expect(() => parseHexBytes('zz')).toThrow('非十六进制字符');
  });

  it('encodes short and long lengths', () => {
    expect(encodeLength(10)).toEqual([10]);
    expect(encodeLength(127)).toEqual([127]);
    expect(encodeLength(128)).toEqual([0x81, 0x80]);
    expect(encodeLength(300)).toEqual([0x82, 0x01, 0x2c]);
  });
});

describe('parseBerTlv primitive and multi-byte tags', () => {
  it('parses a primitive single-byte tag', () => {
    const [node] = parseBerTlv('5F 2A 02 12 34');
    expect(node!.tag).toBe('5F2A');
    expect(node!.tagBytes).toEqual([0x5f, 0x2a]);
    expect(node!.constructed).toBe(false);
    expect(node!.valueHex).toBe('12 34');
    expect(node!.totalLength).toBe(5);
  });

  it('parses a context-specific primitive 9F38', () => {
    const [node] = parseBerTlv('9F 38 03 01 02 03');
    expect(node!.tag).toBe('9F38');
    expect(node!.tagClass).toBe('context-specific');
    expect(node!.tagNumber).toBe(0x38);
    expect(node!.value).toEqual([1, 2, 3]);
  });

  it('parses multiple top-level TLVs', () => {
    const nodes = parseBerTlv('5A 03 01 02 03 5F 2A 01 AA');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.tag).toBe('5A');
    expect(nodes[1]!.tag).toBe('5F2A');
  });

  it('parses a long-form length', () => {
    const payload = new Array(128).fill(0x11);
    const hex = `9F 01 81 80 ${payload.map((b) => b.toString(16).padStart(2, '0')).join(' ')}`;
    const [node] = parseBerTlv(hex);
    expect(node!.value).toHaveLength(128);
    expect(node!.lengthBytes).toBe(2);
  });
});

describe('parseBerTlv constructed nesting', () => {
  it('parses a constructed template with nested children', () => {
    // 6F 07 (constructed) -> 5A 02 12 34, 5F 2A 00
    const [root] = parseBerTlv('6F 07 5A 02 12 34 5F 2A 00');
    expect(root!.constructed).toBe(true);
    expect(root!.children).toHaveLength(2);
    expect(root!.children[0]!.tag).toBe('5A');
    expect(root!.children[1]!.tag).toBe('5F2A');
    expect(root!.children[1]!.value).toEqual([]);
  });

  it('parses three levels of nesting', () => {
    // A0 inner: 6F 04 (5A 02 AA BB)
    const [outer] = parseBerTlv('A0 06 6F 04 5A 02 AA BB');
    expect(outer!.tag).toBe('A0');
    const middle = outer!.children[0]!;
    expect(middle.tag).toBe('6F');
    expect(middle.children[0]!.value).toEqual([0xaa, 0xbb]);
  });

  it('rejects a length exceeding the data boundary', () => {
    expect(() => parseBerTlv('5A 05 01 02')).toThrow('超出数据边界');
  });

  it('rejects malformed constructed content', () => {
    // 6F claims 4 bytes but contains an incomplete child TLV
    expect(() => parseBerTlv('6F 04 5A 02 12')).toThrow();
  });
});

describe('indefinite length', () => {
  it('parses an indefinite-length constructed TLV ending in 00 00', () => {
    const [node] = parseBerTlv('30 80 02 01 01 00 00');
    expect(node!.indefinite).toBe(true);
    expect(node!.constructed).toBe(true);
    expect(node!.children).toHaveLength(1);
    expect(node!.children[0]!.value).toEqual([1]);
  });

  it('rejects indefinite length on a primitive tag', () => {
    expect(() => parseBerTlv('04 80 00 00')).toThrow('不能使用不定长');
  });
});

describe('buildBerTlv and round trip', () => {
  it('builds a primitive TLV', () => {
    expect(bytesToHex(buildBerTlv({ tag: '5A', value: '12 34' }))).toBe('5a 02 12 34');
  });

  it('builds nested constructed TLV and round-trips', () => {
    const bytes = buildBerTlv({
      tag: '6F',
      children: [
        { tag: '5A', value: '12 34' },
        { tag: '5F2A', value: '' },
      ],
    });
    const [root] = parseBerTlv(bytesToHex(bytes));
    expect(root!.tag).toBe('6F');
    expect(root!.constructed).toBe(true);
    expect(root!.children).toHaveLength(2);
    expect(root!.children[0]!.valueHex).toBe('12 34');
  });

  it('rejects specifying both value and children', () => {
    expect(() => buildBerTlv({ tag: '6F', value: '01', children: [] })).toThrow('不能同时');
  });

  it('builds a list of top-level TLVs', () => {
    const bytes = buildBerTlvList([
      { tag: '5A', value: '01' },
      { tag: '5F2A', value: 'AA BB' },
    ]);
    expect(parseBerTlv(bytesToHex(bytes))).toHaveLength(2);
  });

  it('round-trips an EMV-like nested structure', () => {
    // 6F 09 -> A0 05 (5A 03 01 02 03) 共 7 字节，再加 5F2A 01 AA 共 4 字节 => 内容 11 字节
    const input = '6F 0B A0 05 5A 03 01 02 03 5F 2A 01 AA';
    const nodes = parseBerTlv(input);
    const rebuilt = bytesToHex(
      buildBerTlvList(
        nodes.map((node) => ({
          tag: node.tag,
          value: node.constructed ? undefined : node.valueHex,
          children: node.constructed
            ? node.children.map((child) => ({ tag: child.tag, value: child.valueHex }))
            : undefined,
        })),
      ),
    );
    expect(rebuilt).toBe(input.toLowerCase());
  });
});

describe('flattenNodes', () => {
  it('flattens nested nodes with depth markers', () => {
    const [outer] = parseBerTlv('A0 06 6F 04 5A 02 AA BB');
    const rows = flattenNodes([outer!]);
    expect(rows.map((row) => [row.depth, row.node.tag])).toEqual([
      [0, 'A0'],
      [1, '6F'],
      [2, '5A'],
    ]);
  });
});
