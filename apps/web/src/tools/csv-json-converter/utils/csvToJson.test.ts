import { describe, it, expect } from 'vitest';
import { csvToJson } from './csvToJson';

describe('csvToJson', () => {
  it('should convert simple CSV to JSON', () => {
    const csv = `name,age
Alice,30
Bob,25`;
    const result = csvToJson(csv);
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('should handle quoted fields with delimiter inside', () => {
    const csv = `name,description
Product,"This is, a test"
Another,Item`;
    const result = csvToJson(csv);
    expect(result).toEqual([
      { name: 'Product', description: 'This is, a test' },
      { name: 'Another', description: 'Item' },
    ]);
  });

  it('should handle escaped quotes', () => {
    const csv = `name,quote
John,"He said ""Hello"""`;
    const result = csvToJson(csv);
    expect(result).toEqual([
      { name: 'John', quote: 'He said "Hello"' },
    ]);
  });

  it('should handle custom delimiter', () => {
    const csv = `name;age
Alice;30
Bob;25`;
    const result = csvToJson(csv, ';');
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('should return empty array for empty input', () => {
    expect(csvToJson('')).toEqual([]);
    expect(csvToJson('   ')).toEqual([]);
  });
});
