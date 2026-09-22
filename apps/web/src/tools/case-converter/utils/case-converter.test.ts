import { expect, test } from 'vitest';
import { toCamelCase, toSnakeCase, toKebabCase, toPascalCase, convertCase } from './case-converter';

test('toCamelCase converts correctly', () => {
  expect(toCamelCase('hello_world')).toBe('helloWorld');
  expect(toCamelCase('hello-world')).toBe('helloWorld');
  expect(toCamelCase('HelloWorld')).toBe('helloWorld');
  expect(toCamelCase('hello world')).toBe('helloWorld');
});

test('toSnakeCase converts correctly', () => {
  expect(toSnakeCase('helloWorld')).toBe('hello_world');
  expect(toSnakeCase('hello-world')).toBe('hello_world');
  expect(toSnakeCase('HelloWorld')).toBe('hello_world');
  expect(toSnakeCase('hello world')).toBe('hello_world');
});

test('toKebabCase converts correctly', () => {
  expect(toKebabCase('helloWorld')).toBe('hello-world');
  expect(toKebabCase('hello_world')).toBe('hello-world');
  expect(toKebabCase('HelloWorld')).toBe('hello-world');
  expect(toKebabCase('hello world')).toBe('hello-world');
});

test('toPascalCase converts correctly', () => {
  expect(toPascalCase('hello_world')).toBe('HelloWorld');
  expect(toPascalCase('hello-world')).toBe('HelloWorld');
  expect(toPascalCase('helloWorld')).toBe('HelloWorld');
  expect(toPascalCase('hello world')).toBe('HelloWorld');
});

test('convertCase handles different formats', () => {
  const input = 'hello world 123';
  expect(convertCase(input, 'camel')).toBe('helloWorld123');
  expect(convertCase(input, 'snake')).toBe('hello_world_123');
  expect(convertCase(input, 'kebab')).toBe('hello-world-123');
  expect(convertCase(input, 'pascal')).toBe('HelloWorld123');
});

test('handles empty string', () => {
  expect(toCamelCase('')).toBe('');
  expect(toSnakeCase('')).toBe('');
  expect(toKebabCase('')).toBe('');
  expect(toPascalCase('')).toBe('');
});
