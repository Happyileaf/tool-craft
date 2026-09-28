import { describe, it, expect } from 'vitest';
import { COMMON_PATTERNS } from './generator';

describe('COMMON_PATTERNS', () => {
  it('should have all required fields', () => {
    COMMON_PATTERNS.forEach(pattern => {
      expect(pattern.name).toBeDefined();
      expect(pattern.description).toBeDefined();
      expect(pattern.pattern).toBeDefined();
      expect(pattern.category).toBeDefined();
    });
  });

  it('should compile all patterns without error', () => {
    COMMON_PATTERNS.forEach(pattern => {
      expect(() => new RegExp(pattern.pattern)).not.toThrow();
    });
  });
});
