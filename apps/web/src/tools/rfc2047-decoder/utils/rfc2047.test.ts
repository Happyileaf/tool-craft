import { describe, expect, it } from 'vitest';
import { decodeRfc2047, hasEncodedWord } from './rfc2047';

/** 取解码成功文本（失败时让用例直接报错） */
function expectOk(result: ReturnType<typeof decodeRfc2047>): string {
  if (result.error !== null) {
    throw new Error(`expected success but got error: ${result.error}`);
  }
  return result.text ?? '';
}

describe('decodeRfc2047 - B（Base64）编码', () => {
  it('解码固定向量 UTF-8 B 编码的「测试」', () => {
    const result = decodeRfc2047('=?UTF-8?B?5rWL6K+V?=');
    expect(result.error).toBeNull();
    expect(expectOk(result)).toBe('测试');
    expect(result.encodedWordCount).toBe(1);
  });

  it('B 标识大小写不敏感（b 小写同样识别）', () => {
    expect(expectOk(decodeRfc2047('=?utf-8?b?5rWL6K+V?='))).toBe('测试');
  });

  it('解码含 Latin 补充字符的 café（UTF-8 字节 Y2Fmw6k=）', () => {
    expect(expectOk(decodeRfc2047('=?UTF-8?B?Y2Fmw6k=?='))).toBe('café');
  });

  it('空内容编码字解码为空串且计数为 1', () => {
    const result = decodeRfc2047('=?UTF-8?B??=');
    expect(expectOk(result)).toBe('');
    expect(result.encodedWordCount).toBe(1);
  });

  it('非法 Base64 返回明确错误', () => {
    const result = decodeRfc2047('=?UTF-8?B?@@@?=');
    expect(result.error).toContain('Base64');
    expect(result.text).toBeNull();
  });
});

describe('decodeRfc2047 - Q 编码', () => {
  it('解码固定向量 GB2312 Q 编码的「测试」（=B2=E2=CA=D4）', () => {
    expect(expectOk(decodeRfc2047('=?GB2312?Q?=B2=E2=CA=D4?='))).toBe('测试');
  });

  it('GBK 字符集别名同样可解码', () => {
    expect(expectOk(decodeRfc2047('=?GBK?Q?=B2=E2=CA=D4?='))).toBe('测试');
  });

  it('解码 UTF-8 Q 编码的「测试主题」', () => {
    expect(
      expectOk(decodeRfc2047('=?UTF-8?Q?=E6=B5=8B=E8=AF=95=E4=B8=BB=E9=A2=98?=')),
    ).toBe('测试主题');
  });

  it('Q 编码中下划线还原为空格', () => {
    // "Hello World" 仅空格用 _，其余 ASCII 原样
    expect(expectOk(decodeRfc2047('=?UTF-8?Q?Hello_World?='))).toBe('Hello World');
  });

  it('Q 编码可打印 ASCII 原样保留，等号自身用 =3D', () => {
    expect(expectOk(decodeRfc2047('=?UTF-8?Q?a=3D1?='))).toBe('a=1');
  });

  it('非法 =XX 十六进制转义返回错误', () => {
    const result = decodeRfc2047('=?UTF-8?Q?=ZZ?=');
    expect(result.error).toContain('十六进制');
  });
});

describe('decodeRfc2047 - 多段与明文混排', () => {
  it('编码字与明文混排：明文原样保留并正确拼接', () => {
    expect(expectOk(decodeRfc2047('Re: =?UTF-8?B?5rWL6K+V?= 邮件'))).toBe(
      'Re: 测试 邮件',
    );
  });

  it('相邻两个编码字之间的单个空格按 RFC 2047 §6.2 折叠（不保留）', () => {
    // RFC 2047 §6.2：两个相邻 encoded-word 之间的每个 WSP 都在显示时删除
    expect(
      expectOk(decodeRfc2047('=?UTF-8?B?5L2g5aW9?= =?UTF-8?B?5LiW55WM?=')),
    ).toBe('你好世界');
  });

  it('相邻编码字被折行空白分隔时间隔被折叠（直接相连）', () => {
    expect(
      expectOk(
        decodeRfc2047('=?UTF-8?B?YQ==?= \r\n =?UTF-8?B?Yg==?='),
      ),
    ).toBe('ab');
  });

  it('多个连续编码字累计计数', () => {
    const result = decodeRfc2047('=?UTF-8?B?YQ==?= =?UTF-8?B?Yg==?= =?UTF-8?B?Yw==?=');
    expect(result.encodedWordCount).toBe(3);
    expect(expectOk(result)).toBe('abc');
  });
});

describe('decodeRfc2047 - 边界与错误', () => {
  it('无编码字的纯明文原样返回，计数为 0', () => {
    const result = decodeRfc2047('Just a plain subject');
    expect(expectOk(result)).toBe('Just a plain subject');
    expect(result.encodedWordCount).toBe(0);
  });

  it('空串与纯空白原样返回', () => {
    expect(expectOk(decodeRfc2047(''))).toBe('');
    expect(expectOk(decodeRfc2047('   '))).toBe('   ');
  });

  it('未闭合的编码字（缺少 ?=）返回结构错误', () => {
    const result = decodeRfc2047('=?UTF-8?B?5rWL6K+V');
    expect(result.error).toContain('未闭合');
  });

  it('=? 后结构完全损坏时返回结构错误', () => {
    const result = decodeRfc2047('前缀 =?abc 后缀');
    expect(result.error).toContain('编码字');
  });

  it('不支持的字符集返回明确错误', () => {
    const result = decodeRfc2047('=?totally-bogus?Q?abc?=');
    expect(result.error).toContain('字符集');
  });

  it('声明 UTF-8 但字节非法时返回字节不匹配错误', () => {
    // =FF 在 UTF-8 中永不合法
    const result = decodeRfc2047('=?UTF-8?Q?=FF?=');
    expect(result.error).toContain('字符集');
  });
});

describe('hasEncodedWord', () => {
  it('含合法编码字返回 true', () => {
    expect(hasEncodedWord('=?UTF-8?B?5rWL6K+V?=')).toBe(true);
  });

  it('纯明文返回 false', () => {
    expect(hasEncodedWord('plain text')).toBe(false);
  });
});
