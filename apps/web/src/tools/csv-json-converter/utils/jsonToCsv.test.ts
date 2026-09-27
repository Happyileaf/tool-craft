import { describe, it, expect } from 'vitest';
import { jsonToCsv } from './jsonToCsv';

describe('jsonToCsv', () => {
  it('should convert JSON array to CSV', () => {
    const json = [
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ];
    const result = jsonToCsv(json);
    expect(result).toBe('name,age\nAlice,30\nBob,25');
  });

  it('should quote fields containing delimiter', () => {
    const json = [
      { name: 'Product', description: 'This is, a test' },
    ];
    const result = jsonToCsv(json);
    expect(result).toBe('name,description\nProduct,"This is, a test"');
  });

  it('should escape quotes in fields', () => {
    const json = [
      { name: 'John', quote: 'He said "Hello"' },
    ];
    const result = jsonToCsv(json);
    expect(result).toBe('name,quote\nJohn,"He said ""Hello"""');
  });

  it('should handle custom delimiter', () => {
    const json = [
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ];
    const result = jsonToCsv(json, ';');
    expect(result).toBe('name;age\nAlice;30\nBob;25');
  });

  it('should return empty string for empty array', () => {
    expect(jsonToCsv([])).toBe('');
  });
});
