import { describe, expect, it } from 'vitest';
import {
  computeChecksum,
  decodeAscii,
  fixChecksums,
  parseSrecord,
  toHexAddress,
  toHexByte,
} from './srecord';

/** 手工构造并预先验算的合法向量（校验和均由 computeChecksum 规则手工核验） */
const S0_HEADER = 'S00C000068656C6C6F5F533139C3';
const S1_DATA_A = 'S1130000214601360121470136007EFE09D219013D';
const S1_DATA_B = 'S1130010214601360121470136007EFE09D219022C';
const S1_DATA_C = 'S1070020DEADBEEFA0';
const S5_COUNT_3 = 'S50500000003F7';
const S9_END = 'S9030000FC';
const S2_DATA = 'S208010000DEADBEEFBE';
const S8_END = 'S804000000FB';
const S3_DATA = 'S307FFFFFFF0AABBA6';
const S7_END = 'S70500000000FA';
const S6_COUNT_2 = 'S607000000000002F6';
const S4_RESERVED = 'S40500001234B4';

/** S1_DATA_B 的校验和被故意破坏（末字节 2C → 2D） */
const S1_DATA_B_BROKEN = 'S1130010214601360121470136007EFE09D219022D';

describe('parseSrecord - 手工向量与基础解析', () => {
  it('S0 头记录：校验和有效、expectedChecksum=0xC3、ASCII 头解码为 hello_S19', () => {
    const result = parseSrecord(S0_HEADER);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record).toBeDefined();
    expect(record?.type).toBe('S0');
    expect(record?.typeName).toBe('头部记录');
    expect(record?.byteCount).toBe(0x0c);
    expect(record?.address).toBe(0x0000);
    expect(record?.addressByteWidth).toBe(2);
    expect(record?.data).toHaveLength(9);
    expect(record?.checksum).toBe(0xc3);
    expect(record?.expectedChecksum).toBe(0xc3);
    expect(record?.checksumStatus).toBe('valid');
    expect(record?.dataAscii).toBe('hello_S19');
    expect(record?.absoluteAddress).toBeNull();
    expect(result.summary.headerRecordCount).toBe(1);
  });

  it('S1 数据记录：byteCount=0x13、16 个数据字节、2 字节地址、absoluteAddress 等于地址', () => {
    const result = parseSrecord(S1_DATA_A);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S1');
    expect(record?.typeName).toBe('16位地址数据');
    expect(record?.byteCount).toBe(0x13);
    expect(record?.address).toBe(0x0000);
    expect(record?.addressByteWidth).toBe(2);
    expect(record?.data).toHaveLength(16);
    expect(record?.data[0]).toBe(0x21);
    expect(record?.data[15]).toBe(0x01);
    expect(record?.checksum).toBe(0x3d);
    expect(record?.absoluteAddress).toBe(0x0000);
    expect(record?.dataAscii).toBeNull();
  });

  it('S9 终止记录：零载荷、起始地址 0、startRecordCount/endRecordCount 统计正确', () => {
    const result = parseSrecord(S9_END);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S9');
    expect(record?.typeName).toBe('16位起始地址终止');
    expect(record?.data).toEqual([]);
    expect(record?.checksum).toBe(0xfc);
    expect(result.summary.startAddress).toBe(0);
    expect(result.summary.startRecordCount).toBe(1);
    expect(result.summary.endRecordCount).toBe(1);
    expect(result.summary.endAtEnd).toBe(true);
  });

  it('S2 记录：3 字节地址 0x010000、宽度 3', () => {
    const result = parseSrecord(S2_DATA);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S2');
    expect(record?.addressByteWidth).toBe(3);
    expect(record?.address).toBe(0x010000);
    expect(record?.absoluteAddress).toBe(0x010000);
    expect(record?.data).toEqual([0xde, 0xad, 0xbe, 0xef]);
    expect(record?.checksum).toBe(0xbe);
  });

  it('S3 记录：4 字节地址 0xFFFFFFF0 以无符号数还原（不出现负数）', () => {
    const result = parseSrecord(S3_DATA);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S3');
    expect(record?.addressByteWidth).toBe(4);
    expect(record?.address).toBe(0xfffffff0);
    expect(record?.address).toBeGreaterThan(0);
    expect(toHexAddress(record?.address ?? 0)).toBe('FFFFFFF0');
    expect(record?.data).toEqual([0xaa, 0xbb]);
    expect(record?.checksum).toBe(0xa6);
  });

  it('S7 终止记录：4 字节宽度、起始地址解析正确', () => {
    const result = parseSrecord(S7_END);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S7');
    expect(record?.typeName).toBe('32位起始地址终止');
    expect(record?.addressByteWidth).toBe(4);
    expect(result.summary.startAddress).toBe(0);
  });
});

