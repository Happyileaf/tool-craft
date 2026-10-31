import { describe, it, expect } from 'vitest';
import {
  normalizeIban,
  validateIban,
  formatIbanGroups,
  IBAN_LENGTHS,
} from './iban';

describe('IBAN 校验：真实合法样例', () => {
  it('德国 DE89 3704 0044 0532 0130 00 通过', () => {
    const result = validateIban('DE89370400440532013000');
    expect(result.valid).toBe(true);
    expect(result.countryCode).toBe('DE');
    expect(result.reason).toBeUndefined();
  });

  it('英国 GB82 WEST 1234 5698 7654 32 通过', () => {
    const result = validateIban('GB82WEST12345698765432');
    expect(result.valid).toBe(true);
    expect(result.countryCode).toBe('GB');
  });

  it('法国 FR76 3000 6000 0112 3456 7890 189 通过', () => {
    const result = validateIban('FR7630006000011234567890189');
    expect(result.valid).toBe(true);
    expect(result.countryCode).toBe('FR');
  });
});

describe('IBAN 校验：非法输入', () => {
  it('校验位错误的同类串被拒', () => {
    const result = validateIban('DE88370400440532013000');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/mod 97-10/);
    expect(result.countryCode).toBe('DE');
  });

  it('长度不符被拒，reason 含期望长度与实际长度', () => {
    const result = validateIban('DE893704004405320130');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain(String(IBAN_LENGTHS.DE));
    expect(result.reason).toMatch(/实际 20 位/);
  });

  it('未知国家码被拒', () => {
    const result = validateIban('ZZ89370400440532013000');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/未知国家码 ZZ/);
    expect(result.countryCode).toBe('ZZ');
  });

  it('前两位不是字母时被拒', () => {
    const result = validateIban('1289370400440532013000');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/国家码/);
  });

  it('空串返回非法原因', () => {
    const result = validateIban('');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('仅含分隔符的输入视为空', () => {
    expect(validateIban('   - ').valid).toBe(false);
  });

  it('第 3-4 位不是数字时被拒', () => {
    // 长度与德国一致但校验位为字母
    const result = validateIban('DEAB370400440532013000');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/校验位/);
  });
});

describe('normalizeIban 规范化', () => {
  it('去除空格与连字符并转大写', () => {
    expect(normalizeIban('de89 3704-0044 0532-0130-00')).toBe('DE89370400440532013000');
  });

  it('已是规范形态时保持不变', () => {
    expect(normalizeIban('GB82WEST12345698765432')).toBe('GB82WEST12345698765432');
  });
});

describe('formatIbanGroups 分组', () => {
  it('每 4 位一组，组间空格连接', () => {
    expect(formatIbanGroups('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
  });

  it('空串返回空串', () => {
    expect(formatIbanGroups('')).toBe('');
  });
});

describe('国家长度表', () => {
  it('覆盖至少 60 个国家 / 地区', () => {
    expect(Object.keys(IBAN_LENGTHS).length).toBeGreaterThanOrEqual(60);
  });

  it('关键国家长度符合 ISO 13616', () => {
    expect(IBAN_LENGTHS.DE).toBe(22);
    expect(IBAN_LENGTHS.GB).toBe(22);
    expect(IBAN_LENGTHS.FR).toBe(27);
    expect(IBAN_LENGTHS.SA).toBe(24);
    expect(IBAN_LENGTHS.KW).toBe(30);
  });

  it('不收录中国大陆（CN 不在 IBAN 体系）', () => {
    expect(IBAN_LENGTHS.CN).toBeUndefined();
  });
});
