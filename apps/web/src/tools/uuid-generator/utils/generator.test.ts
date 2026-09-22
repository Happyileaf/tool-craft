import { describe, it, expect } from 'vitest';
import { generateUuid } from './generator';

describe('generateUuid', () => {
  it('should generate a valid UUID v4', () => {
    const uuid = generateUuid();
    
    // Check format: 8-4-4-4-12 hex characters
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    
    // Check version is 4
    expect(uuid[14]).toBe('4');
    
    // Check variant is 8, 9, a, or b
    expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
  });
  
  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 1000; i++) {
      uuids.add(generateUuid());
    }
    expect(uuids.size).toBe(1000);
  });
});
