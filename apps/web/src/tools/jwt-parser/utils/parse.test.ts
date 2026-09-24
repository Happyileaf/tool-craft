import { describe, expect, test } from 'vitest';
import { parseJwt, formatTimestamp, isExpired } from './parse';

describe('parseJwt', () => {
  test('should parse valid JWT', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = parseJwt(token);
    expect(result.isValidFormat).toBe(true);
    expect(result.error).toBeNull();
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload).toEqual({
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    });
    expect(result.signature).toBe(
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    );
  });

  test('should return error for empty token', () => {
    const result = parseJwt('');
    expect(result.isValidFormat).toBe(false);
    expect(result.error).toBe('Empty token');
  });

  test('should return error for wrong number of parts', () => {
    const result = parseJwt('header.payload');
    expect(result.isValidFormat).toBe(false);
    expect(result.error).toContain('expected 3 parts');
  });

  test('should return error for invalid base64', () => {
    const result = parseJwt('!!!.!!!.!!!');
    expect(result.isValidFormat).toBe(false);
    expect(result.error).toContain('Parsing failed');
  });
});

describe('formatTimestamp', () => {
  test('should format timestamp correctly', () => {
    const timestamp = 1516239022;
    const result = formatTimestamp(timestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('isExpired', () => {
  test('should return true for expired token', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(isExpired(past)).toBe(true);
  });

  test('should return false for non-expired token', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isExpired(future)).toBe(false);
  });
});
