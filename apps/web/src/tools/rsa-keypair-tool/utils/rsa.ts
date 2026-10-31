/**
 * RSA 非对称密钥对生成与加解密纯逻辑集合。
 * 仅依赖浏览器 / Node 18+ 原生 Web Crypto（SubtleCrypto），
 * 不 import React、不触碰 DOM、不发起任何网络请求。
 */
import {
  PEM_LINE_LENGTH,
  PSS_SALT_LENGTH,
  PUBLIC_KEY_PEM_LABEL,
  PRIVATE_KEY_PEM_LABEL,
  RSA_HASH,
  RSA_PUBLIC_EXPONENT,
  SHA256_HASH_BYTES,
} from '../constants';

/** 支持的 RSA 算法类型 */
export type RsaAlgorithm = 'RSA-OAEP' | 'RSA-PSS';

/** 生成得到的非对称密钥对 */
export interface RsaKeyPair {
  /** 公钥 */
  publicKey: CryptoKey;
  /** 私钥 */
  privateKey: CryptoKey;
  /** 生成时使用的算法 */
  algorithm: RsaAlgorithm;
  /** 模长（位） */
  modulusLength: number;
}

/**
 * 获取当前环境的 SubtleCrypto 实例。
 *
 * 浏览器中为 globalThis.crypto.subtle；Node 18+ 的全局 Web Crypto 同样可用，
 * 写法与仓库内 pkce-generator 保持一致，兼容 vitest 的 node 测试环境。
 *
 * @returns SubtleCrypto 实例
 * @throws 当运行环境不支持 Web Crypto 时抛出错误
 */
export function getSubtle(): SubtleCrypto {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject || !cryptoObject.subtle) {
    throw new Error('当前环境不支持 Web Crypto SubtleCrypto');
  }
  return cryptoObject.subtle;
}

/**
 * 将 ArrayBuffer 编码为标准 Base64 字符串
 *
 * @param buffer - 待编码的二进制数据
 * @returns Base64 字符串（可能含 +、/、=）
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

/**
 * 将标准 Base64 字符串解码为 ArrayBuffer
 *
 * @param base64 - Base64 字符串（允许含空白与换行）
 * @returns 解码后的二进制数据
 * @throws 当字符串不是合法 Base64 时抛出错误
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const normalized = base64.replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

/**
 * 将 Base64 正文按 RFC 7468 包装成 PEM 文本（每行 64 列，带 BEGIN/END 头尾）
 *
 * @param label - PEM 标签，如 PUBLIC KEY / PRIVATE KEY
 * @param base64Body - 已完成 Base64 编码的正文（内部空白会被规整后重新折行）
 * @returns 标准 PEM 文本
 */
export function wrapPem(label: string, base64Body: string): string {
  const compact = base64Body.replace(/\s+/g, '');
  const lines: string[] = [];
  for (let offset = 0; offset < compact.length; offset += PEM_LINE_LENGTH) {
    lines.push(compact.slice(offset, offset + PEM_LINE_LENGTH));
  }
  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join('\n');
}

/**
 * 解包 PEM 文本：校验头尾标签并取出纯 Base64 正文
 *
 * @param pem - PEM 文本
 * @param expectedLabel - 期望的标签（如 PUBLIC KEY）
 * @returns 去除头尾与折行的 Base64 正文
 * @throws 当头尾缺失、标签不匹配或正文为空时抛出错误
 */
export function unwrapPem(pem: string, expectedLabel: string): string {
  const begin = `-----BEGIN ${expectedLabel}-----`;
  const end = `-----END ${expectedLabel}-----`;
  const beginIndex = pem.indexOf(begin);
  const endIndex = pem.indexOf(end);
  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(`PEM 格式错误：缺少 ${expectedLabel} 的 BEGIN/END 头尾标识`);
  }
  const body = pem.slice(beginIndex + begin.length, endIndex).replace(/\s+/g, '');
  if (!body) {
    throw new Error(`PEM 内容为空：${expectedLabel}`);
  }
  return body;
}

/**
 * 识别 PEM 文本的类型（依据 BEGIN 标签）
 *
 * @param pem - PEM 文本
 * @returns 'public' 表示 SPKI 公钥，'private' 表示 PKCS8 私钥，无法识别为 null
 */
export function detectPemType(pem: string): 'public' | 'private' | null {
  if (pem.includes(`-----BEGIN ${PUBLIC_KEY_PEM_LABEL}-----`)) {
    return 'public';
  }
  if (pem.includes(`-----BEGIN ${PRIVATE_KEY_PEM_LABEL}-----`)) {
    return 'private';
  }
  return null;
}

