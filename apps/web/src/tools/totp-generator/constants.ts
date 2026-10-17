/**
 * TOTP 动态验证码生成器工具内常量
 */

import { TOTP_ALGORITHMS, type TotpAlgorithm } from './utils/totp';

/**
 * 工具首次载入时填入的默认 Base32 密钥，
 * 即 RFC 6238 附录 B 中 SHA-1 用例密钥（ASCII「12345678901234567890」）的 Base32 形式
 */
export const DEFAULT_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

/**
 * 验证码位数选项
 */
export const DIGITS_OPTIONS: number[] = [6, 8];

/**
 * 默认验证码位数
 */
export const DEFAULT_DIGITS = 6;

/**
 * 时间步长选项（秒）
 */
export const STEP_SECONDS_OPTIONS: number[] = [30, 60];

/**
 * 默认时间步长（秒）
 */
export const DEFAULT_STEP_SECONDS = 30;

/**
 * 哈希算法选项数据源，顺序与 TOTP_ALGORITHMS 保持一致
 */
export const ALGORITHM_OPTIONS: { label: string; value: TotpAlgorithm }[] =
  TOTP_ALGORITHMS.map((algorithm) => ({ label: algorithm, value: algorithm }));

/**
 * RFC 6238 附录 B 测试向量数据结构
 */
export interface Rfc6238TestVector {
  /** 面向用户展示的用例名称 */
  label: string;
  /** 该用例使用的哈希算法 */
  algorithm: TotpAlgorithm;
  /** 该用例的验证码位数 */
  digits: number;
  /** 原始 ASCII 密钥文本 */
  secret: string;
  /** 同一密钥的 Base32 形式，可直接填入工具输入框 */
  base32Secret: string;
  /** 时间戳 T = 59s 时的标准期望验证码 */
  expected: string;
}

/**
 * RFC 6238 附录 B 标准测试向量（时间戳均为 T = 59s），
 * 期望值取自 RFC 原文，不可改动
 */
export const RFC6238_TEST_VECTORS: Rfc6238TestVector[] = [
  {
    label: 'SHA-1（20 字节密钥）',
    algorithm: 'SHA-1',
    digits: 8,
    secret: '12345678901234567890',
    base32Secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    expected: '94287082',
  },
  {
    label: 'SHA-256（32 字节密钥）',
    algorithm: 'SHA-256',
    digits: 8,
    secret: '12345678901234567890123456789012',
    base32Secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA',
    expected: '46119246',
  },
  {
    label: 'SHA-512（64 字节密钥）',
    algorithm: 'SHA-512',
    digits: 8,
    secret:
      '1234567890123456789012345678901234567890123456789012345678901234',
    base32Secret:
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA',
    expected: '90693936',
  },
];
