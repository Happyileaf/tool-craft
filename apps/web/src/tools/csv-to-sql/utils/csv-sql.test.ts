import { describe, expect, it } from 'vitest';
import {
  buildSqlInserts,
  detectDelimiter,
  parseCsv,
  quoteIdentifier,
  toSqlValue,
} from './csv-sql';

describe('parseCsv', () => {
  it('首行作为列名，其余为数据行', () => {
    const table = parseCsv('id,name\n1,Alice\n2,Bob');
    expect(table.headers).toEqual(['id', 'name']);
    expect(table.rows).toEqual([
      ['1', 'Alice'],
      ['2', 'Bob'],
    ]);
  });

  it('支持 CRLF、首尾空白行与 BOM', () => {
    const table = parseCsv('﻿id,name\r\n1,Alice\r\n\r\n');
    expect(table.headers).toEqual(['id', 'name']);
    expect(table.rows).toEqual([['1', 'Alice']]);
  });

  it('字段内逗号、换行与双引号转义', () => {
    const table = parseCsv('id,note\n1,"hello, ""world"""\n2,"line1\nline2"');
    expect(table.rows[0]).toEqual(['1', 'hello, "world"']);
    expect(table.rows[1]).toEqual(['2', 'line1\nline2']);
  });

  it('自动探测分号、制表符与竖线分隔符', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
    expect(detectDelimiter('a|b|c\n1|2|3')).toBe('|');
    const table = parseCsv('a;b;c\n1;2;3', 'auto');
    expect(table.headers).toEqual(['a', 'b', 'c']);
  });

  it('空文本与未闭合引号报错', () => {
    expect(() => parseCsv('')).toThrow('为空');
    expect(() => parseCsv('   \n  ')).toThrow('为空');
    expect(() => parseCsv('a,b\n1,"unclosed')).toThrow('未闭合');
  });
});

describe('quoteIdentifier', () => {
  it('三种引号风格与内部引号转义', () => {
    expect(quoteIdentifier('user')).toBe('`user`');
    expect(quoteIdentifier('na`me', 'backtick')).toBe('`na``me`');
    expect(quoteIdentifier('user', 'double')).toBe('"user"');
    expect(quoteIdentifier('na"me', 'double')).toBe('"na""me"');
    expect(quoteIdentifier('user', 'bracket')).toBe('[user]');
    expect(quoteIdentifier('na]me', 'bracket')).toBe('[na]]me]');
  });
});

describe('toSqlValue', () => {
  it('空单元格默认转 NULL，可切换为空字符串', () => {
    expect(toSqlValue('')).toBe('NULL');
    expect(toSqlValue('', 'empty-to-string')).toBe("''");
  });

  it('NULL 字样识别，单引号转义', () => {
    expect(toSqlValue('NULL')).toBe('NULL');
    expect(toSqlValue('  null ', 'empty-to-null', true)).toBe('NULL');
    expect(toSqlValue('NULL', 'empty-to-null', false)).toBe("'NULL'");
    expect(toSqlValue("O'Brien")).toBe("'O''Brien'");
  });
});

describe('buildSqlInserts', () => {
  const baseTable = parseCsv("id,name,score\n1,Alice,90\n2,Bob,\n3,O'Brien,NULL");

  it('默认反引号风格、空值转 NULL', () => {
    const sql = buildSqlInserts(baseTable, { table: 'users' });
    expect(sql).toBe(
      [
        'INSERT INTO `users` (`id`, `name`, `score`) VALUES',
        "  (1, 'Alice', 90),",
        "  (2, 'Bob', NULL),",
        "  (3, 'O''Brien', NULL);",
      ].join('\n'),
    );
  });

  it('双引号标识符 + 每 2 行一批', () => {
    const sql = buildSqlInserts(baseTable, { table: 'users', quote: 'double', batchSize: 2 });
    expect(sql).toBe(
      [
        'INSERT INTO "users" ("id", "name", "score") VALUES',
        "  (1, 'Alice', 90),",
        "  (2, 'Bob', NULL);",
        'INSERT INTO "users" ("id", "name", "score") VALUES',
        "  (3, 'O''Brien', NULL);",
      ].join('\n'),
    );
  });

  it('空单元格按空字符串插入', () => {
    const sql = buildSqlInserts(baseTable, { table: 't', nullMode: 'empty-to-string' });
    expect(sql).toContain("(2, 'Bob', '')");
  });

  it('自定义列名（子集截取）与校验错误', () => {
    const sql = buildSqlInserts(baseTable, { table: 't', columns: ['id', 'name'] });
    expect(sql).toContain('(`id`, `name`)');
    expect(sql).toContain("(1, 'Alice')");
    expect(() => buildSqlInserts(baseTable, { table: '' })).toThrow('表名');
    expect(() => buildSqlInserts(baseTable, { table: 't', columns: ['a', ''] })).toThrow('列名');
  });

  it('列数不匹配报错', () => {
    const ragged = parseCsv('a,b\n1,2\n3');
    expect(() => buildSqlInserts(ragged, { table: 't' })).toThrow('列数不匹配');
  });
});
