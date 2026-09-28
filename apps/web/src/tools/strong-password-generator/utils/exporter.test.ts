import { describe, expect, test } from 'vitest';
import { buildCsv, buildTxt, escapeCsvCell } from './exporter';

describe('escapeCsvCell', () => {
  test('should leave plain value unchanged', () => {
    expect(escapeCsvCell('abc123')).toBe('abc123');
  });

  test('should wrap value containing comma in quotes', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
  });

  test('should double inner quotes and wrap in quotes', () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
  });

  test('should wrap value containing newline in quotes', () => {
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
  });
});

describe('buildTxt', () => {
  test('should join passwords with newline', () => {
    expect(buildTxt(['one', 'two', 'three'])).toBe('one\ntwo\nthree');
  });

  test('should return empty string for empty list', () => {
    expect(buildTxt([])).toBe('');
  });
});

describe('buildCsv', () => {
  test('should include header and indexed rows', () => {
    expect(buildCsv(['abc', 'def'])).toBe(
      'index,password\r\n1,abc\r\n2,def',
    );
  });

  test('should escape cells containing special characters', () => {
    expect(buildCsv(['a,b'])).toBe('index,password\r\n1,"a,b"');
  });

  test('should return only header for empty list', () => {
    expect(buildCsv([])).toBe('index,password');
  });
});
