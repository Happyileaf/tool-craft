import { describe, expect, it } from 'vitest';
import {
  createEmptyForm,
  generateEpcPayload,
  parseEpcPayload,
  validateEpcForm,
  type EpcForm,
} from './epc';

/** EPC069-12 官方示例（比利时红十字会），IBAN BE72000000001616 通过 mod97 校验 */
const OFFICIAL_PAYLOAD = [
  'BCD',
  '001',
  '1',
  'SCT',
  'BPOTBEB1',
  'Red Cross',
  'BE72000000001616',
  'EUR12.34',
  'CHAR',
  'RF18539007547034',
  '',
  '',
].join('\r\n');

const buildForm = (overrides: Partial<EpcForm> = {}): EpcForm => ({
  ...createEmptyForm(),
  name: 'Red Cross',
  iban: 'BE72000000001616',
  ...overrides,
});

describe('generateEpcPayload 生成', () => {
  it('按 EPC069-12 输出固定 12 行 CRLF 负载，字段顺序正确', () => {
    const payload = generateEpcPayload(
      buildForm({
        bic: 'BPOTBEB1',
        amount: 12.34,
        purposeCode: 'CHAR',
        creditorReference: 'RF18539007547034',
      }),
    );
    expect(payload).toBe(OFFICIAL_PAYLOAD);
    expect(payload.split('\r\n')).toHaveLength(12);
  });

  it('可选字段留空时仍占行，金额为 0 时金额行留空', () => {
    const payload = generateEpcPayload(buildForm({ amount: 0 }));
    const lines = payload.split('\r\n');
    expect(lines).toHaveLength(12);
    expect(lines[4]).toBe(''); // BIC 可选
    expect(lines[7]).toBe(''); // 金额行
    expect(lines[8]).toBe('');
    expect(lines[9]).toBe('');
    expect(lines[10]).toBe('');
    expect(lines[11]).toBe('');
  });

  it('BIC 与用途代码自动转大写，IBAN 去除空白分隔符', () => {
    const payload = generateEpcPayload(
      buildForm({ bic: 'bpotbeb1', iban: 'be72 0000 0000 1616', purposeCode: 'char' }),
    );
    const lines = payload.split('\r\n');
    expect(lines[4]).toBe('BPOTBEB1');
    expect(lines[6]).toBe('BE72000000001616');
    expect(lines[8]).toBe('CHAR');
  });

  it('金额按两位小数格式化', () => {
    const lines = generateEpcPayload(buildForm({ amount: 99 })).split('\r\n');
    expect(lines[7]).toBe('EUR99.00');
  });

  it('表单校验失败时抛出带字段名的错误', () => {
    expect(() => generateEpcPayload(buildForm({ name: '  ' }))).toThrow('name');
    expect(() => generateEpcPayload(buildForm({ iban: 'INVALID' }))).toThrow('iban');
  });
});

describe('validateEpcForm 校验', () => {
  it('最小合法表单（仅名称与 IBAN）通过', () => {
    expect(validateEpcForm(buildForm()).valid).toBe(true);
  });

  it('名称必填，IBAN 必填且须通过 mod97', () => {
    expect(validateEpcForm(buildForm({ name: '' })).errors.name).toBeTruthy();
    expect(validateEpcForm(buildForm({ iban: '' })).errors.iban).toBeTruthy();
    expect(validateEpcForm(buildForm({ iban: 'BE72000000001617' })).errors.iban).toBeTruthy();
  });

  it('BIC 必须为 8 或 11 位字母数字', () => {
    expect(validateEpcForm(buildForm({ bic: 'ABC' })).errors.bic).toBeTruthy();
    expect(validateEpcForm(buildForm({ bic: 'BPOTBEB1' })).errors.bic).toBeUndefined();
    expect(validateEpcForm(buildForm({ bic: 'DEUTDEFF500' })).errors.bic).toBeUndefined();
  });

  it('用途代码必须为 4 位字母/数字', () => {
    expect(validateEpcForm(buildForm({ purposeCode: 'CH' })).errors.purposeCode).toBeTruthy();
    expect(validateEpcForm(buildForm({ purposeCode: 'CHAR' })).errors.purposeCode).toBeUndefined();
  });

  it('结构化引用与普通汇款说明互斥', () => {
    const result = validateEpcForm(
      buildForm({ creditorReference: 'RF18X', remittance: 'Invoice 1' }),
    );
    expect(result.errors.creditorReference).toBeTruthy();
    expect(result.errors.remittance).toBeTruthy();
  });

  it('字段长度超限报错', () => {
    expect(validateEpcForm(buildForm({ name: 'a'.repeat(71) })).errors.name).toBeTruthy();
    expect(validateEpcForm(buildForm({ note: 'a'.repeat(71) })).errors.note).toBeTruthy();
    expect(
      validateEpcForm(buildForm({ remittance: 'a'.repeat(36) })).errors.remittance,
    ).toBeTruthy();
    expect(validateEpcForm(buildForm({ amount: 10 ** 10 })).errors.amount).toBeTruthy();
  });
});

