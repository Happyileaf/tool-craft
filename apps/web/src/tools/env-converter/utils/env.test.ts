import { describe, it, expect } from 'vitest';
import {
  parseDotenv,
  parseJsonEnv,
  parseYamlEnv,
  parseEnv,
  toDotenv,
  toExport,
  toJson,
  toYaml,
  convertEnv,
  type EnvEntry,
} from './env';

const sampleEntries: EnvEntry[] = [
  { key: 'HOST', value: 'localhost' },
  { key: 'PORT', value: '3000' },
];

describe('parseDotenv', () => {
  it('解析无引号值并忽略空行与整行注释', () => {
    const input = `
# 这是注释
HOST=localhost

PORT=3000
`;
    const result = parseDotenv(input);
    expect(result.error).toBeNull();
    expect(result.warnings).toEqual([]);
    expect(result.entries).toEqual(sampleEntries);
  });

  it('解析单引号值（不处理转义）', () => {
    const result = parseDotenv("MSG='hello \\n world'");
    expect(result.entries).toEqual([{ key: 'MSG', value: 'hello \\n world' }]);
  });

  it('解析双引号值并处理 \\n \\t \\" \\\\ 转义', () => {
    const result = parseDotenv('MSG="line1\\nline2\\tend\\"quote\\\\path"');
    expect(result.entries).toEqual([
      { key: 'MSG', value: 'line1\nline2\tend"quote\\path' },
    ]);
  });

  it('未知转义保留反斜杠原样', () => {
    const result = parseDotenv('MSG="a\\zb"');
    expect(result.entries[0]?.value).toBe('a\\zb');
  });

  it('识别可选的 export 前缀（含 export= 边界）', () => {
    const result = parseDotenv('export FOO=bar\nexport  BAZ=qux');
    expect(result.entries).toEqual([
      { key: 'FOO', value: 'bar' },
      { key: 'BAZ', value: 'qux' },
    ]);
  });

  it('无引号值剥离行内注释，值内含 = 只在首个 = 切分', () => {
    const result = parseDotenv('URL=postgres://h:5432/db?ssl=true # 主库\nEMPTY=');
    expect(result.entries).toEqual([
      { key: 'URL', value: 'postgres://h:5432/db?ssl=true' },
      { key: 'EMPTY', value: '' },
    ]);
  });

  it('引号值后允许尾随注释', () => {
    const result = parseDotenv('GREETING="hello world" # 打招呼');
    expect(result.entries).toEqual([{ key: 'GREETING', value: 'hello world' }]);
  });

  it('重复键产生警告且以后值为准', () => {
    const result = parseDotenv('K=v1\nK=v2');
    expect(result.entries).toEqual([{ key: 'K', value: 'v2' }]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.line).toBe(2);
    expect(result.warnings[0]?.message).toContain('重复键');
  });

  it('非法键名带行号报错', () => {
    const result = parseDotenv('A=1\n1BAD=x');
    expect(result.error).toEqual({
      line: 2,
      message: expect.stringContaining('1BAD'),
    });
  });

  it('缺少等号带行号报错', () => {
    const result = parseDotenv('A=1\nJUSTKEY');
    expect(result.error?.line).toBe(2);
    expect(result.error?.message).toContain('=');
  });

  it('未闭合引号报错', () => {
    expect(parseDotenv('A="oops').error?.message).toContain('双引号未闭合');
    expect(parseDotenv("A='oops").error?.message).toContain('单引号未闭合');
  });

  it('引号闭合后存在非注释多余内容报错', () => {
    const result = parseDotenv('A="v" xyz');
    expect(result.error?.message).toContain('多余内容');
  });

  it('空输入与仅注释返回空 entries 且无错', () => {
    expect(parseDotenv('').entries).toEqual([]);
    const onlyComments = parseDotenv('# a\n  # b\n');
    expect(onlyComments.entries).toEqual([]);
    expect(onlyComments.error).toBeNull();
  });

  it('容忍 BOM 前缀与 CRLF 换行', () => {
    const result = parseDotenv('\uFEFFA=1\r\nB=2\r\n');
    expect(result.entries).toEqual([
      { key: 'A', value: '1' },
      { key: 'B', value: '2' },
    ]);
  });
});

