import { describe, expect, it } from 'vitest';
import { parseProperties, stringifyProperties } from './properties';

/** 取解析成功对象（失败时让用例直接报错） */
function expectParsed(input: string): Record<string, string> {
  const result = parseProperties(input);
  if (result.error !== null || result.data === null) {
    throw new Error(`expected parse success but got error: ${result.error ?? 'null data'}`);
  }
  return result.data;
}

describe('parseProperties - 分隔符 / 注释 / 空白（验收标准 1）', () => {
  it('支持 = 分隔并去除键值首尾空白', () => {
    expect(
      expectParsed('   host  =  localhost:8080   '),
    ).toEqual({ host: 'localhost:8080' });
  });

  it('支持 : 分隔', () => {
    expect(expectParsed('port: 8080')).toEqual({ port: '8080' });
  });

  it('支持空白分隔（键后空格直接接值）', () => {
    expect(expectParsed('timeout 30')).toEqual({ timeout: '30' });
  });

  it('# 与 ! 注释行、空白行被忽略', () => {
    const text = '# 这是注释\n! 这也是注释\n\nkey=value\n\n';
    expect(expectParsed(text)).toEqual({ key: 'value' });
  });

  it('只有键没有值时值为空串', () => {
    expect(expectParsed('empty=')).toEqual({ empty: '' });
    expect(expectParsed('lonely')).toEqual({ lonely: '' });
  });

  it('值中出现的 = 与 : 不再作为分隔符', () => {
    expect(expectParsed('url=https://example.com/a=b')).toEqual({
      url: 'https://example.com/a=b',
    });
  });

  it('键中可用 \\= 与 \\: 与 \\ 空格转义分隔符', () => {
    expect(expectParsed('a\\=b=c')).toEqual({ 'a=b': 'c' });
    expect(expectParsed('a\\ b=c')).toEqual({ 'a b': 'c' });
  });
});

describe('parseProperties - 续行与转义（验收标准 2）', () => {
  it('行尾反斜杠续行：下一物理行起首空白折叠', () => {
    expect(expectParsed('long=abc\\\n   def')).toEqual({ long: 'abcdef' });
  });

  it('续行可跨多行', () => {
    expect(expectParsed('s=a\\\nb\\\nc')).toEqual({ s: 'abc' });
  });

  it('\\n \\t \\r \\\\ 转义解码', () => {
    expect(expectParsed('v=line1\\nline2\\tend\\\\done')).toEqual({
      v: 'line1\nline2\tend\\done',
    });
  });

  it('\\uXXXX 解码为对应字符', () => {
    expect(expectParsed('title=\\u4f60\\u597d')).toEqual({ title: '你好' });
  });

  it('注释不会出现在续行拼接结果中（续行内 # 是值的一部分）', () => {
    expect(expectParsed('color=red\\\ngreen#tail')).toEqual({ color: 'redgreen#tail' });
  });
});

describe('parseProperties - 边界错误（验收标准 4）', () => {
  it('重复键后者覆盖前者', () => {
    expect(expectParsed('k=1\nk=2')).toEqual({ k: '2' });
  });

  it('畸形 \\uXXXX 返回带行号的错误', () => {
    const result = parseProperties('k=\\u12zz');
    expect(result.error).toContain('第 1 行');
    expect(result.error).toContain('Unicode');
    expect(result.data).toBeNull();
  });

  it('缺键（行首即分隔符）返回明确错误', () => {
    expect(parseProperties('=value').error).toContain('缺少属性键');
    expect(parseProperties('  : value').error).toContain('缺少属性键');
  });

  it('错误行号按逻辑行（首物理行）计', () => {
    const result = parseProperties('ok=1\nbad=\\\n\\uXXXX');
    expect(result.error).toContain('第 2 行');
  });
});

describe('stringifyProperties - 序列化（验收标准 3）', () => {
  it('扁平对象序列化为 key=value', () => {
    const result = stringifyProperties({ host: 'localhost', port: '8080' });
    expect(result.error).toBeNull();
    expect(result.text).toBe('host=localhost\nport=8080');
  });

  it('值中的换行 / 制表 / 反斜杠被转义', () => {
    const result = stringifyProperties({ v: 'a\nb\tc\\d' });
    expect(result.text).toBe('v=a\\nb\\tc\\\\d');
  });

  it('键中的空格 / = / : 被转义', () => {
    const result = stringifyProperties({ 'a b': '1', 'x=y': '2' });
    expect(result.text).toBe('a\\ b=1\nx\\=y=2');
  });

  it('值前导空格转义为 \\ 空格（防止读取端折叠）', () => {
    const result = stringifyProperties({ k: ' indented' });
    expect(result.text).toBe('k=\\ indented');
  });

  it('数字与布尔按字符串序列化，null 转为空串', () => {
    const result = stringifyProperties({ n: 42, b: true, empty: null });
    expect(result.text).toBe('n=42\nb=true\nempty=');
  });

  it('嵌套对象 / 数组被拒绝并给出键名', () => {
    expect(stringifyProperties({ nested: { a: 1 } }).error).toContain('nested');
    expect(stringifyProperties({ arr: [1, 2] }).error).toContain('arr');
  });

  it('超长行在 72 字符内插入反斜杠续行，解析往返语义一致', () => {
    const longValue = 'x'.repeat(100);
    const result = stringifyProperties({ k: longValue });
    expect(result.text).toContain('\\\n ');
    expect(result.text && result.text.length).toBeGreaterThan(100);
    expect(expectParsed(result.text ?? '')).toEqual({ k: longValue });
  });
});

describe('往返一致性（验收标准 3）', () => {
  it('properties → JSON → properties → JSON 语义一致', () => {
    const source = [
      '# config',
      'host = example.com',
      'greeting=hello\\nworld',
      'title=\\u4f60\\u597d',
      'path=C:\\\\Users\\\\test',
      'long=abc\\',
      '   def',
    ].join('\n');
    const first = expectParsed(source);
    const stringified = stringifyProperties(first);
    expect(stringified.error).toBeNull();
    const second = expectParsed(stringified.text ?? '');
    expect(second).toEqual(first);
    expect(second.greeting).toBe('hello\nworld');
    expect(second.title).toBe('你好');
    expect(second.path).toBe('C:\\Users\\test');
    expect(second.long).toBe('abcdef');
  });
});
