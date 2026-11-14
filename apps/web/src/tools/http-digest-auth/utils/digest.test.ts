import { describe, expect, it } from 'vitest';
import { computeDigest } from './digest';
import type { DigestInput } from './digest';

const rfc2617: DigestInput = {
  username: 'Mufasa',
  password: 'Circle Of Life',
  realm: 'testrealm@host.com',
  nonce: 'dcd98b7102dd2f0e8b11d0f600bfb0c093',
  uri: '/dir/index.html',
  method: 'GET',
  algorithm: 'MD5',
  qop: 'auth',
  nc: '00000001',
  cnonce: '0a4f113b',
};

const rfc7616Sha256: DigestInput = {
  username: 'Mufasa',
  password: 'Circle of Life',
  realm: 'http-auth@example.org',
  nonce: '7ypf/xlj9XXwfDPEoM4URrv/xwf94BcCAzFZH4GiTo0v',
  uri: '/dir/index.html',
  method: 'GET',
  algorithm: 'SHA-256',
  qop: 'auth',
  nc: '00000001',
  cnonce: 'f2/wE4q74E6zIJEtWaHKaf5wv/H5QzzpXusqGemxURZJ',
};

describe('computeDigest', () => {
  it('matches the RFC 2617 MD5 example vector', async () => {
    const result = await computeDigest(rfc2617);
    expect(result.ha1).toBe('939e7578ed9e3c518a452acee763bce9');
    expect(result.ha2).toBe('39aff3a2bab6126f332b942af96d3366');
    expect(result.response).toBe('6629fae49393a05397450978507c4ef1');
    expect(result.authorization).toContain('username="Mufasa"');
    expect(result.authorization).toContain('qop=auth');
    expect(result.authorization).toContain('nc=00000001');
  });

  it('matches the RFC 7616 SHA-256 example vector', async () => {
    const result = await computeDigest(rfc7616Sha256);
    expect(result.response).toBe(
      '753927fa0e85d155564e2e272a28d1802ca10daf4496794697cf8db5856cb6c1',
    );
    expect(result.authorization).toContain('algorithm=SHA-256');
  });

  it('supports MD5-sess with the HA1 session mix', async () => {
    const result = await computeDigest({ ...rfc2617, algorithm: 'MD5-sess' });
    expect(result.ha1).toMatch(/^[0-9a-f]{32}$/);
    expect(result.response).toMatch(/^[0-9a-f]{32}$/);
    expect(result.ha1).not.toBe('939e7578ed9e3c518a452acee763bce9');
  });

  it('supports RFC 2069 style without qop', async () => {
    const result = await computeDigest({ ...rfc2617, qop: 'none' });
    expect(result.response).toMatch(/^[0-9a-f]{32}$/);
    expect(result.authorization).not.toContain('qop=');
    expect(result.authorization).not.toContain('nc=');
  });

  it('uses entity body hash for auth-int', async () => {
    const withEmpty = await computeDigest({ ...rfc2617, qop: 'auth-int' });
    const withBody = await computeDigest({ ...rfc2617, qop: 'auth-int', entityBody: 'hello' });
    expect(withEmpty.response).not.toBe(withBody.response);
    expect(withBody.ha2).not.toBe(withEmpty.ha2);
  });

  it('hashes the username when userhash is enabled', async () => {
    const result = await computeDigest({ ...rfc2617, userhash: true });
    expect(result.userName).toMatch(/^[0-9a-f]{32}$/);
    expect(result.authorization).toContain('userhash=true');
    expect(result.authorization).toContain(`username="${result.userName}"`);
  });

  it('pads short nonce counts to eight digits', async () => {
    const result = await computeDigest({ ...rfc2617, nc: '1' });
    expect(result.authorization).toContain('nc=00000001');
    expect(result.response).toBe('6629fae49393a05397450978507c4ef1');
  });

  it('rejects invalid nonce counts and missing secrets', async () => {
    await expect(computeDigest({ ...rfc2617, nc: 'zzzz' })).rejects.toThrow(
      'nonce-count 必须是 1–8 位十六进制数字',
    );
    await expect(computeDigest({ ...rfc2617, realm: '' })).rejects.toThrow('realm 不能为空');
    await expect(computeDigest({ ...rfc2617, nonce: '' })).rejects.toThrow('nonce 不能为空');
    await expect(computeDigest({ ...rfc2617, uri: '' })).rejects.toThrow('请求 URI 不能为空');
    await expect(computeDigest({ ...rfc2617, cnonce: '' })).rejects.toThrow(
      '使用 qop 时必须提供 cnonce',
    );
  });

  it('quotes opaque values in the authorization header', async () => {
    const result = await computeDigest({ ...rfc2617, opaque: 'abc"def' });
    expect(result.authorization).toContain('opaque="abc\\"def"');
  });
});
