import { describe, expect, it } from 'vitest';
import {
  decodeResp,
  encodeResp,
  toResp2,
  type RespValue,
} from './resp';

describe('decodeResp', () => {
  it('解析 RESP2 五种基础类型', () => {
    const text = ['+OK', '-ERR wrong', ':1000', '$5', 'hello', '*-1', ''].join('\r\n');
    const result = decodeResp(text);
    expect(result.error).toBeNull();
    expect(result.messages).toHaveLength(5);
    expect(result.messages[0]).toEqual({ type: 'simple-string', value: 'OK' });
    expect(result.messages[1]).toEqual({ type: 'error', value: 'ERR wrong' });
    expect(result.messages[2]).toEqual({ type: 'integer', value: BigInt(1000) });
    expect(result.messages[3]).toEqual({ type: 'bulk-string', data: 'hello' });
    expect(result.messages[4]).toEqual({ type: 'null' });
    expect(result.remainder).toBe('');
  });

  it('解析嵌套数组（LRANGE 回复）', () => {
    const text = ['*2', '$3', 'foo', '$3', 'bar', ''].join('\r\n');
    const result = decodeResp(text);
    expect(result.error).toBeNull();
    expect(result.messages[0]).toEqual({
      type: 'array',
      elements: [
        { type: 'bulk-string', data: 'foo' },
        { type: 'bulk-string', data: 'bar' },
      ],
    });
  });

  it('解析 RESP3 Map、Set、Boolean、Double 与 BigNumber', () => {
    const text = [
      '%1', '$1', 'a', '#t',
      '~2', ':1', ':2',
      ',3.14', '(12345678901234567890',
      '',
    ].join('\r\n');
    const result = decodeResp(text);
    expect(result.error).toBeNull();
    expect(result.messages[0]?.type).toBe('map');
    expect(result.messages[1]?.type).toBe('set');
    expect(result.messages[2]).toEqual({ type: 'double', value: 3.14 });
    expect(result.messages[3]).toEqual({
      type: 'big-number',
      value: BigInt('12345678901234567890'),
    });
  });

  it('解析 verbatim string 并拆分编码前缀', () => {
    const payload = 'txt:hello';
    const text = [`=${payload.length}`, payload, ''].join('\r\n');
    const result = decodeResp(text);
    expect(result.error).toBeNull();
    expect(result.messages[0]).toEqual({
      type: 'verbatim-string',
      value: 'txt',
      data: 'hello',
    });
  });

  it('半包输入保留残片且不报错', () => {
    const partial = '*2\r\n$3\r\nfoo\r\n$10\r\nab';
    const result = decodeResp(partial);
    expect(result.error).toBeNull();
    expect(result.messages).toHaveLength(0);
    expect(result.remainder).toBe(partial);

    const merged = decodeResp(`${partial}cdefghij\r\n`);
    expect(merged.messages).toHaveLength(1);
    expect(merged.remainder).toBe('');
  });

  it('非法首字节与坏整数给出明确错误', () => {
    expect(decodeResp('?bad\r\n').error).toContain('未知 RESP 类型首字节');
    expect(decodeResp(':12x\r\n').error).toContain('非法整数');
    expect(decodeResp('#x\r\n').error).toContain('非法布尔值');
  });

  it('verbatim 缺少编码前缀时报错', () => {
    const result = decodeResp('=5\r\nhello\r\n');
    expect(result.error).toContain('Verbatim string');
  });
});

describe('encodeResp', () => {
  it('编码 SET 命令为 RESP2 数组请求', () => {
    const values: RespValue[] = [
      {
        type: 'array',
        elements: [
          { type: 'bulk-string', data: 'SET' },
          { type: 'bulk-string', data: 'key' },
          { type: 'bulk-string', data: '值' },
        ],
      },
    ];
    const result = encodeResp(values);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 「值」的 UTF-8 字节长度为 3
      expect(result.output).toBe('*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$3\r\n值\r\n');
      // 编解码往返
      expect(decodeResp(result.output).messages).toEqual(values);
    }
  });

  it('编码 RESP3 全部标量类型', () => {
    const result = encodeResp([
      { type: 'null' },
      { type: 'boolean', value: true },
      { type: 'double', value: 'inf' },
      { type: 'big-number', value: BigInt(42) },
      { type: 'verbatim-string', value: 'mkd', data: '# hi' },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe(
        ['_\r\n', '#t\r\n', ',inf\r\n', '(42\r\n', '=8\r\nmkd:# hi\r\n'].join(''),
      );
    }
  });

  it('Map 元素数为奇数时校验失败', () => {
    const result = encodeResp([
      { type: 'map', elements: [{ type: 'bulk-string', data: 'k' }] },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('Map');
    }
  });

  it('simple string 含换行时校验失败', () => {
    const result = encodeResp([{ type: 'simple-string', value: 'a\nb' }]);
    expect(result.ok).toBe(false);
  });

  it('空数组输出 *0 并可往返', () => {
    const result = encodeResp([{ type: 'array', elements: [] }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('*0\r\n');
      expect(decodeResp(result.output).messages).toEqual([{ type: 'array', elements: [] }]);
    }
  });
});

describe('toResp2', () => {
  it('RESP3 类型降级为 RESP2 等价结构', () => {
    expect(toResp2({ type: 'null' })).toEqual({
      type: 'bulk-string',
      data: '',
      nullBulk: true,
    });
    expect(encodeResp([toResp2({ type: 'null' })]).ok).toBe(true);
    const degraded = toResp2({
      type: 'map',
      elements: [
        { type: 'bulk-string', data: 'k' },
        { type: 'boolean', value: true },
      ],
    });
    expect(degraded.type).toBe('array');
    expect(degraded.elements?.[1]).toEqual({ type: 'integer', value: BigInt(1) });
  });
});
