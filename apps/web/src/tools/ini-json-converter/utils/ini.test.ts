import { describe, it, expect } from 'vitest';
import { iniToJson, jsonToIni } from './ini';

describe('iniToJson - 基础解析', () => {
  it('解析顶层键值并推断布尔 / 数字 / null 类型', () => {
    const ini = `
; 全局配置
app = Demo
port = 8080
debug = true
ratio = 0.5
empty = null
`;
    expect(iniToJson(ini)).toEqual({
      app: 'Demo',
      port: 8080,
      debug: true,
      ratio: 0.5,
      empty: null,
    });
  });

  it('分节归入同名对象，支持 = 与 : 两种分隔符', () => {
    const ini = `[server]
host: 127.0.0.1
port = 3000`;
    expect(iniToJson(ini)).toEqual({ server: { host: '127.0.0.1', port: 3000 } });
  });

  it('# 与 ; 整行注释以及空行被忽略', () => {
    expect(iniToJson("# 注释\n; 另一注释\n\nkey=1\n")).toEqual({ key: 1 });
  });

  it('单双引号字符串保留原样，支持转义', () => {
    const ini = `a = "hello world"
b = 'it\\'s'
c = "line\\nbreak\\ttab"`;
    expect(iniToJson(ini)).toEqual({
      a: 'hello world',
      b: "it's",
      c: 'line\nbreak\ttab',
    });
  });

  it('看起来像布尔或数字的引号值保持字符串', () => {
    expect(iniToJson('a = "true"\nb = "8080"')).toEqual({ a: 'true', b: '8080' });
  });

  it('inferTypes=false 时所有值保留为字符串', () => {
    expect(iniToJson('a = 1\nb = true', { inferTypes: false })).toEqual({
      a: '1',
      b: 'true',
    });
  });
});

describe('iniToJson - 合并与冲突', () => {
  it('同名分节合并，同名键后者覆盖', () => {
    const ini = `[s]
a = 1
b = 2
[s]
b = 3
c = 4`;
    expect(iniToJson(ini)).toEqual({ s: { a: 1, b: 3, c: 4 } });
  });

  it('分节名与顶层标量键冲突时报错', () => {
    expect(() => iniToJson('a = 1\n[a]\nk = 2')).toThrowError(/冲突/);
  });

  it('缺少分隔符的行抛出带行号的错误', () => {
    expect(() => iniToJson('a = 1\ngarbageline')).toThrowError(/第 2 行/);
  });

  it('空分节名报错', () => {
    expect(() => iniToJson('[ ]')).toThrowError(/分节名称不能为空/);
  });
});

describe('iniToJson - 点号嵌套', () => {
  const opts = { dotSections: true };

  it('点号键展开为嵌套对象', () => {
    expect(iniToJson('db.host = localhost\ndb.port = 5432', opts)).toEqual({
      db: { host: 'localhost', port: 5432 },
    });
  });

  it('点号分节定位嵌套对象', () => {
    expect(iniToJson('[server.tls]\nenabled = true', opts)).toEqual({
      server: { tls: { enabled: true } },
    });
  });

  it('点号路径中间与标量冲突时报错', () => {
    expect(() => iniToJson('db = x\ndb.host = h', opts)).toThrowError(/冲突/);
  });

  it('点号路径含空段时报错', () => {
    expect(() => iniToJson('a..b = 1', opts)).toThrowError(/空段/);
  });

  it('默认关闭点号嵌套时键保持扁平', () => {
    expect(iniToJson('db.host = localhost')).toEqual({ 'db.host': 'localhost' });
  });
});

describe('jsonToIni - 序列化', () => {
  it('标量与 null 直接输出', () => {
    expect(jsonToIni({ a: 1, b: true, c: null, d: 'x' })).toBe('a = 1\nb = true\nc = null\nd = x\n');
  });

  it('一层对象输出为 [section]', () => {
    const output = jsonToIni({ server: { host: 'h', port: 80 } });
    expect(output).toBe('[server]\nhost = h\nport = 80\n');
  });

  it('顶层标量在前、分节在后，空行分隔', () => {
    const output = jsonToIni({ title: 'demo', server: { port: 80 } });
    expect(output).toBe('title = demo\n\n[server]\nport = 80\n');
  });

  it('含特殊字符或歧义的字符串自动加引号并转义，内部空格无需引号', () => {
    const output = jsonToIni({
      a: 'true',
      b: 'has spaces',
      c: 'say "hi"',
      d: '',
      e: ' trimmed ',
    });
    expect(output).toBe(
      'a = "true"\nb = has spaces\nc = "say \\"hi\\""\nd = ""\ne = " trimmed "\n',
    );
  });

  it('标量数组序列化为逗号分隔', () => {
    expect(jsonToIni({ tags: ['a', 'b', 'c'], nums: [1, 2] })).toBe(
      'tags = a, b, c\nnums = 1, 2\n',
    );
  });

  it('接受合法 JSON 字符串输入', () => {
    expect(jsonToIni('{"k": 1}')).toBe('k = 1\n');
  });
});

describe('jsonToIni - 错误处理', () => {
  it('非法 JSON 字符串抛出错误', () => {
    expect(() => jsonToIni('{bad')).toThrowError();
  });

  it('根节点非对象报错', () => {
    expect(() => jsonToIni('[]')).toThrowError(/根节点必须是对象/);
    expect(() => jsonToIni('1')).toThrowError(/根节点必须是对象/);
  });

  it('二层以上嵌套报错（INI 仅支持一层分节）', () => {
    expect(() => jsonToIni({ a: { b: { c: 1 } } })).toThrowError(/嵌套层级过深/);
  });

  it('对象数组报错', () => {
    expect(() => jsonToIni({ items: [{ a: 1 }] })).toThrowError(/对象数组/);
  });

  it('空对象返回空串', () => {
    expect(jsonToIni({})).toBe('');
  });
});

describe('双向往返', () => {
  it('jsonToIni → iniToJson 对一层标量结构保持数据等价', () => {
    const data = {
      name: 'demo-app',
      port: 8080,
      debug: false,
      server: { host: '0.0.0.0', retries: 3 },
    };
    expect(iniToJson(jsonToIni(data))).toEqual(data);
  });

  it('数组经 INI 往返后变为逗号分隔字符串（INI 无数组语法，属预期有损）', () => {
    expect(iniToJson(jsonToIni({ tags: ['a', 'b'] }))).toEqual({ tags: 'a, b' });
  });
});
