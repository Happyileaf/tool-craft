import { describe, it, expect } from 'vitest';
import {
  parseCookieHeader,
  serializeCookieHeader,
  parseSetCookie,
  buildSetCookie,
  formatCookieDate,
  validateSetCookie,
} from './cookie';

describe('parseCookieHeader', () => {
  it('解析标准 Cookie 头', () => {
    const { pairs, notices } = parseCookieHeader('a=1; b=2; c=3');
    expect(pairs).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
      { name: 'c', value: '3' },
    ]);
    expect(notices).toHaveLength(0);
  });

  it('兼容前后空白、无空格分号与多余分号', () => {
    const { pairs } = parseCookieHeader('  a=1 ;b=2;; c = 3 ;');
    expect(pairs).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
      { name: 'c', value: '3' },
    ]);
  });

  it('值中包含 = 时仅按首个 = 切分', () => {
    const { pairs } = parseCookieHeader('token=abc=def==; x=1');
    expect(pairs[0]).toEqual({ name: 'token', value: 'abc=def==' });
    expect(pairs[1]).toEqual({ name: 'x', value: '1' });
  });

  it('保留空值', () => {
    const { pairs } = parseCookieHeader('empty=; a=1');
    expect(pairs[0]).toEqual({ name: 'empty', value: '' });
  });

  it('重复名称按出现顺序保留多行', () => {
    const { pairs } = parseCookieHeader('sid=1; sid=2; sid=3');
    expect(pairs).toHaveLength(3);
    expect(pairs.map((pair) => pair.value)).toEqual(['1', '2', '3']);
  });

  it('默认不做 URL 解码，原样保留百分号', () => {
    const { pairs } = parseCookieHeader('url=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1');
    expect(pairs[0]?.value).toBe('https%3A%2F%2Fexample.com%2Fa%3Fx%3D1');
  });

  it('开启 URL 解码时还原特殊字符', () => {
    const { pairs } = parseCookieHeader('url=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1', true);
    expect(pairs[0]?.value).toBe('https://example.com/a?x=1');
  });

  it('URL 解码失败时保留原文并给出 warning', () => {
    const { pairs, notices } = parseCookieHeader('bad=%E4%A8', true);
    expect(pairs[0]?.value).toBe('%E4%A8');
    expect(notices.some((notice) => notice.level === 'warning')).toBe(true);
  });

  it('缺少 = 或名称为空的段被忽略并告警', () => {
    const { pairs, notices } = parseCookieHeader('a=1; orphan; =2; b=3');
    expect(pairs).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '3' },
    ]);
    expect(notices).toHaveLength(2);
  });

  it('空字符串解析为空结果', () => {
    const { pairs, notices } = parseCookieHeader('');
    expect(pairs).toEqual([]);
    expect(notices).toEqual([]);
  });

  it('保留值中的空格（仅裁剪最外层）', () => {
    const { pairs } = parseCookieHeader('msg=hello world; a=1');
    expect(pairs[0]).toEqual({ name: 'msg', value: 'hello world' });
  });
});

describe('serializeCookieHeader', () => {
  it('序列化标准名值对', () => {
    expect(
      serializeCookieHeader([
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
      ]),
    ).toBe('a=1; b=2');
  });

  it('名称两侧空白被裁剪，空名称条目被跳过', () => {
    expect(
      serializeCookieHeader([
        { name: ' a ', value: '1' },
        { name: '', value: 'x' },
        { name: 'b', value: '2' },
      ]),
    ).toBe('a=1; b=2');
  });

  it('值原样输出，不主动编码', () => {
    expect(serializeCookieHeader([{ name: 'url', value: 'https://example.com/a?x=1' }])).toBe(
      'url=https://example.com/a?x=1',
    );
  });

  it('开启 URL 编码时转义特殊字符', () => {
    expect(
      serializeCookieHeader([{ name: 'url', value: 'https://example.com/a?x=1' }], true),
    ).toBe('url=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1');
  });

  it('解析后重新序列化往返一致（默认不解码场景）', () => {
    const original = 'sid=abc%3D1; theme=dark; lang=zh-CN';
    const { pairs } = parseCookieHeader(original);
    expect(serializeCookieHeader(pairs)).toBe(original);
  });
});

