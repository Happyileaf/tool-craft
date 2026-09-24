import { describe, expect, test } from 'vitest';
import { convertCase } from './convert';
import { CaseType } from '../constants';

describe('convertCase', () => {
  test('converts to camelCase', () => {
    expect(convertCase('hello world', CaseType.CAMEL)).toBe('helloWorld');
    expect(convertCase('hello_world', CaseType.CAMEL)).toBe('helloWorld');
    expect(convertCase('Hello-World', CaseType.CAMEL)).toBe('helloWorld');
    expect(convertCase('HelloWorld', CaseType.CAMEL)).toBe('helloWorld');
  });

  test('converts to PascalCase', () => {
    expect(convertCase('hello world', CaseType.PASCAL)).toBe('HelloWorld');
    expect(convertCase('hello_world', CaseType.PASCAL)).toBe('HelloWorld');
    expect(convertCase('hello-world', CaseType.PASCAL)).toBe('HelloWorld');
  });

  test('converts to snake_case', () => {
    expect(convertCase('hello world', CaseType.SNAKE)).toBe('hello_world');
    expect(convertCase('helloWorld', CaseType.SNAKE)).toBe('hello_world');
    expect(convertCase('HelloWorld', CaseType.SNAKE)).toBe('hello_world');
  });

  test('converts to kebab-case', () => {
    expect(convertCase('hello world', CaseType.KEBAB)).toBe('hello-world');
    expect(convertCase('helloWorld', CaseType.KEBAB)).toBe('hello-world');
    expect(convertCase('HelloWorld', CaseType.KEBAB)).toBe('hello-world');
  });

  test('converts to CONSTANT_CASE', () => {
    expect(convertCase('hello world', CaseType.CONSTANT)).toBe('HELLO_WORLD');
    expect(convertCase('helloWorld', CaseType.CONSTANT)).toBe('HELLO_WORLD');
  });

  test('converts to Sentence case', () => {
    expect(convertCase('helloWorld', CaseType.SENTENCE)).toBe('hello world');
    expect(convertCase('hello_world', CaseType.SENTENCE)).toBe('hello world');
  });

  test('converts to Title Case', () => {
    expect(convertCase('hello world', CaseType.TITLE)).toBe('Hello World');
    expect(convertCase('hello_world', CaseType.TITLE)).toBe('Hello World');
    expect(convertCase('helloWorld', CaseType.TITLE)).toBe('Hello World');
  });

  test('handles multiple words', () => {
    const input = 'this is a test';
    expect(convertCase(input, CaseType.CAMEL)).toBe('thisIsATest');
    expect(convertCase(input, CaseType.PASCAL)).toBe('ThisIsATest');
    expect(convertCase(input, CaseType.SNAKE)).toBe('this_is_a_test');
    expect(convertCase(input, CaseType.KEBAB)).toBe('this-is-a-test');
    expect(convertCase(input, CaseType.CONSTANT)).toBe('THIS_IS_A_TEST');
  });

  test('handles empty input', () => {
    expect(convertCase('', CaseType.CAMEL)).toBe('');
  });
});
