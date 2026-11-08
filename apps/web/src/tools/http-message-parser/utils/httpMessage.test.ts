import { describe, it, expect } from 'vitest';
import { parseHttpMessage, parseQuery, toSummaryJson, STATUS_MEANINGS } from './httpMessage';

const GET_REQUEST = [
  'GET /search?q=hello%20world&page=2&lang=zh HTTP/1.1',
  'Host: example.com',
  'User-Agent: curl/8.0',
  'Accept: application/json',
  'Cookie: sid=abc123; theme=dark',
  '',
  '',
].join('\r\n');

const JSON_RESPONSE = [
  'HTTP/1.1 200 OK',
  'Content-Type: application/json; charset=utf-8',
  'Content-Length: 25',
  'Set-Cookie: sid=xyz; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax',
  'Cache-Control: no-cache, no-store, max-age=0',
  '',
  '{"ok":true,"name":"trae"}',
].join('\r\n');

describe('请求报文解析', () => {
  const msg = parseHttpMessage(GET_REQUEST);

  it('识别为请求并拆分起始行', () => {
    expect(msg.kind).toBe('request');
    expect(msg.method).toBe('GET');
    expect(msg.version).toBe('HTTP/1.1');
    expect(msg.pathname).toBe('/search');
  });

  it('query string 拆为参数表（含 URL 解码与重复结构）', () => {
    expect(msg.queryParams).toEqual([
      { key: 'q', value: 'hello world' },
      { key: 'page', value: '2' },
      { key: 'lang', value: 'zh' },
    ]);
  });

  it('headers 逐行解析且 OWS 被 trim', () => {
    expect(msg.headerMap['host']).toEqual(['example.com']);
    expect(msg.headerMap['user-agent']).toEqual(['curl/8.0']);
    expect(msg.headers).toHaveLength(4);
  });

  it('Cookie 头展开为键值明细', () => {
    const cookie = msg.headers.find((h) => h.name.toLowerCase() === 'cookie');
    expect(cookie?.detail).toContain('sid = abc123');
    expect(cookie?.detail).toContain('theme = dark');
  });

  it('parseQuery 直接调用覆盖空值与无等号', () => {
    expect(parseQuery('a=1&b=&c')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '' },
      { key: 'c', value: '' },
    ]);
  });
});

describe('响应报文解析', () => {
  const msg = parseHttpMessage(JSON_RESPONSE);

  it('识别为响应并解析状态行', () => {
    expect(msg.kind).toBe('response');
    expect(msg.version).toBe('HTTP/1.1');
    expect(msg.statusCode).toBe(200);
    expect(msg.reasonPhrase).toBe('OK');
    expect(msg.statusMeaning).toBe(STATUS_MEANINGS[200]);
  });

  it('Content-Type 展开 charset', () => {
    const ct = msg.headers.find((h) => h.name.toLowerCase() === 'content-type');
    expect(ct?.detail).toContain('application/json');
    expect(ct?.detail).toContain('charset=utf-8');
  });

  it('Set-Cookie 多属性拆分', () => {
    const sc = msg.headers.find((h) => h.name.toLowerCase() === 'set-cookie');
    expect(sc?.detail).toContain('Expires');
    expect(sc?.detail).toContain('Path=/');
    expect(sc?.detail).toContain('HttpOnly');
    expect(sc?.detail).toContain('Secure');
    expect(sc?.detail).toContain('SameSite=Lax');
  });

  it('Cache-Control 指令展开', () => {
    const cc = msg.headers.find((h) => h.name.toLowerCase() === 'cache-control');
    expect(cc?.detail).toContain('no-cache');
    expect(cc?.detail).toContain('max-age=0');
  });

  it('body 与 Content-Length 一致时无长度告警', () => {
    expect(msg.body).toBe('{"ok":true,"name":"trae"}');
    expect(msg.issues.filter((i) => i.location === 'Content-Length')).toHaveLength(0);
  });
});

