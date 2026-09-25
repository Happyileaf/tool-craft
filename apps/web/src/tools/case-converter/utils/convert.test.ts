import { describe, it, expect } from 'vitest';
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toTitleCase,
  convertCase
} from './convert';

describe('case converter', () => {
  it('should convert to camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toCamelCase('hello_world')).toBe('helloWorld');
    expect(toCamelCase('hello-world')).toBe('helloWorld');
    expect(toCamelCase('HelloWorld')).toBe('helloWorld');
    expect(toCamelCase('Hello-World')).toBe('helloWorld');
  });

  it('should convert to PascalCase', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
    expect(toPascalCase('hello_world')).toBe('HelloWorld');
    expect(toPascalCase('hello-world')).toBe('HelloWorld');
    expect(toPascalCase('helloWorld')).toBe('HelloWorld');
  });

  it('should convert to snake_case', () => {
    expect(toSnakeCase('hello world')).toBe('hello_world');
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
    expect(toSnakeCase('HelloWorld')).toBe('hello_world');
    expect(toSnakeCase('hello-world')).toBe('hello_world');
  });

  it('should convert to kebab-case', () => {
    expect(toKebabCase('hello world')).toBe('hello-world');
    expect(toKebabCase('helloWorld')).toBe('hello-world');
    expect(toKebabCase('HelloWorld')).toBe('hello-world');
    expect(toKebabCase('hello_world')).toBe('hello-world');
  });

  it('should convert to CONSTANT_CASE', () => {
    expect(toConstantCase('hello world')).toBe('HELLO_WORLD');
    expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD');
    expect(toConstantCase('hello-world')).toBe('HELLO_WORLD');
  });

  it('should convert to Title Case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('hello_world')).toBe('Hello World');
    expect(toTitleCase('helloWorld')).toBe('Hello World');
  });

  it('should handle empty input', () => {
    expect(toCamelCase('')).toBe('');
    expect(toPascalCase('')).toBe('');
  });

  it('should handle multiple separators', () => {
    expect(toSnakeCase('hello   world_test-case')).toBe('hello_world_test_case');
  });
});
