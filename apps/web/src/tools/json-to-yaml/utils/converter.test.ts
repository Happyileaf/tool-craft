import { describe, it, expect } from 'vitest';
import { jsonToYaml } from './converter';

describe('jsonToYaml', () => {
  it('should convert simple object', () => {
    const json = '{"name": "test", "age": 25}';
    const result = jsonToYaml(json);
    expect(result.success).toBe(true);
    expect(result.result).toContain('name: test');
    expect(result.result).toContain('age: 25');
  });

  it('should convert nested object', () => {
    const json = '{"person": {"name": "test", "active": true}}';
    const result = jsonToYaml(json);
    expect(result.success).toBe(true);
    expect(result.result).toContain('person:');
    expect(result.result).toContain('name: test');
    expect(result.result).toContain('active: true');
  });

  it('should convert array', () => {
    const json = '["apple", "banana", "cherry"]';
    const result = jsonToYaml(json);
    expect(result.success).toBe(true);
    expect(result.result).toContain('- apple');
    expect(result.result).toContain('- banana');
    expect(result.result).toContain('- cherry');
  });

  it('should handle null values', () => {
    const json = '{"value": null}';
    const result = jsonToYaml(json);
    expect(result.success).toBe(true);
    expect(result.result).toBe('value: null');
  });

  it('should return error for invalid JSON', () => {
    const json = '{invalid json}';
    const result = jsonToYaml(json);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
