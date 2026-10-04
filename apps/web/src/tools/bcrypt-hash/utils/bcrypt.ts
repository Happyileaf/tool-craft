import bcrypt from 'bcryptjs';

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string, rounds: number): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
