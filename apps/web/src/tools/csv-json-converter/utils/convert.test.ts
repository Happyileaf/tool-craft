import { describe, expect, test } from 'vitest';
import { csvToJson, jsonToCsv } from './convert';

const defaultOptions = {
  delimiter: ',',
  newline: '\n'
};

describe('csvToJson', () => {
  test('should convert simple CSV to JSON array', () => {
    const csv = `name,age\nAlice,30\nBob,25`;
    const result = csvToJson(csv, defaultOptions);
    expect(JSON.parse(result)).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ]);
  });

  test('should skip empty lines', () => {
    const csv = `name,age\n\nAlice,30\n\nBob,25\n`;
    const result = csvToJson(csv, defaultOptions);
    expect(JSON.parse(result)).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ]);
  });

  test('should throw error on invalid CSV', () => {
    const csv = `name,"unclosed quote\nAlice,30`;
    expect(() => csvToJson(csv, defaultOptions)).toThrow();
  });
});

describe('jsonToCsv', () => {
  test('should convert JSON array to CSV', () => {
    const json = JSON.stringify([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ]);
    const result = jsonToCsv(json, defaultOptions);
    expect(result).toBe('name,age\nAlice,30\nBob,25');
  });

  test('should throw error when JSON is not an array', () => {
    const json = JSON.stringify({ name: 'Alice', age: 30 });
    expect(() => jsonToCsv(json, defaultOptions)).toThrow('JSON must be an array of objects');
  });

  test('should throw error on invalid JSON', () => {
    const json = `{ "name": "Alice", age: 30 `;
    expect(() => jsonToCsv(json, defaultOptions)).toThrow();
  });
});
