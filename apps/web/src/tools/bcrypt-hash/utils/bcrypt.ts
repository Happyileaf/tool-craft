
import bcrypt from 'bcryptjs';

export interface HashOptions {
  password: string;
  costFactor: number;
}

export interface VerifyOptions {
  password: string;
  hash: string;
}

/**
 * 使用 bcrypt 对密码进行哈希加密
 */
export async function hashPassword(options: HashOptions): Promise<string> {
  const { password, costFactor } = options;
  const salt = await bcrypt.genSalt(costFactor);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码是否匹配哈希
 */
export async function verifyPassword(options: VerifyOptions): Promise<boolean> {
  const { password, hash } = options;
  return bcrypt.compare(password, hash);
}
