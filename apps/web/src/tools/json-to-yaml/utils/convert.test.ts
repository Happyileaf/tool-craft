import { describe, it, expect } from 'vitest';
import { jsonToYaml } from './convert';

describe('jsonToYaml', () => {
  it('should convert simple object', () => {
    const input = JSON.stringify({ name: 'test', age: 20 });
    const result = jsonToYaml(input);
    expect(result).toContain('name: test');
    expect(result).toContain('age: 20');
  });

  it('should convert nested object', () => {
    const input = JSON.stringify({
      name: 'test',
      info: {
        active: true,
        tags: ['a', 'b']
      }
    });
    const result = jsonToYaml(input);
    expect(result).toContain('name: test');
    expect(result).toContain('info:');
    expect(result).toContain('  active: true');
    expect(result).toContain('  tags:');
  });

  it('should handle array', () => {
    const input = JSON.stringify([1, 2, 3]);
    const result = jsonToYaml(input);
    expect(result).toContain('- 1');
    expect(result).toContain('- 2');
    expect(result).toContain('- 3');
  });

  it('should throw error for invalid JSON', () => {
    expect(() => jsonToYaml('{invalid}')).toThrow();
  });

  it('should handle null and booleans', () => {
    const input = JSON.stringify({ nullValue: null, trueValue: true, falseValue: false });
    const result = jsonToYaml(input);
    expect(result).toContain('nullValue: null');
    expect(result).toContain('trueValue: true');
    expect(result).toContain('falseValue: false');
  });
});
