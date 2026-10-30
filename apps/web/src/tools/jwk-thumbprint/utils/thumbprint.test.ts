import { describe, expect, it } from 'vitest';
import {
  bufferToBase64Url,
  canonicalizeJwk,
  computeThumbprint,
  REQUIRED_MEMBERS,
} from './thumbprint';

/** RFC 7638 §3.1 公开 RSA 样例 JWK */
const RFC_RSA_JWK = {
  kty: 'RSA',
  n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
  e: 'AQAB',
  alg: 'RS256',
  kid: '2011-04-29',
};

const RFC_CANONICAL =
  '{"e":"AQAB","kty":"RSA","n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw"}';

describe('REQUIRED_MEMBERS whitelist', () => {
  it('defines whitelists in lexicographic order for all four kty', () => {
    expect(REQUIRED_MEMBERS.RSA).toEqual(['e', 'kty', 'n']);
    expect(REQUIRED_MEMBERS.EC).toEqual(['crv', 'kty', 'x', 'y']);
    expect(REQUIRED_MEMBERS.OKP).toEqual(['crv', 'kty', 'x']);
    expect(REQUIRED_MEMBERS.oct).toEqual(['k', 'kty']);
  });
});

describe('canonicalizeJwk', () => {
  it('strips extra members and sorts names lexicographically (RFC 7638 §3.1)', () => {
    const result = canonicalizeJwk(RFC_RSA_JWK);
    expect(result).toEqual({ json: RFC_CANONICAL });
  });

  it('produces identical output regardless of extra members or input order', () => {
    const shuffled = {
      kid: 'x',
      n: RFC_RSA_JWK.n,
      use: 'sig',
      alg: 'RS256',
      e: 'AQAB',
      kty: 'RSA',
      x5c: ['dummy'],
    };
    expect(canonicalizeJwk(shuffled)).toEqual(canonicalizeJwk({
      kty: 'RSA',
      e: 'AQAB',
      n: RFC_RSA_JWK.n,
    }));
  });

  it.each([
    ['not an object', '"hello"'],
    ['an array', '[]'],
    ['missing kty', '{ "e": "AQAB" }'],
    ['unknown kty', '{ "kty": "DH" }'],
    ['missing required member', '{ "kty": "RSA", "e": "AQAB" }'],
    ['non-string member', '{ "kty": "RSA", "e": 1, "n": "x" }'],
  ])('rejects %s', (_label, json) => {
    const result = canonicalizeJwk(JSON.parse(json));
    expect(result).toHaveProperty('error');
  });
});

describe('bufferToBase64Url', () => {
  it('encodes without padding using URL-safe alphabet', () => {
    const data = new TextEncoder().encode('???>>>');
    expect(bufferToBase64Url(data.buffer)).toBe('Pz8_Pj4-');
  });
});

describe('computeThumbprint', () => {
  it('matches the RFC 7638 §3.1 SHA-256 vector', async () => {
    const result = await computeThumbprint(JSON.stringify(RFC_RSA_JWK));
    expect(result.error).toBeNull();
    expect(result.canonicalJson).toBe(RFC_CANONICAL);
    expect(result.thumbprint).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
  });

  it('accepts a parsed object and ignores alg/use/kid identically', async () => {
    const fromObject = await computeThumbprint({ ...RFC_RSA_JWK });
    const stripped = await computeThumbprint({ kty: 'RSA', n: RFC_RSA_JWK.n, e: 'AQAB' });
    expect(fromObject.thumbprint).toBe(stripped.thumbprint);
    expect(fromObject.thumbprint).toBe('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
  });

  it('computes EC P-256 thumbprint consistent across hash choices', async () => {
    const ecJwk = {
      kty: 'EC',
      crv: 'P-256',
      x: 'f83OJ3D2Zn-0tQWvFGZxLmtyM1K4k9qNuvlL3HLVCbM',
      y: 'wxtVan4zE4qX-JMwPfUzrHt6HKrYN38M3aBkzV7fWzo',
    };
    const sha256 = await computeThumbprint(ecJwk, 'SHA-256');
    expect(sha256.canonicalJson).toBe(
      '{"crv":"P-256","kty":"EC","x":"f83OJ3D2Zn-0tQWvFGZxLmtyM1K4k9qNuvlL3HLVCbM","y":"wxtVan4zE4qX-JMwPfUzrHt6HKrYN38M3aBkzV7fWzo"}',
    );
    expect(sha256.thumbprint).toBe('0DnWkCVyPcCMuMIV-CxcfxnuoMQCketJiGLqhRQj5Yw');

    const sha384 = await computeThumbprint(ecJwk, 'SHA-384');
    expect(sha384.thumbprint).toHaveLength(64);
    expect(sha384.thumbprint).toBe(
      '0NlsDTnqTT-YHfCU5CSSPEDvxvIFrm8ayOSDDa1cmsO81AilvFVx3tsW1xEHcqIg',
    );

    const sha512 = await computeThumbprint(ecJwk, 'SHA-512');
    expect(sha512.thumbprint).toHaveLength(86);
    expect(sha512.thumbprint).toBe(
      '0Hy3SDRGaDZ2-qr_f6TBC3zWBC48tIdUfmCOGb_yJYpbhuFLMrSkuFVgJgSDnd0JQO2cIN6xIxK3zAQyY0Wkjw',
    );
  });

  it('supports OKP and oct key types', async () => {
    const okp = await computeThumbprint({
      kty: 'OKP',
      crv: 'Ed25519',
      x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
    });
    expect(okp.error).toBeNull();
    expect(okp.canonicalJson).toBe(
      '{"crv":"Ed25519","kty":"OKP","x":"11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"}',
    );

    const oct = await computeThumbprint({ kty: 'oct', k: 'GawgguFyGrWKd7ul5g', alg: 'A256GCM' });
    expect(oct.error).toBeNull();
    expect(oct.canonicalJson).toBe('{"k":"GawgguFyGrWKd7ul5g","kty":"oct"}');
  });

  it('returns a clear error for invalid JSON text', async () => {
    const result = await computeThumbprint('{ not json');
    expect(result.thumbprint).toBeNull();
    expect(result.error).toContain('JSON 解析失败');
  });

  it('returns clear errors for invalid JWK content', async () => {
    expect((await computeThumbprint('{"kty":"DH"}')).error).toContain('不支持的密钥类型');
    expect((await computeThumbprint('{"kty":"RSA","e":"AQAB"}')).error).toContain('必需成员');
  });
});
