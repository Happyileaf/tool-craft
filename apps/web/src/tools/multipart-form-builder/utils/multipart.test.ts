import { describe, expect, it } from 'vitest';
import {
  buildCurlExample,
  buildMultipart,
  escapeHeaderParam,
  generateBoundary,
  generateBoundaryDeterministic,
  parseMultipart,
  validateFields,
  type FormField,
} from './multipart';
import { BOUNDARY_PREFIX, MAX_FIELDS } from '../constants';

/** 测试用固定 boundary */
const BOUNDARY = '----TestBoundary0001';

/** 构造一个文本字段 */
function textField(
  id: string,
  name: string,
  value: string,
): FormField {
  return { id, kind: 'text', name, value };
}

/** 构造一个文件字段 */
function fileField(
  id: string,
  name: string,
  value: string,
  filename: string,
  contentType?: string,
): FormField {
  return { id, kind: 'file', name, value, filename, contentType };
}

describe('generateBoundary', () => {
  it('生成的随机 boundary 带 WebKit 前缀且后缀为 16 位 bchars', () => {
    const boundary = generateBoundary();
    expect(boundary.startsWith(BOUNDARY_PREFIX)).toBe(true);
    const suffix = boundary.slice(BOUNDARY_PREFIX.length);
    expect(suffix).toHaveLength(16);
    expect(/^[0-9A-Za-z]{16}$/.test(suffix)).toBe(true);
  });

  it('两次随机生成的 boundary 后缀不应完全相同（概率性自检）', () => {
    const samples = new Set(
      Array.from({ length: 8 }, () => generateBoundary()),
    );
    expect(samples.size).toBeGreaterThan(1);
  });
});

describe('generateBoundaryDeterministic', () => {
  it('相同种子产出完全相同的 boundary', () => {
    expect(generateBoundaryDeterministic(42)).toBe(
      generateBoundaryDeterministic(42),
    );
  });

  it('不同种子产出不同 boundary', () => {
    expect(generateBoundaryDeterministic(1)).not.toBe(
      generateBoundaryDeterministic(2),
    );
  });

  it('种子为 0 也能产出合法 bchars boundary', () => {
    const boundary = generateBoundaryDeterministic(0);
    expect(boundary.startsWith(BOUNDARY_PREFIX)).toBe(true);
    const suffix = boundary.slice(BOUNDARY_PREFIX.length);
    expect(/^[0-9A-Za-z]{16}$/.test(suffix)).toBe(true);
  });

  it('输出仅包含 RFC 2046 允许的 bchars', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const boundary = generateBoundaryDeterministic(seed);
      expect(/^[0-9A-Za-z'() +_,\-./=?:]*$/.test(boundary)).toBe(true);
    }
  });
});

describe('escapeHeaderParam', () => {
  it('普通字符串原样返回', () => {
    expect(escapeHeaderParam('report.txt')).toBe('report.txt');
  });

  it('双引号转义为反斜杠加双引号', () => {
    expect(escapeHeaderParam('a"b')).toBe('a\\"b');
  });

  it('反斜杠先转义，避免破坏后续引号转义', () => {
    expect(escapeHeaderParam('a\\b"c')).toBe('a\\\\b\\"c');
  });
});

