import { describe, expect, it } from 'vitest';
import {
  TYPE_LABELS,
  encodeBulkString,
  encodeInlineToResp,
  encodeValue,
  parseInlineCommand,
  parseResp,
} from './resp';

describe('parseResp RESP2 基础类型', () => {
  it('解析简单字符串', () => {
    const [node] = parseResp('+OK\r\n');
    expect(node!.type).toBe('simple-string');
    expect(node!.prefix).toBe('+');
    expect(node!.value).toBe('OK');
    expect(node!.raw).toBe('+OK\r\n');
  });

  it('解析错误消息', () => {
    const [node] = parseResp('-ERR unknown command\r\n');
    expect(node!.type).toBe('error');
    expect(node!.value).toBe('ERR unknown command');
  });

  it('解析整数', () => {
    const [node] = parseResp(':1024\r\n');
    expect(node!.type).toBe('integer');
    expect(node!.value).toBe('1024');
  });

  it('解析普通批量字符串与空批量字符串', () => {
    const [node] = parseResp('$5\r\nhello\r\n');
    expect(node!.type).toBe('bulk-string');
    expect(node!.value).toBe('hello');

    const [empty] = parseResp('$0\r\n\r\n');
    expect(empty!.type).toBe('bulk-string');
    expect(empty!.value).toBe('');
  });

  it('解析 null bulk string（$-1）', () => {
    const [node] = parseResp('$-1\r\n');
    expect(node!.type).toBe('null');
    expect(node!.value).toBeNull();
  });

  it('解析数组与 null 数组', () => {
    const [node] = parseResp('*2\r\n$3\r\nfoo\r\n:42\r\n');
    expect(node!.type).toBe('array');
    expect(node!.children).toHaveLength(2);
    expect(node!.children![0]!.value).toBe('foo');
    expect(node!.children![1]!.value).toBe('42');

    const [nullArray] = parseResp('*-1\r\n');
    expect(nullArray!.type).toBe('null');
  });

  it('批量字符串支持二进制安全的 CRLF 载荷', () => {
    const [node] = parseResp('$7\r\nab\r\ncde\r\n');
    expect(node!.type).toBe('bulk-string');
    expect(node!.value).toBe('ab\r\ncde');
  });
});

describe('parseResp RESP3 新类型', () => {
  it('解析 RESP3 null（_）', () => {
    const [node] = parseResp('_\r\n');
    expect(node!.type).toBe('null');
    expect(node!.prefix).toBe('_');
  });

  it('解析双精度浮点（,）', () => {
    const [node] = parseResp(',3.14\r\n');
    expect(node!.type).toBe('double');
    expect(node!.value).toBe('3.14');
  });

  it('解析布尔（#）并拒绝非法值', () => {
    expect(parseResp('#t\r\n')[0]!.value).toBe('true');
    expect(parseResp('#f\r\n')[0]!.value).toBe('false');
    expect(() => parseResp('#x\r\n')).toThrow('t 或 f');
  });

  it('解析大整数（(）', () => {
    const [node] = parseResp('(3492890328409238509324568730\r\n');
    expect(node!.type).toBe('big-number');
    expect(node!.value).toBe('3492890328409238509324568730');
  });

  it('解析 bulk error（!）', () => {
    const [node] = parseResp('!21\r\nSYNTAX invalid syntax\r\n');
    expect(node!.type).toBe('bulk-error');
    expect(node!.value).toBe('SYNTAX invalid syntax');
  });

  it('解析 verbatim string（=）并提取编码提示', () => {
    const [node] = parseResp('=15\r\ntxt:Some string\r\n');
    expect(node!.type).toBe('verbatim-string');
    expect(node!.verbatimEncoding).toBe('txt');
    expect(node!.value).toBe('Some string');
  });

  it('verbatim string 缺少编码提示时报错', () => {
    expect(() => parseResp('=5\r\nhello\r\n')).toThrow('编码提示');
  });

  it('解析 set（~）', () => {
    const [node] = parseResp('~2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    expect(node!.type).toBe('set');
    expect(node!.children).toHaveLength(2);
  });

  it('解析 push（>）', () => {
    const [node] = parseResp('>2\r\n$6\r\nCONFIG\r\n$3\r\nGET\r\n');
    expect(node!.type).toBe('push');
    expect(node!.children).toHaveLength(2);
  });

  it('解析 map（|）的键值对', () => {
    const [node] = parseResp('|1\r\n+first\r\n:1\r\n');
    expect(node!.type).toBe('map');
    expect(node!.entries).toHaveLength(1);
    const [key, value] = node!.entries![0]!;
    expect(key.value).toBe('first');
    expect(value.value).toBe('1');
  });

  it('解析多层嵌套结构', () => {
    const [node] = parseResp('*2\r\n*1\r\n:1\r\n|1\r\n$1\r\na\r\n#t\r\n');
    expect(node!.type).toBe('array');
    expect(node!.children![0]!.children![0]!.value).toBe('1');
    expect(node!.children![1]!.type).toBe('map');
    expect(node!.children![1]!.entries![0]![1].value).toBe('true');
  });
});

describe('parseResp 错误处理与多消息', () => {
  it('空输入抛错', () => {
    expect(() => parseResp('   ')).toThrow('输入为空');
  });

  it('缺少 CRLF 抛错', () => {
    expect(() => parseResp('+OK')).toThrow('CRLF');
  });

  it('遇到未知前缀抛错', () => {
    expect(() => parseResp('?12\r\n')).toThrow('不支持的 RESP 前缀');
  });

  it('批量字符串被截断时抛错', () => {
    expect(() => parseResp('$5\r\nab\r\n')).toThrow('截断');
  });

  it('非法长度抛错', () => {
    expect(() => parseResp('$x\r\n')).toThrow('非法');
  });

  it('连续解析多个顶层消息', () => {
    const nodes = parseResp('+OK\r\n:1\r\n');
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.type).toBe('simple-string');
    expect(nodes[1]!.type).toBe('integer');
  });
});

