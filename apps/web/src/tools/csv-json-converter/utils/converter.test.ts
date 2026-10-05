import { describe, it, expect } from 'vitest';
import { csvToJson, jsonToCsv } from './converter';

describe('csvToJson', () => {
  it('should return empty array for empty csv', () => {
    expect(csvToJson('')).toEqual([]);
    expect(csvToJson('   ')).toEqual([]);
  });

  it('should parse simple csv correctly', () => {
    const csv = `name,age,city
Alice,30,New York
Bob,25,London`;
    const expected = [
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
    ];
    expect(csvToJson(csv)).toEqual(expected);
  });

  it('should handle quoted values with commas', () => {
    const csv = `name,description
Product,"This is a test, with comma"
Another,"No comma"`;
    const result = csvToJson(csv);
    expect(result[0].description).toBe('This is a test, with comma');
  });

  it('should handle escaped quotes', () => {
    const csv = `text
"He said ""hello"""`;
    const result = csvToJson(csv);
    expect(result[0].text).toBe('He said "hello"');
  });
});

describe('jsonToCsv', () => {
  it('should return empty string for empty array', () => {
    expect(jsonToCsv([])).toBe('');
  });

  it('should convert json array to csv correctly', () => {
    const data = [
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
    ];
    const csv = jsonToCsv(data);
    expect(csv).toBe(`name,age,city
Alice,30,New York
Bob,25,London`);
  });

  it('should escape commas and quotes', () => {
    const data = [
      { name: 'Product', description: 'This is a test, with comma' },
    ];
    const csv = jsonToCsv(data);
    expect(csv).toContain('"This is a test, with comma"');
  });
});