describe('parseJsonEnv', () => {
  it('解析扁平 JSON 对象，数字 / 布尔转字符串、null 转空串', () => {
    const result = parseJsonEnv('{"HOST":"localhost","PORT":3000,"DEBUG":true,"TOKEN":null}');
    expect(result.error).toBeNull();
    expect(result.entries).toEqual([
      { key: 'HOST', value: 'localhost' },
      { key: 'PORT', value: '3000' },
      { key: 'DEBUG', value: 'true' },
      { key: 'TOKEN', value: '' },
    ]);
  });

  it('JSON 语法错误返回错误而非抛异常', () => {
    const result = parseJsonEnv('{not json}');
    expect(result.error?.message).toContain('JSON 解析失败');
  });

  it('顶层非对象报错', () => {
    expect(parseJsonEnv('[1,2]').error?.message).toContain('对象');
    expect(parseJsonEnv('"str"').error?.message).toContain('对象');
  });

  it('嵌套对象与数组报错', () => {
    expect(parseJsonEnv('{"A":{"B":1}}').error?.message).toContain('嵌套');
    expect(parseJsonEnv('{"A":[1]}').error?.message).toContain('数组');
  });

  it('非法键名报错', () => {
    expect(parseJsonEnv('{"1BAD":"x"}').error?.message).toContain('1BAD');
  });
});

describe('parseYamlEnv', () => {
  it('解析扁平 key: value、忽略注释空行', () => {
    const input = `# config
HOST: localhost
PORT: 3000

EMPTY:`;
    const result = parseYamlEnv(input);
    expect(result.error).toBeNull();
    expect(result.entries).toEqual([
      { key: 'HOST', value: 'localhost' },
      { key: 'PORT', value: '3000' },
      { key: 'EMPTY', value: '' },
    ]);
  });

  it('单引号双引号值与双引号转义', () => {
    const result = parseYamlEnv(`A: 'it''s ok'
B: "x\\ty"
URL: https://a/b?c=1 # tail`);
    expect(result.entries).toEqual([
      { key: 'A', value: "it's ok" },
      { key: 'B', value: 'x\ty' },
      { key: 'URL', value: 'https://a/b?c=1' },
    ]);
  });

  it('支持带引号键名', () => {
    const result = parseYamlEnv('"FOO": 1');
    expect(result.entries).toEqual([{ key: 'FOO', value: '1' }]);
  });

  it('缩进行报错（不支持嵌套）', () => {
    const result = parseYamlEnv('A:\n  B: 1');
    expect(result.error?.line).toBe(2);
    expect(result.error?.message).toContain('嵌套');
  });

  it('缺少冒号与冒号格式错误带行号', () => {
    expect(parseYamlEnv('NO_COLON').error?.line).toBe(1);
    const bad = parseYamlEnv('A:1');
    expect(bad.error?.line).toBe(1);
    expect(bad.error?.message).toContain('空格');
  });

  it('未闭合引号报错、重复键警告', () => {
    expect(parseYamlEnv("A: 'oops").error?.message).toContain('单引号未闭合');
    const dup = parseYamlEnv('K: v1\nK: v2');
    expect(dup.entries).toEqual([{ key: 'K', value: 'v2' }]);
    expect(dup.warnings).toHaveLength(1);
  });
});

describe('parseEnv 分发', () => {
  it('env 与 export 走 dotenv 解析', () => {
    expect(parseEnv('A=1', 'env').entries).toEqual([{ key: 'A', value: '1' }]);
    expect(parseEnv('export A=1', 'export').entries).toEqual([{ key: 'A', value: '1' }]);
  });

  it('未知格式返回错误不抛异常', () => {
    // @ts-expect-error 故意传入非法格式
    expect(parseEnv('A=1', 'toml').error).not.toBeNull();
  });
});

