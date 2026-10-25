import { describe, it, expect } from 'vitest';
import {
  PKCE_VERIFIER_MAX_LENGTH,
  PKCE_VERIFIER_MIN_LENGTH,
  deriveChallenge,
  generateVerifier,
  validateVerifier,
} from './pkce';

describe('generateVerifier', () => {
  it('默认生成 43 位且仅含 unreserved 字符', () => {
    const verifier = generateVerifier();
    expect(verifier).toHaveLength(PKCE_VERIFIER_MIN_LENGTH);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it('支持 43-128 区间内任意长度', () => {
    expect(generateVerifier(43)).toHaveLength(43);
    expect(generateVerifier(64)).toHaveLength(64);
    expect(generateVerifier(128)).toHaveLength(PKCE_VERIFIER_MAX_LENGTH);
  });

  it('区间外长度或非整数抛错', () => {
    expect(() => generateVerifier(42)).toThrow(/长度必须是/);
    expect(() => generateVerifier(129)).toThrow(/长度必须是/);
    expect(() => generateVerifier(50.5)).toThrow(/长度必须是/);
  });

  it('多次生成结果不同（随机性冒烟检查）', () => {
    expect(generateVerifier()).not.toBe(generateVerifier());
  });
});

describe('validateVerifier', () => {
  it('合法 verifier 通过校验', () => {
    const verifier = generateVerifier();
    expect(validateVerifier(verifier).valid).toBe(true);
    expect(validateVerifier('a'.repeat(128)).valid).toBe(true);
  });

  it('长度不足或超长时报错', () => {
    expect(validateVerifier('a'.repeat(42)).valid).toBe(false);
    expect(validateVerifier('a'.repeat(42)).error).toContain('至少 43');
    expect(validateVerifier('a'.repeat(129)).error).toContain('至多 128');
  });

  it('包含非 unreserved 字符时报错', () => {
    const result = validateVerifier(`${'a'.repeat(42)}!`);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('unreserved');
  });
});

describe('deriveChallenge', () => {
  it('S256 命中 RFC 7636 附录 B 测试向量', async () => {
    const verifier =
      'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await deriveChallenge(verifier, 'S256');
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('S256 输出为无填充 base64url（不含 + / =）', async () => {
    const challenge = await deriveChallenge(generateVerifier());
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge).toHaveLength(43);
  });

  it('plain 方法直接返回 verifier', async () => {
    const verifier = generateVerifier();
    await expect(deriveChallenge(verifier, 'plain')).resolves.toBe(verifier);
  });

  it('verifier 非法时拒绝计算', async () => {
    await expect(deriveChallenge('short', 'S256')).rejects.toThrow(/至少 43/);
  });

  it('默认方法为 S256', async () => {
    const verifier =
      'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    await expect(deriveChallenge(verifier)).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });
});
