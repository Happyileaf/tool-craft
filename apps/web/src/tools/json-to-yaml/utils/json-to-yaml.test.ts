import { expect, test } from 'vitest';
import { jsonToYaml } from './json-to-yaml';

test('jsonToYaml converts simple object correctly', () => {
  const input = {
    name: 'test',
    version: 1,
    enabled: true
  };
  const output = jsonToYaml(input);
  expect(output).toContain('name: test');
  expect(output).toContain('version: 1');
  expect(output).toContain('enabled: true');
});

test('jsonToYaml converts nested object correctly', () => {
  const input = {
    name: 'test',
    config: {
      debug: true,
      port: 8080
    }
  };
  const output = jsonToYaml(input);
  expect(output).toContain('config:');
  expect(output).toContain('  debug: true');
  expect(output).toContain('  port: 8080');
});

test('jsonToYaml converts array correctly', () => {
  const input = {
    items: ['one', 'two', 'three']
  };
  const output = jsonToYaml(input);
  expect(output).toContain('items:');
  expect(output).toContain('  - one');
  expect(output).toContain('  - two');
  expect(output).toContain('  - three');
});

test('jsonToYaml handles null values', () => {
  const input = {
    value: null
  };
  const output = jsonToYaml(input);
  expect(output).toContain('value: null');
});

test('jsonToYaml handles quoted strings', () => {
  const input = {
    'key-with:colon': 'value with # comment'
  };
  const output = jsonToYaml(input);
  expect(output).toContain('"value with # comment"');
});
