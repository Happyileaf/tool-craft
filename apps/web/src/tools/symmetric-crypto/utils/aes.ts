export const AesErrorKey = {
  INVALID_FORMAT: 'errorInvalidFormat',
  ENCRYPT_FAILED: 'errorEncryptFailed',
  DECRYPT_FAILED: 'decryptFailed',
} as const;

export type AesErrorKey = (typeof AesErrorKey)[keyof typeof AesErrorKey];

export interface AesOperationError {
  key: AesErrorKey;
}

export type EncryptResult =
  | { success: true; encrypted: string }
  | { success: false; error: AesOperationError };

export type DecryptResult =
  | { success: true; plaintext: string }
  | { success: false; error: AesOperationError };

/** PBKDF2 迭代次数，依据 OWASP 对 SHA-256 的最低建议取 60 万次 */
const PBKDF2_ITERATIONS = 600_000;
/** PBKDF2 salt 长度，16 字节足以保证每次加密的派生密钥互不相同 */
const SALT_LENGTH = 16;
/** AES-GCM IV 长度，规范推荐的 12 字节固定长度 */
const IV_LENGTH = 12;

/**
 * 将字节数组编码为 Base64URL 字符串
 *
 * @param bytes - 待编码的字节数组
 * @returns 不带填充的 Base64URL 字符串
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize),
    );
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 将 Base64URL 字符串解码为字节数组
 *
 * @param base64Url - Base64URL 字符串
 * @returns 解码后的字节数组
 */
function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (base64.length % 4);
  if (pad > 0 && pad < 4) {
    base64 += '='.repeat(pad);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 通过 PBKDF2 从任意长度的密码派生 AES-GCM 密钥
 *
 * @param password - 用户输入的密码
 * @param salt - 派生用 salt
 * @returns 可直接用于加解密的 CryptoKey
 */
async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * 使用 AES-GCM 加密文本，密码经 PBKDF2 派生，不限制长度
 *
 * @param plaintext - 明文文本
 * @param password - 任意长度的加密密码
 * @returns 成功返回「salt.iv.密文」形式的结果，失败返回结构化错误
 */
export async function encrypt(
  plaintext: string,
  password: string,
): Promise<EncryptResult> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cryptoKey = await deriveKey(password, salt);

    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        new TextEncoder().encode(plaintext),
      ),
    );

    return {
      success: true,
      encrypted: `${bytesToBase64Url(salt)}.${bytesToBase64Url(iv)}.${bytesToBase64Url(ciphertext)}`,
    };
  } catch {
    return {
      success: false,
      error: { key: AesErrorKey.ENCRYPT_FAILED },
    };
  }
}

/**
 * 使用 AES-GCM 解密文本，兼容三段新格式与历史两段格式
 *
 * @param encrypted - 「salt.iv.密文」或历史「iv.密文」形式的密文
 * @param password - 加密时使用的密码
 * @returns 成功返回明文，失败返回结构化错误
 */
export async function decrypt(
  encrypted: string,
  password: string,
): Promise<DecryptResult> {
  const parts = encrypted.trim().split('.');
  if (parts.length !== 2 && parts.length !== 3) {
    return {
      success: false,
      error: { key: AesErrorKey.INVALID_FORMAT },
    };
  }

  try {
    const isLegacyFormat = parts.length === 2;
    const salt = isLegacyFormat
      ? new Uint8Array(new ArrayBuffer(0))
      : base64UrlToBytes(parts[0]!);
    const iv = base64UrlToBytes(parts[isLegacyFormat ? 0 : 1]!);
    const ciphertext = base64UrlToBytes(parts[isLegacyFormat ? 1 : 2]!);

    const cryptoKey = isLegacyFormat
      ? await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          { name: 'AES-GCM' },
          false,
          ['decrypt'],
        )
      : await deriveKey(password, salt);

    const plaintext = new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext,
      ),
    );
    return { success: true, plaintext };
  } catch {
    return {
      success: false,
      error: { key: AesErrorKey.DECRYPT_FAILED },
    };
  }
}
