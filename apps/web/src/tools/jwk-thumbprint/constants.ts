/** RFC 7638 §3.1 公开 RSA 样例 JWK（含 alg/kid 多余成员，便于演示裁剪） */
export const DEFAULT_JWK = `{
  "kty": "RSA",
  "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
  "e": "AQAB",
  "alg": "RS256",
  "kid": "2011-04-29"
}`;

export const HASH_OPTIONS = [
  { label: 'SHA-256（RFC 7638 默认，43 字符）', value: 'SHA-256' },
  { label: 'SHA-384（RFC 9278，64 字符）', value: 'SHA-384' },
  { label: 'SHA-512（RFC 9278，86 字符）', value: 'SHA-512' },
];
