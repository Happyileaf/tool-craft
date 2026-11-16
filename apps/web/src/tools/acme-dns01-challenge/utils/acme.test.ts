import { describe, expect, it } from 'vitest';
import { Base64UrlError, base64UrlDecode, base64UrlEncode, isBase64Url } from './base64url';
import {
  AcmeError,
  buildKeyAuthorization,
  buildRecordName,
  canonicalJwk,
  computeDns01TxtValue,
  computeThumbprint,
  generateP256KeyPair,
  normalizeDomain,
  parseKeyAuthorization,
  webCryptoSha256,
} from './acme';

/** RFC 7638 附录 A.3 公开 RSA 样例 JWK（含应被剥离的 alg / kid） */
const RFC_RSA_JWK = {
  kty: 'RSA',
  n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
  e: 'AQAB',
  alg: 'RS256',
  kid: '2011-04-29',
};

const RFC_RSA_CANONICAL =
  '{"e":"AQAB","kty":"RSA","n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"}';

const SAMPLE_TOKEN = 'KQqLsiS5j0CONR_eUXTUSUDNVaHODtc-0p646g';
const SAMPLE_THUMBPRINT = 'evaGxfADs6pSRb2LAv9IZf17Dt4Ke5Pl2T-t6bPEJqA';
const SAMPLE_KEY_AUTHORIZATION = `${SAMPLE_TOKEN}.${SAMPLE_THUMBPRINT}`;
const SAMPLE_TXT_VALUE = 'yGqbM4qjEXrWjJ8BzS0ALsMTM362sD_xl7XuPWRaROY';

describe('base64url 编解码', () => {
  it('编码无填充且映射 +/ 为 -_', () => {
    expect(base64UrlEncode(new TextEncoder().encode('f'))).toBe('Zg');
    expect(base64UrlEncode(new Uint8Array([0xfb, 0xff, 0xff]))).toBe('-___');
    expect(base64UrlEncode(new Uint8Array(0))).toBe('');
  });

  it('解码兼容 Base64URL 与标准 Base64（含 +//= 边界）', () => {
    expect(Array.from(base64UrlDecode('-___'))).toEqual([0xfb, 0xff, 0xff]);
    expect(Array.from(base64UrlDecode('+///'))).toEqual([0xfb, 0xff, 0xff]);
    expect(base64UrlEncode(base64UrlDecode(SAMPLE_THUMBPRINT))).toBe(SAMPLE_THUMBPRINT);
  });

  it('对空串与含空白/非法字符的输入抛出中文异常', () => {
    expect(() => base64UrlDecode('   ')).toThrow(Base64UrlError);
    expect(() => base64UrlDecode('ab cd')).toThrow(/字母表/);
    expect(() => base64UrlDecode('ab$cd')).toThrow(/字母表/);
  });

  it('isBase64Url 识别填充字符为非法', () => {
    expect(isBase64Url('abc-_')).toBe(true);
    expect(isBase64Url('abc=')).toBe(false);
    expect(isBase64Url('a+b')).toBe(false);
    expect(isBase64Url('')).toBe(false);
  });
});

describe('canonicalJwk（RFC 7638 规范化）', () => {
  it('剥离 alg/kid 并按词典序输出紧凑 JSON', () => {
    expect(canonicalJwk(RFC_RSA_JWK)).toBe(RFC_RSA_CANONICAL);
  });

  it('EC JWK 仅保留 crv/kty/x/y', () => {
    expect(
      canonicalJwk({
        kty: 'EC',
        crv: 'P-256',
        x: 'x-value',
        y: 'y-value',
        ext: true,
        key_ops: ['verify'],
      }),
    ).toBe('{"crv":"P-256","kty":"EC","x":"x-value","y":"y-value"}');
  });

  it('非对象、未知 kty、缺失必需成员分别抛错', () => {
    expect(() => canonicalJwk('nope' as unknown as Parameters<typeof canonicalJwk>[0])).toThrow(
      AcmeError,
    );
    expect(() => canonicalJwk({ kty: 'DH' })).toThrow(/不支持的密钥类型/);
    expect(() => canonicalJwk({ kty: 'RSA', e: 'AQAB' })).toThrow(/必需成员/);
  });
});

describe('computeThumbprint（RFC 7638 附录 A.3 标准向量）', () => {
  it('RSA JWK thumbprint 等于 NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs', async () => {
    const thumbprint = await computeThumbprint(canonicalJwk(RFC_RSA_JWK), webCryptoSha256);
    expect(thumbprint).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
  });

  it('支持注入自定义 sha256Fn（确定性校验）', async () => {
    const captured: string[] = [];
    const fakeSha256 = async (data: Uint8Array) => {
      captured.push(new TextDecoder().decode(data));
      return new Uint8Array(32).fill(0x01);
    };
    const thumbprint = await computeThumbprint(RFC_RSA_CANONICAL, fakeSha256);
    expect(captured[0]).toBe(RFC_RSA_CANONICAL);
    expect(thumbprint).toBe(base64UrlEncode(new Uint8Array(32).fill(0x01)));
  });
});

