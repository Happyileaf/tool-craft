/**
 * OAuth2 PKCE 生成器工具内常量
 */

import { PKCE_METHODS, type PkceMethod } from './utils/pkce';

/** code_verifier 长度快捷选项 */
export const VERIFIER_LENGTH_OPTIONS: number[] = [43, 64, 96, 128];

/** 默认 code_verifier 长度 */
export const DEFAULT_VERIFIER_LENGTH = 43;

/** code_challenge 方法选择项数据源 */
export const METHOD_OPTIONS: { label: string; value: PkceMethod }[] = [
  { label: 'S256（推荐，BASE64URL(SHA-256(verifier))）', value: PKCE_METHODS[0] },
  { label: 'plain（不推荐，仅兼容旧服务端）', value: PKCE_METHODS[1] },
];

/** 默认 code_challenge 方法 */
export const DEFAULT_METHOD: PkceMethod = PKCE_METHODS[0];
