export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface JwtResult {
  header: Record<string, unknown> | null;
  payload: JwtPayload | null;
  signature: string | null;
  error: string | null;
}

function base64UrlDecode(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch (e) {
    return '';
  }
}

export function decodeJwt(token: string): JwtResult {
  if (!token || token.trim() === '') {
    return { header: null, payload: null, signature: null, error: null };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: null,
      error: 'Invalid JWT: expected 3 parts separated by dots',
    };
  }

  try {
    const headerJson = base64UrlDecode(parts[0]);
    const payloadJson = base64UrlDecode(parts[1]);

    const header = JSON.parse(headerJson) as Record<string, unknown>;
    const payload = JSON.parse(payloadJson) as JwtPayload;

    return {
      header,
      payload,
      signature: parts[2],
      error: null,
    };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: null,
      error: `Invalid JWT: ${(e as Error).message}`,
    };
  }
}
