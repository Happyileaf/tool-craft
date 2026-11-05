import { describe, it, expect } from 'vitest';
import { keccak256Hex } from './keccak256';
import { toChecksumAddress, verifyChecksum, processBatch } from './eip55';

describe('keccak256', () => {
  it('matches the canonical Keccak-256 test vectors (original padding 0x01)', () => {
    expect(keccak256Hex('')).toBe(
      'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    );
    expect(keccak256Hex('abc')).toBe(
      '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    );
  });

  it('differs from NIST SHA3-256 on the same input', () => {
    // NIST SHA3-256('abc') = 3a985da74fe225b2...；Keccak-256 不应与之相等
    expect(keccak256Hex('abc')).not.toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    );
  });
});

describe('toChecksumAddress', () => {
  it('reproduces all four EIP-55 reference addresses', () => {
    const vectors = [
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
      '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    ];
    for (const expected of vectors) {
      expect(toChecksumAddress(expected.toLowerCase()).output).toBe(expected);
      expect(toChecksumAddress(expected.toUpperCase()).output).toBe(expected);
    }
  });

  it('accepts input without the 0x prefix and always emits one', () => {
    const result = toChecksumAddress('5aaeb6053f3e94c9b9a09f33669435e7ef1beaed');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  });

  it('is idempotent on an already checksummed address', () => {
    const checksummed = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
    expect(toChecksumAddress(checksummed).output).toBe(checksummed);
  });

  it('rejects malformed addresses with explicit reasons', () => {
    expect(toChecksumAddress('0x123').error).toMatch(/40/);
    expect(toChecksumAddress('0xZZaeb6053f3e94c9b9a09f33669435e7ef1beaed').error).toMatch(/十六进制/);
    expect(toChecksumAddress('   ').error).toMatch(/空地址/);
  });
});

describe('verifyChecksum', () => {
  it('accepts a correctly checksummed address', () => {
    const result = verifyChecksum('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    expect(result.valid).toBe(true);
    expect(result.checksumMatched).toBe(true);
  });

  it('flags a tampered letter case as checksum mismatch', () => {
    // 把首字母 a 改为 A，其余保持，必然破坏校验和
    const tampered = '0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
    const result = verifyChecksum(tampered);
    expect(result.valid).toBe(true);
    expect(result.checksumMatched).toBe(false);
    expect(result.error).toMatch(/不一致/);
  });

  it('treats all-lowercase input as carrying no checksum but still computes it', () => {
    const result = verifyChecksum('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed');
    expect(result.valid).toBe(true);
    expect(result.checksumMatched).toBe(false);
    expect(result.output).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  });
});

describe('processBatch', () => {
  it('processes multiple lines and skips blank lines', () => {
    const input =
      '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed\n\n0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359\n';
    const results = processBatch(input, 'encode');
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.valid)).toBe(true);
    expect(results[0]?.output).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  });
});
