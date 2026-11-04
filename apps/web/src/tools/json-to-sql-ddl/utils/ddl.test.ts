import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DDL_OPTIONS,
  generateDdl,
  inferColumns,
  jsonToDdl,
  mapColumnType,
  mergeKinds,
  parseJsonRecords,
  quoteIdentifier,
  resolveVarcharLength,
  toColumnName,
  toSnakeCase,
  type DdlOptions,
} from './ddl';

/** 固定样本：覆盖布尔、整数、大整数、浮点、字符串与嵌套对象 */
const SAMPLE_JSON = JSON.stringify(
  [
    {
      userId: 1,
      userName: 'alice',
      isActive: true,
      balance: 12.5,
      profile: { city: 'Hangzhou', tags: ['a', 'b'] },
      order: 'first',
    },
    {
      userId: 2147483648,
      userName: 'bob-with-a-long-name',
      isActive: false,
      balance: 0,
      profile: { city: 'Beijing' },
      order: 'second',
    },
  ],
  null,
  2,
);

describe('toSnakeCase / toColumnName', () => {
  it('驼峰、连字符、空白与缩写转换', () => {
    expect(toSnakeCase('userId')).toBe('user_id');
    expect(toSnakeCase('HTTPSConnection')).toBe('https_connection');
    expect(toSnakeCase('created-at')).toBe('created_at');
    expect(toSnakeCase('Foo Bar.Baz')).toBe('foo_bar_baz');
    expect(toSnakeCase('already_snake')).toBe('already_snake');
  });

  it('保留首尾下划线并处理空名', () => {
    expect(toSnakeCase('_privateField')).toBe('_private_field');
    expect(toSnakeCase('trailing_')).toBe('trailing_');
    expect(toColumnName('', true)).toBe('column');
  });

  it('保留字自动加后缀', () => {
    expect(toColumnName('order', true)).toBe('order_');
    expect(toColumnName('userId', false)).toBe('userId');
  });
});

describe('quoteIdentifier / mapColumnType / resolveVarcharLength', () => {
  it('方言引号正确', () => {
    expect(quoteIdentifier('a b', 'mysql')).toBe('`a b`');
    expect(quoteIdentifier('a"b', 'postgresql')).toBe('"a""b"');
  });

  it('三方言类型映射', () => {
    expect(mapColumnType('boolean', null, 'mysql')).toBe('TINYINT(1)');
    expect(mapColumnType('boolean', null, 'postgresql')).toBe('BOOLEAN');
    expect(mapColumnType('boolean', null, 'sqlite')).toBe('BOOLEAN');
    expect(mapColumnType('double', null, 'mysql')).toBe('DOUBLE');
    expect(mapColumnType('double', null, 'postgresql')).toBe('DOUBLE PRECISION');
    expect(mapColumnType('double', null, 'sqlite')).toBe('REAL');
    expect(mapColumnType('varchar', 32, 'mysql')).toBe('VARCHAR(32)');
    expect(mapColumnType('varchar', 32, 'sqlite')).toBe('TEXT');
    expect(mapColumnType('json', null, 'mysql')).toBe('JSON');
    expect(mapColumnType('json', null, 'postgresql')).toBe('JSONB');
    expect(mapColumnType('json', null, 'sqlite')).toBe('TEXT');
  });

  it('VARCHAR 长度余量与下限', () => {
    expect(resolveVarcharLength(10, true)).toBe(15);
    expect(resolveVarcharLength(2, true)).toBe(8);
    expect(resolveVarcharLength(10, false)).toBe(10);
  });
});

describe('mergeKinds', () => {
  it('数值类型按宽度合并', () => {
    expect(mergeKinds('integer', 'bigint')).toBe('bigint');
    expect(mergeKinds('bigint', 'double')).toBe('double');
    expect(mergeKinds('boolean', 'integer')).toBe('integer');
  });

  it('unknown 透传、json 优先、数值与字符串退化为 varchar', () => {
    expect(mergeKinds('unknown', 'integer')).toBe('integer');
    expect(mergeKinds('varchar', 'unknown')).toBe('varchar');
    expect(mergeKinds('varchar', 'json')).toBe('json');
    expect(mergeKinds('integer', 'varchar')).toBe('varchar');
    expect(mergeKinds('varchar', 'text')).toBe('text');
  });
});

