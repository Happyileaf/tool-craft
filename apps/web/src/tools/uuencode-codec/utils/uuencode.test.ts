import { describe, it, expect } from 'vitest';
import { uudecode, uuencode } from './uuencode';

/**
 * 以下期望值均由 Python（3.14，binascii）权威生成后硬编码：
 *   python3 -c "import binascii; print(binascii.b2a_uu(b'Cat'))"
 * 多行向量按每 45 字节分块调用 binascii.b2a_uu 取得，再自行包裹 begin/end，
 * 并用 binascii.a2b_uu 逐行复核往返一致。
 *
 * 差异说明：Python b2a_uu 把 6 位零值输出为空格（0x20），而本实现按任务算法规格
 * 输出反引号（0x60）；两种形式 a2b_uu 都能解码（已复核），解码侧同时接受两者。
 */
describe('uuencode', () => {
  it("'Cat' 的编码 body 与 Python binascii.b2a_uu 一致（#0V%T）", () => {
    const result = uuencode('Cat');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('begin 644 file\n#0V%T\n`\nend\n');
    expect(result.byteCount).toBe(3);
  });

  it('空字符串也包含 begin 行、单独反引号行与 end 行', () => {
    const result = uuencode('');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('begin 644 file\n`\nend\n');
    expect(result.byteCount).toBe(0);
  });

  it('超过 45 字节的多行文本按规格折行（每行 body ≤ 60，长度字符正确，Python 可解码）', () => {
    const text =
      'The quick brown fox jumps over the lazy dog.\n' +
      'The quick brown fox jumps over the lazy dog.';
    const result = uuencode(text);
    expect(result.valid).toBe(true);
    expect(result.byteCount).toBe(89);
    const expected = [
      'begin 644 file',
      "M5&AE('%U:6-K(&)R;W=N(&9O>\"!J=6UP<R!O=F5R('1H92!L87IY(&1O9RX*",
      // 本行最后一个 6 位组为 0；按算法规格输出反引号（Python b2a_uu 输出空格，
      // 二者 a2b_uu 均可解码，已用 python3 binascii.a2b_uu 复核本行反引号形式）
      "L5&AE('%U:6-K(&)R;W=N(&9O>\"!J=6UP<R!O=F5R('1H92!L87IY(&1O9RX`",
      '`',
      'end',
      '',
    ].join('\n');
    expect(result.output).toBe(expected);

    // 逐行断言：行首长度字符 (charCode-32)&0x3F 与 body 长度（≤60）
    const bodyLines = result.output.split('\n').slice(1, -3);
    expect(bodyLines).toHaveLength(2);
    expect(bodyLines[0]!.length - 1).toBe(60);
    expect(bodyLines[1]!.length - 1).toBe(60);
    expect((bodyLines[0]!.charCodeAt(0) - 32) & 0x3f).toBe(45);
    expect((bodyLines[1]!.charCodeAt(0) - 32) & 0x3f).toBe(44);
  });

  it('自定义文件名与权限写入 begin 行', () => {
    const result = uuencode('Cat', 'photo.jpg', '755');
    expect(result.output.startsWith('begin 755 photo.jpg\n')).toBe(true);
    expect(result.filename).toBe('photo.jpg');
    expect(result.mode).toBe('755');
  });

  it('mode 非三位八进制数字时报错', () => {
    expect(uuencode('Cat', 'file', '648').valid).toBe(false);
    expect(uuencode('Cat', 'file', 'abc').valid).toBe(false);
    expect(uuencode('Cat', 'file', '64').valid).toBe(false);
  });

  it('文件名为空或含换行时报错', () => {
    expect(uuencode('Cat', '').valid).toBe(false);
    expect(uuencode('Cat', 'a\nb').valid).toBe(false);
  });
});

describe('uudecode', () => {
  const catBlock = 'begin 644 file\n#0V%T\n`\nend\n';

  it('还原 Cat 并解析出 filename=file、mode=644', () => {
    const result = uudecode(catBlock);
    expect(result.valid).toBe(true);
    expect(result.output).toBe('Cat');
    expect(result.filename).toBe('file');
    expect(result.mode).toBe('644');
    expect(result.byteCount).toBe(3);
  });

  it('还原 89 字节多行文本并与 Python 往返一致', () => {
    const text =
      'The quick brown fox jumps over the lazy dog.\n' +
      'The quick brown fox jumps over the lazy dog.';
    const result = uudecode(uuencode(text).output);
    expect(result.valid).toBe(true);
    expect(result.output).toBe(text);
    expect(result.byteCount).toBe(89);
  });

  it('空输入块解码为空字符串', () => {
    const result = uudecode('begin 644 file\n`\nend\n');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('');
    expect(result.byteCount).toBe(0);
  });

  it('同时接受空格（0x20）作为 6 位零值与反引号（0x60）', () => {
    // Python b2a_uu 形式：所有 6 位零值（含结束行）都用空格表示
    const spacedBlock =
      'begin 644 file\n' +
      "M5&AE('%U:6-K(&)R;W=N(&9O>\"!J=6UP<R!O=F5R('1H92!L87IY(&1O9RX*\n" +
      "L5&AE('%U:6-K(&)R;W=N(&9O>\"!J=6UP<R!O=F5R('1H92!L87IY(&1O9RX \n" +
      ' \n' + // 长度 0 的行用单个空格表示
      'end\n';
    const result = uudecode(spacedBlock);
    expect(result.valid).toBe(true);
    expect(result.output).toBe(
      'The quick brown fox jumps over the lazy dog.\n' +
        'The quick brown fox jumps over the lazy dog.',
    );
    expect(result.byteCount).toBe(89);

    // 含行内空格零值的 1 字节向量（Python: b2a_uu(b'C') === '!0P  '）
    const oneByte = uudecode('begin 644 f\n!0P  \n`\nend\n');
    expect(oneByte.valid).toBe(true);
    expect(oneByte.output).toBe('C');
  });

  it('含中文（多字节 UTF-8）的文本编码→解码往返一致', () => {
    const text = '你好，世界！';
    const encoded = uuencode(text);
    // Python 向量：binascii.b2a_uu('你好，世界！'.encode('utf-8'))
    expect(encoded.output).toContain('2Y+V@Y:6][[R,Y+B6YY6,[[R!');
    expect(encoded.byteCount).toBe(18);
    const decoded = uudecode(encoded.output);
    expect(decoded.valid).toBe(true);
    expect(decoded.output).toBe(text);
  });

  it('忽略 begin 之前的杂行，并对 end 之后的内容给出 warning', () => {
    const noisy = 'this is not uuencoded data\nbegin 644 file\n#0V%T\n`\nend\njunk after end\n';
    const result = uudecode(noisy);
    expect(result.valid).toBe(true);
    expect(result.output).toBe('Cat');
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain('end 行之后');
  });

  it('兼容 CRLF 换行', () => {
    const result = uudecode('begin 644 file\r\n#0V%T\r\n`\r\nend\r\n');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('Cat');
  });

  it('缺少 begin 行报错', () => {
    const result = uudecode('#0V%T\n`\nend\n');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('begin');
  });

  it('缺少 end 行报错', () => {
    const result = uudecode('begin 644 file\n#0V%T\n`\n');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('end');
  });

  it('编码区出现非法字符（如 ~）报错', () => {
    const result = uudecode('begin 644 file\n#0V~T\n`\nend\n');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('非法字符');
  });

  it('长度字符声称的字节数与可用编码字符不符时报错', () => {
    const result = uudecode('begin 644 file\nM0V%T\n`\nend\n');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('长度字符');
  });
});
