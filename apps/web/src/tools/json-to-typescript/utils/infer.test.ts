import { describe, it, expect } from 'vitest';
import { jsonToTypeScript } from './infer';

describe('jsonToTypeScript', () => {
  it('输入为空或纯空白时返回空串', () => {
    expect(jsonToTypeScript('')).toBe('');
    expect(jsonToTypeScript('   \n ')).toBe('');
  });

  it('非法 JSON 抛出可读错误', () => {
    expect(() => jsonToTypeScript('{ bad json')).toThrowError(/JSON 解析失败/);
  });

  it('把根对象生成为 export interface Root 并推断字段类型', () => {
    const code = jsonToTypeScript('{"name":"a","age":1,"ok":true}');
    expect(code).toContain('export interface Root {');
    expect(code).toContain('name: string;');
    expect(code).toContain('age: number;');
    expect(code).toContain('ok: boolean;');
  });

  it('整数与浮点都推断为 number', () => {
    const code = jsonToTypeScript('{"count":3,"ratio":1.5}');
    expect(code).toContain('count: number;');
    expect(code).toContain('ratio: number;');
  });

  it('null 值推断为 null 类型', () => {
    const code = jsonToTypeScript('{"metadata":null}');
    expect(code).toContain('metadata: null;');
  });

  it('嵌套对象生成独立 interface 且引用正确', () => {
    const code = jsonToTypeScript('{"user":{"id":1,"name":"x"}}');
    expect(code).toContain('export interface Root {');
    expect(code).toContain('user: RootUser;');
    expect(code).toContain('interface RootUser {');
    expect(code).toContain('id: number;');
    expect(code).toContain('name: string;');
  });

  it('数字数组推断为 number[]', () => {
    const code = jsonToTypeScript('{"nums":[1,2,3]}');
    expect(code).toContain('nums: number[];');
  });

  it('混合数组推断为联合类型数组', () => {
    const code = jsonToTypeScript('{"mixed":[1,"a"]}');
    expect(code).toContain('mixed: (string | number)[];');
  });

  it('空数组推断为 unknown[]', () => {
    const code = jsonToTypeScript('{"empty":[]}');
    expect(code).toContain('empty: unknown[];');
  });

  it('对象数组元素合并为单个 interface 并标记可选键', () => {
    const code = jsonToTypeScript('{"items":[{"a":1},{"a":2,"b":"x"}]}');
    expect(code).toContain('items: RootItems[];');
    expect(code).toContain('interface RootItems {');
    expect(code).toContain('a: number;');
    expect(code).toContain('b?: string;');
  });

  it('键名含特殊字符时输出带双引号的键', () => {
    const code = jsonToTypeScript('{"first-name":"a"}');
    expect(code).toContain('"first-name": string;');
  });

  it('重名时按父类型名 + PascalCase(属性名) 命名并追加数字后缀', () => {
    const code = jsonToTypeScript('{"user":{"a":1},"User":{"b":2}}');
    expect(code).toContain('interface RootUser {');
    expect(code).toContain('interface RootUser2 {');
    expect(code).toContain('user: RootUser;');
    expect(code).toContain('User: RootUser2;');
  });

  it('支持自定义根类型名与缩进', () => {
    const code = jsonToTypeScript('{"a":1}', { rootName: 'Config', indent: 4 });
    expect(code).toBe('export interface Config {\n    a: number;\n}');
  });

  it('可通过 exportRoot 关闭 export 前缀', () => {
    const code = jsonToTypeScript('{"a":1}', { exportRoot: false });
    expect(code).toBe('interface Root {\n  a: number;\n}');
  });

  it('默认输出格式确定（两个空格缩进、行末分号）', () => {
    expect(jsonToTypeScript('{"a":1}')).toBe('export interface Root {\n  a: number;\n}');
  });

  it('根类型名非法时抛出错误', () => {
    expect(() => jsonToTypeScript('{"a":1}', { rootName: '1bad' })).toThrowError(
      /根类型名/,
    );
  });
});
