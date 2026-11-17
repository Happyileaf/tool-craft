import { describe, it, expect } from 'vitest';
import {
  GS1_TYPES,
  computeGs1CheckDigit,
  explainSs1ExtensionDigit,
  processGs1Batch,
  processGs1Code,
} from './gs1';

describe('computeGs1CheckDigit GS1 Mod 10', () => {
  it('SSCC 17 位本体算出校验位（GS1 通用示例 00123456000000001 → 8）', () => {
    // 加权和可复现：自右向左 3/1 交替
    const body = '00123456000000001';
    const check = computeGs1CheckDigit(body);
    let expected = 0;
    for (let i = 0; i < body.length; i += 1) {
      expected += i % 2 === 0 ? Number(body[body.length - 1 - i]) * 3 : Number(body[body.length - 1 - i]);
    }
    expect(check).toBe(String((10 - (expected % 10)) % 10));
    expect(check).toBe('8');
  });

  it('GTIN-14 13 位本体 1234567890123 → 校验位 1', () => {
    expect(computeGs1CheckDigit('1234567890123')).toBe('1');
  });

  it('GTIN-13 本体 400638133393 → 校验位 1（公开 EAN-13 样例 4006381333931）', () => {
    expect(computeGs1CheckDigit('400638133393')).toBe('1');
  });

  it('GTIN-12 本体 03600029145 → 校验位 2（公开 UPC-A 样例 036000291452）', () => {
    expect(computeGs1CheckDigit('03600029145')).toBe('2');
  });

  it('GTIN-8 本体 9638507 → 校验位 4（公开 EAN-8 样例 96385074）', () => {
    expect(computeGs1CheckDigit('9638507')).toBe('4');
  });
});

describe('processGs1Code 补全与核对', () => {
  it('SSCC 17 位补全为 18 位并加 AI(00) 包装', () => {
    const result = processGs1Code('SSCC', '00123456000000001');
    expect(result.errors).toEqual([]);
    expect(result.normalized).toBe('001234560000000018');
    expect(result.checkDigit).toBe('8');
    expect(result.valid).toBeNull();
    expect(result.aiForm).toBe('00001234560000000018');
    expect(result.humanReadable).toBe('(00)001234560000000018');
  });

  it('SSCC 18 位完整编码校验通过', () => {
    const result = processGs1Code('SSCC', '001234560000000018');
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('SSCC 错误校验位被识别', () => {
    const result = processGs1Code('SSCC', '001234560000000010');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('校验位错误'))).toBe(true);
  });

  it('GTIN-14 补全并加 AI(01) 包装', () => {
    const result = processGs1Code('GTIN14', '1234567890123');
    expect(result.normalized).toBe('12345678901231');
    expect(result.aiForm).toBe('0112345678901231');
    expect(result.humanReadable).toBe('(01)12345678901231');
  });

  it('GTIN-13 无 AI，humanReadable 与 aiForm 回退为纯编码', () => {
    const result = processGs1Code('GTIN13', '4006381333931');
    expect(result.valid).toBe(true);
    expect(GS1_TYPES.GTIN13.ai).toBeNull();
    expect(result.aiForm).toBe('4006381333931');
    expect(result.humanReadable).toBe('4006381333931');
  });

  it('自动去除连字符与空白', () => {
    const result = processGs1Code('GTIN8', '9638 507-4');
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('96385074');
  });

  it('长度错误按类型期望长度报错', () => {
    const result = processGs1Code('SSCC', '12345');
    expect(result.errors.some((each) => each.includes('17 位') && each.includes('18 位'))).toBe(true);
  });

  it('非数字字符报错', () => {
    const result = processGs1Code('GTIN14', '123456789012A');
    expect(result.errors.some((each) => each.includes('非数字'))).toBe(true);
  });

  it('空输入报错', () => {
    expect(processGs1Code('GTIN14', '   ').errors.some((each) => each.includes('不能为空'))).toBe(true);
  });
});

describe('explainSs1ExtensionDigit SSCC 扩展位', () => {
  it('普通扩展位给出包装类型说明', () => {
    expect(explainSs1ExtensionDigit('001234560000000018')).toContain('扩展位 0');
  });

  it('扩展位 9 提示保留用途', () => {
    const result = explainSs1ExtensionDigit('901234560000000018');
    expect(result).toContain('保留');
  });

  it('非法长度返回 null', () => {
    expect(explainSs1ExtensionDigit('123')).toBeNull();
  });
});

describe('processGs1Batch 批量', () => {
  it('支持类型前缀与默认类型混合，统计成功失败', () => {
    const raw = [
      'SSCC,00123456000000001',
      'GTIN14,12345678901231',
      '4006381333931',
      'GTIN8,96385074',
      'BAD,12',
    ].join('\n');
    const batch = processGs1Batch(raw, 'GTIN13');
    expect(batch.total).toBe(5);
    expect(batch.okCount).toBe(4);
    expect(batch.failCount).toBe(1);
    expect(batch.rows[0]!.kind).toBe('SSCC');
    // 无类型前缀的纯 GTIN-13 走默认类型
    expect(batch.rows[2]!.kind).toBe('GTIN13');
    expect(batch.rows[2]!.valid).toBe(true);
    // 未知类型前缀回退为整串当编码，长度非法而失败
    expect(batch.rows[4]!.errors.length).toBeGreaterThan(0);
  });

  it('空行跳过', () => {
    const batch = processGs1Batch('\n  \nGTIN8,96385074\n');
    expect(batch.total).toBe(1);
    expect(batch.okCount).toBe(1);
  });
});
