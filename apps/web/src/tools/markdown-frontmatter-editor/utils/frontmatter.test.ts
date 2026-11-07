import { describe, expect, it } from 'vitest';
import {
  buildDocument,
  parseFrontmatter,
  parseTomlSimple,
  parseYamlSimple,
  splitFrontmatter,
  stringifyToml,
  stringifyYaml,
} from './frontmatter';

const YAML_DOC = `---
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

正文里的 --- 分隔线不应被误判。
`;

const TOML_DOC = `+++
title = "TOML 标题"
count = 7
tags = ["a", "b"]
[author]
name = "张三"
active = true
+++
正文内容`;

describe('splitFrontmatter', () => {
  it('YAML 围栏切分，body 保留原样', () => {
    const result = splitFrontmatter(YAML_DOC);
    expect(result.format).toBe('yaml');
    expect(result.startLine).toBe(1);
    expect(result.body.startsWith('# 正文标题')).toBe(true);
    expect(result.raw).toContain('tags:');
  });

  it('TOML +++ 围栏识别', () => {
    const result = splitFrontmatter(TOML_DOC);
    expect(result.format).toBe('toml');
    expect(result.body).toBe('正文内容');
  });

  it('无围栏返回 null，正文中部 --- 不被误判', () => {
    const doc = '# 标题\n\n正文\n---\n更多正文';
    const result = splitFrontmatter(doc);
    expect(result.format).toBeNull();
    expect(result.raw).toBe('');
    expect(result.body).toBe(doc);
  });

  it('CRLF 与 BOM 归一化', () => {
    const result = splitFrontmatter('\uFEFF---\r\na: 1\r\n---\r\nbody');
    expect(result.format).toBe('yaml');
    expect(result.raw).toBe('a: 1');
    expect(result.body).toBe('body');
  });
});

describe('parseYamlSimple', () => {
  it('标量类型、序列与两级 map 逐字段正确', () => {
    const split = splitFrontmatter(YAML_DOC);
    const parsed = parseYamlSimple(split.raw);
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.data.title).toBe('Hello: World');
    expect(parsed.data.tags).toEqual(['alpha', 'beta', 'gamma']);
    expect(parsed.data.draft).toBe(true);
    expect(parsed.data.count).toBe(12);
    expect(parsed.data.nested).toEqual({ level: 2, ratio: 0.5 });
  });

  it('超子集流式语法产生 unsupported 告警而非错解', () => {
    const parsed = parseYamlSimple('coords: [1, 2]\nobj: {"a": 1}');
    expect(parsed.data.coords).toBeUndefined();
    expect(parsed.issues.filter((i) => i.level === 'warning')).toHaveLength(2);
  });

  it('重复键告警且后值覆盖', () => {
    const parsed = parseYamlSimple('a: 1\na: 2');
    expect(parsed.data.a).toBe(2);
    expect(parsed.issues.some((i) => i.message.includes('重复'))).toBe(true);
  });

  it('整行注释与空行跳过；行内 # 按普通字符串保留（子集不剥离行内注释）', () => {
    const parsed = parseYamlSimple('# 整行注释\n\nkey: value');
    expect(parsed.data.key).toBe('value');
    const inline = parseYamlSimple('key: value # 行内说明');
    expect(inline.data.key).toBe('value # 行内说明');
  });
});

describe('parseTomlSimple', () => {
  it('section、标量与数组解析', () => {
    const split = splitFrontmatter(TOML_DOC);
    const parsed = parseTomlSimple(split.raw);
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.data.title).toBe('TOML 标题');
    expect(parsed.data.count).toBe(7);
    expect(parsed.data.tags).toEqual(['a', 'b']);
    expect(parsed.data.author).toEqual({ name: '张三', active: true });
  });

  it('嵌套表名超子集告警', () => {
    const parsed = parseTomlSimple('[a.b]\nx = 1');
    expect(parsed.issues.some((i) => i.message.includes('子集'))).toBe(true);
  });
});

describe('stringify 往返', () => {
  it('YAML parse → stringify → parse 深度相等，特殊字符自动加引号', () => {
    const first = parseFrontmatter('yaml', splitFrontmatter(YAML_DOC).raw);
    const text = stringifyYaml(first.data);
    expect(text).toContain('title: "Hello: World"');
    const second = parseYamlSimple(text);
    expect(second.data).toEqual(first.data);
  });

  it('TOML parse → stringify → parse 深度相等', () => {
    const first = parseFrontmatter('toml', splitFrontmatter(TOML_DOC).raw);
    const text = stringifyToml(first.data);
    const second = parseTomlSimple(text);
    expect(second.data).toEqual(first.data);
  });

  it('buildDocument 重组完整文档', () => {
    const doc = buildDocument('yaml', 'a: 1', '正文');
    expect(doc).toBe('---\na: 1\n---\n正文');
    const again = splitFrontmatter(doc);
    expect(again.format).toBe('yaml');
    expect(again.body).toBe('正文');
  });
});