describe('parseJsonRecords', () => {
  it('单对象自动包装、数组直传', () => {
    expect(parseJsonRecords('{"a":1}')).toHaveLength(1);
    expect(parseJsonRecords('[{"a":1},{"a":2}]')).toHaveLength(2);
  });

  it('非法 JSON 给出行号级错误', () => {
    expect(() => parseJsonRecords('{\n  "a": 1,\n}')).toThrowError(/第 3 行/);
    expect(() => parseJsonRecords('')).toThrowError(/请输入/);
    expect(() => parseJsonRecords('[1, 2]')).toThrowError(/每个元素都必须是 JSON 对象/);
    expect(() => parseJsonRecords('"hello"')).toThrowError(/顶层 JSON/);
  });
});

describe('inferColumns 综合推断', () => {
  const options: DdlOptions = { ...DEFAULT_DDL_OPTIONS };
  const columns = inferColumns(parseJsonRecords(SAMPLE_JSON), true, 500, true);
  const byName = new Map(columns.map((column) => [column.sourceName, column]));

  it('字段顺序与类型推断正确', () => {
    expect(columns.map((column) => column.sourceName)).toEqual([
      'userId',
      'userName',
      'isActive',
      'balance',
      'profile',
      'order',
    ]);
    expect(byName.get('isActive')?.kind).toBe('boolean');
    expect(byName.get('profile')?.kind).toBe('json');
    expect(byName.get('order')?.columnName).toBe('order_');
  });

  it('整数按值域升级 BIGINT', () => {
    expect(byName.get('userId')?.kind).toBe('bigint');
  });

  it('VARCHAR 取最大长度并预留余量', () => {
    const userName = byName.get('userName');
    expect(userName?.kind).toBe('varchar');
    // 最长样本 'bob-with-a-long-name' 长度 20，×1.5 向上取整 = 30
    expect(userName?.maxLength).toBe(30);
  });

  it('null 与缺失混合：NOT NULL 仅在全部样本非空时成立', () => {
    const mixed = inferColumns(
      parseJsonRecords(
        JSON.stringify([
          { a: 1, b: 'x' },
          { a: null, b: 'y', c: true },
          { b: null },
        ]),
      ),
      true,
      null,
      true,
    );
    const map = new Map(mixed.map((column) => [column.sourceName, column]));
    expect(map.get('a')?.notNull).toBe(false);
    expect(map.get('b')?.notNull).toBe(false);
    expect(map.get('c')?.notNull).toBe(false);
    expect(map.get('c')?.kind).toBe('boolean');
  });

  it('全 null 字段回退占位且允许为空', () => {
    const cols = inferColumns(parseJsonRecords('[{"x":null},{"x":null}]'), true, null, true);
    expect(cols[0]?.kind).toBe('text');
    expect(cols[0]?.notNull).toBe(false);
  });

  it('全部非空时生成 NOT NULL', () => {
    const cols = inferColumns(parseJsonRecords('[{"a":1},{"a":2}]'), true, null, true);
    expect(cols[0]?.notNull).toBe(true);
  });

  it('超阈值字符串退化为 TEXT', () => {
    const longText = 'x'.repeat(600);
    const cols = inferColumns(
      parseJsonRecords(JSON.stringify([{ note: longText }])),
      true,
      500,
      true,
    );
    expect(cols[0]?.kind).toBe('text');
    expect(cols[0]?.maxLength).toBeNull();
  });

  it('空数组与非对象元素报错', () => {
    expect(() => inferColumns([], true, null, true)).toThrowError(/没有可推断/);
    expect(() =>
      inferColumns(parseJsonRecords('[{"a":1}, "nope"]'), true, null, true),
    ).toThrowError(/每个元素都必须是 JSON 对象/);
  });

  it('数值与字符串混合退化为 varchar', () => {
    const cols = inferColumns(
      parseJsonRecords('[{"v":1},{"v":"two"}]'),
      true,
      null,
      false,
    );
    expect(cols[0]?.kind).toBe('varchar');
    expect(cols[0]?.maxLength).toBe(3);
  });

  void options;
});

