import { describe, it, expect } from 'vitest';
import {
  formatUuid,
  nameBasedUuid,
  nameBasedUuidV3Sync,
  NAMESPACES,
  parseUuid,
} from './uuid-name';
import { md5Bytes } from './md5';

describe('md5Bytes', () => {
  it('matches RFC 1321 test vectors', () => {
    const hex = (b: Uint8Array) =>
      Array.from(b)
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
    expect(hex(md5Bytes(new TextEncoder().encode('')))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(hex(md5Bytes(new TextEncoder().encode('abc')))).toBe(
      '900150983cd24fb0d6963f7d28e17f72',
    );
  });
});

describe('parseUuid / formatUuid', () => {
  it('round-trips a namespace UUID in big-endian byte order', () => {
    const bytes = parseUuid(NAMESPACES.DNS);
    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBe(16);
    expect(bytes![0]).toBe(0x6b);
    expect(bytes![15]).toBe(0xc8);
    expect(formatUuid(bytes!)).toBe(NAMESPACES.DNS);
  });

  it('rejects malformed UUIDs', () => {
    expect(parseUuid('not-a-uuid')).toBeNull();
    expect(parseUuid('6ba7b810-9dad-11d1-80b4')).toBeNull();
  });
});

describe('nameBasedUuid v5', () => {
  it('matches the RFC A.4 vector: DNS + python.org', async () => {
    // RFC 9562 / 4122 附录标准向量
    const result = await nameBasedUuid(5, NAMESPACES.DNS, 'python.org');
    expect(result.error).toBeNull();
    expect(result.uuid).toBe('886313e1-3b8a-5372-9b90-0c9aee199e5d');
  });

  it('is deterministic and stamps version 5 / variant 10xx', async () => {
    const first = await nameBasedUuid(5, NAMESPACES.URL, 'https://example.com/a');
    const second = await nameBasedUuid(5, NAMESPACES.URL, 'https://example.com/a');
    expect(first.uuid).toBe(second.uuid);
    expect(first.uuid![14]).toBe('5');
    expect('89abAB'.includes(first.uuid![19]!)).toBe(true);
  });

  it('produces different UUIDs across namespaces and names', async () => {
    const a = await nameBasedUuid(5, NAMESPACES.DNS, 'example.com');
    const b = await nameBasedUuid(5, NAMESPACES.URL, 'example.com');
    const c = await nameBasedUuid(5, NAMESPACES.DNS, 'other.example');
    expect(a.uuid).not.toBe(b.uuid);
    expect(a.uuid).not.toBe(c.uuid);
  });

  it('handles UTF-8 names', async () => {
    const result = await nameBasedUuid(5, NAMESPACES.DNS, '例え.テスト');
    expect(result.error).toBeNull();
    expect(result.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('rejects an invalid namespace', async () => {
    const result = await nameBasedUuid(5, 'nonsense', 'name');
    expect(result.error).toContain('命名空间');
    expect(result.uuid).toBeNull();
  });
});

describe('nameBasedUuid v3', () => {
  it('matches the RFC A.3 vector: DNS + python.org', () => {
    const result = nameBasedUuidV3Sync(NAMESPACES.DNS, 'python.org');
    expect(result.uuid).toBe('6fa459ea-ee8a-3ca4-894e-db77e160355e');
    expect(result.uuid![14]).toBe('3');
  });

  it('async v3 path returns the same result', async () => {
    const asyncResult = await nameBasedUuid(3, NAMESPACES.OID, '1.3.6.1');
    expect(asyncResult.uuid).toBe(nameBasedUuidV3Sync(NAMESPACES.OID, '1.3.6.1').uuid);
  });
});
