import { describe, expect, it } from 'vitest';
import {
  AesErrorKey,
  encrypt,
  decrypt,
  type AesOperationError,
} from './aes';

describe('AES-GCM 加解密', () => {
  it('任意非标准长度密码都能成功加密', async () => {
    const result = await encrypt('hello', 'your-secret-key');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.encrypted.split('.')).toHaveLength(3);
    }
  });

  it('同一密码每次加密产生不同密文', async () => {
    const first = await encrypt('hello', 'key');
    const second = await encrypt('hello', 'key');
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (first.success && second.success) {
      expect(first.encrypted).not.toBe(second.encrypted);
    }
  });

  it('加密后可用相同密码解密还原', async () => {
    const text = '敏感信息：用户名 admin';
    const encrypted = await encrypt(text, '123456');
    expect(encrypted.success).toBe(true);
    if (!encrypted.success) return;

    const decrypted = await decrypt(encrypted.encrypted, '123456');
    expect(decrypted).toEqual({ success: true, plaintext: text });
  });

  it('支持空字符串以外的 Unicode 内容往返', async () => {
    const text = '中文 English 123 🎉';
    const encrypted = await encrypt(text, '密码');
    expect(encrypted.success).toBe(true);
    if (!encrypted.success) return;

    const decrypted = await decrypt(encrypted.encrypted, '密码');
    expect(decrypted).toEqual({ success: true, plaintext: text });
  });

  it('密码错误时解密失败', async () => {
    const encrypted = await encrypt('secret', 'correct');
    expect(encrypted.success).toBe(true);
    if (!encrypted.success) return;

    const result = await decrypt(encrypted.encrypted, 'wrong');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual<AesOperationError>({
        key: AesErrorKey.DECRYPT_FAILED,
      });
    }
  });

  it('密文被篡改时解密失败', async () => {
    const encrypted = await encrypt('secret', 'key');
    expect(encrypted.success).toBe(true);
    if (!encrypted.success) return;

    const [salt, iv] = encrypted.encrypted.split('.');
    const tampered = await decrypt(`${salt}.${iv}.AAAA`, 'key');
    expect(tampered.success).toBe(false);
  });

  it('密文前后带空白时仍可正常解密', async () => {
    const encrypted = await encrypt('secret', 'key');
    expect(encrypted.success).toBe(true);
    if (!encrypted.success) return;

    const result = await decrypt(`\n${encrypted.encrypted}\n`, 'key');
    expect(result).toEqual({ success: true, plaintext: 'secret' });
  });

  it('段数不为 2 或 3 时返回格式错误', async () => {
    const result = await decrypt('a.b.c.d', 'key');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual<AesOperationError>({
        key: AesErrorKey.INVALID_FORMAT,
      });
    }
  });

  it('兼容历史两段格式：raw 密钥长度合法时可解密', async () => {
    const password = '0123456789abcdef';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    );
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        new TextEncoder().encode('legacy text'),
      ),
    );
    const toBase64Url = (bytes: Uint8Array) =>
      btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const legacyEncrypted = `${toBase64Url(iv)}.${toBase64Url(ciphertext)}`;

    const result = await decrypt(legacyEncrypted, password);
    expect(result).toEqual({ success: true, plaintext: 'legacy text' });
  });
});
