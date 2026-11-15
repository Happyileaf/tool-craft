import { describe, expect, it } from 'vitest';
import {
  buildCommandSnippet,
  quoteArg,
  splitArgs,
  unquoteArg,
} from './shellQuote';

describe('POSIX 引用', () => {
  it('含空格的普通字符串用单引号包裹', () => {
    expect(quoteArg('Hello World', 'posix').output).toBe("'Hello World'");
  });

  it('内含单引号按 \'\\\'\' 断开', () => {
    expect(quoteArg("it's", 'posix').output).toBe("'it'\\''s'");
  });

  it('含换行时输出 ANSI-C 引用并附说明', () => {
    const result = quoteArg('line1\nline2', 'posix');
    expect(result.ok).toBe(true);
    expect(result.output).toBe("$'line1\\nline2'");
    expect(result.warnings.length).toBe(1);
  });

  it('$、反斜杠与通配符保持稳定结果', () => {
    const result = quoteArg('$HOME\\*.txt', 'posix');
    expect(result.output).toBe("'$HOME\\*.txt'");
  });

  it('空串输出两个单引号', () => {
    expect(quoteArg('', 'posix').output).toBe("''");
  });

  it('NUL 字节拒绝处理', () => {
    expect(quoteArg('a\u0000b', 'posix').ok).toBe(false);
  });
});

describe('POSIX 去引用与往返', () => {
  const vectors = ["Hello World", "it's", '$HOME\\*.txt', '', 'a b  c', '中文 参数'];

  it.each(vectors)('往返无损：%s', (value) => {
    const quoted = quoteArg(value, 'posix');
    const unquoted = unquoteArg(quoted.output, 'posix');
    expect(unquoted.ok).toBe(true);
    expect(unquoted.output).toBe(value);
  });

  it('ANSI-C 引用可还原换行', () => {
    const quoted = quoteArg('line1\nline2', 'posix');
    const unquoted = unquoteArg(quoted.output, 'posix');
    expect(unquoted.ok).toBe(true);
    expect(unquoted.output).toBe('line1\nline2');
  });

  it('缺少结尾引号返回定位明确的错误', () => {
    const result = unquoteArg("'abc", 'posix');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('结尾');
  });

  it('未引用输入被拒绝', () => {
    expect(unquoteArg('abc', 'posix').ok).toBe(false);
  });
});

describe('Windows CMD 引用', () => {
  it('a & b 用双引号包裹为单一参数', () => {
    expect(quoteArg('a & b', 'cmd').output).toBe('"a & b"');
  });

  it('%PATH% 触发变量展开告警', () => {
    const result = quoteArg('%PATH%', 'cmd');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('"%PATH%"');
    expect(result.warnings.join('')).toContain('%VAR%');
  });

  it('!VAR! 触发延迟展开告警', () => {
    const result = quoteArg('!FOO!', 'cmd');
    expect(result.warnings.join('')).toContain('延迟展开');
  });

  it('内部双引号转义并提示兼容性限制', () => {
    const result = quoteArg('say "hi"', 'cmd');
    expect(result.output).toBe('"say \\"hi\\""');
    expect(result.warnings.join('')).toContain('不支持');
  });

  it('空串输出空引用', () => {
    expect(quoteArg('', 'cmd').output).toBe('""');
  });

  it('去引用往返（无内部引号向量）', () => {
    const quoted = quoteArg('C:\\Program Files\\My App', 'cmd');
    const unquoted = unquoteArg(quoted.output, 'cmd');
    expect(unquoted.ok).toBe(true);
    expect(unquoted.output).toBe('C:\\Program Files\\My App');
  });

  it('未加双引号返回错误', () => {
    expect(unquoteArg('abc', 'cmd').ok).toBe(false);
  });
});

describe('PowerShell 引用', () => {
  it('单引号双写', () => {
    expect(quoteArg("it's", 'powershell').output).toBe("'it''s'");
  });

  it('往返还原单引号', () => {
    const unquoted = unquoteArg("'it''s'", 'powershell');
    expect(unquoted.ok).toBe(true);
    expect(unquoted.output).toBe("it's");
  });

  it('反斜杠与 $ 在单引号内为字面量', () => {
    const value = 'C:\\temp\\$x';
    const quoted = quoteArg(value, 'powershell');
    expect(quoted.output).toBe("'C:\\temp\\$x'");
    expect(unquoteArg(quoted.output, 'powershell').output).toBe(value);
  });

  it('单引号未双写时返回错误', () => {
    expect(unquoteArg("'it's'", 'powershell').ok).toBe(false);
  });

  it('空串输出空引用', () => {
    expect(quoteArg('', 'powershell').output).toBe("''");
  });
});

describe('批量与命令片段', () => {
  it('按行拆分参数并忽略末尾空行', () => {
    expect(splitArgs('a b\nc\n')).toEqual(['a b', 'c']);
    expect(splitArgs('a\n\nb')).toEqual(['a', '', 'b']);
  });

  it('生成可粘贴命令片段', () => {
    expect(buildCommandSnippet("'Hello World'")).toBe("my-command 'Hello World'");
  });
});