describe('generateDdl 三方言固定输出', () => {
  const columns = inferColumns(parseJsonRecords(SAMPLE_JSON), true, 500, true);

  it('MySQL：TINYINT(1)、AUTO_INCREMENT、反引号与行内 COMMENT', () => {
    const ddl = generateDdl(columns, {
      ...DEFAULT_DDL_OPTIONS,
      dialect: 'mysql',
      tableName: 'appUser',
      dropTable: true,
      ifNotExists: true,
    });
    expect(ddl).toContain('DROP TABLE IF EXISTS `app_user`;');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS `app_user` (');
    expect(ddl).toContain('`id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY');
    expect(ddl).toContain('TINYINT(1) NOT NULL');
    expect(ddl).toContain('BIGINT NOT NULL');
    expect(ddl).toContain('VARCHAR(30) NOT NULL');
    expect(ddl).toContain('JSON NOT NULL');
    expect(ddl).toContain("COMMENT 'userId'");
    expect(ddl.endsWith(');')).toBe(true);
  });

  it('PostgreSQL：SERIAL、JSONB、BOOLEAN 与独立 COMMENT 语句', () => {
    const ddl = generateDdl(columns, {
      ...DEFAULT_DDL_OPTIONS,
      dialect: 'postgresql',
      tableName: 'app_user',
      withComments: true,
    });
    expect(ddl).toContain('"id" SERIAL PRIMARY KEY');
    expect(ddl).toContain('BOOLEAN NOT NULL');
    expect(ddl).toContain('JSONB NOT NULL');
    expect(ddl).toContain('DOUBLE PRECISION NOT NULL');
    expect(ddl).toContain("COMMENT ON COLUMN \"app_user\".\"user_id\" IS 'userId';");
    expect(ddl).not.toContain('DROP TABLE');
  });

  it('SQLite：INTEGER PRIMARY KEY AUTOINCREMENT、REAL、TEXT 且无 COMMENT', () => {
    const ddl = generateDdl(columns, {
      ...DEFAULT_DDL_OPTIONS,
      dialect: 'sqlite',
      tableName: 'app_user',
      withComments: true,
    });
    expect(ddl).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(ddl).toContain('REAL NOT NULL');
    expect(ddl).not.toContain('COMMENT');
    expect(ddl).not.toContain('VARCHAR');
  });

  it('可空列不带 NOT NULL；关闭主键后无 id 列且末行无逗号', () => {
    const nullable = inferColumns(
      parseJsonRecords('[{"a":1},{"a":null}]'),
      true,
      null,
      true,
    );
    const ddl = generateDdl(nullable, {
      ...DEFAULT_DDL_OPTIONS,
      dialect: 'mysql',
      withPrimaryKey: false,
      withComments: false,
    });
    expect(ddl).toContain('`a` INTEGER\n);');
    expect(ddl).not.toContain('NOT NULL');
    expect(ddl).not.toContain('`id`');
  });

  it('关闭 snake_case 时保留原始列名', () => {
    const ddl = generateDdl(
      inferColumns(parseJsonRecords(SAMPLE_JSON), false, 500, true),
      { ...DEFAULT_DDL_OPTIONS, dialect: 'mysql', withComments: false },
    );
    expect(ddl).toContain('`userId`');
    expect(ddl).not.toContain('`user_id`');
  });
});

describe('jsonToDdl 端到端', () => {
  it('默认选项产出完整可执行 DDL', () => {
    const ddl = jsonToDdl(SAMPLE_JSON, { ...DEFAULT_DDL_OPTIONS, tableName: 'orders' });
    expect(ddl).toContain('CREATE TABLE `orders` (');
    expect(ddl).toContain('PRIMARY KEY');
    expect(ddl.split('\n').length).toBeGreaterThan(5);
  });
});