describe('序列化器', () => {
  it('toDotenv：安全值裸写、特殊值加双引号并转义', () => {
    const entries: EnvEntry[] = [
      { key: 'A', value: 'simple' },
      { key: 'B', value: 'hello world' },
      { key: 'C', value: 'line1\nline2' },
      { key: 'D', value: 'say "hi"' },
      { key: 'E', value: 'path\\dir' },
      { key: 'F', value: '' },
    ];
    const text = toDotenv(entries);
    expect(text).toBe(
      [
        'A=simple',
        'B="hello world"',
        'C="line1\\nline2"',
        'D="say \\"hi\\""',
        'E="path\\\\dir"',
        'F=',
      ].join('\n'),
    );
  });

  it('值以 # 开头也加引号', () => {
    expect(toDotenv([{ key: 'A', value: '#comment' }])).toBe('A="#comment"');
  });

  it('toExport 为每行加 export 前缀', () => {
    expect(toExport(sampleEntries)).toBe('export HOST=localhost\nexport PORT=3000');
  });

  it('toJson 输出两空格缩进 JSON', () => {
    expect(toJson(sampleEntries)).toBe('{\n  "HOST": "localhost",\n  "PORT": "3000"\n}');
  });

  it('toYaml 安全裸值直接输出，保留字 / 数字 / 特殊字符加引号', () => {
    const text = toYaml([
      { key: 'HOST', value: 'localhost' },
      { key: 'PORT', value: '3000' },
      { key: 'FLAG_TRUE', value: 'true' },
      { key: 'GREETING', value: 'hello world' },
      { key: 'EMPTY', value: '' },
    ]);
    expect(text).toBe(
      [
        'HOST: localhost',
        'PORT: "3000"',
        'FLAG_TRUE: "true"',
        'GREETING: "hello world"',
        'EMPTY: ""',
      ].join('\n'),
    );
  });
});

describe('convertEnv 四格式互转与往返', () => {
  it('env → json', () => {
    const result = convertEnv('HOST=localhost\nPORT=3000', 'env', 'json');
    expect(result.error).toBeNull();
    expect(JSON.parse(result.output)).toEqual({ HOST: 'localhost', PORT: '3000' });
  });

  it('env → yaml', () => {
    const result = convertEnv('HOST=localhost', 'env', 'yaml');
    expect(result.output).toBe('HOST: localhost');
  });

  it('env → export', () => {
    const result = convertEnv('A=1', 'env', 'export');
    expect(result.output).toBe('export A=1');
  });

  it('json → env → json 往返一致', () => {
    const source = {
      HOST: 'localhost',
      EMPTY: '',
      SPACED: 'hello world',
      MULTI: 'a\nb',
    };
    const first = convertEnv(JSON.stringify(source), 'json', 'env');
    expect(first.error).toBeNull();
    const back = convertEnv(first.output, 'env', 'json');
    expect(JSON.parse(back.output)).toEqual(source);
  });

  it('yaml → export → yaml 往返一致', () => {
    const yaml = 'HOST: localhost\nMSG: "hello world"\n';
    const exp = convertEnv(yaml, 'yaml', 'export');
    expect(exp.error).toBeNull();
    const back = convertEnv(exp.output, 'export', 'yaml');
    expect(back.error).toBeNull();
    expect(back.output).toBe('HOST: localhost\nMSG: "hello world"');
  });

  it('解析失败时 output 为空、错误带行号且警告保留', () => {
    const result = convertEnv('K=v1\nK=v2\n1BAD=x', 'env', 'json');
    expect(result.output).toBe('');
    expect(result.error?.line).toBe(3);
    expect(result.warnings).toHaveLength(1);
  });

  it('未知目标格式报错不抛异常', () => {
    // @ts-expect-error 故意传入非法格式
    const result = convertEnv('A=1', 'env', 'xml');
    expect(result.error).not.toBeNull();
    expect(result.output).toBe('');
  });

  it('空输入：json 输出空对象，其余格式输出空串', () => {
    expect(convertEnv('', 'env', 'json').output).toBe('{}');
    expect(convertEnv('', 'env', 'yaml').output).toBe('');
    expect(convertEnv('', 'env', 'env').output).toBe('');
    expect(convertEnv('', 'env', 'export').output).toBe('');
  });
});
