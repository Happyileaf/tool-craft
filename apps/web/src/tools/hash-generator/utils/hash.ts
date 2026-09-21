import { HashAlgorithmBitsMap, HashAlgorithmEnum } from '../constants';
import { md5Hex } from './md5';

/**
 * 单条哈希计算结果
 */
export interface HashResult {
  /** 产生该结果的哈希算法 */
  algorithm: HashAlgorithmEnum;
  /** 小写十六进制哈希值，计算失败时为空字符串 */
  value: string;
  /** 摘要位长，供界面标注 bits */
  bits: number;
  /** 该算法是否计算失败 */
  hasError: boolean;
}

/**
 * 将 ArrayBuffer 形式的摘要转换为小写十六进制字符串
 *
 * @param buffer - WebCrypto 输出的摘要缓冲区
 * @returns 小写十六进制字符串
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 同时计算 MD5、SHA-1、SHA-256、SHA-512 四种哈希摘要，
 * 单个算法计算失败时仅该条结果标记失败，不影响其他算法
 *
 * @param text - 待摘要的原始文本，按 UTF-8 编码
 * @returns 四种算法的计算结果数组，顺序与 HashAlgorithmEnum 一致
 */
export async function computeHash(text: string): Promise<HashResult[]> {
  const data = new TextEncoder().encode(text);
  const allAlgorithms = Object.values(HashAlgorithmEnum);

  const results = await Promise.all(
    allAlgorithms.map(async (algorithm): Promise<HashResult> => {
      const bits = HashAlgorithmBitsMap[algorithm];
      try {
        if (algorithm === HashAlgorithmEnum.MD5) {
          return { algorithm, value: md5Hex(text), bits, hasError: false };
        }
        const digest = await crypto.subtle.digest({ name: algorithm }, data);
        return { algorithm, value: bufferToHex(digest), bits, hasError: false };
      } catch {
        return { algorithm, value: '', bits, hasError: true };
      }
    }),
  );

  return results;
}

/**
 * 使用 WebCrypto 计算 HMAC 消息认证码
 *
 * @param text - 待认证的原始文本，按 UTF-8 编码
 * @param secret - HMAC 密钥，按 UTF-8 编码导入
 * @param algorithm - 哈希算法，仅支持 WebCrypto 允许的 SHA-1/SHA-256/SHA-512
 * @returns 小写十六进制 HMAC 值
 * @throws 当算法不受支持（如 MD5）或密钥导入失败时抛出异常
 */
export async function computeHmac(
  text: string,
  secret: string,
  algorithm: HashAlgorithmEnum,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    new TextEncoder().encode(text),
  );
  return bufferToHex(signature);
}