describe('buildKeyAuthorization', () => {
  it('按 token.thumbprint 拼接且与验收向量一致', () => {
    expect(buildKeyAuthorization(SAMPLE_TOKEN, SAMPLE_THUMBPRINT)).toBe(SAMPLE_KEY_AUTHORIZATION);
  });

  it('自动去除首尾空白', () => {
    expect(buildKeyAuthorization(` ${SAMPLE_TOKEN} `, SAMPLE_THUMBPRINT)).toBe(
      SAMPLE_KEY_AUTHORIZATION,
    );
  });

  it('空字段、含 + / = 的非法字段分别抛出带字段名的中文错误', () => {
    expect(() => buildKeyAuthorization('', SAMPLE_THUMBPRINT)).toThrow(/token/);
    expect(() => buildKeyAuthorization(SAMPLE_TOKEN, ' ')).toThrow(/thumbprint/);
    expect(() => buildKeyAuthorization('a+b', SAMPLE_THUMBPRINT)).toThrow(/challenge token/);
    expect(() => buildKeyAuthorization(SAMPLE_TOKEN, 'ab/cd')).toThrow(/thumbprint/);
    expect(() => buildKeyAuthorization(`${SAMPLE_TOKEN}=`, SAMPLE_THUMBPRINT)).toThrow(/=/);
  });
});

describe('computeDns01TxtValue', () => {
  it('与验收固定向量一致且为 43 字符 Base64URL', async () => {
    const value = await computeDns01TxtValue(SAMPLE_KEY_AUTHORIZATION);
    expect(value).toBe(SAMPLE_TXT_VALUE);
    expect(value).toHaveLength(43);
    expect(/^[A-Za-z0-9_-]+$/.test(value)).toBe(true);
    expect(value).not.toMatch(/[+/=]/);
  });

  it('两次计算结果确定一致', async () => {
    const a = await computeDns01TxtValue(SAMPLE_KEY_AUTHORIZATION);
    const b = await computeDns01TxtValue(SAMPLE_KEY_AUTHORIZATION);
    expect(a).toBe(b);
  });

  it('空输入抛中文错误', async () => {
    await expect(computeDns01TxtValue('')).rejects.toThrow(/key authorization/);
  });
});

describe('parseKeyAuthorization（校验模式）', () => {
  it('合法串可拆回 token 与 thumbprint', () => {
    expect(parseKeyAuthorization(SAMPLE_KEY_AUTHORIZATION)).toEqual({
      token: SAMPLE_TOKEN,
      thumbprint: SAMPLE_THUMBPRINT,
    });
  });

  it('无点分隔、多段、含非法字符分别报错', () => {
    expect(() => parseKeyAuthorization('onlyonesegment')).toThrow(/点分隔符/);
    expect(() => parseKeyAuthorization('a.b.c')).toThrow(/点分隔符/);
    expect(() => parseKeyAuthorization('a+b.ccc')).toThrow(/token 段/);
    expect(() => parseKeyAuthorization('aaa.b/c')).toThrow(/thumbprint 段/);
    expect(() => parseKeyAuthorization('   ')).toThrow(/不能为空/);
  });

  it('校验模式重算 TXT 值与生成模式一致', async () => {
    const parsed = parseKeyAuthorization(SAMPLE_KEY_AUTHORIZATION);
    const rebuilt = buildKeyAuthorization(parsed.token, parsed.thumbprint);
    await expect(computeDns01TxtValue(rebuilt)).resolves.toBe(SAMPLE_TXT_VALUE);
  });
});

describe('normalizeDomain 与 buildRecordName', () => {
  it('裸域与多级子域拼出 _acme-challenge 记录名', () => {
    expect(buildRecordName(normalizeDomain('example.com'))).toBe('_acme-challenge.example.com');
    expect(buildRecordName(normalizeDomain('www.example.com.'))).toBe(
      '_acme-challenge.www.example.com',
    );
  });

  it('通配符域名剥离 *. 并标记 wildcard', () => {
    const normalized = normalizeDomain('*.example.com');
    expect(normalized.wildcard).toBe(true);
    expect(buildRecordName(normalized)).toBe('_acme-challenge.example.com');
  });

  it('标记 IDN 域名', () => {
    const normalized = normalizeDomain('例え.example');
    expect(normalized.idn).toBe(true);
    expect(buildRecordName(normalized)).toBe('_acme-challenge.例え.example');
  });

  it('空串、协议前缀、路径、端口、下划线分别抛中文异常', () => {
    expect(() => normalizeDomain('')).toThrow(/不能为空/);
    expect(() => normalizeDomain('http://example.com')).toThrow(/协议前缀/);
    expect(() => normalizeDomain('https://example.com')).toThrow(/协议前缀/);
    expect(() => normalizeDomain('example.com/path')).toThrow(/路径/);
    expect(() => normalizeDomain('example.com:8443')).toThrow(/端口/);
    expect(() => normalizeDomain('bad_domain.example.com')).toThrow(/下划线/);
    expect(() => normalizeDomain('foo.*.com')).toThrow(/通配符/);
  });
});

describe('generateP256KeyPair（Web Crypto 端到端）', () => {
  it('生成 P-256 密钥对，公钥 JWK 仅四成员且 thumbprint 为 43 字符 Base64URL', async () => {
    const generated = await generateP256KeyPair();
    expect(generated.publicJwk.kty).toBe('EC');
    expect(generated.publicJwk.crv).toBe('P-256');
    expect(typeof generated.publicJwk.x).toBe('string');
    expect(typeof generated.publicJwk.y).toBe('string');
    expect(generated.privateJwk.d).toBeTruthy();
    expect(generated.canonical).toBe(
      canonicalJwk(generated.publicJwk as unknown as Parameters<typeof canonicalJwk>[0]),
    );
    expect(generated.thumbprint).toHaveLength(43);
    expect(/^[A-Za-z0-9_-]+$/.test(generated.thumbprint)).toBe(true);
  });

  it('同一公钥每次算出的 thumbprint 稳定一致', async () => {
    const first = await generateP256KeyPair();
    const again = await computeThumbprint(
      canonicalJwk(first.publicJwk as unknown as Parameters<typeof canonicalJwk>[0]),
    );
    expect(again).toBe(first.thumbprint);
  });
});
