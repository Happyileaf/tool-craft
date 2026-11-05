import { describe, expect, it } from 'vitest';
import {
  computeChecksum,
  fixChecksums,
  parseIntelHex,
  recalcChecksum,
  toHexAddress,
  toHexByte,
  toHexWord,
} from './intelHex';

/** 任务指定的真实数据向量（8051 风格 16 字节数据记录） */
const REAL_DATA_LINE = ':10010000214601360121470136007EFE09D2190140';
/** 任务指定的真实 EOF 向量 */
const REAL_EOF_LINE = ':00000001FF';
/** 任务指定的 type 04 扩展线性地址向量 */
const REAL_LINEAR_BASE_LINE = ':020000040000FA';

describe('parseIntelHex - 真实向量与基础解析', () => {
  it('真实数据记录：校验和通过、byteCount=0x10、addr=0x0100、type=00、16 个数据字节', () => {
    const result = parseIntelHex(REAL_DATA_LINE);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    const record = result.records[0];
    expect(record).toBeDefined();
    expect(record?.byteCount).toBe(0x10);
    expect(record?.address).toBe(0x0100);
    expect(record?.type).toBe(0);
    expect(record?.typeName).toBe('数据');
    expect(record?.data).toHaveLength(16);
    expect(record?.data[0]).toBe(0x21);
    expect(record?.data[15]).toBe(0x01);
    expect(record?.checksum).toBe(0x40);
    expect(record?.checksumStatus).toBe('valid');
  });

  it('真实 EOF 记录 :00000001FF：type=01、零载荷、校验和通过', () => {
    const result = parseIntelHex(REAL_EOF_LINE);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record).toBeDefined();
    expect(record?.type).toBe(1);
    expect(record?.typeName).toBe('文件结束（EOF）');
    expect(record?.byteCount).toBe(0);
    expect(record?.data).toEqual([]);
    expect(record?.checksum).toBe(0xff);
    expect(result.summary.eofCount).toBe(1);
    expect(result.summary.eofAtEnd).toBe(true);
  });

  it('真实 type 04 扩展线性地址 :020000040000FA：解析为基址 0x0000', () => {
    const result = parseIntelHex(REAL_LINEAR_BASE_LINE);
    expect(result.errors).toEqual([]);
    const record = result.records[0];
    expect(record).toBeDefined();
    expect(record?.type).toBe(4);
    expect(record?.typeName).toBe('扩展线性地址');
    expect(record?.data).toEqual([0x00, 0x00]);
    expect(record?.checksum).toBe(0xfa);
  });

  it('完整文件：type 04 + 两条数据 + EOF，统计与类型分布正确', () => {
    const text = [
      ':020000041234B4',
      ':04001000DEADBEEFB4',
      ':03010000AABBCCCB',
      REAL_EOF_LINE,
    ].join('\n');
    const result = parseIntelHex(text);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.totalLines).toBe(4);
    expect(result.summary.dataRecordCount).toBe(2);
    expect(result.summary.totalDataBytes).toBe(7);
    expect(result.summary.typeDistribution['00']).toBe(2);
    expect(result.summary.typeDistribution['04']).toBe(1);
    expect(result.summary.typeDistribution['01']).toBe(1);
    expect(result.summary.minAddress).toBe(0x12340010);
    expect(result.summary.maxAddress).toBe(0x12340102);
  });
});

describe('parseIntelHex - 绝对地址计算', () => {
  it('扩展线性地址：绝对地址 = 基址 << 16 + 行内偏移', () => {
    const text = [':020000041234B4', ':04001000DEADBEEFB4', REAL_EOF_LINE].join('\n');
    const result = parseIntelHex(text);
    const dataRecord = result.records.find((record) => record.type === 0);
    expect(dataRecord?.absoluteAddress).toBe((0x1234 << 16) + 0x0010);
    expect(dataRecord?.absoluteAddress).toBe(0x12340010);
  });

  it('扩展段地址：绝对地址 = 段址 × 16 + 行内偏移', () => {
    const text = [':020000021000EC', ':020010001122BB', REAL_EOF_LINE].join('\n');
    const result = parseIntelHex(text);
    expect(result.errors).toEqual([]);
    const dataRecord = result.records.find((record) => record.type === 0);
    expect(dataRecord?.absoluteAddress).toBe(0x1000 * 16 + 0x0010);
    expect(dataRecord?.absoluteAddress).toBe(0x10010);
  });

  it('无基址记录时绝对地址等于 16 位行内地址', () => {
    const result = parseIntelHex([':02000000556643', REAL_EOF_LINE].join('\n'));
    const dataRecord = result.records[0];
    expect(dataRecord?.absoluteAddress).toBe(0x0000);
  });
});

describe('parseIntelHex - 校验和错误', () => {
  it('手动破坏真实向量的校验和字节：报错且携带行号、期望值与实际值，记录仍保留', () => {
    const broken = ':10010000214601360121470136007EFE09D2190141';
    const result = parseIntelHex(broken);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.checksumStatus).toBe('invalid');
    expect(result.records[0]?.checksum).toBe(0x41);
    expect(result.records[0]?.expectedChecksum).toBe(0x40);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.lineNumber).toBe(1);
    expect(result.errors[0]?.reason).toContain('期望值 0x40');
    expect(result.errors[0]?.reason).toContain('实际值 0x41');
  });

  it('错误行不中断后续解析，错误列表按行号升序', () => {
    const broken = ':10010000214601360121470136007EFE09D2190141';
    const text = [broken, REAL_EOF_LINE].join('\n');
    const result = parseIntelHex(text);
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.records[1]?.type).toBe(1);
    expect(result.records[1]?.checksumStatus).toBe('valid');
  });
});