describe('parseEpcPayload 解析', () => {
  it('官方示例往返解析，字段索引与 EPC069-12 行序一致', () => {
    const parsed = parseEpcPayload(OFFICIAL_PAYLOAD);
    expect(parsed.bic).toBe('BPOTBEB1');
    expect(parsed.name).toBe('Red Cross');
    expect(parsed.iban).toBe('BE72000000001616');
    expect(parsed.amountText).toBe('EUR12.34');
    expect(parsed.purposeCode).toBe('CHAR');
    expect(parsed.creditorReference).toBe('RF18539007547034');
    expect(parsed.remittance).toBe('');
    expect(parsed.note).toBe('');
  });

  it('生成 → 解析往返一致', () => {
    const form = buildForm({
      bic: 'DEUTDEFF',
      amount: 1000.5,
      purposeCode: 'GDDS',
      remittance: 'Invoice 2026-001',
      note: 'Thank you',
    });
    const parsed = parseEpcPayload(generateEpcPayload(form));
    expect(parsed.bic).toBe('DEUTDEFF');
    expect(parsed.name).toBe('Red Cross');
    expect(parsed.iban).toBe('BE72000000001616');
    expect(parsed.amountText).toBe('EUR1000.50');
    expect(parsed.purposeCode).toBe('GDDS');
    expect(parsed.remittance).toBe('Invoice 2026-001');
    expect(parsed.note).toBe('Thank you');
  });

  it('容忍 LF 与 CR 换行', () => {
    const lf = OFFICIAL_PAYLOAD.replace(/\r\n/g, '\n');
    expect(parseEpcPayload(lf).amountText).toBe('EUR12.34');
    const cr = OFFICIAL_PAYLOAD.replace(/\r\n/g, '\r');
    expect(parseEpcPayload(cr).amountText).toBe('EUR12.34');
  });

  it('头部损坏时逐行抛错', () => {
    const bad = (line: number, value: string): string => {
      const lines = OFFICIAL_PAYLOAD.split('\r\n');
      lines[line] = value;
      return lines.join('\r\n');
    };
    expect(() => parseEpcPayload(bad(0, 'XXX'))).toThrow('BCD');
    expect(() => parseEpcPayload(bad(1, '003'))).toThrow('版本');
    expect(() => parseEpcPayload(bad(2, '9'))).toThrow('字符集');
    expect(() => parseEpcPayload(bad(3, 'XXX'))).toThrow('SCT');
  });

  it('行数不足与金额格式非法时抛错', () => {
    expect(() => parseEpcPayload('BCD\n001\n1\nSCT\n')).toThrow('行数不足');
    const lines = OFFICIAL_PAYLOAD.split('\r\n');
    lines[7] = '12.34';
    expect(() => parseEpcPayload(lines.join('\r\n'))).toThrow('金额行');
  });

  it('空金额行合法（解析为空字符串）', () => {
    const lines = OFFICIAL_PAYLOAD.split('\r\n');
    lines[7] = '';
    expect(parseEpcPayload(lines.join('\r\n')).amountText).toBe('');
  });
});