describe('parseSetCookie', () => {
  it('解析含全部常见属性的 Set-Cookie（大小写属性名混合）', () => {
    const fields = parseSetCookie(
      'session=abc123; EXPIRES=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=3600; Domain=example.com; Path=/; SECURE; HttpOnly; SameSite=Lax',
    );
    expect(fields.name).toBe('session');
    expect(fields.value).toBe('abc123');
    expect(fields.expires).toBe('Wed, 21 Oct 2026 07:28:00 GMT');
    expect(fields.maxAge).toBe(3600);
    expect(fields.domain).toBe('example.com');
    expect(fields.path).toBe('/');
    expect(fields.secure).toBe(true);
    expect(fields.httpOnly).toBe(true);
    expect(fields.sameSite).toBe('Lax');
  });

  it('兼容 Set-Cookie: 前缀', () => {
    const fields = parseSetCookie('Set-Cookie: a=1; Path=/');
    expect(fields.name).toBe('a');
    expect(fields.value).toBe('1');
    expect(fields.path).toBe('/');
  });

  it('SameSite 大小写不敏感（none → None）', () => {
    const fields = parseSetCookie('a=1; samesite=NONE; Secure');
    expect(fields.sameSite).toBe('None');
    expect(fields.secure).toBe(true);
  });

  it('空值 Cookie 与仅 name=value', () => {
    const fields = parseSetCookie('token=');
    expect(fields.name).toBe('token');
    expect(fields.value).toBe('');
    expect(fields.secure).toBeUndefined();
  });

  it('未知属性原样保留到 extensions', () => {
    const fields = parseSetCookie('a=1; Path=/; Priority=High; SameSite=None; Secure');
    expect(fields.extensions).toContain('Priority=High');
  });

  it('非法首段抛错', () => {
    expect(() => parseSetCookie('no-equals-here')).toThrow(/name=value/);
    expect(() => parseSetCookie('')).toThrow(/为空/);
  });
});

describe('buildSetCookie', () => {
  it('按 RFC 习惯顺序拼出 Set-Cookie', () => {
    const output = buildSetCookie({
      name: 'session',
      value: 'abc',
      expires: 'Wed, 21 Oct 2026 07:28:00 GMT',
      maxAge: 3600,
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });
    expect(output).toBe(
      'session=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=3600; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Lax',
    );
  });

  it('只有名称和值时输出最简形式', () => {
    expect(buildSetCookie({ name: 'a', value: '1' })).toBe('a=1');
  });

  it('Max-Age 截断为整数', () => {
    expect(buildSetCookie({ name: 'a', value: '1', maxAge: 99.9 })).toBe('a=1; Max-Age=99');
  });

  it('扩展属性附在末尾', () => {
    expect(
      buildSetCookie({ name: 'a', value: '1', path: '/', extensions: ['Priority=High'] }),
    ).toBe('a=1; Path=/; Priority=High');
  });

  it('空名称或名称含非法字符时报错', () => {
    expect(() => buildSetCookie({ name: '  ', value: '1' })).toThrow(/不能为空/);
    expect(() => buildSetCookie({ name: 'bad name', value: '1' })).toThrow(/不能包含/);
    expect(() => buildSetCookie({ name: 'a;b', value: '1' })).toThrow(/不能包含/);
  });

  it('parseSetCookie 后 buildSetCookie 往返保留关键属性', () => {
    const original = 'session=abc; Path=/; Secure; HttpOnly; SameSite=Strict';
    const rebuilt = buildSetCookie(parseSetCookie(original));
    expect(rebuilt).toBe(original);
  });
});

describe('formatCookieDate 与 validateSetCookie', () => {
  it('formatCookieDate 输出 GMT 字符串', () => {
    const text = formatCookieDate(new Date('2026-10-21T07:28:00.000Z'));
    expect(text).toMatch(/GMT$/);
    expect(text).toContain('21 Oct 2026');
  });

  it('SameSite=None 缺 Secure 给出 warning', () => {
    const notices = validateSetCookie({ name: 'a', value: '1', sameSite: 'None' });
    expect(notices).toHaveLength(1);
    expect(notices[0]?.level).toBe('warning');
    expect(notices[0]?.message).toMatch(/Secure/);
  });

  it('SameSite=None 且 Secure 时给 info 提示', () => {
    const notices = validateSetCookie({
      name: 'a',
      value: '1',
      sameSite: 'None',
      secure: true,
    });
    expect(notices.some((notice) => notice.message.includes('符合'))).toBe(true);
  });

  it('同时设置 Expires 与 Max-Age 时提示优先级', () => {
    const notices = validateSetCookie({
      name: 'a',
      value: '1',
      expires: 'Wed, 21 Oct 2026 07:28:00 GMT',
      maxAge: 100,
    });
    expect(notices.some((notice) => notice.message.includes('Max-Age 优先'))).toBe(true);
  });

  it('普通 Lax Cookie 无任何提示', () => {
    expect(validateSetCookie({ name: 'a', value: '1', sameSite: 'Lax' })).toEqual([]);
  });
});
