import type { FieldType } from './utils/frontmatter';

export const DEFAULT_MARKDOWN = `---
title: "My First Post"
date: 2026-11-09
draft: false
tags: [guide, web]
author:
  name: Alice
---
# My First Post

Write your content here. The frontmatter block above is parsed into
editable fields, while this body is preserved byte-for-byte.
`;

export const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'null', label: '空值 null' },
  { value: 'array', label: '数组（逗号分隔）' },
];

export const FORMAT_OPTIONS = [
  { value: 'yaml' as const, label: 'YAML（--- 定界）' },
  { value: 'toml' as const, label: 'TOML（+++ 定界）' },
];
