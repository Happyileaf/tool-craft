/** HTTP Digest 认证响应计算器的常量与示例数据 */

/** 摘要算法枚举 */
export type DigestAlgorithm = 'MD5' | 'MD5-sess' | 'SHA-256' | 'SHA-256-sess';

/** qop 模式：none 不带 qop，auth 仅认证，auth-int 认证并校验实体体 */
export type DigestQop = 'none' | 'auth' | 'auth-int';

export interface DigestAlgorithmOption {
  label: string;
  value: DigestAlgorithm;
}

export const ALGORITHM_OPTIONS: DigestAlgorithmOption[] = [
  { label: 'MD5', value: 'MD5' },
  { label: 'MD5-sess', value: 'MD5-sess' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-256-sess', value: 'SHA-256-sess' },
];

export interface DigestQopOption {
  label: string;
  value: DigestQop;
}

export const QOP_OPTIONS: DigestQopOption[] = [
  { label: '无 qop（RFC 2069 兼容）', value: 'none' },
  { label: 'auth', value: 'auth' },
  { label: 'auth-int', value: 'auth-int' },
];

export const METHOD_OPTIONS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
].map((method) => ({ label: method, value: method }));

/** RFC 2617 §3.5 官方示例，可直接用于验证 MD5 计算链路 */
export const DEFAULT_DIGEST_INPUT = {
  username: 'Mufasa',
  password: 'Circle Of Life',
  realm: 'testrealm@host.com',
  nonce: 'dcd98b7102dd2f0e8b11d0f600bfb0c093',
  uri: '/dir/index.html',
  method: 'GET',
  algorithm: 'MD5' as DigestAlgorithm,
  qop: 'auth' as DigestQop,
  nc: '00000001',
  cnonce: '0a4f113b',
  opaque: '',
  entityBody: '',
  userhash: false,
};