/**
 * 计算 RSAES-OAEP（SHA-256）单次可加密的最大明文字节数。
 *
 * 公式（RFC 8017 §7.1.1）：k - 2*hLen - 2，
 * 其中 k 为模数字节数（模长 / 8），hLen 为哈希摘要字节数（SHA-256 为 32）。
 * 2048 位密钥对应 256 - 64 - 2 = 190 字节。
 *
 * @param modulusLength - 模长（位）
 * @param hashByteLength - 哈希摘要字节数，默认 32（SHA-256）
 * @returns 最大明文长度（字节）
 */
export function oaepMaxMessageBytes(
  modulusLength: number,
  hashByteLength: number = SHA256_HASH_BYTES,
): number {
  return modulusLength / 8 - 2 * hashByteLength - 2;
}

/**
 * 生成 RSA 密钥对（RSA-OAEP 或 RSA-PSS，SHA-256，publicExponent 65537）
 *
 * @param algorithm - RSA-OAEP（加解密）或 RSA-PSS（签名验签）
 * @param modulusLength - 模长，2048 / 3072 / 4096
 * @returns 含公私钥与生成参数的密钥对
 */
export async function generateRsaKeyPair(
  algorithm: RsaAlgorithm,
  modulusLength: number,
): Promise<RsaKeyPair> {
  const subtle = getSubtle();
  const pair = (await subtle.generateKey(
    {
      name: algorithm,
      modulusLength,
      publicExponent: RSA_PUBLIC_EXPONENT,
      hash: RSA_HASH,
    },
    true,
    algorithm === 'RSA-OAEP' ? ['encrypt', 'decrypt'] : ['sign', 'verify'],
  )) as CryptoKeyPair;
  return {
    publicKey: pair.publicKey as CryptoKey,
    privateKey: pair.privateKey as CryptoKey,
    algorithm,
    modulusLength,
  };
}

/**
 * 导出公钥为 SPKI 格式 PEM 文本
 *
 * @param publicKey - 公钥 CryptoKey
 * @returns -----BEGIN PUBLIC KEY----- 形式的 PEM
 */
export async function exportPublicKeyPem(publicKey: CryptoKey): Promise<string> {
  const subtle = getSubtle();
  const spki = await subtle.exportKey('spki', publicKey);
  return wrapPem(PUBLIC_KEY_PEM_LABEL, arrayBufferToBase64(spki));
}

/**
 * 导出私钥为 PKCS8 格式 PEM 文本
 *
 * @param privateKey - 私钥 CryptoKey
 * @returns -----BEGIN PRIVATE KEY----- 形式的 PEM
 */
export async function exportPrivateKeyPem(privateKey: CryptoKey): Promise<string> {
  const subtle = getSubtle();
  const pkcs8 = await subtle.exportKey('pkcs8', privateKey);
  return wrapPem(PRIVATE_KEY_PEM_LABEL, arrayBufferToBase64(pkcs8));
}

/**
 * 从 SPKI PEM 文本导入 RSA 公钥（RSA-OAEP / RSA-PSS 自动按指定算法还原）
 *
 * @param pem - 公钥 PEM 文本
 * @param algorithm - 目标算法，默认 RSA-OAEP
 * @returns 可用于加密或验签的公钥 CryptoKey
 */
export async function importPublicKeyPem(
  pem: string,
  algorithm: RsaAlgorithm = 'RSA-OAEP',
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const body = unwrapPem(pem, PUBLIC_KEY_PEM_LABEL);
  const spki = base64ToArrayBuffer(body);
  return subtle.importKey(
    'spki',
    spki,
    { name: algorithm, hash: RSA_HASH },
    false,
    algorithm === 'RSA-OAEP' ? ['encrypt'] : ['verify'],
  );
}

/**
 * 从 PKCS8 PEM 文本导入 RSA 私钥（RSA-OAEP / RSA-PSS 自动按指定算法还原）
 *
 * @param pem - 私钥 PEM 文本
 * @param algorithm - 目标算法，默认 RSA-OAEP
 * @returns 可用于解密或签名的私钥 CryptoKey
 */
export async function importPrivateKeyPem(
  pem: string,
  algorithm: RsaAlgorithm = 'RSA-OAEP',
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const body = unwrapPem(pem, PRIVATE_KEY_PEM_LABEL);
  const pkcs8 = base64ToArrayBuffer(body);
  return subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: algorithm, hash: RSA_HASH },
    false,
    algorithm === 'RSA-OAEP' ? ['decrypt'] : ['sign'],
  );
}

/**
 * 把底层异常转换为面向用户的中文错误信息
 *
 * @param caught - catch 到的未知异常
 * @param fallback - 默认中文提示
 * @returns 中文错误信息
 */
function toChineseError(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message) {
    return `${fallback}（${caught.message}）`;
  }
  return fallback;
}

/**
 * 使用 RSA-OAEP 公钥加密文本（UTF-8 编码，密文以 Base64 返回）
 *
 * @param publicKey - 接收方公钥
 * @param plaintext - 明文文本
 * @param modulusLength - 密钥模长，用于加密前的明文长度预检
 * @returns Base64 密文
 * @throws 明文超长、密钥算法不匹配或加密失败时抛出含中文信息的错误
 */