describe('parseSrecord - 格式识别与汇总统计', () => {
  it('S19 最小文件：S1 + S9，format=S19、endAtEnd=true、地址范围与字节数正确', () => {
    const result = parseSrecord([S1_DATA_A, S9_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.format).toBe('S19');
    expect(result.summary.endAtEnd).toBe(true);
    expect(result.summary.dataRecordCount).toBe(1);
    expect(result.summary.totalDataBytes).toBe(16);
    expect(result.summary.minAddress).toBe(0x0000);
    expect(result.summary.maxAddress).toBe(0x000f);
    expect(result.summary.totalLines).toBe(2);
    expect(result.summary.typeDistribution['S1']).toBe(1);
    expect(result.summary.typeDistribution['S9']).toBe(1);
  });

  it('S28 文件：S2 + S8，format=S28', () => {
    const result = parseSrecord([S2_DATA, S8_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.summary.format).toBe('S28');
    expect(result.summary.endAtEnd).toBe(true);
    expect(result.records[0]?.addressByteWidth).toBe(3);
    expect(result.records[1]?.type).toBe('S8');
  });

  it('S37 文件：S3 + S7，format=S37', () => {
    const result = parseSrecord([S3_DATA, S7_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.summary.format).toBe('S37');
    expect(result.summary.endAtEnd).toBe(true);
    expect(result.records[0]?.addressByteWidth).toBe(4);
  });

  it('混合地址宽度：以出现的最高地址宽度数据记录为准（S1 + S2 → S28）', () => {
    const result = parseSrecord([S1_DATA_A, S2_DATA, S8_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.summary.format).toBe('S28');
  });

  it('无数据记录时 format 为 null，min/max 地址也为 null', () => {
    const result = parseSrecord(S9_END);
    expect(result.summary.format).toBeNull();
    expect(result.summary.minAddress).toBeNull();
    expect(result.summary.maxAddress).toBeNull();
  });

  it('S5 计数记录：declaredCount=3、countRecordCount=1', () => {
    const result = parseSrecord([S1_DATA_A, S1_DATA_B, S1_DATA_C, S5_COUNT_3, S9_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.declaredCount).toBe(3);
    expect(result.summary.countRecordCount).toBe(1);
  });

  it('S6 24 位计数记录：declaredCount=2', () => {
    const result = parseSrecord(S6_COUNT_2);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record?.type).toBe('S6');
    expect(record?.typeName).toBe('24位计数记录');
    expect(record?.addressByteWidth).toBe(3);
    expect(result.summary.declaredCount).toBe(2);
  });

  it('完整文件：S0 + 三条连续 S1 + S5 + S9 的全部汇总字段', () => {
    const text = [S0_HEADER, S1_DATA_A, S1_DATA_B, S1_DATA_C, S5_COUNT_3, S9_END].join('\n');
    const result = parseSrecord(text);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.totalLines).toBe(6);
    expect(result.summary.headerRecordCount).toBe(1);
    expect(result.summary.dataRecordCount).toBe(3);
    expect(result.summary.totalDataBytes).toBe(36);
    expect(result.summary.minAddress).toBe(0x0000);
    expect(result.summary.maxAddress).toBe(0x0023);
    expect(result.summary.format).toBe('S19');
    expect(result.records[0]?.dataAscii).toBe('hello_S19');
  });
});

describe('parseSrecord - 校验和错误', () => {
  it('破坏末字节：errors 非空、checksumStatus=invalid、expectedChecksum 给出正确值且记录保留', () => {
    const result = parseSrecord(S1_DATA_B_BROKEN);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.checksumStatus).toBe('invalid');
    expect(result.records[0]?.checksum).toBe(0x2d);
    expect(result.records[0]?.expectedChecksum).toBe(0x2c);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.lineNumber).toBe(1);
    expect(result.errors[0]?.reason).toContain('期望值 0x2C');
    expect(result.errors[0]?.reason).toContain('实际值 0x2D');
  });

  it('错误行不中断后续解析，错误列表按行号升序', () => {
    const result = parseSrecord([S1_DATA_B_BROKEN, S9_END].join('\n'));
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.records[1]?.type).toBe('S9');
    expect(result.records[1]?.checksumStatus).toBe('valid');
  });
});

