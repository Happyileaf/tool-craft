import { splitJwt, base64UrlDecode, base64UrlEncode, parseJwt } from './jwt';

describe('jwt utils', () => {
  describe('splitJwt', () => {
    it('should split simple jwt into three parts', () => {
      const token = 'header.payload.signature';
      expect(splitJwt(token)).toEqual(['header', 'payload', 'signature']);
    });

    it('should remove Bearer prefix', () => {
      const token = 'Bearer header.payload.signature';
      expect(splitJwt(token)).toEqual(['header', 'payload', 'signature']);
    });

    it('should handle lowercase bearer', () => {
      const token = 'bearer header.payload.signature';
      expect(splitJwt(token)).toEqual(['header', 'payload', 'signature']);
    });
  });

  describe('base64Url encoding/decoding', () => {
    it('should encode and decode correctly', () => {
      const input = 'test string+/=';
      const encoded = base64UrlEncode(input);
      expect(encoded).toBe('dGVzdCBzdHJpbmcrLw');
      const decoded = base64UrlDecode(encoded);
      expect(decoded).toBe(input);
    });
  });

  describe('parseJwt', () => {
    it('should parse valid jwt', () => {
      // Example JWT: header {"alg": "HS256", "typ": "JWT"}, payload {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = parseJwt(token);
      expect(result.error).toBeNull();
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      });
    });

    it('should return error for invalid format', () => {
      const token = 'header.payload';
      const result = parseJwt(token);
      expect(result.error).not.toBeNull();
      expect(result.header).toBeNull();
      expect(result.payload).toBeNull();
    });

    it('should return error for invalid json', () => {
      const token = 'invalidjson.invalidjson.signature';
      const result = parseJwt(token);
      expect(result.error).not.toBeNull();
    });
  });
});
