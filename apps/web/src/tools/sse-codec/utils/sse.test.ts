import { describe, it, expect } from 'vitest';
import {
  decodeSseStream,
  encodeSseMessage,
  encodeSseStream,
  encodeComment,
  normalizeNewlines,
} from './sse';

describe('decodeSseStream 行解析与派发', () => {
  it('parses the classic MDN multi-line data example', () => {
    // MDN 经典示例：两条 data 行拼接后空行派发
    const stream = 'data: first line\ndata: second line\n\n';
    const result = decodeSseStream(stream);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.data).toBe('first line\nsecond line');
    expect(result.warnings).toEqual([]);
  });

  it('handles CRLF, CR and LF line endings interchangeably', () => {
    const crlf = decodeSseStream('data: a\r\ndata: b\r\n\r\n');
    expect(crlf.messages[0]?.data).toBe('a\nb');

    const cr = decodeSseStream('data: a\rdata: b\r\r');
    expect(cr.messages[0]?.data).toBe('a\nb');

    const mixed = decodeSseStream('event: update\rdata: x\n\r\n');
    expect(mixed.messages[0]?.event).toBe('update');
    expect(mixed.messages[0]?.data).toBe('x');
  });

  it('dispatches on blank lines and resets event/data buffers', () => {
    const stream = [
      'event: add',
      'data: 738',
      '',
      'data: hello',
      '',
      'event: remove',
      'data: 1234',
      'id: 5',
      '',
    ].join('\n');
    const result = decodeSseStream(stream);
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0]).toEqual({ event: 'add', data: '738' });
    // event/data 在派发后重置；id/retry 为标准定义的持久状态
    expect(result.messages[1]).toEqual({ data: 'hello' });
    expect(result.messages[2]).toEqual({ event: 'remove', data: '1234', id: '5' });

    // 连续空行不会产生空消息
    const blanks = decodeSseStream('data: a\n\n\n\ndata: b\n\n');
    expect(blanks.messages.map((message) => message.data)).toEqual(['a', 'b']);
  });

  it('ignores comments (heartbeats) and records them as entries', () => {
    const stream = ': ping\n\n:another comment\ndata: x\n\n';
    const result = decodeSseStream(stream);
    const comments = result.entries.filter((entry) => entry.kind === 'comment');
    expect(comments).toHaveLength(2);
    expect(comments[0]).toMatchObject({ kind: 'comment', comment: ' ping' });
    expect(comments[1]).toMatchObject({ kind: 'comment', comment: 'another comment' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.data).toBe('x');
  });

  it('removes exactly one leading space after the colon', () => {
    const result = decodeSseStream('data:    three leading spaces kept except one\n\n');
    expect(result.messages[0]?.data).toBe('   three leading spaces kept except one');
  });

  it('supports field without colon as empty value', () => {
    const result = decodeSseStream('data\ndata: value\n\n');
    expect(result.messages[0]?.data).toBe('\nvalue');
  });

  it('ignores unknown fields', () => {
    const result = decodeSseStream('futuristic-field: x\ndata: kept\n\n');
    expect(result.messages[0]).toEqual({ data: 'kept' });
  });

  it('accepts valid retry and warns on non-numeric retry', () => {
    const ok = decodeSseStream('retry: 10000\ndata: x\n\n');
    expect(ok.messages[0]?.retry).toBe(10000);
    expect(ok.warnings).toEqual([]);

    const bad = decodeSseStream('retry: 3000ms\ndata: y\n\n');
    expect(bad.messages[0]?.retry).toBeUndefined();
    expect(bad.messages[0]?.data).toBe('y');
    expect(bad.warnings).toHaveLength(1);
    expect(bad.warnings[0]?.message).toMatch(/十进制整数/);
    expect(bad.warnings[0]?.line).toBe(1);
  });

  it('strips a leading UTF-8 BOM and tolerates a final block without trailing blank line', () => {
    const result = decodeSseStream('\uFEFFdata: no trailing newline');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.data).toBe('no trailing newline');
  });

  it('tags entries with kind, ordinal and source line numbers', () => {
    const result = decodeSseStream(': hb\ndata: x\n\n');
    expect(result.entries[0]).toMatchObject({ kind: 'comment', index: 0, line: 1 });
    expect(result.entries[1]).toMatchObject({ kind: 'message', index: 0, line: 3 });
  });
});

describe('encodeSseMessage / encodeSseStream', () => {
  it('encodes all four fields in canonical order', () => {
    const text = encodeSseMessage({
      retry: 5000,
      event: 'update',
      id: '42',
      data: 'payload',
    });
    expect(text).toBe('retry: 5000\nevent: update\nid: 42\ndata: payload');
  });

  it('splits multi-line data into multiple data: lines', () => {
    const text = encodeSseMessage({ data: 'line1\nline2\nline3' });
    expect(text).toBe('data: line1\ndata: line2\ndata: line3');
  });

  it('normalizes CRLF and CR input into LF output', () => {
    const text = encodeSseMessage({ data: 'a\r\nb\rc' });
    expect(text).toBe('data: a\ndata: b\ndata: c');
  });

  it('round-trips encoded streams through the decoder', () => {
    const messages = [
      { event: 'open', data: 'ready' },
      { id: '9', data: 'multi\nline', retry: 2000 },
      { data: 'done' },
    ];
    const stream = encodeSseStream(messages);
    const decoded = decodeSseStream(stream);
    expect(decoded.warnings).toEqual([]);
    // 标准流以空行结尾，保证最后一条消息被派发
    expect(stream.endsWith('\n\n')).toBe(true);
    // 前两条消息各自字段完整；第三条按标准继承持久态 id/retry
    expect(decoded.messages[0]).toEqual(messages[0]);
    expect(decoded.messages[1]).toEqual(messages[1]);
    expect(decoded.messages[2]).toEqual({ data: 'done', id: '9', retry: 2000 });
    // 每条消息的 data/event 都可还原
    expect(decoded.messages.map((message) => message.data)).toEqual([
      'ready',
      'multi\nline',
      'done',
    ]);
  });

  it('rejects non-integer or negative retry and newline-bearing id/event', () => {
    expect(() => encodeSseMessage({ retry: 1.5, data: 'x' })).toThrow(/非负十进制整数/);
    expect(() => encodeSseMessage({ retry: -1, data: 'x' })).toThrow(/非负十进制整数/);
    expect(() => encodeSseMessage({ id: 'a\nb' })).toThrow(/id 不能包含换行/);
    expect(() => encodeSseMessage({ event: 'x\ny' })).toThrow(/event 事件名不能包含换行/);
    expect(() => encodeSseMessage({})).toThrow(/至少需要/);
    expect(() => encodeSseStream([])).toThrow(/至少需要一条消息/);
  });

  it('encodes comments/heartbeats', () => {
    expect(encodeComment(' ping')).toBe(': ping');
    expect(encodeComment('')).toBe(':');
    expect(() => encodeComment('a\nb')).toThrow(/注释不能包含换行/);
  });

  it('normalizes newlines standalone', () => {
    expect(normalizeNewlines('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
  });
});
