/**
 * ACME dns-01 挑战（RFC 8555 §8.1 / §8.4）与 JWK Thumbprint（RFC 7638）纯函数。
 * 全部为确定性字符串 / 字节运算，SHA-256 摘要通过注入的 sha256Fn 完成，
 * 浏览器与 Node 测试环境均可注入 globalThis.crypto.subtle.digest。
 */
import { base64UrlEncode, isBase64Url } from './base64url';

export class AcmeError extends Error {}

/** RFC 7638 §3.2 规定的各密钥类型必需成员（数组顺序即词典序） */
const REQUIRED_MEMBERS: Record<string, readonly string[]> = {
  RSA: ['e', 'kty', 'n'],
  EC: ['crv', 'kty', 'x', 'y'],
  OKP: ['crv', 'kty', 'x'],
  oct: ['k', 'kty'],
};

export type Sha256Fn = (
  data: Uint8Array<ArrayBuffer>,
) => Promise<Uint8Array<ArrayBuffer>>;

/** 浏览器 / Node 通用的默认 SHA-256 实现（Web Crypto） */
export const webCryptoSha256: Sha256Fn = async (data) => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new AcmeError('当前环境不支持 Web Crypto，无法计算 SHA-256');
  }
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
};

export interface JsonWebKeyLike {
  kty?: unknown;
  [member: string]: unknown;
}

/**
 * 按 RFC 7638 规范化 JWK：仅保留 kty 要求的必需成员，
 * 成员名按词典序排序，输出无空白紧凑 JSON。
 */
export function canonicalJwk(jwk: JsonWebKeyLike): string {
  if (typeof jwk !== 'object' || jwk === null || Array.isArray(jwk)) {
    throw new AcmeError('JWK 必须是 JSON 对象');
  }
  const kty = jwk.kty;
  if (typeof kty !== 'string') {
    throw new AcmeError('JWK 缺少字符串类型的 kty 成员');
  }
  const required = REQUIRED_MEMBERS[kty];
  if (!required) {
    throw new AcmeError(`不支持的密钥类型 kty=${kty}（仅支持 RSA / EC / OKP / oct）`);
  }
  const canonical: Record<string, string> = {};
  for (const member of required) {
    const value = jwk[member];
    if (typeof value !== 'string') {
      throw new AcmeError(`JWK 缺少必需成员或成员非字符串：${member}`);
    }
    canonical[member] = value;
  }
  return JSON.stringify(canonical);
}

/**
 * 计算 JWK Thumbprint：base64url(SHA-256(规范化 JWK 的 UTF-8 字节))。
 * @param canonical canonicalJwk 产出的规范化 JSON
 * @param sha256Fn 可注入的 SHA-256 实现
 */
export async function computeThumbprint(
  canonical: string,
  sha256Fn: Sha256Fn = webCryptoSha256,
): Promise<string> {
  const digest = await sha256Fn(new TextEncoder().encode(canonical));
  return base64UrlEncode(digest);
}

/** 校验单个 Base64URL 字段（token / thumbprint），失败时抛出带字段名的中文错误 */
function assertBase64UrlField(value: string, fieldLabel: string): string {
  const text = value.trim();
  if (!text) {
    throw new AcmeError(`${fieldLabel}不能为空`);
  }
  if (!isBase64Url(text)) {
    throw new AcmeError(
      `${fieldLabel}包含非法字符：仅允许 Base64URL 字母表（A-Z、a-z、0-9、-、_），不得包含 +、/ 或 = 填充`,
    );
  }
  return text;
}

/**
 * 拼装 RFC 8555 §8.1 key authorization：token || '.' || accountThumbprint。
 * 两段分别做 Base64URL 字符集校验。
 */
export function buildKeyAuthorization(token: string, accountThumbprint: string): string {
  const safeToken = assertBase64UrlField(token, 'challenge token');
  const safeThumbprint = assertBase64UrlField(accountThumbprint, '账户 JWK thumbprint');
  return `${safeToken}.${safeThumbprint}`;
}

/**
 * 计算 dns-01 TXT 记录值：base64url(SHA-256(key authorization 的 UTF-8 字节))，
 * 固定 43 字符、无填充。
 */
export async function computeDns01TxtValue(
  keyAuthorization: string,
  sha256Fn: Sha256Fn = webCryptoSha256,
): Promise<string> {
  if (!keyAuthorization) {
    throw new AcmeError('key authorization 不能为空');
  }
  const digest = await sha256Fn(new TextEncoder().encode(keyAuthorization));
  return base64UrlEncode(digest);
}

export interface ParsedKeyAuthorization {
  token: string;
  thumbprint: string;
}