describe('parseSrecord - 畸形行', () => {
  it('无 S 前缀：带行号报错并跳过', () => {
    const result = parseSrecord(['G1130000214601360121470136007EFE09D219013D', S9_END].join('\n'));
    expect(result.records).toHaveLength(1);
    expect(result.errors[0]?.lineNumber).toBe(1);
    expect(result.errors[0]?.reason).toContain('S');
  });

  it('奇数位 hex：报错并跳过', () => {
    const result = parseSrecord('S1130000214');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('非法十六进制字符');
  });

  it('非法 hex 字符：报错并跳过', () => {
    const result = parseSrecord('S1130000ZZZZ01360121470136007EFE09D219013D');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('非法十六进制字符');
  });

  it('byteCount 与实际载荷不符：报错并跳过', () => {
    // 声明 byteCount=0x14，实际只含 0x13 对应的载荷
    const result = parseSrecord('S1140000214601360121470136007EFE09D219013D');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('byteCount');
    expect(result.errors[0]?.reason).toContain('不符');
  });

  it('未知类型字符 SX：报错并跳过', () => {
    const result = parseSrecord('SX130000214601360121470136007EFE09D219013D');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('未知记录类型');
  });

  it('长度不足：报错并跳过', () => {
    const result = parseSrecord('S103');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('长度不足');
  });

  it('byteCount 小于「地址字节 + 校验和」最小长度：报错并跳过', () => {
    // 长度满足 10 字符下限，但 S3 的 byteCount=0x02 小于 4 字节地址 + 1 字节校验和
    const result = parseSrecord('S30200000000FF');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('最小长度');
  });

  it('任务书给出的 S00F...0A 示例本身 byteCount 与实际长度不符：按规范判为畸形行', () => {
    const result = parseSrecord('S00F000068656C6C6F5F5331390A');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('byteCount');
  });

  it('空字符串与纯空行：零记录零错误零警告', () => {
    const result = parseSrecord('\n  \n\r\n');
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.totalLines).toBe(0);
    expect(result.summary.minAddress).toBeNull();
    expect(result.summary.maxAddress).toBeNull();
  });

  it('CRLF 换行与首尾空白：正常解析且行号正确', () => {
    const result = parseSrecord(`  ${S1_DATA_A}\r\n${S9_END}  \r\n`);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.lineNumber).toBe(1);
    expect(result.records[1]?.lineNumber).toBe(2);
  });
});

describe('parseSrecord - 结构性警告', () => {
  it('S5 声明计数与实际数据记录数不符：给出警告', () => {
    const result = parseSrecord([S1_DATA_A, S5_COUNT_3, S9_END].join('\n'));
    expect(result.summary.declaredCount).toBe(3);
    expect(result.summary.dataRecordCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('计数记录声明');
  });

  it('缺少终止记录：给出警告', () => {
    const result = parseSrecord(S1_DATA_A);
    expect(result.summary.endRecordCount).toBe(0);
    expect(result.summary.endAtEnd).toBe(false);
    expect(result.warnings[0]).toContain('缺少终止记录');
  });

  it('唯一终止记录不在末尾：给出警告', () => {
    const result = parseSrecord([S9_END, S1_DATA_A].join('\n'));
    expect(result.summary.endRecordCount).toBe(1);
    expect(result.summary.endAtEnd).toBe(false);
    expect(result.warnings[0]).toContain('不在文件末尾');
  });

  it('多条终止记录：给出警告且 endAtEnd 为 false', () => {
    const result = parseSrecord([S9_END, S9_END].join('\n'));
    expect(result.summary.endRecordCount).toBe(2);
    expect(result.summary.endAtEnd).toBe(false);
    expect(result.warnings.some((warning) => warning.includes('2 条终止记录'))).toBe(true);
  });

  it('S4 保留类型：记录保留、校验和正常、同时给出保留类型警告', () => {
    const result = parseSrecord([S4_RESERVED, S9_END].join('\n'));
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.type).toBe('S4');
    expect(result.records[0]?.checksumStatus).toBe('valid');
    expect(result.warnings.some((warning) => warning.includes('S4'))).toBe(true);
  });
});

