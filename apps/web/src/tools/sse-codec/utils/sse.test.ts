import { describe, expect, it } from 'vitest';
import { decodeSse, encodeSse, type SseMessage } from './sse';

/** 构造一条消息的便捷工厂 */
const message = (partial: Partial<SseMessage> = {}): SseMessage => ({
  data: 'hello',
  ...partial,
});

describe('encodeSse', () => {
  it('单条 data 输出 data: 行并以空行结尾', () => {
    const result = encodeSse([message()]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('data: hello\n\n');
    }
  });

  it('多行 data 按 \\n 拆分为多个 data: 行', () => {
    const result = encodeSse([message({ data: 'line1\nline2\nline3' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('data: line1\ndata: line2\ndata: line3\n\n');
    }
  });

  it('字段输出顺序固定为 id、event、retry、data，注释在最前', () => {
    const result = encodeSse([
      message({
        data: 'payload',
        event: 'update',
        id: '42',
        retry: 5000,
        comment: 'keep-alive',
      }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe(
        ': keep-alive\nid: 42\nevent: update\nretry: 5000\ndata: payload\n\n',
      );
    }
  });

  it('多条消息之间用空行分隔', () => {
    const result = encodeSse([
      message({ data: 'a' }),
      message({ data: 'b', event: 'ping' }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('data: a\n\nevent: ping\ndata: b\n\n');
    }
  });

  it('空数组输出空字符串；retry 为 0 是合法值', () => {
    expect(encodeSse([])).toEqual({ ok: true, output: '' });
    const result = encodeSse([message({ data: 'x', retry: 0 })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('retry: 0\ndata: x\n\n');
    }
  });

  it('非法 retry（负数、小数、NaN、Infinity）返回校验错误', () => {
    const negative = encodeSse([message({ retry: -1 })]);
    expect(negative.ok).toBe(false);
    if (!negative.ok) {
      expect(negative.errors[0]).toContain('retry 必须是非负十进制整数');
    }

    const decimal = encodeSse([message({ retry: 1.5 })]);
    expect(decimal.ok).toBe(false);

    const nan = encodeSse([message({ retry: Number.NaN })]);
    expect(nan.ok).toBe(false);

    const infinity = encodeSse([message({ retry: Number.POSITIVE_INFINITY })]);
    expect(infinity.ok).toBe(false);
  });

  it('id / event 含换行时返回校验错误', () => {
    const result = encodeSse([
      message({ id: 'a\nb' }),
      message({ event: 'x\ry' }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('id 不能包含换行符');
      expect(result.errors[1]).toContain('event 不能包含换行符');
    }
  });

  it('data 中的 \\r\\n 与 \\r 规范化为 \\n 后拆分', () => {
    const result = encodeSse([message({ data: 'a\r\nb\rc' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('data: a\ndata: b\ndata: c\n\n');
    }
  });

  it('data 中的空行也输出独立的 data: 行', () => {
    const result = encodeSse([message({ data: 'a\n\nb' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe('data: a\ndata: \ndata: b\n\n');
    }
  });
});

describe('decodeSse', () => {
  it('单条 data 在空行派发时解析为事件', () => {
    const result = decodeSse('data: hello\n\n');
    expect(result.events).toEqual([
      { event: null, id: null, retry: null, data: 'hello' },
    ]);
    expect(result.warnings).toEqual([]);
    expect(result.skipped).toBe(0);
  });

  it('支持 \\r\\n、\\r、\\n 三种换行且结果一致', () => {
    const expected = [{ event: null, id: null, retry: null, data: 'hello' }];
    expect(decodeSse('data: hello\r\n\r\n').events).toEqual(expected);
    expect(decodeSse('data: hello\r\r').events).toEqual(expected);
    expect(decodeSse('data: hello\n\n').events).toEqual(expected);
  });

  it('以冒号开头的注释/心跳行被忽略', () => {
    const result = decodeSse(': heartbeat\n: another comment\ndata: x\n\n');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.data).toBe('x');
  });

  it('多个 data 行的值用 \\n 拼接，包括空 data 行', () => {
    const result = decodeSse('data: a\ndata: \ndata: b\n\n');
    expect(result.events[0]?.data).toBe('a\n\nb');
  });

  it('空行触发派发并重置缓冲，字段不会泄漏到下一条事件', () => {
    const result = decodeSse(
      'event: first\ndata: 1\n\ndata: 2\n\n',
    );
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toEqual({ event: 'first', id: null, retry: null, data: '1' });
    expect(result.events[1]).toEqual({ event: null, id: null, retry: null, data: '2' });
  });

  it('正确解析 event / id / retry 字段', () => {
    const result = decodeSse('id: 7\nevent: notice\nretry: 3000\ndata: payload\n\n');
    expect(result.events[0]).toEqual({
      event: 'notice',
      id: '7',
      retry: 3000,
      data: 'payload',
    });
  });

  it('retry 非数字时按规范忽略并记录带行号的警告', () => {
    const result = decodeSse('retry: abc\ndata: x\n\n');
    expect(result.events[0]?.retry).toBeNull();
    expect(result.warnings).toEqual([
      { line: 1, message: expect.stringContaining('retry') },
    ]);
  });

  it('无 data 行的缓冲不派发并计入 skipped', () => {
    const result = decodeSse('event: ghost\nid: 1\nretry: 100\n\ndata: real\n\n');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.data).toBe('real');
    expect(result.skipped).toBe(1);
  });

  it('无冒号的行字段值为空串；未知字段忽略', () => {
    const result = decodeSse('data\ndata: tail\nfoo: bar\n\n');
    expect(result.events[0]?.data).toBe('\ntail');
  });

  it('冒号后仅去掉一个空格，其余空格保留', () => {
    const result = decodeSse('data:    spaced\n\n');
    expect(result.events[0]?.data).toBe('   spaced');
  });

  it('没有结尾空行时缓冲不派发（与浏览器 EventSource 一致）', () => {
    const result = decodeSse('data: dangling');
    expect(result.events).toEqual([]);
  });
});

describe('encodeSse / decodeSse 往返一致', () => {
  it('encode → decode 还原 data / event / id / retry', () => {
    const messages: SseMessage[] = [
      { data: 'simple' },
      { data: 'multi\nline\npayload', event: 'update', id: 'id-1', retry: 2500 },
      { data: 'third', event: 'ping' },
    ];
    const encoded = encodeSse(messages);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }

    const decoded = decodeSse(encoded.output);
    expect(decoded.events).toEqual([
      { event: null, id: null, retry: null, data: 'simple' },
      { event: 'update', id: 'id-1', retry: 2500, data: 'multi\nline\npayload' },
      { event: 'ping', id: null, retry: null, data: 'third' },
    ]);
    expect(decoded.warnings).toEqual([]);
    expect(decoded.skipped).toBe(0);
  });

  it('往返处理含 \\r\\n 的 data 与空 data 行', () => {
    const encoded = encodeSse([message({ data: 'a\r\nb\n' })]);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }
    const decoded = decodeSse(encoded.output);
    expect(decoded.events[0]?.data).toBe('a\nb\n');
  });
});