/**
 * 反向校验并拆分已有 key authorization：
 * 必须恰好包含一个点分隔符，且两段均为合法 Base64URL。
 */
export function parseKeyAuthorization(keyAuthorization: string): ParsedKeyAuthorization {
  const text = keyAuthorization.trim();
  if (!text) {
    throw new AcmeError('key authorization 不能为空');
  }
  const parts = text.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AcmeError('key authorization 结构非法：应为「token.thumbprint」且仅含一个点分隔符');
  }
  const token = assertBase64UrlField(parts[0] ?? '', 'token 段');
  const thumbprint = assertBase64UrlField(parts[1] ?? '', 'thumbprint 段');
  return { token, thumbprint };
}

export interface NormalizedDomain {
  /** 去除空白、末尾点与通配前缀后的域名 */
  domain: string;
  /** 原始输入是否为通配符域名（*. 开头） */
  wildcard: boolean;
  /** 是否包含非 ASCII（IDN），UI 据此提示使用 Punycode */
  idn: boolean;
}

/**
 * 规范化域名：去首尾空白与末尾点，剥离 `*.` 通配前缀；
 * 拒绝协议前缀、路径、端口、下划线等非法形态。
 */
export function normalizeDomain(input: string): NormalizedDomain {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new AcmeError('域名不能为空');
  }
  if (/^[a-z]+:\/\//i.test(trimmed)) {
    throw new AcmeError('域名不能包含协议前缀（如 http:// 或 https://），请直接填写域名');
  }
  if (trimmed.includes('/')) {
    throw new AcmeError('域名不能包含路径（/），请只填写主机名');
  }
  if (trimmed.includes(':')) {
    throw new AcmeError('域名不能包含端口（:），请只填写主机名');
  }
  if (trimmed.includes('_')) {
    throw new AcmeError('域名不能包含下划线（_），主机标签仅允许字母、数字与连字符');
  }
  let domain = trimmed.replace(/\.$/, '');
  let wildcard = false;
  if (domain.startsWith('*.')) {
    wildcard = true;
    domain = domain.slice(2);
  } else if (domain.includes('*')) {
    throw new AcmeError('通配符仅允许出现在域名最左侧（如 *.example.com）');
  }
  if (!domain || domain.startsWith('.') || domain.includes('..')) {
    throw new AcmeError('域名结构非法，请检查标签与点分隔');
  }
  const idn = /[^\u0000-\u007F]/.test(domain);
  return { domain, wildcard, idn };
}

/** 生成 TXT 记录名：_acme-challenge.<规范化域名> */
export function buildRecordName(normalized: NormalizedDomain): string {
  return `_acme-challenge.${normalized.domain}`;
}

export interface AcmeChallengeResult {
  recordName: string;
  txtValue: string;
  keyAuthorization: string;
  wildcard: boolean;
  idn: boolean;
}

/** 一站式生成 dns-01 挑战全部输出 */
export async function generateDns01Challenge(
  domainInput: string,
  token: string,
  accountThumbprint: string,
  sha256Fn: Sha256Fn = webCryptoSha256,
): Promise<AcmeChallengeResult> {
  const normalized = normalizeDomain(domainInput);
  const keyAuthorization = buildKeyAuthorization(token, accountThumbprint);
  const txtValue = await computeDns01TxtValue(keyAuthorization, sha256Fn);
  return {
    recordName: buildRecordName(normalized),
    txtValue,
    keyAuthorization,
    wildcard: normalized.wildcard,
    idn: normalized.idn,
  };
}

export interface GeneratedP256Key {
  /** 公钥 JWK（仅含 crv/kty/x/y，可直接用于 thumbprint 计算） */
  publicJwk: JsonWebKey;
  /** 私钥 JWK（含 d 成员），仅在本机内存中短暂持有 */
  privateJwk: JsonWebKey;
  /** RFC 7638 规范化 JSON */
  canonical: string;
  /** 公钥 JWK thumbprint（Base64URL，无填充） */
  thumbprint: string;
}

/**
 * 生成 P-256（ECDSA secp256r1）密钥对并导出 JWK，返回公钥 thumbprint。
 * 全程使用浏览器 Web Crypto，不引入任何第三方依赖、不发起网络请求。
 */
export async function generateP256KeyPair(
  sha256Fn: Sha256Fn = webCryptoSha256,
): Promise<GeneratedP256Key> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new AcmeError('当前环境不支持 Web Crypto，无法生成密钥对');
  }
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const canonical = canonicalJwk(publicJwk as unknown as JsonWebKeyLike);
  const thumbprint = await computeThumbprint(canonical, sha256Fn);
  return { publicJwk, privateJwk, canonical, thumbprint };
}
