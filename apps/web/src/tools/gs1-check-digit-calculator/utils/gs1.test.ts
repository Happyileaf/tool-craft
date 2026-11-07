import { describe, expect, it } from 'vitest';
import {
  appendCheckDigit,
  buildItf14,
  buildSSCC,
  gs1CheckDigit,
  mod10Weighted,
  normalizeDigits,
  toGtin14,
  verifyCheckDigit,
  verifyLines,
} from './gs1';

describe('gs1CheckDigit 权威向量', () => {
  it('GS1 官方示例 629104150021 → 3', () => {
    const result = gs1CheckDigit('629104150021');
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.checkDigit).toBe(3);
      expect(result.weightedSum % 10).toBe(7);
      // 自右向左首位权重为 3
      expect(result.steps[0]!.weight).toBe(3);
      expect(result.steps[1]!.weight).toBe(1);
    }
  });

  it('401234567890 → 1', () => {
    const result = gs1CheckDigit('401234567890');
    if (!('error' in result)) {
      expect(result.checkDigit).toBe(1);
    }
  });

  it('mod10Weighted 与 gs1CheckDigit 默认权重一致', () => {
    expect(mod10Weighted('629104150021')).toBe(3);
    expect(mod10Weighted('401234567890')).toBe(1);
  });

  it('空白与连字符先清洗再计算', () => {
    const a = gs1CheckDigit('629 1041 5002 1');
    const b = gs1CheckDigit('629-1041-5002-1');
    if (!('error' in a) && !('error' in b)) {
      expect(a.checkDigit).toBe(3);
      expect(b.checkDigit).toBe(3);
    }
  });

  it('非法字符与空串返回带原因错误', () => {
    const letter = gs1CheckDigit('62910415A021');
    const empty = gs1CheckDigit('   ');
    expect('error' in letter).toBe(true);
    expect('error' in empty).toBe(true);
  });
});

describe('appendCheckDigit / verifyCheckDigit', () => {
  it('append 输出 payload + 校验位', () => {
    const result = appendCheckDigit('629104150021');
    expect(result.error).toBeNull();
    expect(result.output).toBe('6291041500213');
    expect(result.checkDigit).toBe(3);
  });

  it('正确编码 valid=true；篡改末位后 valid=false 且 expected/actual 不同', () => {
    const ok = verifyCheckDigit('6291041500213');
    expect(ok.valid).toBe(true);
    expect(ok.expected).toBe(3);
    expect(ok.actual).toBe(3);

    const tampered = verifyCheckDigit('6291041500210');
    expect(tampered.valid).toBe(false);
    expect(tampered.expected).toBe(3);
    expect(tampered.actual).toBe(0);
  });

  it('长度不足与非法字符返回 error 而非抛异常', () => {
    expect(verifyCheckDigit('7').error).toContain('2 位');
    expect(verifyCheckDigit('12A45').error).toContain('非数字');
  });
});

describe('buildSSCC', () => {
  it('扩展位 1 + 16 位主体生成 18 位且末位自洽', () => {
    const result = buildSSCC('1', '06141411234567');
    expect(result.error).toBeNull();
    expect(result.output).toHaveLength(18);
    expect(result.payload).toHaveLength(17);
    const again = gs1CheckDigit(result.payload);
    if (!('error' in again)) {
      expect(result.output.endsWith(String(again.checkDigit))).toBe(true);
    }
    expect(result.output).toBe('100061414112345672');
  });

  it('主体不足 16 位左侧补零', () => {
    const result = buildSSCC('0', '12345');
    expect(result.error).toBeNull();
    expect(result.payload).toBe('0' + '12345'.padStart(16, '0'));
  });

  it('扩展位非法 / 主体超长返回错误', () => {
    expect(buildSSCC('12', '1').error).toContain('扩展位');
    expect(buildSSCC('1', '1'.repeat(17)).error).toContain('16 位');
  });
});

describe('buildItf14', () => {
  it('包装指示符 1 生成 14 位，payload 首位为 1 且校验自洽', () => {
    const result = buildItf14('1', '061414199999');
    expect(result.error).toBeNull();
    expect(result.output).toHaveLength(14);
    expect(result.payload).toHaveLength(13);
    expect(result.payload.startsWith('1')).toBe(true);
    const again = gs1CheckDigit(result.payload);
    if (!('error' in again)) {
      expect(result.checkDigit).toBe(again.checkDigit);
    }
  });

  it('包装指示符非法 / 主体超长返回错误', () => {
    expect(buildItf14('', '1').error).toContain('包装指示符');
    expect(buildItf14('1', '1'.repeat(13)).error).toContain('12 位');
  });
});

describe('toGtin14', () => {
  it('GTIN-13 左侧补零到 14 位且校验位保持一致', () => {
    const result = toGtin14('6291041500213');
    expect(result.error).toBeNull();
    expect(result.output).toBe('06291041500213');
    expect(verifyCheckDigit(result.output).valid).toBe(true);
  });

  it('GTIN-12（UPC-A）补零转换后仍合法', () => {
    // 03600029145 为 11 位 payload，校验位 2 → 036000291452
    const appended = appendCheckDigit('03600029145');
    const result = toGtin14(appended.output);
    expect(result.error).toBeNull();
    expect(result.output).toHaveLength(14);
    expect(verifyCheckDigit(result.output).valid).toBe(true);
  });

  it('原码校验位不合法时拒绝转换', () => {
    const result = toGtin14('6291041500210');
    expect(result.error).toContain('校验位');
  });

  it('不支持的长度返回错误', () => {
    expect(toGtin14('12345').error).toContain('GTIN-8');
  });
});

describe('verifyLines 批量模式', () => {
  it('逐行输出结论，空行跳过，非法行标注原因', () => {
    const rows = verifyLines('6291041500213\n\n6291041500210\nBAD00');
    expect(rows).toHaveLength(3);
    expect(rows[0]!.valid).toBe(true);
    expect(rows[1]!.valid).toBe(false);
    expect(rows[1]!.detail).toContain('应为 3');
    expect(rows[2]!.valid).toBe(false);
    expect(rows[2]!.detail).toContain('非数字');
  });
});

describe('normalizeDigits', () => {
  it('剥离空格、制表符与连字符', () => {
    expect(normalizeDigits(' 1-2\t3 4 ')).toBe('1234');
  });
});