describe('validateFields', () => {
  it('合法的文本与文件字段通过校验', () => {
    const result = validateFields([
      textField('1', 'title', 'hello'),
      fileField('2', 'report', 'body', 'report.txt', 'text/plain'),
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('空字段列表报错', () => {
    const result = validateFields([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('至少需要一个字段');
  });

  it('name 为空时报错', () => {
    const result = validateFields([textField('1', '', 'x')]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('name 不能为空'))).toBe(
      true,
    );
  });

  it('name 含 LF / CR 时报错', () => {
    const lf = validateFields([textField('1', 'a\nb', 'x')]);
    expect(lf.valid).toBe(false);
    expect(lf.errors.some((error) => error.includes('CR/LF'))).toBe(true);
    const cr = validateFields([textField('1', 'a\rb', 'x')]);
    expect(cr.valid).toBe(false);
  });

  it('文件字段缺少 filename 时报错', () => {
    const result = validateFields([
      { id: '1', kind: 'file', name: 'f', value: 'x' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('filename 不能为空'))).toBe(
      true,
    );
  });

  it('文件字段 filename 含换行时报错', () => {
    const result = validateFields([
      fileField('1', 'f', 'x', 'a\nb.txt'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('CR/LF'))).toBe(true);
  });

  it('字段数超过上限时报错', () => {
    const fields: FormField[] = Array.from({ length: MAX_FIELDS + 1 }, (_, index) =>
      textField(`f${index}`, `n${index}`, 'v'),
    );
    const result = validateFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain(String(MAX_FIELDS));
  });

  it('恰好达到字段数上限时通过', () => {
    const fields: FormField[] = Array.from({ length: MAX_FIELDS }, (_, index) =>
      textField(`f${index}`, `n${index}`, 'v'),
    );
    expect(validateFields(fields).valid).toBe(true);
  });
});

describe('buildMultipart', () => {
  it('单个文本字段拼装出精确的完整报文', () => {
    const result = buildMultipart([textField('1', 'title', 'hello')], BOUNDARY);
    expect(result.body).toBe(
      `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="title"\r\n` +
        `\r\n` +
        `hello\r\n` +
        `------TestBoundary0001--\r\n`,
    );
  });

  it('多文本字段按顺序逐段拼装', () => {
    const result = buildMultipart(
      [textField('1', 'a', '1'), textField('2', 'b', '2')],
      BOUNDARY,
    );
    expect(result.body).toBe(
      `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="a"\r\n\r\n1\r\n` +
        `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="b"\r\n\r\n2\r\n` +
        `------TestBoundary0001--\r\n`,
    );
  });

  it('文件字段输出 filename 与 Content-Type 头部', () => {
    const result = buildMultipart(
      [fileField('1', 'report', '报告内容', 'report.txt', 'text/plain')],
      BOUNDARY,
    );
    expect(result.body).toBe(
      `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="report"; filename="report.txt"\r\n` +
        `Content-Type: text/plain\r\n` +
        `\r\n` +
        `报告内容\r\n` +
        `------TestBoundary0001--\r\n`,
    );
  });

  it('文件字段未提供 Content-Type 时省略该头部但保留空行', () => {
    const result = buildMultipart(
      [fileField('1', 'report', 'x', 'r.bin')],
      BOUNDARY,
    );
    expect(result.body).toBe(
      `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="report"; filename="r.bin"\r\n` +
        `\r\n` +
        `x\r\n` +
        `------TestBoundary0001--\r\n`,
    );
  });

  it('文本与文件混合字段的精确字符串断言', () => {
    const result = buildMultipart(
      [
        textField('1', 'title', 'hello'),
        textField('2', 'tags', 'web'),
        fileField('3', 'report', '示例内容', 'report.txt', 'text/plain'),
      ],
      BOUNDARY,
    );
    expect(result.body).toBe(
      `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\nhello\r\n` +
        `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="tags"\r\n\r\nweb\r\n` +
        `------TestBoundary0001\r\n` +
        `Content-Disposition: form-data; name="report"; filename="report.txt"\r\n` +
        `Content-Type: text/plain\r\n\r\n示例内容\r\n` +
        `------TestBoundary0001--\r\n`,
    );
  });

  it('name 含双引号与反斜杠时按 quoted-string 规则转义', () => {
    const result = buildMultipart(
      [textField('1', 'a"b\\c', 'v')],
      BOUNDARY,
    );
    expect(result.body).toContain(
      `Content-Disposition: form-data; name="a\\"b\\\\c"\r\n`,
    );
  });

  it('filename 中的双引号同样被转义', () => {
    const result = buildMultipart(
      [fileField('1', 'f', 'v', 'q"x.txt')],
      BOUNDARY,
    );
    expect(result.body).toContain('filename="q\\"x.txt"');
  });

  it('自定义 boundary 透传到报文与 Content-Type 头', () => {
    const result = buildMultipart([textField('1', 'a', 'b')], 'custom-b');
    expect(result.boundary).toBe('custom-b');
    expect(result.contentType).toBe('multipart/form-data; boundary=custom-b');
    expect(result.body.startsWith('--custom-b\r\n')).toBe(true);
    expect(result.body.endsWith('--custom-b--\r\n')).toBe(true);
  });

  it('未传 boundary 时自动生成且与 contentType 一致', () => {
    const result = buildMultipart([textField('1', 'a', 'b')]);
    expect(result.boundary.startsWith(BOUNDARY_PREFIX)).toBe(true);
    expect(result.contentType).toBe(
      `multipart/form-data; boundary=${result.boundary}`,
    );
  });

  it('byteLength 等于手工 TextEncoder 计算的 UTF-8 字节数（含中文）', () => {
    const result = buildMultipart(
      [textField('1', 'title', '中文内容🎉')],
      BOUNDARY,
    );
    const expected = new TextEncoder().encode(result.body).length;
    expect(result.byteLength).toBe(expected);
    expect(result.byteLength).toBeGreaterThan(result.body.length);
  });

  it('校验失败时抛出错误且不返回结果', () => {
    expect(() => buildMultipart([], BOUNDARY)).toThrow('至少需要一个字段');
  });
});

describe('buildMultipart -> parseMultipart 往返', () => {
  it('文本与文件字段可完整还原', () => {
    const fields: FormField[] = [
      textField('1', 'title', 'hello'),
      fileField('2', 'report', '报告内容', 'report.txt', 'text/plain'),
    ];
    const built = buildMultipart(fields, BOUNDARY);
    const parsed = parseMultipart(built.body, built.contentType);
    expect(parsed.ok).toBe(true);
    expect(parsed.errors).toEqual([]);
    expect(parsed.parts).toHaveLength(2);
    expect(parsed.parts[0]).toEqual({ name: 'title', value: 'hello' });
    expect(parsed.parts[1]).toEqual({
      name: 'report',
      value: '报告内容',
      filename: 'report.txt',
      contentType: 'text/plain',
    });
  });

  it('含中文、换行与特殊字符的段体原样往返', () => {
    const tricky = '第一行\r\n第二行 "quotes" \\反斜杠\\ 🎉';
    const built = buildMultipart(
      [textField('1', 'json', tricky), fileField('2', 'f', '', 'a b.txt')],
      BOUNDARY,
    );
    const parsed = parseMultipart(built.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.parts[0]?.value).toBe(tricky);
    expect(parsed.parts[1]?.filename).toBe('a b.txt');
  });

  it('转义后的 name/filename 解析时被还原', () => {
    const built = buildMultipart(
      [fileField('1', 'a"b', 'v', 'c\\d".txt')],
      BOUNDARY,
    );
    const parsed = parseMultipart(built.body, built.contentType);
    expect(parsed.ok).toBe(true);
    expect(parsed.parts[0]?.name).toBe('a"b');
    expect(parsed.parts[0]?.filename).toBe('c\\d".txt');
  });

  it('容忍最后一个结束段缺少尾随 CRLF', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const trimmed = built.body.replace(/\r\n$/, '');
    const parsed = parseMultipart(trimmed, built.contentType);
    expect(parsed.ok).toBe(true);
    expect(parsed.parts[0]?.value).toBe('b');
  });
});

describe('parseMultipart', () => {
  it('从 Content-Type 头提取带引号的 boundary', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const quotedType = `multipart/form-data; boundary="${BOUNDARY}"`;
    const parsed = parseMultipart(built.body, quotedType);
    expect(parsed.ok).toBe(true);
    expect(parsed.parts).toHaveLength(1);
  });

  it('未提供 Content-Type 时从首行自动探测 boundary', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const parsed = parseMultipart(built.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.parts[0]?.name).toBe('a');
  });

  it('boundary 不匹配时返回结构化错误', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const parsed = parseMultipart(
      built.body,
      'multipart/form-data; boundary=----OtherBoundary99',
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  it('缺少结束 boundary 时记录错误', () => {
    // 模拟被截断的响应：最后一个分段存在，但结束分隔行被截断为普通 boundary 行
    const broken =
      `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="a"\r\n\r\nb\r\n` +
      `--${BOUNDARY}\r\n`;
    const parsed = parseMultipart(
      broken,
      `multipart/form-data; boundary=${BOUNDARY}`,
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.some((error) => error.includes('结束分隔行'))).toBe(
      true,
    );
    expect(parsed.parts[0]?.value).toBe('b');
  });

  it('分段缺少 Content-Disposition 时记录错误且不中断后续解析', () => {
    const malformed =
      `--${BOUNDARY}\r\n` +
      `Content-Type: text/plain\r\n\r\nno-disposition\r\n` +
      `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="ok"\r\n\r\nfine\r\n` +
      `--${BOUNDARY}--\r\n`;
    const parsed = parseMultipart(
      malformed,
      `multipart/form-data; boundary=${BOUNDARY}`,
    );
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.some((error) => error.includes('Content-Disposition'))).toBe(
      true,
    );
    expect(parsed.parts).toHaveLength(1);
    expect(parsed.parts[0]?.name).toBe('ok');
  });

  it('空报文直接返回错误', () => {
    const parsed = parseMultipart('');
    expect(parsed.ok).toBe(false);
    expect(parsed.parts).toEqual([]);
    expect(parsed.errors[0]).toContain('为空');
  });

  it('无法确定 boundary 时返回错误', () => {
    const parsed = parseMultipart('not a multipart body at all');
    expect(parsed.ok).toBe(false);
    expect(parsed.errors[0]).toContain('boundary');
  });

  it('Content-Type 无 boundary 参数时回退到自动探测', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const parsed = parseMultipart(built.body, 'multipart/form-data');
    expect(parsed.ok).toBe(true);
    expect(parsed.parts[0]?.value).toBe('b');
  });
});

describe('buildCurlExample', () => {
  it('包含正确的 Content-Type 头与 --data-binary', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const curl = buildCurlExample('https://example.com/upload', built);
    expect(curl.startsWith("curl -X POST 'https://example.com/upload'")).toBe(
      true,
    );
    expect(curl).toContain(
      `-H 'Content-Type: multipart/form-data; boundary=${BOUNDARY}'`,
    );
    expect(curl).toContain('--data-binary');
  });

  it('报文内单引号被 shell 转义为 \'\\\'\'', () => {
    const built = buildMultipart([textField('1', "it's", "v'x")], BOUNDARY);
    const curl = buildCurlExample('https://example.com/u', built);
    expect(curl).toContain("'\\''");
    expect(curl).not.toContain("name=\"it's\"");
  });

  it('URL 中的单引号同样被转义', () => {
    const built = buildMultipart([textField('1', 'a', 'b')], BOUNDARY);
    const curl = buildCurlExample("https://example.com/o'reilly", built);
    expect(curl).toContain("'https://example.com/o'\\''reilly'");
  });
});
