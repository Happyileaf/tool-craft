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

/**
 * 将字符串转换为 Uint8Array
 */
function stringToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 ArrayBuffer 转换为 Base64URL 编码字符串
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 将 Base64URL 编码转换为 Uint8Array
 */
function base64UrlToArrayBuffer(b64url: string): Uint8Array {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
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
 * 使用 AES-GCM 加密文本
 * @param plaintext 明文文本
 * @param key 密钥
 * @returns 成功返回加密结果，失败返回结构化错误
 */
export async function encrypt(
  plaintext: string,
  key: string,
): Promise<EncryptResult> {
  try {
    const encodedPlaintext = stringToArrayBuffer(plaintext);
    const encodedKey = stringToArrayBuffer(key);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encodedKey.buffer as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      cryptoKey,
      encodedPlaintext.buffer as ArrayBuffer
    );

    const ivBase64 = arrayBufferToBase64Url(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64Url(encryptedBuffer);
    return {
      success: true,
      encrypted: `${ivBase64}.${ciphertextBase64}`,
    };
  } catch {
    return {
      success: false,
      error: { key: AesErrorKey.ENCRYPT_FAILED },
    };
  }
}

/**
 * 使用 AES-GCM 解密文本
 * @param encrypted 加密后的 iv + ciphertext (base64url 点分隔)
 * @param key 密钥
 * @returns 成功返回明文，失败返回结构化错误
 */
export async function decrypt(
  encrypted: string,
  key: string,
): Promise<DecryptResult> {
  const parts = encrypted.split('.');
  if (parts.length !== 2) {
    return {
      success: false,
      error: { key: AesErrorKey.INVALID_FORMAT },
    };
  }

  try {
    const [ivBase64, ciphertextBase64] = parts;
    const iv = base64UrlToArrayBuffer(ivBase64!);
    const ciphertext = base64UrlToArrayBuffer(ciphertextBase64!);
    const encodedKey = stringToArrayBuffer(key);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encodedKey.buffer as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      cryptoKey,
      ciphertext.buffer as ArrayBuffer
    );

    const plaintext = new TextDecoder().decode(decryptedBuffer);
    return {
      success: true,
      plaintext,
    };
  } catch {
    return {
      success: false,
      error: { key: AesErrorKey.DECRYPT_FAILED },
    };
  }
}
