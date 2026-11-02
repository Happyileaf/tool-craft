import { describe, expect, it } from 'vitest';
import { generateRust, toPascalCase, toSnakeCase } from './rust-gen';

const SAMPLE = JSON.stringify(
  {
    id: 42,
    name: 'toolcraft',
    score: 9.8,
    active: true,
    nickname: null,
    'user-name': 'alice',
    firstName: 'Ada',
    type: 'admin',
    tags: ['rust', 'serde'],
    address: { city: 'Shanghai', zip: 200000 },
    items: [
      { sku: 'A-1', qty: 2, price: 1.5 },
      { sku: 'B-2', qty: 1, price: 3 },
    ],
  },
  null,
  2,
);

describe('命名工具函数', () => {
  it('snake / pascal 转换', () => {
    expect(toSnakeCase('firstName')).toBe('first_name');
    expect(toSnakeCase('user-name')).toBe('user_name');
    expect(toSnakeCase('HTTPSPort')).toBe('https_port');
    expect(toSnakeCase('123abc')).toBe('n123abc');
    expect(toPascalCase('user-name')).toBe('UserName');
    expect(toPascalCase('order_items')).toBe('OrderItems');
  });
});

describe('generateRust 固定样本', () => {
  const result = generateRust(SAMPLE, { rootName: 'ApiResponse' });

  it('包含 derive 与基础标量类型', () => {
    expect(result.code).toContain(
      '#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]',
    );
    expect(result.code).toContain('pub struct ApiResponse {');
    expect(result.code).toMatch(/pub id: i64,/);
    expect(result.code).toMatch(/pub name: String,/);
    expect(result.code).toMatch(/pub score: f64,/);
    expect(result.code).toMatch(/pub active: bool,/);
  });

  it('null 字段包裹 Option，嵌套对象生成具名 struct', () => {
    expect(result.code).toMatch(/pub nickname: Option<serde_json::Value>,/);
    expect(result.code).toContain('pub struct Address {');
    expect(result.code).toMatch(/pub city: String,/);
    expect(result.code).toMatch(/pub zip: i64,/);
  });

  it('非法键名 / 驼峰 / 关键字带 rename 与合法字段名', () => {
    expect(result.code).toContain('#[serde(rename = "user-name")]');
    expect(result.code).toContain('pub user_name: String,');
    expect(result.code).toContain('#[serde(rename = "firstName")]');
    expect(result.code).toContain('pub first_name: String,');
    expect(result.code).toContain('#[serde(rename = "type")]');
    expect(result.code).toContain('pub type_: String,');
  });

  it('同型对象数组合并为单个 Vec<Item>，且 Vec<String> 正确', () => {
    expect(result.code).toContain('pub struct Item {');
    expect(result.code).toMatch(/pub items: Vec<Item>,/);
    expect(result.code).toMatch(/pub tags: Vec<String>,/);
    // 元素的 qty 均为整数 → i64，price 混合 int/float → f64
    expect(result.code).toMatch(/pub qty: i64,/);
    expect(result.code).toMatch(/pub price: f64,/);
  });

  it('输出快照', () => {
    expect(result.code).toMatchSnapshot();
  });
});

describe('边界情况', () => {
  it('空数组 → Vec<serde_json::Value> 并告警', () => {
    const r = generateRust('{"items": []}');
    expect(r.code).toMatch(/pub items: Vec<serde_json::Value>,/);
    expect(r.warnings.some((w) => w.includes('空数组'))).toBe(true);
  });

  it('int/float 混合标量数组合并为 f64', () => {
    const r = generateRust('{"nums":[1,2.5,3]}');
    expect(r.code).toMatch(/pub nums: Vec<f64>,/);
  });

  it('异型数组回退 serde_json::Value 并告警', () => {
    const r = generateRust('{"mixed":[1,"a",true]}');
    expect(r.code).toMatch(/pub mixed: Vec<serde_json::Value>,/);
    expect(r.warnings.some((w) => w.includes('无法合并'))).toBe(true);
  });

  it('根为数组 / 标量时生成包装结构体', () => {
    const arr = generateRust('[1,2,3]');
    expect(arr.code).toContain('pub struct Root {');
    expect(arr.code).toMatch(/pub data: Vec<i64>,/);
    expect(arr.warnings[0]).toContain('根节点不是对象');

    const scalar = generateRust('"hello"');
    expect(scalar.code).toMatch(/pub data: String,/);
  });

  it('对象数组元素缺失键时标记 Option', () => {
    const r = generateRust(
      JSON.stringify({
        users: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', extra: true },
        ],
      }),
    );
    expect(r.code).toMatch(/pub extra: Option<bool>,/);
    expect(r.warnings.some((w) => w.includes('extra'))).toBe(true);
  });

  it('optionWrap=false 时不生成 Option', () => {
    const r = generateRust('{"a":null,"b":1}', { optionWrap: false });
    expect(r.code).not.toContain('Option<');
  });

  it('非法 JSON 与空输入返回友好信息，不抛异常', () => {
    const bad = generateRust('{not json}');
    expect(bad.code).toBe('');
    expect(bad.warnings[0]).toMatch(/JSON 解析失败/);
    const empty = generateRust('   ');
    expect(empty.code).toBe('');
    expect(empty.warnings[0]).toContain('输入为空');
  });

  it('重名结构体自动加序号后缀', () => {
    const r = generateRust(
      JSON.stringify({
        owner: { name: 'a', pet: { name: 'x' } },
        admin: { name: 'b', pet: { name: 'y' } },
      }),
    );
    expect(r.code).toContain('pub struct Pet {');
    expect(r.code).toContain('pub struct Pet2 {');
  });
});
