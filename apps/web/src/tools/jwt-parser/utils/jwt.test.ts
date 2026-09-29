
import { describe, it, expect } from 'vitest';
import { parseJwt, generateJwt, verifySignature } from './jwt';

describe('parseJwt', () => {
  it('should fail when token does not have 3 parts', () => {
    const result = parseJwt('header.payload');
    expect(result.success).toBe(false);
  });

  it('should parse valid JWT', () => {
    // header: {"alg": "HS256", "typ": "JWT"}
    // payload: {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = parseJwt(token);
    expect(result.success).toBe(true);
    expect(result.parts?.headerJson.alg).toBe('HS256');
    expect(result.parts?.headerJson.typ).toBe('JWT');
    expect(result.parts?.payloadJson.sub).toBe('1234567890');
    expect(result.parts?.payloadJson.name).toBe('John Doe');
  });

  it('should fail with invalid JSON', () => {
    const token = 'invalid.eyJzdWIiOiIxMjM0NTY3ODkw.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = parseJwt(token);
    expect(result.success).toBe(false);
  });
});

describe('generateJwt and verifySignature', () => {
  it('should generate valid JWT that verifies correctly', async () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '123', name: 'Test' };
    const secret = 'your-256-bit-secret';
    
    const jwt = await generateJwt({
      header,
      payload,
      secret,
      algorithm: 'HS256',
    });
    
    expect(jwt.split('.').length).toBe(3);
    
    const isValid = await verifySignature(jwt, secret);
    expect(isValid).toBe(true);
    
    const wrongSecretValid = await verifySignature(jwt, 'wrong-secret');
    expect(wrongSecretValid).toBe(false);
  });
});
