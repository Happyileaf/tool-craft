import { describe, it, expect } from 'vitest';
import {
  TargetLanguageEnum,
  encodeBase64,
  generateCode,
  parseCurl,
} from './curl';

describe('parseCurl', () => {
  it('解析含 -X / -H / -d 的 POST 命令', () => {
    const request = parseCurl(
      "curl -X POST 'https://api.example.com/items' -H 'Content-Type: application/json' -d '{\"name\":\"A\"}'",
    );
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.example.com/items');
    expect(request.headers['Content-Type']).toBe('application/json');
    expect(request.data).toBe('{"name":"A"}');
  });

  it('未显式指定方法时按是否有请求体推断', () => {
    expect(parseCurl("curl 'https://api.example.com/items' -d 'a=1'").method).toBe('POST');
    expect(parseCurl("curl 'https://api.example.com/items'").method).toBe('GET');
    expect(parseCurl("curl -I 'https://api.example.com/items'").method).toBe('HEAD');
  });

  it('正确处理单引号、双引号转义与反斜杠续行', () => {
    const command = `curl -X POST \\
      'https://api.example.com/items' \\
      -H "X-Note: say \\"hi\\"" \\
      -d '{"a":"b c"}'`;
    const request = parseCurl(command);
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.example.com/items');
    expect(request.headers['X-Note']).toBe('say "hi"');
    expect(request.data).toBe('{"a":"b c"}');
  });

  it("支持 $'...' 形式的 ANSI-C 字面量", () => {
    const request = parseCurl(`curl 'https://api.example.com/items' -H $'X-Tab: a\\tb'`);
    expect(request.headers['X-Tab']).toBe('a\tb');
  });

  it('-d 多次出现时用 & 连接为单个 data', () => {
    const request = parseCurl("curl 'https://api.example.com/items' -d 'a=1' -d 'b=2'");
    expect(request.method).toBe('POST');
    expect(request.data).toBe('a=1&b=2');
  });

  it('-u 生成 Basic 认证请求头', () => {
    const request = parseCurl("curl -u admin:secret 'https://api.example.com/items'");
    expect(request.headers.Authorization).toBe('Basic YWRtaW46c2VjcmV0');
  });

  it('--compressed 补充 Accept-Encoding 请求头', () => {
    const request = parseCurl("curl --compressed 'https://api.example.com/items'");
    expect(request.headers['Accept-Encoding']).toBe('gzip, deflate');
  });

  it('缺少 URL 时抛出可读错误', () => {
    expect(() => parseCurl('curl -X POST')).toThrowError(/URL/);
    expect(() => parseCurl('')).toThrowError(/URL/);
  });
});

describe('encodeBase64', () => {
  it('对 UTF-8 字符串做 Base64 编码', () => {
    expect(encodeBase64('admin:secret')).toBe('YWRtaW46c2VjcmV0');
    expect(encodeBase64('中')).toBe('5Lit');
  });
});

describe('generateCode', () => {
  const request = parseCurl(
    "curl -X POST 'https://api.example.com/items' -H 'Content-Type: application/json' -d '{\"name\":\"A\"}'",
  );

  it('生成 JavaScript fetch 代码', () => {
    const code = generateCode(request, TargetLanguageEnum.JAVASCRIPT_FETCH);
    expect(code).toContain('fetch(');
    expect(code).toContain('const response = await fetch(');
    expect(code).toContain('const data = await response.json();');
    expect(code).toContain('method: "POST"');
    expect(code).toContain('https://api.example.com/items');
  });

  it('生成 Python requests 代码', () => {
    const code = generateCode(request, TargetLanguageEnum.PYTHON_REQUESTS);
    expect(code).toContain('import requests');
    expect(code).toContain('requests.request(');
    expect(code).toContain("data='{\"name\":\"A\"}'");
  });

  it('生成 Node.js axios 代码', () => {
    const code = generateCode(request, TargetLanguageEnum.NODE_AXIOS);
    expect(code).toContain("const axios = require('axios');");
    expect(code).toContain('await axios(');
  });

  it('生成 Go 代码', () => {
    const code = generateCode(request, TargetLanguageEnum.GO);
    expect(code).toContain('http.NewRequest');
    expect(code).toContain('client.Do(req)');
  });

  it('GET 无请求体时不输出 body 字段', () => {
    const getRequest = parseCurl("curl 'https://api.example.com/items'");
    const code = generateCode(getRequest, TargetLanguageEnum.JAVASCRIPT_FETCH);
    expect(code).not.toContain('body:');
  });
});
