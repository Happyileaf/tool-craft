/**
 * JWT 解析器默认样例输入
 */
export const DEFAULT_INPUT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

/**
 * JWT 标准声明映射
 */
export const JWT_CLAIM_LABELS: Record<string, string> = {
  iss: 'Issuer (iss) - 签发者',
  sub: 'Subject (sub) - 主题',
  aud: 'Audience (aud) - 受众',
  exp: 'Expiration Time (exp) - 过期时间',
  nbf: 'Not Before (nbf) - 生效时间',
  iat: 'Issued At (iat) - 签发时间',
  jti: 'JWT ID (jti) - JWT ID',
};

export const JWT_CLAIM_LABELS_EN: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expiration Time',
  nbf: 'Not Before',
  iat: 'Issued At',
  jti: 'JWT ID',
};
