import { describe, expect, it } from 'vitest';
import {
  escapeLike,
  escapeMysql,
  escapeStandard,
  processBatch,
  unescapeLike,
  unescapeMysql,
  unescapeStandard,
} from './sqlEscape';

describe('SQL 标准模式（双写单引号）', () => {
  it('普通文本包裹单引号', () => {
    expect(escapeStandard('hello')).toBe("'hello'");
  });

  it("单引号双写为 ''", () => {
    expect(escapeStandard("O'Reilly")).toBe("'O''Reilly'");
  });

  it('反斜杠在标准模式下保持原样（不产生反斜杠序列）', () => {
    expect(escapeStandard('a\\b')).toBe("'a\\b'");
  });

  it('换行等控制字符在标准模式下原样保留在字面量中', () => {
    expect(escapeStandard('line1\nline2')).toBe("'line1\nline2'");
  });

  it("反转义 '' → ' 并剥去外层引号", () => {
    const result = unescapeStandard("'O''Reilly'");
    expect(result.valid).toBe(true);
    expect(result.output).toBe("O'Reilly");
  });

  it('未双写的裸单引号报未闭合错误', () => {
    const result = unescapeStandard("'O'Reilly'");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('未正确闭合');
  });

  it('缺少外层引号时报错', () => {
    const result = unescapeStandard("O''Reilly");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('外层单引号');
  });

  it('转义/反转义往返一致', () => {
    const samples = ["O'Reilly", "it's a test", 'no quotes here', "a''b"];
    for (const sample of samples) {
      expect(unescapeStandard(escapeStandard(sample)).output).toBe(sample);
    }
  });
});

describe('MySQL 反斜杠模式', () => {
  it("单引号转义为 \\' 且同时双写", () => {
    expect(escapeMysql("O'Reilly")).toBe("'O\\'Reilly'");
  });

  it('反斜杠、双引号与控制字符转义', () => {
    expect(escapeMysql('a\\b"c')).toBe('\'a\\\\b\\"c\'');
    expect(escapeMysql('line1\nline2\tend')).toBe("'line1\\nline2\\tend'");
    expect(escapeMysql('nul\0end')).toBe("'nul\\0end'");
    expect(escapeMysql('sub\x1az')).toBe("'sub\\Zz'");
  });

  it('反转义还原反斜杠序列与双写引号', () => {
    const result = unescapeMysql("'O\\'Reilly'");
    expect(result.valid).toBe(true);
    expect(result.output).toBe("O'Reilly");
    const back = unescapeMysql("'a\\\\b\\nc'");
    expect(back.output).toBe('a\\b\nc');
  });

  it('未知反斜杠序列报错', () => {
    const result = unescapeMysql("'a\\xb'");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('未知的 MySQL 转义序列');
  });

  it('末尾孤立反斜杠报未闭合', () => {
    const result = unescapeMysql("'abc\\");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('未闭合');
  });

  it('MySQL 往返一致', () => {
    const samples = ["O'Reilly", 'a\\b\nc', 'quote"end', 'tab\tzero\0z\x1a'];
    for (const sample of samples) {
      expect(unescapeMysql(escapeMysql(sample)).output).toBe(sample);
    }
  });
});

describe('LIKE 通配符转义', () => {
  it('% 与 _ 加反斜杠前缀，普通字符不变', () => {
    const { escaped, clause } = escapeLike('100% off_a\\b');
    expect(escaped).toBe('100\\% off\\_a\\\\b');
    expect(clause).toBe("LIKE '100\\% off\\_a\\\\b' ESCAPE '\\'");
  });

  it('无通配符时 clause 仍合法', () => {
    const { clause } = escapeLike('plain text');
    expect(clause).toBe("LIKE 'plain text' ESCAPE '\\'");
  });

  it('反转义引号内容还原 % _ 与反斜杠', () => {
    const result = unescapeLike("'100\\% off\\_a\\\\b'");
    expect(result.valid).toBe(true);
    expect(result.output).toBe('100% off_a\\b');
  });

  it('支持直接粘贴完整 LIKE ... ESCAPE 表达式', () => {
    const result = unescapeLike("LIKE '100\\%' ESCAPE '\\'");
    expect(result.valid).toBe(true);
    expect(result.output).toBe('100%');
  });

  it('ESCAPE 符不是反斜杠时拒绝', () => {
    const result = unescapeLike("LIKE '100!%' ESCAPE '!'");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('转义符');
  });

  it('非法 LIKE 转义序列（如 \\x）报错', () => {
    const result = unescapeLike("'a\\xb'");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('非法转义序列');
  });

  it('LIKE 往返一致', () => {
    const samples = ['100% off', 'a_b', 'back\\slash', 'mix%_\\end'];
    for (const sample of samples) {
      const { escaped } = escapeLike(sample);
      expect(unescapeLike(`'${escaped}'`).output).toBe(sample);
    }
  });
});

describe('批量与边界', () => {
  it('多行转义逐行处理并跳过空行', () => {
    const results = processBatch("O'Reilly\n\nplain", 'standard-escape');
    expect(results).toHaveLength(2);
    expect(results[0]!.output).toBe("'O''Reilly'");
    expect(results[1]!.output).toBe("'plain'");
  });

  it('批量反转义保留逐行错误，不互相影响', () => {
    const results = processBatch("'ok''s'\n'bad'x'", 'standard-unescape');
    expect(results[0]!.valid).toBe(true);
    expect(results[0]!.output).toBe("ok's");
    expect(results[1]!.valid).toBe(false);
  });

  it('空输入转义方向返回错误结果', () => {
    const results = processBatch('   ', 'like-escape');
    expect(results).toHaveLength(0);
  });
});
