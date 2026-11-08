import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  stringifyYaml,
  stringifyToml,
  writeFrontmatter,
  parseInlineArray,
  valueToInput,
  inputToValue,
  type FieldInput,
} from './frontmatter';

const YAML_DOC = `---
title: "Hello World"
draft: true
views: 128
rating: 4.5
empty: null
tags: [css, web, "a,b"]
---
# Body starts here

Some content.
`;

const YAML_BLOCK_ARRAY = `---
title: Post
tags:
  - alpha
  - beta
  - gamma
---
body`;

const TOML_DOC = `+++
title = "TOML Post"
draft = false
views = 42
tags = ["a", "b"]
[author]
name = "Alice"
+++
content`;

describe('parseFrontmatter — YAML', () => {
  it('detects delimiter, format and splits body untouched', () => {
    const p = parseFrontmatter(YAML_DOC);
    expect(p.format).toBe('yaml');
    expect(p.openLine).toBe(0);
    expect(p.closeLine).toBe(7);
    expect(p.body).toBe('# Body starts here\n\nSome content.\n');
    expect(p.errors).toEqual([]);
  });

  it('infers scalar types including quoted strings and null', () => {
    const p = parseFrontmatter(YAML_DOC);
    const byKey = new Map(p.fields.map((f) => [f.key, f]));
    expect(byKey.get('title')?.value).toBe('Hello World');
    expect(byKey.get('title')?.type).toBe('string');
    expect(byKey.get('draft')?.value).toBe(true);
    expect(byKey.get('views')?.value).toBe(128);
    expect(byKey.get('rating')?.value).toBe(4.5);
    expect(byKey.get('empty')?.value).toBeNull();
    expect(byKey.get('empty')?.type).toBe('null');
  });

  it('parses inline arrays while keeping commas inside quotes', () => {
    const p = parseFrontmatter(YAML_DOC);
    const tags = p.fields.find((f) => f.key === 'tags');
    expect(tags?.type).toBe('array');
    expect(tags?.value).toEqual(['css', 'web', 'a,b']);
  });

  it('parses block-style arrays across multiple lines', () => {
    const p = parseFrontmatter(YAML_BLOCK_ARRAY);
    const tags = p.fields.find((f) => f.key === 'tags');
    expect(tags?.type).toBe('array');
    expect(tags?.value).toEqual(['alpha', 'beta', 'gamma']);
    expect((tags?.lineCount ?? 0) >= 3).toBe(true);
  });

  it('parses single-level nested object with dot-path keys', () => {
    const doc = `---
title: Nested
author:
  name: Bob
---
x`;
    const p = parseFrontmatter(doc);
    expect(p.errors).toEqual([]);
    const name = p.fields.find((f) => f.key === 'author.name');
    expect(name?.value).toBe('Bob');
  });

  it('reports unclosed delimiter as an error', () => {
    const p = parseFrontmatter('---\ntitle: x\nbody');
    expect(p.format).toBe('yaml');
    expect(p.errors).toHaveLength(1);
    expect(p.errors[0]?.message).toContain('闭合定界符');
  });

  it('flags unrecognizable lines with position', () => {
    const p = parseFrontmatter('---\n!!!garbage\n---\nbody');
    expect(p.errors[0]?.line).toBe(1);
    expect(p.errors[0]?.message).toContain('无法识别');
  });

  it('returns null format and untouched body for plain markdown', () => {
    const doc = '# Just markdown\nno frontmatter';
    const p = parseFrontmatter(doc);
    expect(p.format).toBeNull();
    expect(p.fields).toEqual([]);
    expect(p.body).toBe(doc);
  });
});

describe('parseFrontmatter — TOML', () => {
  it('parses +++ delimiter, scalars, inline array and [section]', () => {
    const p = parseFrontmatter(TOML_DOC);
    expect(p.format).toBe('toml');
    expect(p.body).toBe('content');
    const byKey = new Map(p.fields.map((f) => [f.key, f]));
    expect(byKey.get('title')?.value).toBe('TOML Post');
    expect(byKey.get('draft')?.value).toBe(false);
    expect(byKey.get('views')?.value).toBe(42);
    expect(byKey.get('tags')?.value).toEqual(['a', 'b']);
    expect(byKey.get('author.name')?.value).toBe('Alice');
  });
});