describe('parseIntelHex - 畸形行', () => {
  it('非冒号开头行：带行号报错并跳过', () => {
    const result = parseIntelHex(['XXXX', REAL_EOF_LINE].join('\n'));
    expect(result.records).toHaveLength(1);
    expect(result.errors[0]?.lineNumber).toBe(1);
    expect(result.errors[0]?.reason).toContain('冒号');
  });

  it('非法十六进制字符：报错并跳过', () => {
    const result = parseIntelHex(':10010000214601360121470136007EFE09D21901ZZ');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.lineNumber).toBe(1);
    expect(result.errors[0]?.reason).toContain('非法十六进制字符');
  });

  it('长度不足：报错并跳过', () => {
    const result = parseIntelHex(':1001');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('长度不足');
  });

  it('声明字节数与实际载荷不符：报错并跳过', () => {
    // 声明 LL=0x10（16 字节），实际只给 1 个数据字节
    const result = parseIntelHex(':1001000041AF');
    expect(result.records).toEqual([]);
    expect(result.errors[0]?.reason).toContain('声明字节数为 16');
    expect(result.errors[0]?.reason).toContain('不符');
  });
});

describe('parseIntelHex - EOF 检查与边界', () => {
  it('缺少 EOF：给出警告', () => {
    const result = parseIntelHex(':0400000001020304F2');
    expect(result.summary.eofCount).toBe(0);
    expect(result.summary.eofAtEnd).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('缺少 EOF');
  });

  it('多条 EOF：给出警告且 eofAtEnd 为 false', () => {
    const text = [REAL_EOF_LINE, REAL_EOF_LINE].join('\n');
    const result = parseIntelHex(text);
    expect(result.summary.eofCount).toBe(2);
    expect(result.summary.eofAtEnd).toBe(false);
    expect(result.warnings.some((warning) => warning.includes('2 条 EOF'))).toBe(true);
  });

  it('唯一 EOF 不在末尾：给出警告', () => {
    const text = [REAL_EOF_LINE, ':0400000001020304F2'].join('\n');
    const result = parseIntelHex(text);
    expect(result.summary.eofCount).toBe(1);
    expect(result.summary.eofAtEnd).toBe(false);
    expect(result.warnings[0]).toContain('不在文件末尾');
  });

  it('空字符串与纯空行：零记录零错误零警告', () => {
    const result = parseIntelHex('\n  \n\r\n');
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.totalLines).toBe(0);
    expect(result.summary.minAddress).toBeNull();
    expect(result.summary.maxAddress).toBeNull();
  });

  it('CRLF 换行与首尾空白：正常解析且行号正确', () => {
    const result = parseIntelHex(`  ${REAL_DATA_LINE}\r\n${REAL_EOF_LINE}  \r\n`);
    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.lineNumber).toBe(1);
    expect(result.records[1]?.lineNumber).toBe(2);
  });
});

describe('recalcChecksum - 重新计算校验和', () => {
  it('被破坏的真实向量经 recalcChecksum 还原为原始正确行', () => {
    const broken = ':10010000214601360121470136007EFE09D2190141';
    expect(recalcChecksum(broken)).toBe(REAL_DATA_LINE);
  });

  it('用户编辑载荷后重新生成正确的大写 hex 校验和', () => {
    const edited = ':10010000224601360121470136007EFE09D2190140';
    expect(recalcChecksum(edited)).toBe(
      ':10010000224601360121470136007EFE09D219013F',
    );
  });

  it('结构非法的行抛出异常', () => {
    expect(() => recalcChecksum('not-a-hex-line')).toThrow('冒号');
    expect(() => recalcChecksum(':1001')).toThrow('长度不足');
  });
});

describe('fixChecksums - 整体往返', () => {
  it('含错误行的整段文本修复后全部校验通过，且正常行保持不变', () => {
    const broken = ':10010000214601360121470136007EFE09D2190141';
    const text = [REAL_LINEAR_BASE_LINE, broken, REAL_EOF_LINE].join('\n');
    const fixed = fixChecksums(text);
    const expected = [REAL_LINEAR_BASE_LINE, REAL_DATA_LINE, REAL_EOF_LINE].join('\n');
    expect(fixed).toBe(expected);

    const reparsed = parseIntelHex(fixed);
    expect(reparsed.errors).toEqual([]);
    expect(reparsed.records).toHaveLength(3);
  });

  it('修复是幂等的；畸形行与空行原样保留', () => {
    const broken = ':10010000214601360121470136007EFE09D2190141';
    const text = `garbage\n${broken}\n\n${REAL_EOF_LINE}\n`;
    const fixedOnce = fixChecksums(text);
    const fixedTwice = fixChecksums(fixedOnce);
    expect(fixedTwice).toBe(fixedOnce);
    const lines = fixedOnce.split('\n');
    expect(lines[0]).toBe('garbage');
    expect(lines[2]).toBe('');
    expect(parseIntelHex(fixedOnce).records.every((record) => record.checksumStatus === 'valid')).toBe(
      true,
    );
  });
});

describe('辅助函数', () => {
  it('computeChecksum 与格式化函数输出正确的大写补零 hex', () => {
    // :00000001FF 去掉校验和后的字节
    expect(computeChecksum([0x00, 0x00, 0x00, 0x01])).toBe(0xff);
    expect(toHexByte(0x0a)).toBe('0A');
    expect(toHexWord(0x0100)).toBe('0100');
    expect(toHexAddress(0x12340010)).toBe('12340010');
  });
});