describe('fixChecksums - 整体往返', () => {
  it('含错误行的整段文本修复后重新解析 0 错误，且原本正确的行保持不变', () => {
    const text = [S0_HEADER, S1_DATA_A, S1_DATA_B_BROKEN, S1_DATA_C, S5_COUNT_3, S9_END].join(
      '\n',
    );
    const fixed = fixChecksums(text);
    const expected = [S0_HEADER, S1_DATA_A, S1_DATA_B, S1_DATA_C, S5_COUNT_3, S9_END].join('\n');
    expect(fixed).toBe(expected);

    const reparsed = parseSrecord(fixed);
    expect(reparsed.errors).toEqual([]);
    expect(reparsed.records).toHaveLength(6);
  });

  it('修复是幂等的；畸形行与空行原样保留，输出统一 LF 换行', () => {
    const text = `garbage\r\n${S1_DATA_B_BROKEN}\r\n\r\n${S9_END}\r\n`;
    const fixedOnce = fixChecksums(text);
    const fixedTwice = fixChecksums(fixedOnce);
    expect(fixedTwice).toBe(fixedOnce);
    const lines = fixedOnce.split('\n');
    expect(lines[0]).toBe('garbage');
    expect(lines[1]).toBe(S1_DATA_B);
    expect(lines[2]).toBe('');
    expect(parseSrecord(fixedOnce).records.every((record) => record.checksumStatus === 'valid')).toBe(
      true,
    );
  });
});

describe('辅助函数', () => {
  it('computeChecksum 手工向量：[0x00]→0xFF、[0xFF]→0x00、S0 载荷→0xC3、含 0x0F 前缀载荷→0xC0', () => {
    expect(computeChecksum([0x00])).toBe(0xff);
    expect(computeChecksum([0xff])).toBe(0x00);
    expect(
      computeChecksum([0x0c, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x5f, 0x53, 0x31, 0x39]),
    ).toBe(0xc3);
    expect(
      computeChecksum([
        0x0f, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x5f, 0x53, 0x31, 0x39,
      ]),
    ).toBe(0xc0);
  });

  it('toHexByte 与 toHexAddress：大写补零，地址宽度 4/6/8 与默认 8 位', () => {
    expect(toHexByte(0x0a)).toBe('0A');
    expect(toHexByte(255)).toBe('FF');
    expect(toHexAddress(0x0100)).toBe('00000100');
    expect(toHexAddress(0x0100, 4)).toBe('0100');
    expect(toHexAddress(0x123456, 6)).toBe('123456');
    expect(toHexAddress(0xfffffff0)).toBe('FFFFFFF0');
  });

  it('toHexAddress 对负数按 >>> 0 还原为 32 位无符号地址', () => {
    expect(toHexAddress(-1)).toBe('FFFFFFFF');
  });

  it('decodeAscii：可打印字符直出，0x00 / 0x7F 等不可打印字符替换为点', () => {
    expect(decodeAscii([0x48, 0x49])).toBe('HI');
    expect(decodeAscii([0x41, 0x00, 0x42, 0x7f, 0x20])).toBe('A.B. ');
    expect(decodeAscii([])).toBe('');
  });

  it('字节范围校验：越界 / 非整数输入抛出 RangeError', () => {
    expect(() => toHexByte(256)).toThrow(RangeError);
    expect(() => toHexByte(-1)).toThrow(RangeError);
    expect(() => computeChecksum([300])).toThrow(RangeError);
    expect(() => toHexAddress(Number.NaN)).toThrow(RangeError);
  });
});
