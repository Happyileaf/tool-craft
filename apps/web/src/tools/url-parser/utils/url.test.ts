import { describe, it, expect } from 'vitest';
import { buildUrl, parseQueryString, parseUrl, type UrlParts } from './url';

describe('parseQueryString', () => {
  it('支持重复键、无值键并同时给出原始与解码值', () => {
    const params = parseQueryString('name=%E5%BC%A0%E4%B8%89&tag=a&tag=b&flag');
    expect(params).toHaveLength(4);
    expect(params[0]).toEqual({
      key: 'name',
      value: '张三',
      rawKey: 'name',
      rawValue: '%E5%BC%A0%E4%B8%89',
      enabled: true,
    });
    expect(params[1]?.key).toBe('tag');
    expect(params[2]?.key).toBe('tag');
    expect(params[2]?.value).toBe('b');
    expect(params[3]?.key).toBe('flag');
    expect(params[3]?.value).toBe('');
  });

  it('把 + 视为空格', () => {
    expect(parseQueryString('q=a+b')[0]?.value).toBe('a b');
  });

  it('空查询返回空数组', () => {
    expect(parseQueryString('')).toEqual([]);
    expect(parseQueryString('?')).toEqual([]);
  });
});

describe('parseUrl', () => {
  it('拆解绝对 URL 的全部组件', () => {
    const parsed = parseUrl(
      'https://user:pass@example.com:8080/path/to?name=%E5%BC%A0%E4%B8%89&tag=a&tag=b#section',
    );
    expect(parsed.error).toBeNull();
    const parts = parsed.parts;
    expect(parts?.scheme).toBe('https');
    expect(parts?.username).toBe('user');
    expect(parts?.password).toBe('pass');
    expect(parts?.host).toBe('example.com');
    expect(parts?.port).toBe('8080');
    expect(parts?.pathname).toBe('/path/to');
    expect(parts?.query).toBe('name=%E5%BC%A0%E4%B8%89&tag=a&tag=b');
    expect(parts?.hash).toBe('section');
    expect(parts?.params).toHaveLength(3);
    expect(parts?.params[0]?.value).toBe('张三');
  });

  it('支持无协议、仅有路径的相对输入', () => {
    const parsed = parseUrl('/users?page=2#top');
    expect(parsed.error).toBeNull();
    expect(parsed.parts?.scheme).toBe('');
    expect(parsed.parts?.host).toBe('');
    expect(parsed.parts?.pathname).toBe('/users');
    expect(parsed.parts?.query).toBe('page=2');
    expect(parsed.parts?.hash).toBe('top');
    expect(parsed.parts?.params[0]?.key).toBe('page');
  });

  it('协议相对地址解析出主机', () => {
    const parsed = parseUrl('//example.com/path');
    expect(parsed.parts?.scheme).toBe('');
    expect(parsed.parts?.host).toBe('example.com');
    expect(parsed.parts?.pathname).toBe('/path');
  });

  it('非法输入返回明确错误而非抛异常', () => {
    expect(parseUrl('').error).toBe('请输入 URL');
    expect(parseUrl('https://example.com:abc/path').error).toContain('端口无效');
    expect(parseUrl('https://example.com:70000/').error).toContain('超出范围');
  });
});

describe('buildUrl', () => {
  const base: UrlParts = {
    scheme: 'https',
    username: 'user',
    password: 'pass',
    host: 'example.com',
    port: '8080',
    pathname: '/path/to',
    query: 'name=%E5%BC%A0%E4%B8%89&tag=a&tag=b',
    hash: 'section',
    params: parseQueryString('name=%E5%BC%A0%E4%B8%89&tag=a&tag=b'),
  };

  it('按 encodeURIComponent 规范重新拼接并保留哈希', () => {
    expect(buildUrl(base)).toBe(
      'https://user:pass@example.com:8080/path/to?name=%E5%BC%A0%E4%B8%89&tag=a&tag=b#section',
    );
  });

  it('解析后可原样往返', () => {
    const input =
      'https://user:pass@example.com:8080/path/to?name=%E5%BC%A0%E4%B8%89&tag=a&tag=b#section';
    const parsed = parseUrl(input);
    expect(buildUrl(parsed.parts as UrlParts)).toBe(input);
  });

  it('停用的参数不参与拼接，新增参数可被编码', () => {
    const parts: UrlParts = {
      ...base,
      params: [
        { key: 'a', value: '1', rawKey: 'a', rawValue: '1', enabled: true },
        { key: 'b', value: '2', rawKey: 'b', rawValue: '2', enabled: false },
        { key: '中文', value: '空格 值', rawKey: '中文', rawValue: '空格 值', enabled: true },
      ],
    };
    expect(buildUrl(parts)).toBe(
      'https://user:pass@example.com:8080/path/to?a=1&%E4%B8%AD%E6%96%87=%E7%A9%BA%E6%A0%BC%20%E5%80%BC#section',
    );
  });

  it('preserveRaw 使用原始编码形式', () => {
    const parts: UrlParts = {
      scheme: 'https',
      username: '',
      password: '',
      host: 'example.com',
      port: '',
      pathname: '/',
      query: 'q=a+b',
      hash: '',
      params: parseQueryString('q=a+b'),
    };
    expect(buildUrl(parts, { preserveRaw: true })).toBe('https://example.com/?q=a+b');
    expect(buildUrl(parts)).toBe('https://example.com/?q=a%20b');
  });

  it('无查询参数时不输出问号', () => {
    const parts: UrlParts = { ...base, query: '', params: [] };
    expect(buildUrl(parts)).toBe('https://user:pass@example.com:8080/path/to#section');
  });
});