describe('Authorization 方案识别', () => {
  it('Basic Base64 解码为 user:password 并带敏感提示', () => {
    const cred = btoa('alice:secret');
    const msg = parseHttpMessage(`GET / HTTP/1.1\r\nAuthorization: Basic ${cred}\r\n\r\n`);
    const auth = msg.headers.find((h) => h.name.toLowerCase() === 'authorization');
    expect(auth?.detail).toContain('alice:secret');
    expect(auth?.detail).toContain('敏感');
  });

  it('Bearer 识别方案且脱敏', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\r\nAuthorization: Bearer abc.def.ghi\r\n\r\n');
    const auth = msg.headers.find((h) => h.name.toLowerCase() === 'authorization');
    expect(auth?.detail).toContain('Bearer');
    expect(auth?.detail).not.toContain('abc.def.ghi');
  });
});

describe('chunked 传输编码', () => {
  it('标识 body 为分块编码且跳过 Content-Length 校验', () => {
    const raw = [
      'HTTP/1.1 200 OK',
      'Transfer-Encoding: chunked',
      '',
      '4',
      'Wiki',
      '5',
      'pedia',
      '0',
      '',
    ].join('\r\n');
    const msg = parseHttpMessage(raw);
    expect(msg.isChunked).toBe(true);
    const te = msg.headers.find((h) => h.name.toLowerCase() === 'transfer-encoding');
    expect(te?.detail).toContain('分块');
  });
});

describe('畸形报文与异常检测', () => {
  it('header 缺冒号报带行号错误且不崩溃', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\nHost example.com\n\n');
    const issue = msg.issues.find((i) => i.level === 'error' && i.location.includes('2'));
    expect(issue).toBeDefined();
    expect(issue?.message).toContain('冒号');
  });

  it('请求路径含非法空格报错', () => {
    const msg = parseHttpMessage('GET /bad path HTTP/1.1\nHost: a\n\n');
    expect(msg.issues.some((i) => i.level === 'error' && i.message.includes('空格'))).toBe(true);
  });

  it('Content-Length 与 body 实际长度不符告警告', () => {
    const msg = parseHttpMessage('HTTP/1.1 200 OK\nContent-Length: 99\n\nshort');
    const issue = msg.issues.find((i) => i.location === 'Content-Length');
    expect(issue?.level).toBe('warning');
    expect(issue?.message).toContain('99');
  });

  it('裸 LF 分隔给出全局告警', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\nHost: a\n\n');
    expect(msg.bareLineFeed).toBe(true);
    expect(msg.issues.some((i) => i.message.includes('CRLF'))).toBe(true);
  });

  it('CRLF 标准报文不产生裸 LF 告警', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\r\nHost: a\r\n\r\n');
    expect(msg.bareLineFeed).toBe(false);
  });

  it('无法识别的起始行报错', () => {
    const msg = parseHttpMessage('GARBAGE LINE\nHost: a\n\n');
    expect(msg.issues.some((i) => i.level === 'error')).toBe(true);
  });

  it('空报文抛错', () => {
    expect(() => parseHttpMessage('   \n')).toThrow(/为空/);
  });
});

describe('折叠续行与重复头', () => {
  it('空白开头的续行并入上一 header', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\nX-Multi: part1\n part2\nHost: a\n\n');
    expect(msg.headerMap['x-multi']).toEqual(['part1 part2']);
  });

  it('重复头保留为数组', () => {
    const msg = parseHttpMessage('GET / HTTP/1.1\nX-Forwarded-For: 1.1.1.1\nX-Forwarded-For: 2.2.2.2\n\n');
    expect(msg.headerMap['x-forwarded-for']).toEqual(['1.1.1.1', '2.2.2.2']);
    const headers = msg.headers.filter((h) => h.name === 'X-Forwarded-For');
    expect(headers.map((h) => h.index)).toEqual([0, 1]);
  });
});

describe('摘要导出', () => {
  it('toSummaryJson 为合法 JSON 且含核心字段', () => {
    const msg = parseHttpMessage(GET_REQUEST);
    const parsed = JSON.parse(toSummaryJson(msg)) as { kind: string; method: string };
    expect(parsed.kind).toBe('request');
    expect(parsed.method).toBe('GET');
  });
});