export async function encryptTextOaep(
  publicKey: CryptoKey,
  plaintext: string,
  modulusLength: number,
): Promise<string> {
  if (publicKey.algorithm.name !== 'RSA-OAEP') {
    throw new Error('当前密钥为 RSA-PSS 签名密钥，不能用于 RSA-OAEP 加密；请生成或导入 RSA-OAEP 密钥');
  }
  const encoded = new TextEncoder().encode(plaintext);
  const maxBytes = oaepMaxMessageBytes(modulusLength);
  if (encoded.length > maxBytes) {
    throw new Error(
      `明文过长：UTF-8 编码后为 ${encoded.length} 字节，${modulusLength} 位密钥单次最多加密 ${maxBytes} 字节，请缩短文本或改用更大的模长`,
    );
  }
  const subtle = getSubtle();
  try {
    const ciphertext = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded);
    return arrayBufferToBase64(ciphertext);
  } catch (caught) {
    throw new Error(toChineseError(caught, 'RSA-OAEP 加密失败，请确认公钥与明文是否正确'));
  }
}

/**
 * 使用 RSA-OAEP 私钥解密 Base64 密文，按 UTF-8 还原文本
 *
 * @param privateKey - 接收方私钥
 * @param ciphertextBase64 - Base64 密文
 * @returns UTF-8 明文文本
 * @throws 密文格式错误、密钥不匹配 / 算法不匹配或解密失败时抛出含中文信息的错误
 */
export async function decryptTextOaep(
  privateKey: CryptoKey,
  ciphertextBase64: string,
): Promise<string> {
  if (privateKey.algorithm.name !== 'RSA-OAEP') {
    throw new Error('当前密钥为 RSA-PSS 签名密钥，不能用于 RSA-OAEP 解密；请生成或导入 RSA-OAEP 密钥');
  }
  let ciphertext: ArrayBuffer;
  try {
    ciphertext = base64ToArrayBuffer(ciphertextBase64);
  } catch {
    throw new Error('密文不是合法的 Base64，请检查复制是否完整');
  }
  const subtle = getSubtle();
  try {
    const plaintextBytes = await subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, ciphertext);
    return new TextDecoder().decode(plaintextBytes);
  } catch (caught) {
    throw new Error(toChineseError(caught, 'RSA-OAEP 解密失败：密钥不匹配或密文已损坏'));
  }
}

/**
 * 使用 RSA-PSS 私钥对文本签名（SHA-256，saltLength 固定 32，签名以 Base64 返回）
 *
 * @param privateKey - 签名方私钥
 * @param message - 待签名文本（UTF-8）
 * @returns Base64 签名
 * @throws 密钥算法不匹配或签名失败时抛出含中文信息的错误
 */
export async function signTextPss(privateKey: CryptoKey, message: string): Promise<string> {
  if (privateKey.algorithm.name !== 'RSA-PSS') {
    throw new Error('当前密钥为 RSA-OAEP 加密密钥，不能用于 RSA-PSS 签名；请生成或导入 RSA-PSS 密钥');
  }
  const subtle = getSubtle();
  try {
    const signature = await subtle.sign(
      { name: 'RSA-PSS', saltLength: PSS_SALT_LENGTH },
      privateKey,
      new TextEncoder().encode(message),
    );
    return arrayBufferToBase64(signature);
  } catch (caught) {
    throw new Error(toChineseError(caught, 'RSA-PSS 签名失败'));
  }
}

/**
 * 使用 RSA-PSS 公钥验签文本签名
 *
 * @param publicKey - 签名方公钥
 * @param message - 原文文本（UTF-8）
 * @param signatureBase64 - Base64 签名
 * @returns 验签是否通过
 * @throws 密钥算法不匹配或签名 Base64 非法时抛出含中文信息的错误
 */
export async function verifyTextPss(
  publicKey: CryptoKey,
  message: string,
  signatureBase64: string,
): Promise<boolean> {
  if (publicKey.algorithm.name !== 'RSA-PSS') {
    throw new Error('当前密钥为 RSA-OAEP 加密密钥，不能用于 RSA-PSS 验签；请生成或导入 RSA-PSS 密钥');
  }
  let signature: ArrayBuffer;
  try {
    signature = base64ToArrayBuffer(signatureBase64);
  } catch {
    throw new Error('签名不是合法的 Base64，请检查复制是否完整');
  }
  const subtle = getSubtle();
  try {
    return await subtle.verify(
      { name: 'RSA-PSS', saltLength: PSS_SALT_LENGTH },
      publicKey,
      signature,
      new TextEncoder().encode(message),
    );
  } catch (caught) {
    throw new Error(toChineseError(caught, 'RSA-PSS 验签失败'));
  }
}
