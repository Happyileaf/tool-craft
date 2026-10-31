import { describe, it, expect } from 'vitest';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  decryptTextOaep,
  detectPemType,
  encryptTextOaep,
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
  importPrivateKeyPem,
  importPublicKeyPem,
  oaepMaxMessageBytes,
  signTextPss,
  unwrapPem,
  verifyTextPss,
  wrapPem,
} from './rsa';
import {
  PRIVATE_KEY_PEM_LABEL,
  PUBLIC_KEY_PEM_LABEL,
  SHA256_HASH_BYTES,
} from '../constants';

describe('Base64 与 ArrayBuffer 互转', () => {
  it('字节序列往返后保持一致（含 0x00 与 0xff 边界字节）', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 65, 66, 67]);
    const base64 = arrayBufferToBase64(bytes.buffer);
    expect(base64).toBe(btoa(String.fromCharCode(...bytes)));
    const restored = new Uint8Array(base64ToArrayBuffer(base64));
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });

  it('解码时自动忽略空白与换行', () => {
    const original = new Uint8Array([104, 101, 108, 108, 111]);
    const base64 = arrayBufferToBase64(original.buffer);
    const spaced = `${base64.slice(0, 2)}\n ${base64.slice(2)}`;
    const restored = new TextDecoder().decode(base64ToArrayBuffer(spaced));
    expect(restored).toBe('hello');
  });
});

describe('PEM 包装与解包', () => {
  it('wrapPem 带正确头尾且正文按 64 列折行', () => {
    // 100 个 Base64 字符应折为 64 + 36 两行
    const body = 'A'.repeat(100);
    const pem = wrapPem(PUBLIC_KEY_PEM_LABEL, body);
    const lines = pem.split('\n');
    expect(lines[0]).toBe('-----BEGIN PUBLIC KEY-----');
    expect(lines[1]).toHaveLength(64);
    expect(lines[2]).toHaveLength(36);
    expect(lines[3]).toBe('-----END PUBLIC KEY-----');
  });

  it('wrapPem → unwrapPem 往返还原正文，折行与空白被规整', () => {
    const body = 'MIIBCgKCAQEA'.repeat(20);
    const pem = wrapPem(PRIVATE_KEY_PEM_LABEL, body);
    expect(unwrapPem(pem, PRIVATE_KEY_PEM_LABEL)).toBe(body);
    // 对已折行的 PEM 再解包结果不变
    expect(unwrapPem(`${pem}\n`, PRIVATE_KEY_PEM_LABEL)).toBe(body);
  });

  it('unwrapPem 在头尾缺失或标签不匹配时抛错', () => {
    expect(() => unwrapPem('not a pem', PUBLIC_KEY_PEM_LABEL)).toThrow(/PEM 格式错误/);
    const privatePem = wrapPem(PRIVATE_KEY_PEM_LABEL, 'AAAA');
    expect(() => unwrapPem(privatePem, PUBLIC_KEY_PEM_LABEL)).toThrow(/BEGIN\/END/);
  });

  it('detectPemType 自动识别公钥 / 私钥 / 无法识别', () => {
    expect(detectPemType(wrapPem(PUBLIC_KEY_PEM_LABEL, 'AAAA'))).toBe('public');
    expect(detectPemType(wrapPem(PRIVATE_KEY_PEM_LABEL, 'AAAA'))).toBe('private');
    expect(detectPemType('plain text')).toBeNull();
  });
});

describe('oaepMaxMessageBytes', () => {
  it('按 k - 2*hLen - 2 计算各模长上限（SHA-256）', () => {
    expect(oaepMaxMessageBytes(2048, SHA256_HASH_BYTES)).toBe(190);
    expect(oaepMaxMessageBytes(3072, SHA256_HASH_BYTES)).toBe(318);
    expect(oaepMaxMessageBytes(4096, SHA256_HASH_BYTES)).toBe(446);
  });
});

