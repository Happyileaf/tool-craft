import { describe, expect, it } from 'vitest';
import { decodeJwt } from './decode';

describe('jwt decoder', () => {
  it('should decode valid jwt correctly', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = decodeJwt(token);
    expect(result.error).toBeNull();
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload).toEqual({
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    });
    expect(result.signature).toBe(
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    );
  });

  it('should return error for jwt with wrong number of parts', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const result = decodeJwt(token);
    expect(result.error).toContain('expected 3 parts');
    expect(result.header).toBeNull();
  });

  it('should return error for invalid base64', () => {
    const token = 'invalid.!!!.signature';
    const result = decodeJwt(token);
    expect(result.error).toBeDefined();
  });

  it('should return empty result for empty input', () => {
    const result = decodeJwt('');
    expect(result.header).toBeNull();
    expect(result.payload).toBeNull();
    expect(result.error).toBeNull();
  });
});
