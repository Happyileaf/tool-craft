import type { FrontmatterFormat } from './utils/frontmatter';

export interface FormatOption {
  value: FrontmatterFormat;
  label: string;
  fence: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'yaml', label: 'YAML（--- 围栏）', fence: '---' },
  { value: 'toml', label: 'TOML（+++ 围栏）', fence: '+++' },
];

export const DEFAULT_INPUT = `---
title: "Hello: World"
tags:
  - alpha
  - beta
  - gamma
draft: true
count: 12
nested:
  level: 2
  ratio: 0.5
---
# 正文标题

正文内容原样保留，正文中的 --- 分隔线不会被误判为围栏。
`;

export const TYPE_TAG_COLOR: Record<string, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'purple',
  null: 'default',
  object: 'orange',
  array: 'magenta',
};

export const VALUE_TYPE_LABEL: Record<string, string> = {
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  null: 'null',
  object: '对象',
  array: '数组',
};
