import { describe, expect, it } from 'vitest';
import { csvToJson, jsonToCsv } from './converter';

describe('csvToJson', () => {
  it('should convert simple CSV to JSON', () => {
    const csv = `name,age,city
Alice,30,New York
Bob,25,London`;
    const result = csvToJson(csv);
    expect(result).toEqual([
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
    ]);
  });

  it('should handle quoted fields with commas', () => {
    const csv = `name,description
Product,"This is a test, with comma"
Another,Simple`;
    const result = csvToJson(csv);
    expect(result).toEqual([
      { name: 'Product', description: 'This is a test, with comma' },
      { name: 'Another', description: 'Simple' },
    ]);
  });

  it('should handle empty CSV', () => {
    expect(csvToJson('')).toEqual([]);
  });

  it('should handle quoted fields with escaped quotes', () => {
    const csv = `text
"He said ""Hello"""`;
    const result = csvToJson(csv);
    expect(result[0].text).toBe('He said "Hello"');
  });
});

describe('jsonToCsv', () => {
  it('should convert JSON array to CSV', () => {
    const json = [
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
    ];
    const result = jsonToCsv(json);
    expect(result).toBe(`name,age,city
Alice,30,"New York"
Bob,25,London`);
  });

  it('should handle fields with commas and quotes', () => {
    const json = [
      { name: 'Product', description: 'This is a test, with comma' },
    ];
    const result = jsonToCsv(json);
    expect(result).toBe(`name,description
Product,"This is a test, with comma"`);
  });

  it('should handle empty JSON array', () => {
    expect(jsonToCsv([])).toBe('');
  });

  it('should handle escaped quotes', () => {
    const json = [{ text: 'He said "Hello"' }];
    const result = jsonToCsv(json);
    expect(result).toBe('text\n"He said ""Hello"""');
  });
});
