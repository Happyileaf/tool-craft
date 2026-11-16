import { describe, it, expect } from 'vitest';
import { AUTO_DETECT, type PlaceholderStyle } from '../constants';
import { convertPlaceholders, detectStyle, scanSql } from './sql';

const convert = (
  sql: string,
  source: PlaceholderStyle | 'auto',
  target: PlaceholderStyle,
  prefix = 'p',
) => convertPlaceholders(sql, source, target, prefix);

describe('验收向量：位置式 ? ↔ 编号式', () => {
  it('? 转 $n：a = $1 AND b = $2，参数 2 项各绑定 1 次', () => {
    const r = convert('SELECT * FROM t WHERE a = ? AND b = ?', 'question', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = $1 AND b = $2');
    expect(r.params).toHaveLength(2);
    expect(r.params.map((p) => p.bindings)).toEqual([1, 1]);
    expect(r.totalBindings).toBe(2);
  });

  it('$1/$2/$1 转 ?：三个 ?，绑定顺序 1,2,1，去重参数 2 项', () => {
    const r = convert(
      'SELECT * FROM t WHERE a = $1 AND b = $2 AND c = $1',
      'dollar-number',
      'question',
    );
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = ? AND b = ? AND c = ?');
    expect(r.params).toHaveLength(2);
    expect(r.params[0]!.bindings).toBe(2);
    expect(r.params[1]!.bindings).toBe(1);
  });
});

describe('验收向量：命名式 :name 转换', () => {
  const named = 'SELECT * FROM t WHERE a = :id AND b = :name AND c = :id';

  it(':name 转 $n：$1 / $2 / $1，去重参数 id、name', () => {
    const r = convert(named, 'colon-name', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = $1 AND b = $2 AND c = $1');
    expect(r.params.map((p) => p.name)).toEqual(['id', 'name']);
    expect(r.params.map((p) => p.bindings)).toEqual([2, 1]);
  });

  it(':name 转 ?：三个 ?，绑定次数 id×2、name×1', () => {
    const r = convert(named, 'colon-name', 'question');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = ? AND b = ? AND c = ?');
    expect(r.totalBindings).toBe(3);
    expect(r.params.map((p) => [p.name, p.bindings])).toEqual([
      ['id', 2],
      ['name', 1],
    ]);
  });
});

describe('验收向量：位置式 → 命名式', () => {
  const positional = 'SELECT * FROM t WHERE a = ? AND b = ?';

  it('? 转 :name（前缀 p）：:p1、:p2', () => {
    const r = convert(positional, 'question', 'colon-name');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = :p1 AND b = :p2');
  });

  it('? 转 %(name)s：%(p1)s、%(p2)s', () => {
    const r = convert(positional, 'question', 'py-named');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('SELECT * FROM t WHERE a = %(p1)s AND b = %(p2)s');
  });

  it('自定义前缀 x：? 转 {{name}} 得到 {{x1}}、{{x2}}', () => {
    const r = convert(positional, 'question', 'double-brace', 'x');
    expect(r.sql).toBe('SELECT * FROM t WHERE a = {{x1}} AND b = {{x2}}');
  });
});

describe('验收向量：@pN 与 %s', () => {
  it('@p1 / @p2 转 :name：:p1 / :p2', () => {
    const r = convert('WHERE a = @p1 AND b = @p2', 'at-p-number', 'colon-name');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('WHERE a = :p1 AND b = :p2');
  });

  it('%s 转 $n：按顺序 $1 / $2', () => {
    const r = convert('INSERT INTO t VALUES (%s, %s)', 'percent-s', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('INSERT INTO t VALUES ($1, $2)');
  });
});

describe('验收向量：双花括号与 Python 命名式', () => {
  it('{{{a}}} 转 ?：匹配 {{ 起首个闭合 }}，名称 {a 非法时报错并给偏移', () => {
    const r = convert('{{{a}}}', 'double-brace', 'question');
    expect(r.error).toMatch(/不合法/);
    expect(r.errorOffset).toBe(0);
  });

  it('普通 {{name}} 正常转换，外层花括号文本原样保留', () => {
    const r = convert('x={{a}};', 'double-brace', 'question');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('x=?;');
  });

  it('两个相邻 {{name}} 占位符分别转换', () => {
    const r = convert('{{a}}{{b}}', 'double-brace', 'question');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('??');
    expect(r.params.map((p) => p.name)).toEqual(['a', 'b']);
  });

  it('%(a)s 与 %(b)s 转 $n：$1 / $2', () => {
    const r = convert('WHERE x = %(a)s AND y = %(b)s', 'py-named', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('WHERE x = $1 AND y = $2');
  });

  it('命名式互转保留原名：:id 转 @name 得 @id，同名复用同号', () => {
    const r = convert('WHERE a = :id OR b = :id', 'colon-name', 'at-name');
    expect(r.sql).toBe('WHERE a = @id OR b = @id');
    expect(r.params).toHaveLength(1);
    expect(r.params[0]!.bindings).toBe(2);
  });
});

describe('验收向量：跳过字符串、标识符、注释与美元引用', () => {
  const sql =
    "SELECT '?' AS q, \"?\" AS c, `?` AS b, $$?$$ AS d /* ? */ -- ?\nFROM t WHERE id = ?";

  it('仅末尾 ? 被转换为 $1，其余原样保留', () => {
    const r = convert(sql, 'question', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toContain("'?' AS q");
    expect(r.sql).toContain('"?" AS c');
    expect(r.sql).toContain('`?` AS b');
    expect(r.sql).toContain('$$?$$ AS d');
    expect(r.sql).toContain('/* ? */');
    expect(r.sql).toContain('-- ?');
    expect(r.sql.endsWith('WHERE id = $1')).toBe(true);
    expect(r.totalBindings).toBe(1);
  });

  it('带 tag 的美元引用 $tag$...$tag$ 同样跳过', () => {
    const r = convert("SELECT $tag$?$tag$ AS x WHERE y = ?", 'question', 'dollar-number');
    expect(r.sql).toBe("SELECT $tag$?$tag$ AS x WHERE y = $1");
  });

  it("单引号内 %(x)s 与 %s 不改写", () => {
    const r = convert("SELECT '%(x)s', '%s' WHERE id = %s", 'percent-s', 'dollar-number');
    expect(r.sql).toBe("SELECT '%(x)s', '%s' WHERE id = $1");
  });

  it('单引号双写转义与反斜杠转义不影响跳过区域', () => {
    const r = convert("SELECT 'it''s ?', 'a\\'?b' WHERE id = ?", 'question', 'dollar-number');
    expect(r.sql).toBe("SELECT 'it''s ?', 'a\\'?b' WHERE id = $1");
  });

  it('方括号标识符 [col?] 跳过', () => {
    const r = convert('SELECT [col?] FROM t WHERE id = ?', 'question', 'percent-s');
    expect(r.sql).toBe('SELECT [col?] FROM t WHERE id = %s');
  });
});

describe('验收向量：错误与自动识别', () => {
  it('混合风格自动识别报错并列出风格', () => {
    const r = convert('WHERE a = ? AND b = :name', AUTO_DETECT, 'dollar-number');
    expect(r.error).toMatch(/多种占位符风格/);
  });

  it('SELECT $2 编号错误（不从 1 开始）', () => {
    const r = convert('SELECT $2', 'dollar-number', 'question');
    expect(r.error).toMatch(/从 1 开始/);
  });

  it('$1, $3 跳号报错；$0 报错', () => {
    expect(convert('SELECT $1, $3', 'dollar-number', 'question').error).toMatch(/连续/);
    expect(convert('SELECT $0', 'dollar-number', 'question').error).toMatch(/序号 0/);
  });

  it('未闭合单引号、块注释、美元引用返回带偏移的错误', () => {
    const r1 = convert("SELECT 'abc", 'question', 'dollar-number');
    expect(r1.error).toMatch(/未闭合/);
    expect(r1.errorOffset).toBe(7);
    const r2 = convert('SELECT /* x', 'question', 'dollar-number');
    expect(r2.error).toMatch(/块注释/);
    expect(r2.errorOffset).toBe(7);
    const r3 = convert('SELECT $tag$ x', 'question', 'dollar-number');
    expect(r3.error).toMatch(/美元引用/);
    expect(r3.errorOffset).toBe(7);
  });

  it('自动识别正确判定单一风格', () => {
    expect(detectStyle('SELECT :id, :name').style).toBe('colon-name');
    expect(detectStyle('SELECT ?').style).toBe('question');
    expect(detectStyle('SELECT 1').style).toBeNull();
  });
});

describe('运算符与类型转换歧义排除', () => {
  it('?| 与 ?& jsonb 运算符不作为占位符', () => {
    const r = convert("SELECT tags ?| 'a' WHERE id = ?", 'question', 'dollar-number');
    expect(r.sql).toBe("SELECT tags ?| 'a' WHERE id = $1");
    const r2 = convert("SELECT tags ?& 'a' WHERE id = ?", 'question', 'dollar-number');
    expect(r2.sql).toBe("SELECT tags ?& 'a' WHERE id = $1");
  });

  it(':: 类型转换不当作 :name 占位符', () => {
    const r = convert('SELECT ?::jsonb, :id FROM t', 'colon-name', 'at-name');
    expect(r.sql).toBe('SELECT ?::jsonb, @id FROM t');
    const r2 = convert('SELECT :id::text FROM t', 'colon-name', 'at-name');
    expect(r2.sql).toBe('SELECT @id::text FROM t');
  });

  it('@@version 不当作 @name 占位符', () => {
    const r = convert('SELECT @@version, @id FROM t', 'at-name', 'colon-name');
    expect(r.sql).toBe('SELECT @@version, :id FROM t');
  });

  it(':n 数字编号风格与 :name 命名风格互不误判', () => {
    const r = convert('SELECT :1, :2', 'colon-number', 'dollar-number');
    expect(r.sql).toBe('SELECT $1, $2');
  });
});

describe('非法与边界输入', () => {
  it('空输入报错', () => {
    expect(convert('   ', 'question', 'dollar-number').error).toMatch(/请输入/);
  });

  it('未发现占位符提示不改写', () => {
    const r = convert('SELECT 1', 'question', 'dollar-number');
    expect(r.error).toMatch(/未发现/);
  });

  it('非法命名前缀报错', () => {
    expect(convert('SELECT ?', 'question', 'colon-name', '1bad').error).toMatch(/命名前缀/);
  });

  it('{{1bad}} 非法名称报错并给偏移', () => {
    const r = convert('SELECT {{1bad}}', 'double-brace', 'question');
    expect(r.error).toMatch(/不合法/);
    expect(r.errorOffset).toBe(7);
  });

  it('仅大小写不同的名称按区分处理并给出提示', () => {
    const r = convert('SELECT :Id, :id', 'colon-name', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.params).toHaveLength(2);
    expect(r.warnings.join(' ')).toMatch(/大小写/);
  });

  it('scanSql 保留普通文本与占位符的偏移信息', () => {
    const scanned = scanSql('a = ?', 'question');
    expect(scanned.error).toBeNull();
    const ph = scanned.tokens.filter((t) => t.kind === 'placeholder');
    expect(ph).toHaveLength(1);
    expect(ph[0]!.offset).toBe(4);
  });

  it('编号式同号重复合法：@p1 出现两次只生成一个参数', () => {
    const r = convert('WHERE a = @p1 OR b = @p1', 'at-p-number', 'dollar-number');
    expect(r.error).toBeNull();
    expect(r.sql).toBe('WHERE a = $1 OR b = $1');
    expect(r.params).toHaveLength(1);
    expect(r.params[0]!.bindings).toBe(2);
  });
});
