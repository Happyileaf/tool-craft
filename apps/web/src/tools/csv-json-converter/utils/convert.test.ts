import { describe, it, expect } from 'vitest';
import { csvToJson, jsonToCsv } from './convert';

describe('csvToJson', () => {
  it('should convert empty csv to empty array', () => {
    expect(csvToJson('')).toEqual([]);
  });

  it('should convert csv with header', () => {
    const csv = `name,age,city
Alice,30,New York
Bob,25,London`;
    const expected = [
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
    ];
    expect(csvToJson(csv)).toEqual(expected);
  });

  it('should handle quoted fields with commas', () => {
    const csv = `name,description
Product,"This is a test, with comma"
Another,No comma`;
    const result = csvToJson(csv);
    expect(result[0].description).toBe('This is a test, with comma');
  });

  it('should handle escaped quotes', () => {
    const csv = `name,quote
John,"He said ""Hello"""`;
    const result = csvToJson(csv);
    expect(result[0].quote).toBe('He said "Hello"');
  });
});

describe('jsonToCsv', () => {
  it('should convert empty json array to empty string', () => {
    expect(jsonToCsv('[]')).toBe('');
  });

  it('should convert array of objects to csv', () => {
    const json = JSON.stringify([
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'London' },
    ]);
    const expected = `name,age,city
Alice,30,New York
Bob,25,London`;
    expect(jsonToCsv(json)).toBe(expected);
  });

  it('should handle fields with commas and quotes', () => {
    const json = JSON.stringify([
      { name: 'Product', description: 'This is a test, with comma' },
    ]);
    const result = jsonToCsv(json);
    expect(result).toContain('"This is a test, with comma"');
  });
});
