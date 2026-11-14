/** HTTP Digest 认证响应计算（RFC 2617 / RFC 7616） */

import { md5Hex } from '../../hash-generator/utils/md5';
import type { DigestAlgorithm, DigestQop } from '../constants';

export interface DigestInput {
  username: string;
  password: string;
  realm: string;
  nonce: string;
  uri: string;
  method: string;
  algorithm: DigestAlgorithm;
  qop: DigestQop;
  nc: string;
  cnonce: string;
  opaque?: string;
  entityBody?: string;
  userhash?: boolean;
}

export interface DigestResult {
  /** H(A1) 摘要 */
  ha1: string;
  /** H(A2) 摘要 */
  ha2: string;
  /** 最终 response 摘要 */
  response: string;
  /** 可直接放入 Authorization 请求头的字符串 */
  authorization: string;
  /** 是否启用了 userhash，以及请求头中展示的用户名 */
  userName: string;
}

const SHA_ALGORITHMS: DigestAlgorithm[] = ['SHA-256', 'SHA-256-sess'];

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

async function hashHex(algorithm: DigestAlgorithm, input: string): Promise<string> {
  if (SHA_ALGORITHMS.includes(algorithm)) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return toHex(digest);
  }
  return md5Hex(input);
}

function normalizeNc(nc: string): string {
  const trimmed = nc.trim().toLowerCase();
  if (!/^[0-9a-f]{1,8}$/.test(trimmed)) {
    throw new Error('nonce-count 必须是 1–8 位十六进制数字，例如 00000001');
  }
  return trimmed.padStart(8, '0');
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function validateInput(input: DigestInput): void {
  if (!input.username) {
    throw new Error('用户名不能为空');
  }
  if (!input.realm) {
    throw new Error('realm 不能为空');
  }
  if (!input.nonce) {
    throw new Error('nonce 不能为空');
  }
  if (!input.uri) {
    throw new Error('请求 URI 不能为空');
  }
  if (!input.method.trim()) {
    throw new Error('请求方法不能为空');
  }
  if (input.qop !== 'none') {
    if (!input.cnonce) {
      throw new Error('使用 qop 时必须提供 cnonce');
    }
  }
}

/**
 * 计算 Digest 认证响应，支持 MD5 / MD5-sess / SHA-256 / SHA-256-sess 与 auth / auth-int
 */
export async function computeDigest(input: DigestInput): Promise<DigestResult> {
  validateInput(input);
  const { username, password, realm, nonce, uri, method, algorithm, qop } = input;
  const nc = qop === 'none' ? '' : normalizeNc(input.nc);
  const cnonce = qop === 'none' ? '' : input.cnonce;

  const secret = `${username}:${realm}:${password}`;
  let ha1 = await hashHex(algorithm, secret);
  if (algorithm.endsWith('-sess')) {
    ha1 = await hashHex(algorithm, `${ha1}:${nonce}:${cnonce}`);
  }

  const a2 =
    qop === 'auth-int'
      ? `${method}:${uri}:${await hashHex(algorithm, input.entityBody ?? '')}`
      : `${method}:${uri}`;
  const ha2 = await hashHex(algorithm, a2);

  const response =
    qop === 'none'
      ? await hashHex(algorithm, `${ha1}:${nonce}:${ha2}`)
      : await hashHex(algorithm, `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

  const userName = input.userhash
    ? await hashHex(algorithm, `${username}:${realm}`)
    : username;

  const parts = [
    `username=${quote(userName)}`,
    `realm=${quote(realm)}`,
    `nonce=${quote(nonce)}`,
    `uri=${quote(uri)}`,
    `response=${quote(response)}`,
    `algorithm=${algorithm}`,
  ];
  if (qop !== 'none') {
    parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce=${quote(cnonce)}`);
  }
  if (input.opaque) {
    parts.push(`opaque=${quote(input.opaque)}`);
  }
  if (input.userhash) {
    parts.push('userhash=true');
  }

  return {
    ha1,
    ha2,
    response,
    authorization: `Digest ${parts.join(', ')}`,
    userName,
  };
}
