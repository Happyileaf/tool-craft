import { describe, it, expect } from 'vitest';
import { validateBic, validateBicBatch, SAMPLE_BICS } from './bic';

describe('validateBic 8 位主代码', () => {
  it('DEUTDEFF 解析为银行/国家/地区三段且分行码补 XXX', () => {
    const result = validateBic('DEUTDEFF');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.parsed).not.toBeNull();
    expect(result.parsed!.bankCode).toBe('DEUT');
    expect(result.parsed!.countryCode).toBe('DE');
    expect(result.parsed!.locationCode).toBe('FF');
    expect(result.parsed!.branchCode).toBe('XXX');
    expect(result.parsed!.hasBranch).toBe(false);
  });

  it('小写输入自动转大写', () => {
    const result = validateBic('deutdeff');
    expect(result.valid).toBe(true);
    expect(result.parsed!.normalized).toBe('DEUTDEFF');
  });

  it('首尾空白被裁剪', () => {
    expect(validateBic('  CHASUS33  ').valid).toBe(true);
  });
});

describe('validateBic 11 位完整代码', () => {
  it('DEUTDEFF500 解析出分行码 500', () => {
    const result = validateBic('DEUTDEFF500');
    expect(result.valid).toBe(true);
    expect(result.parsed!.branchCode).toBe('500');
    expect(result.parsed!.hasBranch).toBe(true);
  });

  it('显式 XXX 分行码给出主办公室警告且 hasBranch=false', () => {
    const result = validateBic('CHASUS33XXX');
    expect(result.valid).toBe(true);
    expect(result.parsed!.hasBranch).toBe(false);
    expect(result.warnings.some((each) => each.includes('XXX'))).toBe(true);
  });

  it('地区码第二位为 1 识别为独立连接成员', () => {
    const result = validateBic('ABCDGB21');
    expect(result.valid).toBe(true);
    expect(result.parsed!.locationCode).toBe('21');
    expect(result.parsed!.locationSemantics).toContain('独立连接');
    expect(result.parsed!.isTestCode).toBe(false);
  });

  it('地区码第二位为 0 识别为测试/培训代码并警告', () => {
    const result = validateBic('ABCDGB20');
    expect(result.valid).toBe(true);
    expect(result.parsed!.isTestCode).toBe(true);
    expect(result.warnings.some((each) => each.includes('测试'))).toBe(true);
  });

  it('XK 科索沃 SWIFT 专用国家码通过', () => {
    const result = validateBic('ABCDXKXX');
    expect(result.valid).toBe(true);
    expect(result.parsed!.countryCode).toBe('XK');
  });
});

describe('validateBic 非法输入', () => {
  it('空输入报错', () => {
    const result = validateBic('   ');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('不能为空'))).toBe(true);
  });

  it('长度非 8 或 11 报错并截断后续检查', () => {
    const seven = validateBic('DEUTDEF');
    expect(seven.valid).toBe(false);
    expect(seven.errors.some((each) => each.includes('长度非法'))).toBe(true);
    expect(seven.parsed).toBeNull();

    const twelve = validateBic('DEUTDEFF500X');
    expect(twelve.valid).toBe(false);
    expect(twelve.errors.some((each) => each.includes('长度非法'))).toBe(true);
  });

  it('银行代码含数字报错', () => {
    const result = validateBic('DEU1DEFF');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('银行代码'))).toBe(true);
  });

  it('国家码非 ISO 3166-1 alpha-2 报错', () => {
    const result = validateBic('ABCDZZXX');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('ISO 3166'))).toBe(true);
  });

  it('国家码含数字报格式错误', () => {
    const result = validateBic('ABCD12XX');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('国家码'))).toBe(true);
  });

  it('地区码含非法符号报错', () => {
    const result = validateBic('DEUTDE-F');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('地区码'))).toBe(true);
  });

  it('分行码含非法符号报错', () => {
    const result = validateBic('DEUTDEFF5-0');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('分行码'))).toBe(true);
  });

  it('含空格报错', () => {
    const result = validateBic('DEUT DEFF');
    expect(result.valid).toBe(false);
    expect(result.errors.some((each) => each.includes('空格'))).toBe(true);
  });

  it('多个错误同时收集', () => {
    const result = validateBic('1234ZZ0-');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateBicBatch 批量', () => {
  it('逐行校验并统计有效/无效数量，空行跳过', () => {
    const raw = ['DEUTDEFF', '', 'ABCDZZXX', 'deutdeff500', '   ', 'BAD'].join('\n');
    const batch = validateBicBatch(raw);
    expect(batch.total).toBe(4);
    expect(batch.validCount).toBe(2);
    expect(batch.invalidCount).toBe(2);
    expect(batch.rows[0]!.line).toBe(1);
    expect(batch.rows[1]!.line).toBe(3);
    expect(batch.rows[2]!.input).toBe('deutdeff500');
  });

  it('空文本返回零行', () => {
    const batch = validateBicBatch('\n  \n');
    expect(batch.rows).toEqual([]);
    expect(batch.total).toBe(0);
  });
});

describe('SAMPLE_BICS 演示数据全部合法', () => {
  it('内置示例全部通过校验', () => {
    for (const sample of SAMPLE_BICS) {
      expect(validateBic(sample.bic).valid).toBe(true);
    }
  });
});
