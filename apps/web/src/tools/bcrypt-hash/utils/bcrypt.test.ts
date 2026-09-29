
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './bcrypt';

describe('bcrypt', () => {
  it('should hash password and verify correctly', async () => {
    const password = 'MySecretPassword123!';
    const hash = await hashPassword({
      password,
      costFactor: 10,
    });
    
    // bcryptjs uses $2b$ by default but accepts $2a$
    expect(hash.startsWith('$2b$10$') || hash.startsWith('$2a$10$')).toBe(true);
    
    const isValid = await verifyPassword({
      password,
      hash,
    });
    expect(isValid).toBe(true);
    
    const isWrong = await verifyPassword({
      password: 'WrongPassword',
      hash,
    });
    expect(isWrong).toBe(false);
  });
  
  it('should work with different cost factors', async () => {
    const password = 'test';
    const hash = await hashPassword({
      password,
      costFactor: 4,
    });
    expect(hash.startsWith('$2b$04$') || hash.startsWith('$2a$04$')).toBe(true);
  });
});