describe('parseInlineCommand', () => {
  it('按空格分词', () => {
    expect(parseInlineCommand('SET key value')).toEqual(['SET', 'key', 'value']);
  });

  it('支持双引号包裹的 token 与转义', () => {
    expect(parseInlineCommand('SET msg "hello world"')).toEqual(['SET', 'msg', 'hello world']);
    expect(parseInlineCommand('ECHO "a\\"b"')).toEqual(['ECHO', 'a"b']);
  });

  it('空命令抛错', () => {
    expect(() => parseInlineCommand('  ')).toThrow('inline 命令为空');
  });
});

describe('编码器', () => {
  it('encodeBulkString 输出带长度的 bulk', () => {
    expect(encodeBulkString('hello')).toBe('$5\r\nhello\r\n');
  });

  it('encodeInlineToResp 生成 RESP2 数组协议', () => {
    expect(encodeInlineToResp('GET key')).toBe('*2\r\n$3\r\nGET\r\n$3\r\nkey\r\n');
  });

  it('encodeValue 处理 null、布尔、整数、浮点与 bigint', () => {
    expect(encodeValue(null)).toBe('_\r\n');
    expect(encodeValue(undefined)).toBe('_\r\n');
    expect(encodeValue(true)).toBe('#t\r\n');
    expect(encodeValue(false)).toBe('#f\r\n');
    expect(encodeValue(7)).toBe(':7\r\n');
    expect(encodeValue(2.5)).toBe(',2.5\r\n');
    expect(encodeValue(BigInt(10))).toBe('(10\r\n');
  });

  it('encodeValue 处理字符串、Error、数组与对象', () => {
    expect(encodeValue('hi')).toBe('$2\r\nhi\r\n');
    expect(encodeValue(new Error('boom'))).toBe('-boom\r\n');
    expect(encodeValue([1, 'a'])).toBe('*2\r\n:1\r\n$1\r\na\r\n');
    expect(encodeValue({ k: true })).toBe('|1\r\n$1\r\nk\r\n#t\r\n');
  });

  it('编码结果可被 parseResp 往返解析', () => {
    const wire = encodeValue({ name: 'redis', count: 2, ok: true, tags: ['a', 'b'] });
    const [node] = parseResp(wire);
    expect(node!.type).toBe('map');
    expect(node!.entries).toHaveLength(4);

    const inline = encodeInlineToResp('SET greeting "hello world"');
    const [cmd] = parseResp(inline);
    expect(cmd!.type).toBe('array');
    expect(cmd!.children).toHaveLength(3);
    expect(cmd!.children![2]!.value).toBe('hello world');
  });

  it('TYPE_LABELS 覆盖全部节点类型', () => {
    expect(Object.keys(TYPE_LABELS)).toHaveLength(14);
    expect(TYPE_LABELS['bulk-string']).toBe('批量字符串');
  });
});
