import { describe, it, expect } from 'vitest';
import { convertCsvToJson, convertJsonToCsv } from './converter';

describe('convertCsvToJson', () => {
  it('should convert simple CSV to JSON', () => {
    const csv = `name,age,city
Alice,30,New York
Bob,25,London`;
    const result = convertCsvToJson(csv);
    expect(result).toEqual([
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'London' },
    ]);
  });

  it('should handle quoted values with commas', () => {
    const csv = `name,description
Product,"Doohickey, the best thing ever"
Widget,"Simple widget"`;
    const result = convertCsvToJson(csv);
    expect(result).toEqual([
      { name: 'Product', description: 'Doohickey, the best thing ever' },
      { name: 'Widget', description: 'Simple widget' },
    ]);
  });

  it('should handle escaped quotes', () => {
    const csv = `quote,text
He said,"""Hello world"""`;
    const result = convertCsvToJson(csv);
    expect(result).toEqual([
      { quote: 'He said', text: '"Hello world"' },
    ]);
  });

  it('should convert boolean values', () => {
    const csv = `name,active
Product,true
Widget,false`;
    const result = convertCsvToJson(csv);
    expect(result).toEqual([
      { name: 'Product', active: true },
      { name: 'Widget', active: false },
    ]);
  });
});

describe('convertJsonToCsv', () => {
  it('should convert JSON array to CSV', () => {
    const json = [
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'London' },
    ];
    const result = convertJsonToCsv(json);
    const expected = `name,age,city
Alice,30,New York
Bob,25,London`;
    expect(result).toEqual(expected);
  });

  it('should handle commas in values', () => {
    const json = [
      { name: 'Product', description: 'Doohickey, the best thing ever' },
    ];
    const result = convertJsonToCsv(json);
    expect(result).toContain('Product,"Doohickey, the best thing ever"');
  });
});