import { describe, it, expect } from 'vitest';
import { yamlToJson } from './converter';

describe('yamlToJson', () => {
  it('should parse simple key-value pairs', () => {
    const yaml = `name: John
age: 30
isStudent: false
gpa: 3.5
nullValue: null
`;
    const result = yamlToJson(yaml);
    expect(JSON.parse(result)).toEqual({
      name: 'John',
      age: 30,
      isStudent: false,
      gpa: 3.5,
      nullValue: null,
    });
  });

  it('should parse nested objects', () => {
    const yaml = `person:
  name: Alice
  address:
    street: 123 Main St
    city: New York
`;
    const result = yamlToJson(yaml);
    expect(JSON.parse(result)).toEqual({
      person: {
        name: 'Alice',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    });
  });

  it('should handle quoted strings', () => {
    const yaml = `title: "Hello World"
description: 'This is a test'
`;
    const result = yamlToJson(yaml);
    expect(JSON.parse(result)).toEqual({
      title: 'Hello World',
      description: 'This is a test',
    });
  });

  it('should ignore comments', () => {
    const yaml = `# This is a comment
name: Bob # inline comment
age: 25
`;
    const result = yamlToJson(yaml);
    expect(JSON.parse(result)).toEqual({
      name: 'Bob',
      age: 25,
    });
  });

  it('should handle empty lines', () => {
    const yaml = `

name: Charlie

age: 40

`;
    const result = yamlToJson(yaml);
    expect(JSON.parse(result)).toEqual({
      name: 'Charlie',
      age: 40,
    });
  });
});
