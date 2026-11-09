import { describe, expect, it } from 'vitest';
import {
  bytesToHex,
  compressionPercent,
  decodePackBits,
  decodeTextLine,
  encodePackBits,
  encodeTextLine,
  runRle,
  textToBytes,
} from './rle';

describe('文本 RLE 单行编码 encodeTextLine', () => {
  it('单字符不压缩、重复字符输出「计数+字符」', () => {
    expect(encodeTextLine('A')).toBe('A');
    expect(encodeTextLine('AAAA')).toBe('4A');
    expect(encodeTextLine('AAAABBBCCD')).toBe('4A3B2CD');
    expect(encodeTextLine('')).toBe('');
  });

  it('支持 Unicode 码点与 emoji，按字符而非 UTF-16 代理对计数', () => {
    expect(encodeTextLine('中中中')).toBe('3中');
    expect(encodeTextLine('😀😀')).toBe('2😀');
  });
});

describe('文本 RLE 单行解码 decodeTextLine', () => {
  it('还原计数前缀，无计数的单字符按 1 次处理', () => {
    expect(decodeTextLine('4A3B2CD')).toEqual({ text: 'AAAABBBCCD' });
    expect(decodeTextLine('ABC')).toEqual({ text: 'ABC' });
  });

  it('覆盖错误分支：末尾计数缺字符、计数为 0、计数超上限', () => {
    expect(decodeTextLine('AB12')).toMatchObject({ error: expect.stringContaining('编码不完整') });
    expect(decodeTextLine('0A')).toMatchObject({ error: expect.stringContaining('计数不能为 0') });
    const huge = decodeTextLine('999999999A');
    expect(huge).toMatchObject({ error: expect.stringContaining('安全上限') });
  });
});

describe('文本模式 runRle 多行处理', () => {
  it('多行编码解码往返一致并保留空行', () => {
    const input = 'AAAABBB\n\nCCD';
    const encoded = runRle(input, 'text', 'encode');
    expect(encoded.output).toBe('4A3B\n\n2CD');
    expect(encoded.error).toBeNull();
    const decoded = runRle(encoded.output, 'text', 'decode');
    expect(decoded.output).toBe(input);
    expect(decoded.warnings).toEqual([]);
  });

  it('解码非法行时逐行给出带行号的中文警告且保留原行', () => {
    const result = runRle('4A\n12\nBC', 'text', 'decode');
    expect(result.output.split('\n')[0]).toBe('AAAA');
    expect(result.output.split('\n')[1]).toBe('12');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('第 2 行');
  });
});

describe('字节级 RLE', () => {
  it('编码为「计数字节+数据字节」对并以十六进制输出', () => {
    const result = runRle('AAAAB', 'byte', 'encode');
    // 04 41（A×4）+ 01 42（B×1）
    expect(result.output).toBe('04410142');
    expect(result.originalSize).toBe(5);
    expect(result.resultSize).toBe(4);
  });

  it('超过 255 的游程自动分块', () => {
    const result = runRle('A'.repeat(256), 'byte', 'encode');
    expect(result.output.slice(0, 4)).toBe('ff41');
    expect(result.output.slice(4)).toBe('0141');
    const back = runRle(result.output, 'byte', 'decode');
    expect(back.output).toBe('A'.repeat(256));
  });

  it('编解码往返支持中文 UTF-8 多字节序列', () => {
    const input = '你好，RLE！'.repeat(4);
    const encoded = runRle(input, 'byte', 'encode');
    const decoded = runRle(encoded.output, 'byte', 'decode');
    expect(decoded.output).toBe(input);
  });

  it('解码错误分支：非法 hex、奇数长度、落单字节、计数为 0', () => {
    expect(runRle('xyz0', 'byte', 'decode').error).toContain('0-9');
    expect(runRle('abc', 'byte', 'decode').error).toContain('偶数');
    expect(runRle('044101', 'byte', 'decode').error).toContain('成对出现');
    expect(runRle('0041', 'byte', 'decode').error).toContain('计数字节为 0x00');
  });

  it('非法 UTF-8 还原结果给出中文错误', () => {
    // 0x ff 不是合法 UTF-8 起始字节
    const result = runRle('01ff', 'byte', 'decode');
    expect(result.error).toContain('UTF-8');
  });
});

describe('Apple PackBits', () => {
  it('重复游程编码为 -(n-1) 标记 + 数据字节', () => {
    expect(bytesToHex(encodePackBits('AAAA'))).toBe('fd41');
    expect(bytesToHex(encodePackBits('AAA'))).toBe('fe41');
  });

  it('字面量段编码为 (n-1) 标记 + n 个字节', () => {
    // 两连同值并入字面量：ABCAA → 标记 4 + 5 字节
    expect(bytesToHex(encodePackBits('ABCAA'))).toBe('044142434141');
  });

  it('128 个重复字节的标记为 0x81，超长游程分组且残余转字面量', () => {
    const payload128 = encodePackBits('A'.repeat(128));
    expect(payload128[0]).toBe(0x81);
    expect(payload128[1]).toBe(0x41);

    const payload130 = encodePackBits('A'.repeat(130));
    expect(payload130[0]).toBe(0x81);
    // 残余 2 个字节：标记 1 + 41 41
    expect(Array.from(payload130.slice(2))).toEqual([0x01, 0x41, 0x41]);
    expect(decodePackBits(payload130)).toEqual(textToBytes('A'.repeat(130)));
  });

  it('decodePackBits 严格处理字面量、重复游程与 0x80 无操作字节', () => {
    // fe 41（AAA） + 01 42 43（BC） + 80（nop）
    const payload = new Uint8Array([0xfe, 0x41, 0x01, 0x42, 0x43, 0x80]);
    expect(decodePackBits(payload)).toEqual(textToBytes('AAABC'));
  });

  it('截断载荷与缺失数据字节抛出可读错误', () => {
    expect(() => decodePackBits(new Uint8Array([0x02, 0x41]))).toThrow(/截断/);
    expect(() => decodePackBits(new Uint8Array([0xfe]))).toThrow(/缺少数据字节/);
  });

  it('runRle 模式下编解码往返，并把异常收敛为结果对象', () => {
    const input = 'AAAA-BBBB-CCCC-随机文本XYZ'.repeat(3);
    const encoded = runRle(input, 'packbits', 'encode');
    expect(encoded.error).toBeNull();
    const decoded = runRle(encoded.output, 'packbits', 'decode');
    expect(decoded.output).toBe(input);

    const truncated = runRle('fe', 'packbits', 'decode');
    expect(truncated.error).toContain('缺少数据字节');
    const badHex = runRle('xyz0', 'packbits', 'decode');
    expect(badHex.error).toContain('Hex');
  });
});

describe('统计与边界', () => {
  it('压缩率：可压缩为正值、膨胀为负值、空输入为 0', () => {
    const compressed = runRle('A'.repeat(20), 'byte', 'encode');
    // 20 字节 → 2 字节，节省 90%
    expect(compressed.ratioPercent).toBeCloseTo(90, 5);
    const expanded = runRle('ABCDE', 'byte', 'encode');
    expect(expanded.ratioPercent).toBeCloseTo(-100, 5);
    expect(compressionPercent(5, 0)).toBe(0);
  });

  it('空输入返回空结果且不报错', () => {
    for (const mode of ['text', 'byte', 'packbits'] as const) {
      const result = runRle('', mode, 'encode');
      expect(result.output).toBe('');
      expect(result.error).toBeNull();
      expect(result.originalSize).toBe(0);
    }
  });
});