describe('RSA-OAEP 密钥对与加解密', () => {
  it('2048 位：生成 → 导出 PEM → 导回 → 加密 → 解密还原中英文原文', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 2048);
    const publicPem = await exportPublicKeyPem(pair.publicKey);
    const privatePem = await exportPrivateKeyPem(pair.privateKey);

    expect(publicPem.startsWith('-----BEGIN PUBLIC KEY-----')).toBe(true);
    expect(privatePem.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
    expect(publicPem.endsWith('-----END PUBLIC KEY-----')).toBe(true);
    expect(privatePem.endsWith('-----END PRIVATE KEY-----')).toBe(true);

    const importedPublic = await importPublicKeyPem(publicPem, 'RSA-OAEP');
    const importedPrivate = await importPrivateKeyPem(privatePem, 'RSA-OAEP');

    const plaintext = 'Hello, RSA 你好';
    const ciphertext = await encryptTextOaep(importedPublic, plaintext, 2048);
    expect(ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
    // 2048 位密文为 256 字节，Base64 长度 344
    expect(base64ToArrayBuffer(ciphertext).byteLength).toBe(256);

    const decrypted = await decryptTextOaep(importedPrivate, ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('每次加密产生不同密文（OAEP 填充随机性）', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 2048);
    const first = await encryptTextOaep(pair.publicKey, 'same message', 2048);
    const second = await encryptTextOaep(pair.publicKey, 'same message', 2048);
    expect(first).not.toBe(second);
    expect(await decryptTextOaep(pair.privateKey, second)).toBe('same message');
  });

  it('超出最大明文长度（190 字节）时在加密前抛出中文错误', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 2048);
    const tooLong = '中'.repeat(100); // UTF-8 下 300 字节
    await expect(encryptTextOaep(pair.publicKey, tooLong, 2048)).rejects.toThrow(/明文过长/);
    // 190 字节的 ASCII 文本恰好可以加密
    const atLimit = 'a'.repeat(190);
    const ciphertext = await encryptTextOaep(pair.publicKey, atLimit, 2048);
    expect(await decryptTextOaep(pair.privateKey, ciphertext)).toBe(atLimit);
  });

  it('密文被篡改或格式非法时解密失败并抛出中文错误', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 2048);
    const ciphertext = await encryptTextOaep(pair.publicKey, 'secret', 2048);
    // 在保持合法 Base64 字符集的前提下翻转一个字符
    const flipped = ciphertext.charAt(0) === 'A'
      ? `B${ciphertext.slice(1)}`
      : `A${ciphertext.slice(1)}`;
    await expect(decryptTextOaep(pair.privateKey, flipped)).rejects.toThrow(/解密失败/);
    await expect(decryptTextOaep(pair.privateKey, '@@@not base64@@@')).rejects.toThrow(/Base64/);
  });

  it('3072 位密钥可完成一次轻量加解密往返', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 3072);
    const ciphertext = await encryptTextOaep(pair.publicKey, '3072 轻量往返', 3072);
    expect(base64ToArrayBuffer(ciphertext).byteLength).toBe(384);
    expect(await decryptTextOaep(pair.privateKey, ciphertext)).toBe('3072 轻量往返');
  });

  it('4096 位密钥可生成并导出正确头部（耗时较长，省略加解密往返）', async () => {
    // 4096 位密钥生成在部分 CI 环境需数秒，加解密往返更慢，
    // 此处仅断言生成成功与 PEM 头部标识，往返安全性由 2048/3072 用例覆盖
    const pair = await generateRsaKeyPair('RSA-OAEP', 4096);
    const publicPem = await exportPublicKeyPem(pair.publicKey);
    const privatePem = await exportPrivateKeyPem(pair.privateKey);
    expect(publicPem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privatePem).toContain('-----BEGIN PRIVATE KEY-----');
  }, 30000);
});

describe('RSA-PSS 签名与验签', () => {
  it('签名 → 验签通过，签名为 Base64 且长度等于模数字节数', async () => {
    const pair = await generateRsaKeyPair('RSA-PSS', 2048);
    const message = 'Hello, RSA 你好';
    const signature = await signTextPss(pair.privateKey, message);
    expect(signature).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(base64ToArrayBuffer(signature).byteLength).toBe(256);
    await expect(verifyTextPss(pair.publicKey, message, signature)).resolves.toBe(true);
  });

  it('消息被篡改后验签失败（返回 false 而非抛错）', async () => {
    const pair = await generateRsaKeyPair('RSA-PSS', 2048);
    const signature = await signTextPss(pair.privateKey, '原始消息');
    await expect(verifyTextPss(pair.publicKey, '篡改后的消息', signature)).resolves.toBe(false);
  });

  it('签名经 PEM 导出 / 导入后仍可验签通过', async () => {
    const pair = await generateRsaKeyPair('RSA-PSS', 2048);
    const publicPem = await exportPublicKeyPem(pair.publicKey);
    const importedPublic = await importPublicKeyPem(publicPem, 'RSA-PSS');
    const signature = await signTextPss(pair.privateKey, 'PEM round-trip');
    await expect(verifyTextPss(importedPublic, 'PEM round-trip', signature)).resolves.toBe(true);
  });

  it('签名 Base64 非法时抛出中文错误', async () => {
    const pair = await generateRsaKeyPair('RSA-PSS', 2048);
    await expect(verifyTextPss(pair.publicKey, 'msg', '@@@')).rejects.toThrow(/Base64/);
  });
});

describe('OAEP 与 PSS 密钥混用拦截', () => {
  it('RSA-OAEP 密钥不能用于 PSS 签名 / 验签', async () => {
    const pair = await generateRsaKeyPair('RSA-OAEP', 2048);
    await expect(signTextPss(pair.privateKey, 'msg')).rejects.toThrow(/RSA-PSS/);
    await expect(verifyTextPss(pair.publicKey, 'msg', 'AAAA')).rejects.toThrow(/RSA-PSS/);
  });

  it('RSA-PSS 密钥不能用于 OAEP 加密 / 解密', async () => {
    const pair = await generateRsaKeyPair('RSA-PSS', 2048);
    await expect(encryptTextOaep(pair.publicKey, 'msg', 2048)).rejects.toThrow(/RSA-OAEP/);
    await expect(decryptTextOaep(pair.privateKey, 'AAAA')).rejects.toThrow(/RSA-OAEP/);
  });
});
