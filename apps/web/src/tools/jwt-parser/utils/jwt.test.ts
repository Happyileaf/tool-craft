import { describe, expect, test } from 'vitest';
import { parseJwt, generateJwt, verifySignature } from './jwt';
import { JwtAlgorithmEnum } from '../constants';

describe('parseJwt', () => {
  test('should parse valid JWT correctly', async () => {
    // Header: {"alg": "HS256", "typ": "JWT"}
    // Payload: {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}
    // Secret: "your-256-bit-secret"
    // Signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const result = parseJwt(token);
    expect(result.isValidFormat).toBe(true);
    expect(result.header.alg).toBe('HS256');
    expect(result.payload.name).toBe('John Doe');
    expect(result.payload.sub).toBe('1234567890');
  });

  test('should return error for invalid format', () => {
    const result = parseJwt('invalid.token');
    expect(result.isValidFormat).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('generateJwt and verifySignature', () => {
  test('should generate and verify correctly', async () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'test', name: 'Test User' };
    const secret = 'my-secret-key';
    const jwt = await generateJwt(header, payload, secret, JwtAlgorithmEnum.HS256);
    expect(jwt.split('.')).toHaveLength(3);

    const isValid = await verifySignature(jwt, secret);
    expect(isValid).toBe(true);

    const wrongSecretValid = await verifySignature(jwt, 'wrong-secret');
    expect(wrongSecretValid).toBe(false);
  });
});
