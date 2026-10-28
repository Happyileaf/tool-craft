import { describe, expect, it } from 'vitest';
import {
  USCC_CHARSET,
  USCC_LENGTH,
  computeCheckCode,
  normalizeUscc,
  validateUscc,
} from './uscc';

/** 百度在线网络技术（北京）有限公司的公开统一社会信用代码，合法向量 */
const KNOWN_VALID = '91110108551385082Q';

describe('normalizeUscc', () => {
  it('去除首尾空白并转大写', () => {
    expect(normalizeUscc('  91110108551385082q ')).toBe(KNOWN_VALID);
  });

  it('空白输入返回空串', () => {
    expect(normalizeUscc('   ')).toBe('');
  });
});

describe('computeCheckCode', () => {
  it('对已知合法代码计算出 Q', () => {
    expect(computeCheckCode(KNOWN_VALID.slice(0, 17))).toBe('Q');
  });

  it('主体长度必须为 17 位', () => {
    expect(() => computeCheckCode('911101085513850')).toThrow(/17 位/);
  });

  it('主体含非法字符时抛出错误', () => {
    // 第 3 位起为行政区划，此处构造含禁用字符 I 的主体
    expect(() => computeCheckCode('9I110108551385082Q'.slice(0, 17))).toThrow(
      /字符集/,
    );
  });
});

describe('validateUscc', () => {
  it('合法代码解析全部字段', () => {
    const result = validateUscc(KNOWN_VALID);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.parts).toMatchObject({
      departmentCode: '9',
      departmentName: '市场监管（工商）',
      categoryCode: '1',
      categoryName: '企业',
      regionCode: '110108',
      provinceName: '北京市',
      subjectId: '551385082',
      checkCode: 'Q',
      expectedCheckCode: 'Q',
    });
  });

  it('小写与首尾空白容错后仍判为合法', () => {
    expect(validateUscc(` ${KNOWN_VALID.toLowerCase()} `).valid).toBe(true);
  });

  it('空输入返回无错误的失败态', () => {
    expect(validateUscc('   ')).toEqual({ valid: false, error: null });
  });

  it('长度不足时报错并指明位数', () => {
    const result = validateUscc('9111010855138508');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/必须为 18 位/);
    expect(result.parts).toBeUndefined();
  });

  it('超长时报错', () => {
    const result = validateUscc(KNOWN_VALID + 'X');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('19 位');
  });

  it('含禁用字符 I/O/Z/S/V 时报错并指明位置', () => {
    // 用合法代码主体改第 9 位为禁用字符 S，并补任意合法末位
    const bad = `${KNOWN_VALID.slice(0, 8)}S${KNOWN_VALID.slice(9)}`;
    const result = validateUscc(bad);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/第 9 位/);
    expect(result.error).toContain('S');
  });

  it('末位校验码错误时给出正确值且仍返回解析字段', () => {
    const bad = KNOWN_VALID.slice(0, 17) + 'R';
    const result = validateUscc(bad);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/校验码错误/);
    expect(result.error).toContain('R');
    expect(result.error).toContain('Q');
    expect(result.parts?.checkCode).toBe('R');
    expect(result.parts?.expectedCheckCode).toBe('Q');
  });

  it('识别事业单位（12）与北京市区划', () => {
    // 构造 12 开头主体并算出合法校验位
    const body = '12110000000000001';
    const check = computeCheckCode(body);
    const result = validateUscc(body + check);
    expect(result.valid).toBe(true);
    expect(result.parts?.departmentName).toBe('机构编制');
    expect(result.parts?.categoryName).toBe('事业单位');
    expect(result.parts?.provinceName).toBe('北京市');
  });

  it('识别社会团体（51）与上海市区划', () => {
    const body = '51310101000000001';
    const code = body + computeCheckCode(body);
    const result = validateUscc(code);
    expect(result.valid).toBe(true);
    expect(result.parts?.categoryName).toBe('社会团体');
    expect(result.parts?.provinceName).toBe('上海市');
  });

  it('无法识别的省级区划返回 null 而不报错', () => {
    const body = '91990000123456789';
    const code = body + computeCheckCode(body);
    const result = validateUscc(code);
    expect(result.valid).toBe(true);
    expect(result.parts?.provinceName).toBeNull();
  });

  it('未收录的部门与类别给出兜底名称', () => {
    const body = 'H1110000000000001';
    const code = body + computeCheckCode(body);
    const result = validateUscc(code);
    expect(result.valid).toBe(true);
    expect(result.parts?.departmentName).toBe('未收录的登记管理部门');
    expect(result.parts?.categoryName).toBe('未收录的机构类别');
  });
});

describe('字符集常量', () => {
  it('长度为 31 且不含禁用字母', () => {
    expect(USCC_CHARSET).toHaveLength(31);
    for (const forbidden of ['I', 'O', 'Z', 'S', 'V']) {
      expect(USCC_CHARSET).not.toContain(forbidden);
    }
    expect(USCC_LENGTH).toBe(18);
  });
});
