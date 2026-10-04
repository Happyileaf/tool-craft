import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './bcrypt';

describe('bcrypt hash', () => {
  it('should hash and verify correctly', async () => {
    const password = 'test-password';
    const hash = await hashPassword(password, 4);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
    const wrongResult = await verifyPassword('wrong-password', hash);
    expect(wrongResult).toBe(false);
  });
});