describe('stringify round trips', () => {
  const fields: FieldInput[] = [
    { key: 'title', value: 'Hello: World' },
    { key: 'count', value: 3 },
    { key: 'draft', value: true },
    { key: 'tags', value: ['a', 'b'] },
    { key: 'author.name', value: 'Alice' },
  ];

  it('quotes YAML strings containing reserved chars', () => {
    const yaml = stringifyYaml(fields);
    expect(yaml.startsWith('---\n')).toBe(true);
    expect(yaml).toContain('title: "Hello: World"');
    expect(yaml).toContain('count: 3');
    expect(yaml).toContain('draft: true');
    expect(yaml).toContain('  - a');
    expect(yaml).toContain('author:');
    expect(yaml).toContain('  name: Alice');
    const reparsed = parseFrontmatter(`${yaml}\nbody`);
    expect(reparsed.errors).toEqual([]);
    expect(new Map(reparsed.fields.map((f) => [f.key, f.value])).get('title')).toBe(
      'Hello: World',
    );
  });

  it('emits TOML with top-level keys and [section]', () => {
    const toml = stringifyToml(fields);
    expect(toml.startsWith('+++\n')).toBe(true);
    expect(toml).toContain('title = "Hello: World"');
    expect(toml).toContain('tags = ["a", "b"]');
    expect(toml).toContain('[author]');
    expect(toml).toContain('name = "Alice"');
    const reparsed = parseFrontmatter(`${toml}\nbody`);
    expect(reparsed.format).toBe('toml');
    expect(reparsed.errors).toEqual([]);
  });
});

describe('writeFrontmatter', () => {
  it('replaces block while preserving body exactly', () => {
    const out = writeFrontmatter(YAML_DOC, [{ key: 'title', value: 'New' }], 'yaml');
    const reparsed = parseFrontmatter(out);
    expect(reparsed.fields).toHaveLength(1);
    expect(reparsed.fields[0]?.value).toBe('New');
    expect(reparsed.body).toBe('# Body starts here\n\nSome content.\n');
  });

  it('creates a new YAML block when none exists', () => {
    const out = writeFrontmatter('# hi', [{ key: 'title', value: 'x' }], 'yaml');
    expect(out.startsWith('---\ntitle: x\n---\n')).toBe(true);
    expect(out.endsWith('# hi')).toBe(true);
  });

  it('can convert YAML input to TOML output', () => {
    const fields: FieldInput[] = [
      { key: 'title', value: 'p' },
      { key: 'tags', value: ['x'] },
    ];
    const out = writeFrontmatter(YAML_DOC, fields, 'toml');
    expect(out.startsWith('+++')).toBe(true);
    expect(parseFrontmatter(out).format).toBe('toml');
  });
});

describe('inline array parser edge cases', () => {
  it('handles empty arrays and rejects unterminated quotes', () => {
    expect(parseInlineArray('[]')).toEqual([]);
    expect(parseInlineArray('[a, b]')).toEqual(['a', 'b']);
    expect(parseInlineArray('["unclosed, x]')).toBeNull();
  });
});

describe('UI value helpers', () => {
  it('valueToInput stringifies arrays and null', () => {
    expect(valueToInput(['a', 'b'])).toBe('a, b');
    expect(valueToInput(null)).toBe('');
    expect(valueToInput(42)).toBe('42');
  });

  it('inputToValue coerces per target type', () => {
    expect(inputToValue('1, 2,', 'array')).toEqual(['1', '2']);
    expect(inputToValue('true', 'boolean')).toBe(true);
    expect(inputToValue('false', 'boolean')).toBe(false);
    expect(inputToValue('3.5', 'number')).toBe(3.5);
    expect(inputToValue('anything', 'null')).toBeNull();
    expect(inputToValue('text', 'string')).toBe('text');
  });
});
